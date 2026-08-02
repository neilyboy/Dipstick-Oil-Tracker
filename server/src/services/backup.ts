import { prisma } from '../db';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';

export async function createBackup(configId?: string): Promise<{ message: string; file: string }> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(config.uploadDir, 'backups');
  await fs.mkdir(backupDir, { recursive: true });

  // Collect all data
  const [vehicles, services, inventory, receipts, settings] = await Promise.all([
    prisma.vehicle.findMany({
      include: { photos: true, serviceRecords: true },
    }),
    prisma.serviceRecord.findMany({
      include: { photos: true, receipts: true },
    }),
    prisma.inventoryItem.findMany({
      include: { transactions: true },
    }),
    prisma.receipt.findMany(),
    prisma.settings.findMany(),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    data: { vehicles, services, inventory, receipts, settings },
  };

  const fileName = `dipstick-backup-${timestamp}.json`;
  const filePath = path.join(backupDir, fileName);

  await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));

  // If S3 config is specified and enabled, try uploading
  if (configId) {
    const backupConfig = await prisma.backupConfig.findUnique({
      where: { id: configId },
    });

    if (backupConfig && backupConfig.enabled && backupConfig.type === 's3') {
      // S3 upload would go here - placeholder for actual implementation
      console.log(`Would upload ${fileName} to S3 bucket ${backupConfig.bucket}`);
      await prisma.backupConfig.update({
        where: { id: configId },
        data: { lastBackupAt: new Date() },
      });
    }
  }

  return { message: 'Backup created successfully', file: fileName };
}
