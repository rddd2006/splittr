const db = require('../../utils/db')
module.exports = function handler(req, res){
  const data = db.read()
  res.status(200).json({ trades: data.trades || [] })
}
