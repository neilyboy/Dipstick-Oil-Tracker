import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';

export async function initDirectories() {
  const dirs = [
    config.uploadDir,
    path.join(config.uploadDir, 'vehicles'),
    path.join(config.uploadDir, 'services'),
    path.join(config.uploadDir, 'receipts'),
    path.join(config.uploadDir, 'thumbnails'),
    path.join(config.uploadDir, 'inventory'),
  ];

  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

export function getUploadPath(category: string, filename: string): string {
  return path.join(config.uploadDir, category, filename);
}
