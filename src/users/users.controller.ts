import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from 'src/database/models/User.entity';
import { UsersService } from './users.service';
import { AccessToken } from 'src/utils/request';
import { Roles } from './roles.guard';
import { SuspendUserDTO } from './schema';
import { AllowSuspended } from './suspension.guard';
import { JwtUserPayload } from 'src/schemas/Auth';
import { ServersService } from 'src/servers/servers.service';
import { ServerMember } from 'src/database/models/ServerMember.entity';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private serverService: ServersService,
    // TODO: Add supabase import so we can use their storage
    // @InjectMinio() private readonly minioClient: Client,
  ) {}

  @Get('/me')
  async getMe(@AccessToken() payload: JwtUserPayload): Promise<User | null> {
    const user = await this.usersService.findOne(payload.sub);

    return user;
  }

  @Get('/:id')
  async getUser(@Param('id') userId: string): Promise<User | null> {
    return this.usersService.findOne(userId);
  }

  @Delete('/me')
  async deleteMe(@AccessToken() payload: JwtUserPayload) {
    return this.usersService.deleteUser(payload.sub);
  }

  @Get('/me/servers')
  async getServers(@AccessToken() payload: JwtUserPayload) {
    return this.usersService.getServers(payload.sub);
  }

  @Get('/me/avatar')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'image/jpeg')
  async getAvatar(@AccessToken() payload: JwtUserPayload) {
    // const userId = payload.sub;
    // const obj = await this.minioClient.getObject(
    //   'blazechat-avatars',
    //   `avatar_${userId}.jpeg`,
    // );
    // return new StreamableFile(obj);
  }

  @Delete('/me/servers/:server_id')
  async leaveServer(
    @AccessToken() payload: JwtUserPayload,
    @Param('server_id') serverId: string,
  ) {
    return this.serverService.deleteUserFromServer(serverId, payload.sub);
  }

  @Get('/me/servers/:server_id/member')
  async getCurrentUserGuildMember(
    @AccessToken() payload: JwtUserPayload,
    @Param('server_id') serverId: string,
  ): Promise<ServerMember> {
    return this.serverService.getMemberFromUserId(serverId, payload.sub);
  }

  @Delete('/:id')
  @Roles('root', 'admin')
  async deleteUser(@Param('id') userId: string) {
    return this.usersService.deleteUser(userId);
  }

  @Post('/suspend/:id')
  @Roles('root', 'admin')
  @AllowSuspended()
  async suspendUser(
    @AccessToken() payload: JwtUserPayload,
    @Param('id') userId: string,
    @Body() body: SuspendUserDTO,
  ) {
    const staff = await this.usersService.findOne(payload.sub);
    if (!staff) throw new UnauthorizedException();

    return this.usersService.suspendUser(staff, userId, body.durationInSec);
  }
}
