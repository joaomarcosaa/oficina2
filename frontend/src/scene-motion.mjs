// Movimento visual e colisão da câmera, sem dependência do renderizador.
export class PassoVisual {
  constructor(passo = 2.6) { this.passo = passo; }

  reiniciar(estado, agora = 0) {
    this.origem = this.destino = { x: estado.x * this.passo, z: estado.y * this.passo,
      angulo: -estado.direcao * Math.PI / 2 };
    this.inicio = agora;
    this.duracao = 0;
    this.andando = false;
  }

  ocupado(agora) { return this.duracao > 0 && agora < this.inicio + this.duracao; }

  iniciar(estado, agora) {
    if (this.ocupado(agora)) return false;
    const atual = this.amostrar(agora);
    const angulo = -estado.direcao * Math.PI / 2;
    const giro = Math.atan2(Math.sin(angulo - atual.angulo), Math.cos(angulo - atual.angulo));
    this.origem = { x: atual.x, z: atual.z, angulo: atual.angulo };
    this.destino = { x: estado.x * this.passo, z: estado.y * this.passo, angulo: atual.angulo + giro };
    this.andando = atual.x !== this.destino.x || atual.z !== this.destino.z;
    this.inicio = agora;
    this.duracao = this.andando ? 180 : 160;
    return true;
  }

  amostrar(agora) {
    const progresso = this.duracao ? Math.max(0, Math.min(1, (agora - this.inicio) / this.duracao)) : 1;
    if (progresso === 1) return { ...this.destino, andando: false, progresso: 1 };
    const giro = progresso * progresso * (3 - 2 * progresso);
    return {
      x: this.origem.x + (this.destino.x - this.origem.x) * progresso,
      z: this.origem.z + (this.destino.z - this.origem.z) * progresso,
      angulo: this.origem.angulo + (this.destino.angulo - this.origem.angulo) * giro,
      andando: this.andando && progresso < 1, progresso,
    };
  }
}

// Interseção do braço da câmera com caixas sólidas; margem protege o plano próximo.
export function limitarCamera(nivel, origem, destino, passo = 2.6, margem = .18) {
  if (!nivel) return { ...destino };
  let fracao = 1;
  const delta = { x: destino.x - origem.x, y: destino.y - origem.y, z: destino.z - origem.z };
  const metade = passo / 2;
  const minX = Math.max(0, Math.ceil((Math.min(origem.x, destino.x) - metade - margem) / passo));
  const maxX = Math.min(nivel.tamanho - 1, Math.floor((Math.max(origem.x, destino.x) + metade + margem) / passo));
  const minY = Math.max(0, Math.ceil((Math.min(origem.z, destino.z) - metade - margem) / passo));
  const maxY = Math.min(nivel.tamanho - 1, Math.floor((Math.max(origem.z, destino.z) + metade + margem) / passo));
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    if (nivel.mapa[y][x] !== '#') continue;
    const minimo = { x: x * passo - metade - margem, y: -margem, z: y * passo - metade - margem };
    const maximo = { x: x * passo + metade + margem, y: 1.65 + margem, z: y * passo + metade + margem };
    let entrada = 0, saida = fracao;
    for (const eixo of ['x', 'y', 'z']) {
      if (Math.abs(delta[eixo]) < 1e-9) {
        if (origem[eixo] < minimo[eixo] || origem[eixo] > maximo[eixo]) { saida = -1; break; }
      } else {
        const a = (minimo[eixo] - origem[eixo]) / delta[eixo];
        const b = (maximo[eixo] - origem[eixo]) / delta[eixo];
        entrada = Math.max(entrada, Math.min(a, b));
        saida = Math.min(saida, Math.max(a, b));
      }
    }
    if (entrada <= saida && saida >= 0) fracao = Math.max(0, entrada - .01);
  }
  return { x: origem.x + delta.x * fracao, y: origem.y + delta.y * fracao, z: origem.z + delta.z * fracao };
}
