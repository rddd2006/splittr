const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
};

const register = async (req, res, next) => {
  try {
    const { email, name, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, name, passwordHash },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    const { accessToken, refreshToken } = generateTokens(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const { accessToken, refreshToken } = generateTokens(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const { accessToken, refreshToken: newRefresh } = generateTokens(decoded.userId);

    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({ data: { token: newRefresh, userId: decoded.userId, expiresAt } });

    res.json({ accessToken, refreshToken: newRefresh });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, name: true, avatar: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refresh, logout, me };
