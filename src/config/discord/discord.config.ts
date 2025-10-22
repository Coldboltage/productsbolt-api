import { registerAs } from '@nestjs/config';

export default registerAs('discord', () => ({
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
  discordWebhookNewProduct: process.env.DISCORD_WEBHOOK_NEW_PRODUCT,
}));
