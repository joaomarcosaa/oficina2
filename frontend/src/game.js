import { CenaLabirinto } from './scene3d.js';

const { estadoInicial, aplicarComando, TOTAL_FASES } = window.Labirinto;
const $ = id => document.getElementById(id);
const TECLAS = { ArrowUp: 'frente', w: 'frente', ArrowDown: 'tras', s: 'tras',
  ArrowLeft: 'esquerda', a: 'esquerda', ArrowRight: 'direita', d: 'direita' };
let cena, api, nivel, estado, comandos = [], ativo = false, carregando = false;
let progresso, usuarioId, pressionado = null, pendente = null, proximoComando = 0;
let anterior = 0, geracao = 0, enviando = false, salvo = false, configurado = false;

function mensagem(texto) {
  if ($('game-status').textContent !== texto) $('game-status').textContent = texto;
}

function desenharMapa() {
  const canvas = $('minimapa'), ctx = canvas.getContext('2d');
  const passo = canvas.width / nivel.tamanho;
  ctx.fillStyle = '#170724'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < nivel.tamanho; y++) for (let x = 0; x < nivel.tamanho; x++) {
    ctx.fillStyle = nivel.mapa[y][x] === '#' ? '#4c2065' : '#b38bc720';
    ctx.fillRect(x * passo, y * passo, passo - .6, passo - .6);
  }
  ctx.fillStyle = '#37e4f5';
  ctx.fillRect((nivel.meta.x + .15) * passo, (nivel.meta.y + .15) * passo, passo * .7, passo * .7);
  ctx.save(); ctx.translate((estado.x + .5) * passo, (estado.y + .5) * passo);
  ctx.rotate(estado.direcao * Math.PI / 2);
  ctx.fillStyle = '#fff'; ctx.beginPath();
  ctx.moveTo(0, -passo * .47); ctx.lineTo(passo * .36, passo * .36); ctx.lineTo(-passo * .36, passo * .36);
  ctx.closePath(); ctx.fill(); ctx.restore();
}

function atualizarHUD() {
  $('fase-numero').textContent = String(nivel.id).padStart(2, '0');
  $('dimensao-fase').textContent = `${nivel.tamanho} × ${nivel.tamanho} · Labirinto 3D`;
  $('movimentos-jogo').textContent = estado.movimentos;
  $('posicao-personagem').textContent = `Fase ${nivel.id}. Linha ${estado.y + 1}, coluna ${estado.x + 1}.`;
  desenharMapa();
}

async function carregarFase(id) {
  if (carregando) return;
  carregando = true; pressionado = null; pendente = null;
  const versao = geracao;
  mensagem('Preparando o labirinto…');
  try {
    const dados = await api(`/game/levels/${id}`);
    if (!ativo || versao !== geracao) return;
    nivel = dados; estado = estadoInicial(nivel); comandos = []; salvo = false;
    cena.carregar(nivel, estado); cena.redimensionar(); atualizarHUD();
    mensagem('Encontre o portal azul para passar de fase.');
  } catch (erro) {
    if (versao === geracao) mensagem(erro.message + ' Use Reiniciar para tentar novamente.');
  } finally { if (versao === geracao) carregando = false; }
}

function executar(comando, guardar = true) {
  if (!ativo || carregando || !estado || estado.concluido || $('fase-dialog').open) return;
  if (comandos.length >= 20000) { mensagem('Reinicie esta tentativa para continuar.'); return; }
  const agora = performance.now();
  if (!cena.podeMover(agora)) {
    if (guardar) pendente = comando;
    return;
  }
  if (agora < proximoComando) return;
  const novo = aplicarComando(nivel, estado, comando);
  pendente = null;
  if (novo === estado) {
    proximoComando = agora + 120;
    mensagem('Há uma parede aqui. Vire para encontrar outro caminho.'); return;
  }
  cena.moverPara(novo, agora);
  estado = novo; comandos.push(comando);
  mensagem('Encontre o portal azul para passar de fase.'); atualizarHUD();
  if (estado.concluido) {
    pressionado = null; pendente = null;
    const versao = geracao;
    setTimeout(() => { if (ativo && versao === geracao && estado.concluido) concluir(); }, 240);
  }
}

async function concluir() {
  if (!ativo || enviando) return;
  const dialog = $('fase-dialog');
  if (!dialog.open) dialog.showModal();
  $('conclusao-titulo').textContent = nivel.id === TOTAL_FASES ? 'Você venceu!' : `Fase ${nivel.id} concluída!`;
  $('conclusao-texto').textContent = nivel.id === TOTAL_FASES
    ? 'Você encontrou a saída dos 10 labirintos. Que tal uma nova aventura?'
    : `Portal encontrado em ${estado.movimentos} movimentos. O próximo labirinto será maior!`;
  $('proxima-fase').textContent = nivel.id === TOTAL_FASES ? 'Jogar novamente' : `Ir para a fase ${nivel.id + 1}`;
  $('proxima-fase').disabled = true; $('tentar-salvar').classList.add('escondido');
  $('salvar-status').textContent = 'Salvando seu progresso…';
  enviando = true;
  const versao = geracao;
  try {
    const resultado = await api(`/game/levels/${nivel.id}/complete`, {
      method: 'POST', body: JSON.stringify({ comandos }),
    });
    if (!ativo || versao !== geracao) return;
    progresso = resultado; salvo = true;
    $('salvar-status').textContent = 'Progresso salvo na sua conta.';
    $('proxima-fase').disabled = false;
  } catch (erro) {
    if (versao !== geracao) return;
    $('salvar-status').textContent = erro.message;
    $('tentar-salvar').classList.remove('escondido');
  } finally { if (versao === geracao) enviando = false; }
}

function configurar() {
  if (configurado) return;
  configurado = true;
  document.addEventListener('keydown', e => {
    if (!ativo || $('fase-dialog').open || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const comando = TECLAS[e.key] || TECLAS[e.key.toLowerCase()];
    if (comando) {
      e.preventDefault();
      if (!e.repeat) { pressionado = comando; executar(comando); }
    }
    if (e.key.toLowerCase() === 'm' && !e.repeat) alternarMapa();
  });
  document.addEventListener('keyup', e => {
    if ((TECLAS[e.key] || TECLAS[e.key.toLowerCase()]) === pressionado) pressionado = null;
  });
  window.addEventListener('blur', () => { pressionado = null; pendente = null; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pressionado = null; pendente = null; }
  });
  document.querySelectorAll('[data-cmd]').forEach(botao => {
    botao.addEventListener('pointerdown', e => {
      e.preventDefault(); botao.setPointerCapture(e.pointerId);
      pressionado = botao.dataset.cmd; executar(pressionado);
    });
    botao.addEventListener('click', e => { if (e.detail === 0) executar(botao.dataset.cmd); });
    botao.addEventListener('pointerup', () => { pressionado = null; });
    botao.addEventListener('pointercancel', () => { pressionado = null; });
    botao.addEventListener('lostpointercapture', () => { pressionado = null; });
  });
  $('reiniciar').addEventListener('click', () => {
    if (!ativo || carregando) return;
    if (!nivel) { carregarFase(progresso?.nivel_liberado || 1); return; }
    estado = estadoInicial(nivel); comandos = []; salvo = false; pressionado = null; pendente = null; proximoComando = 0;
    cena.carregar(nivel, estado); atualizarHUD(); mensagem('Fase reiniciada. Seu progresso salvo foi mantido.');
  });
  $('alternar-mapa').addEventListener('click', alternarMapa);
  $('fase-dialog').addEventListener('cancel', e => e.preventDefault());
  $('proxima-fase').addEventListener('click', () => {
    if (!salvo || carregando) return;
    $('fase-dialog').close(); carregarFase(nivel.id < TOTAL_FASES ? nivel.id + 1 : 1);
  });
  $('tentar-salvar').addEventListener('click', concluir);
  $('refazer-fase').addEventListener('click', () => {
    if (enviando) return;
    $('fase-dialog').close(); $('reiniciar').click();
  });
  const observador = new ResizeObserver(() => cena?.redimensionar());
  observador.observe($('tela-jogo'));
}

function alternarMapa() {
  const ocultar = !$('map-panel').classList.contains('escondido');
  $('map-panel').classList.toggle('escondido', ocultar);
  $('alternar-mapa').setAttribute('aria-expanded', String(!ocultar));
}

export async function iniciar(usuario, chamarApi) {
  parar(); ativo = true; api = chamarApi; usuarioId = usuario.id;
  const versao = geracao;
  try {
    if (!cena) cena = new CenaLabirinto($('jogo-canvas'));
    configurar();
    progresso = await api('/game/progress');
    if (!ativo || versao !== geracao || usuario.id !== usuarioId) return;
    await carregarFase(progresso.nivel_liberado);
    if (!ativo || versao !== geracao) return;
    anterior = performance.now();
    cena.renderer.setAnimationLoop(agora => {
      if (!ativo || !estado || document.hidden) { anterior = agora; return; }
      const delta = Math.min((agora - anterior) / 1000, .05); anterior = agora;
      if (pendente || pressionado) executar(pendente || pressionado, false);
      cena.renderizar(estado, agora / 1000, delta);
    });
    cena.redimensionar();
  } catch (erro) {
    mensagem('Não foi possível iniciar o jogo: ' + erro.message + ' Atualize a página. O modo 3D precisa de aceleração gráfica (WebGL 2).');
    console.error('Falha ao iniciar o jogo:', erro);
  }
}

export function parar() {
  ativo = false; pressionado = null; pendente = null; carregando = false; enviando = false; geracao++;
  nivel = null; estado = null; comandos = []; proximoComando = 0;
  cena?.renderer.setAnimationLoop(null);
  if ($('fase-dialog').open) $('fase-dialog').close();
}
