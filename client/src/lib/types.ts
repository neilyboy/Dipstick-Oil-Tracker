export interface Vehicle {
  id: string;
  displayName: string;
  vin: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  engine: string | null;
  currentMileage: number | null;
  licensePlate: string | null;
  color: string | null;
  notes: string | null;
  oilType: string | null;
  oilViscosity: string | null;
  oilBrandPref: string | null;
  oilCapacity: number | null;
  filterPartNumber: string | null;
  filterBrandPref: string | null;
  crushWasherDetails: string | null;
  gasketDetails: string | null;
  intervalMiles: number | null;
  intervalMonths: number | null;
  reminderLeadMiles: number | null;
  reminderLeadDays: number | null;
  toolsRequired: string | null;
  torqueSpecs: string | null;
  jackPoints: string | null;
  drainPlugSocketSize: string | null;
  filterWrenchType: string | null;
  specialProcedures: string | null;
  tags: string | null;
  metadata: any;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  photos: VehiclePhoto[];
  serviceRecords: ServiceRecord[];
  lastService: ServiceRecord | null;
  dueStatus: DueInfo;
  serviceCount: number;
}

export interface VehiclePhoto {
  id: string;
  vehicleId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  isCover: boolean;
  sortOrder: number;
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  vehicle?: { id: string; displayName: string; make: string | null; model: string | null; year: number | null };
  serviceDate: string;
  mileage: number;
  serviceType: string;
  oilBrand: string | null;
  oilProduct: string | null;
  oilViscosity: string | null;
  oilQuantity: number | null;
  filterBrand: string | null;
  filterModel: string | null;
  performedBy: string | null;
  cost: number | null;
  receiptNumber: string | null;
  notes: string | null;
  drainPlugReplaced: boolean;
  washerReplaced: boolean;
  oilLifeReset: boolean;
  torqueUsed: string | null;
  serviceDuration: number | null;
  issuesObserved: string | null;
  leaksObserved: string | null;
  followUpWork: string | null;
  nextDueMileage: number | null;
  nextDueDate: string | null;
  nextDueMileageOverride: number | null;
  nextDueDateOverride: string | null;
  metadata: any;
  photos: ServicePhoto[];
  receipts: Receipt[];
  _count?: { photos: number; receipts: number };
}

export interface ServicePhoto {
  id: string;
  serviceRecordId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  photoType: string;
}

export interface Receipt {
  id: string;
  serviceRecordId: string | null;
  vehicleId: string | null;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  ocrProcessed: boolean;
  ocrRawText: string | null;
  ocrMerchantName: string | null;
  ocrDate: string | null;
  ocrTotal: number | null;
  ocrTax: number | null;
  ocrLineItems: any;
  ocrConfirmed: boolean;
  confirmedMerchant: string | null;
  confirmedDate: string | null;
  confirmedTotal: number | null;
  confirmedTax: number | null;
  serviceRecord?: {
    id: string;
    serviceDate: string;
    mileage: number;
    vehicle?: { id: string; displayName: string };
  };
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  partNumber: string | null;
  sku: string | null;
  barcode: string | null;
  quantity: number;
  unitType: string;
  packageSize: string | null;
  compatibleVehicleIds: string | null;
  preferredVendor: string | null;
  costPerUnit: number | null;
  purchaseCost: number | null;
  lowStockThreshold: number | null;
  storageLocation: string | null;
  notes: string | null;
  photoFilename: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  transactions?: InventoryTransaction[];
}

export interface InventoryTransaction {
  id: string;
  inventoryItemId: string;
  type: string;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  notes: string | null;
  serviceRecordId: string | null;
  createdAt: string;
}

export type ServiceStatus = 'up_to_date' | 'due_soon' | 'overdue' | 'unknown';

export interface DueInfo {
  status: ServiceStatus;
  statusLabel: string;
  nextDueMileage: number | null;
  nextDueDate: string | null;
  milesUntilDue: number | null;
  daysUntilDue: number | null;
}

export interface Reminder {
  id: string;
  vehicleId: string | null;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
}

export interface Settings {
  id: string;
  defaultIntervalMiles: number | null;
  defaultIntervalMonths: number | null;
  defaultReminderLeadMiles: number | null;
  defaultReminderLeadDays: number | null;
  notificationsEnabled: boolean;
  lowStockEnabled: boolean;
}

export interface BackupConfig {
  id: string;
  name: string;
  type: string;
  endpoint: string | null;
  bucket: string | null;
  region: string | null;
  enabled: boolean;
  lastBackupAt: string | null;
}
