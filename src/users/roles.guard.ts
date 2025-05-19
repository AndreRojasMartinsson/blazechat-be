import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from './users.service';
import { UserRole } from 'src/database/models/User.entity';
import z from 'zod';
import { JwtUserPayloadSchema } from 'src/schemas/Auth';

const JwtPayloadRequest = z.object({ user: JwtUserPayloadSchema });

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private usersService: UsersService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();

    const {
      user: { sub: userId },
    } = JwtPayloadRequest.parse(request);

    const user = await this.usersService.findOne(userId);
    if (!user) throw new UnauthorizedException();

    return requiredRoles.some((role) => user.role === role);
  }
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
