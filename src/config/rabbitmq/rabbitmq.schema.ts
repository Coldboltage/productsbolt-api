import z from 'zod';

export const rabbitmqSchema = z.object({
  RABBITMQ_USERNAME: z.string(),
  RABBITMQ_PASSWORD: z.string(),
});
