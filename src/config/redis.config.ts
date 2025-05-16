import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  uri: process.env.REDIS_URI,
}));
