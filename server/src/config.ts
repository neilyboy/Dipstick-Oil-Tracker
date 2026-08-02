import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://dipstick:dipstick@localhost:5432/dipstick?schema=public',
  uploadDir: path.resolve(process.env.UPLOAD_DIR || './uploads'),
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10),
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-me',

  // OCR settings
  ocr: {
    enabled: process.env.OCR_ENABLED !== 'false',
  },

  // Cloud backup settings
  s3: {
    endpoint: process.env.S3_ENDPOINT,
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    bucket: process.env.S3_BUCKET || 'dipstick-backups',
    region: process.env.S3_REGION || 'us-east-1',
  },

  // VIN decode
  vinDecodeApiKey: process.env.VIN_DECODE_API_KEY,

  // Web push
  vapid: {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
  },
};
