const db = require('../../utils/db')
module.exports = function handler(req, res){
  const data = db.read()
  const trades = data.trades || []
  const posMap = {}
  trades.forEach(t=>{
    const s = t.symbol
    posMap[s] = posMap[s] || 0
    posMap[s] += (t.side === 'buy' ? 1 : -1) * Number(t.size)
  })
  const positions = Object.keys(posMap).map(sym=>({
    symbol: sym,
    size: posMap[sym],
    value: posMap[sym] * 0
  })).filter(p=>p.size !== 0)
  let cash = 100000
  trades.forEach(t=>{
    if(t.side === 'buy') cash -= t.price * t.size
    else cash += t.price * t.size
  })
  res.status(200).json({ cash, positions })
}
