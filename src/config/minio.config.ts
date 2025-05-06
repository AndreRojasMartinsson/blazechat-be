import { registerAs } from '@nestjs/config';

export default registerAs('minio', () => ({
  host: process.env.MINIO_HOST,
  port: process.env.MINIO_PORT,
  access_key: process.env.MINIO_ACCESS_KEY,
  secret_key: process.env.MINIO_SECRET_KEY,
}));
