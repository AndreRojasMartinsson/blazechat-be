import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotAcceptableException,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Public } from './auth.guard';
import { AllowSuspended } from 'src/users/suspension.guard';
import { CookieSerializeOptions } from '@fastify/cookie';
import { SignInDto, SignUpDto } from 'src/schemas/Auth';
import { randomBytes } from 'node:crypto';
import { CsrfGuard } from './csrf.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  private getDefaultCookieOpts(): CookieSerializeOptions {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' ? true : false,
      sameSite: 'lax',
      signed: true,
      path: '/',
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('/login')
  @Public()
  @AllowSuspended()
  @UseGuards(CsrfGuard)
  async signIn(
    @Res({ passthrough: true }) response: FastifyReply,
    @Body() payload: SignInDto,
  ) {
    const user = await this.authService.signIn(
      payload.username,
      payload.password,
    );

    // Mint new refresh token and store in database and cookies
    // Note: Storing refresh token also invalidates previous tokens
    const refreshToken = await this.authService.createRefreshToken();

    await this.authService.storeRefreshToken(refreshToken, user.id);

    response.setCookie('blaze_refresh', refreshToken, {
      maxAge: 14 * 24 * 60 * 60,
      ...this.getDefaultCookieOpts(),
    });

    // Mint new access token
    const accessToken = await this.authService.createAccessToken(user.id);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Get('/csrf-token')
  @Public()
  @AllowSuspended()
  async getCsrfToken(@Req() request: FastifyRequest) {
    const session = request.session;

    if (!session.get('csrfToken')) {
      const token = randomBytes(32).toString('hex');
      session.set('csrfToken', token);
    }

    return { csrf_token: session.get('csrfToken') };
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('/register')
  @Public()
  @AllowSuspended()
  @UseGuards(CsrfGuard)
  async signUp(@Body() dto: SignUpDto) {
    const passwordStrength = this.authService.checkPasswordStrength(
      dto.password,
    );

    if (passwordStrength < 1 || dto.password.length < 8) {
      throw new NotAcceptableException(
        'Password is too weak, please consider using stronger password.',
      );
    }

    await this.authService.signUp(dto);
  }

  @HttpCode(HttpStatus.FOUND)
  @Get('/callback')
  @Public()
  @AllowSuspended()
  async verifyEmail(
    @Res({ passthrough: true }) response: FastifyReply,
    @Query('t') token: string,
    @Query('redirect_uri') redirectUri: string,
  ) {
    if (typeof token !== 'string') throw new UnauthorizedException();

    const url = new URL(redirectUri);
    url.searchParams.set('email_verified', 'y');

    const user = await this.authService.verifyEmailToken(token);
    if (!user) throw new UnauthorizedException();

    return response.status(HttpStatus.FOUND).redirect(url.toString());
  }

  @HttpCode(HttpStatus.OK)
  @Post('/refresh')
  @Public()
  @AllowSuspended()
  @UseGuards(CsrfGuard)
  async refreshAccessToken(
    @Req()
    request: FastifyRequest,
    @Res({ passthrough: true })
    response: FastifyReply,
  ) {
    // Get and verify refresh token
    const jwt = request.cookies?.['blaze_refresh'] ?? '';
    const token = await this.authService.verifyRefreshToken(jwt);

    // If invalid refresh token we throw unauthorized.
    if (!token) throw new UnauthorizedException();

    // Mint new refresh token and store in database and cookies
    // Note: Storing refresh token also invalidates previous tokens
    const refreshToken = await this.authService.createRefreshToken();

    await this.authService.storeRefreshToken(refreshToken, token.user.id);

    response.setCookie('blaze_refresh', refreshToken, {
      maxAge: 14 * 24 * 60 * 60,
      ...this.getDefaultCookieOpts(),
    });

    // Mint new access token
    const accessToken = await this.authService.createAccessToken(token.user.id);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
    };
  }
}
