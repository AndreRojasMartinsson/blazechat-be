import { registerAs } from '@nestjs/config';

export default registerAs('bullmq', () => ({
  host: process.env.BULLMQ_REDIS_HOST,
  port: process.env.BULLMQ_REDIS_PORT,
  user: process.env.BULLMQ_REDIS_USER,
  pass: process.env.BULLMQ_REDIS_PASS,
  env: process.env.NODE_ENV,
}));
