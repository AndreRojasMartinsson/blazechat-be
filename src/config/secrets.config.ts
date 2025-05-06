import { registerAs } from '@nestjs/config';

export default registerAs('secrets', () => ({
  jwt: process.env.JWT_SECRET,
  cookie: process.env.COOKIE_SECRET,
  password: process.env.PASSWORD_SECRET,
  site_url: process.env.SITE_URL
}));
