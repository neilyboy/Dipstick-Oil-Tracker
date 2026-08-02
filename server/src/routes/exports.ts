import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { AppError } from '../middleware/errorHandler';
import { generateVehiclePdf } from '../services/pdf';

export const exportRoutes = Router();

// Export vehicle service history as PDF
exportRoutes.get('/vehicle/:id/pdf', async (req: Request, res: Response) => {
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

  try {
    const pdfBuffer = await generateVehiclePdf(vehicle);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${vehicle.displayName.replace(/[^a-zA-Z0-9]/g, '_')}-service-history.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err: any) {
    console.error('PDF generation error:', err);
    throw new AppError(500, `Failed to generate PDF: ${err.message}`);
  }
});

// Export vehicle data as CSV
exportRoutes.get('/vehicle/:id/csv', async (req: Request, res: Response) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: req.params.id },
    include: {
      serviceRecords: {
        orderBy: { serviceDate: 'desc' },
      },
    },
  });

  if (!vehicle) throw new AppError(404, 'Vehicle not found');

  const headers = [
    'Date', 'Mileage', 'Service Type', 'Oil Brand', 'Oil Product',
    'Oil Viscosity', 'Oil Quantity', 'Filter Brand', 'Filter Model',
    'Performed By', 'Cost', 'Notes',
  ];

  const rows = vehicle.serviceRecords.map((s) => [
    s.serviceDate.toISOString().split('T')[0],
    s.mileage.toString(),
    s.serviceType,
    s.oilBrand || '',
    s.oilProduct || '',
    s.oilViscosity || '',
    s.oilQuantity?.toString() || '',
    s.filterBrand || '',
    s.filterModel || '',
    s.performedBy || '',
    s.cost?.toString() || '',
    `"${(s.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${vehicle.displayName.replace(/[^a-zA-Z0-9]/g, '_')}-services.csv"`
  );
  res.send(csv);
});
