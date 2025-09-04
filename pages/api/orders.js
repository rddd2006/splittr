const { v4: uuid } = require('uuid')
const db = require('../../utils/db')
function now(){ return new Date().toISOString() }
module.exports = async function handler(req, res){
  if(req.method === 'GET'){
    const data = db.read()
    return res.status(200).json({ orders: data.orders || [] })
  }
  if(req.method === 'POST'){
    const { symbol, side, size, price } = req.body
    if(!symbol || !side || !size || !price) return res.status(400).json({ error: 'missing fields' })
    const data = db.read()
    const order = { id: uuid(), symbol, side, size:Number(size), price:Number(price), status:'open', createdAt: now() }
    data.orders = data.orders || []
    data.orders.push(order)
    // attempt immediate match: if within 0.5% of price
    const threshold = Number(price) * 0.005
    data.trades = data.trades || []
    if(Math.abs(order.price - Number(price)) <= threshold){
      order.status = 'filled'
      const trade = { id: uuid(), orderId: order.id, symbol: order.symbol, side: order.side, size: order.size, price: order.price, createdAt: now() }
      data.trades.push(trade)
    }
    db.write(data)
    return res.status(201).json({ order })
  }
  res.status(405).end()
}
