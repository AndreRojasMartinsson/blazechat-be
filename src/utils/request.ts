import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtUserPayloadSchema } from 'src/auth/schemas';

export const AccessToken = createParamDecorator((_, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();

  return JwtUserPayloadSchema.parse(request.user);
});
