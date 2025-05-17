import 'dotenv/config';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST!,
  port: +process.env.POSTGRES_PORT!,
  username: process.env.POSTGRES_USER!,
  password: process.env.POSTGRES_PASSWORD!,
  database: process.env.POSTGRES_DB!,
  entities: ['src/database/models/*.entity.{ts,js}'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  migrationsRun: false,
});
