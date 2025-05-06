import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import * as jwt from '@node-rs/jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtUserPayload, JwtUserPayloadSchema } from './schemas';
import { AuthService } from './auth.service';

type Request = FastifyRequest & {
  user: JwtUserPayload;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private reflector: Reflector,
  ) {}

  async verifyAccessToken(token: string): Promise<JwtUserPayload | undefined> {
    const jwtSecret = this.configService.getOrThrow<string>('secrets.jwt');

    try {
      const payload = await jwt.verify(token, jwtSecret, {
        aud: ['https://blazechat.se'],
        iss: ['blazechat.se-prod'],
        validateExp: true,
      });

      return JwtUserPayloadSchema.parse(payload);
    } catch {
      return undefined;
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const reply = context.switchToHttp().getResponse<FastifyReply>();

    let token: string | undefined = undefined;

    if (request.cookies?.['blaze_at']) {
      token = request.cookies?.['blaze_at'];
    } else {
      token = this.extractTokenFromHeader(request);
    }

    // Verify access token
    const accessPayload = await this.verifyAccessToken(token ?? '');
    if (accessPayload) {
      // Valid access token, we can continue
      request['user'] = accessPayload;
      return true;
    }

    // Get and verify refresh token
    const refreshToken = request.cookies?.['blaze_rt'] ?? '';
    const userId = await this.authService.verifyRefreshToken(refreshToken);

    // If invalid refresh token we throw unauthorized.
    if (!userId) throw new UnauthorizedException();

    // Create a new access token since refresh token is valid
    const newAccessToken = await this.authService.createAccessToken(userId);

    request['user'] = (await this.verifyAccessToken(newAccessToken))!;

    reply.setCookie('blaze_at', newAccessToken, {
      path: '/',
      sameSite: 'lax',
      secure: false,
      httpOnly: true,
      maxAge: 3600,
    });

    request.cookies['blaze_at'] = newAccessToken;

    return true;
  }

  private extractTokenFromHeader(request: FastifyRequest) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
