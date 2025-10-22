import z from 'zod';

export const discordSchema = z.object({
  DISCORD_WEBHOOK_URL: z.string(),
  DISCORD_WEBHOOK_NEW_PRODUCT: z.string(),
});
