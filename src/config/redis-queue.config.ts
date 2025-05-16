import { registerAs } from '@nestjs/config';

export default registerAs('redis_queue', () => ({
  host: process.env.BULLMQ_REDIS_HOST,
  port: process.env.BULLMQ_REDIS_PORT,
  user: process.env.BULLMQ_REDIS_USER,
  password: process.env.BULLMQ_REDIS_PASS,
}));
