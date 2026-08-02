import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { AppError } from '../middleware/errorHandler';
import { calculateDueStatus } from '../utils/dueCalculations';

export const reminderRoutes = Router();

// List all reminders
reminderRoutes.get('/', async (req: Request, res: Response) => {
  const { unreadOnly } = req.query;

  const where: any = {};
  if (unreadOnly === 'true') {
    where.isRead = false;
    where.isDismissed = false;
  }

  const reminders = await prisma.reminder.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.json(reminders);
});

// Get unread count
reminderRoutes.get('/count', async (_req: Request, res: Response) => {
  const count = await prisma.reminder.count({
    where: { isRead: false, isDismissed: false },
  });
  res.json({ count });
});

// Mark reminder as read
reminderRoutes.put('/:id/read', async (req: Request, res: Response) => {
  const reminder = await prisma.reminder.update({
    where: { id: req.params.id },
    data: { isRead: true },
  });
  res.json(reminder);
});

// Mark all as read
reminderRoutes.put('/read-all', async (_req: Request, res: Response) => {
  await prisma.reminder.updateMany({
    where: { isRead: false },
    data: { isRead: true },
  });
  res.json({ success: true });
});

// Dismiss reminder
reminderRoutes.put('/:id/dismiss', async (req: Request, res: Response) => {
  const reminder = await prisma.reminder.update({
    where: { id: req.params.id },
    data: { isDismissed: true, dismissedAt: new Date() },
  });
  res.json(reminder);
});

// Generate reminders (called periodically or on-demand)
reminderRoutes.post('/generate', async (_req: Request, res: Response) => {
  const vehicles = await prisma.vehicle.findMany({
    where: { archived: false },
    include: {
      serviceRecords: {
        orderBy: { serviceDate: 'desc' },
        take: 1,
      },
    },
  });

  const generated: any[] = [];

  for (const vehicle of vehicles) {
    const lastService = vehicle.serviceRecords[0] || null;
    const due = calculateDueStatus(
      vehicle.currentMileage,
      lastService?.mileage ?? null,
      lastService?.serviceDate ?? null,
      vehicle.intervalMiles,
      vehicle.intervalMonths,
      vehicle.reminderLeadMiles,
      vehicle.reminderLeadDays,
      lastService?.nextDueMileageOverride ?? null,
      lastService?.nextDueDateOverride ?? null
    );

    if (due.status === 'overdue') {
      const existing = await prisma.reminder.findFirst({
        where: {
          vehicleId: vehicle.id,
          type: 'oil_change_overdue',
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      });

      if (!existing) {
        const reminder = await prisma.reminder.create({
          data: {
            vehicleId: vehicle.id,
            type: 'oil_change_overdue',
            title: `${vehicle.displayName} - Oil Change Overdue`,
            message: due.milesUntilDue !== null && due.milesUntilDue < 0
              ? `Overdue by ${Math.abs(due.milesUntilDue).toLocaleString()} miles`
              : due.daysUntilDue !== null && due.daysUntilDue < 0
                ? `Overdue by ${Math.abs(due.daysUntilDue)} days`
                : 'Oil change is overdue',
          },
        });
        generated.push(reminder);
      }
    } else if (due.status === 'due_soon') {
      const existing = await prisma.reminder.findFirst({
        where: {
          vehicleId: vehicle.id,
          type: 'oil_change_due',
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      });

      if (!existing) {
        const reminder = await prisma.reminder.create({
          data: {
            vehicleId: vehicle.id,
            type: 'oil_change_due',
            title: `${vehicle.displayName} - Oil Change Due Soon`,
            message: due.milesUntilDue !== null
              ? `Due in ${due.milesUntilDue.toLocaleString()} miles`
              : due.daysUntilDue !== null
                ? `Due in ${due.daysUntilDue} days`
                : 'Oil change is due soon',
          },
        });
        generated.push(reminder);
      }
    }
  }

  // Check low stock inventory
  const lowStockItems = await prisma.inventoryItem.findMany({
    where: {
      archived: false,
      lowStockThreshold: { not: null },
    },
  });

  for (const item of lowStockItems) {
    if (Number(item.quantity) <= Number(item.lowStockThreshold ?? 0)) {
      const existing = await prisma.reminder.findFirst({
        where: {
          type: 'low_stock',
          title: { contains: item.name },
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      if (!existing) {
        const reminder = await prisma.reminder.create({
          data: {
            type: 'low_stock',
            title: `Low Stock: ${item.name}`,
            message: `Only ${item.quantity} ${item.unitType}(s) remaining (threshold: ${item.lowStockThreshold})`,
          },
        });
        generated.push(reminder);
      }
    }
  }

  res.json({ generated: generated.length, reminders: generated });
});
