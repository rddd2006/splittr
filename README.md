# 💸 SettleUp — Web3 Expense Splitting App

> Split bills. Settle debts. Pay with GPay or Ethereum. No drama.

SettleUp is a full-stack expense management app with **AI bill scanning**, **Ethereum Sepolia payments**, **MetaMask login**, and **group invite codes** — built with React, Node.js, PostgreSQL, Redis, and Nginx load balancing.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📧 **Email Auth** | Register/login with email + password |
| 🦊 **Wallet Auth** | Sign in with MetaMask (EIP-191 signature) |
| 👥 **Groups** | Create groups, invite by unique 8-char code |
| 🔗 **Join Codes** | Share `ABCD-EFGH` — anyone can join instantly |
| 💰 **Expenses** | Add, split equally, by %, or exact amounts |
| 📷 **AI Bill Scan** | AI extracts line items from receipt photos |
| ⚖️ **Smart Settle** | Minimum-transaction algorithm clears all debts |
| 📱 **GPay Button** | Opens any UPI app on mobile, shows modal on desktop |
| ⬡ **ETH Payments** | Pay settlements in Sepolia ETH via MetaMask |
| 📊 **Analytics** | Spending charts, per-member pie, monthly trends |
| 🛡️ **Rate Limiting** | 7 tiers — Redis-backed, auth/API/expense/settlement |
| ⚖️ **Load Balancer** | Nginx upstream across 3 backend replicas |

---

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Tailwind CSS, Recharts, ethers.js v6 |
| Backend | Node.js 20, Express, Prisma ORM, Zod validation |
| Database | PostgreSQL 15 |
| Cache / Rate Limit | Redis 7 |
| Load Balancer | Nginx (3 backend replicas, least_conn, proxy cache) |
| Auth | JWT (15m access + 7d refresh) + EIP-191 wallet login |
| CI/CD | GitHub Actions (lint → test → Docker build → deploy) |
| Blockchain | Ethereum Sepolia Testnet (chain ID 11155111) |

---

## 🚀 Quick Start

```bash
git clone https://github.com/your-org/splittr.git
cd splittr
make setup        # copies .env and starts Docker

# App:      http://localhost
# API:      http://localhost/api
# Demo:     alice@example.com / password123
```

Or manually:

```bash
cp .env.example .env  # fill in your secrets
docker-compose up --build
```

---

## 🦊 MetaMask / Ethereum Auth

### Login flow
1. Click **Connect Wallet** on the login page
2. MetaMask prompts you to sign a challenge message
3. Backend verifies the EIP-191 signature — no gas, no blockchain tx
4. JWT tokens issued; your wallet address is your identity

### Linking a wallet to an existing account
Settings → Link Wallet (available in the sidebar once logged in)

### Sepolia Payments
- Click **Pay with ETH** on any settlement
- App fetches live ETH/INR rate from CoinGecko
- Confirms the amount in a modal
- MetaMask opens for approval → Sepolia testnet tx sent
- Settlement recorded with tx hash + Etherscan link

**Get test ETH:** https://sepoliafaucet.com

---

## 🔗 Group Invite Codes

Every group gets a unique 8-character code (e.g. `ABCD-EFGH`):

- **Share:** Members tab → copy or share the invite code
- **Join:** Groups page → "Join with Invite Code" → enter code
- **Rotate:** Admin can regenerate the code (old one is invalidated)

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register with email |
| POST | `/api/auth/login` | Email login |
| GET  | `/api/web3/nonce?address=0x…` | Get sign challenge |
| POST | `/api/web3/verify` | Verify wallet signature |
| POST | `/api/web3/link` | Link wallet to account |

### Groups
| Method | Endpoint | Description |
|---|---|---|
| GET  | `/api/groups` | List my groups |
| POST | `/api/groups` | Create group |
| POST | `/api/groups/join` | Join by invite code |
| GET  | `/api/groups/:id` | Group detail |
| POST | `/api/groups/:id/regenerate-code` | Rotate invite code |
| GET  | `/api/groups/:id/settlement-plan` | Minimum tx plan |

### Expenses & Settlements
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/groups/:id/expenses` | Add expense |
| POST | `/api/settlements` | Record settlement (GPay / ETH / manual) |

---

## 🧪 Tests

```bash
make test              # all tests
make test-unit         # backend unit (splitService, settlementService, web3Service, rateLimiter)
make test-integration  # backend API tests (needs Postgres + Redis)
make test-frontend     # React component + util tests
```

**Coverage targets:** 65% lines / 65% functions

---

## ⚙️ DevOps

### Local dev topology
```
Browser
  └─► Nginx :80  ──────► Vite dev server :5173
           └─── /api ──► backend_1, backend_2, backend_3 :4000
                              └─► Postgres :5432
                              └─► Redis    :6379
```

### Production topology
```
Internet
  └─► Nginx :443 (SSL, rate limit, proxy cache)
           └─── /api ──► upstream backend_pool (3 replicas)
                              └─► Postgres (named volume)
                              └─► Redis (auth + rate limit)
```

### GitHub Actions
- **`ci.yml`** — every PR: lint → unit tests → integration tests (Postgres + Redis services) → Docker build
- **`deploy.yml`** — merge to main: build → push GHCR → SSH deploy → health check

---

## 🔐 Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Access token signing key (min 32 chars) |
| `JWT_REFRESH_SECRET` | Refresh token signing key |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma-separated |
| `VITE_API_URL` | Frontend → backend API base URL |
| `SERVER_NAME` | Production domain (for Nginx SSL) |

---

## 📄 License

MIT © Splittr Team
