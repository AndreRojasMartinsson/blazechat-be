import { ConflictException, Inject, Injectable, NotAcceptableException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as argon2 from '@node-rs/argon2';
import * as jwt from '@node-rs/jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { secondsSinceEpoch } from 'src/utils/time';
import { User } from 'src/database/models/User.entity';
import { randomBytes } from 'node:crypto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { SignUpDTO } from './schemas';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AuthService {
  constructor(
    private eventEmitter: EventEmitter2,
    private usersService: UsersService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) { }

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

  createEmailToken(): string {
    const token = randomBytes(42).toString('hex');

    return token;
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

  async verify_password(password: string, hashed_password: string): Promise<boolean> {
    const passwordSecret =
      this.configService.getOrThrow<string>('secrets.password');

    const isValid = await argon2.verify(hashed_password, password, {
      timeCost: 2,
      parallelism: 28,
      algorithm: argon2.Algorithm.Argon2id,
      memoryCost: 524288,
      secret: Buffer.from(passwordSecret, 'utf8'),
    });

    return isValid
  }

  async hash(password: string): Promise<string> {
    const passwordSecret =
      this.configService.getOrThrow<string>('secrets.password');

    const hashed = await argon2.hash(password, {
      timeCost: 2,
      parallelism: 28,
      algorithm: argon2.Algorithm.Argon2id,
      memoryCost: 524288,
      secret: Buffer.from(passwordSecret, 'utf8'),
    });

    return hashed
  }

  async signIn(
    username: string,
    password: string,
  ): Promise<{ access: string; refresh: string }> {
    const user = await this.usersService.findByName(username);
    const dbPassword = user?.hashed_password;

    if (!dbPassword) throw new UnauthorizedException();


    const isValid = this.verify_password(password, dbPassword)
    if (!isValid) throw new UnauthorizedException();

    const [access, refresh] = await Promise.all([
      this.createAccessToken(user.id),
      this.createRefreshToken(user),
    ]);

    return { access, refresh };
  }

  checkPasswordStrength(password: string): number {
    if (password.length < 8) return 0;

    let score = 0;

    score += 4 * password.length;

    const lower = /[a-z]/.test(password);
    const upper = /[A-Z]/.test(password);
    const digit = /\d/.test(password);
    const symbol = /[^A-Za-z0-9]/.test(password);

    if (lower) score += 5
    if (upper) score += 5
    if (digit) score += 5
    if (symbol) score += 5

    const varietyCount = [lower, upper, digit, symbol].filter(Boolean).length;
    if (varietyCount >= 3) score += 2;

    if ((lower || upper) && !(digit || symbol)) score -= 10;
    if (digit && !(lower || upper || symbol)) score -= 10;

    score -= this.countSequentialOrRepeated(password) * 2;

    return Math.max(0, Math.min(100, score))
  }

  countSequentialOrRepeated(str: string): number {
    let penalty = 0;
    for (let i = 0; i < str.length - 2; i++) {
      const a = str.charCodeAt(i),
        b = str.charCodeAt(i + 1),
        c = str.charCodeAt(i + 2);
      // Check increasing or decreasing runs of length 3
      if ((b === a + 1 && c === b + 1) || (b === a - 1 && c === b - 1)) {
        penalty++;
      }
      // Check repeats (aaa, 111)
      if (str[i] === str[i + 1] && str[i] === str[i + 2]) {
        penalty++;
      }
    }
    return penalty;
  }


  async verifyEmailToken(token: string): Promise<User> {
    const user = await this.usersService.findOneByEmailToken(token)
    if (!user) throw new UnauthorizedException()

    await this.usersService.confirmEmail(user)

    return user
  }

  async signUp(dto: SignUpDTO, redirect: string): Promise<User> {
    const passwordStrength = this.checkPasswordStrength(dto.password);
    if (passwordStrength < 1 || dto.password.length < 8) throw new NotAcceptableException("Password is too weak, please consider using stronger password.")

    const exists = await this.usersService.doesAccountExist(dto.email, dto.username);
    if (exists) throw new ConflictException();

    const hashedPassword = await this.hash(dto.password);

    const emailToken = this.createEmailToken()
    const user = await this.usersService.createUser(dto, hashedPassword, emailToken)

    console.log(user);


    await this.eventEmitter.emitAsync("auth.emails.send_confirmation", { payload: user, redirect })

    return user
  }

}
