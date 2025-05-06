import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Server } from 'src/database/models/Server.entity';
import { ServerMember } from 'src/database/models/ServerMember.entity';
import { Permission, ServerRole } from 'src/database/models/ServerRole.entity';
import { Repository } from 'typeorm';
import { ServerInDTO, ServerRoleDTO } from './schemas';
import { MemberRole } from 'src/database/models/MemberRole.entity';
import { UsersService } from 'src/users/users.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateThreadPayload } from 'src/threads/payloads';

@Injectable()
export class ServersService {
  constructor(
    private eventEmitter: EventEmitter2,
    private userService: UsersService,
    @InjectRepository(Server) private server: Repository<Server>,
    @InjectRepository(ServerMember)
    private serverMember: Repository<ServerMember>,
    @InjectRepository(ServerRole)
    private serverRole: Repository<ServerRole>,
    @InjectRepository(MemberRole)
    private memberRole: Repository<MemberRole>,
  ) {}

  async createServer(userId: string, dto: ServerInDTO) {
    const owner = await this.userService.findOne(userId);
    if (!owner) throw new UnauthorizedException();

    const row = new Server({
      name: dto.name,
      owner,
    });

    const { identifiers } = await this.server.insert(row);
    const serverId = identifiers[0].id;

    await this.eventEmitter.emitAsync(
      'channels.create',
      new CreateThreadPayload({
        name: 'global',
        server_id: serverId,
      }),
    );
  }

  async getUserServers(userId: string): Promise<Server[]> {
    return this.server.find({
      select: {
        id: true,
        name: true,
        created_at: true,
        owner: true,
      },
      where: {
        members: {
          user: {
            id: userId,
          },
        },
      },
    });
  }

  async getServerMembers(serverId: string): Promise<ServerMember[]> {
    return this.serverMember.find({
      where: {
        server: { id: serverId },
      },
    });
  }

  async getServerRoles(serverId: string): Promise<ServerRole[]> {
    return this.serverRole.find({
      where: {
        server: { id: serverId },
      },
    });
  }

  async createRole(serverId: string, roleIn: ServerRoleDTO) {
    const server = await this.server.findOneBy({ id: serverId });
    if (!server) throw new NotFoundException();

    const row = new ServerRole({
      server,
      permissions: roleIn.permission,
      color: roleIn.color,
      name: roleIn.name,
    });

    await this.serverRole.insert(row);
  }

  async isOwner(serverId: string, userId: string): Promise<boolean> {
    const server = await this.server.findOne({
      where: { id: serverId },
      relations: { owner: true },
    });
    if (!server) throw new NotFoundException();

    return server.owner.id === userId;
  }

  async updateRole(serverId: string, roleId: string, roleIn: ServerRoleDTO) {
    await this.serverRole.update(
      {
        id: roleId,
        server: { id: serverId },
      },
      new ServerRole({
        name: roleIn.name,
        permissions: roleIn.permission,
        color: roleIn.color,
      }),
    );
  }

  async deleteRole(serverId: string, roleId: string) {
    return this.serverRole.delete({ id: roleId, server: { id: serverId } });
  }

  async getMemberRoles(
    serverId: string,
    memberId: string,
  ): Promise<MemberRole[]> {
    return this.memberRole.find({
      where: {
        member: { id: memberId, server: { id: serverId } },
      },
    });
  }

  /* Gets the computed member permission bits */
  async getMemberPermissions(serverId: string, memberId: string) {
    const data = await this.memberRole.find({
      where: {
        member: { id: memberId, server: { id: serverId } },
      },
      relations: {
        role: true,
      },
    });

    return data.reduce((acc, row) => acc | row.role.permissions, 0);
  }

  async getMemberIdFromUserId(
    serverId: string,
    userId: string,
  ): Promise<string | undefined> {
    const member = await this.serverMember.findOne({
      where: {
        user: { id: userId },
        server: { id: serverId },
      },
    });

    return member?.id;
  }

  async doesMemberHavePermissionTo(
    serverId: string,
    memberId: string,
    permission: Permission,
  ) {
    const memberPerms = await this.getMemberPermissions(serverId, memberId);

    return (memberPerms & permission) === permission;
  }
}
