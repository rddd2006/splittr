/**
 * Split Service
 * Core business logic for splitting expenses between members.
 */

/**
 * Split an amount equally among a list of user IDs.
 * Uses banker's rounding to handle remainders accurately.
 *
 * @param {number} amount - Total expense amount
 * @param {string[]} userIds - Array of user IDs
 * @returns {{ userId: string, amount: number }[]}
 */
const calculateEqualSplit = (amount, userIds) => {
  if (!userIds || userIds.length === 0) {
    throw new Error('At least one user is required for splitting');
  }
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  const n = userIds.length;
  const base = Math.floor((amount * 100) / n) / 100;
  const remainder = Math.round(amount * 100 - base * 100 * n);

  return userIds.map((userId, index) => ({
    userId,
    amount: index < remainder ? parseFloat((base + 0.01).toFixed(2)) : parseFloat(base.toFixed(2)),
  }));
};

/**
 * Split an amount based on user-defined percentages.
 *
 * @param {number} amount - Total expense amount
 * @param {{ userId: string, percentage: number }[]} splits
 * @returns {{ userId: string, amount: number, percentage: number }[]}
 */
const calculatePercentageSplit = (amount, splits) => {
  if (!splits || splits.length === 0) {
    throw new Error('Splits are required for percentage splitting');
  }

  const totalPercentage = splits.reduce((sum, s) => sum + (s.percentage || 0), 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error(`Percentages must sum to 100 (got ${totalPercentage})`);
  }

  return splits.map((s) => ({
    userId: s.userId,
    percentage: s.percentage,
    amount: parseFloat(((amount * s.percentage) / 100).toFixed(2)),
  }));
};

/**
 * Validate exact splits sum to the total amount.
 *
 * @param {number} amount - Total expense amount
 * @param {{ userId: string, amount: number }[]} splits
 * @returns boolean
 */
const validateExactSplit = (amount, splits) => {
  const total = splits.reduce((sum, s) => sum + (s.amount || 0), 0);
  return Math.abs(total - amount) < 0.01;
};

module.exports = { calculateEqualSplit, calculatePercentageSplit, validateExactSplit };
