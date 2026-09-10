// =============================================================================
//  Viewer — camera, UI, picking, layers, section cut
// =============================================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { buildScene } from './build.js';
import { createTruckTool, DOCK_PLANS } from './truck.js';
import { VERSIONS, FACTS, ASSUMPTIONS, SITE, BLDG, EXTRAS, gradeAt } from '../data/property.js';

const params = new URLSearchParams(location.search);
let version = VERSIONS[params.get('v')] ? params.get('v') : 'original';

const canvasWrap = document.getElementById('canvas-wrap');
const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.localClippingEnabled = false;
canvasWrap.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.className = 'label-layer';
canvasWrap.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#cfe0ee');
scene.fog = new THREE.Fog('#cfe0ee', 900, 1600);

const camera = new THREE.PerspectiveCamera(45, 1, 0.5, 4000);
const controls = new OrbitControls(camera, labelRenderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI / 2 - 0.01;
controls.minDistance = 4; controls.maxDistance = 1500;

// lights — sun toward true south, high
const hemi = new THREE.HemisphereLight('#dfe9f3', '#6d7a5a', 1.15); scene.add(hemi);
scene.add(new THREE.AmbientLight('#ffffff', 0.35));   // lifts interiors under the roof
const sun = new THREE.DirectionalLight('#fff4e0', 2.2);
const tn = SITE.trueNorth;                 // true north in XZ; sun sits opposite (south) and high
sun.position.set(-tn[0] * 260, 320, -tn[1] * 260 + 60);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.camera.near = 50; sun.shadow.camera.far = 1200;
sun.shadow.camera.left = -360; sun.shadow.camera.right = 360; sun.shadow.camera.top = 220; sun.shadow.camera.bottom = -220;
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.6;
scene.add(sun); scene.add(sun.target);
sun.target.position.set(30, 0, 0);

// ------------------------------------------------------------------ scene
let current = null;
const layerState = { site: true, walls: true, roof: true, structure: true, interior: true, doors: true, crane: true, labels: true, neighbors: true };

function loadVersion(v) {
  if (current) { scene.remove(current.root); disposeGroup(current.root); }
  version = v;
  current = buildScene(v);
  scene.add(current.root);
  applyLayers();
  document.querySelectorAll('[data-version]').forEach(b => b.classList.toggle('active', b.dataset.version === v));
  document.getElementById('version-name').textContent = VERSIONS[v].name;
  document.getElementById('version-blurb').textContent = VERSIONS[v].blurb;
  document.documentElement.style.setProperty('--accent', VERSIONS[v].accent);
  const url = new URL(location.href); url.searchParams.set('v', v); history.replaceState(null, '', url);
  document.getElementById('budget-link').href = `budget.html?v=${v}`;
  showDefaultInfo();
}
function disposeGroup(g) {
  g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.element && o.element.parentNode) o.element.parentNode.removeChild(o.element); });
}
function applyLayers() {
  if (!current) return;
  for (const k in current.layers) current.layers[k].visible = !!layerState[k];
  // labels living inside other layers (rooms, crane, gate, dims) follow the labels toggle;
  // interior labels only when you can actually see inside; nothing above an active cut
  const cutOn = renderer.clippingPlanes.length > 0, cutY = cutPlane.constant;
  const inside = !layerState.roof || cutOn;
  for (const o of current.labelObjs) {
    let v = layerState.labels && isAncestorVisible(o);
    if (o.userData.interiorLabel && !inside) v = false;
    if (cutOn && o.position.y > cutY + 0.5) v = false;
    // looking at the upstairs plan: the deck hides the ground-floor rooms under it (not the double-height showroom)
    const dk = EXTRAS[version]?.deck || { z0: -36, z1: 36 };
    if (cutOn && cutY > 10 && o.userData.interiorLabel && o.position.y < 9.5 && o.position.x > 96 && o.position.z >= dk.z0 && o.position.z <= dk.z1) v = false;
    o.visible = v;
  }
}
function isAncestorVisible(o) { let p = o.parent; while (p) { if (p.visible === false) return false; p = p.parent; } return true; }

// ------------------------------------------------------------------ views
const VIEWS = {
  aerial:  { pos: [330, 300, 330], tgt: [30, 0, 0], cut: false },
  street:  { pos: [235, 18, 45], tgt: [121, 11, -2], cut: false },
  rear:    { pos: [-185, 32, 75], tgt: [-73, 12, -4], cut: false },
  ne:      { pos: [20, 45, -260], tgt: [20, 10, 0], cut: false },
  sw:      { pos: [-10, 40, 240], tgt: [-9, 4, 30], cut: false },
  plan:    { pos: [30, 620, 0.01], tgt: [30, 0, 0], cut: 12 },
  officeG: { pos: [175, 95, 55], tgt: [108, 4, 0], cut: 8.5 },
  officeU: { pos: [175, 105, 55], tgt: [108, 12, 0], cut: 18 },
  insideA: { pos: [94, 6, 28], tgt: [15, 10, -6], cut: false },
  insideB: { pos: [-8, 6, 8], tgt: [-60, 12, -4], cut: false },
  well:    { pos: [-128, 4, 44], tgt: [-56, 0, 26], cut: false },     // back yard, looking into the drive-in door
  pad:     { pos: [-110, 8, -70], tgt: [-30, 0, -40], cut: false },   // east side ramp + pad
};
function setView(name, animate = true) {
  const v = VIEWS[name]; if (!v) return;
  const from = camera.position.clone(), fromT = controls.target.clone();
  const to = new THREE.Vector3(...v.pos), toT = new THREE.Vector3(...v.tgt);
  if (v.cut === false) setCut(false); else setCut(true, v.cut);
  if (!animate) { camera.position.copy(to); controls.target.copy(toT); controls.update(); return; }
  const t0 = performance.now(), dur = 700;
  (function step() {
    const k = Math.min(1, (performance.now() - t0) / dur), e = k < 0.5 ? 2 * k * k : -1 + (4 - 2 * k) * k;
    camera.position.lerpVectors(from, to, e); controls.target.lerpVectors(fromT, toT, e); controls.update();
    if (k < 1) requestAnimationFrame(step);
  })();
  document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === name));
}

// ------------------------------------------------------------------ section cut
const cutPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 12);
const cutToggle = document.getElementById('cut-toggle');
const cutRange = document.getElementById('cut-range');
const cutVal = document.getElementById('cut-val');
function setCut(on, y) {
  if (y !== undefined) { cutRange.value = y; }
  cutToggle.checked = on;
  cutPlane.constant = parseFloat(cutRange.value);
  cutVal.textContent = `${parseFloat(cutRange.value).toFixed(1)} ft`;
  renderer.clippingPlanes = on ? [cutPlane] : [];
  applyLayers();
}
cutToggle.addEventListener('change', () => setCut(cutToggle.checked));
cutRange.addEventListener('input', () => setCut(cutToggle.checked));

// ------------------------------------------------------------------ picking
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let selected = null, selectedEmissive = null;
const infoTitle = document.getElementById('info-title');
const infoBody = document.getElementById('info-body');
let downAt = null;
function castAt(clientX, clientY) {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(current.root.children, true).filter(h => h.object.visible && !h.object.isLine && isAncestorVisible(h.object) && (!renderer.clippingPlanes.length || h.point.y <= cutPlane.constant + 0.01));
}
labelRenderer.domElement.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
labelRenderer.domElement.addEventListener('pointerup', e => {
  if (!downAt) return; const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]); downAt = null;
  if (moved > 4 || walk.active) return;
  const hits = castAt(e.clientX, e.clientY);
  if (measure.active) { if (hits.length) measureClick(hits[0].point); return; }
  const hit = hits.find(h => h.object.userData && h.object.userData.pickable);
  select(hit ? hit.object : null, hit ? hit.point : null);
});

// ------------------------------------------------------------------ tape measure
const measure = { active: false, first: null, items: [], preview: null, group: new THREE.Group() };
scene.add(measure.group);
const measureBtn = document.getElementById('measure-btn'), measureList = document.getElementById('measure-list');
const MEAS_MAT = new THREE.LineBasicMaterial({ color: '#ffd54a', depthTest: false, transparent: true });
const MEAS_DOT = new THREE.MeshBasicMaterial({ color: '#ffd54a', depthTest: false });
const ftIn = (ft) => { let f = Math.floor(ft), i = Math.round((ft - f) * 12); if (i === 12) { f++; i = 0; } return `${f}'-${i}"`; };
function measureText(a, b) {
  const d = a.distanceTo(b), run = Math.hypot(b.x - a.x, b.z - a.z), rise = Math.abs(b.y - a.y);
  let t = ftIn(d);
  if (rise > 0.1 && run > 0.1) t += `  (run ${ftIn(run)}, rise ${ftIn(rise)})`;
  return t;
}
function makeMeasureObj(a, b, preview = false) {
  const g = new THREE.Group();
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), MEAS_MAT); line.renderOrder = 999; g.add(line);
  for (const p of [a, b]) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), MEAS_DOT); s.position.copy(p); s.renderOrder = 999; g.add(s); }
  const el = document.createElement('div'); el.className = 'lbl measure' + (preview ? ' preview' : ''); el.textContent = measureText(a, b);
  const lab = new CSS2DObject(el); lab.position.copy(a).add(b).multiplyScalar(0.5); g.add(lab);
  g.userData.label = el;
  return g;
}
function measureClick(p) {
  if (!measure.first) { measure.first = p.clone(); setPreview(p); return; }
  const a = measure.first, b = p.clone();
  if (a.distanceTo(b) < 0.05) return;
  const obj = makeMeasureObj(a, b); measure.group.add(obj);
  measure.items.push({ a, b, obj });
  measure.first = null; clearPreview(); renderMeasureList();
}
function setPreview(p) {
  clearPreview();
  measure.preview = makeMeasureObj(measure.first, p, true); measure.group.add(measure.preview);
}
function clearPreview() {
  if (measure.preview) { measure.preview.traverse(o => { if (o.element && o.element.parentNode) o.element.parentNode.removeChild(o.element); }); measure.group.remove(measure.preview); measure.preview = null; }
}
function renderMeasureList() {
  measureList.innerHTML = measure.items.map((m, i) => `<div><span>#${i + 1}</span><b>${measureText(m.a, m.b)}</b><button data-i="${i}" title="remove">✕</button></div>`).join('') || '<div class="hint" style="border:0">No measurements yet.</div>';
  measureList.querySelectorAll('button').forEach(b => b.addEventListener('click', () => removeMeasure(+b.dataset.i)));
}
function removeMeasure(i) {
  const m = measure.items[i]; if (!m) return;
  m.obj.traverse(o => { if (o.element && o.element.parentNode) o.element.parentNode.removeChild(o.element); }); measure.group.remove(m.obj);
  measure.items.splice(i, 1); renderMeasureList();
}
function setMeasure(on) {
  measure.active = on; measure.first = null; clearPreview();
  document.body.classList.toggle('measuring', on); measureBtn.classList.toggle('active', on);
  if (on && walk.active) exitWalk();
}
labelRenderer.domElement.addEventListener('pointermove', e => {
  if (!measure.active || !measure.first) return;
  const hits = castAt(e.clientX, e.clientY); if (hits.length) setPreview(hits[0].point);
});
measureBtn.addEventListener('click', () => setMeasure(!measure.active));
document.getElementById('measure-clear').addEventListener('click', () => { while (measure.items.length) removeMeasure(0); measure.first = null; clearPreview(); });
renderMeasureList();

// ------------------------------------------------------------------ semi turning template
const truckStatus = document.getElementById('truck-status'), truckBtn = document.getElementById('truck-btn');
const truck = createTruckTool({ scene, camera, controls, onStatus: (text, hit) => { truckStatus.textContent = text; truckStatus.classList.toggle('hit', hit); } });
function setTruck(on) {
  if (on) { if (walk.active) exitWalk(); if (measure.active) setMeasure(false); }
  truck.setActive(on); truckBtn.classList.toggle('active', on);
  if (on) { setCut(false); frameTruck(); } else truckStatus.textContent = '';
}
function frameTruck() {
  // look down at the rig from above and slightly behind it, plan-ish
  const st = truck.state, back = -Math.cos(st.th) * 50, side = -Math.sin(st.th) * 50;
  camera.position.set(st.x + back, 170, st.z + side); controls.target.set(st.x, 0, st.z); controls.update();
}
truckBtn.addEventListener('click', () => setTruck(!truck.active));
document.getElementById('truck-reset').addEventListener('click', () => { truck.reset(document.getElementById('truck-start').value); setDumpsterVisible(true); if (truck.active) frameTruck(); });
document.getElementById('truck-start').addEventListener('change', e => { truck.reset(e.target.value); if (!truck.active) setTruck(true); else frameTruck(); });
document.getElementById('truck-follow').addEventListener('change', e => { truck.follow = e.target.checked; });
document.getElementById('truck-easement').addEventListener('change', e => { truck.easement = e.target.checked; updateAutoNote(); });
document.getElementById('truck-type').addEventListener('change', e => { truck.setVehicle(e.target.value); if (!truck.active) setTruck(true); updateAutoNote(); });
const autoNote = document.getElementById('truck-auto-note');
function activePlan() {
  const base = DOCK_PLANS[truck.vehicle]; if (!base) return null;
  return (truck.easement && base.withEasement) ? base.withEasement : base;
}
function updateAutoNote() {
  const p = activePlan();
  autoNote.textContent = p ? (p.feasible ? '✓ ' : '✗ ') + p.note : '';
  autoNote.style.color = p && p.feasible ? '#9fd8a8' : '#ff9d8f';
}
function setDumpsterVisible(v) {
  const D = SITE.dumpster; if (!D) return;
  current.layers.site.traverse(o => { if (o.isMesh && Math.abs(o.position.x - D.x) < 7 && Math.abs(o.position.z - D.z) < 7 && o.position.y < 8) o.visible = v; });
}
document.getElementById('truck-auto').addEventListener('click', () => {
  const p = activePlan(); if (!p) return;
  if (!truck.active) setTruck(true);
  setDumpsterVisible(!p.dumpsterMoved);
  truck.playPlan(p); frameTruck();
  truckStatus.textContent = `${truck.vehicle} autopilot running…` + (p.dumpsterMoved ? ' (dumpster relocated for this run)' : '');
});
updateAutoNote();
function select(obj, point) {
  if (selected && selectedEmissive) { selected.material = selectedEmissive; }
  selected = null; selectedEmissive = null;
  if (!obj) { showDefaultInfo(); return; }
  selected = obj; selectedEmissive = obj.material;
  const m = obj.material.clone(); if ('emissive' in m) { m.emissive = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#5b8def'); m.emissiveIntensity = 0.35; }
  obj.material = m;
  const d = obj.userData;
  infoTitle.textContent = d.name;
  let html = '<table class="kv">';
  for (const [k, v] of d.details || []) html += `<tr><th>${k}</th><td>${v}</td></tr>`;
  if (point) html += `<tr><th>Position</th><td>x ${point.x.toFixed(1)}, z ${point.z.toFixed(1)}, elev ${point.y.toFixed(1)} ft</td></tr>`;
  html += '</table>';
  if (d.notes) html += `<p class="note">${d.notes}</p>`;
  infoBody.innerHTML = html;
}
function showDefaultInfo() {
  infoTitle.textContent = VERSIONS[version].name;
  let html = `<p class="blurb">${VERSIONS[version].blurb}</p><table class="kv">`;
  for (const [k, v] of FACTS) html += `<tr><th>${k}</th><td>${v}</td></tr>`;
  html += '</table><p class="hint">Click anything in the model for its dimensions and notes.</p>';
  infoBody.innerHTML = html;
}

// ------------------------------------------------------------------ UI wiring
document.querySelectorAll('[data-version]').forEach(b => b.addEventListener('click', () => loadVersion(b.dataset.version)));
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
document.querySelectorAll('[data-layer]').forEach(cb => {
  cb.checked = layerState[cb.dataset.layer];
  cb.addEventListener('change', () => { layerState[cb.dataset.layer] = cb.checked; applyLayers(); });
});
document.getElementById('shadow-toggle').addEventListener('change', e => { renderer.shadowMap.enabled = e.target.checked; scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); });
document.getElementById('assumptions-btn').addEventListener('click', () => {
  const dlg = document.getElementById('assumptions');
  dlg.querySelector('ul').innerHTML = ASSUMPTIONS.map(a => `<li>${a}</li>`).join('');
  dlg.showModal();
});
document.getElementById('panel-toggle').addEventListener('click', () => document.body.classList.toggle('panel-collapsed'));
document.getElementById('measure-hint').textContent = 'Right-drag to pan · scroll to zoom · left-drag to orbit';

// ------------------------------------------------------------------ walk mode (WASD + mouse look)
const EYE = 5.7;
const walk = { active: false, yaw: 0, pitch: 0, keys: {}, level: 0, saved: null, lastT: 0 };
const hud = document.getElementById('walk-hud'), hudResume = document.getElementById('walk-resume'), walkBtn = document.getElementById('walk-btn');
const lockTarget = labelRenderer.domElement;

/** floor height under a point: slab, drive-in bay, mezzanines (when level 1), east pad/ramp, or the outdoor grade */
function floorAt(x, z) {
  const A = BLDG.A, B = BLDG.B, D = BLDG.driveIn, O = BLDG.office, OB = BLDG.officeB, R = SITE.eastRamp;
  const inside = x >= B.x0 && x <= A.x1 && z >= A.z0 && z <= A.z1;
  if (inside) {
    if (x >= D.x0 && x <= D.x1 && z >= D.z0 && z <= D.z1) return -D.depth;
    if (walk.level === 1) {
      const dk = EXTRAS[version]?.deck || { z0: O.z0, z1: O.z1 };
      if (x >= O.x0 && x <= O.x1 && z >= dk.z0 && z <= dk.z1) return O.floor2;
      if (OB && x >= OB.x0 && x <= OB.x1 && z >= OB.z0 && z <= OB.z1) return OB.floor2;
    }
    return 0;
  }
  if (z >= R.z0 && z <= R.z1) {
    if (x >= R.padX0 && x <= R.padX1) return R.padY;
    if (x >= R.rampX0 && x < R.padX0) { const t = (x - R.rampX0) / (R.padX0 - R.rampX0); return gradeAt(R.rampX0) + t * (R.padY - gradeAt(R.rampX0)); }
  }
  return gradeAt(x);
}
function enterWalk() {
  if (walk.active) return;
  if (measure.active) setMeasure(false);
  walk.active = true;
  walk.saved = { pos: camera.position.clone(), tgt: controls.target.clone() };
  controls.enabled = false;
  // start where the camera is (clamped to the site), at eye height; look the way it was looking
  const dir = controls.target.clone().sub(camera.position).normalize();
  const x = THREE.MathUtils.clamp(camera.position.x, -230, 330), z = THREE.MathUtils.clamp(camera.position.z, -140, 140);
  walk.level = 0;
  camera.position.set(x, floorAt(x, z) + EYE, z);
  walk.yaw = Math.atan2(-dir.x, -dir.z); walk.pitch = THREE.MathUtils.clamp(Math.asin(dir.y), -0.6, 0.3);
  camera.rotation.order = 'YXZ'; camera.rotation.set(walk.pitch, walk.yaw, 0);
  document.body.classList.add('walking'); hud.hidden = false; walkBtn.classList.add('active');
  walk.savedLabels = layerState.labels; layerState.labels = false; applyLayers();   // floating labels clutter a first-person view
  walk.lastT = performance.now();
  requestLock();
}
function requestLock() {
  // mouse look needs pointer lock; if the browser refuses, movement still works
  try { const p = lockTarget.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
}
function exitWalk() {
  if (!walk.active) return;
  walk.active = false; walk.keys = {};
  if (document.pointerLockElement) document.exitPointerLock();
  document.body.classList.remove('walking'); hud.hidden = true; hudResume.hidden = true; walkBtn.classList.remove('active');
  if (walk.savedLabels !== undefined) { layerState.labels = walk.savedLabels; applyLayers(); }
  camera.rotation.set(0, 0, 0); camera.rotation.order = 'XYZ';
  if (walk.saved) { camera.position.copy(walk.saved.pos); controls.target.copy(walk.saved.tgt); }
  controls.enabled = true; controls.update();
}
function stepWalk(now) {
  const dt = Math.min(0.05, (now - walk.lastT) / 1000); walk.lastT = now;
  const k = walk.keys, speed = (k.ShiftLeft || k.ShiftRight ? 16 : 7.5) * dt;
  const f = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
  const r = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
  if (f || r) {
    const fx = -Math.sin(walk.yaw), fz = -Math.cos(walk.yaw), rx = Math.cos(walk.yaw), rz = -Math.sin(walk.yaw);
    camera.position.x += (fx * f + rx * r) * speed;
    camera.position.z += (fz * f + rz * r) * speed;
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -240, 340);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -150, 150);
  }
  const targetY = floorAt(camera.position.x, camera.position.z) + EYE;
  camera.position.y += (targetY - camera.position.y) * Math.min(1, dt * 10);
  camera.rotation.set(walk.pitch, walk.yaw, 0);
}
lockTarget.addEventListener('mousemove', e => {
  if (!walk.active || document.pointerLockElement !== lockTarget) return;
  walk.yaw -= e.movementX * 0.0022; walk.pitch = THREE.MathUtils.clamp(walk.pitch - e.movementY * 0.0022, -1.4, 1.4);
});
document.addEventListener('pointerlockchange', () => {
  if (!walk.active) return;
  hudResume.hidden = document.pointerLockElement === lockTarget;
});
lockTarget.addEventListener('click', () => { if (walk.active && document.pointerLockElement !== lockTarget) requestLock(); });
walkBtn.addEventListener('click', () => walk.active ? exitWalk() : enterWalk());
window.addEventListener('keyup', e => { walk.keys[e.code] = false; if (truck.active) truck.key(e.code, false); });

// keyboard shortcuts
window.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'f' || e.key === 'F') { walk.active ? exitWalk() : enterWalk(); return; }
  if (e.key === 'm' || e.key === 'M') { setMeasure(!measure.active); return; }
  if (e.key === 't' || e.key === 'T') { setTruck(!truck.active); return; }
  if (e.key === 'Escape' && measure.active) { if (measure.first) { measure.first = null; clearPreview(); } else setMeasure(false); return; }
  if (truck.active) {
    if (e.code.startsWith('Arrow') || e.code.startsWith('Shift')) { truck.key(e.code, true); e.preventDefault(); return; }
    if (e.key === 'r' || e.key === 'R') { truck.reset(); frameTruck(); return; }
  }
  if (walk.active) {
    walk.keys[e.code] = true;
    if (e.code === 'KeyE') walk.level = 1;
    if (e.code === 'KeyQ') walk.level = 0;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (e.key === 'c' || e.key === 'C') setCut(!cutToggle.checked);
    if (e.key === 'r' || e.key === 'R') { layerState.roof = !layerState.roof; document.querySelector('[data-layer="roof"]').checked = layerState.roof; applyLayers(); }
    return;
  }
  const map = { '1': 'aerial', '2': 'street', '3': 'rear', '4': 'ne', '5': 'sw', '6': 'plan', '7': 'officeG', '8': 'officeU', '9': 'insideA', '0': 'insideB' };
  if (map[e.key]) setView(map[e.key]);
  if (e.key === 'r' || e.key === 'R') { layerState.roof = !layerState.roof; document.querySelector('[data-layer="roof"]').checked = layerState.roof; applyLayers(); }
  if (e.key === 'c' || e.key === 'C') setCut(!cutToggle.checked);
});

// ------------------------------------------------------------------ resize / loop
function resize() {
  const w = canvasWrap.clientWidth, h = canvasWrap.clientHeight;
  renderer.setSize(w, h); labelRenderer.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
new ResizeObserver(resize).observe(canvasWrap);

loadVersion(version);
resize();
setView(params.get('view') || 'aerial', false);
window.__viewerReady = true;
window.__viewer = { scene, camera, controls, setView, walk, enterWalk, exitWalk, stepWalk, floorAt, measure, setMeasure, measureClick, truck, setTruck, DOCK_PLANS, get version() { return version; }, get current() { return current; } };   // handy from the console
const errBox = document.getElementById('load-error'); if (errBox) errBox.style.display = 'none';
let lastFrame = performance.now();
(function animate(now) {
  requestAnimationFrame(animate);
  now = now || performance.now();
  const dt = (now - lastFrame) / 1000; lastFrame = now;
  if (walk.active) stepWalk(now); else controls.update();
  if (truck.active) truck.update(dt);
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
})();
