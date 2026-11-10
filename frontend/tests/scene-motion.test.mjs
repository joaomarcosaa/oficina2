import test from 'node:test';
import assert from 'node:assert/strict';
import { PassoVisual, limitarCamera } from '../src/scene-motion.mjs';

const EPSILON = 1e-8;
const aproximadamente = (atual, esperado, mensagem) =>
  assert.ok(Math.abs(atual - esperado) < EPSILON, mensagem ?? `${atual} deve ser próximo de ${esperado}`);
const diferencaAngular = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

test('o passo termina exatamente no centro da casa e recusa sobrepor movimentos', () => {
  const visual = new PassoVisual();
  visual.reiniciar({ x: 1, y: 2, direcao: 1 });
  assert.equal(visual.iniciar({ x: 2, y: 2, direcao: 1 }, 0), true);
  assert.equal(visual.ocupado(179), true);
  assert.equal(visual.iniciar({ x: 3, y: 2, direcao: 1 }, 100), false);
  const meio = visual.amostrar(90);
  assert.ok(meio.x > 2.6 && meio.x < 5.2);
  assert.equal(meio.z, 5.2);
  assert.equal(meio.andando, true);
  const fim = visual.amostrar(180);
  assert.equal(fim.x, 5.2);
  assert.equal(fim.z, 5.2);
  assert.equal(fim.progresso, 1);
  assert.equal(fim.andando, false);
  assert.equal(visual.ocupado(180), false);
  assert.deepEqual(visual.amostrar(900), fim);
});

test('andar, virar e andar novamente não corta a quina na diagonal', () => {
  const visual = new PassoVisual();
  visual.reiniciar({ x: 1, y: 2, direcao: 1 });
  visual.iniciar({ x: 2, y: 2, direcao: 1 }, 0);
  assert.equal(visual.iniciar({ x: 2, y: 2, direcao: 2 }, 180), true);
  const giro = visual.amostrar(260);
  assert.equal(giro.x, 5.2);
  assert.equal(giro.z, 5.2);
  assert.equal(giro.andando, false);
  assert.equal(visual.ocupado(339), true);
  assert.equal(visual.ocupado(340), false);
  assert.equal(visual.iniciar({ x: 2, y: 3, direcao: 2 }, 340), true);
  const segundoPasso = visual.amostrar(430);
  assert.equal(segundoPasso.x, 5.2);
  assert.ok(segundoPasso.z > 5.2 && segundoPasso.z < 7.8);
  const fim = visual.amostrar(520);
  assert.equal(fim.x, 2 * 2.6);
  assert.equal(fim.z, 3 * 2.6);
});

test('girar parado mantém a posição e não aciona a caminhada', () => {
  const visual = new PassoVisual();
  visual.reiniciar({ x: 2, y: 3, direcao: 0 }, 100);
  assert.equal(visual.iniciar({ x: 2, y: 3, direcao: 1 }, 100), true);
  for (const agora of [100, 140, 180, 259, 260]) {
    const quadro = visual.amostrar(agora);
    assert.equal(quadro.x, 2 * 2.6);
    assert.equal(quadro.z, 3 * 2.6);
    assert.equal(quadro.andando, false);
  }
  aproximadamente(diferencaAngular(visual.amostrar(260).angulo, -Math.PI / 2), 0);
});

test('a posição e a rotação dependem do tempo, independentemente da taxa dos quadros', () => {
  const amostraComTaxa = fps => {
    const visual = new PassoVisual();
    visual.reiniciar({ x: 1, y: 1, direcao: 1 });
    visual.iniciar({ x: 2, y: 1, direcao: 1 }, 0);
    for (let agora = 0; agora < 138; agora += 1000 / fps) visual.amostrar(agora);
    const durante = visual.amostrar(138);
    const fim = visual.amostrar(180);
    visual.iniciar({ x: 2, y: 1, direcao: 2 }, 180);
    for (let agora = 180; agora < 293; agora += 1000 / fps) visual.amostrar(agora);
    return { durante, fim, giro: visual.amostrar(293), final: visual.amostrar(340) };
  };
  const referencia = amostraComTaxa(60);
  for (const fps of [15, 30, 120, 144]) assert.deepEqual(amostraComTaxa(fps), referencia);
});

test('o giro entre as direções 3 e 0 percorre somente um quarto de volta', () => {
  const visual = new PassoVisual();
  visual.reiniciar({ x: 1, y: 1, direcao: 3 });
  const inicial = visual.amostrar(0).angulo;
  visual.iniciar({ x: 1, y: 1, direcao: 0 }, 0);
  const meio = visual.amostrar(80);
  aproximadamente(diferencaAngular(meio.angulo, inicial), -Math.PI / 4);
  const fim = visual.amostrar(160);
  aproximadamente(diferencaAngular(fim.angulo, inicial), -Math.PI / 2);
  aproximadamente(diferencaAngular(fim.angulo, 0), 0);
});

test('reiniciar interrompe a interpolação e posiciona imediatamente no novo início', () => {
  const visual = new PassoVisual();
  visual.reiniciar({ x: 1, y: 1, direcao: 1 });
  visual.iniciar({ x: 2, y: 1, direcao: 1 }, 0);
  visual.amostrar(60);
  visual.reiniciar({ x: 3, y: 4, direcao: 2 }, 70);
  const quadro = visual.amostrar(70);
  assert.equal(quadro.x, 3 * 2.6);
  assert.equal(quadro.z, 4 * 2.6);
  assert.equal(quadro.andando, false);
  assert.equal(visual.ocupado(70), false);
  aproximadamente(diferencaAngular(quadro.angulo, -Math.PI), 0);
});

test('a câmera para antes da primeira parede e preserva sua margem', () => {
  const nivel = { tamanho: 5, mapa: ['.#.#.', '.....', '.....', '.....', '.....'] };
  const origem = { x: 0, y: 1, z: 0 };
  const destino = { x: 10.4, y: 1, z: 0 };
  const segura = limitarCamera(nivel, origem, destino);
  assert.ok(segura.x >= 0 && segura.x <= 1.3 - .18 + EPSILON);
  assert.equal(segura.y, 1);
  assert.equal(segura.z, 0);
  assert.deepEqual(origem, { x: 0, y: 1, z: 0 });
  assert.deepEqual(destino, { x: 10.4, y: 1, z: 0 });
});

test('a câmera também colide ao apontar para a quina de uma parede', () => {
  const nivel = { tamanho: 3, mapa: ['...', '.#.', '...'] };
  const segura = limitarCamera(nivel, { x: 0, y: 1, z: 0 }, { x: 5.2, y: 1, z: 5.2 });
  assert.ok(segura.x >= 0 && segura.x < 1.3);
  assert.ok(segura.z >= 0 && segura.z < 1.3);
  aproximadamente(segura.x, segura.z);
  assert.equal(segura.y, 1);
  assert.ok(Math.hypot(1.3 - segura.x, 1.3 - segura.z) >= .18 - EPSILON);
});

test('a colisão da câmera funciona também nos sentidos negativos e no eixo z', () => {
  const nivel = { tamanho: 3, mapa: ['...', '.#.', '...'] };
  const casos = [
    { origem: { x: 5.2, y: 1, z: 2.6 }, destino: { x: 0, y: 1, z: 2.6 }, eixo: 'x', minimo: 4.08 },
    { origem: { x: 2.6, y: 1, z: 0 }, destino: { x: 2.6, y: 1, z: 5.2 }, eixo: 'z', maximo: 1.12 },
    { origem: { x: 2.6, y: 1, z: 5.2 }, destino: { x: 2.6, y: 1, z: 0 }, eixo: 'z', minimo: 4.08 },
  ];
  for (const caso of casos) {
    const segura = limitarCamera(nivel, caso.origem, caso.destino);
    if (caso.minimo !== undefined) assert.ok(segura[caso.eixo] >= caso.minimo - EPSILON);
    if (caso.maximo !== undefined) assert.ok(segura[caso.eixo] <= caso.maximo + EPSILON);
    assert.equal(segura.y, 1);
    const outroEixo = caso.eixo === 'x' ? 'z' : 'x';
    assert.equal(segura[outroEixo], caso.origem[outroEixo]);
  }
});

test('a colisão considera o tamanho da célula e a margem informados', () => {
  const nivel = { tamanho: 3, mapa: ['...', '.#.', '...'] };
  const segura = limitarCamera(nivel, { x: 0, y: 1, z: 2 }, { x: 4, y: 1, z: 2 }, 2, .25);
  assert.ok(segura.x >= 0 && segura.x <= .75 + EPSILON);
  assert.equal(segura.y, 1);
  assert.equal(segura.z, 2);
});

test('uma câmera acima da parede mantém o destino completo', () => {
  const nivel = { tamanho: 3, mapa: ['...', '.#.', '...'] };
  const origem = { x: 0, y: 3, z: 2.6 };
  const destino = { x: 5.2, y: 3, z: 2.6 };
  assert.deepEqual(limitarCamera(nivel, origem, destino), destino);
});

test('destino livre e segmento de comprimento zero permanecem íntegros', () => {
  const nivel = { tamanho: 3, mapa: ['...', '...', '...'] };
  const origem = { x: 0, y: 1, z: 0 };
  const destino = { x: 5.2, y: 4, z: 2.6 };
  assert.deepEqual(limitarCamera(nivel, origem, destino), destino);
  assert.deepEqual(limitarCamera(nivel, origem, origem), origem);
});
