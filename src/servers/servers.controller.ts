import {
  Body,
  Controller,
  Delete,
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
import { JwtUserPayload } from 'src/auth/schemas';
import { ServerMember } from 'src/database/models/ServerMember.entity';
import { Permission, ServerRole } from 'src/database/models/ServerRole.entity';
import { ServerInDTO, ServerRoleDTO } from './schemas';
import { Perms } from './permission.guard';
import { LoggerService } from 'src/logger/logger.service';
import { UsersService } from 'src/users/users.service';
import { Server } from 'src/database/models/Server.entity';

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
    @Body() dto: ServerInDTO,
  ) {
    this.log(`Create server '${dto.name}' (uid = ${payload.sub})`);

    const owner = await this.userService.findOne(payload.sub);
    if (!owner) throw new NotFoundException('Owner not found');

    return this.serverService.createServer(owner, dto);
  }

  @Get('/:server_id/members')
  @HttpCode(HttpStatusCode.Ok)
  async getMembers(
    @Param('server_id') serverId: string,
  ): Promise<ServerMember[]> {
    return this.serverService.getServerMembers(serverId);
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
