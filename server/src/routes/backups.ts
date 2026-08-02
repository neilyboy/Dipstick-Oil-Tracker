import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { AppError } from '../middleware/errorHandler';
import { createBackup } from '../services/backup';

export const backupRoutes = Router();

// List backup configs
backupRoutes.get('/configs', async (_req: Request, res: Response) => {
  const configs = await prisma.backupConfig.findMany();
  res.json(configs);
});

// Create backup config
backupRoutes.post('/configs', async (req: Request, res: Response) => {
  const config = await prisma.backupConfig.create({ data: req.body });
  res.status(201).json(config);
});

// Update backup config
backupRoutes.put('/configs/:id', async (req: Request, res: Response) => {
  const config = await prisma.backupConfig.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(config);
});

// Delete backup config
backupRoutes.delete('/configs/:id', async (req: Request, res: Response) => {
  await prisma.backupConfig.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// Create a backup now
backupRoutes.post('/create', async (req: Request, res: Response) => {
  const { configId } = req.body;

  try {
    const result = await createBackup(configId);
    res.json(result);
  } catch (err: any) {
    throw new AppError(500, `Backup failed: ${err.message}`);
  }
});

// Export all data as JSON (data-only backup)
backupRoutes.get('/export', async (_req: Request, res: Response) => {
  const [vehicles, services, inventory, receipts] = await Promise.all([
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
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    data: {
      vehicles,
      services,
      inventory,
      receipts,
    },
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=dipstick-backup-${new Date().toISOString().split('T')[0]}.json`);
  res.json(exportData);
});
