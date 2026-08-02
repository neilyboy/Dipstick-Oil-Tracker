import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { AppError } from '../middleware/errorHandler';
import { upload } from '../middleware/upload';
import { performOcr } from '../services/ocr';

export const receiptRoutes = Router();

// List receipts
receiptRoutes.get('/', async (req: Request, res: Response) => {
  const { serviceRecordId, vehicleId } = req.query;
  const where: any = {};
  if (serviceRecordId) where.serviceRecordId = serviceRecordId;
  if (vehicleId) where.vehicleId = vehicleId;

  const receipts = await prisma.receipt.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      serviceRecord: {
        select: {
          id: true,
          serviceDate: true,
          mileage: true,
          vehicle: { select: { id: true, displayName: true } },
        },
      },
    },
  });

  res.json(receipts);
});

// Get single receipt
receiptRoutes.get('/:id', async (req: Request, res: Response) => {
  const receipt = await prisma.receipt.findUnique({
    where: { id: req.params.id },
    include: {
      serviceRecord: {
        include: { vehicle: { select: { id: true, displayName: true } } },
      },
    },
  });

  if (!receipt) throw new AppError(404, 'Receipt not found');
  res.json(receipt);
});

// Upload receipt and optionally run OCR
receiptRoutes.post('/upload', upload.single('receipt'), async (req: Request, res: Response) => {
  if (!req.file) throw new AppError(400, 'No receipt uploaded');

  const { serviceRecordId, vehicleId } = req.body;

  const receipt = await prisma.receipt.create({
    data: {
      serviceRecordId: serviceRecordId || null,
      vehicleId: vehicleId || null,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    },
  });

  // Run OCR in background
  performOcr(receipt.id, req.file.path).catch((err) => {
    console.error(`OCR failed for receipt ${receipt.id}:`, err);
  });

  res.status(201).json(receipt);
});

// Manually trigger OCR for a receipt
receiptRoutes.post('/:id/ocr', async (req: Request, res: Response) => {
  const receipt = await prisma.receipt.findUnique({ where: { id: req.params.id } });
  if (!receipt) throw new AppError(404, 'Receipt not found');

  const path = require('path');
  const config = require('../config').config;
  const filePath = path.join(config.uploadDir, receipt.filename);

  await performOcr(receipt.id, filePath);

  const updated = await prisma.receipt.findUnique({ where: { id: req.params.id } });
  res.json(updated);
});

// Update OCR results / confirm receipt data
receiptRoutes.put('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.receipt.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Receipt not found');

  const {
    confirmedMerchant,
    confirmedDate,
    confirmedTotal,
    confirmedTax,
    ocrConfirmed,
    serviceRecordId,
    vehicleId,
  } = req.body;

  const data: any = {};
  if (confirmedMerchant !== undefined) data.confirmedMerchant = confirmedMerchant;
  if (confirmedDate !== undefined) data.confirmedDate = confirmedDate ? new Date(confirmedDate) : null;
  if (confirmedTotal !== undefined) data.confirmedTotal = confirmedTotal;
  if (confirmedTax !== undefined) data.confirmedTax = confirmedTax;
  if (ocrConfirmed !== undefined) data.ocrConfirmed = ocrConfirmed;
  if (serviceRecordId !== undefined) data.serviceRecordId = serviceRecordId;
  if (vehicleId !== undefined) data.vehicleId = vehicleId;

  const updated = await prisma.receipt.update({
    where: { id: req.params.id },
    data,
  });

  res.json(updated);
});

// Delete receipt
receiptRoutes.delete('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.receipt.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Receipt not found');

  await prisma.receipt.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
