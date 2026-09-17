import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_ORIGIN: z.string().url(),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  META_VERIFY_TOKEN: z.string().min(16).optional(),
  META_APP_SECRET: z.string().min(16).optional(),
  META_ACCESS_TOKEN: z.string().min(1).optional(),
  META_PHONE_NUMBER_ID: z.string().min(1).optional(),
  ADMIN_API_KEY: z.string().min(24)
});

export const config = schema.parse(process.env);
