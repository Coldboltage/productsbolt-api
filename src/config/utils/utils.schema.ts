import z from 'zod';

export const utilsSchema = z.object({
  ENABLE_JOBS: z.string(),
  LAPTOP_IP: z.string(),
  DISCORD_ALERTS: z.string(),
  SERVICE_NAME: z.string(),
  SERVICE_VERSION: z.string(),
  NODE_ENV: z.string(),
});
