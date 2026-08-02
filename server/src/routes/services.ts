import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { serviceRecordSchema } from '../utils/validation';
import { AppError } from '../middleware/errorHandler';
import { upload } from '../middleware/upload';

export const serviceRoutes = Router();

// List all service records (with optional vehicle filter)
serviceRoutes.get('/', async (req: Request, res: Response) => {
  const { vehicleId, limit, offset } = req.query;

  const where: any = {};
  if (vehicleId) where.vehicleId = vehicleId as string;

  const [records, total] = await Promise.all([
    prisma.serviceRecord.findMany({
      where,
      orderBy: { serviceDate: 'desc' },
      take: limit ? parseInt(limit as string) : 50,
      skip: offset ? parseInt(offset as string) : 0,
      include: {
        vehicle: { select: { id: true, displayName: true, make: true, model: true, year: true } },
        photos: { take: 1 },
        receipts: { take: 1 },
        _count: { select: { photos: true, receipts: true } },
      },
    }),
    prisma.serviceRecord.count({ where }),
  ]);

  res.json({ records, total });
});

// Get single service record
serviceRoutes.get('/:id', async (req: Request, res: Response) => {
  const record = await prisma.serviceRecord.findUnique({
    where: { id: req.params.id },
    include: {
      vehicle: true,
      photos: true,
      receipts: true,
    },
  });

  if (!record) throw new AppError(404, 'Service record not found');
  res.json(record);
});

// Create service record
serviceRoutes.post('/', async (req: Request, res: Response) => {
  const data = serviceRecordSchema.parse({
    ...req.body,
    serviceDate: new Date(req.body.serviceDate),
  });

  // Verify vehicle exists
  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
  if (!vehicle) throw new AppError(404, 'Vehicle not found');

  // Calculate next due values from vehicle intervals
  const nextDueMileage = data.nextDueMileageOverride ??
    (vehicle.intervalMiles ? data.mileage + vehicle.intervalMiles : null);
  
  const serviceDate = new Date(data.serviceDate);
  const nextDueDate = data.nextDueDateOverride ? new Date(data.nextDueDateOverride) :
    (vehicle.intervalMonths ? addMonths(serviceDate, vehicle.intervalMonths) : null);

  const record = await prisma.serviceRecord.create({
    data: {
      ...data,
      serviceDate,
      nextDueMileage,
      nextDueDate,
      nextDueDateOverride: data.nextDueDateOverride ? new Date(data.nextDueDateOverride) : null,
    } as any,
  });

  // Optionally update vehicle mileage if this is newer
  if (data.mileage && (!vehicle.currentMileage || data.mileage > vehicle.currentMileage)) {
    await prisma.vehicle.update({
      where: { id: data.vehicleId },
      data: { currentMileage: data.mileage },
    });
  }

  res.status(201).json(record);
});

// Update service record
serviceRoutes.put('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.serviceRecord.findUnique({
    where: { id: req.params.id },
    include: { vehicle: true },
  });
  if (!existing) throw new AppError(404, 'Service record not found');

  const data = serviceRecordSchema.partial().parse(req.body);

  const updateData: any = { ...data };
  if (data.serviceDate) updateData.serviceDate = new Date(data.serviceDate);
  if (data.nextDueDateOverride) updateData.nextDueDateOverride = new Date(data.nextDueDateOverride);

  // Recalculate next due if mileage changed and no override
  if (data.mileage && !data.nextDueMileageOverride && existing.vehicle.intervalMiles) {
    updateData.nextDueMileage = data.mileage + existing.vehicle.intervalMiles;
  }

  const record = await prisma.serviceRecord.update({
    where: { id: req.params.id },
    data: updateData,
  });

  res.json(record);
});

// Delete service record
serviceRoutes.delete('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.serviceRecord.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Service record not found');

  await prisma.serviceRecord.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// Upload service photo
serviceRoutes.post('/:id/photos', upload.single('photo'), async (req: Request, res: Response) => {
  const record = await prisma.serviceRecord.findUnique({ where: { id: req.params.id } });
  if (!record) throw new AppError(404, 'Service record not found');
  if (!req.file) throw new AppError(400, 'No photo uploaded');

  const photo = await prisma.servicePhoto.create({
    data: {
      serviceRecordId: req.params.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      photoType: req.body.photoType || 'general',
    },
  });

  res.status(201).json(photo);
});

// Delete service photo
serviceRoutes.delete('/:id/photos/:photoId', async (req: Request, res: Response) => {
  const photo = await prisma.servicePhoto.findFirst({
    where: { id: req.params.photoId, serviceRecordId: req.params.id },
  });
  if (!photo) throw new AppError(404, 'Photo not found');

  await prisma.servicePhoto.delete({ where: { id: req.params.photoId } });
  res.status(204).send();
});

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
