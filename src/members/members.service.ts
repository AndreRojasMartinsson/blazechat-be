import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MemberRole } from 'src/database/models/MemberRole.entity';
import { Server } from 'src/database/models/Server.entity';
import { ServerMember } from 'src/database/models/ServerMember.entity';
import { Permission, ServerRole } from 'src/database/models/ServerRole.entity';
import { User } from 'src/database/models/User.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(MemberRole)
    private roleRepository: Repository<MemberRole>,

    @InjectRepository(ServerMember)
    private memberRepository: Repository<ServerMember>,
  ) {}

  /**
   * Returns the member roles that a member has
   *
   * @throws
   * @param memberId - Id of member to get the roles of
   * @returns {Promise<MemberRole[]>} - The specified member's roles
   */
  async getRoles(memberId: string): Promise<MemberRole[]> {
    return this.roleRepository.find({
      where: {
        member: { id: memberId },
      },
      relations: { role: true },
    });
  }

  /**
   * Gets a server member by their id
   *
   * @throws
   * @param memberId - Id of the member
   * @returns {Promise<ServerMember>}
   */
  async getFromId(memberId: string): Promise<ServerMember> {
    return this.memberRepository.findOneBy({ id: memberId }).then((member) => {
      if (member === null) throw new NotFoundException('Member not found');

      return member;
    });
  }

  /**
   * Gets a server member within a given server by their
   * user id.
   *
   * @param serverId - Id of server to look in
   * @param userId - Id of user to use
   * @returns {Promise<ServerMember>}
   */
  async getFromUserId(serverId: string, userId: string): Promise<ServerMember> {
    return this.memberRepository
      .findOneBy({
        server: { id: serverId },
        user: { id: userId },
      })
      .then((member) => {
        if (member === null) throw new NotFoundException('Member not found');

        return member;
      });
  }

  /**
   * @param memberId - Id of member to get permissions from
   * @returns Total computed permission bits of member
   */
  async getMemberPermissions(memberId: string): Promise<number> {
    const data = await this.roleRepository.find({
      select: {
        role: { permissions: true },
      },
      where: {
        member: { id: memberId },
      },
      relations: {
        role: true,
      },
    });

    return data.reduce((acc, row) => acc | row.role.permissions, 0);
  }

  /**
   * Checks if a member has a given permission bit set
   *
   * @param memberId - Id of member to get permissions of
   * @param permission - Permission bit to check against
   * @returns if member has permission bit set
   */
  async doesMemberHavePermission(
    memberId: string,
    permission: Permission,
  ): Promise<boolean> {
    const memberPerms = await this.getMemberPermissions(memberId);

    return (memberPerms & permission) === permission;
  }

  /**
   * Assigns the member a server role
   *
   * @throws
   * @param memberId - Id of member to assign role to
   * @param role - Id of the ServerRole to assign to member
   * @returns {Promise<MemberRole>} Newly assigned member role
   */
  async assignRole(memberId: string, role: ServerRole): Promise<MemberRole> {
    const member = await this.getFromId(memberId);

    const row = new MemberRole({
      role,
      member,
    });

    return this.roleRepository.save(row);
  }

  /**
   * Unassigns the member's server role.
   *
   * @throws
   * @param memberId - Id of member to unassign role from
   * @param roleId - Id of the MemberRole to unassign
   */
  async unassignRole(memberId: string, roleId: string) {
    await this.roleRepository.delete({ id: roleId, member: { id: memberId } });
  }

  /**
   * Updates a server member by the given patch.
   *
   * @throws
   * @param memberId - Id of member to update
   * @param patch - ServerMember class containing new values to patch
   */
  async update(memberId: string, patch: ServerMember) {
    await this.memberRepository.update(
      {
        id: memberId,
      },
      patch,
    );
  }

  /**
   * Deletes the server member by their id
   *
   * @throws
   * @param memberId - Id of member to delete
   */
  async delete(memberId: string) {
    await this.memberRepository.delete({ id: memberId });
  }

  /**
   * Creates a new server member in the given server
   * for the specified user.
   *
   * @throws
   * @param server - Server to create member in
   * @param user - User of the member
   * @param nickname - Optional nickname of the member
   * @returns {Promise<ServerMember>} Created row
   */
  async create(
    server: Server,
    user: User,
    nickname?: string,
  ): Promise<ServerMember> {
    const row = new ServerMember({
      server,
      user,
      nickname,
    });

    return this.memberRepository.save(row);
  }
}
