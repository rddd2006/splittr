const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { createNonce, verifySignature, isValidAddress } = require('../services/web3Service');

const generateTokens = (userId) => ({
  accessToken:  jwt.sign({ userId }, process.env.JWT_SECRET,         { expiresIn: process.env.JWT_EXPIRES_IN  || '15m' }),
  refreshToken: jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }),
});

/**
 * GET /api/web3/nonce?address=0x...
 * Returns a one-time challenge message the wallet must sign.
 */
const getNonce = async (req, res, next) => {
  try {
    const { address } = req.query;
    if (!address || !isValidAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }
    const { nonce, message } = await createNonce(address);
    res.json({ nonce, message });
  } catch (err) { next(err); }
};

/**
 * POST /api/web3/verify
 * Body: { address, signature, name? }
 * Verifies the signature, creates/finds user, returns JWT pair.
 */
const verifyWallet = async (req, res, next) => {
  try {
    const { address, signature, name } = req.body;
    if (!address || !signature) {
      return res.status(400).json({ error: 'address and signature are required' });
    }

    const verifiedAddress = await verifySignature(address, signature);

    // Short human-friendly name from address
    const defaultName = `${verifiedAddress.slice(0, 6)}…${verifiedAddress.slice(-4)}`;

    // Find or create user by wallet address
    let user = await prisma.user.findUnique({ where: { walletAddress: verifiedAddress } });

    if (!user) {
      // Also check if a traditional account with same email exists (edge case)
      const fallbackEmail = `${verifiedAddress}@wallet.splittr`;
      user = await prisma.user.create({
        data: {
          email:         fallbackEmail,
          name:          name || defaultName,
          passwordHash:  '',           // no password for wallet accounts
          walletAddress: verifiedAddress,
        },
      });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser, accessToken, refreshToken });
  } catch (err) { next(err); }
};

/**
 * POST /api/web3/link
 * Links a wallet address to an existing (email-based) account.
 * Requires the user to already be authenticated via JWT.
 */
const linkWallet = async (req, res, next) => {
  try {
    const { address, signature } = req.body;
    const verifiedAddress = await verifySignature(address, signature);

    const conflict = await prisma.user.findUnique({ where: { walletAddress: verifiedAddress } });
    if (conflict && conflict.id !== req.user.userId) {
      return res.status(409).json({ error: 'Wallet already linked to another account' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data:  { walletAddress: verifiedAddress },
      select: { id: true, email: true, name: true, walletAddress: true },
    });

    res.json(user);
  } catch (err) { next(err); }
};

/**
 * DELETE /api/web3/link
 * Unlinks the wallet from the current account.
 */
const unlinkWallet = async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.userId },
      data:  { walletAddress: null },
    });
    res.json({ message: 'Wallet unlinked' });
  } catch (err) { next(err); }
};

module.exports = { getNonce, verifyWallet, linkWallet, unlinkWallet };
