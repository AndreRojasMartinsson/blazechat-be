import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { User, UserRole } from 'src/database/models/User.entity';
import { UsersService } from './users.service';
import { AccessToken } from 'src/utils/request';
import { Roles } from './roles.guard';
import { SuspendUserDTO } from './schema';
import { AllowSuspended } from './suspension.guard';
import { JwtUserPayload } from 'src/auth/schemas';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('/me')
  async getMe(@AccessToken() payload: JwtUserPayload): Promise<User | null> {
    const user = await this.usersService.findOne(payload.sub);

    return user;
  }

  @Delete('/me')
  async deleteMe(@AccessToken() payload: JwtUserPayload) {
    return this.usersService.deleteUser(payload.sub);
  }

  @Get('/me/servers')
  async getServers(@AccessToken() payload: JwtUserPayload) {
    return this.usersService.getServers(payload.sub);
  }

  @Delete('/:id')
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  async deleteUser(@Param('id') userId: string) {
    return this.usersService.deleteUser(userId);
  }

  @Post('/suspend/:id')
  @Roles(UserRole.ROOT, UserRole.ADMIN)
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
