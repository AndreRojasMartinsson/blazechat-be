import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ServersService } from './servers.service';
import { HttpStatusCode } from 'axios';
import { Server } from 'src/database/models/Server.entity';
import { AccessToken } from 'src/utils/request';
import { JwtUserPayload } from 'src/auth/schemas';
import { ServerMember } from 'src/database/models/ServerMember.entity';
import { Permission, ServerRole } from 'src/database/models/ServerRole.entity';
import { ServerInDTO, ServerRoleDTO } from './schemas';
import { Perms } from './permission.guard';
import { LoggerService } from 'src/logger/logger.service';

@Controller('servers')
export class ServersController {
  constructor(
    private readonly logger: LoggerService,
    private serversService: ServersService,
  ) {}

  log(message: string) {
    return this.logger.log(ServersController.name, message);
  }

  @Post()
  @HttpCode(HttpStatusCode.Created)
  async createServer(
    @AccessToken() payload: JwtUserPayload,
    @Body() serverInDTO: ServerInDTO,
  ) {
    this.log(`Create server '${serverInDTO.name}' (uid = ${payload.sub})`);

    return this.serversService.createServer(payload.sub, serverInDTO);
  }

  @Get()
  @HttpCode(HttpStatusCode.Ok)
  async getServers(@AccessToken() payload: JwtUserPayload): Promise<Server[]> {
    return this.serversService.getUserServers(payload.sub);
  }

  @Get('/:server_id/members')
  @HttpCode(HttpStatusCode.Ok)
  async getMembers(
    @Param('server_id') serverId: string,
  ): Promise<ServerMember[]> {
    return this.serversService.getServerMembers(serverId);
  }

  @Get('/:server_id/roles')
  @HttpCode(HttpStatusCode.Ok)
  async getRoles(@Param('server_id') serverId: string): Promise<ServerRole[]> {
    return this.serversService.getServerRoles(serverId);
  }

  @Post('/:server_id/role')
  @Perms(Permission.MANAGE_ROLES)
  @HttpCode(HttpStatusCode.Created)
  async createRole(
    @Param('server_id') serverId: string,
    @Body() roleIn: ServerRoleDTO,
  ) {
    this.log(
      `Create role '${roleIn.name}' with permission bits '${roleIn.permission}' (server_id = ${serverId})`,
    );

    return this.serversService.createRole(serverId, roleIn);
  }

  @Put('/:server_id/role/:role_id')
  @Perms(Permission.MANAGE_ROLES)
  @HttpCode(HttpStatusCode.NoContent)
  async updateRole(
    @Param('server_id') serverId: string,
    @Param('role_id') roleId: string,
    @Body() roleIn: ServerRoleDTO,
  ) {
    this.log(
      `Update role '${roleIn.name}' with permission bits '${roleIn.permission}' (server_id = ${serverId})`,
    );

    return this.serversService.updateRole(serverId, roleId, roleIn);
  }

  @Delete('/:server_id/role/:roleid')
  @HttpCode(HttpStatusCode.NoContent)
  @Perms()
  async deleteRole(
    @Param('server_id') serverId: string,
    @Param('roleid') roleId: string,
  ) {
    this.log(`Delete role '${roleId}' (server_id = ${serverId})`);

    return this.serversService.deleteRole(serverId, roleId);
  }
}
