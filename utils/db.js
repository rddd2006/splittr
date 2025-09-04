const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'data', 'db.json');

function read(){
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch (e){
    return { orders: [], trades: [] };
  }
}

function write(data){
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = { read, write };
