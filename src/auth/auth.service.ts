import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as argon2 from '@node-rs/argon2';
import * as jwt from '@node-rs/jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { secondsSinceEpoch } from 'src/utils/time';
import { User } from 'src/database/models/User.entity';
import { randomBytes } from 'node:crypto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async createAccessToken(userId: string): Promise<string> {
    const jwtSecret = this.configService.getOrThrow<string>('secrets.jwt');
    const timestampNow = secondsSinceEpoch();

    return jwt.sign(
      {
        iat: timestampNow,
        exp: timestampNow + 3600,
        iss: 'blazechat.se-prod',
        aud: 'https://blazechat.se',
        sub: userId,
      },
      jwtSecret,
    );
  }

  async createRefreshToken(user: User): Promise<string> {
    const token = randomBytes(128).toString('hex');

    const existingRefreshToken = await this.cacheManager.get(`rt_${user.id}`);
    // Delete previous token back reference
    if (typeof existingRefreshToken === 'string') {
      await this.cacheManager.del(`rt_backref_${existingRefreshToken}`);
    }

    await this.cacheManager.set(
      `rt_${user.id}`,
      token,
      14 * 24 * 60 * 60 * 1000,
    );
    await this.cacheManager.set(
      `rt_backref_${token}`,
      user.id,
      14 * 24 * 60 * 60 * 1000,
    );

    return token;
  }

  async isValidRefreshToken(refreshToken: string): Promise<boolean>;
  async isValidRefreshToken(user: User, refreshToken: string): Promise<boolean>;
  async isValidRefreshToken(
    param: string | User,
    token?: string,
  ): Promise<boolean> {
    if (typeof param === 'string') {
      const refreshToken = param;
      const dbToken = await this.cacheManager.get(`rt_backref_${refreshToken}`);

      return dbToken !== undefined;
    } else {
      const user = param;

      const dbToken = await this.cacheManager.get(`rt_${user.id}`);
      if (typeof dbToken !== 'string') return false;

      return dbToken === token!;
    }
  }

  async getUserIdFromRefreshToken(
    refreshToken: string,
  ): Promise<string | undefined> {
    const dbToken = await this.cacheManager.get(`rt_backref_${refreshToken}`);
    if (dbToken === undefined || typeof dbToken !== 'string') return undefined;

    return dbToken;
  }

  async getAccessToken(refreshToken: string): Promise<string | undefined> {
    const userId = await this.getUserIdFromRefreshToken(refreshToken);
    if (userId === undefined) return undefined;

    const access = await this.createAccessToken(userId);
    return access;
  }

  async signIn(
    username: string,
    password: string,
  ): Promise<{ access: string; refresh: string }> {
    const user = await this.usersService.findByName(username);
    const dbPassword = user?.hashed_password;

    if (!dbPassword) throw new UnauthorizedException();

    const passwordSecret =
      this.configService.getOrThrow<string>('secrets.password');

    const isValid = await argon2.verify(dbPassword, password, {
      timeCost: 2,
      parallelism: 28,
      algorithm: argon2.Algorithm.Argon2id,
      memoryCost: 524288,
      secret: Buffer.from(passwordSecret, 'utf8'),
    });

    if (!isValid) throw new UnauthorizedException();

    const [access, refresh] = await Promise.all([
      this.createAccessToken(user.id),
      this.createRefreshToken(user),
    ]);

    return { access, refresh };
  }
}
