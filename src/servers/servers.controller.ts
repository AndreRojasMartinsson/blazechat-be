import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ServersService } from './servers.service';
import { HttpStatusCode } from 'axios';
import { AccessToken } from 'src/utils/request';
import { JwtUserPayload } from 'src/schemas/Auth';
import { ServerMember } from 'src/database/models/ServerMember.entity';
import { LoggerService } from 'src/logger/logger.service';
import { UsersService } from 'src/users/users.service';
import { Server } from 'src/database/models/Server.entity';
import { Permission, ServerRole } from 'src/database/models/ServerRole.entity';
import { ServerInDto, ServerUpdateDto } from 'src/schemas/Server';
import { Perms } from './permission.guard';

@Controller('servers')
export class ServersController {
  constructor(
    private readonly logger: LoggerService,
    private serverService: ServersService,
    private userService: UsersService,
  ) {}

  log(message: string) {
    return this.logger.log(ServersController.name, message);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  async getServer(@Param('id') serverId: string): Promise<Server> {
    return this.serverService.getServerById(serverId);
  }

  @Post()
  @HttpCode(HttpStatusCode.Created)
  async createServer(
    @AccessToken() payload: JwtUserPayload,
    @Body() body: ServerInDto,
  ) {
    this.log(`Create server '${body.name}' (uid = ${payload.sub})`);

    const owner = await this.userService.findOne(payload.sub);
    if (!owner) throw new NotFoundException('Owner not found');

    return this.serverService.createServer(owner, body);
  }

  @Put('/:id')
  @HttpCode(HttpStatusCode.NoContent)
  @Perms(Permission.MANAGE_SERVER)
  async updateServer(
    @AccessToken() payload: JwtUserPayload,
    @Param('id') serverId: string,
    @Body() body: ServerUpdateDto,
  ) {
    this.log(
      `Update server '${serverId}' with new name = '${body.name}' (uid = ${payload.sub})`,
    );

    return this.serverService.updateServer(serverId, body);
  }

  @Delete('/:id')
  @HttpCode(HttpStatusCode.NoContent)
  @Perms(Permission.MANAGE_SERVER)
  async deleteServer(
    @AccessToken() payload: JwtUserPayload,
    @Param('id') serverId: string,
  ) {
    const member = await this.serverService.getMemberFromUserId(
      serverId,
      payload.sub,
    );

    if (member.server.owner.id !== payload.sub) {
      throw new ForbiddenException();
    }

    this.log(`Delete server '${serverId}' (uid = ${payload.sub})`);

    return this.serverService.deleteServer(serverId);
  }

  @Get('/:server_id/members')
  @HttpCode(HttpStatusCode.Ok)
  async getMembers(
    @Param('server_id') serverId: string,
  ): Promise<ServerMember[]> {
    return this.serverService.getServerMembers(serverId);
  }

  @Get('/:server_id/members/:member_id')
  @HttpCode(HttpStatusCode.Ok)
  async getMember(
    @Param('server_id') serverId: string,
    @Param('member_id') memberId: string,
  ): Promise<ServerMember> {
    return this.serverService.getMember(serverId, memberId);
  }

  @Get('/:server_id/members/search/:member_name')
  @HttpCode(HttpStatusCode.Ok)
  async searchMember(
    @Param('server_id') serverId: string,
    @Param('member_name') memberName: string,
  ) {
    return this.serverService.searchMembersByName(serverId, memberName);
  }

  @Get('/:server_id/roles')
  @HttpCode(HttpStatusCode.Ok)
  async getRoles(@Param('server_id') serverId: string): Promise<ServerRole[]> {
    return this.serverService.getServerRoles(serverId);
  }

  @Get('/:server_id/roles/:role_id')
  @HttpCode(HttpStatusCode.Ok)
  async getRole(
    @Param('server_id') serverId: string,
    @Param('role_id') roleId: string,
  ) {
    return this.serverService.getServerRoleById(serverId, roleId);
  }

  @Get('/:server_id/roles/search/:role_name')
  @HttpCode(HttpStatusCode.Ok)
  async searchRole(
    @Param('server_id') serverId: string,
    @Param('role_name') roleName: string,
  ) {
    return this.serverService.searchRolesByName(serverId, roleName);
  }

  // @Get('/:server_id/roles')
  // @HttpCode(HttpStatusCode.Ok)
  // async getRoles(@Param('server_id') serverId: string): Promise<ServerRole[]> {
  //   return this.serverService.getServerRoles(serverId);
  // }

  // @Post('/:server_id/role')
  // @Perms(Permission.MANAGE_ROLES)
  // @HttpCode(HttpStatusCode.Created)
  // async createRole(
  //   @Param('server_id') serverId: string,
  //   @Body() roleIn: ServerRoleDTO,
  // ) {
  //   this.log(
  //     `Create role '${roleIn.name}' with permission bits '${roleIn.permissions}' (server_id = ${serverId})`,
  //   );
  //
  //   const server = await this.serverService.getServerById(serverId);
  //
  //   return this.serverService.createServerRole(server, roleIn);
  // }
  //
  // @Put('/:server_id/role/:role_id')
  // @Perms(Permission.MANAGE_ROLES)
  // @HttpCode(HttpStatusCode.NoContent)
  // async updateRole(
  //   @Param('server_id') serverId: string,
  //   @Param('role_id') roleId: string,
  //   @Body() roleIn: ServerRoleDTO,
  // ) {
  //   this.log(
  //     `Update role '${roleIn.name}' with permission bits '${roleIn.permission}' (server_id = ${serverId})`,
  //   );
  //
  //   return this.serversService.updateRole(serverId, roleId, roleIn);
  // }
  //
  // @Delete('/:server_id/role/:roleid')
  // @HttpCode(HttpStatusCode.NoContent)
  // @Perms()
  // async deleteRole(
  //   @Param('server_id') serverId: string,
  //   @Param('roleid') roleId: string,
  // ) {
  //   this.log(`Delete role '${roleId}' (server_id = ${serverId})`);
  //
  //   return this.serversService.deleteRole(serverId, roleId);
  // }
}
