import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Server } from 'src/database/models/Server.entity';
import { ServerRole } from 'src/database/models/ServerRole.entity';
import { Repository } from 'typeorm';
import { ServerInDTO, ServerRoleDTO } from './schemas';
import { User } from 'src/database/models/User.entity';

@Injectable()
export class ServersService {
  constructor(
    @InjectRepository(Server) private server: Repository<Server>,
    @InjectRepository(ServerRole)
    private serverRole: Repository<ServerRole>,
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
}
