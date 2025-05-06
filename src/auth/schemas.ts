import { IsNotEmpty } from 'class-validator';
import * as z from 'zod';

export class SignInDTO {
  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  password: string;
}

export const JwtUserPayloadSchema = z.strictObject({
  iat: z.number(),
  exp: z.number(),
  iss: z.string(),
  aud: z.string(),
  sub: z.uuid(),
});

export type JwtUserPayload = z.infer<typeof JwtUserPayloadSchema>;
