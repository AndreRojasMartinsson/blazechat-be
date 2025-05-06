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
import { SignInDTO } from './schemas';
import { FastifyReply } from 'fastify';
import { Public } from './auth.guard';
import { AllowSuspended } from 'src/users/suspension.guard';
import * as nodemailer from 'nodemailer';
import { render } from '@react-email/components';
import ConfirmEmail from 'blazechat-emails/emails/confirm-email';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('/login')
  @Public()
  @AllowSuspended()
  async signIn(
    @Res({ passthrough: true }) response: FastifyReply,
    @Body() payload: SignInDTO,
  ): Promise<string> {
    if (!payload.username || !payload.password) throw new BadRequestException();

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
  @Post('/hey')
  @Public()
  @AllowSuspended()
  async test() {
    const transporter = nodemailer.createTransport({
      host: 'smtp.strato.com',
      port: 465,
      secure: true,
      auth: {
        user: 'noreply@activework.se',
        password:
          '5@8kdnN^36YCQQYTF6HaethsP#8ssF9XDmPzFTXX3iijzzgGSaN*!a^frRnJ8odV',
      },
    });

    const emailHtml = await render(<ConfirmEmail />);
  }
}
