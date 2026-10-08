import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().optional().default(''),
  HINDSIGHT_API_URL: z.string().url().default('https://api.hindsight.vectorize.io'),
  HINDSIGHT_API_KEY: z.string().optional().default(''),
  HINDSIGHT_BANK_ID: z.string().optional().default('competitorIQ'),
  LLM_API_KEY: z.string().optional().default(''),
  OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('qwen2.5:3b'),
  OLLAMA_TIMEOUT_MS: z.coerce.number().default(15000),
  JWT_SECRET: z.string().default('competitoriq-production-secure-jwt-secret-2026')
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('Invalid environment variables schema:', _env.error.format());
  throw new Error('Invalid environment variables setup in .env');
}

export const env = _env.data;
