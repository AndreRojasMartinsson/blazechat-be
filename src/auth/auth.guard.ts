import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import * as jwt from '@node-rs/jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private reflector: Reflector,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest() as FastifyRequest & {
      user: Record<string, any>;
    };

    let token: string | undefined = undefined;

    if (request.cookies?.["blaze_at"]) {
      token = request.cookies?.["blaze_at"]
    } else {
      token = this.extractTokenFromHeader(request)
    }

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const jwtSecret = this.configService.getOrThrow<string>('secrets.jwt');
      const payload = await jwt.verify(token, jwtSecret, {
        aud: ['https://blazechat.se'],
        iss: ['blazechat.se-prod'],
        // TODO: SET THIS TO TRUE FOR PROD
        validateExp: false,
      });

      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: FastifyRequest) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
