import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/database/models/User.entity';
import { PendingDeletion } from 'src/database/models/PendingDeletion.entity';
import { Suspension } from 'src/database/models/Suspension.entity';
import { Server } from 'src/database/models/Server.entity';
import { NestMinioModule } from 'nestjs-minio';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServersModule } from 'src/servers/servers.module';

@Module({
  imports: [
    ServersModule,
    TypeOrmModule.forFeature([User, PendingDeletion, Suspension, Server]),
    NestMinioModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        endPoint: configService.getOrThrow<string>('minio.host'),
        port: +configService.getOrThrow<number>('minio.port'),
        accessKey: configService.getOrThrow<string>('minio.access_key'),
        secretKey: configService.getOrThrow<string>('minio.secret_key'),
        useSSL: false,
      }),
    }),
  ],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
