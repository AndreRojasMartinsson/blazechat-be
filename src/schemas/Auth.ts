import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import * as z from 'zod';

export class SignInDto {
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

export class SignUpDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Matches(/^(?!.*_.*_)(?!_)(?!.*_$)[A-Za-z0-9_]+$/g)
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @ApiProperty()
  @IsNotEmpty()
  @MaxLength(512)
  @IsString()
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  redirectUri: string;
}

export const JwtUserPayloadSchema = z.strictObject({
  iat: z.number(),
  exp: z.number(),
  iss: z.string(),
  aud: z.string(),
  sub: z.uuid(),
});

export type JwtUserPayload = z.infer<typeof JwtUserPayloadSchema>;
