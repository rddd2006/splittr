import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { shortAddr, inrToEth, SEPOLIA } from '../../utils/web3';

// ── shortAddr ─────────────────────────────────────────────
describe('shortAddr', () => {
  it('truncates a long address', () => {
    const addr = '0x1234567890abcdef1234567890abcdef12345678';
    const result = shortAddr(addr);
    expect(result).toContain('0x1234');
    expect(result).toContain('5678');
    expect(result).toContain('…');
    expect(result.length).toBeLessThan(addr.length);
  });

  it('returns empty string for falsy input', () => {
    expect(shortAddr(null)).toBe('');
    expect(shortAddr('')).toBe('');
    expect(shortAddr(undefined)).toBe('');
  });

  it('includes first 6 chars', () => {
    const addr = '0xABCDEF1234567890';
    expect(shortAddr(addr)).toContain('0xABCD');
  });
});

// ── inrToEth ──────────────────────────────────────────────
describe('inrToEth', () => {
  it('converts INR to ETH at given rate', () => {
    // 300,000 INR per ETH → 300 INR = 0.001 ETH
    const result = inrToEth(300, 300_000);
    expect(result).toBe('0.001000');
  });

  it('returns 6 decimal places', () => {
    const result = inrToEth(1000, 300_000);
    expect(result.split('.')[1].length).toBe(6);
  });

  it('handles large amounts', () => {
    const result = inrToEth(30_000, 300_000);
    expect(result).toBe('0.100000');
  });

  it('handles small amounts', () => {
    const result = inrToEth(1, 300_000);
    expect(parseFloat(result)).toBeGreaterThan(0);
  });
});

// ── SEPOLIA constants ─────────────────────────────────────
describe('SEPOLIA config', () => {
  it('has correct chain ID hex', () => {
    expect(SEPOLIA.chainId).toBe('0xaa36a7');
  });

  it('has correct chain ID decimal as BigInt', () => {
    expect(SEPOLIA.chainIdDec).toBe(11155111n);
  });

  it('has explorer URL', () => {
    expect(SEPOLIA.explorer).toContain('sepolia.etherscan.io');
  });

  it('has faucet URL', () => {
    expect(SEPOLIA.faucet).toBeTruthy();
  });
});

// ── hasMetaMask (mocked) ──────────────────────────────────
describe('hasMetaMask', () => {
  afterEach(() => { delete window.ethereum; });

  it('returns false when window.ethereum is absent', async () => {
    delete window.ethereum;
    const { hasMetaMask } = await import('../../utils/web3');
    expect(hasMetaMask()).toBe(false);
  });

  it('returns true when window.ethereum is present', async () => {
    window.ethereum = { isMetaMask: true };
    const { hasMetaMask } = await import('../../utils/web3');
    expect(hasMetaMask()).toBe(true);
  });
});
