import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SignUpDTO } from 'src/auth/schemas';
import {
  Friendship,
  FriendshipStatus,
} from 'src/database/models/Friendship.entity';
import { PendingDeletion } from 'src/database/models/PendingDeletion.entity';
import { Server } from 'src/database/models/Server.entity';
import { Suspension } from 'src/database/models/Suspension.entity';
import { User } from 'src/database/models/User.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Server) private serverRepo: Repository<Server>,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(PendingDeletion)
    private pendingDeletion: Repository<PendingDeletion>,
    @InjectRepository(Suspension)
    private suspension: Repository<Suspension>,
    @InjectRepository(Friendship)
    private friendshipRepo: Repository<Friendship>,
  ) {}

  /**
   * Fetch all servers that a user is a member of.
   *
   * @param userId - The ID of the user.
   * @returns A promise resolving to an array of Server entities.
   */
  async getServers(userId: string): Promise<Server[]> {
    return this.serverRepo.find({
      where: { members: { user: { id: userId } } },
    });
  }

  /**
   * Determine whether a user can send a friend request to another user.
   *
   * @param userId - The ID of the requesting user.
   * @param otherUserId - The ID of the potential friend.
   * @returns A promise resolving to `true` if no existing friendship or request exists, otherwise `false`.
   */
  async canUserSendFriendRequest(
    userId: string,
    otherUserId: string,
  ): Promise<boolean> {
    const anyFriendship = await this.friendshipRepo.exists({
      where: [
        {
          requester_id: userId,
          recipient_id: otherUserId,
        },
        {
          recipient_id: userId,
          requester_id: otherUserId,
        },
      ],
    });

    return !anyFriendship;
  }

  /**
   * Get incoming (pending) friend requests for a user.
   *
   * @param userId - The ID of the user receiving requests.
   * @returns A promise resolving to an array of pending Friendship entities.
   */
  async getIncomingFriendRequests(userId: string): Promise<Friendship[]> {
    return this.friendshipRepo.find({
      where: {
        recipient_id: userId,
        status: FriendshipStatus.PENDING,
      },
      relations: {
        requester: true,
      },
    });
  }

  /**
   * Get outgoing (pending) friend requests sent by a user.
   *
   * @param userId - The ID of the user who sent requests.
   * @returns A promise resolving to an array of pending Friendship entities.
   */
  async getOutgoingFriendRequests(userId: string): Promise<Friendship[]> {
    return this.friendshipRepo.find({
      where: {
        requester_id: userId,
        status: FriendshipStatus.PENDING,
      },
      relations: {
        recipient: true,
      },
    });
  }

  /**
   * Retrieve all users that have been blocked by the given user.
   *
   * @param userId - The ID of the user.
   * @returns A promise resolving to an array of blocked Friendship entities (selecting user IDs and usernames).
   */
  async getBlockedUsers(userId: string): Promise<Friendship[]> {
    return this.friendshipRepo.find({
      select: {
        recipient: { id: true, username: true },
        requester: { id: true, username: true },
        requester_id: true,
        recipient_id: true,
      },
      where: { requester_id: userId, status: FriendshipStatus.BLOCKED },
      relations: {
        recipient: true,
        requester: true,
      },
    });
  }

  /**
   * Decline a pending friend request.
   *
   * @param userId - The ID of the user declining the request.
   * @param otherUserId - The ID of the user who sent the request.
   * @throws NotFoundException if no such friendship exists.
   * @throws ForbiddenException if the friendship is already blocked.
   */
  async declineFriendRequest(userId: string, otherUserId: string) {
    const existingRow = await this.friendshipRepo.findOne({
      where: [
        {
          recipient_id: userId,
          requester_id: otherUserId,
        },
        {
          requester_id: userId,
          recipient_id: otherUserId,
        },
      ],
    });

    if (!existingRow) throw new NotFoundException();

    if (existingRow.status === FriendshipStatus.BLOCKED)
      throw new ForbiddenException();

    await this.friendshipRepo.delete({
      recipient_id: userId,
      requester_id: otherUserId,
      status: FriendshipStatus.PENDING,
    });
  }

  /**
   * Accept a pending friend request.
   *
   * @param userId - The ID of the user accepting the request.
   * @param otherUserId - The ID of the user who sent the request.
   * @throws NotFoundException if no such friendship exists.
   * @throws ForbiddenException if the friendship is already blocked.
   */
  async acceptFriendRequest(userId: string, otherUserId: string) {
    const existingRow = await this.friendshipRepo.findOne({
      where: [
        {
          recipient_id: userId,
          requester_id: otherUserId,
        },
        {
          requester_id: userId,
          recipient_id: otherUserId,
        },
      ],
    });

    if (!existingRow) throw new NotFoundException();

    if (existingRow.status === FriendshipStatus.BLOCKED)
      throw new ForbiddenException();

    await this.friendshipRepo.update(
      {
        recipient_id: userId,
        requester_id: otherUserId,
        status: FriendshipStatus.PENDING,
      },
      {
        status: FriendshipStatus.ACCEPTED,
      },
    );
  }

  /**
   * Create a friend request from one user to another.
   *
   * @param userId - The ID of the user sending the request.
   * @param recipientId - The ID of the user to receive the request.
   * @returns A promise resolving to the created Friendship entity.
   * @throws BadRequestException if attempting to friend oneself.
   * @throws ConflictException if an existing friendship or request already exists.
   */
  async createFriendRequest(
    userId: string,
    recipientId: string,
  ): Promise<Friendship> {
    if (userId === recipientId)
      throw new BadRequestException('Cannot send request to yourself');

    const canSendRequest = await this.canUserSendFriendRequest(
      userId,
      recipientId,
    );

    if (canSendRequest) throw new ConflictException();

    const row = new Friendship({
      requester_id: userId,
      recipient_id: recipientId,
      status: FriendshipStatus.PENDING,
    });

    return this.friendshipRepo.save(row);
  }

  /**
   * Block a user.
   *
   * @param userId - The ID of the user performing the block.
   * @param recipientId - The ID of the user to block.
   * @returns A promise resolving to the created blocked Friendship entity.
   * @throws BadRequestException if attempting to block oneself.
   * @throws ConflictException if the user is already blocked.
   */
  async blockUser(userId: string, recipientId: string) {
    if (userId === recipientId)
      throw new BadRequestException('Cannot block yourself');

    await this.friendshipRepo.upsert(
      {
        recipient_id: recipientId,
        requester_id: userId,
        status: FriendshipStatus.BLOCKED,
      },
      {
        skipUpdateIfNoValuesChanged: true,
        conflictPaths: { recipient_id: true, requester_id: true },
      },
    );
  }

  /**
   * Retrieve all accepted friends for a user.
   *
   * @param userId - The ID of the user.
   * @returns A promise resolving to an array of accepted Friendship entities (selecting user IDs and usernames).
   */
  async getFriends(userId: string): Promise<Friendship[]> {
    return this.friendshipRepo.find({
      select: {
        recipient: { id: true, username: true },
        requester: { id: true, username: true },
        requester_id: true,
        recipient_id: true,
      },
      where: [
        { recipient_id: userId, status: FriendshipStatus.ACCEPTED },
        { requester_id: userId, status: FriendshipStatus.ACCEPTED },
      ],
      relations: {
        recipient: true,
        requester: true,
      },
    });
  }

  /**
   * Fetch all users in the system.
   *
   * @returns A promise resolving to an array of all User entities.
   */
  async getAll(): Promise<User[]> {
    return this.users.find();
  }

  /**
   * Find a single user by their email verification token.
   *
   * @param emailToken - The email verification token.
   * @returns A promise resolving to the User entity or null if not found.
   */
  async findOneByEmailToken(emailToken: string): Promise<User | null> {
    return this.users.findOneBy({ email_verification_token: emailToken });
  }

  /**
   * Confirm a user's email address.
   *
   * @param user - The User entity to confirm.
   * @throws ForbiddenException if the email is already confirmed.
   */
  async confirmEmail(user: User) {
    if (user.email_confirmed) throw new ForbiddenException();

    await this.users.update(
      {
        id: user.id,
        email_verification_token: user.email_verification_token,
        email_confirmed: false,
      },
      {
        email_confirmed: true,
      },
    );
  }

  /**
   * Check if an account with the given email or username already exists.
   *
   * @param email - The email to check.
   * @param username - The username to check.
   * @returns A promise resolving to `true` if either exists, otherwise `false`.
   */
  async doesAccountExist(email: string, username: string): Promise<boolean> {
    const handles = [
      this.users.existsBy({ email }),
      this.users.existsBy({ username }),
    ];

    const results = await Promise.all(handles);
    return results.some(Boolean);
  }

  /**
   * Create a new user record.
   *
   * @param dto - The SignUpDTO containing username and email.
   * @param hashedPassword - The hashed password to store.
   * @param emailToken - The token for email verification.
   * @returns A promise resolving to the created User entity.
   */
  async createUser(
    dto: SignUpDTO,
    hashedPassword: string,
    emailToken: string,
  ): Promise<User> {
    const row = new User({
      username: dto.username,
      email: dto.email,
      email_verification_token: emailToken,
      email_confirmed: false,
      hashed_password: hashedPassword,
    });

    return this.users.save(row);
  }

  /**
   * Find a single user by ID, including any suspensions.
   *
   * @param id - The ID of the user.
   * @returns A promise resolving to the User entity or null if not found.
   */
  async findOne(id: string): Promise<User | null> {
    return this.users.findOne({
      where: { id },
      relations: { suspensions: true },
    });
  }

  /**
   * Check if a user is currently suspended.
   *
   * @param id - The ID of the user.
   * @returns A promise resolving to `true` if suspended, otherwise `false`.
   * @throws NotFoundException if the user does not exist.
   */
  async isSuspended(id: string): Promise<boolean> {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException();

    return user.suspensions.some((suspension) => suspension.created_at);
  }

  /**
   * Find a single user by username.
   *
   * @param username - The username to search for.
   * @returns A promise resolving to the User entity or null if not found.
   */
  async findByName(username: string): Promise<User | null> {
    return this.users.findOneBy({ username });
  }

  /**
   * Schedule a user for pending deletion.
   *
   * @param userId - The ID of the user to delete.
   * @throws NotFoundException if the user does not exist.
   */
  async deleteUser(userId: string): Promise<void> {
    const user = await this.findOne(userId);
    if (user === null) throw new NotFoundException();

    const row = new PendingDeletion({
      user,
    });

    await this.pendingDeletion.insert(row);
  }

  /**
   * Suspend a user for a specified duration.
   *
   * @param staff - The staff User entity issuing the suspension.
   * @param userId - The ID of the user to suspend.
   * @param durationInSec - Suspension duration in seconds.
   * @throws NotFoundException if the user does not exist.
   */
  async suspendUser(
    staff: User,
    userId: string,
    durationInSec: number,
  ): Promise<void> {
    const user = await this.findOne(userId);
    if (user === null) throw new NotFoundException();

    const row = new Suspension({
      user,
      staff,
      expire_at: new Date(Date.now() + durationInSec * 1000),
    });

    await this.suspension.insert(row);
  }
}
