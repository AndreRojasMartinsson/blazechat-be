import { registerAs } from '@nestjs/config';

export default registerAs('secrets', () => ({
  jwt: process.env.JWT_SECRET,
  cookie: process.env.COOKIE_SECRET,
  salt: process.env.SESSION_SECRET_SALT,
  session: process.env.SESSION_SECRET,
  password: process.env.PASSWORD_SECRET,
  site_url: process.env.SITE_URL,
  api_url: process.env.API_URL,
  env: process.env.NODE_ENV,
}));
