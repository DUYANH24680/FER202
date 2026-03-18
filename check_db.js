
const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
console.log(Object.keys(db));
