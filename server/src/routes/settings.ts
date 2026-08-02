import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { settingsSchema } from '../utils/validation';

export const settingsRoutes = Router();

// Get settings
settingsRoutes.get('/', async (_req: Request, res: Response) => {
  let settings = await prisma.settings.findUnique({ where: { id: 'default' } });

  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: 'default' },
    });
  }

  res.json(settings);
});

// Update settings
settingsRoutes.put('/', async (req: Request, res: Response) => {
  const data = settingsSchema.parse(req.body);

  const settings = await prisma.settings.upsert({
    where: { id: 'default' },
    update: data as any,
    create: { id: 'default', ...data } as any,
  });

  res.json(settings);
});

// Push subscription management
settingsRoutes.post('/push-subscribe', async (req: Request, res: Response) => {
  const { endpoint, keys } = req.body;

  if (!endpoint || !keys) {
    return res.status(400).json({ error: 'endpoint and keys required' });
  }

  const existing = await prisma.pushSubscription.findUnique({
    where: { endpoint },
  });

  if (existing) {
    const updated = await prisma.pushSubscription.update({
      where: { endpoint },
      data: { keys },
    });
    return res.json(updated);
  }

  const subscription = await prisma.pushSubscription.create({
    data: { endpoint, keys },
  });

  res.status(201).json(subscription);
});

settingsRoutes.post('/push-unsubscribe', async (req: Request, res: Response) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: 'endpoint required' });

  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  res.json({ success: true });
});
