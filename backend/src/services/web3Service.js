/**
 * Web3 Service — Ethereum signature verification & nonce management
 *
 * Auth flow:
 *  1. Client requests nonce for address  →  GET /api/web3/nonce?address=0x...
 *  2. Client signs the challenge message  →  MetaMask prompt
 *  3. Client sends { address, signature }  →  POST /api/web3/verify
 *  4. Server verifies signature, creates/finds user, returns JWT tokens
 */

const { ethers } = require('ethers');
const prisma = require('../config/database');
const crypto = require('crypto');

/** Sepolia chain ID */
const SEPOLIA_CHAIN_ID = 11155111;

/**
 * Build the deterministic sign-in message.
 * Changing this format is a breaking change for existing clients.
 */
const buildSignMessage = (address, nonce) =>
  `Welcome to Splittr!\n\nSign this message to authenticate your wallet.\nThis request will not trigger a blockchain transaction or cost any gas.\n\nWallet: ${address}\nNonce: ${nonce}`;

/**
 * Generate a random nonce and persist it in the DB with a 5-minute TTL.
 * @param {string} address - checksummed or lowercase ETH address
 * @returns {{ nonce: string, message: string }}
 */
const createNonce = async (address) => {
  const normalised = address.toLowerCase();
  const nonce = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.web3Nonce.upsert({
    where:  { address: normalised },
    update: { nonce, expiresAt },
    create: { address: normalised, nonce, expiresAt },
  });

  return { nonce, message: buildSignMessage(address, nonce) };
};

/**
 * Verify an EIP-191 personal_sign signature and return the recovered address.
 * Throws if the signature is invalid or the nonce is expired/wrong.
 *
 * @param {string} address   - address claimed by the client
 * @param {string} signature - hex signature from MetaMask
 * @returns {string} verified lowercase address
 */
const verifySignature = async (address, signature) => {
  const normalised = address.toLowerCase();

  // 1. Fetch nonce from DB
  const record = await prisma.web3Nonce.findUnique({ where: { address: normalised } });
  if (!record) throw Object.assign(new Error('No nonce found — request a new challenge'), { statusCode: 400 });
  if (record.expiresAt < new Date()) {
    await prisma.web3Nonce.delete({ where: { address: normalised } });
    throw Object.assign(new Error('Nonce expired — request a new challenge'), { statusCode: 400 });
  }

  // 2. Recover signer address
  const message = buildSignMessage(address, record.nonce);
  const recovered = ethers.verifyMessage(message, signature);

  if (recovered.toLowerCase() !== normalised) {
    throw Object.assign(new Error('Signature verification failed'), { statusCode: 401 });
  }

  // 3. Invalidate nonce (one-time use)
  await prisma.web3Nonce.delete({ where: { address: normalised } });

  return normalised;
};

/**
 * Validate that a string looks like an Ethereum address.
 * @param {string} address
 * @returns {boolean}
 */
const isValidAddress = (address) => ethers.isAddress(address);

module.exports = { createNonce, verifySignature, isValidAddress, SEPOLIA_CHAIN_ID, buildSignMessage };
