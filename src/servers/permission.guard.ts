import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from 'src/database/models/ServerRole.entity';
import { ServersService } from './servers.service';
import { JwtUserPayloadSchema } from 'src/auth/schemas';
import z from 'zod';

export const PERMISSION_KEY = 'required_permissions';
export const Perms = (...permissions: Permission[]) =>
  SetMetadata(PERMISSION_KEY, permissions);

const JwtPayloadRequest = z.object({ user: JwtUserPayloadSchema });

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private serverService: ServersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest() as {
      params: Record<string, string>;
    };

    const {
      user: { sub: userId },
    } = JwtPayloadRequest.parse(request);

    const serverId = request.params.server_id;

    if (!serverId) {
      throw new ForbiddenException();
    }

    const memberId = await this.serverService.getMemberIdFromUserId(
      serverId,
      userId,
    );

    if (!memberId) {
      throw new ForbiddenException();
    }

    const hasPermission = await this.serverService.doesMemberHavePermissionTo(
      serverId,
      memberId,
      requiredPermissions.reduce((acc, perm) => acc | perm, 0),
    );

    if (!hasPermission) {
      throw new ForbiddenException();
    }

    return true;
  }
}
