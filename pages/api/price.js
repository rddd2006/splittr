import axios from 'axios'
export default async function handler(req, res){
  const symbol = (req.query.symbol || 'BTCUSDT').toUpperCase()
  try{
    const r = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`)
    return res.status(200).json({ price: Number(r.data.price), symbol })
  } catch (err){
    return res.status(500).json({ error: err.message })
  }
}
