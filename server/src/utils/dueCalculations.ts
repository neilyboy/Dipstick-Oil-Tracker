export type ServiceStatus = 'up_to_date' | 'due_soon' | 'overdue' | 'unknown';

export interface DueInfo {
  status: ServiceStatus;
  statusLabel: string;
  nextDueMileage: number | null;
  nextDueDate: Date | null;
  milesUntilDue: number | null;
  daysUntilDue: number | null;
}

export function calculateDueStatus(
  currentMileage: number | null,
  lastServiceMileage: number | null,
  lastServiceDate: Date | null,
  intervalMiles: number | null,
  intervalMonths: number | null,
  reminderLeadMiles: number | null,
  reminderLeadDays: number | null,
  nextDueMileageOverride: number | null,
  nextDueDateOverride: Date | null
): DueInfo {
  const nextDueMileage = nextDueMileageOverride ?? 
    (lastServiceMileage && intervalMiles ? lastServiceMileage + intervalMiles : null);
  
  const nextDueDate = nextDueDateOverride ? new Date(nextDueDateOverride) :
    (lastServiceDate && intervalMonths ? addMonths(lastServiceDate, intervalMonths) : null);

  if (!nextDueMileage && !nextDueDate) {
    return {
      status: 'unknown',
      statusLabel: 'Unknown',
      nextDueMileage: null,
      nextDueDate: null,
      milesUntilDue: null,
      daysUntilDue: null,
    };
  }

  const milesUntilDue = (currentMileage && nextDueMileage) ? nextDueMileage - currentMileage : null;
  const daysUntilDue = nextDueDate ? daysBetween(new Date(), nextDueDate) : null;

  const leadMiles = reminderLeadMiles ?? intervalMiles ? Math.floor((intervalMiles ?? 0) * 0.1) : 500;
  const leadDays = reminderLeadDays ?? intervalMonths ? Math.floor((intervalMonths ?? 0) * 30 * 0.1) : 14;

  // Overdue checks
  const mileageOverdue = milesUntilDue !== null && milesUntilDue < 0;
  const dateOverdue = daysUntilDue !== null && daysUntilDue < 0;

  if (mileageOverdue || dateOverdue) {
    return {
      status: 'overdue',
      statusLabel: 'Overdue',
      nextDueMileage,
      nextDueDate,
      milesUntilDue,
      daysUntilDue,
    };
  }

  // Due soon checks
  const mileageSoon = milesUntilDue !== null && milesUntilDue <= leadMiles;
  const dateSoon = daysUntilDue !== null && daysUntilDue <= leadDays;

  if (mileageSoon || dateSoon) {
    return {
      status: 'due_soon',
      statusLabel: 'Due Soon',
      nextDueMileage,
      nextDueDate,
      milesUntilDue,
      daysUntilDue,
    };
  }

  return {
    status: 'up_to_date',
    statusLabel: 'Up to Date',
    nextDueMileage,
    nextDueDate,
    milesUntilDue,
    daysUntilDue,
  };
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
