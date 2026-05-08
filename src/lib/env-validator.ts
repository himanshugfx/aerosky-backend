import { z } from 'zod';

const envSchema = z.object({
  // Required in all environments
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  NEXTAUTH_SECRET: z.string().min(32),
  JWT_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']),

  // Optional with defaults
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Email (optional for development)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // IP whitelist (optional)
  ALLOWED_IPS: z.string().optional(),
});

export function getValidatedEnv() {
  return envSchema.parse(process.env);
}

export function validateEnvironment() {
  try {
    envSchema.parse(process.env);
    console.log('✅ Environment variables validated');
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    process.exit(1);
  }
}