import { CenaLabirinto } from './scene3d.js';

// A vitrine usa a mesma cena do jogo, sem iniciar sessão, controles ou progresso.
const INTERVALO_QUADRO = 1000 / 30;
let cena, estado, frame, auth, movimentoReduzido;
let ativo = false, falhou = false, configurado = false;
let naViewport = true;
let animacao = 0, ultimoQuadro = null, tempoVisivel = 0;

function visivel() {
  return ativo && !falhou && naViewport && !document.hidden && auth && !auth.hidden
    && !auth.classList.contains('escondido') && frame?.clientWidth > 0 && frame?.clientHeight > 0;
}

function cancelarQuadro() {
  cancelAnimationFrame(animacao);
  animacao = 0;
  ultimoQuadro = null;
}

function usarFallback() {
  falhou = true;
  cancelarQuadro();
  if (frame) delete frame.dataset.ready;
  cena?.renderer.dispose();
}

function desenhar(delta = 0) {
  if (!visivel() || !cena) return false;
  try {
    if (cena.renderer.domElement.width === 0 || cena.renderer.domElement.height === 0) return false;
    cena.renderizar(estado, movimentoReduzido.matches ? 0 : tempoVisivel, delta);
    frame.dataset.ready = 'true';
    return true;
  } catch {
    // O formulário e a ilustração em HTML continuam disponíveis sem WebGL.
    usarFallback();
    return false;
  }
}

function animar(agora) {
  animacao = 0;
  if (!visivel() || movimentoReduzido.matches) {
    ultimoQuadro = null;
    return;
  }
  const decorrido = ultimoQuadro === null ? INTERVALO_QUADRO : agora - ultimoQuadro;
  if (decorrido >= INTERVALO_QUADRO) {
    const delta = Math.min(decorrido / 1000, .1);
    ultimoQuadro = agora - decorrido % INTERVALO_QUADRO;
    tempoVisivel += delta;
    if (!desenhar(delta)) return;
  }
  animacao = requestAnimationFrame(animar);
}

function sincronizar() {
  cancelarQuadro();
  if (!visivel() || !cena) return;
  cena.reduzirMovimento = movimentoReduzido.matches;
  try { cena.redimensionar(); } catch { usarFallback(); return; }
  if (desenhar() && !movimentoReduzido.matches) animacao = requestAnimationFrame(animar);
}

function configurar() {
  if (configurado) return;
  frame = document.getElementById('login-preview-frame');
  auth = document.getElementById('tela-auth');
  const canvas = document.getElementById('login-preview');
  if (!frame || !auth || !canvas || !window.Labirinto) return;
  configurado = true;
  movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
  try {
    cena = new CenaLabirinto(canvas);
    cena.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    const nivel = window.Labirinto.gerarCampanha()[0];
    estado = window.Labirinto.estadoInicial(nivel);
    cena.carregar(nivel, estado);
  } catch {
    usarFallback();
    return;
  }
  new ResizeObserver(sincronizar).observe(frame);
  new MutationObserver(sincronizar).observe(auth, { attributes: true, attributeFilter: ['class', 'hidden'] });
  if (typeof IntersectionObserver !== 'undefined') {
    new IntersectionObserver(entradas => {
      naViewport = entradas.some(entrada => entrada.isIntersecting);
      sincronizar();
    }).observe(frame);
  }
  document.addEventListener('visibilitychange', sincronizar);
  movimentoReduzido.addEventListener('change', sincronizar);
  canvas.addEventListener('webglcontextlost', usarFallback);
}

export function ativarPreview() {
  ativo = true;
  configurar();
  sincronizar();
}

export function pausarPreview() {
  ativo = false;
  cancelarQuadro();
}
