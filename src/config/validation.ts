import z from 'zod';

export const databaseValidationSetup = <T extends z.ZodTypeAny>(
  config: Record<string, unknown>,
  schema: T,
): z.infer<T> => {
  const data = schema.parse(config);
  return data;
};
