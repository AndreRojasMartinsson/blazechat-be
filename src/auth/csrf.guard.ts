import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { FastifyRequest } from 'fastify';

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<FastifyRequest>();
    const session = req.session;

    const sessionToken = session.get('csrfToken');
    if (!sessionToken) {
      throw new ForbiddenException('CSRF token missing in session');
    }

    const requestToken = req.headers['x-csrf-token'] as string;
    if (!requestToken) {
      throw new ForbiddenException('CSRF token missing in request header');
    }

    try {
      // **CRITICAL:** Use constant-time comparison to prevent timing attacks.
      // Ensure both tokens are buffers of the same length before comparison
      const sessionTokenBuffer = Buffer.from(sessionToken, 'utf8');
      const requestTokenBuffer = Buffer.from(requestToken, 'utf8');

      if (sessionTokenBuffer.length !== requestTokenBuffer.length) {
        throw new ForbiddenException('CSRF token length mismatch');
      }

      if (!timingSafeEqual(sessionTokenBuffer, requestTokenBuffer)) {
        throw new ForbiddenException('Invalid CSRF token');
      }
    } catch (e) {
      console.error('CSRF validation error:', e);
      throw new ForbiddenException('CSRF validation failed');
    }

    return true;
  }
}
