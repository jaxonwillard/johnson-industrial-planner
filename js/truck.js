// =============================================================================
//  Drivable tractor-trailer turning template (AASHTO design vehicles).
//  Kinematic tractor + trailer model (rear-axle reference), swept-path trail,
//  simple collision flags against the buildings, property line, basin, dumpster.
//  Keys: ↑/↓ drive (hold), ←/→ steer, Shift = creep, R reset, T exit.
// =============================================================================
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { SITE, BLDG, gradeAt } from '../data/property.js';

// dimensions in feet.  wb1 tractor wheelbase; wb2 kingpin → trailer axle group;
// tFront/tRear tractor body extents from the rear axle; rFront/rRear trailer body extents from the kingpin
export const VEHICLES = {
  'WB-67': { name: 'WB-67 — 53\' trailer (interstate semi)', wb1: 19.5, wb2: 41.0, tFront: 23.0, tRear: -3.0, rFront: 3.0, rRear: -50.0, overall: 73.5, maxSteer: 32 },
  'WB-50': { name: 'WB-50 — ~40\' trailer (intermediate semi)', wb1: 14.6, wb2: 35.4, tFront: 17.6, tRear: -2.5, rFront: 3.0, rRear: -37.5, overall: 55.0, maxSteer: 32 },
  'WB-40': { name: 'WB-40 — 33\' trailer (short semi)', wb1: 12.5, wb2: 27.5, tFront: 15.5, tRear: -2.5, rFront: 3.0, rRear: -30.0, overall: 45.5, maxSteer: 32 },
};
const HALF_W = 4.25;     // 8'-6" wide
const JACKKNIFE = THREE.MathUtils.degToRad(85);

// Maneuvers found by scratch/dock_planner.py (forward segments = [steer°, feet]; 'rev' legs use the backing controller).
// Start: west alley at the back corner. Target: back east dock door, centre z = −16, wall face x = −73.75.
export const DOCK_PLANS = {
  'WB-40': { feasible: true, dumpsterMoved: false, note: 'Single swing: pull in 12\', swing right, counter-steer left, straighten, then back to the door. ~209\' of travel, yard as-is.',
    phases: [ { type: 'fwd', segs: [[0, 11.84], [26.7, 48.03], [-27.4, 76.42], [-5.78, 15.99]] }, { type: 'rev', limit: 400 } ] },
  'WB-50': { feasible: true, dumpsterMoved: false, note: 'Single swing using the whole yard width — swing right, hard left, straighten 23\', then back ~100\' to the door. ~221\' of travel. (Needs the back-east corner clear: a dumpster there put the best attempt 11½\' off the door.)',
    phases: [ { type: 'fwd', segs: [[0, 17.23], [29.6, 57.02], [-32, 75.84], [14.77, 22.97]] }, { type: 'rev', limit: 400 } ] },
  'WB-67': { feasible: false, dumpsterMoved: false, stopOnHit: ['building', 'east strip (ramp / pad, 11\' wide)', 'detention basin'], note: 'No collision-free maneuver found in this yard — not with a single swing, not with a pull-up. Best attempt shown (pull in, back 33\', pull up, back again): it reaches the back wall 27\' from the door with the trailer 40° across the yard.',
    phases: [ { type: 'fwd', segs: [[0, 13.9], [25.29, 49.11], [-16.07, 53.62]] }, { type: 'rev', limit: 33.03 }, { type: 'fwd', segs: [[-10.69, 51.34]] }, { type: 'rev', limit: 400 } ] },
};

// start positions: tractor rear axle (x, z) and heading (radians, 0 = toward the street, π = toward the back)
export const STARTS = {
  alley:  { name: 'West alley, at the back corner of the building', x: -66, z: 44, th: Math.PI },
  street: { name: 'On Johnson Industrial, lot on the right', x: 297, z: -110, th: Math.PI / 2 },
  yard:   { name: 'Back yard, facing the dock', x: -120, z: 0, th: 0 },
};

export function createTruckTool({ scene, camera, controls, onStatus }) {
  let V = VEHICLES['WB-67'], vid = 'WB-67', startId = 'alley';
  const S0 = STARTS[startId];
  const s = { active: false, x: S0.x, z: S0.z, th: S0.th, psi: S0.th, phi: 0, v: 0, keys: {}, follow: true, dist: 0, hits: [] };
  const group = new THREE.Group(); group.visible = false; scene.add(group);

  const matTractor = new THREE.MeshStandardMaterial({ color: '#2f5aa8', roughness: 0.5, metalness: 0.3 });
  const matTrailer = new THREE.MeshStandardMaterial({ color: '#f2f2ee', roughness: 0.6 });
  const matHit = new THREE.MeshStandardMaterial({ color: '#d64545', roughness: 0.6 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: '#222' });

  // unit boxes scaled per vehicle
  const tractor = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), matTractor);
  const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), matTractor);
  const trailer = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), matTrailer);
  [tractor, cabRoof, trailer].forEach(m => { m.castShadow = true; group.add(m); });
  const wheels = [];
  for (let i = 0; i < 8; i++) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 0.9, 12), wheelMat); wheels.push(w); group.add(w);
  }
  const labEl = document.createElement('div'); labEl.className = 'lbl crane'; labEl.textContent = vid;
  const label = new CSS2DObject(labEl); group.add(label);
  const trail = new THREE.Group(); group.add(trail);
  const MAX_TRAIL = 1500;

  function applyVehicle() {
    tractor.scale.set(V.tFront - V.tRear, 10.5, HALF_W * 2);
    cabRoof.scale.set(7, 2.5, HALF_W * 2 - 0.6);
    trailer.scale.set(V.rFront - V.rRear, 13.5, HALF_W * 2);
    const axles = [[0, false], [V.wb1, false], [-V.wb2, true], [-V.wb2 + 4.2, true]];
    wheels.forEach((w, i) => { const [along, isTrailer] = axles[Math.floor(i / 2)]; w.userData = { along, side: i % 2 ? 1 : -1, isTrailer }; });
  }
  const dirV = (a) => new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
  const pose = () => ({ hitch: new THREE.Vector3(s.x, 0, s.z), tDir: dirV(s.th), rDir: dirV(s.psi) });
  function corners() {
    const { hitch, tDir, rDir } = pose();
    const side = (d) => new THREE.Vector3(-d.z, 0, d.x);
    const rect = (origin, d, a0, a1) => {
      const sd = side(d); const pts = [];
      for (const [a, w] of [[a1, 1], [a1, -1], [a0, -1], [a0, 1]]) pts.push(origin.clone().addScaledVector(d, a).addScaledVector(sd, w * HALF_W));
      return pts;
    };
    return { tractor: rect(hitch, tDir, V.tRear, V.tFront), trailer: rect(hitch, rDir, V.rRear, V.rFront) };
  }
  function checkHits(c) {
    const hits = new Set();
    const A = BLDG.A, B = BLDG.B, bs = SITE.basin, D = SITE.dumpster, pc = SITE.corners;
    const inRect = (p, x0, x1, z0, z1) => p.x >= x0 && p.x <= x1 && p.z >= z0 && p.z <= z1;
    for (const p of [...c.tractor, ...c.trailer]) {
      if (inRect(p, B.x0, A.x1, A.z0, A.z1)) hits.add('building');
      if (((p.x - bs.cx) / bs.rx) ** 2 + ((p.z - bs.cz) / bs.rz) ** 2 < 1) hits.add('detention basin');
      if (D && inRect(p, D.x - D.w / 2 - 1, D.x + D.w / 2 + 1, D.z - D.d / 2 - 1, D.z + D.d / 2 + 1)) hits.add('dumpster');
      if (p.x < pc.NE[0] && (p.z < pc.NE[1] || p.z > pc.SE[1] || p.x < pc.SW[0])) hits.add('property line / fence');
      if (p.x < A.x1 + 1 && p.x > B.x0 - 1 && p.z < A.z0 && p.z > pc.NE[1]) hits.add('east strip (ramp / pad, 11\' wide)');
      for (const n of SITE.neighbors) if (inRect(p, n.x0, n.x1, n.z0, n.z1)) hits.add(n.name);
    }
    return [...hits];
  }
  function place() {
    const { hitch, tDir, rDir } = pose();
    const yT = gradeAt(hitch.x + tDir.x * V.wb1 / 2), yR = gradeAt(hitch.x + rDir.x * (V.rRear / 2));
    tractor.position.copy(hitch).addScaledVector(tDir, (V.tFront + V.tRear) / 2); tractor.position.y = yT + 5.6; tractor.rotation.y = -s.th;
    cabRoof.position.copy(hitch).addScaledVector(tDir, V.wb1 + 0.5); cabRoof.position.y = yT + 10.5 + 1.25; cabRoof.rotation.y = -s.th;
    trailer.position.copy(hitch).addScaledVector(rDir, (V.rFront + V.rRear) / 2); trailer.position.y = yR + 4 + 13.5 / 2 - 0.5; trailer.rotation.y = -s.psi;
    for (const w of wheels) {
      const d = w.userData.isTrailer ? rDir : tDir, sd = new THREE.Vector3(-d.z, 0, d.x);
      w.position.copy(hitch).addScaledVector(d, w.userData.along).addScaledVector(sd, w.userData.side * (HALF_W - 0.5));
      w.position.y = gradeAt(w.position.x) + 1.75; w.rotation.set(Math.PI / 2, 0, -(w.userData.isTrailer ? s.psi : s.th));
    }
    label.position.copy(hitch).addScaledVector(tDir, V.wb1 / 2).setY(yT + 16);
  }
  // narrow painted tracks instead of a full-width sweep: orange = trailer rear (the line that has to hit the door),
  // blue = tractor front axle (where the cab goes); red where anything was hitting
  const matTrackR = new THREE.MeshBasicMaterial({ color: '#ff8c1a', depthTest: false, transparent: true, opacity: 0.95, side: THREE.DoubleSide });
  const matTrackT = new THREE.MeshBasicMaterial({ color: '#3b82f6', depthTest: false, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
  const matTrackHit = new THREE.MeshBasicMaterial({ color: '#d64545', depthTest: false, transparent: true, opacity: 0.95, side: THREE.DoubleSide });
  let lastR = null, lastT = null;
  function trackSeg(a, b, mat, w) {
    const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz); if (L < 0.05) return;
    const q = new THREE.Mesh(new THREE.PlaneGeometry(L, w), mat);
    q.position.set((a.x + b.x) / 2, gradeAt((a.x + b.x) / 2) + 0.35, (a.z + b.z) / 2);
    q.rotation.set(0, 0, 0); q.rotateY(-Math.atan2(dz, dx)); q.rotateX(-Math.PI / 2);
    q.renderOrder = 998;
    trail.add(q); if (trail.children.length > MAX_TRAIL * 2) trail.remove(trail.children[0]);
  }
  function addTrail(hit) {
    const { hitch, tDir, rDir } = pose();
    const rp = hitch.clone().addScaledVector(rDir, V.rRear);            // trailer rear centre
    const tp = hitch.clone().addScaledVector(tDir, V.wb1);              // tractor front axle
    if (lastR) trackSeg(lastR, rp, hit ? matTrackHit : matTrackR, 0.7);
    if (lastT) trackSeg(lastT, tp, hit ? matTrackHit : matTrackT, 0.45);
    lastR = rp; lastT = tp;
  }
  function status() {
    const ang = THREE.MathUtils.radToDeg(Math.atan2(Math.sin(s.th - s.psi), Math.cos(s.th - s.psi)));
    const parts = [`trailer ${Math.abs(ang).toFixed(0)}° ${ang > 2 ? 'left' : ang < -2 ? 'right' : ''}`.trim(), `speed ${Math.abs(s.v).toFixed(0)} ft/s ${s.v < -0.1 ? '(reverse)' : ''}`.trim()];
    if (s.hits.length) parts.push('HITTING: ' + s.hits.join(', '));
    if (Math.abs(ang) > 80) parts.push('JACKKNIFE');
    labEl.textContent = `${vid} · ` + parts[0] + (s.hits.length ? ' · HIT' : '');
    labEl.style.background = s.hits.length ? '#d64545' : '#f0b429'; labEl.style.color = s.hits.length ? '#fff' : '#1d2126';
    onStatus && onStatus(`${vid} (${V.overall}' overall) · ` + parts.join(' · '), s.hits.length > 0);
  }
  function reset(id) {
    auto.plan = null; auto.done = true;
    if (id && STARTS[id]) startId = id;
    const p = STARTS[startId];
    Object.assign(s, { x: p.x, z: p.z, th: p.th, psi: p.th, phi: 0, v: 0, dist: 0, hits: [] });
    while (trail.children.length) trail.remove(trail.children[0]);
    lastR = null; lastT = null;
    s.hits = checkHits(corners()); place(); status();
  }
  function setVehicle(id) {
    if (!VEHICLES[id]) return;
    vid = id; V = VEHICLES[id]; applyVehicle();
    s.psi = s.th; s.hits = checkHits(corners()); place(); status();     // straighten the rig where it stands
  }
  function update(dt) {
    if (!s.active) return;
    dt = Math.min(dt, 0.05);
    if (autoUpdate(dt)) return;                       // autopilot has the wheel
    const k = s.keys, slow = k.ShiftLeft || k.ShiftRight;
    if (Object.values(k).some(Boolean)) auto.plan = null;   // any manual input cancels a finished autopilot run
    const target = (k.ArrowUp ? 1 : 0) - (k.ArrowDown ? 1 : 0);
    const vMax = target > 0 ? (slow ? 4 : 11) : (slow ? 2.5 : 6);
    s.v += THREE.MathUtils.clamp(target * vMax - s.v, -18 * dt, 18 * dt);
    if (!target && Math.abs(s.v) < 0.2) s.v = 0;
    const steerT = ((k.ArrowLeft ? -1 : 0) + (k.ArrowRight ? 1 : 0)) * THREE.MathUtils.degToRad(V.maxSteer);
    s.phi += THREE.MathUtils.clamp(steerT - s.phi, -1.4 * dt, 1.4 * dt);
    if (s.v !== 0) {
      const ds = s.v * dt;
      s.x += Math.cos(s.th) * ds; s.z += Math.sin(s.th) * ds;
      s.th += (ds / V.wb1) * Math.tan(s.phi);
      let art = Math.atan2(Math.sin(s.th - s.psi), Math.cos(s.th - s.psi));
      s.psi += (ds / V.wb2) * Math.sin(art);
      art = Math.atan2(Math.sin(s.th - s.psi), Math.cos(s.th - s.psi));
      if (Math.abs(art) > JACKKNIFE) { s.psi = s.th - Math.sign(art) * JACKKNIFE; s.v = 0; }
      s.dist += Math.abs(ds);
      s.hits = checkHits(corners());
      if (s.dist > 1.5) { addTrail(s.hits.length > 0); s.dist = 0; }
      place(); status();
      const hitNow = s.hits.length > 0;
      tractor.material = hitNow ? matHit : matTractor; cabRoof.material = tractor.material; trailer.material = hitNow ? matHit : matTrailer;
      if (s.follow) {
        const off = camera.position.clone().sub(controls.target);
        controls.target.set(s.x, 0, s.z); camera.position.copy(controls.target).add(off);
      }
    }
  }
  function setActive(on) { s.active = on; group.visible = on; s.keys = {}; if (on) { place(); status(); } }
  function key(code, down) { s.keys[code] = down; }

  // ------------------------------------------------------------------ autopilot (replays maneuvers found by the planner)
  // Exact fixed-step integrator + backing controller, identical to scratch/dock_planner.py.
  const DS = 0.25, DOCK_Z = -16, WALL_X = -73.75, BUMPER = 0.5;
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  function autoStep(ds, phi) {
    s.x += Math.cos(s.th) * ds; s.z += Math.sin(s.th) * ds;
    s.th += (ds / V.wb1) * Math.tan(phi);
    const a = wrap(s.th - s.psi);
    s.psi += (ds / V.wb2) * Math.sin(a);
  }
  function rearPt() { return { x: s.x + V.rRear * Math.cos(s.psi), z: s.z + V.rRear * Math.sin(s.psi) }; }
  function reversePhi() {
    const KA = 1.6, KB = 0.09, LA = 28.0;
    const r = rearPt();
    const px = Math.min(r.x + LA, WALL_X), pz = DOCK_Z;
    const psiD = Math.atan2(pz - r.z, px - r.x) + Math.PI;
    const e = wrap(psiD - s.psi), a = wrap(s.th - s.psi);
    let aD = Math.max(-0.7, Math.min(0.7, -KA * e));
    if (Math.abs(a) > 1.05) aD = 0;
    const m = THREE.MathUtils.degToRad(V.maxSteer);
    return Math.max(-m, Math.min(m, Math.atan(V.wb1 * (Math.sin(a) / V.wb2 - KB * (aD - a)))));
  }
  const auto = { plan: null, phase: 0, seg: 0, left: 0, budget: 0, done: false, result: '', ignoreDumpster: false };
  function playPlan(planDef) {
    reset('alley');
    auto.plan = planDef; auto.phase = 0; auto.seg = 0; auto.done = false; auto.result = '';
    auto.ignoreDumpster = !!planDef.dumpsterMoved;
    const ph = planDef.phases[0];
    auto.left = ph.type === 'fwd' ? ph.segs[0][1] : ph.limit;
    s.v = 0; s.phi = 0;
  }
  function autoAdvance(dist) {
    // consume `dist` feet of travel through the plan phases, DS at a time
    while (dist > 0 && !auto.done) {
      const ph = auto.plan.phases[auto.phase];
      if (!ph) { finish('Plan ended before the wall'); return; }
      const d = Math.min(DS, dist); dist -= d;
      if (ph.type === 'fwd') {
        const seg = ph.segs[auto.seg];
        autoStep(d, THREE.MathUtils.degToRad(seg[0])); s.v = 8; s.phi = THREE.MathUtils.degToRad(seg[0]);
        auto.left -= d;
        if (auto.left <= 1e-6) { auto.seg++; if (auto.seg >= ph.segs.length) { nextPhase(); } else auto.left = ph.segs[auto.seg][1]; }
      } else {
        const phi = reversePhi(); autoStep(-d, phi); s.v = -4; s.phi = phi;
        auto.left -= d;
        const r = rearPt();
        if (r.x >= WALL_X - BUMPER) { dock(); return; }
        if (Math.abs(wrap(s.th - s.psi)) > JACKKNIFE) { finish('Stopped — jackknife'); return; }
        if (auto.left <= 1e-6) nextPhase();
      }
      s.dist += d;
      s.hits = checkHits(corners()).filter(h => !(auto.ignoreDumpster && h === 'dumpster'));
      if (s.dist > 1.5) { addTrail(s.hits.length > 0); s.dist = 0; }
      const stopList = auto.plan.stopOnHit;                       // true = any hit; array = only these
      if (stopList && s.hits.some(h => stopList === true || stopList.includes(h))) { finish('Stopped — hitting ' + s.hits.join(', ')); return; }
    }
    place(); status();
  }
  function nextPhase() {
    auto.phase++; auto.seg = 0;
    const ph = auto.plan.phases[auto.phase];
    if (!ph) { finish('Plan ended before reaching the wall'); return; }
    auto.left = ph.type === 'fwd' ? ph.segs[0][1] : ph.limit;
  }
  function dock() {
    const r = rearPt(); const dz = r.z - DOCK_Z, dpsi = THREE.MathUtils.radToDeg(wrap(s.psi - Math.PI));
    const ok = Math.abs(dz) <= 1 && Math.abs(dpsi) <= 3.5;
    finish((ok ? 'DOCKED ✓' : 'At the wall but off') + ` — ${Math.abs(dz * 12).toFixed(0)}" ${dz > 0 ? 'west' : 'east'} of centre, trailer ${Math.abs(dpsi).toFixed(1)}° off square`);
  }
  function finish(text) { auto.done = true; auto.result = text; s.v = 0; place(); status(); onStatus && onStatus(`${vid} autopilot: ${text}`, /Stopped|off\b/.test(text) && !/DOCKED/.test(text)); }
  function autoUpdate(dt) {
    if (!auto.plan || auto.done) return false;
    const ph = auto.plan.phases[auto.phase];
    const speed = ph && ph.type === 'fwd' ? 9 : 4.5;
    autoAdvance(speed * dt);
    const hitNow = s.hits.length > 0;
    tractor.material = hitNow ? matHit : matTractor; cabRoof.material = tractor.material; trailer.material = hitNow ? matHit : matTrailer;
    if (s.follow) { const off = camera.position.clone().sub(controls.target); controls.target.set(s.x, 0, s.z); camera.position.copy(controls.target).add(off); }
    return true;
  }
  function runPlanInstant(planDef) { playPlan(planDef); let guard = 0; while (!auto.done && guard++ < 20000) autoAdvance(DS); return { x: s.x, z: s.z, th: s.th, psi: s.psi, rear: rearPt(), result: auto.result }; }
  function stopAuto() { auto.plan = null; auto.done = true; s.v = 0; }

  applyVehicle();
  return { state: s, setActive, key, update, reset, setVehicle, playPlan, autoUpdate, runPlanInstant, stopAuto, get autoRunning() { return !!auto.plan && !auto.done; }, get autoResult() { return auto.result; }, get vehicle() { return vid; }, get start() { return startId; }, get active() { return s.active; }, set follow(v) { s.follow = v; }, get follow() { return s.follow; } };
}
