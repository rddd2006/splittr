import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatRelative,
  getInitials,
  stringToColor,
} from '../../utils/formatters';

describe('formatCurrency', () => {
  it('formats INR correctly', () => {
    const result = formatCurrency(1000, 'INR');
    expect(result).toContain('1,000');
    expect(result).toContain('₹');
  });

  it('formats USD correctly', () => {
    const result = formatCurrency(99.99, 'USD');
    expect(result).toContain('99.99');
    expect(result).toContain('$');
  });

  it('handles zero', () => {
    const result = formatCurrency(0, 'INR');
    expect(result).toContain('0');
  });

  it('handles large numbers', () => {
    const result = formatCurrency(1_00_000, 'INR');
    expect(result).toContain('1,00,000');
  });
});

describe('formatDate', () => {
  it('returns a formatted date string', () => {
    const result = formatDate('2025-01-15T00:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(5);
  });

  it('accepts Date objects', () => {
    const d = new Date(2025, 0, 15);
    const result = formatDate(d);
    expect(result).toContain('15');
  });
});

describe('formatRelative', () => {
  it('returns "just now" for very recent times', () => {
    const result = formatRelative(new Date());
    expect(result).toBe('just now');
  });

  it('returns minutes ago', () => {
    const d = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelative(d)).toBe('5m ago');
  });

  it('returns hours ago', () => {
    const d = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatRelative(d)).toBe('3h ago');
  });

  it('returns days ago', () => {
    const d = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(formatRelative(d)).toBe('2d ago');
  });

  it('returns formatted date for old dates', () => {
    const d = new Date(2020, 0, 1);
    const result = formatRelative(d);
    expect(result).toContain('2020');
  });
});

describe('getInitials', () => {
  it('returns two initials for a full name', () => {
    expect(getInitials('Alice Kumar')).toBe('AK');
  });

  it('returns one initial for a single name', () => {
    expect(getInitials('Bob')).toBe('B');
  });

  it('handles empty string', () => {
    expect(getInitials('')).toBe('');
  });

  it('returns uppercase', () => {
    expect(getInitials('alice kumar')).toBe('AK');
  });

  it('takes only first two words', () => {
    expect(getInitials('First Second Third')).toBe('FS');
  });
});

describe('stringToColor', () => {
  it('returns a hex color', () => {
    const color = stringToColor('Alice');
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('returns consistent color for same input', () => {
    expect(stringToColor('Bob')).toBe(stringToColor('Bob'));
  });

  it('returns different colors for different inputs', () => {
    const colors = new Set(['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Henry']
      .map(stringToColor));
    expect(colors.size).toBeGreaterThan(1);
  });

  it('handles empty string', () => {
    const color = stringToColor('');
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
