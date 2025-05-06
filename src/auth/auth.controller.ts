import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDTO, SignUpDTO } from './schemas';
import { FastifyReply } from 'fastify';
import { Public } from './auth.guard';
import { AllowSuspended } from 'src/users/suspension.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @HttpCode(HttpStatus.OK)
  @Post('/login')
  @Public()
  @AllowSuspended()
  async signIn(
    @Res({ passthrough: true }) response: FastifyReply,
    @Body() payload: SignInDTO,
  ): Promise<string> {
    const { access, refresh } = await this.authService.signIn(
      payload.username,
      payload.password,
    );

    response.setCookie('blaze_rt', refresh, {
      httpOnly: true,
      maxAge: 14 * 24 * 60 * 60,
      sameSite: 'lax',
      expires: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });

    return access;
  }

  @HttpCode(HttpStatus.OK)
  @Post("/register")
  @Public()
  @AllowSuspended()
  async signUp(@Body() dto: SignUpDTO) {
    await this.authService.signUp(dto);
  }
}
