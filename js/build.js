// =============================================================================
//  Scene builder — turns data/property.js into three.js meshes.
//  Every pickable mesh carries userData = { name, details: [[k,v],...], notes, layer }
// =============================================================================
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { SITE, BLDG, WALLS, INTERIOR, EXTRAS, STAIRWELL, ROOF_T, WALL_T, gradeAt } from '../data/property.js';

const UP = new THREE.Vector3(0, 1, 0);
const SLOPE = Math.atan(BLDG.A.pitch);

// -----------------------------------------------------------------------------
//  Procedural textures
// -----------------------------------------------------------------------------
function canvasTex(size, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function noise(ctx, size, base, spread, n = 2500, dot = 2) {
  ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < n; i++) {
    const v = Math.floor(Math.random() * spread) - spread / 2;
    ctx.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 255})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, dot, dot);
  }
}
// one tile = 1 ft of ribbed metal panel (ribs every 12", minor ribs at 4")
function ribTex(tint) {
  return canvasTex(64, (ctx, s) => {
    ctx.fillStyle = tint; ctx.fillRect(0, 0, s, s);
    const g = ctx.createLinearGradient(0, 0, s, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.18)'); g.addColorStop(0.08, 'rgba(255,255,255,0.10)');
    g.addColorStop(0.16, 'rgba(0,0,0,0)'); g.addColorStop(0.9, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(s * 0.33, 0, 2, s); ctx.fillRect(s * 0.66, 0, 2, s);
  });
}

export const TEX = {};
function initTextures() {
  if (TEX.ready) return;
  TEX.panelOld = ribTex('#e6e3d6');
  TEX.panelNew = ribTex('#3a3e44');
  TEX.roof = ribTex('#a8aaa6');
  TEX.liner = ribTex('#dcdcd4');
  TEX.asphalt = canvasTex(256, (ctx, s) => noise(ctx, s, '#6f6f6c', 40, 6000, 2), [1 / 12, 1 / 12]);
  TEX.gravel = canvasTex(256, (ctx, s) => noise(ctx, s, '#b7b1a4', 90, 9000, 2), [1 / 8, 1 / 8]);
  TEX.concrete = canvasTex(256, (ctx, s) => noise(ctx, s, '#c9c7bf', 30, 3000, 2), [1 / 10, 1 / 10]);
  TEX.grass = canvasTex(256, (ctx, s) => noise(ctx, s, '#7e9a5a', 60, 9000, 2), [1 / 10, 1 / 10]);
  TEX.slab = canvasTex(256, (ctx, s) => noise(ctx, s, '#bdbcb6', 24, 2500, 2), [1 / 10, 1 / 10]);
  TEX.ready = true;
}

// -----------------------------------------------------------------------------
//  Materials
// -----------------------------------------------------------------------------
export const MAT = {};
function initMaterials() {
  if (MAT.ready) return;
  initTextures();
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0.05, ...o });
  MAT.panelOld = std({ map: TEX.panelOld, color: '#ffffff' });
  MAT.panelNew = std({ map: TEX.panelNew, color: '#ffffff', roughness: 0.6, metalness: 0.25 });
  MAT.liner = std({ map: TEX.liner, color: '#ffffff' });
  MAT.roof = std({ map: TEX.roof, color: '#ffffff', roughness: 0.55, metalness: 0.3 });
  MAT.trim = std({ color: '#9b9d99', roughness: 0.5, metalness: 0.4 });
  MAT.trimNew = std({ color: '#24272b', roughness: 0.5, metalness: 0.4 });
  MAT.steel = std({ color: '#7a3b2e', roughness: 0.7, metalness: 0.3 });        // red-oxide primer frames (per photos)
  MAT.steelGrey = std({ color: '#8d9096', roughness: 0.6, metalness: 0.5 });
  MAT.crane = std({ color: '#f0b429', roughness: 0.55, metalness: 0.3 });
  MAT.craneDark = std({ color: '#2b3a67', roughness: 0.6, metalness: 0.4 });
  MAT.ohDoor = std({ map: TEX.liner, color: '#f2f1ea', roughness: 0.7 });
  MAT.manDoor = std({ color: '#5a5e63', roughness: 0.7, metalness: 0.2 });
  MAT.glass = new THREE.MeshPhysicalMaterial({ color: '#8fb6c9', roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
  MAT.glassDark = new THREE.MeshPhysicalMaterial({ color: '#2f4858', roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
  MAT.partition = std({ color: '#f4f2ea', roughness: 0.95 });
  MAT.partitionNew = std({ color: '#f7efe2', roughness: 0.95 });
  MAT.slab = std({ map: TEX.slab, color: '#ffffff', roughness: 0.95 });
  MAT.slabLow = std({ color: '#a9a8a2', roughness: 0.95 });
  MAT.floor2 = std({ color: '#c8bfae', roughness: 0.9 });
  MAT.asphalt = std({ map: TEX.asphalt, color: '#ffffff', roughness: 1 });
  MAT.gravel = std({ map: TEX.gravel, color: '#ffffff', roughness: 1 });
  MAT.concrete = std({ map: TEX.concrete, color: '#ffffff', roughness: 1 });
  MAT.grass = std({ map: TEX.grass, color: '#ffffff', roughness: 1 });
  MAT.road = std({ color: '#5a5b59', roughness: 1 });
  MAT.stripe = std({ color: '#f5f0d8', roughness: 0.9 });
  MAT.yellow = std({ color: '#e5c15a', roughness: 0.9 });
  MAT.bumper = std({ color: '#222426', roughness: 0.9 });
  MAT.fence = new THREE.MeshStandardMaterial({ color: '#8f949a', transparent: true, opacity: 0.28, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.5, depthWrite: false });
  MAT.gate = new THREE.MeshStandardMaterial({ color: '#4c545c', transparent: true, opacity: 0.45, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.5, depthWrite: false });
  MAT.post = std({ color: '#5c6066', roughness: 0.5, metalness: 0.6 });
  MAT.retaining = std({ color: '#a29e93', roughness: 0.95 });
  MAT.stem = std({ color: '#b9b6ad', roughness: 0.95 });
  MAT.neighbor = new THREE.MeshStandardMaterial({ color: '#d9dad6', roughness: 0.9, transparent: true, opacity: 0.55 });
  MAT.trunk = std({ color: '#6b4f3a', roughness: 1 });
  MAT.leaf = std({ color: '#4f7a3a', roughness: 1 });
  MAT.dumpster = std({ color: '#2e6b3f', roughness: 0.7, metalness: 0.3 });
  MAT.screen = std({ color: '#8a7a5e', roughness: 0.9 });
  MAT.pole = std({ color: '#7d6a55', roughness: 1 });
  MAT.canopy = std({ color: '#1f2226', roughness: 0.5, metalness: 0.5 });
  MAT.mulch = std({ color: '#4a3a2c', roughness: 1 });
  MAT.propLine = new THREE.LineDashedMaterial({ color: '#d83a2a', dashSize: 4, gapSize: 2, linewidth: 1 });
  MAT.ready = true;
}

// -----------------------------------------------------------------------------
//  Helpers
// -----------------------------------------------------------------------------
function tag(mesh, name, details = [], notes = '', layer = 'walls') {
  mesh.userData = { name, details, notes, layer, pickable: true };
  return mesh;
}
function box(w, h, d, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  return m;
}
function label(text, x, y, z, cls = 'lbl') {
  const el = document.createElement('div'); el.className = cls; el.textContent = text;
  const o = new CSS2DObject(el); o.position.set(x, y, z); o.userData.isLabel = true;
  return o;
}
/** flat rectangle at a fixed elevation (slabs, decks) */
function flatRect(x0, x1, z0, z1, y, mat) {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
  const m = new THREE.Mesh(g, mat);
  m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); m.receiveShadow = true;
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (x1 - x0), uv.getY(i) * (z1 - z0));
  return m;
}
/** rectangle draped on the sloping ground: y = gradeAt(x) + yOff (+ optional extra displacement) */
function terrainRect(x0, x1, z0, z1, yOff, mat, opts = {}) {
  const seg = opts.seg ?? 4;
  const nx = Math.max(1, Math.round((x1 - x0) / seg)), nz = Math.max(1, Math.round((z1 - z0) / seg));
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, nx, nz);
  const pos = g.attributes.position, uv = g.attributes.uv;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  for (let i = 0; i < pos.count; i++) {
    const X = pos.getX(i) + cx, Z = -pos.getY(i) + cz;         // plane's local y → world -Z
    let Y = gradeAt(X) + yOff;
    if (opts.displace) Y += opts.displace(X, Z);
    pos.setXYZ(i, X, Y, Z);
    uv.setXY(i, X - x0, Z - z0);
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true;
  return m;
}
/** vertical ribbon (fence) from a→b whose bottom follows the ground */
function ribbon(a, b, h, mat, lift = 0) {
  const A = new THREE.Vector3(a[0], 0, a[1]), B = new THREE.Vector3(b[0], 0, b[1]);
  const L = A.distanceTo(B), n = Math.max(1, Math.round(L / 8));
  const verts = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = A.x + (B.x - A.x) * t, z = A.z + (B.z - A.z) * t, y = gradeAt(x) + lift;
    verts.push(x, y, z, x, y + h, z);
    if (i < n) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true;
  return m;
}
const basinDip = (X, Z) => {
  const b = SITE.basin, r2 = ((X - b.cx) / b.rx) ** 2 + ((Z - b.cz) / b.rz) ** 2;
  return r2 < 1 ? -b.depth * (1 - r2) : 0;
};

/** Build a wall from a→b (plan points) with a 2-D profile (u,v) and rectangular holes.
 *  profile: 'eave' (flat top at eave) or 'gable' (18 → 21 → 18).
 *  base + baseZ [c0,c1] (+ baseAxis 'z'|'x'): the wall bottom drops to `base` where the wall's plan
 *  coordinate falls inside the range (drive-in bay). */
function buildWall(w, b, mat, finish) {
  const a = new THREE.Vector3(w.a[0], 0, w.a[1]), bb = new THREE.Vector3(w.b[0], 0, w.b[1]);
  const L = a.distanceTo(bb);
  const d = bb.clone().sub(a).normalize();
  const n = d.clone().cross(UP);              // extrusion direction
  const eave = b.eave, peak = b.peak;
  const zAt = (u) => a.z + d.z * u;
  const topAt = (u) => (w.profile === 'eave') ? eave : (peak - Math.abs(zAt(u)) * b.pitch);
  const base = w.base ?? 0;

  // ranges of u where the bottom is at `base`
  const lows = [];
  if (w.baseZ) {
    const axis = w.baseAxis || 'z';
    const aC = axis === 'z' ? a.z : a.x, dC = axis === 'z' ? d.z : d.x;
    if (Math.abs(dC) > 1e-6) {
      let u0 = (w.baseZ[0] - aC) / dC, u1 = (w.baseZ[1] - aC) / dC;
      if (u0 > u1) [u0, u1] = [u1, u0];
      u0 = Math.max(0, u0); u1 = Math.min(L, u1);
      if (u1 > u0) lows.push([u0, u1]);
    }
  } else if (base !== 0) lows.push([0, L]);
  const baseAt = (u) => lows.some(([u0, u1]) => u >= u0 - 0.01 && u <= u1 + 0.01) ? base : 0;

  const shape = new THREE.Shape();
  shape.moveTo(0, baseAt(0));
  for (const [u0, u1] of lows) {
    if (u0 > 0.01) { shape.lineTo(u0, 0); shape.lineTo(u0, base); }
    shape.lineTo(u1, base);
    if (u1 < L - 0.01) shape.lineTo(u1, 0);
  }
  shape.lineTo(L, baseAt(L) === base && lows.length && lows[lows.length - 1][1] >= L - 0.01 ? base : 0);
  if (w.profile === 'eave') { shape.lineTo(L, eave); shape.lineTo(0, eave); }
  else {
    const uRidge = (0 - a.z) / (d.z || 1e-9);
    const pts = [[L, topAt(L)]];
    if (uRidge > 0.5 && uRidge < L - 0.5) pts.push([uRidge, peak]);
    pts.push([0, topAt(0)]);
    for (const [u, v] of pts) shape.lineTo(u, v);
  }
  shape.closePath();
  for (const o of (w.openings || [])) {
    const h = new THREE.Path();
    const s = baseAt(o.u + o.w / 2) + (o.sill ?? 0);
    h.moveTo(o.u, s); h.lineTo(o.u + o.w, s); h.lineTo(o.u + o.w, s + o.h); h.lineTo(o.u, s + o.h); h.closePath();
    shape.holes.push(h);
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: WALL_T, bevelEnabled: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true; mesh.receiveShadow = true;
  const m = new THREE.Matrix4().makeBasis(d, UP, n);
  mesh.applyMatrix4(m);
  mesh.position.copy(a).addScaledVector(n, -WALL_T / 2);
  const group = new THREE.Group();
  group.add(tag(mesh, w.name, [
    ['Length', `${L.toFixed(1)} ft`], ['Height', w.profile === 'eave' ? `${eave} ft eave` : `${eave} ft eave / ${peak} ft peak`],
    ['Finish', finish], ['Openings', String((w.openings || []).length)],
  ], w.notes || '', 'walls'));

  // opening infills (doors, glass) as thin panels centered in the wall — 'open' openings get nothing
  for (const o of (w.openings || []).filter(o => o.type !== 'open')) {
    const s = baseAt(o.u + o.w / 2) + (o.sill ?? 0);
    let pm, depth = 0.15, layer = 'doors';
    if (o.type === 'oh' || o.type === 'dock') pm = MAT.ohDoor;
    else if (o.type === 'man') pm = MAT.manDoor;
    else pm = (finish === 'panelNew') ? MAT.glass : MAT.glassDark;
    const pg = new THREE.BoxGeometry(o.w, o.h, depth);
    const p = new THREE.Mesh(pg, pm);
    p.castShadow = o.type !== 'win' && o.type !== 'glass'; p.receiveShadow = true;
    p.position.copy(a).addScaledVector(d, o.u + o.w / 2).addScaledVector(UP, s + o.h / 2);
    p.quaternion.setFromRotationMatrix(m);
    const dims = `${o.w}' w × ${o.h}' h` + (s ? `, sill at ${s > 0 ? '+' : ''}${s}'` : '');
    tag(p, o.label || o.type, [['Size', dims], ['Wall', w.name]], '', layer);
    group.add(p);
    if (o.type === 'dock') {           // rubber bumpers either side of the door on the stem wall
      for (const sgn of [-1, 1]) {
        const bp = box(0.8, 1.2, 0.5, MAT.bumper, 0, 0, 0);
        bp.position.copy(a).addScaledVector(d, o.u + o.w / 2 + sgn * (o.w / 2 - 0.8)).addScaledVector(UP, s - 0.7).addScaledVector(n, -0.5);
        bp.quaternion.setFromRotationMatrix(m); bp.userData = { layer: 'doors' }; group.add(bp);
      }
    }
    if (o.type === 'glass' || o.type === 'win') {
      const fm = (finish === 'panelNew') ? MAT.trimNew : MAT.trim;
      const t = 0.15;
      const frame = new THREE.Group();
      frame.add(box(o.w + 0.2, t, 0.25, fm, 0, o.h / 2, 0), box(o.w + 0.2, t, 0.25, fm, 0, -o.h / 2, 0),
                box(t, o.h, 0.25, fm, -o.w / 2, 0, 0), box(t, o.h, 0.25, fm, o.w / 2, 0, 0));
      if (o.type === 'glass') {
        if (o.h > 9) { frame.add(box(o.w, t, 0.25, fm, 0, -o.h / 2 + 7.2, 0)); frame.add(box(o.w, t, 0.25, fm, 0, -o.h / 2 + 9.0, 0)); }
        const mull = Math.floor(o.w / 3);
        for (let i = 1; i < mull; i++) frame.add(box(t, o.h, 0.25, fm, -o.w / 2 + i * (o.w / mull), 0, 0));
      }
      frame.position.copy(p.position); frame.quaternion.copy(p.quaternion);
      frame.traverse(c => { c.userData = { layer: 'doors' }; });
      group.add(frame);
    }
  }
  return group;
}

// -----------------------------------------------------------------------------
//  Buildings
// -----------------------------------------------------------------------------
function buildRoof(b) {
  const g = new THREE.Group();
  const L = b.x1 - b.x0 + 1.0;
  const halfW = 36.5;
  const slopeLen = Math.sqrt(halfW * halfW + (halfW * b.pitch) ** 2);
  const cx = (b.x0 + b.x1) / 2;
  for (const sgn of [-1, 1]) {
    const geo = new THREE.BoxGeometry(L, ROOF_T, slopeLen);
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * L, uv.getY(i) * slopeLen);
    const m = new THREE.Mesh(geo, MAT.roof); m.castShadow = true; m.receiveShadow = true;
    const zc = sgn * halfW / 2;
    m.position.set(cx, b.peak - Math.abs(zc) * b.pitch + ROOF_T / 2 + 0.05, zc);
    m.rotation.x = sgn * SLOPE;      // each slope falls away from the centerline ridge
    tag(m, `${b.name} — roof (${sgn < 0 ? 'east' : 'west'} slope)`, [['Pitch', '1:12'], ['Eave', `${b.eave} ft`], ['Peak', `~${b.peak} ft`], ['Area', `${(L * slopeLen).toFixed(0)} SF per slope`]], 'Standing-seam / R-panel metal roof. Roof-top units and skylights not modeled.', 'roof');
    g.add(m);
  }
  const ridge = box(L, 0.4, 1.4, MAT.trim, cx, b.peak + ROOF_T + 0.2, 0); ridge.userData = { layer: 'roof' }; g.add(ridge);
  return g;
}

function buildStructure(b) {
  const g = new THREE.Group();
  const half = b.steelHalf ?? 35.5;
  const bayLen = (b.x1 - b.x0) / b.bays;
  const colH = b.peak - half * b.pitch - ROOF_T - 1.5;   // to underside of rafter at the haunch
  const D = BLDG.driveIn;
  for (let i = 0; i <= b.bays; i++) {
    const x = b.x0 + i * bayLen;
    if (b.id === 'A' && i === 0) continue;                // x = 0 frame is drawn with B
    for (const sgn of [-1, 1]) {
      const z = sgn * half;
      // back-corner column on the west side stands on a 4' pedestal in the drive-in bay
      const inBay = b.id === 'B' && sgn > 0 && x >= D.x0 - 0.1 && x <= D.x1 + 0.1;
      const base = inBay ? -D.depth : 0;
      const h = colH - base;
      const col = box(0.7, h, 1.2, MAT.steel, x, base + h / 2, z);
      tag(col, `Rigid-frame column — ${b.id} line ${b.id === 'B' ? i + 1 : i}` + (inBay ? ' (on 4\' pedestal in the drive-in bay)' : ''), [['Height', `${h.toFixed(1)} ft`], ['Bay', `${bayLen.toFixed(1)} ft`]], inBay ? D.notes : '', 'structure');
      g.add(col);
      if (inBay) { const ped = box(1.4, D.depth, 1.8, MAT.retaining, x, -D.depth / 2, z); ped.userData = { layer: 'structure' }; g.add(ped); }
      const rl = Math.sqrt(half * half + (half * b.pitch) ** 2) + 0.6;
      const r = box(0.5, 1.5, rl, MAT.steel, x, 0, 0);
      const zc = sgn * half / 2;
      r.position.set(x, b.peak - Math.abs(zc) * b.pitch - ROOF_T - 0.75, zc);
      r.rotation.x = sgn * SLOPE;
      r.userData = { layer: 'structure' };
      g.add(r);
    }
  }
  const L = b.x1 - b.x0;
  for (const sgn of [-1, 1]) {
    for (let s = 2.5; s < 36; s += 5) {
      const p = box(L, 0.67, 0.2, MAT.steelGrey, (b.x0 + b.x1) / 2, b.peak - s * b.pitch - ROOF_T - 0.35, sgn * s);
      p.rotation.x = sgn * SLOPE; p.userData = { layer: 'structure' }; p.castShadow = false; g.add(p);
    }
  }
  return g;
}

function buildSlabs() {
  const g = new THREE.Group();
  const A = BLDG.A, B = BLDG.B, D = BLDG.driveIn;
  const s1 = flatRect(A.x0, A.x1, A.z0, A.z1, 0.02, MAT.slab); tag(s1, 'Suite A slab (FFE 100.00)', [['Area', '8,724 SF']], '', 'walls'); g.add(s1);
  // Suite B slab minus the drive-in bay
  const s2 = flatRect(B.x0, B.x1, B.z0, D.z0, 0.02, MAT.slab); tag(s2, 'Suite B slab (FFE 100.00)', [['Area', `~${Math.round(72 * 73.5 - (D.x1 - D.x0) * (D.z1 - D.z0)).toLocaleString()} SF at floor level`]], '', 'walls'); g.add(s2);
  const s3 = flatRect(D.x1, B.x1, D.z0, B.z1, 0.02, MAT.slab); s3.userData = { layer: 'walls' }; g.add(s3);
  // bay floor + its two retaining edges (slab edge = dock face inside the building)
  const bf = flatRect(D.x0, D.x1, D.z0, D.z1, -D.depth + 0.02, MAT.slabLow);
  tag(bf, D.name, [['Size', `${D.x1 - D.x0}' × ${D.z1 - D.z0}'`], ['Floor', '−4\'-0" (FFE 96.00)']], D.notes, 'walls'); g.add(bf);
  const e1 = box(D.x1 - D.x0, D.depth, 0.8, MAT.stem, (D.x0 + D.x1) / 2, -D.depth / 2, D.z0 - 0.4); e1.userData = { layer: 'walls' }; g.add(e1);
  const e2 = box(0.8, D.depth, D.z1 - D.z0, MAT.stem, D.x1 + 0.4, -D.depth / 2, (D.z0 + D.z1) / 2); e2.userData = { layer: 'walls' }; g.add(e2);
  const y1 = box(D.x1 - D.x0, 0.3, 0.5, MAT.yellow, (D.x0 + D.x1) / 2, 0.17, D.z0 + 0.25); y1.userData = { layer: 'walls' }; g.add(y1);
  const y2 = box(0.5, 0.3, D.z1 - D.z0, MAT.yellow, D.x1 - 0.25, 0.17, (D.z0 + D.z1) / 2); y2.userData = { layer: 'walls' }; g.add(y2);
  for (let i = 0; i < 4; i++) { const bp = box(0.5, 1.2, 0.8, MAT.bumper, D.x0 + 5 + i * 7, -0.7, D.z0 + 0.25); bp.userData = { layer: 'walls' }; g.add(bp); }
  // concrete stem walls where the slab stands above the falling grade (hidden below ground)
  const stem = (x0, x1, z0, z1) => { const m = box(x1 - x0, 5, z1 - z0, MAT.stem, (x0 + x1) / 2, -2.5, (z0 + z1) / 2); m.userData = { layer: 'walls' }; g.add(m); };
  stem(A.x0, A.x1 + 0.2, A.z0 - 0.2, A.z0 + 0.6); stem(A.x0, A.x1 + 0.2, A.z1 - 0.6, A.z1 + 0.2); stem(A.x1 - 0.6, A.x1 + 0.2, A.z0, A.z1);
  stem(B.x0 - 0.2, B.x1, B.z0 - 0.2, B.z0 + 0.6); stem(D.x1, B.x1, B.z1 - 0.6, B.z1 + 0.2); stem(B.x0 - 0.2, B.x0 + 0.6, B.z0, D.z0);
  // entry stoop: front lot sits ~½' below the slab
  const stoop = box(5, 0.6, 18, MAT.concrete, A.x1 + 2.5, -0.3, -3); tag(stoop, 'Entry stoop', [], 'Front lot is ~½\' below the slab at the door.', 'site'); g.add(stoop);
  return g;
}

function buildSecondFloor(version) {
  const g = new THREE.Group();
  const O = BLDG.office;
  const dz = EXTRAS[version]?.deck || { z0: O.z0, z1: O.z1 };
  const slab = box(O.x1 - O.x0, O.slabT, dz.z1 - dz.z0, MAT.floor2, (O.x0 + O.x1) / 2, O.floor2 - O.slabT / 2, (dz.z0 + dz.z1) / 2);
  tag(slab, 'Second-floor office deck', [['Size', `${O.x1 - O.x0}' × ${dz.z1 - dz.z0}' = ${((O.x1 - O.x0) * (dz.z1 - dz.z0)).toLocaleString()} SF`], ['Floor level', `+${O.floor2}'`]],
    dz.z0 > O.z0 ? 'Deck removed over the showroom (right of the entrance) in the remodel.' : 'Two-story office block, 25\' deep per owner. Floor-to-floor assumed 9\'-6".', 'interior');
  g.add(slab);
  // stairwell in the warehouse behind reception (owner): the stair climbs from the EAST end toward the WEST,
  // lands at the west end and goes through the upstairs door in the office back wall
  const S = STAIRWELL, run = S.run, rise = O.floor2, sw = 3.8, sx = (S.x0 + S.x1) / 2;
  const zBot = S.z0 + 1, zTop = zBot + run;
  const st = box(sw, 0.8, run + 0.5, MAT.partition, sx, rise / 2, (zBot + zTop) / 2);
  st.rotation.x = -Math.atan2(rise, run);                       // +Z (west) end is the high end
  tag(st, 'Stairwell to the upstairs offices', [['Rise', `${rise}'`], ['Run', `${run}'`], ['Direction', 'up from east to west'], ['Where', 'in the warehouse, behind reception']], 'Owner: enclosed stairwell in the warehouse behind the reception, climbing east → west; reached through the glass double door.', 'interior');
  g.add(st);
  const landing = box(S.x1 - S.x0, O.slabT, S.z1 - zTop + 0.5, MAT.floor2, sx, O.floor2 - O.slabT / 2, (zTop + S.z1) / 2 - 0.25); landing.userData = { layer: 'interior' }; g.add(landing);
  const rail = box(0.12, 3.2, run + 0.5, MAT.fence, sx - sw / 2, rise / 2 + 1.6, (zBot + zTop) / 2); rail.rotation.x = st.rotation.x; rail.userData = { layer: 'interior' }; g.add(rail);

  // Suite B two-story block: mezzanine deck + stair along its east face (out in the shop)
  const B = BLDG.officeB;
  if (B) {
    const deck = box(B.x1 - B.x0, B.slabT, B.z1 - B.z0, MAT.floor2, (B.x0 + B.x1) / 2, B.floor2 - B.slabT / 2, (B.z0 + B.z1) / 2);
    tag(deck, 'Suite B mezzanine — office over break room', [['Size', `${B.x1 - B.x0}' × ${B.z1 - B.z0}'`], ['Floor level', `+${B.floor2}'`]], 'Owner: 20×20 two-story block in the front-west corner of Suite B; break room below, office above.', 'interior');
    g.add(deck);
    const sRun = B.stairX1 - B.stairX0, sW = B.stairZ1 - B.stairZ0, sz = (B.stairZ0 + B.stairZ1) / 2;
    const stB = box(sRun + 0.5, 0.8, sW, MAT.partition, (B.stairX0 + B.stairX1) / 2, B.floor2 / 2, sz);
    stB.rotation.z = Math.atan2(B.floor2, sRun);
    tag(stB, 'Stair to Suite B upstairs office', [['Rise', `${B.floor2}'`], ['Run', `${sRun}'`], ['Side', 'east face of the block, in the shop']], 'Owner: staircase on the east side inside Suite B.', 'interior');
    g.add(stB);
    const landing = box(B.x1 - B.stairX1, B.slabT, sW, MAT.floor2, (B.stairX1 + B.x1) / 2, B.floor2 - B.slabT / 2, sz); landing.userData = { layer: 'interior' }; g.add(landing);
    const railB = box(sRun + 0.5, 3.2, 0.12, MAT.fence, (B.stairX0 + B.stairX1) / 2, B.floor2 / 2 + 1.6, B.stairZ0); railB.rotation.z = stB.rotation.z; railB.userData = { layer: 'interior' }; g.add(railB);
    const railL = box(B.x1 - B.stairX1, 3.2, 0.12, MAT.fence, (B.stairX1 + B.x1) / 2, B.floor2 + 1.6, B.stairZ0); railL.userData = { layer: 'interior' }; g.add(railL);
  }
  return g;
}

function buildPartitions(version) {
  const g = new THREE.Group();
  const data = INTERIOR[version];
  const mat = version === 'office' ? MAT.partitionNew : MAT.partition;
  for (const p of data.partitions) {
    const a = new THREE.Vector3(p.a[0], 0, p.a[1]), b = new THREE.Vector3(p.b[0], 0, p.b[1]);
    const L = a.distanceTo(b); if (L < 0.1) continue;
    const d = b.clone().sub(a).normalize(); const n = d.clone().cross(UP);
    const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(L, 0); shape.lineTo(L, p.h); shape.lineTo(0, p.h); shape.closePath();
    for (const dr of p.doors) { const dh = dr.dh ?? 7; const h = new THREE.Path(); h.moveTo(dr.u, 0); h.lineTo(dr.u + dr.w, 0); h.lineTo(dr.u + dr.w, dh); h.lineTo(dr.u, dh); h.closePath(); shape.holes.push(h); }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: p.t, bevelEnabled: false });
    const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true;
    const basis = new THREE.Matrix4().makeBasis(d, UP, n);
    m.applyMatrix4(basis);
    m.position.copy(a).addScaledVector(n, -p.t / 2).addScaledVector(UP, p.y0);
    tag(m, version === 'office' ? 'Partition (remodel layout)' : 'Partition (existing, assumed layout)', [['Length', `${L.toFixed(1)} ft`], ['Height', `${p.h} ft`], ['Level', p.y0 > 0 ? 'Upstairs' : 'Ground']], 'Wall positions are schematic — no floor plan exists; rooms per owner description.', 'interior');
    g.add(m);
    // outline every wall so each panel and opening reads clearly
    MAT.edge = MAT.edge || new THREE.LineBasicMaterial({ color: '#2a2d31', transparent: true, opacity: 0.85 });
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), MAT.edge);
    edges.applyMatrix4(basis); edges.position.copy(m.position); edges.userData = { layer: 'interior' };
    g.add(edges);
    // glass doors (the reception → warehouse double door) get a translucent leaf with a frame
    for (const dr of p.doors.filter(x => x.glass)) {
      const dh = dr.dh ?? 7;
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(dr.w, dh, 0.12), MAT.glass);
      leaf.position.copy(a).addScaledVector(d, dr.u + dr.w / 2).addScaledVector(UP, p.y0 + dh / 2);
      leaf.quaternion.setFromRotationMatrix(basis);
      tag(leaf, 'Glass double door — reception to warehouse / stairwell', [['Size', `${dr.w}' × ${dh}'`]], 'Owner: glass double door in the reception leads to the warehouse and the stairwell.', 'interior');
      g.add(leaf);
      const mull = new THREE.Mesh(new THREE.BoxGeometry(0.12, dh, 0.2), MAT.trim); mull.position.copy(leaf.position); mull.quaternion.copy(leaf.quaternion); mull.userData = { layer: 'interior' }; g.add(mull);
    }
  }
  for (const r of data.rooms) {
    const up = /\(up\)/.test(r.name);
    g.add(label(r.name.replace(' (up)', ''), r.at[0], up ? BLDG.office.floor2 + 4.5 : 4.5, r.at[1], 'lbl room' + (up ? ' up' : '')));
  }
  return g;
}

// a "photo" of a house for the conference-room wall
function houseTexture(i) {
  const c = document.createElement('canvas'); c.width = 320; c.height = 220;
  const ctx = c.getContext('2d');
  const skies = ['#9fc5e8', '#b8d4ea', '#f4c6a0', '#cfe0f0'], bodies = ['#e9e2d3', '#b9c2c9', '#c99b7a', '#f0eee8'], roofs = ['#4a4f57', '#6b3f2f', '#3b4a5a', '#7a7a72'];
  const sky = ctx.createLinearGradient(0, 0, 0, 140); sky.addColorStop(0, skies[i % 4]); sky.addColorStop(1, '#eef5fa');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 320, 150);
  ctx.fillStyle = '#7e9a5a'; ctx.fillRect(0, 150, 320, 70);
  ctx.fillStyle = '#6f6f6c'; ctx.fillRect(200, 160, 120, 60);                      // driveway
  ctx.fillStyle = bodies[i % 4]; ctx.fillRect(60, 90, 200, 70);                      // body
  ctx.fillStyle = roofs[i % 4];
  ctx.beginPath(); ctx.moveTo(45, 92); ctx.lineTo(160, 40 - (i % 2) * 8); ctx.lineTo(275, 92); ctx.closePath(); ctx.fill();   // roof
  ctx.fillStyle = '#3a3e44'; ctx.fillRect(150, 118, 22, 42);                         // door
  ctx.fillStyle = '#7fb3d5'; for (const x of [80, 115, 195, 230]) { ctx.fillRect(x, 105, 22, 24); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x, 105, 22, 24); ctx.beginPath(); ctx.moveTo(x + 11, 105); ctx.lineTo(x + 11, 129); ctx.moveTo(x, 117); ctx.lineTo(x + 22, 117); ctx.stroke(); }
  ctx.fillStyle = '#4f7a3a'; for (const x of [30, 290]) { ctx.beginPath(); ctx.arc(x, 135, 22, 0, Math.PI * 2); ctx.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function buildFurniture(version) {
  const g = new THREE.Group();
  const ex = EXTRAS[version] || {};
  const wood = MAT.wood || (MAT.wood = new THREE.MeshStandardMaterial({ color: '#7a5a3a', roughness: 0.6 }));
  const black = MAT.black || (MAT.black = new THREE.MeshStandardMaterial({ color: '#1c1e21', roughness: 0.5, metalness: 0.3 }));
  const fabric = MAT.fabric || (MAT.fabric = new THREE.MeshStandardMaterial({ color: '#3f4f66', roughness: 0.9 }));
  const screen = MAT.screen || (MAT.screen = new THREE.MeshStandardMaterial({ color: '#0f1a26', roughness: 0.2, metalness: 0.4, emissive: '#1b3552', emissiveIntensity: 0.5 }));

  // ---- conference room
  const C = ex.conference;
  if (C) {
    const cx = (C.x0 + C.x1) / 2, cz = (C.z0 + C.z1) / 2;
    const tl = 12, tw = 4, th = 2.5;
    const top = box(tl, 0.15, tw, wood, cx, th, cz);
    tag(top, 'Conference table', [['Size', `${tl}' × ${tw}'`], ['Seats', '10']], 'Conference room at the west end of the office block (owner).', 'interior');
    g.add(top);
    for (const dx of [-tl / 2 + 1.2, tl / 2 - 1.2]) { const leg = box(0.6, th, tw - 1.2, black, cx + dx, th / 2, cz); leg.userData = { layer: 'interior' }; g.add(leg); }
    const chair = (x, z, rotY) => {
      const ch = new THREE.Group();
      ch.add(box(1.5, 0.15, 1.5, fabric, 0, 1.5, 0), box(1.5, 1.4, 0.15, fabric, 0, 2.3, -0.7), box(0.12, 1.5, 0.12, black, 0, 0.75, 0));
      ch.position.set(x, 0, z); ch.rotation.y = rotY; ch.traverse(o => { o.userData = { layer: 'interior' }; }); return ch;
    };
    for (let i = 0; i < 4; i++) {
      const x = cx - tl / 2 + 1.5 + i * (tl - 3) / 3;
      g.add(chair(x, cz + tw / 2 + 1.1, Math.PI));      // west side, facing the table (facing −Z)
      g.add(chair(x, cz - tw / 2 - 1.1, 0));            // east side, facing +Z
    }
    g.add(chair(cx - tl / 2 - 1.1, cz, Math.PI / 2)); g.add(chair(cx + tl / 2 + 1.1, cz, -Math.PI / 2));
    // TV on the north (back) wall, at the head of the table, facing +X into the room
    const tv = box(0.15, 3.1, 5.5, screen, C.x0 + 0.4, 6, cz);
    tag(tv, '65" TV', [['Mounted', 'north (back) wall, head of the table']], 'Owner: TV on the north wall; no doorway on that side.', 'interior'); g.add(tv);
    const bezel = box(0.1, 3.4, 5.8, black, C.x0 + 0.33, 6, cz); bezel.userData = { layer: 'interior' }; g.add(bezel);
    // pictures of homes: two on the reception-side wall, two on the kitchen-side wall
    const pic = (i, x, y, z, rotY) => {
      const p = new THREE.Group();
      const frame = box(3.2, 2.3, 0.1, black, 0, 0, 0);
      const img = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 2.0), new THREE.MeshStandardMaterial({ map: houseTexture(i), roughness: 0.7 }));
      img.position.z = 0.06; p.add(frame, img);
      p.position.set(x, y, z); p.rotation.y = rotY;
      tag(frame, 'Framed photo — home', [['Size', '3\' × 2\'']], 'Pictures of homes on the conference-room walls (owner).', 'interior');
      img.userData = { layer: 'interior' };
      return p;
    };
    g.add(pic(0, cx - 5, 5.5, C.z0 + 0.35, 0));               // reception-side wall, faces +Z into the room
    g.add(pic(1, cx + 5, 5.5, C.z0 + 0.35, 0));
    g.add(pic(2, cx - 4.5, 5.5, C.z1 - 0.35, Math.PI));       // kitchen-side wall, faces −Z into the room (clear of the kitchen door)
    g.add(pic(3, cx + 6.5, 5.5, C.z1 - 0.35, Math.PI));
  }

  // ---- reception: desk facing the doors, chair behind it, waiting chairs + side table along the kitchen wall
  const Rc = ex.reception;
  if (Rc) {
    const chairR = (x, z, rotY) => {
      const ch = new THREE.Group();
      ch.add(box(1.5, 0.15, 1.5, fabric, 0, 1.5, 0), box(1.5, 1.4, 0.15, fabric, 0, 2.3, -0.7), box(0.12, 1.5, 0.12, black, 0, 0.75, 0));
      ch.position.set(x, 0, z); ch.rotation.y = rotY; ch.traverse(o => { o.userData = { layer: 'interior' }; }); return ch;
    };
    const desk = box(2.6, 3.6, Rc.deskW, wood, Rc.deskX, 1.8, Rc.deskZ);                       // front panel/body, long axis along Z
    tag(desk, 'Reception desk', [['Size', `${Rc.deskW}' × 2\'-6"`], ['Facing', 'the entrance']], 'Reception furniture (owner).', 'interior');
    g.add(desk);
    const top = box(1.2, 0.15, Rc.deskW + 0.4, black, Rc.deskX + 0.9, 3.7, Rc.deskZ); top.userData = { layer: 'interior' }; g.add(top);   // transaction top
    const work = box(2.2, 0.1, Rc.deskW - 0.4, wood, Rc.deskX - 0.4, 2.5, Rc.deskZ); work.userData = { layer: 'interior' }; g.add(work);
    g.add(chairR(Rc.deskX - 2.6, Rc.deskZ, -Math.PI / 2));                                       // desk chair, facing +X (the doors)
    for (const x of Rc.chairsX) g.add(chairR(x, Rc.chairsZ, Math.PI));                           // waiting chairs, backs to the kitchen wall
    const side = box(1.6, 1.6, 1.6, wood, Rc.chairsX[Rc.chairsX.length - 1] + 2.3, 0.8, Rc.chairsZ); side.userData = { layer: 'interior' }; g.add(side);
    const plant = new THREE.Mesh(new THREE.SphereGeometry(1.0, 8, 6), MAT.leaf); plant.position.set(Rc.chairsX[0] - 2.3, 2.6, Rc.chairsZ); plant.scale.y = 1.4; plant.userData = { layer: 'interior' }; g.add(plant);
  }

  // ---- showroom sliding door: bi-parting glass leaves on a top track, shown mostly open
  const D = ex.showroomDoor;
  if (D) {
    const w = D.x1 - D.x0, leafW = w / 2 + 0.15, zf = D.z + 0.45;          // hung on the reception side of the divider
    const track = box(w * 2 + 1, 0.35, 0.35, black, (D.x0 + D.x1) / 2, D.h + 0.35, zf);
    tag(track, 'Showroom sliding door — top track', [['Opening', `${w}' × ${D.h}'`]], 'Large bi-parting glass slider between reception and showroom (owner).', 'interior');
    g.add(track);
    for (const sgn of [-1, 1]) {
      const closedX = (D.x0 + D.x1) / 2 + sgn * leafW / 2;                   // leaf position when closed
      const x = closedX + sgn * leafW * D.open;                              // slid open along the wall
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(leafW, D.h - 0.2, 0.12), MAT.glass);
      leaf.position.set(x, D.h / 2, zf);
      tag(leaf, 'Showroom sliding door — glass leaf', [['Leaf', `${leafW.toFixed(1)}' × ${D.h}'`], ['Shown', `${Math.round(D.open * 100)}% open`]], 'Bi-parting: one leaf parks toward the front wall, one toward the back.', 'interior');
      g.add(leaf);
      const fr = new THREE.Group();
      fr.add(box(leafW, 0.2, 0.18, black, 0, D.h / 2 - 0.15, 0), box(leafW, 0.2, 0.18, black, 0, -D.h / 2 + 0.15, 0), box(0.2, D.h - 0.2, 0.18, black, -leafW / 2 + 0.1, 0, 0), box(0.2, D.h - 0.2, 0.18, black, leafW / 2 - 0.1, 0, 0));
      fr.position.copy(leaf.position); fr.traverse(o => { o.userData = { layer: 'interior' }; }); g.add(fr);
      const hanger = box(0.3, 0.5, 0.3, black, x - sgn * leafW / 3, D.h + 0.05, zf); hanger.userData = { layer: 'interior' }; g.add(hanger);
    }
  }
  return g;
}

function buildCrane() {
  const g = new THREE.Group();
  const C = BLDG.crane, B = BLDG.B;
  const beamH = 1.5, railH = 0.25;
  const yBeam = C.topOfRail - railH - beamH / 2;
  const L = C.runwayX1 - C.runwayX0, xc = (C.runwayX0 + C.runwayX1) / 2;
  for (const sgn of [-1, 1]) {
    const z = sgn * C.railZ;
    const beam = box(L, beamH, 0.8, MAT.steel, xc, yBeam, z);
    tag(beam, 'Crane runway beam', [['Top of rail', `${C.topOfRail.toFixed(2)} ft (13\'-4")`], ['Length', `${L.toFixed(0)} ft`]], C.notes, 'crane');
    g.add(beam);
    const rail = box(L, railH, 0.3, MAT.steelGrey, xc, C.topOfRail - railH / 2, z); rail.userData = { layer: 'crane' }; g.add(rail);
    const bayLen = (B.x1 - B.x0) / B.bays;
    for (let i = 0; i <= B.bays; i++) {
      const x = B.x0 + i * bayLen;
      if (x < C.runwayX0 - 2 || x > C.runwayX1 + 2) continue;      // brackets only where the runway exists
      const br = box(1.2, 2.2, 2.2, MAT.steel, x, yBeam - 1.2, z + sgn * 1.4); br.userData = { layer: 'crane' }; g.add(br);
    }
    const stop = box(0.6, 2.2, 1.2, MAT.craneDark, C.runwayX1 + 0.3, C.topOfRail + 1.1, z); stop.userData = { layer: 'crane' }; g.add(stop);   // end stop
  }
  const span = C.railZ * 2;
  const girder = box(1.4, 2.6, span, MAT.crane, C.bridgeX, C.topOfRail + 0.9 + 1.3, 0);
  tag(girder, C.name, [['Span', `${C.span} ft`], ['Capacity', '5 ton'], ['Top of rail', '13\'-4"'], ['Hook height', `${C.hookHeight} ft`]], C.notes, 'crane');
  g.add(girder);
  for (const sgn of [-1, 1]) { const et = box(5, 1.6, 2.2, MAT.craneDark, C.bridgeX, C.topOfRail + 0.8, sgn * (C.railZ - 0.2)); et.userData = { layer: 'crane' }; g.add(et); }
  const trolley = box(2.6, 1.6, 2.4, MAT.craneDark, C.bridgeX, C.topOfRail + 0.9 - 0.8, C.trolleyZ); trolley.userData = { layer: 'crane' }; g.add(trolley);
  const cable = box(0.08, C.topOfRail - C.hookHeight + 1, 0.08, MAT.steelGrey, C.bridgeX, (C.topOfRail + C.hookHeight) / 2, C.trolleyZ); cable.userData = { layer: 'crane' }; g.add(cable);
  const blockM = box(1.0, 1.2, 0.6, MAT.crane, C.bridgeX, C.hookHeight + 0.4, C.trolleyZ); blockM.userData = { layer: 'crane' }; g.add(blockM);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.12, 8, 16, Math.PI * 1.5), MAT.steelGrey);
  hook.position.set(C.bridgeX, C.hookHeight - 0.6, C.trolleyZ); hook.rotation.z = Math.PI * 0.75; hook.userData = { layer: 'crane' }; g.add(hook);
  g.add(label('EMH 5-ton · 65\' span', C.bridgeX, C.topOfRail + 4.5, 0, 'lbl crane'));
  return g;
}

function textTexture(text, w, h) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * h / w);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.font = `900 ${Math.round(c.height * 0.8)}px "Segoe UI Black", "Arial Black", "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '18px';
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, c.width / 2, c.height / 2 + 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function buildFacadeExtras(version) {
  const g = new THREE.Group();
  const ex = EXTRAS[version] || {};
  const x = BLDG.A.x1;
  // entry canopy on tension rods that run from its outer edge back to plates on the wall
  const c = ex.canopy;
  if (c) {
    const w = c.u1 - c.u0, zc = 36 - (c.u0 + c.u1) / 2;
    const slab = box(c.depth, 0.35, w, MAT.canopy, x + c.depth / 2, c.y, zc);
    tag(slab, 'New entry canopy', [['Size', `${w}' wide × ${c.depth}' deep`], ['Height', `${c.y}' to underside`]], 'Steel canopy on tension rods anchored to the wall girts (optional budget line).', 'doors');
    g.add(slab);
    for (const sgn of [-1, 1]) {
      const z = zc + sgn * (w / 2 - 0.6);
      const A = new THREE.Vector3(x + c.depth - 0.3, c.y + 0.2, z);          // canopy outer edge
      const B = new THREE.Vector3(x + WALL_T / 2 + 0.15, c.y + 4.2, z);      // wall plate
      const dir = B.clone().sub(A), len = dir.length();
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, len, 8), MAT.canopy);
      rod.position.copy(A).add(B).multiplyScalar(0.5);
      rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      rod.userData = { layer: 'doors' }; g.add(rod);
      const plate = box(0.3, 0.9, 0.9, MAT.canopy, B.x, B.y, z); plate.userData = { layer: 'doors' }; g.add(plate);
    }
  }
  // sign — channel letters on the gable
  const s = ex.sign;
  if (s) {
    const tex = textTexture(s.text, s.w, s.h);
    const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.05, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.55, roughness: 0.4, metalness: 0.2, side: THREE.DoubleSide });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(s.w, s.h), mat);
    sign.position.set(x + WALL_T / 2 + 0.45, s.y, s.z);
    sign.rotation.y = Math.PI / 2;
    sign.castShadow = false;
    tag(sign, `${s.text} sign — channel letters`, [['Size', `${s.w}' × ${s.h}'`], ['Mounted', `${s.y}' to centre, on the front gable`]], 'Illuminated channel letters (budget line: signage).', 'doors');
    g.add(sign);
    // raceway behind the letters
    const race = box(0.35, 0.6, s.w * 0.92, MAT.trimNew, x + WALL_T / 2 + 0.2, s.y - 0.9, s.z); race.userData = { layer: 'doors' }; g.add(race);
  }
  return g;
}

// -----------------------------------------------------------------------------
//  Site
// -----------------------------------------------------------------------------
function buildSite(version) {
  const g = new THREE.Group();
  const c = SITE.corners;
  const gy = (x, lift = 2) => gradeAt(x) + lift;

  // ground: everything follows the front→back fall; the basin is a bowl in it
  const ground = terrainRect(-420, 520, -330, 330, -0.06, MAT.grass, { seg: 10, displace: basinDip }); ground.userData = { layer: 'site' }; g.add(ground);
  const prop = terrainRect(c.SW[0], c.NE[0], c.NE[1], c.SE[1], 0.0, MAT.grass, { seg: 4, displace: basinDip });
  tag(prop, 'Parcel 056L D 020.00 000 — 1.11 ac', [['Lines', '485.07\' / 477.85\' / 100.06\' / 100.2\''], ['Zoning', 'CD-01'], ['Grade', 'falls ~4\' front → back (owner); profile in SITE.grade']], 'Corners scaled from the 2004 plan; deed calls per the plan bearings.', 'site');
  g.add(prop);
  const bs = SITE.basin;
  const outlet = box(4, 3.2, 4, MAT.retaining, -204, gradeAt(-204) - 2.6 + 1.6, 44); tag(outlet, 'Concrete outlet box', [['Size', '4\' × 4\'']], '2004 plan: outlet box + 18" ADS pipe to the creek.', 'site'); g.add(outlet);

  // surfaces draped on the grade
  let yy = 0.03;
  for (const s of SITE.surfaces) {
    const mat = { asphalt: MAT.asphalt, gravel: MAT.gravel, concrete: MAT.concrete }[s.kind];
    const m = terrainRect(s.x0, s.x1, s.z0, s.z1, yy, mat); yy += 0.004;
    tag(m, s.name, [['Size', `${(s.x1 - s.x0).toFixed(0)}' × ${(s.z1 - s.z0).toFixed(0)}' ≈ ${((s.x1 - s.x0) * (s.z1 - s.z0)).toLocaleString(undefined, { maximumFractionDigits: 0 })} SF`], ['Elevation', `${gradeAt(s.x0).toFixed(1)}' → ${gradeAt(s.x1).toFixed(1)}' vs slab`]], '', 'site');
    g.add(m);
  }

  // east side: ramp from the back yard up to a level pad at slab height in front of the side door
  const R = SITE.eastRamp;
  const zc = (R.z0 + R.z1) / 2, wz = R.z1 - R.z0;
  const y0 = gradeAt(R.rampX0), rl = R.rampX1 - R.rampX0, rise = R.padY - y0;
  const ramp = box(Math.sqrt(rl * rl + rise * rise), 0.5, wz, MAT.concrete, (R.rampX0 + R.rampX1) / 2, (y0 + R.padY) / 2 - 0.2, zc);
  ramp.rotation.z = Math.atan2(rise, rl);
  tag(ramp, 'East side ramp (concrete)', [['Length', `${rl}'`], ['Rise', `${rise.toFixed(1)}' (≈${(rise / rl * 100).toFixed(0)}%)`]], R.notes, 'site');
  g.add(ramp);
  const pad = box(R.padX1 - R.padX0, 0.5, wz, MAT.concrete, (R.padX0 + R.padX1) / 2, R.padY - 0.25, zc);
  tag(pad, 'East side concrete pad — level with the floor', [['Size', `${R.padX1 - R.padX0}' × ${wz}'`], ['Extent', '5\' back of the door to 10\' past it']], R.notes, 'site');
  g.add(pad);
  // fill under the ramp/pad and a curb where the pad ends (grade is lower in front of it)
  const fillPad = box(R.padX1 - R.padX0, 5, wz, MAT.stem, (R.padX0 + R.padX1) / 2, R.padY - 2.75, zc); fillPad.userData = { layer: 'site' }; g.add(fillPad);
  const fillRamp = box(rl, 5, wz, MAT.stem, (R.rampX0 + R.rampX1) / 2, (y0 + R.padY) / 2 - 2.9, zc); fillRamp.rotation.z = Math.atan2(rise, rl); fillRamp.userData = { layer: 'site' }; g.add(fillRamp);
  const curbDrop = R.padY - gradeAt(R.padX1);
  const curb = box(0.7, curbDrop + 0.3, wz, MAT.retaining, R.padX1 + 0.35, R.padY - curbDrop / 2 - 0.15 + 0.15, zc); curb.userData = { layer: 'site' }; g.add(curb);

  // retaining wall on the east line (neighbor sits higher)
  for (const rw of SITE.retainingWalls) {
    const m = box(rw.x1 - rw.x0, rw.top - rw.bottom, rw.t, MAT.retaining, (rw.x0 + rw.x1) / 2, (rw.top + rw.bottom) / 2, rw.z);
    tag(m, rw.name, [['Length', `${rw.x1 - rw.x0}'`], ['Exposed', `${(rw.top - gradeAt(rw.x1)).toFixed(1)}' at the front end → ${(rw.top - gradeAt(rw.x0)).toFixed(1)}' at the back`]], 'Neighbor (Case Lumber) grade is higher along this line.', 'site'); g.add(m);
  }
  // fences and gates follow the ground
  for (const f of SITE.fences) {
    const m = ribbon(f.a, f.b, f.h, f.gate ? MAT.gate : MAT.fence);
    const L = Math.hypot(f.b[0] - f.a[0], f.b[1] - f.a[1]);
    tag(m, f.name, [['Length', `${L.toFixed(0)}'`], ['Height', `${f.h}'`]], f.gate ? 'Owner: gate on the front of each side.' : '', 'site');
    g.add(m);
    const nPosts = Math.max(2, Math.round(L / 10) + 1);
    for (let i = 0; i < nPosts; i++) {
      const t = i / (nPosts - 1), x = f.a[0] + (f.b[0] - f.a[0]) * t, z = f.a[1] + (f.b[1] - f.a[1]) * t;
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, f.h + 0.3, 6), MAT.post);
      p.position.set(x, gradeAt(x) + f.h / 2, z); p.userData = { layer: 'site' }; g.add(p);
    }
    if (f.gate) g.add(label('GATE', (f.a[0] + f.b[0]) / 2, gy((f.a[0] + f.b[0]) / 2, f.h + 1), (f.a[1] + f.b[1]) / 2, 'lbl site'));
  }
  // property line (dashed, on the ground) + dimension labels
  const pts = [];
  const corners = [c.NE, c.SE, c.SW, c.NW, c.NE];
  for (let i = 0; i < 4; i++) {
    const [x0, z0] = corners[i], [x1, z1] = corners[i + 1]; const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 10));
    for (let k = 0; k < n; k++) { const t = k / n, x = x0 + (x1 - x0) * t; pts.push(new THREE.Vector3(x, gradeAt(x) + 0.3, z0 + (z1 - z0) * t)); }
  }
  pts.push(pts[0].clone());
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), MAT.propLine); line.computeLineDistances(); line.userData = { layer: 'site' }; g.add(line);
  g.add(label(`${SITE.lineLengths.north}'`, 30, gy(30, 1), -52, 'lbl dim'));
  g.add(label(`${SITE.lineLengths.south}'`, 30, gy(30, 1), 56, 'lbl dim'));
  g.add(label(`${SITE.lineLengths.east}'`, 279, gy(279, 1), 2, 'lbl dim'));
  g.add(label(`${SITE.lineLengths.west}'`, -213, gy(-213, 1), 2, 'lbl dim'));

  // road
  const rd = SITE.road;
  const road = terrainRect(rd.x0, rd.x1, rd.z0, rd.z1, 0.02, MAT.road, { seg: 10 }); tag(road, rd.name, [], 'Two-lane industrial street; the lot fronts it.', 'site'); g.add(road);
  const cl = terrainRect((rd.x0 + rd.x1) / 2 - 0.25, (rd.x0 + rd.x1) / 2 + 0.25, rd.z0, rd.z1, 0.05, MAT.yellow, { seg: 10 }); cl.userData = { layer: 'site' }; g.add(cl);
  g.add(label(rd.name, (rd.x0 + rd.x1) / 2, gy((rd.x0 + rd.x1) / 2), -60, 'lbl site big'));
  for (const [x, z] of SITE.poles) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 38, 8), MAT.pole); p.position.set(x, gradeAt(x) + 19, z); p.castShadow = true; p.userData = { layer: 'site' }; g.add(p);
    const arm = box(0.4, 0.4, 8, MAT.pole, x, gradeAt(x) + 34, z); arm.userData = { layer: 'site' }; g.add(arm);
  }
  // dumpster with screening (only if the data still has one)
  const D = SITE.dumpster;
  if (D) {
    const dy = gradeAt(D.x);
    const dm = box(D.w, D.h, D.d, MAT.dumpster, D.x, dy + D.h / 2, D.z); tag(dm, 'Dumpster w/ screening', [['Location', 'Back yard, per 2004 plan']], '', 'site'); g.add(dm);
    for (const seg of [[D.x - D.w / 2 - 1, D.x + D.w / 2 + 1, D.z - D.d / 2 - 1, D.z - D.d / 2 - 0.7], [D.x - D.w / 2 - 1, D.x - D.w / 2 - 0.7, D.z - D.d / 2 - 1, D.z + D.d / 2 + 1], [D.x + D.w / 2 + 0.7, D.x + D.w / 2 + 1, D.z - D.d / 2 - 1, D.z + D.d / 2 + 1]]) {
      const s = box(seg[1] - seg[0], D.screenH, seg[3] - seg[2], MAT.screen, (seg[0] + seg[1]) / 2, dy + D.screenH / 2, (seg[2] + seg[3]) / 2); s.userData = { layer: 'site' }; g.add(s);
    }
  }
  // trees
  const tree = (x, z, s = 1) => {
    const t = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5 * s, 0.7 * s, 9 * s, 7), MAT.trunk); trunk.position.y = 4.5 * s; trunk.castShadow = true;
    const c1 = new THREE.Mesh(new THREE.SphereGeometry(7 * s, 10, 8), MAT.leaf); c1.position.y = 13 * s; c1.castShadow = true;
    const c2 = new THREE.Mesh(new THREE.SphereGeometry(5 * s, 10, 8), MAT.leaf); c2.position.set(3 * s, 16 * s, 2 * s); c2.castShadow = true;
    t.add(trunk, c1, c2); t.position.set(x, gradeAt(x), z); t.traverse(o => { o.userData = { layer: 'site' }; });
    return t;
  };
  for (const [x, z] of SITE.treesOffsite) g.add(tree(x, z, 1.1));
  for (const [x, z] of SITE.treesFront) g.add(tree(x, z, 0.8));
  // neighbors (context only)
  for (const n of SITE.neighbors) {
    const base = gradeAt((n.x0 + n.x1) / 2) + (n.z1 < 0 ? 1.5 : 0);     // east neighbor sits higher
    const b = box(n.x1 - n.x0, n.h, n.z1 - n.z0, MAT.neighbor, (n.x0 + n.x1) / 2, base + n.h / 2, (n.z0 + n.z1) / 2);
    b.castShadow = false; b.userData = { layer: 'neighbors' }; g.add(b);
    g.add(label(n.name, (n.x0 + n.x1) / 2, base + n.h + 3, (n.z0 + n.z1) / 2, 'lbl site'));
  }
  // version extras: striping, planting bed
  const ex = EXTRAS[version] || {};
  if (ex.stripeLot) {
    const sg = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const x = 140 + i * 9.5;
      sg.add(terrainRect(x - 0.2, x + 0.2, -39, -21, 0.06, MAT.stripe)); sg.add(terrainRect(x - 0.2, x + 0.2, 33, 51, 0.06, MAT.stripe));
    }
    sg.add(terrainRect(139.8, 244.8, -39.2, -38.8, 0.06, MAT.stripe)); sg.add(terrainRect(139.8, 244.8, 32.8, 33.2, 0.06, MAT.stripe));
    sg.traverse(o => { o.userData = { layer: 'site' }; });
    tag(sg.children[0], 'Seal-coat & stripe — 22 stalls', [['Stall', '9\' × 18\'']], 'Optional budget line.', 'site');
    g.add(sg);
  }
  for (const p of (ex.plantingBeds || [])) {
    const bed = terrainRect(p.x0, p.x1, p.z0, p.z1, 0.08, MAT.mulch);
    tag(bed, 'Planting bed — small shrubs + mulch', [['Size', `${p.x1 - p.x0}' × ${p.z1 - p.z0}'`]], 'Both sides of the entry (budget line: landscaping).', 'site'); g.add(bed);
    const n = Math.max(2, Math.floor((p.z1 - p.z0) / 3.6)), xm = (p.x0 + p.x1) / 2;
    for (let i = 0; i < n; i++) {
      const z = p.z0 + 1.8 + i * ((p.z1 - p.z0 - 3.6) / (n - 1));
      const r = 1.1 + (i % 2) * 0.25;
      const bush = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), MAT.leaf);
      bush.position.set(xm, gradeAt(xm) + r * 0.8, z); bush.scale.y = 0.8; bush.castShadow = true; bush.userData = { layer: 'site' }; g.add(bush);
    }
  }
  // compass (true north)
  const tn = SITE.trueNorth;
  const compass = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 24, 8), MAT.trimNew); shaft.rotation.z = Math.PI / 2; shaft.position.x = 12;
  const head = new THREE.Mesh(new THREE.ConeGeometry(2, 6, 12), MAT.trimNew); head.rotation.z = -Math.PI / 2; head.position.x = 26;
  compass.add(shaft, head);
  compass.position.set(200, gradeAt(200) + 1, 95);
  compass.rotation.y = -Math.atan2(tn[1], tn[0]);
  compass.traverse(o => { o.userData = { layer: 'site' }; });
  g.add(compass);
  g.add(label('TRUE N', 200 + tn[0] * 30, gradeAt(200) + 3, 95 + tn[1] * 30, 'lbl dim'));
  return g;
}

// -----------------------------------------------------------------------------
//  Assemble
// -----------------------------------------------------------------------------
export function buildScene(version) {
  initMaterials();
  const root = new THREE.Group();
  root.name = 'root';
  const layers = {
    site: new THREE.Group(), walls: new THREE.Group(), roof: new THREE.Group(), structure: new THREE.Group(),
    interior: new THREE.Group(), doors: new THREE.Group(), crane: new THREE.Group(), labels: new THREE.Group(), neighbors: new THREE.Group(),
  };
  for (const k in layers) { layers[k].name = k; root.add(layers[k]); }

  const wallGroup = new THREE.Group();
  for (const w of WALLS[version]) {
    const b = BLDG[w.bldg];
    const finish = w.finish || 'panelOld';
    wallGroup.add(buildWall(w, b, MAT[finish], finish === 'panelNew' ? 'New insulated wall panels' : finish === 'liner' ? 'Liner panel' : 'Existing R-panel'));
  }
  layers.walls.add(wallGroup);
  layers.walls.add(buildSlabs());
  layers.roof.add(buildRoof(BLDG.A), buildRoof(BLDG.B));
  layers.structure.add(buildStructure(BLDG.A), buildStructure(BLDG.B));
  layers.interior.add(buildSecondFloor(version), buildPartitions(version), buildFurniture(version));
  layers.crane.add(buildCrane());
  layers.doors.add(buildFacadeExtras(version));
  layers.site.add(buildSite(version));

  const L = layers.labels, D = BLDG.driveIn;
  L.add(label('SUITE A — original 72\' × 121\'', 60, 26, 0, 'lbl big'));
  L.add(label('SUITE B — 2006 Kirby addition 70\' × 73.5\'', -37, 26, 0, 'lbl big'));
  L.add(label('2-story office (72\' × 25\')', 108, 24, 0, 'lbl'));
  L.add(label('Drive-in bay −4\'', (D.x0 + D.x1) / 2, 1, (D.z0 + D.z1) / 2, 'lbl room'));
  L.add(label('Dock door', -74, 8, -15, 'lbl'));
  L.add(label('Drive-in door (yard level)', -74, 6, 26, 'lbl'));
  L.add(label('Back yard (gravel, −4\')', -130, gradeAt(-130) + 2, 0, 'lbl site'));
  L.add(label('Front lot', 200, gradeAt(200) + 2, 10, 'lbl site'));
  L.add(label('Detention basin', SITE.basin.cx, gradeAt(SITE.basin.cx) + 1, SITE.basin.cz, 'lbl site'));
  L.add(label('Retaining wall', -30, 2, -49, 'lbl site'));
  L.add(label('Ramp ↑ to pad', -56, gradeAt(-56) + 3, -42, 'lbl site'));
  L.add(label('Level pad', -25, 2, -42, 'lbl site'));

  const labelObjs = [];
  root.traverse(o => {
    if (o.userData && o.userData.isLabel) {
      o.userData.interiorLabel = /\b(room|crane)\b/.test(o.element.className);
      labelObjs.push(o);
    }
  });
  return { root, layers, labelObjs };
}
