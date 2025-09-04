import { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import axios from 'axios'

const SYMBOLS = ['BTCUSDT','ETHUSDT','SOLUSDT','XRPUSDT']

export default function Home(){
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [orders, setOrders] = useState([])
  const [side, setSide] = useState('buy')
  const [size, setSize] = useState('0.001')
  const [currentPrice, setCurrentPrice] = useState(null)
  const chartRef = useRef(null)
  const candleSeriesRef = useRef(null)
  const wsRef = useRef(null)

  useEffect(()=>{ loadOrders() }, [])

  useEffect(()=>{
    let mounted = true
    // fetch current price via Binance REST
    async function loadPrice(){
      try{
        const r = await axios.get('/api/price?symbol=' + symbol)
        if(mounted) setCurrentPrice(r.data.price)
      }catch(e){}
    }
    loadPrice()
    const t = setInterval(loadPrice, 5000)
    return ()=>{ mounted=false; clearInterval(t) }
  }, [symbol])

  useEffect(()=>{
    // setup chart once
    import('lightweight-charts').then(({createChart})=>{
      if(chartRef.current) chartRef.current.innerHTML = ''
      const chart = createChart(chartRef.current, { width: 800, height: 420, layout: { backgroundColor: '#0b1b2b', textColor: '#d1e8ff' }, grid: { vertLines: { color: 'rgba(255,255,255,0.03)' }, horzLines: { color: 'rgba(255,255,255,0.03)' } } })
      const candleSeries = chart.addCandlestickSeries()
      candleSeriesRef.current = candleSeries
      // fetch historical klines from Binance
      fetchHistorical(symbol, candleSeries)
      // websocket for live kline updates
      setupWs(symbol, candleSeries)
      window.addEventListener('resize', () => chart.applyOptions({ width: chartRef.current.clientWidth }))
    })
    return ()=>{ // cleanup websocket
      if(wsRef.current) wsRef.current.close()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol])

  async function fetchHistorical(symbol, candleSeries){
    try{
      const limit = 500
      const r = await axios.get(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=${limit}`)
      const klines = r.data.map(k=>{
        return { time: Math.floor(k[0]/1000), open: Number(k[1]), high: Number(k[2]), low: Number(k[3]), close: Number(k[4]) }
      })
      candleSeries.setData(klines)
    }catch(e){ console.error('hist err', e) }
  }

  function setupWs(symbol, candleSeries){
    if(wsRef.current) wsRef.current.close()
    const s = symbol.toLowerCase()
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${s}@kline_1m`)
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data)
      const k = msg.k
      const candle = { time: Math.floor(k.t/1000), open: Number(k.o), high: Number(k.h), low: Number(k.l), close: Number(k.c) }
      candleSeries.update(candle)
      setCurrentPrice(Number(k.c))
    }
    ws.onopen = () => console.log('ws open', symbol)
    ws.onerror = (e) => console.error('ws err', e)
    wsRef.current = ws
  }

  async function loadOrders(){ const r = await fetch('/api/orders'); const d = await r.json(); setOrders(d.orders.reverse()) }
  async function place(){
    if(!currentPrice) return alert('price not ready')
    const body = { symbol, side, size: Number(size), price: currentPrice }
    const res = await fetch('/api/orders',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
    const d = await res.json()
    if(d.error) alert(d.error); else loadOrders()
  }
  async function cancel(id){ await fetch('/api/orders/' + id, { method:'DELETE' }); loadOrders() }

  return (
    <div className="container">
      <Head><title>TradeSim Live — Candles & Binance</title></Head>
      <div className="card">
        <h1>TradeSim Live</h1>
        <p className="small">Candlestick charts via Binance public API + WebSocket. Demo trading platform (no real money).</p>

        <div style={{marginTop:18}} className="grid">
          <div>
            <div className="card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div className="symbol-badge">{symbol}</div>
                  <div style={{fontSize:22,fontWeight:700,marginTop:8}}>{currentPrice ? '$' + Number(currentPrice).toFixed(2) : 'Loading...'}</div>
                  <div className="small">Live price from Binance</div>
                </div>
                <div style={{width:320}}>
                  <div style={{marginBottom:8}} className="row">
                    <select value={symbol} onChange={e=>setSymbol(e.target.value)} style={{flex:1}}>
                      {SYMBOLS.map(s=> <option key={s}>{s}</option>)}
                    </select>
                    <select value={side} onChange={e=>setSide(e.target.value)}>
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                    </select>
                  </div>

                  <div style={{marginBottom:8}} className="row">
                    <input value={size} onChange={e=>setSize(e.target.value)} />
                    <button onClick={place}>Place Order</button>
                  </div>

                  <div className="small">Orders are simulated and matched immediately if price is close.</div>
                </div>
              </div>
              <div style={{marginTop:12}} className="chart-wrap" ref={chartRef}></div>
            </div>

            <div className="card" style={{marginTop:12}}>
              <h3>Orders</h3>
              <div className="list">
                {orders.length===0 && <div className="small">No orders yet.</div>}
                {orders.map(o=>(
                  <div key={o.id} style={{display:'flex',justifyContent:'space-between',padding:10,borderBottom:'1px dashed rgba(255,255,255,0.04)',alignItems:'center'}}>
                    <div>
                      <strong>{o.symbol} · {o.side.toUpperCase()}</strong>
                      <div className="small">{o.size} @ ${Number(o.price).toFixed(2)}</div>
                      <div className="small">{new Date(o.createdAt).toLocaleString()}</div>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <div className="small">{o.status}</div>
                      {o.status==='open' && <button onClick={()=>cancel(o.id)}>Cancel</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <h3>Portfolio</h3>
              <Portfolio />
            </div>

            <div style={{height:12}} />

            <div className="card">
              <h4>Notes</h4>
              <div className="small">
                Uses Binance public REST and WebSocket — no API key required for market data. For production, get authenticated market data and use a persistent DB.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function Portfolio(){
  const [p, setP] = useState(null)
  useEffect(()=>{ let mounted=true; async function load(){ const res = await fetch('/api/portfolio'); const d = await res.json(); if(mounted) setP(d) }; load(); const t=setInterval(load,2000); return ()=>{mounted=false;clearInterval(t)} },[])
  if(!p) return <div className="small">Loading...</div>
  return (
    <div>
      <div className="small">Cash: ${Number(p.cash).toFixed(2)}</div>
      <div style={{marginTop:8}}>
        <strong>Positions</strong>
        {p.positions.length===0 && <div className="small">No positions</div>}
        {p.positions.map(pos=>(
          <div key={pos.symbol} style={{display:'flex',justifyContent:'space-between',paddingTop:8}}>
            <div>
              <div><strong>{pos.symbol}</strong></div>
              <div className="small">{pos.size} units</div>
            </div>
            <div className="small">${Number(pos.value).toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
