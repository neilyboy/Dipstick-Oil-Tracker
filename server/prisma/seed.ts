import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create settings
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      defaultIntervalMiles: 5000,
      defaultIntervalMonths: 6,
      defaultReminderLeadMiles: 500,
      defaultReminderLeadDays: 30,
      notificationsEnabled: true,
      lowStockEnabled: true,
    },
  });

  // Create vehicles
  const tacoma = await prisma.vehicle.create({
    data: {
      displayName: 'Toyota Tacoma',
      vin: '3TMCZ5AN0LM123456',
      year: 2020,
      make: 'Toyota',
      model: 'Tacoma',
      trim: 'TRD Off-Road',
      engine: '3.5L V6 2GR-FKS',
      currentMileage: 45000,
      licensePlate: 'ABC1234',
      color: 'Cement Gray',
      oilType: 'Full Synthetic',
      oilViscosity: '0W-20',
      oilBrandPref: 'Mobil 1',
      oilCapacity: 6.2,
      filterPartNumber: '90915-YZZN1',
      filterBrandPref: 'Toyota OEM',
      intervalMiles: 5000,
      intervalMonths: 6,
      reminderLeadMiles: 500,
      reminderLeadDays: 30,
      drainPlugSocketSize: '14mm',
      torqueSpecs: 'Oil drain plug: 30 ft-lbs',
      notes: 'Daily driver. Off-road use occasionally. Check skid plate bolts at each oil change.',
      tags: JSON.stringify(['truck', 'off-road', 'daily']),
    },
  });

  const miata = await prisma.vehicle.create({
    data: {
      displayName: 'Mazda Miata',
      vin: 'JM1NDAD71M0456789',
      year: 2021,
      make: 'Mazda',
      model: 'MX-5 Miata',
      trim: 'Club',
      engine: '2.0L SkyActiv-G',
      currentMileage: 15000,
      licensePlate: 'ZOOM123',
      color: 'Soul Red Crystal',
      oilType: 'Full Synthetic',
      oilViscosity: '0W-20',
      oilBrandPref: 'Castrol Edge',
      oilCapacity: 4.5,
      filterPartNumber: '1WPE-14-302',
      filterBrandPref: 'Mazda OEM',
      intervalMiles: 5000,
      intervalMonths: 6,
      reminderLeadMiles: 500,
      reminderLeadDays: 30,
      drainPlugSocketSize: '17mm',
      torqueSpecs: 'Oil drain plug: 25-30 ft-lbs',
      notes: 'Weekend car. Summer driving only. Stored winters.',
      tags: JSON.stringify(['convertible', 'weekend', 'sports-car']),
    },
  });

  const crv = await prisma.vehicle.create({
    data: {
      displayName: 'Honda CR-V',
      vin: '5J6RW2H58ML012345',
      year: 2021,
      make: 'Honda',
      model: 'CR-V',
      trim: 'EX-L',
      engine: '1.5L Turbo',
      currentMileage: 32000,
      licensePlate: 'FAMCAR1',
      color: 'Modern Steel',
      oilType: 'Full Synthetic',
      oilViscosity: '0W-20',
      oilBrandPref: 'Pennzoil Platinum',
      oilCapacity: 3.7,
      filterPartNumber: '15400-PLM-A02',
      filterBrandPref: 'Honda OEM',
      intervalMiles: 7500,
      intervalMonths: 12,
      reminderLeadMiles: 1000,
      reminderLeadDays: 45,
      drainPlugSocketSize: '17mm',
      torqueSpecs: 'Oil drain plug: 30 ft-lbs',
      notes: 'Family vehicle. Follows maintenance minder system.',
      tags: JSON.stringify(['suv', 'family', 'daily']),
    },
  });

  // Create service records
  await prisma.serviceRecord.create({
    data: {
      vehicleId: tacoma.id,
      serviceDate: new Date('2024-12-15'),
      mileage: 44000,
      serviceType: 'oil_change',
      oilBrand: 'Mobil 1',
      oilProduct: 'Mobil 1 Extended Performance',
      oilViscosity: '0W-20',
      oilQuantity: 6.2,
      filterBrand: 'Toyota OEM',
      filterModel: '90915-YZZN1',
      performedBy: 'self',
      cost: 45.99,
      notes: 'Used ramps in garage. No issues. Oil looked clean at drain.',
      drainPlugReplaced: false,
      washerReplaced: true,
      oilLifeReset: true,
      nextDueMileage: 49000,
      nextDueDate: new Date('2025-06-15'),
    },
  });

  await prisma.serviceRecord.create({
    data: {
      vehicleId: miata.id,
      serviceDate: new Date('2024-10-01'),
      mileage: 14000,
      serviceType: 'oil_change',
      oilBrand: 'Castrol Edge',
      oilProduct: 'Castrol Edge Full Synthetic',
      oilViscosity: '0W-20',
      oilQuantity: 4.5,
      filterBrand: 'Mazda OEM',
      filterModel: '1WPE-14-302',
      performedBy: 'self',
      cost: 38.50,
      notes: 'Pre-winter storage prep. Drained and filled.',
      drainPlugReplaced: false,
      washerReplaced: true,
      oilLifeReset: true,
      nextDueMileage: 19000,
      nextDueDate: new Date('2025-04-01'),
    },
  });

  await prisma.serviceRecord.create({
    data: {
      vehicleId: crv.id,
      serviceDate: new Date('2024-11-20'),
      mileage: 31000,
      serviceType: 'oil_change',
      oilBrand: 'Pennzoil Platinum',
      oilProduct: 'Pennzoil Platinum Full Synthetic',
      oilViscosity: '0W-20',
      oilQuantity: 3.7,
      filterBrand: 'Honda OEM',
      filterModel: '15400-PLM-A02',
      performedBy: 'self',
      cost: 32.75,
      notes: 'Regular service. MM indicated 15% oil life remaining.',
      drainPlugReplaced: false,
      washerReplaced: true,
      oilLifeReset: true,
      nextDueMileage: 38500,
      nextDueDate: new Date('2025-11-20'),
    },
  });

  // Create inventory items
  await prisma.inventoryItem.createMany({
    data: [
      {
        name: 'Mobil 1 0W-20 Full Synthetic (5 qt jug)',
        category: 'oil',
        brand: 'Mobil 1',
        partNumber: '120769',
        quantity: 3,
        unitType: 'jug',
        lowStockThreshold: 1,
        storageLocation: 'Garage shelf A',
        costPerUnit: 27.99,
        compatibleVehicleIds: tacoma.id,
      },
      {
        name: 'Castrol Edge 0W-20 Full Synthetic (5 qt jug)',
        category: 'oil',
        brand: 'Castrol',
        partNumber: '1598B2',
        quantity: 1,
        unitType: 'jug',
        lowStockThreshold: 1,
        storageLocation: 'Garage shelf A',
        costPerUnit: 26.50,
        compatibleVehicleIds: miata.id,
      },
      {
        name: 'Pennzoil Platinum 0W-20 (5 qt jug)',
        category: 'oil',
        brand: 'Pennzoil',
        partNumber: '550046906',
        quantity: 2,
        unitType: 'jug',
        lowStockThreshold: 1,
        storageLocation: 'Garage shelf A',
        costPerUnit: 25.97,
        compatibleVehicleIds: crv.id,
      },
      {
        name: 'Toyota Oil Filter 90915-YZZN1',
        category: 'filter',
        brand: 'Toyota OEM',
        partNumber: '90915-YZZN1',
        quantity: 4,
        unitType: 'each',
        lowStockThreshold: 2,
        storageLocation: 'Parts bin B',
        costPerUnit: 7.49,
        compatibleVehicleIds: tacoma.id,
      },
      {
        name: 'Mazda Oil Filter 1WPE-14-302',
        category: 'filter',
        brand: 'Mazda OEM',
        partNumber: '1WPE-14-302',
        quantity: 2,
        unitType: 'each',
        lowStockThreshold: 1,
        storageLocation: 'Parts bin B',
        costPerUnit: 9.95,
        compatibleVehicleIds: miata.id,
      },
      {
        name: 'Honda Oil Filter 15400-PLM-A02',
        category: 'filter',
        brand: 'Honda OEM',
        partNumber: '15400-PLM-A02',
        quantity: 3,
        unitType: 'each',
        lowStockThreshold: 1,
        storageLocation: 'Parts bin B',
        costPerUnit: 8.25,
        compatibleVehicleIds: crv.id,
      },
      {
        name: 'Crush Washers (M14) - 10 pack',
        category: 'washer',
        brand: 'Dorman',
        partNumber: '095-148',
        quantity: 8,
        unitType: 'each',
        lowStockThreshold: 5,
        storageLocation: 'Small parts drawer',
        costPerUnit: 0.50,
      },
      {
        name: 'Shop Towels (box)',
        category: 'supply',
        brand: 'Scott',
        quantity: 2,
        unitType: 'box',
        lowStockThreshold: 1,
        storageLocation: 'Under workbench',
        costPerUnit: 12.99,
      },
      {
        name: 'Funnel Set',
        category: 'tool',
        brand: 'FloTool',
        quantity: 1,
        unitType: 'set',
        storageLocation: 'Tool chest drawer 3',
        costPerUnit: 14.99,
      },
    ],
  });

  console.log('Seed data created successfully!');
  console.log(`Created ${3} vehicles with service records and ${9} inventory items`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
