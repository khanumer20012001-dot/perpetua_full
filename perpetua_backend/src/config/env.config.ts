
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.warn(`[env] Warning: Missing environment variable: ${key}`);
    return '';
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '8000', 10),
  HOST: process.env.HOST || '0.0.0.0',

  // Database
  DATABASE_URL: requireEnv('DATABASE_URL'),

  // JWT
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // SMTP (Email for OTP)
  SMTP_EMAIL: process.env.SMTP_EMAIL || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',

  // Gemini AI
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
} as const;
