const { gerarCampanha, estadoInicial, aplicarComando } = require('../src/maze');
const fs = require('node:fs');
const path = require('node:path');
const niveis = JSON.parse(fs.readFileSync(path.join(__dirname, '../../backend/app/levels.json'), 'utf8'));

function caminho(nivel) {
  const fila = [{ ...nivel.inicio, rota: [] }];
  const vistos = new Set([`${nivel.inicio.x},${nivel.inicio.y}`]);
  const vetores = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  for (let i = 0; i < fila.length; i++) {
    const atual = fila[i];
    if (atual.x === nivel.meta.x && atual.y === nivel.meta.y) return atual.rota;
    vetores.forEach(([dx, dy], direcao) => {
      const x = atual.x + dx, y = atual.y + dy, chave = `${x},${y}`;
      if (nivel.mapa[y]?.[x] === '.' && !vistos.has(chave)) {
        vistos.add(chave); fila.push({ x, y, rota: [...atual.rota, direcao] });
      }
    });
  }
  throw new Error('Labirinto sem saída');
}

test('dez fases reproduzíveis, maiores e com caminhos mínimos crescentes', () => {
  expect(gerarCampanha()).toEqual(niveis);
  expect(niveis).toHaveLength(10);
  niveis.forEach((nivel, i) => {
    expect(nivel.tamanho).toBe(7 + 2 * i);
    expect(nivel.mapa).toHaveLength(nivel.tamanho);
    expect(nivel.mapa.every(linha => linha.length === nivel.tamanho)).toBe(true);
    expect(caminho(nivel)).toHaveLength(nivel.minimo_movimentos);
    if (i) expect(nivel.minimo_movimentos).toBeGreaterThan(niveis[i - 1].minimo_movimentos);
  });
});

test.each(niveis.map(n => [n.id, n]))('fase %i pode ser concluída pelos comandos reais', (_, nivel) => {
  let estado = estadoInicial(nivel);
  for (const direcao of caminho(nivel)) {
    while (estado.direcao !== direcao) estado = aplicarComando(nivel, estado, 'direita');
    estado = aplicarComando(nivel, estado, 'frente');
  }
  expect(estado.concluido).toBe(true);
  expect(estado.movimentos).toBe(nivel.minimo_movimentos);
  expect(aplicarComando(nivel, estado, 'tras')).toBe(estado);
});

test('virar não desloca o personagem e andar segue a orientação', () => {
  const nivel = niveis[0];
  const inicio = estadoInicial(nivel);
  const direita = aplicarComando(nivel, inicio, 'direita');
  expect(direita).toMatchObject({ x: inicio.x, y: inicio.y, movimentos: 0, direcao: (inicio.direcao + 1) % 4 });
  expect(aplicarComando(nivel, direita, 'esquerda')).toEqual(inicio);
  const frente = aplicarComando(nivel, inicio, 'frente');
  expect(frente.movimentos).toBe(1);
  expect(aplicarComando(nivel, frente, 'tras')).toMatchObject({ x: inicio.x, y: inicio.y });
});

test('paredes, bordas e comandos desconhecidos não deslocam nem contam movimento', () => {
  const nivel = niveis[0];
  const inicio = { ...estadoInicial(nivel), direcao: 0 };
  expect(aplicarComando(nivel, inicio, 'frente')).toBe(inicio);
  expect(aplicarComando(nivel, inicio, 'voar')).toBe(inicio);
  const borda = { ...inicio, x: 0, y: 0 };
  expect(aplicarComando(nivel, borda, 'frente')).toBe(borda);
});
