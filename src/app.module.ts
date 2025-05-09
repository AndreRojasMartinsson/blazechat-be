import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import databaseConfig from './config/database.config';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { createKeyv } from '@keyv/redis';
import secretsConfig from './config/secrets.config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
import { RolesGuard } from './users/roles.guard';
import { SuspensionGuard } from './users/suspension.guard';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { ServersModule } from './servers/servers.module';
import databaseProvider from './database/database.provider';
import { PermissionGuard } from './servers/permission.guard';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThreadsModule } from './threads/threads.module';
import { LoggerModule } from './logger/logger.module';
import { EmailModule } from './email/email.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import emailConfig from './config/email.config';
import { BullModule } from '@nestjs/bullmq';
import { UploadModule } from './upload/upload.module';
import supabaseConfig from './config/supabase.config';
import { SupabaseModule } from 'nestjs-supabase-js';
import bullmqConfig from './config/bullmq.config';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 10 }],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/{*test}'],
      serveStaticOptions: {
        cacheControl: true,
        fallthrough: false,
      },
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const env = configService.getOrThrow<string>('bullmq.env');

        return env === 'development'
          ? {
              connection: {
                host: configService.getOrThrow<string>('bullmq.host'),
                port: +configService.getOrThrow<number>('bullmq.port'),
              },
            }
          : {
              connection: {
                host: configService.getOrThrow<string>('bullmq.host'),
                port: +configService.getOrThrow<number>('bullmq.port'),
                username: configService.getOrThrow<string>('bullmq.user'),
                password: configService.getOrThrow<string>('bullmq.pass'),
              },
            };
      },
    }),
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: ['.env.production', '.env'],
      load: [
        databaseConfig,
        secretsConfig,
        emailConfig,
        supabaseConfig,
        bullmqConfig,
      ],
    }),
    SupabaseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        supabaseUrl: configService.getOrThrow<string>('supabase.url'),
        supabaseKey: configService.getOrThrow<string>('supabase.key'),
      }),
    }),
    databaseProvider,
    SentryModule.forRoot(),
    ScheduleModule.forRoot(),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      isGlobal: true,
      useFactory: (configService: ConfigService) => {
        return {
          stores: [
            createKeyv(configService.getOrThrow<string>('database.redis')),
          ],
        };
      },
    }),
    AuthModule,
    UsersModule,
    HealthModule,
    ServersModule,
    ThreadsModule,
    LoggerModule,
    EmailModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
    {
      provide: APP_GUARD,
      useClass: SuspensionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
