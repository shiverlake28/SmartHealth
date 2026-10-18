import { describe, it, expect } from 'vitest';
import { daysOfStock, getWarnings } from './ai';

describe('ai', () => {
  it('daysOfStock', () => {
    expect(daysOfStock(100, 50)).toBe(2);
    expect(daysOfStock(10, 0)).toBe(Infinity);
  });
  it('getWarnings', () => {
    const w = getWarnings([{centerId:'c1',medicineId:'m1',qtyOnHand:5,avgDailyConsumption14d:10}], [{id:'m1',reorderPoint:2,leadTimeDays:3,criticalMin:1}], [{id:'c1'}]);
    expect(w.length).toBeGreaterThan(0);
    expect(w[0].severity).toBe('critical');
  });
});

