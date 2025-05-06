import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { NestMinioModule } from 'nestjs-minio';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
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
  providers: [UploadService],
  controllers: [UploadController],
})
export class UploadModule {}
