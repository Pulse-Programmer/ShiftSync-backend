import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/shiftsync',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: '24h',
  bcryptSaltRounds: 12,
  invitationExpiryDays: 7,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
