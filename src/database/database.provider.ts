import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

export default TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.getOrThrow('database.host'),
    port: +configService.getOrThrow('database.port'),
    username: configService.getOrThrow('database.user'),
    password: configService.getOrThrow('database.password'),
    database: configService.getOrThrow('database.name'),
    entities: [__dirname + '/models/**/*.entity.{ts,js,cjs,mjs}'],
    migrations: [__dirname + '/migrations/*.{ts,js,cjs,mjs}'],
    migrationsRun: true,
  }),
  inject: [ConfigService],
});
