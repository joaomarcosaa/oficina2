import * as THREE from '../vendor/three.module.js';
import { PassoVisual, limitarCamera } from './scene-motion.mjs';

const PASSO = 2.6;
const ALTURA_PAREDE = 1.65;

export class CenaLabirinto {
  constructor(canvas) {
    this.reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#100421');
    this.scene.fog = new THREE.FogExp2('#100421', .025);
    this.camera = new THREE.PerspectiveCamera(55, 1, .08, 180);
    this.scene.add(new THREE.HemisphereLight('#b0dfff', '#4b086f', 1.65));
    const sol = new THREE.DirectionalLight('#e5c7ff', 2.2);
    sol.position.set(6, 15, 8); this.scene.add(sol);
    const neon = new THREE.DirectionalLight('#10bddc', 1.5);
    neon.position.set(-8, 7, -4); this.scene.add(neon);
    this.mundo = new THREE.Group(); this.scene.add(this.mundo);
    this.avatar = this.criarPersonagem(); this.scene.add(this.avatar);
    this.sombra = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.4), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'varying vec2 vUv; void main(){ float a=(1.0-smoothstep(0.05,0.5,length(vUv-0.5)))*0.5; gl_FragColor=vec4(0.025,0.006,0.04,a); }',
    }));
    this.sombra.rotation.x = -Math.PI / 2; this.sombra.position.y = .018; this.scene.add(this.sombra);
    this.cameraAlvo = new THREE.Vector3();
    this.olhar = new THREE.Vector3();
    this.focoAlvo = new THREE.Vector3();
    this.movimento = new PassoVisual(PASSO);
    this.fasePasso = 0;
    this.amplitudePasso = 0;
    this.criarEstrelas();
  }

  criarPersonagem() {
    const grupo = new THREE.Group();
    const branco = new THREE.MeshStandardMaterial({ color: '#ecedff', roughness: .35, metalness: .15 });
    const roxo = new THREE.MeshStandardMaterial({ color: '#8b37d8', roughness: .4, metalness: .25 });
    const escuro = new THREE.MeshStandardMaterial({ color: '#24213f', roughness: .5 });
    const luz = new THREE.MeshBasicMaterial({ color: '#46ebff' });
    const esfera = (r, mat, x, y, z) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 12), mat);
      m.position.set(x, y, z); grupo.add(m); return m;
    };
    const bloco = (w, h, d, mat, x, y, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z); grupo.add(m); return m;
    };
    esfera(.28, branco, 0, 1.42, 0);
    const viseira = esfera(.245, luz, 0, 1.44, -.11);
    viseira.scale.set(.9, .48, .8);
    bloco(.42, .48, .29, roxo, 0, .96, 0);
    bloco(.27, .32, .14, escuro, 0, 1.01, .2);
    bloco(.17, .055, .025, luz, 0, 1.05, .28);
    this.pernas = []; this.bracos = [];
    for (const sinal of [-1, 1]) {
      const perna = new THREE.Group(); perna.position.set(sinal * .13, .73, 0);
      const canela = new THREE.Mesh(new THREE.CapsuleGeometry(.075, .44, 4, 8), branco);
      canela.position.y = -.3; perna.add(canela);
      const bota = new THREE.Mesh(new THREE.BoxGeometry(.19, .12, .28), escuro);
      bota.position.set(0, -.62, -.045); perna.add(bota);
      grupo.add(perna); this.pernas.push(perna);
      const braco = new THREE.Group(); braco.position.set(sinal * .31, 1.16, 0);
      const manga = new THREE.Mesh(new THREE.CapsuleGeometry(.065, .3, 4, 8), branco);
      manga.position.y = -.2; braco.add(manga);
      grupo.add(braco); this.bracos.push(braco);
    }
    const halo = new THREE.Mesh(new THREE.RingGeometry(.4, .44, 32), luz);
    halo.rotation.x = -Math.PI / 2; halo.position.y = .025; grupo.add(halo);
    return grupo;
  }

  criarEstrelas() {
    const vertices = [];
    for (let i = 0; i < 380; i++) {
      vertices.push(Math.sin(i * 37.8) * 95, 15 + (i % 29) * 2, Math.cos(i * 12.1) * 95);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    this.scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: '#9d78d2', size: .1 })));
  }

  carregar(nivel, estado) {
    const geometrias = new Set(), materiais = new Set();
    this.mundo.traverse(obj => {
      if (obj.isInstancedMesh) obj.dispose();
      if (obj.geometry) geometrias.add(obj.geometry);
      if (obj.material) materiais.add(obj.material);
    });
    this.mundo.clear();
    geometrias.forEach(g => g.dispose()); materiais.forEach(m => m.dispose());
    this.nivel = nivel;
    const pisoMat = new THREE.MeshStandardMaterial({ color: '#251238', roughness: .58, metalness: .25 });
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(nivel.tamanho * PASSO, nivel.tamanho * PASSO), pisoMat);
    piso.rotation.x = -Math.PI / 2;
    piso.position.set((nivel.tamanho - 1) * PASSO / 2, -.01, (nivel.tamanho - 1) * PASSO / 2);
    this.mundo.add(piso);
    const grade = new THREE.GridHelper(nivel.tamanho * PASSO, nivel.tamanho, '#89509f', '#69417b');
    grade.material.transparent = true; grade.material.opacity = .22; grade.material.depthWrite = false;
    grade.position.copy(piso.position); grade.position.y = .012; this.mundo.add(grade);
    this.criarParedes(nivel);
    this.portal = new THREE.Group();
    this.portal.position.set(nivel.meta.x * PASSO, 0, nivel.meta.y * PASSO);
    const portalMat = new THREE.MeshBasicMaterial({ color: '#47ecff' });
    const anel = new THREE.Mesh(new THREE.TorusGeometry(.77, .045, 8, 48), portalMat);
    anel.position.y = 1.15; this.portal.add(anel); this.anelPortal = anel;
    const centro = new THREE.Mesh(new THREE.SphereGeometry(.69, 20, 14),
      new THREE.MeshBasicMaterial({ color: '#bd31fa', transparent: true, opacity: .16, depthWrite: false }));
    centro.position.y = 1.15; this.portal.add(centro);
    const base = new THREE.Mesh(new THREE.RingGeometry(.7, .93, 48), portalMat);
    base.rotation.x = -Math.PI / 2; base.position.y = .02; this.portal.add(base);
    const brilho = new THREE.PointLight('#3edbff', 8, 8); brilho.position.y = 1.4; this.portal.add(brilho);
    this.mundo.add(this.portal);
    // O portal continua de frente para o corredor, sem desaparecer ao girar de lado.
    const vizinhos = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
    const frentePortal = vizinhos.find(v => nivel.mapa[nivel.meta.y + v.y]?.[nivel.meta.x + v.x] === '.');
    this.portal.rotation.y = frentePortal?.x ? Math.PI / 2 : 0;
    this.avatar.position.set(estado.x * PASSO, 0, estado.y * PASSO);
    this.movimento.reiniciar(estado, performance.now());
    this.fasePasso = 0; this.amplitudePasso = 0;
    this.angulo = -estado.direcao * Math.PI / 2;
    this.avatar.rotation.y = this.angulo;
    this.pernas.forEach(p => { p.rotation.x = 0; });
    this.bracos.forEach(b => { b.rotation.x = 0; });
    this.atualizarCamera(0, true);
  }

  criarParedes(nivel) {
    const blocos = [], faixas = [];
    const faces = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
    for (let y = 0; y < nivel.tamanho; y++) for (let x = 0; x < nivel.tamanho; x++) {
      if (nivel.mapa[y][x] !== '#') continue;
      blocos.push({ x, y });
      for (const face of faces) {
        if (nivel.mapa[y + face.y]?.[x + face.x] === '.') faixas.push({ x, y, face });
      }
    }
    const cubo = new THREE.BoxGeometry(1, 1, 1);
    const corpoMat = new THREE.MeshStandardMaterial({ color: '#48235f', roughness: .62, metalness: .15 });
    const topoMat = new THREE.MeshStandardMaterial({ color: '#663880', roughness: .66, metalness: .1 });
    const faixaMat = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
    const corpos = new THREE.InstancedMesh(cubo, corpoMat, blocos.length);
    const topos = new THREE.InstancedMesh(cubo, topoMat, blocos.length);
    const luzes = new THREE.InstancedMesh(cubo, faixaMat, faixas.length);
    corpos.name = 'paredes-solidas'; topos.name = 'topos-solidos'; luzes.name = 'detalhes-neon';
    const molde = new THREE.Object3D();
    blocos.forEach(({ x, y }, i) => {
      molde.position.set(x * PASSO, (ALTURA_PAREDE - .1) / 2, y * PASSO);
      molde.scale.set(PASSO, ALTURA_PAREDE - .1, PASSO); molde.updateMatrix();
      corpos.setMatrixAt(i, molde.matrix);
      molde.position.y = ALTURA_PAREDE - .05;
      molde.scale.set(PASSO - .035, .1, PASSO - .035); molde.updateMatrix();
      topos.setMatrixAt(i, molde.matrix);
    });
    const ciano = new THREE.Color('#299eaf'), rosa = new THREE.Color('#ad429e');
    faixas.forEach(({ x, y, face }, i) => {
      molde.position.set(x * PASSO + face.x * (PASSO / 2 + .006), ALTURA_PAREDE - .22,
        y * PASSO + face.y * (PASSO / 2 + .006));
      molde.scale.set(face.x ? .02 : PASSO - .09, .035, face.y ? .02 : PASSO - .09);
      molde.updateMatrix(); luzes.setMatrixAt(i, molde.matrix);
      luzes.setColorAt(i, (x + y) % 4 === 0 ? rosa : ciano);
    });
    for (const mesh of [corpos, topos, luzes]) {
      mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); this.mundo.add(mesh);
    }
  }

  podeMover(agora) { return !this.movimento.ocupado(agora); }

  moverPara(estado, agora) { return this.movimento.iniciar(estado, agora); }

  redimensionar() {
    const canvas = this.renderer.domElement;
    const largura = canvas.clientWidth, altura = canvas.clientHeight;
    if (!largura || !altura) return;
    this.renderer.setSize(largura, altura, false);
    this.camera.aspect = largura / altura;
    this.camera.updateProjectionMatrix();
  }

  atualizarCamera(delta, imediata = false) {
    const dx = -Math.sin(this.angulo), dz = -Math.cos(this.angulo);
    this.cameraAlvo.set(this.avatar.position.x - dx * 4.2, 5.6, this.avatar.position.z - dz * 4.2);
    this.focoAlvo.set(this.avatar.position.x + dx * .45, .95, this.avatar.position.z + dz * .45);
    const fator = imediata || this.reduzirMovimento ? 1 : 1 - Math.exp(-delta * 18);
    this.camera.position.lerp(this.cameraAlvo, fator);
    this.olhar.lerp(this.focoAlvo, fator);
    // Corrige a posição já suavizada: o braço da câmera nunca atravessa uma parede.
    const origem = { x: this.avatar.position.x, y: .6, z: this.avatar.position.z };
    const segura = limitarCamera(this.nivel, origem, this.camera.position);
    this.camera.position.set(segura.x, segura.y, segura.z);
    this.camera.lookAt(this.olhar);
  }

  renderizar(estado, tempo, delta) {
    const pose = this.reduzirMovimento
      ? { ...this.movimento.destino, andando: false } : this.movimento.amostrar(tempo * 1000);
    const distancia = Math.hypot(pose.x - this.avatar.position.x, pose.z - this.avatar.position.z);
    this.avatar.position.x = pose.x; this.avatar.position.z = pose.z;
    this.angulo = pose.angulo;
    this.avatar.rotation.y = this.angulo;
    this.fasePasso += distancia * 3.8;
    this.amplitudePasso += ((pose.andando ? 1 : 0) - this.amplitudePasso) * (1 - Math.exp(-delta * 22));
    const passo = Math.sin(this.fasePasso) * .42 * this.amplitudePasso;
    this.pernas[0].rotation.x = passo; this.pernas[1].rotation.x = -passo;
    this.bracos[0].rotation.x = -passo; this.bracos[1].rotation.x = passo;
    this.avatar.position.y = Math.abs(Math.sin(this.fasePasso)) * .025 * this.amplitudePasso;
    this.sombra.position.x = pose.x; this.sombra.position.z = pose.z;
    this.anelPortal.rotation.z = tempo * .3;
    this.anelPortal.scale.setScalar(1 + Math.sin(tempo * 2) * .025);
    this.atualizarCamera(delta);
    this.renderer.render(this.scene, this.camera);
  }
}
