import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionType } from 'src/database/models/ServerRole.entity';
import { JwtUserPayloadSchema } from 'src/schemas/Auth';
import z from 'zod';
import { ServersService } from './servers.service';

export const PERMISSION_KEY = 'required_permissions';
export const Perms = (...permissions: PermissionType[]) =>
  SetMetadata(PERMISSION_KEY, permissions);

const JwtPayloadRequest = z.object({ user: JwtUserPayloadSchema });

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private serverService: ServersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionType[]
    >(PERMISSION_KEY, [context.getHandler(), context.getClass()]);

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

    const member = await this.serverService.getMemberFromUserId(
      serverId,
      userId,
    );

    if (!member.id) {
      throw new ForbiddenException();
    }

    const hasPermission = await this.serverService.doesMemberHavePermission(
      member.id,
      requiredPermissions.reduce((acc, perm) => acc | perm, 0),
    );

    if (!hasPermission) {
      throw new ForbiddenException();
    }

    return true;
  }
}
