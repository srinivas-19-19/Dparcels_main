import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // DB & Redis
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/dparcels?schema=public'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  // JWT
  JWT_ACCESS_SECRET: z.string().min(10).default('super-secret-access-key-change-me-12345'),
  JWT_REFRESH_SECRET: z.string().min(10).default('super-secret-refresh-key-change-me-12345'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // SMTP Mailer & OTP
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASSWORD: z.string().optional().default(''),
  SMTP_FROM_NAME: z.string().default('DParcels'),
  SMTP_FROM_EMAIL: z.string().optional().default(''),
  OTP_SECRET: z.string().default('dparcels-otp-secret-key-2026'),

  // Google Maps & Auth
  GOOGLE_MAPS_API_KEY: z.string().optional().default('mock-google-maps-key'),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
