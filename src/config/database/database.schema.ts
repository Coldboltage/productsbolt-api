import z from 'zod';

export const databaseSchema = z.object({
  TYPEORM_USERNAME: z.string(),
  TYPEORM_PASSWORD: z.string(),
  TYPEORM_DATABASE: z.string(),
});
