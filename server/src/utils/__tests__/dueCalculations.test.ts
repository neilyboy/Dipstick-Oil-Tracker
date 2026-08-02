import { describe, it, expect } from 'vitest';
import { calculateDueStatus } from '../dueCalculations';

// Use today-relative dates so tests don't break over time
const today = new Date();
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d;
};

describe('calculateDueStatus', () => {
  it('returns unknown when no intervals or last service', () => {
    const result = calculateDueStatus(null, null, null, null, null, null, null, null, null);
    expect(result.status).toBe('unknown');
    expect(result.nextDueMileage).toBeNull();
  });

  it('returns up_to_date when within intervals', () => {
    const result = calculateDueStatus(
      45000, // current mileage
      44000, // last service mileage
      daysAgo(30), // serviced 30 days ago
      5000,  // interval miles (due at 49000)
      6,     // interval months
      500,   // reminder lead miles
      30,    // reminder lead days
      null,  // no override
      null
    );

    expect(result.status).toBe('up_to_date');
    expect(result.nextDueMileage).toBe(49000);
  });

  it('returns overdue when mileage exceeded', () => {
    const result = calculateDueStatus(
      51000,
      44000,
      daysAgo(30),
      5000,
      6,
      500,
      30,
      null,
      null
    );

    expect(result.status).toBe('overdue');
    expect(result.milesUntilDue).toBeLessThan(0);
  });

  it('returns due_soon when within reminder threshold', () => {
    const result = calculateDueStatus(
      48700,
      44000,
      daysAgo(30),
      5000,
      6,
      500,
      30,
      null,
      null
    );

    expect(result.status).toBe('due_soon');
    expect(result.milesUntilDue).toBe(300);
  });

  it('returns overdue when date exceeded', () => {
    const result = calculateDueStatus(
      45000,
      44000,
      daysAgo(400), // serviced 400 days ago, interval is 6 months (~180 days)
      5000,
      6,
      500,
      30,
      null,
      null
    );

    expect(result.status).toBe('overdue');
  });

  it('uses overrides when provided', () => {
    const futureDate = new Date(today);
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const result = calculateDueStatus(
      45000,
      44000,
      daysAgo(30),
      5000,
      6,
      500,
      30,
      52000, // override mileage
      futureDate // override date
    );

    expect(result.nextDueMileage).toBe(52000);
  });

  it('handles missing mileage gracefully', () => {
    const result = calculateDueStatus(
      null,
      44000,
      daysAgo(30),
      5000,
      6,
      500,
      30,
      null,
      null
    );

    // With no current mileage, only date-based checks apply (30 days ago + 6 months = still up to date)
    expect(result.milesUntilDue).toBeNull();
    expect(result.status).not.toBe('unknown');
  });
});
