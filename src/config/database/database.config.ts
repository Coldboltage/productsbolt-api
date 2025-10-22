import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  host: process.env.TYPEORM_DATABASE,
}));
