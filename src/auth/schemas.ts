import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import * as z from 'zod';

export class SignInDTO {
  @IsNotEmpty()
  @IsString()
  @Matches(/^(?!.*_.*_)(?!_)(?!.*_$)[A-Za-z0-9_]+$/g)
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class SignUpDTO {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^(?!.*_.*_)(?!_)(?!.*_$)[A-Za-z0-9_]+$/g)
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @IsNotEmpty()
  @MaxLength(512)
  @IsString()
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
