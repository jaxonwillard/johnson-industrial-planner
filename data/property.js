// =============================================================================
//  2009 Johnson Industrial Blvd — property data (single source of truth)
//  All dimensions in FEET.
//
//  World axes used by the 3D model:
//    X  = toward the street (Johnson Industrial Blvd), i.e. the lot's long axis
//    Y  = up  (0 = finished floor, FFE 100.00 on the 2004 plan)
//    Z  = toward the Graphic Design side.  -Z = Case Lumber side.
//  True north is NOT -Z: the lot's long axis bears S18°09'E, so true north points
//  roughly toward the REAR of the lot.  See SITE.trueNorth.
//
//  Origin (0,0,0): the junction wall between the two buildings, on the building
//  centerline, at slab level.
//
//  Sources: McKinney Engineering site plan (Mar/Jun 2004), Kirby Building Systems
//  cross-section job 530612 (2004), CORE Real Estate flyer, owner answers.
// =============================================================================

export const VERSIONS = {
  original: {
    id: 'original',
    name: 'Original (as-is)',
    short: 'Original',
    blurb: 'The property as it stands today: 1990s-era 72\' × 121\' metal building with a two-story office block up front, plus the 2006 Kirby crane bay on the back with its dock door and depressed drive-in bay.',
    accent: '#5b8def',
  },
  office: {
    id: 'office',
    name: 'Office Remodel',
    short: 'Office Remodel',
    blurb: 'New street façade (owner-supplied windows + storefront, new wall panels, SONIQ sign), floor-to-roof showroom to the right of the entrance, refreshed reception / kitchen / upstairs offices, LED, flooring. Target ≈ $100k.',
    accent: '#e8913a',
  },
};

export const SITE = {
  address: '2009 Johnson Industrial Blvd, Nolensville, TN 37135',
  parcel: '056L D 020.00 000',
  acres: 1.11,
  zoning: 'CD-01',
  // Property corners [X, Z]. East line is on the street. Deed calls from the site plan:
  //   NE-side line 485.07', SW-side line 477.85', street line 100.06', rear line 100.2'
  corners: {
    NE: [274.4, -48.0],
    SE: [274.4, 52.0],
    SW: [-203.5, 52.0],
    NW: [-210.7, -48.0],
  },
  lineLengths: { north: 485.07, south: 477.85, east: 100.06, west: 100.2 },
  // unit vector (X,Z) that points to TRUE north in model space
  trueNorth: [-0.95, -0.31],
  // Street: right-of-way starts at the front property line; pavement a little further out
  road: { x0: 282, x1: 312, z0: -140, z1: 140, name: 'Johnson Industrial Blvd' },
  // Ground elevation relative to the slab (FFE 100.00) along the lot's long axis, linear between points.
  // Owner: the grade falls ~4' from the front of the building to the back. Plan contours: 97–99 at the
  // street end, ~96 at the junction on the west side, 95–96 in the back yard, basin 92–95.
  grade: [
    [-215, -4.6], [-150, -4.2], [-120, -4.0], [-73.5, -3.8], [0, -2.5], [121.2, -0.5], [200, -0.9], [274, -1.5], [330, -1.5],
  ],
  // Surfaces that follow the grade. Order = draw order (later on top).
  surfaces: [
    { id: 'frontLot',   kind: 'asphalt',  x0: 121.7, x1: 262, z0: -40, z1: 52,  name: 'Front lot (asphalt/chip-seal)' },
    { id: 'westDrive',  kind: 'asphalt',  x0: -73.5, x1: 121.7, z0: 36.5, z1: 52, name: 'West side drive (asphalt) — runs down-grade to the truck well' },
    { id: 'rearYard',   kind: 'gravel',   x0: -176, x1: -74, z0: -48, z1: 52,   name: 'Back yard (gravel) — ~4\' below the slab' },
    { id: 'eastStrip',  kind: 'gravel',   x0: -12, x1: 121.7, z0: -47.5, z1: -36.5, name: 'East side strip (gravel)' },
    { id: 'frontWalk',  kind: 'concrete', x0: 121.7, x1: 130, z0: -14, z1: 8, name: 'Entry walk' },
  ],
  // East side: ramp from the back yard up to 5' short of the side door, then a level concrete pad
  // at slab height from there to 10' past the door (owner description).
  eastRamp: {
    z0: -47.5, z1: -36.5,
    rampX0: -73.5, rampX1: -39,     // climbs from grade at the back corner to slab level
    padX0: -39, padX1: -12, padY: 0,
    name: 'East side ramp + concrete pad',
    notes: 'Owner: ramp from the back up to 5\' before the east side door; level pad from there to 10\' past the door. Door is X −34→−22, so pad X −39→−12.',
  },
  // Detention basin at the back (2004 plan: drainage easement, outlet box + 18" ADS pipe to creek). Bowl cut into the terrain.
  basin: { cx: -193, cz: 2, rx: 14, rz: 42, depth: 3 },
  // Retaining wall along the east property line where the neighbor sits higher
  retainingWalls: [
    { x0: -85, x1: 30, z: -47.8, top: 0.6, bottom: -5, t: 0.67, name: 'Existing retaining wall (east line) + 2004 extension' },
  ],
  // Chain-link fence runs (follow the grade). Gates per owner: one on the front of each side.
  fences: [
    { a: [-210.7, -48], b: [121.2, -48], h: 6, name: 'Chain-link — east line' },
    { a: [-203.5, 52],  b: [121.2, 52],  h: 6, name: 'Chain-link — west line' },
    { a: [-203.5, 52],  b: [-210.7, -48], h: 6, name: 'Chain-link — back line' },
    { a: [121.2, -36.5], b: [121.2, -48], h: 6, gate: true, name: 'Gate — east side (front)' },
    { a: [121.2, 36.5],  b: [121.2, 52],  h: 6, gate: true, name: 'Gate — west side (front)' },
  ],
  dumpster: { x: -95, z: -26, w: 8, d: 6, h: 5, screenH: 6 },
  poles: [ [268, -46], [268, 50] ],
  treesOffsite: Array.from({ length: 9 }, (_, i) => [-222 - (i % 2) * 6, -44 + i * 12]),
  treesFront: [ [200, -44], [240, -45] ],
  neighbors: [
    { name: 'Case Lumber (neighbor)', x0: -120, x1: 95, z0: -135, z1: -70, h: 22, roof: 'gable' },
    { name: 'Graphic Design (neighbor)', x0: -60, x1: 70, z0: 78, z1: 128, h: 14, roof: 'flat' },
  ],
  utilities: {
    power: 'Three-phase. Suite A 1200A / 220V; Suite B 400A / 240–440V',
    sprinkler: 'Wet fire sprinkler throughout (2006)',
    gas: 'Gas, electric and compressed-air hookups in both suites',
  },
  carrying: { taxes: 5600, insurance: 6600 },
};

/** Ground elevation (ft, relative to the slab) at X — linear interpolation of SITE.grade */
export function gradeAt(x) {
  const g = SITE.grade;
  if (x <= g[0][0]) return g[0][1];
  for (let i = 1; i < g.length; i++) {
    if (x <= g[i][0]) { const [x0, y0] = g[i - 1], [x1, y1] = g[i]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); }
  }
  return g[g.length - 1][1];
}

// -----------------------------------------------------------------------------
//  Buildings
// -----------------------------------------------------------------------------
export const BLDG = {
  A: {
    id: 'A',
    name: 'Suite A — original building',
    x0: 0, x1: 121.2, z0: -36, z1: 36,
    eave: 18, peak: 21, pitch: 1 / 12,
    bays: 5,                       // frame lines at 24.24' (assumed; not on any drawing)
    sf: 8724, listedSf: 9940,
    notes: 'Footprint 72\' × 121.2\' per 2004 plan (8,724 SF). Listed 9,940 SF incl. upstairs office. Eave/peak read from the front photo against the 7\' door: 18\' / ~21\', same profile as the addition.',
  },
  B: {
    id: 'B',
    name: 'Suite B — 2006 Kirby addition',
    x0: -73.5, x1: 0, z0: -36, z1: 36,
    steelHalf: 35,                 // 70'-0" out-to-out of steel
    eave: 18, peak: 21, pitch: 1 / 12,
    bays: 3,                       // 3 × 24.5' (assumed from the 73.5' length)
    sf: 5136, listedSf: 5620,
    notes: 'Kirby job 530612 (2004, built 2006). 70\' o/o steel × ~73.5\' (plan label 5,136 SF). 18\'-0" eave, 1:12 roof, 15\'-10" clear at haunch, 19\'-3" clear at peak. Walls modeled flush with the original building.',
  },
  // Depressed drive-in bay inside the back of the addition, along the west side. Floor 4' below the
  // slab (Kirby section: finished floor 96'-0" strip ~18' wide at frame line 1, corner column on a 4' pedestal).
  // Entered through the west back door at yard level; truck bed lands at slab height → an indoor dock under the crane.
  driveIn: {
    x0: -73.5, x1: -43.5, z0: 17, z1: 36, depth: 4,
    name: 'Drive-in bay (−4\', 18\' × 30\')',
    notes: 'Owner: the west back door is a drive-in 4\' below the warehouse floor, going back 30\'. Width from the Kirby section (18\'-3" low-floor strip at frame line 1). Truck bed ends up at slab level along the bay edge.',
  },
  // Two-story office block at the street end of Suite A
  office: { x0: 96.2, x1: 121.2, z0: -36, z1: 36, floor2: 9.5, slabT: 1.0, ceiling1: 8.5 },
  // Suite B two-story block (owner): 20×20 in the front-west corner against the junction wall —
  // break room below, office above; stair on its east face, out in the shop.
  officeB: { x0: -20, x1: 0, z0: 16, z1: 36, floor2: 9.5, slabT: 1.0, stairZ0: 12.5, stairZ1: 16, stairX0: -18, stairX1: -5 },
  // Junction wall between the suites: 2 × 16'×14' openings with roll-up doors on the Suite A face, east of the block + stair
  junction: { openings: [ { z0: -30, z1: -14 }, { z0: -8, z1: 8 } ], doorH: 14 },
  crane: {
    name: 'EMH 5-ton top-running bridge crane',
    span: 65, railZ: 32.5, topOfRail: 13.33, hookHeight: 12,
    bridgeX: -40, trolleyZ: -8,
    runwayX0: -72.5, runwayX1: -21,
    notes: 'Kirby section: top of rail 13\'-4", hook height 12\'-0", 66\'-0¾" clear between column lines A and E. Flyer: "65 foot" crane. Owner: 5-ton. Runway modeled stopping at the two-story break-room block (the rail would otherwise pass through the upstairs office) — confirm actual travel.',
  },
};

// Roof / structure helpers
export const ROOF_T = 0.3;
export const WALL_T = 0.5;

// -----------------------------------------------------------------------------
//  Openings.  Each wall: a→b as seen LEFT→RIGHT from outside the building
//  (for the junction wall, as seen from Suite A).  u = distance along the wall
//  from a.  sill = height of the opening bottom above slab.  Types:
//    oh   overhead sectional door        man   man door
//    win  window                         glass storefront glazing
//    dock dock door (sill at slab, opens onto the −4' well)
//    door interior door (partitions)
// -----------------------------------------------------------------------------
function win(u, w, sill, h, label) { return { type: 'win', u, w, sill, h, label }; }

// EAST (street) gable of Suite A: a = SW corner (z=+36) → b = NE corner (z=-36).  u = 36 - z
const A_EAST_ORIGINAL = [
  { type: 'glass', u: 34.4, w: 10.4, sill: 0, h: 7.2, label: 'Entry — aluminum storefront, double door + sidelight' },
  { type: 'glass', u: 34.4, w: 10.4, sill: 9.0, h: 7.5, label: 'Two-story lobby window' },
  win(6.0, 4.3, 12.8, 3.1, 'Upstairs office window'),
  win(20.4, 3.3, 13.1, 2.8, 'Upstairs office window'),
  win(20.4, 3.3, 3.9, 2.8, 'Ground-floor office window'),
  win(54.5, 3.5, 12.9, 3.0, 'Upstairs office window'),
];
const A_EAST_OFFICE = [
  { type: 'glass', u: 30, w: 12, sill: 0, h: 16.5, label: 'New two-story storefront (owner-supplied), 12\' × 16\'-6", entry doors centered' },
  win(4, 5, 3, 5, 'New window 5×5'), win(12, 5, 3, 5, 'New window 5×5'), win(20, 5, 3, 5, 'New window 5×5'),
  win(47, 5, 3, 5, 'New window 5×5'), win(55, 5, 3, 5, 'New window 5×5'), win(63, 5, 3, 5, 'New window 5×5'),
  win(4, 5, 12, 4, 'New window 5×4'), win(12, 5, 12, 4, 'New window 5×4'), win(20, 5, 12, 4, 'New window 5×4'),
  win(47, 5, 12, 4, 'New window 5×4'), win(55, 5, 12, 4, 'New window 5×4'), win(63, 5, 12, 4, 'New window 5×4'),
];

// NE side wall of Suite A (z = -36): seen from outside (from the NE), left = street end.  a = (121.2,-36) → b = (0,-36).  u = 121.2 - x
const A_NORTH_ORIGINAL = [
  { type: 'man', u: 60, w: 3, sill: 0, h: 7, label: 'Shop egress door (assumed)' },
];
const A_NORTH_OFFICE = [
  ...A_NORTH_ORIGINAL,
  win(6, 5, 3, 5, 'New window 5×5'), win(16, 5, 3, 5, 'New window 5×5'),
  win(6, 5, 12, 4, 'New window 5×4'), win(16, 5, 12, 4, 'New window 5×4'),
];
// SW side wall of Suite A (z = +36): seen from outside (from the SW), left = rear end.  a = (0,36) → b = (121.2,36).  u = x
const A_SOUTH_ORIGINAL = [
  { type: 'man', u: 104, w: 3, sill: 0, h: 7, label: 'Office egress door (assumed)' },
];
const A_SOUTH_OFFICE = [
  ...A_SOUTH_ORIGINAL,
  win(100, 5, 3, 5, 'New window 5×5'), win(110, 5, 3, 5, 'New window 5×5'),
  win(100, 5, 12, 4, 'New window 5×4'), win(110, 5, 12, 4, 'New window 5×4'),
];

// BACK gable of Suite B.  a = (-73.5, 36) → b = (-73.5, -36), so u = 36 - z (u=0 is the WEST corner).
// West door: drive-in at yard level (sill −4) into the depressed bay.  East door: dock door at slab height.
const B_WEST = [
  { type: 'oh', u: 3, w: 14, sill: 0, h: 14, label: 'Back WEST door — drive-in 14×14, sill 4\' below the floor, into the depressed bay' },
  { type: 'dock', u: 46, w: 12, sill: 0, h: 14, label: 'Back EAST door — dock door 12×14 at floor level (yard is 4\' below)' },
  win(33, 3, 15, 2, 'Gable vent/louver'),
];
// East side wall of Suite B (z=-36): a = (0,-36) → b = (-73.5,-36).  u = -x
const B_NORTH = [
  { type: 'oh', u: 22, w: 12, sill: 0, h: 14, label: 'East side door 12×14 — drive-in from the level concrete pad (ramp climbs to it from the back)' },
];
// West side wall of Suite B (z=+36): a = (-73.5,36) → b = (0,36). u = x + 73.5
const B_SOUTH = [
  { type: 'man', u: 36, w: 3, sill: 0, h: 7, label: 'Man door (2004 plan)' },
];

export const WALLS = {
  original: [
    { id: 'A-east',  bldg: 'A', a: [121.2, 36], b: [121.2, -36], profile: 'gable', openings: A_EAST_ORIGINAL, name: 'Front (street) gable — original', finish: 'panelOld' },
    { id: 'A-north', bldg: 'A', a: [121.2, -36], b: [0, -36], profile: 'eave', openings: A_NORTH_ORIGINAL, name: 'Suite A — east side wall (Case Lumber side)', finish: 'panelOld' },
    { id: 'A-south', bldg: 'A', a: [0, 36], b: [121.2, 36], profile: 'eave', openings: A_SOUTH_ORIGINAL, name: 'Suite A — west side wall (Graphic Design side)', finish: 'panelOld' },
    // back gable: wall base drops to −4 across the drive-in bay (z 17→36)
    { id: 'B-west',  bldg: 'B', a: [-73.5, 36], b: [-73.5, -36], profile: 'gable', base: -4, baseZ: [17, 36], openings: B_WEST, name: 'Back gable — Suite B', finish: 'panelOld' },
    { id: 'B-north', bldg: 'B', a: [0, -36], b: [-73.5, -36], profile: 'eave', openings: B_NORTH, name: 'Suite B — east side wall', finish: 'panelOld' },
    { id: 'B-south', bldg: 'B', a: [-73.5, 36], b: [0, 36], profile: 'eave', base: -4, baseZ: [-73.5, -43.5], baseAxis: 'x', openings: B_SOUTH, name: 'Suite B — west side wall', finish: 'panelOld' },
    // junction wall (seen from Suite A: a = (0,36) → b = (0,-36), u = 36 - z)
    { id: 'junction', bldg: 'A', a: [0, 36], b: [0, -36], profile: 'gable', openings: [
        { type: 'oh', u: 28, w: 16, sill: 0, h: 14, label: 'Roll-up 16×14 between suites (door on Suite A face)' },
        { type: 'oh', u: 50, w: 16, sill: 0, h: 14, label: 'Roll-up 16×14 between suites (door on Suite A face)' },
      ], name: 'Junction wall (original back endwall)', finish: 'liner' },
  ],
};
WALLS.office = WALLS.original.map(w => {
  if (w.id === 'A-east')  return { ...w, openings: A_EAST_OFFICE,  finish: 'panelNew', name: 'Front (street) gable — NEW panels + owner-supplied glazing' };
  if (w.id === 'A-north') return { ...w, openings: A_NORTH_OFFICE };
  if (w.id === 'A-south') return { ...w, openings: A_SOUTH_OFFICE };
  // remodel: the two roll-up doors between the suites come out; the 16×14 openings stay open
  if (w.id === 'junction') return { ...w, openings: w.openings.map(o => ({ ...o, type: 'open', label: 'Open 16×14 between suites (roll-up removed)' })) };
  return w;
});

// -----------------------------------------------------------------------------
//  Interiors (schematic — no floor plan exists; layouts are owner-confirmed sizes
//  with assumed room arrangement).  Partitions: {a,b} in plan, h height, floor y0,
//  doors: [{u,w}] .  Rooms: label positions.
// -----------------------------------------------------------------------------
const OX0 = BLDG.office.x0, OX1 = BLDG.office.x1;        // 96.2 .. 121.2
const F2 = BLDG.office.floor2;                          // 9.5

function part(a, b, opts = {}) { return { a, b, h: opts.h ?? 8.5, y0: opts.y0 ?? 0, doors: opts.doors ?? [], t: opts.t ?? 0.4 }; }

// -----------------------------------------------------------------------------
//  Front office block — owner's description (Sept 2026), directions as seen from the street:
//   • the doors open into a RECEPTION; to the LEFT (Graphic Design side, +Z) a small kitchen and bathroom
//   • upstairs is more offices
//   • an enclosed STAIRWELL stands in the warehouse behind the reception and goes up to the 2nd floor
//   • a GLASS DOUBLE DOOR in the back of the reception leads to the warehouse / stairwell
//   • everything to the RIGHT of the entrance (Case Lumber side, −Z): today two levels (assumed offices);
//     in the Office Remodel it becomes a SHOWROOM open from floor to roof (no deck above)
// -----------------------------------------------------------------------------
const SR_Z = -8;                                   // showroom / two-level split, just right of the storefront jamb
// stairwell in the very WEST corner of the warehouse behind the office block (against the back wall and
// the west exterior wall); the stair climbs from its EAST end (z=18) to its WEST end (z≈32), landing at z 32→36
const SW = { x0: 88, x1: OX0, z0: 18, z1: 36, run: 13 };
const STAIR_WALLS = [
  part([SW.x0, SW.z0], [SW.x1, SW.z0], { h: 17.5, doors: [ { u: 2.5, w: 3 } ] }),   // east end wall with the entry door
  part([SW.x0, SW.z0], [SW.x0, SW.z1], { h: 17.5 }),                                 // back wall (west end is the exterior wall)
];

// two-level part (z −8 → 36), ground floor — ORIGINAL arrangement (bath door off the reception, room beyond via the kitchen)
const FRONT_G_ORIG = [
  part([OX0, SR_Z], [OX0, 36], { doors: [ { u: 5, w: 6, glass: true } ] }),       // back wall; glass double door at z −3→3
  part([OX0, 10], [OX1, 10], { doors: [ { u: 3.8, w: 3 }, { u: 18, w: 3 } ] }),  // reception | kitchen & bath (bath door, kitchen door)
  part([108, 10], [108, 22], { doors: [ { u: 8, w: 3 } ] }),                     // kitchen (front) | bath + storage (back)
  part([OX0, 17], [108, 17]),                                                      // bathroom | storage
  part([OX0, 22], [OX1, 22], { doors: [ { u: 19.8, w: 3 } ] }),                   // room beyond the kitchen (assumed office)
  ...STAIR_WALLS,
];
// ground floor — REMODEL (owner, Sept 2026): reception grows to z −8 → 13.6; the CONFERENCE ROOM comes next
// (z 13.6 → 27.6, 20' × 14'), and the kitchen/bath band (8.4', i.e. 30% smaller than before) sits at the far
// west end. A 5' corridor runs along the back from the reception's back corner to the band.
const KZ = 13.6, CZ = 27.6;
const FRONT_G_NEW = [
  part([OX0, SR_Z], [OX0, 36], { doors: [ { u: 5, w: 6, glass: true } ] }),          // back wall; glass double door at z −3→3
  part([OX0, KZ], [OX1, KZ], { doors: [ { u: 0.6, w: 3 }, { u: 15.8, w: 3 } ] }),    // reception: corridor door at the back corner, conference door
  part([101, KZ], [101, 36], { doors: [ { u: 16.4, w: 3 } ] }),                      // corridor wall: bathroom door at the end (no door into the conference room — TV wall)
  part([101, CZ], [OX1, CZ], { doors: [ { u: 9, w: 3 } ] }),                          // conference | band; kitchen door off the conference room
  part([107, CZ], [107, 36]),                                                          // bathroom | kitchen
  ...STAIR_WALLS,
];
const UP_BACK = part([OX0, SR_Z], [OX0, 36], { y0: F2, h: 8, doors: [ { u: 40.5, w: 3 } ] });   // back wall upstairs; door from the stairwell landing (z 32.5→35.5)
// upstairs — ORIGINAL: four offices off the back corridor (assumed)
const FRONT_U_ORIG = [
  UP_BACK,
  part([101, SR_Z], [101, 36], { y0: F2, h: 8, doors: [ { u: 4, w: 3 }, { u: 15, w: 3 }, { u: 26, w: 3 }, { u: 37, w: 3 } ] }),
  part([101, 3], [OX1, 3], { y0: F2, h: 8 }),
  part([101, 14], [OX1, 14], { y0: F2, h: 8 }),
  part([101, 25], [OX1, 25], { y0: F2, h: 8 }),
];
// upstairs — REMODEL: two large offices (22' × 20') off the corridor, AV closet in the corridor's east dead-end
const FRONT_U_NEW = [
  UP_BACK,
  part([101, SR_Z], [101, 36], { y0: F2, h: 8, doors: [ { u: 11, w: 3 }, { u: 30, w: 3 } ] }),   // corridor wall, one door per office
  part([101, 14], [OX1, 14], { y0: F2, h: 8 }),                                                    // between the two offices
  part([OX0, -1], [101, -1], { y0: F2, h: 8, doors: [ { u: 1, w: 2.7 } ] }),                      // AV closet (5' × 7') at the corridor's end
];
const FRONT_ROOMS = [
  { name: 'Stairwell', at: [92, 27] }, { name: 'Corridor (up)', at: [98.6, 16] },
];
const FRONT_ROOMS_ORIG = [
  { name: 'Reception', at: [110, 1] }, { name: 'Kitchen', at: [114.5, 16] },
  { name: 'Bathroom', at: [102, 13.5] }, { name: 'Storage', at: [102, 19.5] },
  { name: 'Office (up)', at: [111, -2.5] }, { name: 'Office (up)', at: [111, 8.5] }, { name: 'Office (up)', at: [111, 19.5] }, { name: 'Office (up)', at: [111, 30.5] },
];
const FRONT_ROOMS_NEW = [
  { name: 'Reception', at: [110, 3] }, { name: 'Conference room', at: [111, 20.6] }, { name: 'Corridor', at: [98.6, 22] },
  { name: 'Bathroom', at: [104, 31.8] }, { name: 'Kitchen', at: [114, 31.8] },
  { name: 'Large office (up)', at: [111, 3] }, { name: 'Large office (up)', at: [111, 25] }, { name: 'AV closet (up)', at: [98.6, -4.5] },
];

// ORIGINAL — right of the entrance (z −36 → −8): two levels, arrangement assumed
const ORIG_RIGHT = [
  part([OX0, -36], [OX0, SR_Z]),
  part([OX1, SR_Z], [OX0, SR_Z], { doors: [ { u: 4, w: 3 } ] }),                                   // from reception
  part([110, -36], [110, SR_Z], { doors: [ { u: 6, w: 3 }, { u: 20, w: 3 } ] }),
  part([110, -22], [OX1, -22]),
  part([OX0, -36], [OX0, SR_Z], { y0: F2, h: 8 }),
  part([OX1, SR_Z], [OX0, SR_Z], { y0: F2, h: 8, doors: [ { u: 22, w: 3 } ] }),                    // from the upstairs corridor
  part([110, -36], [110, SR_Z], { y0: F2, h: 8, doors: [ { u: 6, w: 3 }, { u: 20, w: 3 } ] }),
  part([110, -22], [OX1, -22], { y0: F2, h: 8 }),
];
const ORIG_RIGHT_ROOMS = [
  { name: 'Office (assumed)', at: [108, 29] },
  { name: 'Office (existing, assumed)', at: [115.5, -15] }, { name: 'Office (existing, assumed)', at: [115.5, -29] }, { name: 'Office (existing, assumed)', at: [103, -22] },
  { name: 'Office (up)', at: [115.5, -15] }, { name: 'Office (up)', at: [115.5, -29] }, { name: 'Office (up)', at: [103, -22] },
];

// OFFICE REMODEL — right of the entrance becomes a double-height showroom (deck removed, walls to the roof)
const NEW_RIGHT = [
  part([OX0, -36], [OX0, SR_Z], { h: 19.5 }),                                                      // back wall to the roof
  part([OX1, SR_Z], [OX0, SR_Z], { h: 19.5, doors: [ { u: 7, w: 12, dh: 9 } ] }),                   // divider; 12' × 9' opening = the sliding door
];
const NEW_RIGHT_ROOMS = [ { name: 'Showroom — floor to roof (fit-out TBD)', at: [108, -22] } ];

// Suite B two-story block (owner): 20×20 in the front-west corner. Break room on the ground floor,
// office upstairs. Its south face is the junction wall and its west face is the exterior wall, so only
// the north (X=-20) and east (Z=16) faces are partitions. Stair runs along the east face in the shop.
const OB = BLDG.officeB;
const B_OFFICE = [
  part([OB.x0, OB.z0], [OB.x0, OB.z1], { h: 9, doors: [ { u: 8, w: 3 } ] }),                 // north face, ground
  part([OB.x0, OB.z0], [OB.x1, OB.z0], { h: 9, doors: [ { u: 3, w: 3 } ] }),                 // east face, ground (door to shop)
  part([OB.x0, OB.z0], [OB.x0, OB.z1], { y0: OB.floor2, h: 8 }),                            // north face, upstairs
  part([OB.x0, OB.z0], [OB.x1, OB.z0], { y0: OB.floor2, h: 8, doors: [ { u: 15, w: 3 } ] }), // east face, upstairs (door at top of stair)
];
const B_OFFICE_ROOMS = [
  { name: 'Break room', at: [-10, 26] }, { name: 'Office (up)', at: [-10, 26] }, { name: 'Stair', at: [-11, 14] },
];

export const INTERIOR = {
  original: { partitions: [ ...FRONT_G_ORIG, ...FRONT_U_ORIG, ...ORIG_RIGHT, ...B_OFFICE ], rooms: [ ...FRONT_ROOMS, ...FRONT_ROOMS_ORIG, ...ORIG_RIGHT_ROOMS, ...B_OFFICE_ROOMS ] },
  office:   { partitions: [ ...FRONT_G_NEW,  ...FRONT_U_NEW,  ...NEW_RIGHT,  ...B_OFFICE ], rooms: [ ...FRONT_ROOMS, ...FRONT_ROOMS_NEW,  ...NEW_RIGHT_ROOMS,  ...B_OFFICE_ROOMS ] },
};
export const STAIRWELL = SW;

// Version-specific extras
export const EXTRAS = {
  original: {},
  office: {
    canopy: { u0: 28, u1: 44, depth: 6, y: 9.2 },        // over the storefront, u along the front wall
    sign: { text: 'SONIQ', w: 20, h: 2.8, y: 18.3, z: 0 }, // channel letters centred over the storefront, under the gable peak
    deck: { z0: -8, z1: 36 },                              // second floor removed over the showroom
    // showroom entrance: 12' × 9' bi-parting glass sliding door on a top track, shown open
    showroomDoor: { x0: 102.2, x1: 114.2, z: -8, h: 9, open: 0.85 },
    // conference room next to the reception (long table, chairs, TV on the reception-side wall, pictures of homes)
    conference: { x0: 101, x1: 121.2, z0: 13.6, z1: 27.6 },
    // reception desk facing the doors + waiting chairs along the conference-room wall
    reception: { deskX: 105.5, deskZ: -1, deskW: 8, chairsX: [103.5, 106, 108.5], chairsZ: 12.2 },
    stripeLot: true,
    plantingBeds: [ { x0: 121.7, x1: 126, z0: -32, z1: -14 }, { x0: 121.7, x1: 126, z0: 8, z1: 30 } ],   // both sides of the entry, small shrubs
  },
};

// Areas used by the budget
export const AREAS = {
  officeFootprint: (OX1 - OX0) * 72,           // 1,800 SF per floor
  officeTotal: (OX1 - OX0) * 72 * 2,           // 3,600 SF
  eastFacade: 72 * 19.5,                       // ~1,400 SF gross
  sideWrap: 2 * (OX1 - OX0) * 18,              // ~900 SF
  frontLot: (262 - 121.7) * 92,                // ~12,900 SF
};

// Facts panel for the viewer
export const FACTS = [
  ['Address', SITE.address],
  ['Parcel', SITE.parcel],
  ['Site', '1.11 ac — 100\' × ~485\' strip, street on the SE end'],
  ['Zoning', 'CD-01 (Nolensville)'],
  ['Total building', '15,560 SF listed — 72\' × ~194.7\' footprint'],
  ['Suite A', '72\' × 121.2\' + 2-story office block (72\' × 25\'): reception, kitchen & bath left, offices up; stairwell in the warehouse behind reception'],
  ['Suite B', '70\' o/o steel × 73.5\', 2006 Kirby, 3 bays; 20×20 two-story break room / office in the front-west corner'],
  ['Heights', '18\'-0" eave, 1:12 roof, ~21\' peak; 15\'-10" clear at haunch'],
  ['Crane', 'EMH 5-ton, 65\' span, 13\'-4" top of rail, 12\' hook'],
  ['Grade', 'Falls ~4\' front → back; slab is at grade up front, 4\' proud at the back'],
  ['Loading', 'Back wall: dock door (east) + drive-in door (west) into an 18\'×30\' bay at −4\' under the crane; east side door off a level pad'],
  ['Power', SITE.utilities.power],
  ['Fire', SITE.utilities.sprinkler],
  ['Carrying', `Taxes $${SITE.carrying.taxes.toLocaleString()} · Insurance $${SITE.carrying.insurance.toLocaleString()} / yr`],
];

export const ASSUMPTIONS = [
  'Site geometry scaled from the 2004 McKinney plan (calibrated to the labeled 121.2\', 84\' and 60.6\' dimensions; ±2\').',
  'Original building eave/peak (18\'/21\') read from the street photo against the 7\' entry door; matches the Kirby section for the addition.',
  'Addition length 73.5\' (plan label 5,136 SF ÷ 70\'). Flyer says Suite B is 5,620 SF — verify with a tape.',
  'Frame spacing in both buildings is assumed (5 × 24.24\' and 3 × 24.5\'); Kirby anchor-bolt plan would confirm.',
  'Drive-in bay: 30\' deep per owner, 18\' wide per the Kirby section (frame line 1 = the back end frame; corner column on a 4\' pedestal). The notch on the 2004 plan at the junction is NOT modeled — owner did not describe any pit there.',
  'East side pad is modeled at slab height (drive-in) because the 2004 plan calls it a "6-inch concrete ramp" and the ramp climbs from the back yard — confirm whether trucks back up to that door at dock height instead.',
  'Front office block per owner: reception at the doors, kitchen + bathroom to the left, offices upstairs, enclosed stairwell in the warehouse behind reception, glass double door out to it. Exact wall positions and the room beyond the kitchen are assumed. The right-hand side (Case Lumber side) of the block is drawn as two levels of assumed offices in the Original; it becomes the floor-to-roof showroom in the remodel.',
  'Suite B: 20×20 two-story break-room/office block in the front-west corner with the stair on its east face (owner).',
  'Crane runway is drawn ending at the Suite B two-story block (X −21) so the rail does not run through the upstairs office — confirm how far the bridge actually travels.',
  'Grade: owner says the ground falls ~4\' from the front of the building to the back; the profile in SITE.grade (½\' below slab at the entry → ~4\' below at the back wall) is an interpolation of that plus the 2004 plan contours. Spot elevations would tighten it.',
  'East-side ramp and level pad per owner description; ramp slope works out to ~11% over 34\' — confirm where the ramp actually starts in the back yard.',
  'Side-wall man doors on Suite A are assumed for egress; confirm on site.',
  'Building placed 12\' off the east line / 16\' off the west line per the 10\' setback lines on the plan.',
];
