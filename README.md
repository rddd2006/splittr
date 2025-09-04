# TradeSim Live — Candlesticks + Binance Market Data

This starter integrates Binance public REST and WebSocket for real market data, and shows candlestick charts using `lightweight-charts`.

## Features
- Historical klines fetched from Binance REST (`/api/v3/klines`).
- Live kline updates via Binance WebSocket (`wss://stream.binance.com:9443/ws/<symbol>@kline_1m`).
- Candlestick chart rendered with `lightweight-charts`.
- Simulated order placement, matching, trades, and a simple portfolio (stored in `data/db.json` locally).

## Run locally
1. Install:
```bash
npm install
```
2. Dev:
```bash
npm run dev
```
3. Open http://localhost:3000

## Deploy to Vercel
- Push the repo to GitHub and import into Vercel. Client-side connects directly to Binance public WebSocket; no API keys required for market data. Use a real DB for production.

## Important
- This is for demo/learning only. Do not use with real funds or in production without security, persistence, and compliance.
# trade-live
