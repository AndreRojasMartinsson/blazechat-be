import {
  ConflictException,
  Inject,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as argon2 from '@node-rs/argon2';
import * as jwt from '@node-rs/jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { secondsSinceEpoch } from 'src/utils/time';
import { User } from 'src/database/models/User.entity';
import { randomBytes } from 'node:crypto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EmailService } from 'src/email/email.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  JwtUserPayload,
  JwtUserPayloadSchema,
  SignUpDto,
} from 'src/schemas/Auth';
import { RefreshToken } from 'src/database/models/RefreshToken.entity';
import { DateTime } from 'luxon';

@Injectable()
export class AuthService {
  constructor(
    private emailService: EmailService,
    private usersService: UsersService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
    private configService: ConfigService,
  ) {}

  async createAccessToken(userId: string | undefined): Promise<string> {
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

  async storeRefreshToken(token: string, userId: string) {
    const user = await this.usersService.findOne(userId);
    if (user === null) throw new NotFoundException();

    const row = new RefreshToken({
      user,
      token,
    });

    await this.refreshTokenRepo.update(
      {
        user: { id: userId },
        invalidated: undefined,
      },
      {
        invalidated: new Date(Date.now()),
      },
    );

    return this.refreshTokenRepo.save(row);
  }

  createEmailToken(): string {
    const token = randomBytes(42).toString('hex');

    return token;
  }

  async createRefreshToken(): Promise<string> {
    return randomBytes(128).toString('hex');
  }

  async verifyRefreshToken(refreshToken: string): Promise<RefreshToken | null> {
    const token = await this.refreshTokenRepo.findOne({
      where: {
        token: refreshToken,
      },
      relations: {
        user: true,
      },
    });

    if (token?.invalidated === undefined) return null;

    const invalidated = DateTime.fromJSDate(token.invalidated);
    if (invalidated < DateTime.now()) return null;

    return token;
  }

  async getUserIdFromRefreshToken(
    refreshToken: string,
  ): Promise<string | undefined> {
    return this.refreshTokenRepo
      .findOne({
        select: {
          user: { id: true },
        },
        where: {
          invalidated: undefined,
          token: refreshToken,
        },
      })
      .then((value) => {
        if (value === null) return undefined;

        return value.user.id;
      });
  }

  async getAccessToken(refreshToken: string): Promise<string | undefined> {
    const userId = await this.getUserIdFromRefreshToken(refreshToken);
    if (userId === undefined) return undefined;

    const access = await this.createAccessToken(userId);
    return access;
  }

  async verifyPassword(
    password: string,
    hashed_password: string,
  ): Promise<boolean> {
    const passwordSecret =
      this.configService.getOrThrow<string>('secrets.password');

    const isValid = await argon2.verify(hashed_password, password, {
      timeCost: 2,
      parallelism: 28,
      algorithm: argon2.Algorithm.Argon2id,
      memoryCost: 524288,
      secret: Buffer.from(passwordSecret, 'utf8'),
    });

    return isValid;
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

    return hashed;
  }

  async signIn(username: string, password: string): Promise<User> {
    const user = await this.usersService.findByName(username);
    const dbPassword = user?.hashed_password;

    if (!dbPassword) throw new UnauthorizedException();

    const isValid = this.verifyPassword(password, dbPassword);
    if (!isValid) throw new UnauthorizedException();

    return user;
  }

  checkPasswordStrength(password: string): number {
    if (password.length < 8) return 0;

    let score = 0;

    score += 4 * password.length;

    const lower = /[a-z]/.test(password);
    const upper = /[A-Z]/.test(password);
    const digit = /\d/.test(password);
    const symbol = /[^A-Za-z0-9]/.test(password);

    if (lower) score += 5;
    if (upper) score += 5;
    if (digit) score += 5;
    if (symbol) score += 5;

    const varietyCount = [lower, upper, digit, symbol].filter(Boolean).length;
    if (varietyCount >= 3) score += 2;

    if ((lower || upper) && !(digit || symbol)) score -= 10;
    if (digit && !(lower || upper || symbol)) score -= 10;

    score -= this.countSequentialOrRepeated(password) * 2;

    return Math.max(0, Math.min(100, score));
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

  async verifyAccessToken(token: string): Promise<JwtUserPayload | undefined> {
    const jwtSecret = this.configService.getOrThrow<string>('secrets.jwt');

    try {
      const payload = await jwt.verify(token, jwtSecret, {
        aud: ['https://blazechat.se'],
        iss: ['blazechat.se-prod'],
        validateExp: true,
      });

      return JwtUserPayloadSchema.parse(payload);
    } catch {
      return undefined;
    }
  }

  async verifyEmailToken(token: string): Promise<User | undefined> {
    const user = await this.usersService.findOneByEmailToken(token);
    if (!user) return undefined;

    await this.usersService.confirmEmail(user);

    return user;
  }

  async signUp(dto: SignUpDto) {
    const exists = await this.usersService.doesAccountExist(
      dto.email,
      dto.username,
    );

    if (exists) throw new ConflictException();

    const hashedPassword = await this.hash(dto.password);

    const emailToken = this.createEmailToken();

    const user = await this.usersService.createUser(
      dto,
      hashedPassword,
      emailToken,
    );

    const siteUrl = this.configService.getOrThrow<string>('secrets.api_url');
    const link = new URL(`${siteUrl}/v1/auth/callback`);

    link.searchParams.set('t', emailToken);
    link.searchParams.set('redirect_uri', dto.redirectUri);

    await this.emailService.addToQueue('confirm-email', {
      user,
      redirect: link.toString(),
    });
  }
}
