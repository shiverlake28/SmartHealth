import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('joins truthy classes', () => {
    expect(cn('a', false, 'b', undefined, 'c')).toBe('a b c');
  });
  it('supports conditional and array syntax', () => {
    expect(cn(['a', 'b'], { c: true, d: false })).toBe('a b c');
  });
});
