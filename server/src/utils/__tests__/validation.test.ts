import { describe, it, expect } from 'vitest';
import { validateVin } from '../validation';

describe('validateVin', () => {
  it('validates correct VIN format', () => {
    expect(validateVin('3TMCZ5AN0LM123456')).toBe(true);
    expect(validateVin('JM1NDAD71M0456789')).toBe(true);
    expect(validateVin('5J6RW2H58ML012345')).toBe(true);
  });

  it('rejects VINs with I, O, or Q', () => {
    expect(validateVin('3TMCZ5AN0LM12345I')).toBe(false);
    expect(validateVin('3TMCZ5AN0LM12345O')).toBe(false);
    expect(validateVin('3TMCZ5AN0LM12345Q')).toBe(false);
  });

  it('rejects VINs with wrong length', () => {
    expect(validateVin('ABC123')).toBe(false);
    expect(validateVin('3TMCZ5AN0LM1234567')).toBe(false);
    expect(validateVin('')).toBe(false);
  });

  it('accepts VINs regardless of case (uppercased internally)', () => {
    // The function uppercases input before validation, so lowercase is fine
    expect(validateVin('3tmcz5an0lm123456')).toBe(true);
  });
});
