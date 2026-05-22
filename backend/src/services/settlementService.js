/**
 * Settlement Service
 * Algorithms for calculating balances and minimizing transactions.
 */

/**
 * Calculate net balance for each member of a group.
 * Positive = owed money. Negative = owes money.
 *
 * @param {object} group - Group with members, expenses, splits, settlements
 * @returns {{ userId: string, name: string, balance: number }[]}
 */
const calculateBalances = (group) => {
  const balanceMap = {};

  // Initialize all members at 0
  for (const member of group.members) {
    balanceMap[member.user.id] = { userId: member.user.id, name: member.user.name, balance: 0 };
  }

  // Add expense contributions: payer gets credited, split members get debited
  for (const expense of group.expenses) {
    const amount = parseFloat(expense.amount);
    if (balanceMap[expense.paidById]) {
      balanceMap[expense.paidById].balance += amount;
    }
    for (const split of expense.splits) {
      if (balanceMap[split.userId]) {
        balanceMap[split.userId].balance -= parseFloat(split.amount);
      }
    }
  }

  // Apply settlements
  for (const settlement of group.settlements) {
    const amount = parseFloat(settlement.amount);
    if (balanceMap[settlement.fromUserId]) {
      balanceMap[settlement.fromUserId].balance += amount; // sender's debt reduced
    }
    if (balanceMap[settlement.toUserId]) {
      balanceMap[settlement.toUserId].balance -= amount; // receiver credited less
    }
  }

  return Object.values(balanceMap).map((b) => ({
    ...b,
    balance: parseFloat(b.balance.toFixed(2)),
  }));
};

/**
 * Minimize the number of transactions needed to settle all balances.
 * Uses a greedy algorithm: largest creditor receives from largest debtor.
 *
 * @param {{ userId: string, name: string, balance: number }[]} balances
 * @returns {{ from: { userId, name }, to: { userId, name }, amount: number }[]}
 */
const minimizeTransactions = (balances) => {
  const transactions = [];

  // Deep copy to avoid mutation
  const people = balances.map((b) => ({ ...b }));

  // Separate into creditors (owed money) and debtors (owe money)
  const creditors = people.filter((p) => p.balance > 0.01).sort((a, b) => b.balance - a.balance);
  const debtors = people.filter((p) => p.balance < -0.01).sort((a, b) => a.balance - b.balance);

  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = Math.min(creditor.balance, -debtor.balance);

    if (amount > 0.01) {
      transactions.push({
        from: { userId: debtor.userId, name: debtor.name },
        to: { userId: creditor.userId, name: creditor.name },
        amount: parseFloat(amount.toFixed(2)),
      });
    }

    creditor.balance -= amount;
    debtor.balance += amount;

    if (Math.abs(creditor.balance) < 0.01) ci++;
    if (Math.abs(debtor.balance) < 0.01) di++;
  }

  return transactions;
};

module.exports = { calculateBalances, minimizeTransactions };
