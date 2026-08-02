import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { vehicleSchema } from '../utils/validation';
import { AppError } from '../middleware/errorHandler';
import { upload } from '../middleware/upload';
import { calculateDueStatus } from '../utils/dueCalculations';

export const vehicleRoutes = Router();

// List all vehicles with due status
vehicleRoutes.get('/', async (req: Request, res: Response) => {
  const { search, status, sort, archived } = req.query;

  const where: any = { archived: archived === 'true' };

  if (search) {
    where.OR = [
      { displayName: { contains: search as string, mode: 'insensitive' } },
      { vin: { contains: search as string, mode: 'insensitive' } },
      { make: { contains: search as string, mode: 'insensitive' } },
      { model: { contains: search as string, mode: 'insensitive' } },
      { licensePlate: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  let orderBy: any = { updatedAt: 'desc' };
  if (sort === 'name') orderBy = { displayName: 'asc' };
  if (sort === 'mileage') orderBy = { currentMileage: 'desc' };
  if (sort === 'newest') orderBy = { createdAt: 'desc' };

  const vehicles = await prisma.vehicle.findMany({
    where,
    orderBy,
    include: {
      photos: { where: { isCover: true }, take: 1 },
      serviceRecords: {
        orderBy: { serviceDate: 'desc' },
        take: 1,
      },
      _count: { select: { serviceRecords: true } },
    },
  });

  const vehiclesWithStatus = vehicles.map((v) => {
    const lastService = v.serviceRecords[0] || null;
    const due = calculateDueStatus(
      v.currentMileage,
      lastService?.mileage ?? null,
      lastService?.serviceDate ?? null,
      v.intervalMiles,
      v.intervalMonths,
      v.reminderLeadMiles,
      v.reminderLeadDays,
      lastService?.nextDueMileageOverride ?? null,
      lastService?.nextDueDateOverride ?? null
    );

    return {
      ...v,
      lastService,
      dueStatus: due,
      serviceCount: v._count.serviceRecords,
      _count: undefined,
    };
  });

  // Filter by status if requested
  let result = vehiclesWithStatus;
  if (status && status !== 'all') {
    result = vehiclesWithStatus.filter((v) => v.dueStatus.status === status);
  }

  res.json(result);
});

// Get single vehicle
vehicleRoutes.get('/:id', async (req: Request, res: Response) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: req.params.id },
    include: {
      photos: { orderBy: { sortOrder: 'asc' } },
      serviceRecords: {
        orderBy: { serviceDate: 'desc' },
        include: {
          photos: true,
          receipts: true,
        },
      },
    },
  });

  if (!vehicle) throw new AppError(404, 'Vehicle not found');

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

  res.json({ ...vehicle, lastService, dueStatus: due });
});

// Create vehicle
vehicleRoutes.post('/', async (req: Request, res: Response) => {
  const data = vehicleSchema.parse(req.body);
  const vehicle = await prisma.vehicle.create({ data: data as any });
  res.status(201).json(vehicle);
});

// Update vehicle
vehicleRoutes.put('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Vehicle not found');

  const data = vehicleSchema.partial().parse(req.body);
  const vehicle = await prisma.vehicle.update({
    where: { id: req.params.id },
    data: data as any,
  });
  res.json(vehicle);
});

// Delete vehicle
vehicleRoutes.delete('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Vehicle not found');

  await prisma.vehicle.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// Upload vehicle photo
vehicleRoutes.post('/:id/photos', upload.single('photo'), async (req: Request, res: Response) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!vehicle) throw new AppError(404, 'Vehicle not found');
  if (!req.file) throw new AppError(400, 'No photo uploaded');

  const isCover = req.body.isCover === 'true';
  if (isCover) {
    await prisma.vehiclePhoto.updateMany({
      where: { vehicleId: req.params.id },
      data: { isCover: false },
    });
  }

  const maxOrder = await prisma.vehiclePhoto.findFirst({
    where: { vehicleId: req.params.id },
    orderBy: { sortOrder: 'desc' },
  });

  const photo = await prisma.vehiclePhoto.create({
    data: {
      vehicleId: req.params.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      isCover,
      sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
    },
  });

  res.status(201).json(photo);
});

// Delete vehicle photo
vehicleRoutes.delete('/:id/photos/:photoId', async (req: Request, res: Response) => {
  const photo = await prisma.vehiclePhoto.findFirst({
    where: { id: req.params.photoId, vehicleId: req.params.id },
  });
  if (!photo) throw new AppError(404, 'Photo not found');

  await prisma.vehiclePhoto.delete({ where: { id: req.params.photoId } });
  res.status(204).send();
});

// Set cover photo
vehicleRoutes.put('/:id/photos/:photoId/cover', async (req: Request, res: Response) => {
  await prisma.vehiclePhoto.updateMany({
    where: { vehicleId: req.params.id },
    data: { isCover: false },
  });
  await prisma.vehiclePhoto.update({
    where: { id: req.params.photoId },
    data: { isCover: true },
  });
  res.json({ success: true });
});

// Get due status for a specific vehicle
vehicleRoutes.get('/:id/due-status', async (req: Request, res: Response) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: req.params.id },
    include: {
      serviceRecords: {
        orderBy: { serviceDate: 'desc' },
        take: 1,
      },
    },
  });

  if (!vehicle) throw new AppError(404, 'Vehicle not found');

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

  res.json(due);
});

// VIN Decode using NHTSA public API
vehicleRoutes.get('/decode-vin/:vin', async (req: Request, res: Response) => {
  const { vin } = req.params;

  if (!vin || vin.length !== 17) {
    throw new AppError(400, 'VIN must be exactly 17 characters');
  }

  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`
    );
    const data = await response.json() as { Results?: Array<{ Variable: string; Value: string }> };

    if (!data.Results || data.Results.length === 0) {
      throw new AppError(404, 'No data found for this VIN');
    }

    // Extract relevant fields from NHTSA response
    const results = data.Results;
    const getValue = (name: string): string | null => {
      const r = results.find((v) => v.Variable === name);
      return r?.Value && r.Value.trim() !== '' && r.Value !== 'Not Applicable' ? r.Value.trim() : null;
    };

    const decoded = {
      year: parseInt(getValue('Model Year') || '0') || null,
      make: getValue('Make'),
      model: getValue('Model'),
      trim: getValue('Trim'),
      engine: getValue('Engine Model') || getValue('Engine Configuration'),
      engineDisplacement: getValue('Displacement (L)'),
      engineCylinders: getValue('Engine Number of Cylinders'),
      fuelType: getValue('Fuel Type - Primary'),
      driveType: getValue('Drive Type'),
      transmission: getValue('Transmission Style'),
      bodyClass: getValue('Body Class'),
      vehicleType: getValue('Vehicle Type'),
      manufacturer: getValue('Manufacturer Name'),
      plantCountry: getValue('Plant Country'),
      doors: getValue('Doors'),
      // Try to build a useful engine string
      engineSummary: [
        getValue('Displacement (L)'),
        getValue('Engine Configuration'),
        getValue('Engine Model'),
      ].filter(Boolean).join(' ') || null,
    };

    // Try to determine oil-related specs from engine data
    const engineLiters = parseFloat(getValue('Displacement (L)') || '0');
    let estimatedOilCapacity: number | null = null;
    if (engineLiters > 0) {
      // Rough estimate: most engines take ~1-1.5 quarts per liter of displacement
      estimatedOilCapacity = Math.round(engineLiters * 1.3 * 10) / 10;
    }

    res.json({
      ...decoded,
      estimatedOilCapacity,
      rawResults: results,
    });
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.error('VIN decode error:', err);
    throw new AppError(502, 'Failed to decode VIN. The NHTSA service may be unavailable.');
  }
});
