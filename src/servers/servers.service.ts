import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Server } from 'src/database/models/Server.entity';
import { Permission, ServerRole } from 'src/database/models/ServerRole.entity';
import { And, Brackets, Repository } from 'typeorm';
import { ServerInDTO, ServerRoleDTO } from './schemas';
import { User } from 'src/database/models/User.entity';
import { ServerMember } from 'src/database/models/ServerMember.entity';
import { MemberRole } from 'src/database/models/MemberRole.entity';

@Injectable()
export class ServersService {
  constructor(
    @InjectRepository(Server) private server: Repository<Server>,
    @InjectRepository(ServerRole)
    private serverRole: Repository<ServerRole>,
    @InjectRepository(MemberRole)
    private roleRepository: Repository<MemberRole>,
    @InjectRepository(ServerMember)
    private memberRepository: Repository<ServerMember>,
  ) {}

  /**
   * Creates a server with the specified data and owner,
   * and returns it.
   *
   * @param owner - User class pointing to owner of server
   * @param dto
   * @returns created server row
   */
  async createServer(owner: User, dto: ServerInDTO): Promise<Server> {
    const row = new Server({
      name: dto.name,
      owner,
    });

    return this.server.save(row);
  }

  /**
   * Gets a role in a server by its id
   *
   * @param serverId
   * @param roleId
   * @returns role with given `roleId`
   */
  async getServerRoleById(
    serverId: string,
    roleId: string,
  ): Promise<ServerRole> {
    return this.serverRole
      .findOneBy({ server: { id: serverId }, id: roleId })
      .then((role) => {
        if (role === null) throw new NotFoundException('Role not found');
        return role;
      });
  }

  /**
   * Searchs roles in a server by its name
   *
   * @param serverId
   * @param roleName
   * @returns roles matching name
   */
  async searchRolesByName(serverId: string, roleName: string) {
    return this.serverRole
      .createQueryBuilder('role')
      .innerJoin('role.server', 'server')
      .where('server.id = :serverId', { serverId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('role.normalized_name = :normalized')
            .orWhere('role.normalized_name ILIKE :ilike')
            .orWhere('similarity(role.normalized_name, :normalized) > 0.3');
        }),
      )
      .orderBy(
        `
        CASE
          WHEN role.normalized_name = :normalized THEN 1
          WHEN role.normalized_name ILIKE :ilike THEN 2
          ELSE 3
        END
        `,
        'ASC',
      )
      .setParameters({
        normalized: roleName.toLowerCase(),
        ilike: `%${roleName.toLowerCase()}%`,
      })
      .getMany();
  }

  /**
   * Gets a server by it's id and returns it
   *
   * @param serverId
   * @returns server with given `serverId`
   */
  async getServerById(serverId: string): Promise<Server> {
    return this.server.findOneBy({ id: serverId }).then((server) => {
      if (server === null) throw new NotFoundException('Server not found');
      return server;
    });
  }

  /**
   * Gets the members within the specified server
   *
   * @param serverId - Id of server to get members from
   * @returns Server members in the specified server
   */
  async getServerMembers(serverId: string): Promise<ServerMember[]> {
    return this.memberRepository.find({
      where: {
        server: { id: serverId },
      },
      relations: {
        roles: true,
      },
    });
  }

  /**
   * Gets the roles within the specified server
   *
   * @param serverId - Id of server to get roles from
   * @returns Roles in the specified server
   */
  async getServerRoles(serverId: string): Promise<ServerRole[]> {
    return this.serverRole.find({
      where: {
        server: { id: serverId },
      },
    });
  }

  /**
   * Creates a new server role within the specified server
   *
   * @param server - Server class pointing to server to create role in
   * @param roleIn - DTO class with role data
   * @returns created server role row
   */
  async createServerRole(
    server: Server,
    roleIn: ServerRoleDTO,
  ): Promise<ServerRole> {
    const row = new ServerRole({
      server,
      ...roleIn,
    });

    return this.serverRole.save(row);
  }

  /**
   * Updates a given server role
   *
   * @param roleId - Id of role to update
   * @param roleIn - Object to patch role with
   */
  async updateServerRole(roleId: string, roleIn: ServerRoleDTO) {
    await this.serverRole.update(
      {
        id: roleId,
      },
      new ServerRole(roleIn),
    );
  }

  /**
   * Deletes a role
   *
   * @param roleId - Id of role to delete
   */
  async deleteServerRole(roleId: string) {
    await this.serverRole.delete({ id: roleId });
  }

  /**
   * Returns the member from given member id.
   *
   * @throws
   * @param serverId - Id of server member is in
   * @param memberId - Id of member to get
   * @returns {Promise<ServerMember>} - The specified member
   */
  async getMember(serverId: string, memberId: string): Promise<ServerMember> {
    return this.memberRepository
      .findOne({
        where: {
          id: memberId,
          server: {
            id: serverId,
          },
        },
        relations: { roles: true, user: true },
      })
      .then((member) => {
        if (!member) throw new NotFoundException('Member not found');
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
  async getMemberFromUserId(
    serverId: string,
    userId: string,
  ): Promise<ServerMember> {
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
   * @param serverId - Id of server to operate in
   * @param memberId - Id of member to assign role to
   * @param role - Id of the ServerRole to assign to member
   * @returns {Promise<MemberRole>} Newly assigned member role
   */
  async assignRole(
    serverId: string,
    memberId: string,
    role: ServerRole,
  ): Promise<MemberRole> {
    const member = await this.getMember(serverId, memberId);

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
  async updateMember(memberId: string, patch: ServerMember) {
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
  async deleteUserFromServer(serverId: string, userId: string) {
    await this.memberRepository.delete({
      server: { id: serverId },
      user: { id: userId },
    });
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
  async createMember(
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
