import { registerAs } from '@nestjs/config';

export default registerAs('rabbitmq', () => ({
  username: process.env.RABBITMQ_USERNAME,
  password: process.env.RABBITMQ_PASSWORD,
}));
