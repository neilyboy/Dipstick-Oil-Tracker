import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { inventoryItemSchema } from '../utils/validation';
import { AppError } from '../middleware/errorHandler';
import { upload } from '../middleware/upload';

export const inventoryRoutes = Router();

// List all inventory items
inventoryRoutes.get('/', async (req: Request, res: Response) => {
  const { category, search, lowStock, archived } = req.query;

  const where: any = { archived: archived === 'true' };

  if (category && category !== 'all') {
    where.category = category as string;
  }

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { brand: { contains: search as string, mode: 'insensitive' } },
      { partNumber: { contains: search as string, mode: 'insensitive' } },
      { barcode: { contains: search as string, mode: 'insensitive' } },
      { sku: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  let items = await prisma.inventoryItem.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  });

  // Filter low stock: quantity <= lowStockThreshold
  if (lowStock === 'true') {
    items = items.filter(
      (item) =>
        item.lowStockThreshold !== null &&
        Number(item.quantity) <= Number(item.lowStockThreshold)
    );
  }

  res.json(items);
});

// Get single inventory item
inventoryRoutes.get('/:id', async (req: Request, res: Response) => {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: req.params.id },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!item) throw new AppError(404, 'Inventory item not found');
  res.json(item);
});

// Create inventory item
inventoryRoutes.post('/', async (req: Request, res: Response) => {
  const data = inventoryItemSchema.parse(req.body);
  const item = await prisma.inventoryItem.create({ data: data as any });

  // Record initial transaction
  if (Number(data.quantity) > 0) {
    await prisma.inventoryTransaction.create({
      data: {
        inventoryItemId: item.id,
        type: 'add',
        quantity: data.quantity,
        previousQuantity: 0,
        newQuantity: data.quantity,
        notes: 'Initial stock',
      },
    });
  }

  res.status(201).json(item);
});

// Update inventory item
inventoryRoutes.put('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.inventoryItem.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Inventory item not found');

  const data = inventoryItemSchema.partial().parse(req.body);
  const item = await prisma.inventoryItem.update({
    where: { id: req.params.id },
    data: data as any,
  });
  res.json(item);
});

// Delete inventory item (archive)
inventoryRoutes.delete('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.inventoryItem.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Inventory item not found');

  await prisma.inventoryItem.update({
    where: { id: req.params.id },
    data: { archived: true },
  });
  res.status(204).send();
});

// Adjust quantity
inventoryRoutes.post('/:id/adjust', async (req: Request, res: Response) => {
  const { quantity, type, notes } = req.body;
  const item = await prisma.inventoryItem.findUnique({ where: { id: req.params.id } });
  if (!item) throw new AppError(404, 'Inventory item not found');

  const previousQuantity = Number(item.quantity);
  let newQuantity: number;

  if (type === 'add') {
    newQuantity = previousQuantity + Number(quantity);
  } else if (type === 'remove') {
    newQuantity = Math.max(0, previousQuantity - Number(quantity));
  } else if (type === 'set') {
    newQuantity = Number(quantity);
  } else {
    throw new AppError(400, 'Invalid adjustment type. Use add, remove, or set.');
  }

  const [updatedItem, transaction] = await prisma.$transaction([
    prisma.inventoryItem.update({
      where: { id: req.params.id },
      data: { quantity: newQuantity },
    }),
    prisma.inventoryTransaction.create({
      data: {
        inventoryItemId: req.params.id,
        type,
        quantity: Number(quantity),
        previousQuantity,
        newQuantity,
        notes: notes || null,
      },
    }),
  ]);

  res.json({ item: updatedItem, transaction });
});

// Upload inventory photo
inventoryRoutes.post('/:id/photo', upload.single('photo'), async (req: Request, res: Response) => {
  const item = await prisma.inventoryItem.findUnique({ where: { id: req.params.id } });
  if (!item) throw new AppError(404, 'Inventory item not found');
  if (!req.file) throw new AppError(400, 'No photo uploaded');

  const updated = await prisma.inventoryItem.update({
    where: { id: req.params.id },
    data: { photoFilename: req.file.filename },
  });

  res.json(updated);
});

// Get summary stats
inventoryRoutes.get('/stats/summary', async (_req: Request, res: Response) => {
  const [total, lowStock, categories] = await Promise.all([
    prisma.inventoryItem.count({ where: { archived: false } }),
    prisma.inventoryItem.findMany({
      where: {
        archived: false,
        lowStockThreshold: { not: null },
      },
    }),
    prisma.inventoryItem.groupBy({
      by: ['category'],
      where: { archived: false },
      _count: true,
    }),
  ]);

  const lowStockCount = lowStock.filter(
    (i) => Number(i.quantity) <= Number(i.lowStockThreshold ?? 0)
  ).length;

  res.json({ total, lowStockCount, categories });
});
