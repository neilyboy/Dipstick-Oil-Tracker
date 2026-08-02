import { z } from 'zod';

export const vehicleSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(200),
  vin: z.string().max(17).optional().nullable(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  make: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  trim: z.string().max(100).optional().nullable(),
  engine: z.string().max(100).optional().nullable(),
  currentMileage: z.number().int().min(0).optional().nullable(),
  licensePlate: z.string().max(20).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),

  oilType: z.string().max(100).optional().nullable(),
  oilViscosity: z.string().max(50).optional().nullable(),
  oilBrandPref: z.string().max(100).optional().nullable(),
  oilCapacity: z.number().min(0).optional().nullable(),
  filterPartNumber: z.string().max(100).optional().nullable(),
  filterBrandPref: z.string().max(100).optional().nullable(),
  crushWasherDetails: z.string().max(200).optional().nullable(),
  gasketDetails: z.string().max(200).optional().nullable(),
  intervalMiles: z.number().int().min(0).optional().nullable(),
  intervalMonths: z.number().int().min(0).optional().nullable(),
  reminderLeadMiles: z.number().int().min(0).optional().nullable(),
  reminderLeadDays: z.number().int().min(0).optional().nullable(),

  toolsRequired: z.string().max(2000).optional().nullable(),
  torqueSpecs: z.string().max(2000).optional().nullable(),
  jackPoints: z.string().max(1000).optional().nullable(),
  drainPlugSocketSize: z.string().max(50).optional().nullable(),
  filterWrenchType: z.string().max(100).optional().nullable(),
  specialProcedures: z.string().max(2000).optional().nullable(),

  tags: z.string().max(1000).optional().nullable(),
  metadata: z.any().optional().nullable(),
});

export const serviceRecordSchema = z.object({
  vehicleId: z.string().uuid(),
  serviceDate: z.string().or(z.date()),
  mileage: z.number().int().min(0),
  serviceType: z.string().default('oil_change'),

  oilBrand: z.string().max(100).optional().nullable(),
  oilProduct: z.string().max(200).optional().nullable(),
  oilViscosity: z.string().max(50).optional().nullable(),
  oilQuantity: z.number().min(0).optional().nullable(),

  filterBrand: z.string().max(100).optional().nullable(),
  filterModel: z.string().max(100).optional().nullable(),

  performedBy: z.string().max(200).optional().nullable(),
  cost: z.number().min(0).optional().nullable(),
  receiptNumber: z.string().max(100).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),

  drainPlugReplaced: z.boolean().optional(),
  washerReplaced: z.boolean().optional(),
  oilLifeReset: z.boolean().optional(),
  torqueUsed: z.string().max(100).optional().nullable(),
  serviceDuration: z.number().int().min(0).optional().nullable(),
  issuesObserved: z.string().max(2000).optional().nullable(),
  leaksObserved: z.string().max(1000).optional().nullable(),
  followUpWork: z.string().max(1000).optional().nullable(),

  nextDueMileageOverride: z.number().int().min(0).optional().nullable(),
  nextDueDateOverride: z.string().optional().nullable(),

  metadata: z.any().optional().nullable(),
});

export const inventoryItemSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().default('other'),
  brand: z.string().max(100).optional().nullable(),
  partNumber: z.string().max(100).optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
  barcode: z.string().max(100).optional().nullable(),
  quantity: z.number().min(0).default(0),
  unitType: z.string().default('each'),
  packageSize: z.string().max(50).optional().nullable(),
  compatibleVehicleIds: z.string().max(500).optional().nullable(),
  preferredVendor: z.string().max(200).optional().nullable(),
  costPerUnit: z.number().min(0).optional().nullable(),
  purchaseCost: z.number().min(0).optional().nullable(),
  lowStockThreshold: z.number().min(0).optional().nullable(),
  storageLocation: z.string().max(200).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const settingsSchema = z.object({
  defaultIntervalMiles: z.number().int().min(0).optional().nullable(),
  defaultIntervalMonths: z.number().int().min(0).optional().nullable(),
  defaultReminderLeadMiles: z.number().int().min(0).optional().nullable(),
  defaultReminderLeadDays: z.number().int().min(0).optional().nullable(),
  notificationsEnabled: z.boolean().optional(),
  lowStockEnabled: z.boolean().optional(),
});

export function validateVin(vin: string): boolean {
  // Basic VIN validation: 17 characters, no I/O/Q
  if (!vin || vin.length !== 17) return false;
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin.toUpperCase());
}
