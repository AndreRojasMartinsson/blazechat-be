import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from './users.service';
import { JwtUserPayloadSchema } from 'src/auth/schemas';
import z from 'zod';

const JwtPayloadRequest = z.object({ user: JwtUserPayloadSchema });

@Injectable()
export class SuspensionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAllowedSuspended = this.reflector.getAllAndOverride<boolean>(
      ALLOW_SUSPENDED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isAllowedSuspended) return true;

    const request = context.switchToHttp().getRequest();

    const {
      user: { sub: userId },
    } = JwtPayloadRequest.parse(request);

    const user = await this.usersService.findOne(userId);

    if (!user) throw new UnauthorizedException();
    if (user.suspensions.length === 0) return true;

    return user.suspensions.some(
      (suspension) => suspension.expire_at <= new Date(Date.now()),
    );
  }
}

export const ALLOW_SUSPENDED_KEY = 'allow_suspended';
export const AllowSuspended = () => SetMetadata(ALLOW_SUSPENDED_KEY, true);
