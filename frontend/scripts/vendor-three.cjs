// Copia apenas os módulos usados pelo navegador; o Flask não precisa de bundler.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
fs.mkdirSync(path.join(root, 'vendor'), { recursive: true });
for (const name of ['three.module.js', 'three.core.js']) {
  fs.copyFileSync(path.join(root, 'node_modules/three/build', name), path.join(root, 'vendor', name));
}
fs.copyFileSync(path.join(root, 'node_modules/three/LICENSE'), path.join(root, 'vendor/THREE-LICENSE.txt'));
