const fs = require('node:fs');
const path = require('node:path');
const { gerarCampanha } = require('../src/maze');
fs.writeFileSync(path.join(__dirname, '../../backend/app/levels.json'), JSON.stringify(gerarCampanha(), null, 2) + '\n');
console.log('Dez fases reproduzíveis geradas em backend/app/levels.json.');
