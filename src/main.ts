import './instrument';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import fastifyCookie from '@fastify/cookie';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import fastifyCsrfProtection from '@fastify/csrf-protection';
import fastifySession from '@fastify/secure-session';

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      prefix: 'ChatBlaze',
      logger: {
        timestamp: true,
      },
    }),
  );

  const configService = app.get(ConfigService);

  app.enableVersioning({
    prefix: 'v',
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.enableCors({
    credentials: true,
    origin: configService.getOrThrow<string>('secrets.site_url'),
  });
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('ChatBlaze')
    .setDescription('ChatBlaze API Description')
    .setVersion('1.0')
    .addTag('chatblaze')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  await app.register(fastifyCsrfProtection, {
    cookieOpts: { httpOnly: true, sameSite: 'lax', path: '/', signed: true },
  });

  await app.register(fastifyCookie, {
    parseOptions: { httpOnly: true, sameSite: 'lax', signed: true, path: '/' },
    secret: configService.getOrThrow<string>('secrets.cookie'),
  });

  await app.register(fastifySession, {
    salt: configService.getOrThrow<string>('secrets.salt'),
    secret: configService.getOrThrow<string>('secrets.session'),
    cookie: { httpOnly: true, sameSite: 'lax', path: '/', signed: true },
  });

  await app.register(fastifyMultipart);

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
        scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
      },
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      disableErrorMessages: process.env.NODE_ENV === 'production',
      enableDebugMessages: process.env.NODE_ENV === 'development',
    }),
  );

  await app.listen(process.env.PORT ?? 3080);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => {
      app.close().catch(console.error);
    });
  }
}

bootstrap().catch(console.error);

declare module '@fastify/secure-session' {
  interface SessionData {
    csrfToken: string;
  }
}
