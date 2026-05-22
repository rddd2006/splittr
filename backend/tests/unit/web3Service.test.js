/**
 * Web3 Service Unit Tests
 * Tests signature verification logic, nonce lifecycle, and validation helpers.
 * The Prisma client is mocked so no real DB is required.
 */

const { jest } = require('@jest/globals');

// ── Mock Prisma before requiring web3Service ──────────────
const mockPrisma = {
  web3Nonce: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
};
jest.mock('../../src/config/database', () => mockPrisma);

// ── Mock ethers ───────────────────────────────────────────
jest.mock('ethers', () => ({
  ethers: {
    verifyMessage: jest.fn(),
    isAddress: jest.fn(),
  },
}));

const { ethers } = require('ethers');
const { createNonce, verifySignature, isValidAddress, buildSignMessage } = require('../../src/services/web3Service');

// ── buildSignMessage ──────────────────────────────────────
describe('buildSignMessage', () => {
  it('includes the address and nonce', () => {
    const msg = buildSignMessage('0xABC', 'abc123');
    expect(msg).toContain('0xABC');
    expect(msg).toContain('abc123');
    expect(msg).toContain('SettleUp');
  });

  it('is deterministic for same inputs', () => {
    const m1 = buildSignMessage('0x1234', 'nonce1');
    const m2 = buildSignMessage('0x1234', 'nonce1');
    expect(m1).toBe(m2);
  });

  it('changes when nonce changes', () => {
    const m1 = buildSignMessage('0x1234', 'nonce1');
    const m2 = buildSignMessage('0x1234', 'nonce2');
    expect(m1).not.toBe(m2);
  });
});

// ── isValidAddress ────────────────────────────────────────
describe('isValidAddress', () => {
  it('delegates to ethers.isAddress', () => {
    ethers.isAddress.mockReturnValueOnce(true);
    expect(isValidAddress('0x1234')).toBe(true);
    expect(ethers.isAddress).toHaveBeenCalledWith('0x1234');
  });

  it('returns false for non-address strings', () => {
    ethers.isAddress.mockReturnValueOnce(false);
    expect(isValidAddress('not-an-address')).toBe(false);
  });
});

// ── createNonce ───────────────────────────────────────────
describe('createNonce', () => {
  beforeEach(() => jest.clearAllMocks());

  it('persists a nonce record with TTL', async () => {
    mockPrisma.web3Nonce.upsert.mockResolvedValue({});
    const result = await createNonce('0xAbCd1234');
    expect(result).toHaveProperty('nonce');
    expect(result).toHaveProperty('message');
    expect(result.message).toContain(result.nonce);
    expect(mockPrisma.web3Nonce.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where:  { address: '0xabcd1234' },
        update: expect.objectContaining({ nonce: result.nonce }),
        create: expect.objectContaining({ address: '0xabcd1234', nonce: result.nonce }),
      })
    );
  });

  it('normalises address to lowercase', async () => {
    mockPrisma.web3Nonce.upsert.mockResolvedValue({});
    await createNonce('0xABCDEF');
    expect(mockPrisma.web3Nonce.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { address: '0xabcdef' } })
    );
  });

  it('sets expiry ~5 minutes in the future', async () => {
    mockPrisma.web3Nonce.upsert.mockResolvedValue({});
    const before = Date.now();
    await createNonce('0x123');
    const call = mockPrisma.web3Nonce.upsert.mock.calls[0][0];
    const expiry = call.create.expiresAt.getTime();
    expect(expiry).toBeGreaterThan(before + 4 * 60 * 1000);
    expect(expiry).toBeLessThan(before + 6 * 60 * 1000);
  });
});

// ── verifySignature ───────────────────────────────────────
describe('verifySignature', () => {
  const ADDR = '0xdeadbeef12345678';
  const SIG  = '0xsignature';

  beforeEach(() => jest.clearAllMocks());

  it('throws when no nonce record exists', async () => {
    mockPrisma.web3Nonce.findUnique.mockResolvedValue(null);
    await expect(verifySignature(ADDR, SIG)).rejects.toThrow('No nonce found');
  });

  it('throws when nonce is expired', async () => {
    mockPrisma.web3Nonce.findUnique.mockResolvedValue({
      nonce: 'abc', expiresAt: new Date(Date.now() - 1000),
    });
    mockPrisma.web3Nonce.delete.mockResolvedValue({});
    await expect(verifySignature(ADDR, SIG)).rejects.toThrow('expired');
    expect(mockPrisma.web3Nonce.delete).toHaveBeenCalled();
  });

  it('throws when recovered address does not match', async () => {
    mockPrisma.web3Nonce.findUnique.mockResolvedValue({
      nonce: 'abc', expiresAt: new Date(Date.now() + 60000),
    });
    ethers.verifyMessage.mockReturnValue('0xDIFFERENTADDRESS');
    await expect(verifySignature(ADDR, SIG)).rejects.toThrow('Signature verification failed');
  });

  it('returns normalised address on valid signature', async () => {
    const nonce = 'thenonce';
    mockPrisma.web3Nonce.findUnique.mockResolvedValue({
      nonce, expiresAt: new Date(Date.now() + 60000),
    });
    ethers.verifyMessage.mockReturnValue(ADDR.toLowerCase());
    mockPrisma.web3Nonce.delete.mockResolvedValue({});

    const result = await verifySignature(ADDR, SIG);
    expect(result).toBe(ADDR.toLowerCase());
    expect(mockPrisma.web3Nonce.delete).toHaveBeenCalledWith({ where: { address: ADDR.toLowerCase() } });
  });

  it('deletes nonce after successful verification (one-time use)', async () => {
    mockPrisma.web3Nonce.findUnique.mockResolvedValue({
      nonce: 'xyz', expiresAt: new Date(Date.now() + 60000),
    });
    ethers.verifyMessage.mockReturnValue(ADDR.toLowerCase());
    mockPrisma.web3Nonce.delete.mockResolvedValue({});

    await verifySignature(ADDR, SIG);
    expect(mockPrisma.web3Nonce.delete).toHaveBeenCalledTimes(1);
  });
});
