/* ============================================================
   scene.js — Objek 3D tunggal yang menemani seluruh scroll.
   Torus knot amber prosedural (konsep 1 pilihan pemilik),
   material kaca amber hangat, partikel debu, cahaya studio.
   Koreografi posisi/skala digerakkan js/main.js lewat
   window.__knotState (target) — di sini dihaluskan (lerp).
   ============================================================ */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('scene');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Keadaan awal = posisi Hero. main.js mengubah target ini. */
const state = { px: 1.55, py: 0.05, s: 1.05, spin: 1 };
window.__knotState = state;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch (e) {
  canvas.style.display = 'none';
  window.dispatchEvent(new Event('scene-ready'));
  throw e;
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 60);
camera.position.set(0, 0, 6.2);

/* Pantulan lingkungan studio agar kaca amber hidup. */
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

/* ---------- Kelompok objek (yang bergerak mengikuti scroll) ---------- */
const group = new THREE.Group();
scene.add(group);

/* Halo cahaya hangat di belakang objek (seperti gambar konsep). */
function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255, 176, 84, 0.85)');
  grad.addColorStop(0.35, 'rgba(227, 138, 43, 0.38)');
  grad.addColorStop(1, 'rgba(227, 138, 43, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
const glow = new THREE.Mesh(
  new THREE.PlaneGeometry(6.4, 6.4),
  new THREE.MeshBasicMaterial({ map: makeGlowTexture(), transparent: true, depthWrite: false })
);
glow.position.z = -1.6;
group.add(glow);

/* Torus knot — aset 3D utama, digenerate prosedural dari geometri
   bawaan Three.js sehingga ringan dan persis keluarga konsep 1. */
const knot = new THREE.Mesh(
  new THREE.TorusKnotGeometry(1.02, 0.335, 340, 48),
  new THREE.MeshPhysicalMaterial({
    color: 0xe39a35,
    metalness: 0.05,
    roughness: 0.13,
    transmission: 0.72,
    thickness: 1.55,
    ior: 1.45,
    attenuationColor: new THREE.Color(0xc46a12),
    attenuationDistance: 0.85,
    clearcoat: 1,
    clearcoatRoughness: 0.14,
    emissive: 0x201000,
    envMapIntensity: 1.35,
    specularIntensity: 1.1
  })
);
group.add(knot);

/* Cahaya aksen agar tepi objek menyala hangat. */
const keyLight = new THREE.PointLight(0xffb35c, 60, 0, 1.8);
keyLight.position.set(3.2, 2.2, 3.4);
scene.add(keyLight);
const rimLight = new THREE.PointLight(0xff8c2e, 26, 0, 1.8);
rimLight.position.set(-3.6, -1.4, 2.2);
scene.add(rimLight);
scene.add(new THREE.AmbientLight(0x40260f, 1.4));

/* Debu beterbangan pelan di sekitar objek. */
function makeParticles() {
  const N = 260;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 2.3 + Math.random() * 3.4;
    const a = Math.random() * Math.PI * 2;
    const b = (Math.random() - 0.5) * Math.PI;
    pos[i * 3] = Math.cos(a) * Math.cos(b) * r;
    pos[i * 3 + 1] = Math.sin(b) * r * 0.8;
    pos[i * 3 + 2] = Math.sin(a) * Math.cos(b) * r - 1;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xe8b06a, size: 0.045, transparent: true, opacity: 0.5, depthWrite: false
  });
  return new THREE.Points(geo, mat);
}
const dust = makeParticles();
scene.add(dust);

/* ---------- Parallax tetikus (halus, kecil saja) ---------- */
let mouseX = 0, mouseY = 0;
window.addEventListener('pointermove', (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
}, { passive: true });

/* ---------- Ukuran & transformasi responsif ---------- */
let aspect = window.innerWidth / window.innerHeight;
function onResize() {
  aspect = window.innerWidth / window.innerHeight;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
window.addEventListener('resize', onResize);

function responsiveTarget() {
  /* Layar sempit: FOV horizontal menyempit tajam, jadi skala objek
     harus dikoreksi menurut aspect ratio — kalau tidak, objek
     memenuhi seluruh lebar layar. Objek naik ke atas, teks di bawah. */
  if (aspect < 1.15) {
    var f = Math.max(0.32, aspect / 1.28);
    return { x: 0, y: state.py * 0.3 + 1.62, s: state.s * f };
  }
  return { x: state.px, y: state.py, s: state.s };
}

/* ---------- Gelang animasi ---------- */
const clock = new THREE.Clock();
const cur = { x: state.px, y: state.py, s: state.s };
let idleAngle = 0;

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  const target = responsiveTarget();
  const k = 1 - Math.pow(0.0025, dt); /* lerp halus ~konstan waktu */
  cur.x += (target.x - cur.x) * k;
  cur.y += (target.y - cur.y) * k;
  cur.s += (target.s - cur.s) * k;

  group.position.set(cur.x, cur.y + Math.sin(t * 0.6) * 0.05, 0);
  group.scale.setScalar(cur.s);

  if (!reduceMotion) {
    idleAngle += dt * 0.22 * state.spin;
    dust.rotation.y -= dt * 0.014;
  }
  knot.rotation.set(idleAngle * 0.7, idleAngle, idleAngle * 0.3);
  group.rotation.y = mouseX * 0.14;
  group.rotation.x = mouseY * 0.08;

  glow.material.opacity = 0.85 + Math.sin(t * 0.8) * 0.1;

  renderer.render(scene, camera);
}
tick();

window.dispatchEvent(new Event('scene-ready'));
