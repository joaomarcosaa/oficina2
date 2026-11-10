/* Regras independentes da renderização: também utilizadas nos testes. */
(function (root) {
  const TOTAL_FASES = 10;
  const VETORES = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];

  function estadoInicial(nivel) {
    return { x: nivel.inicio.x, y: nivel.inicio.y, direcao: nivel.inicio.direcao,
      movimentos: 0, concluido: false };
  }

  function aplicarComando(nivel, estado, comando) {
    if (estado.concluido) return estado;
    if (comando === 'esquerda' || comando === 'direita') {
      return { ...estado, direcao: (estado.direcao + (comando === 'direita' ? 1 : 3)) % 4 };
    }
    if (comando !== 'frente' && comando !== 'tras') return estado;
    const vetor = VETORES[estado.direcao];
    const sinal = comando === 'frente' ? 1 : -1;
    const x = estado.x + vetor.x * sinal;
    const y = estado.y + vetor.y * sinal;
    if (nivel.mapa[y]?.[x] !== '.') return estado;
    return { ...estado, x, y, movimentos: estado.movimentos + 1,
      concluido: x === nivel.meta.x && y === nivel.meta.y };
  }

  // Busca em profundidade com semente: cada fase tem um labirinto reproduzível.
  function gerarNivel(fase, semente = fase * 7937) {
    if (!Number.isInteger(fase) || fase < 1 || fase > TOTAL_FASES) throw new RangeError('Fase inválida');
    const tamanho = 7 + (fase - 1) * 2;
    let seed = semente >>> 0;
    function aleatorio() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
    const mapa = Array.from({ length: tamanho }, () => Array(tamanho).fill('#'));
    const pilha = [{ x: 1, y: 1 }];
    mapa[1][1] = '.';
    while (pilha.length) {
      const atual = pilha[pilha.length - 1];
      const opcoes = VETORES.map(v => ({ x: atual.x + 2 * v.x, y: atual.y + 2 * v.y }))
        .filter(p => p.x > 0 && p.y > 0 && p.x < tamanho - 1 && p.y < tamanho - 1 && mapa[p.y][p.x] === '#');
      if (!opcoes.length) { pilha.pop(); continue; }
      const proxima = opcoes[Math.floor(aleatorio() * opcoes.length)];
      mapa[(atual.y + proxima.y) / 2][(atual.x + proxima.x) / 2] = '.';
      mapa[proxima.y][proxima.x] = '.';
      pilha.push(proxima);
    }
    const fila = [{ x: 1, y: 1, distancia: 0 }];
    const visitados = new Set(['1,1']);
    for (let i = 0; i < fila.length; i++) {
      const p = fila[i];
      for (const v of VETORES) {
        const x = p.x + v.x, y = p.y + v.y, chave = `${x},${y}`;
        if (mapa[y]?.[x] === '.' && !visitados.has(chave)) {
          visitados.add(chave); fila.push({ x, y, distancia: p.distancia + 1 });
        }
      }
    }
    const fim = fila[fila.length - 1];
    const direcao = mapa[1][2] === '.' ? 1 : 2;
    return { id: fase, tamanho, mapa: mapa.map(linha => linha.join('')),
      inicio: { x: 1, y: 1, direcao }, meta: { x: fim.x, y: fim.y }, minimo_movimentos: fim.distancia };
  }

  function gerarCampanha() {
    const niveis = [];
    for (let fase = 1; fase <= TOTAL_FASES; fase++) {
      let tentativa = 0, nivel;
      do { nivel = gerarNivel(fase, fase * 7937 + tentativa++); }
      while (niveis.length && nivel.minimo_movimentos <= niveis[niveis.length - 1].minimo_movimentos);
      niveis.push(nivel);
    }
    return niveis;
  }

  const api = { TOTAL_FASES, VETORES, estadoInicial, aplicarComando, gerarNivel, gerarCampanha };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Labirinto = api;
})(globalThis);
