import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PendingDeletion } from 'src/database/models/PendingDeletion.entity';
import { Server } from 'src/database/models/Server.entity';
import { Suspension } from 'src/database/models/Suspension.entity';
import { User } from 'src/database/models/User.entity';
import { SignUpDto } from 'src/schemas/Auth';
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
  ) {}

  async getServers(userId: string): Promise<Server[]> {
    return this.serverRepo.find({
      where: { members: { user: { id: userId } } },
    });
  }

  async getAll(): Promise<User[]> {
    return this.users.find();
  }

  async findOneByEmailToken(emailToken: string): Promise<User | null> {
    return this.users.findOneBy({ email_verification_token: emailToken });
  }

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

  async doesAccountExist(email: string, username: string): Promise<boolean> {
    const handles = [
      this.users.existsBy({ email }),
      this.users.existsBy({ username }),
    ];

    const results = await Promise.all(handles);
    return results.some(Boolean);
  }

  async createUser(
    dto: SignUpDto,
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

  async findOne(id: string): Promise<User | null> {
    return this.users.findOne({
      where: { id },
      relations: { suspensions: true },
    });
  }

  async isSuspended(id: string): Promise<boolean> {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException();

    return user.suspensions.some((suspension) => suspension.created_at);
  }

  async findByName(username: string): Promise<User | null> {
    return this.users.findOneBy({ username });
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.findOne(userId);
    if (user === null) throw new NotFoundException();

    const row = new PendingDeletion({
      user,
    });

    await this.pendingDeletion.insert(row);
  }

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
