// Lógica pura de movimento (fácil de testar com Jest).
const DIRECOES = {
  frente:   { dx: 0,  dy: -1 },
  tras:     { dx: 0,  dy: 1 },
  direita:  { dx: 1,  dy: 0 },
  esquerda: { dx: -1, dy: 0 },
};

const TECLAS = {
  ArrowUp: "frente",
  ArrowDown: "tras",
  ArrowRight: "direita",
  ArrowLeft: "esquerda",
};

function mover(pos, comando, limites = { largura: 10, altura: 10 }) {
  const d = DIRECOES[comando];
  if (!d) return { ...pos };
  const x = Math.min(Math.max(pos.x + d.dx, 0), limites.largura - 1);
  const y = Math.min(Math.max(pos.y + d.dy, 0), limites.altura - 1);
  return { x, y };
}

function teclaParaComando(tecla) {
  return TECLAS[tecla] || null;
}

if (typeof module !== "undefined") {
  module.exports = { mover, teclaParaComando, DIRECOES };
}
