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


