import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDTO, SignUpDTO } from './schemas';
import { FastifyReply } from 'fastify';
import { Public } from './auth.guard';
import { AllowSuspended } from 'src/users/suspension.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('/login')
  @Public()
  @AllowSuspended()
  async signIn(
    @Res({ passthrough: true }) response: FastifyReply,
    @Body() payload: SignInDTO,
  ) {
    const { access, refresh } = await this.authService.signIn(
      payload.username,
      payload.password,
    );

    response.setCookie('blaze_rt', refresh, {
      httpOnly: false,
      maxAge: 14 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    response.setCookie("blaze_at", access, {
      httpOnly: false,
      maxAge: 3600,
      sameSite: 'lax',
    })

  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("/register")
  @Public()
  @AllowSuspended()
  async signUp(@Body() dto: SignUpDTO) {
    await this.authService.signUp(dto, "http://localhost:3000/");
  }

  @HttpCode(HttpStatus.FOUND)
  @Get("/verify")
  @Public()
  @AllowSuspended()
  async verifyEmail(
    @Res({ passthrough: true }) response: FastifyReply,
    @Query("t") token: string,
    @Query("redirect") redirectUri: string) {

    if (typeof token !== "string") throw new UnauthorizedException()

    const user = await this.authService.verifyEmailToken(token);
    const [access, refresh] = await Promise.all([
      this.authService.createAccessToken(user.id),
      this.authService.createRefreshToken(user),
    ]);

    response.setCookie("blaze_rt", refresh, {
      httpOnly: true,
      maxAge: 14 * 24 * 60 * 60,
      sameSite: 'lax',
      expires: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    })

    response.setCookie("blaze_at", access, {
      httpOnly: true,
      maxAge: 3600,
      sameSite: 'lax',
      expires: new Date(Date.now() + 3600 * 1000),
    })

    return response.status(HttpStatus.FOUND).redirect(redirectUri)
  }
}
