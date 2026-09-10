// =============================================================================
//  Budget line items.  Planning-level Middle-Tennessee 2026 costs — low / high are
//  INSTALLED unit costs unless the line has `owner`, in which case low/high are
//  LABOR only and material comes from `owner` (your cost vs. market).
//  qty × (labor + material).  Edit freely; the page remembers your edits.
// =============================================================================
import { AREAS, SITE } from './property.js';

const office = {
  title: 'Office Remodel — working budget',
  intro: 'Street façade + two-story office refresh. Default scope is what fits ≈ $100k with owner-supplied windows and cheap paneling; unchecked lines are priced options you can switch on.',
  target: 100000,
  contingencyPct: 10,
  categories: [
    { id: 'ext', name: 'Exterior — street façade' },
    { id: 'int', name: 'Interior — office block (3,600 SF, two floors)' },
    { id: 'site', name: 'Site' },
    { id: 'soft', name: 'Soft costs' },
  ],
  items: [
    // ---------------- exterior
    { id: 'e-win', cat: 'ext', name: 'New punched windows — 12 on the façade + 8 on the side wraps', qty: 20, unit: 'ea', low: 150, high: 250, included: true,
      owner: { label: 'Windows at your cost', costLow: 250, costHigh: 350, marketLow: 650, marketHigh: 900 },
      notes: '5×5 ground floor, 5×4 upstairs. Labor = set, flash, trim. Your window company supplies.' },
    { id: 'e-store', cat: 'ext', name: 'Two-story aluminum storefront at entry, 12\' × 16\'-6" with double doors', qty: 198, unit: 'SF', low: 15, high: 25, included: true,
      owner: { label: 'Storefront at your cost', costLow: 25, costHigh: 35, marketLow: 55, marketHigh: 75 },
      notes: 'Replaces the existing entry + lobby window. Thermally-broken system, 1" IGU.' },
    { id: 'e-panel-front', cat: 'ext', name: 'New metal wall panels — street façade (gable end)', qty: Math.round(AREAS.eastFacade), unit: 'SF', low: 3.25, high: 4.75, included: true,
      owner: { label: 'Panels sourced cheap', costLow: 1.0, costHigh: 2.0, marketLow: 4.5, marketHigh: 6.5 },
      notes: 'Over existing R-panel or after strip. 72\' × ~19.5\' gross. Dark charcoal in the model.' },
    { id: 'e-panel-wrap', cat: 'ext', name: 'New metal wall panels — wrap the 25\' office block on both sides', qty: Math.round(AREAS.sideWrap), unit: 'SF', low: 3.25, high: 4.75, included: false,
      owner: { label: 'Panels sourced cheap', costLow: 1.0, costHigh: 2.0, marketLow: 4.5, marketHigh: 6.5 },
      notes: 'Makes the office read as its own volume. Optional.' },
    { id: 'e-trim', cat: 'ext', name: 'Trim, flashing, corner & jamb closures, tear-off & haul-off', qty: 1, unit: 'LS', low: 3500, high: 5500, included: true, notes: '' },
    { id: 'e-remove', cat: 'ext', name: 'Remove existing windows / storefront; frame new openings in girts', qty: 1, unit: 'LS', low: 1200, high: 2400, included: true, notes: '12 new façade openings need girt headers/sills.' },
    { id: 'e-canopy', cat: 'ext', name: 'Steel entry canopy 16\' × 6\' on tension rods', qty: 1, unit: 'LS', low: 5500, high: 8500, included: false, notes: 'Shown in the 3D model. Optional.' },
    { id: 'e-sconce', cat: 'ext', name: 'Exterior LED wall sconces', qty: 6, unit: 'ea', low: 250, high: 400, included: true, notes: 'Flanking the storefront and side entries.' },
    { id: 'e-sign', cat: 'ext', name: 'SONIQ sign — 20\' illuminated channel letters on a raceway, gable-mounted', qty: 1, unit: 'LS', low: 3500, high: 7000, included: true, notes: 'Shown in the 3D model. Needs a sign permit; includes the circuit.' },
    // ---------------- interior
    { id: 'i-demo', cat: 'int', name: 'Selective demolition — ceilings, flooring, partitions right of the entrance', qty: AREAS.officeTotal, unit: 'SF', low: 1.0, high: 1.75, included: true, notes: 'Includes a roll-off for the debris.' },
    { id: 'i-showroom-deck', cat: 'int', name: 'Showroom: remove second-floor deck right of the entrance (~700 SF), cut & cap framing, engineer\'s letter', qty: 700, unit: 'SF', low: 8, high: 14, included: true, notes: 'Makes the showroom floor-to-roof. Deck framing may be bearing on the old office walls — the engineer\'s look is not optional.' },
    { id: 'i-showroom-wall', cat: 'int', name: 'Showroom: full-height wall to reception (25\' × 19½\'), framed & finished both sides, 10\' opening', qty: 490, unit: 'SF', low: 11, high: 15, included: true, notes: 'Showroom fit-out itself (fixtures, lighting, glass) to be priced once you decide what goes in it.' },
    { id: 'i-showroom-door', cat: 'int', name: 'Showroom entrance — 12\' × 9\' bi-parting glass sliding door on a top track', qty: 1, unit: 'ea', low: 900, high: 1500, included: true,
      owner: { label: 'Glass leaves at your cost', costLow: 1800, costHigh: 2800, marketLow: 4500, marketHigh: 6500 },
      notes: 'Labor = header, track, hang & adjust. Two 6\' tempered leaves in aluminum frames from your shop.' },
    { id: 'i-part', cat: 'int', name: 'Partitions — new corridor behind bath/storage, relocate bath door, patch elsewhere', qty: 60, unit: 'LF', low: 95, high: 130, included: true, notes: 'Corridor off the north side of the reception serves bath, storage and the conference room.' },
    { id: 'i-rollup-remove', cat: 'int', name: 'Remove the two 16×14 roll-up doors between the suites, trim the openings', qty: 2, unit: 'ea', low: 400, high: 750, included: true, notes: 'Openings stay open. Check whether the wall is a fire separation before removing.' },
    { id: 'i-conf', cat: 'int', name: 'Conference room — 12\' table, 10 chairs, 65" TV + mount, 4 framed prints', qty: 1, unit: 'LS', low: 4500, high: 8000, included: true, notes: 'FF&E, not construction — easy to defer or buy used.' },
    { id: 'i-recep', cat: 'int', name: 'Reception — desk, task chair, 3 waiting chairs, side table', qty: 1, unit: 'LS', low: 3000, high: 5500, included: true, notes: 'FF&E.' },
    { id: 'i-doors', cat: 'int', name: 'Interior doors, hollow-metal frames, lever hardware', qty: 4, unit: 'ea', low: 550, high: 800, included: true, notes: '' },
    { id: 'i-ceil-paint', cat: 'int', name: 'Paint existing ceiling grid + new lay-in tiles', qty: AREAS.officeTotal, unit: 'SF', low: 0.85, high: 1.4, included: true, notes: 'Cheapest credible ceiling refresh.' },
    { id: 'i-ceil-new', cat: 'int', name: 'New 2×4 ACT grid & tile (instead of painting the grid)', qty: AREAS.officeTotal, unit: 'SF', low: 3.5, high: 5.5, included: false, notes: 'Swap for the line above if the grid is shot.' },
    { id: 'i-lvp', cat: 'int', name: 'LVP flooring — ground floor', qty: AREAS.officeFootprint, unit: 'SF', low: 4.5, high: 6.5, included: true, notes: 'Commercial 20-mil wear layer, installed.' },
    { id: 'i-carpet', cat: 'int', name: 'Carpet tile — upstairs', qty: AREAS.officeFootprint, unit: 'SF', low: 3.5, high: 5.5, included: false, notes: 'Optional — upstairs can wait.' },
    { id: 'i-paint', cat: 'int', name: 'Interior paint — walls, trim, doors (both floors)', qty: AREAS.officeTotal, unit: 'SF floor', low: 1.5, high: 2.25, included: true, notes: '' },
    { id: 'i-led', cat: 'int', name: 'LED retrofit kits in existing 2×4 troffers', qty: 45, unit: 'ea', low: 85, high: 130, included: true, notes: '~1 fixture per 80 SF.' },
    { id: 'i-led-new', cat: 'int', name: 'New LED flat-panel troffers (instead of retrofit)', qty: 45, unit: 'ea', low: 180, high: 260, included: false, notes: '' },
    { id: 'i-elec', cat: 'int', name: 'Electrical & data allowance — receptacles, circuits, data drops', qty: 1, unit: 'LS', low: 3000, high: 5500, included: true, notes: 'Suite A is 1200A / 220V 3-phase; no service upgrade assumed.' },
    { id: 'i-hvac-svc', cat: 'int', name: 'HVAC service, new thermostats, duct & grille modifications', qty: 1, unit: 'LS', low: 2500, high: 5000, included: true, notes: 'Assumes existing office units are serviceable.' },
    { id: 'i-hvac-new', cat: 'int', name: 'Replace office HVAC — two 4-ton split systems', qty: 2, unit: 'ea', low: 8000, high: 12000, included: false, notes: 'Only if the existing units fail inspection.' },
    { id: 'i-rr1', cat: 'int', name: 'Restroom refresh — fixtures, partitions, tile, vanity, accessories', qty: 1, unit: 'ea', low: 5000, high: 8000, included: true, notes: 'The public-facing one off the lobby.' },
    { id: 'i-rr2', cat: 'int', name: 'Additional restroom refreshes (Suite A has 3)', qty: 2, unit: 'ea', low: 5000, high: 8000, included: false, notes: '' },
    { id: 'i-kitchen', cat: 'int', name: 'Break room — cabinets, laminate counter, sink, appliances', qty: 1, unit: 'LS', low: 8000, high: 14000, included: false, notes: '' },
    { id: 'i-stair', cat: 'int', name: 'Stair treads & guardrail refresh', qty: 1, unit: 'LS', low: 2000, high: 4000, included: false, notes: '' },
    // ---------------- site
    { id: 's-stripe', cat: 'site', name: 'Seal-coat & stripe the front lot (22 stalls in the model)', qty: Math.round(AREAS.frontLot), unit: 'SF', low: 0.25, high: 0.40, included: false, notes: 'Assumes the asphalt is sound; crack-fill included.' },
    { id: 's-landscape', cat: 'site', name: 'Entry planting beds both sides — small shrubs, mulch, edging', qty: 1, unit: 'LS', low: 1500, high: 3000, included: true, notes: 'Two 4\' × ~20\' beds flanking the door, as modeled.' },
    // ---------------- soft
    { id: 'p-permit', cat: 'soft', name: 'Building permit (Town of Nolensville) & inspections', qty: 1, unit: 'LS', low: 1500, high: 3000, included: true, notes: 'Façade + interior alteration, no change of use.' },
    { id: 'p-design', cat: 'soft', name: 'Design & stamped drawings — façade, interior, egress check', qty: 1, unit: 'LS', low: 4000, high: 7000, included: true, notes: 'Two-story office needs a life-safety look regardless.' },
  ],
};

const original = {
  title: 'Original — carrying costs & upkeep',
  intro: 'No remodel. Annual carrying costs from the listing plus optional first-year upkeep allowances so you can see what "do nothing" really costs.',
  target: null,
  contingencyPct: 0,
  categories: [
    { id: 'carry', name: 'Annual carrying costs (from the flyer)' },
    { id: 'maint', name: 'First-year upkeep allowances (optional)' },
  ],
  items: [
    { id: 'c-tax', cat: 'carry', name: 'Property taxes', qty: 1, unit: 'yr', low: SITE.carrying.taxes, high: SITE.carrying.taxes, included: true, notes: 'Per flyer; reassessment on sale likely.' },
    { id: 'c-ins', cat: 'carry', name: 'Insurance', qty: 1, unit: 'yr', low: SITE.carrying.insurance, high: SITE.carrying.insurance, included: true, notes: 'Per flyer.' },
    { id: 'm-crane', cat: 'maint', name: 'Crane annual inspection & load test (OSHA 1910.179)', qty: 1, unit: 'ea', low: 1200, high: 2500, included: false, notes: '' },
    { id: 'm-spr', cat: 'maint', name: 'Fire sprinkler annual inspection (2006 system)', qty: 1, unit: 'ea', low: 600, high: 1200, included: false, notes: '' },
    { id: 'm-hvac', cat: 'maint', name: 'HVAC service — all units', qty: 1, unit: 'ea', low: 800, high: 1800, included: false, notes: '' },
    { id: 'm-roof', cat: 'maint', name: 'Roof inspection, fastener tightening & seam sealant', qty: 1, unit: 'LS', low: 2500, high: 6000, included: false, notes: '~14,000 SF of metal roof.' },
    { id: 'm-doors', cat: 'maint', name: 'Overhead / dock door service', qty: 7, unit: 'ea', low: 250, high: 450, included: false, notes: '3 exterior OH, 2 between suites, 2 dock doors.' },
    { id: 'm-wash', cat: 'maint', name: 'Exterior pressure wash', qty: 1, unit: 'LS', low: 1200, high: 2500, included: false, notes: '' },
    { id: 'm-gravel', cat: 'maint', name: 'Re-grade & top-dress the rear gravel yard', qty: 1, unit: 'LS', low: 2500, high: 5000, included: false, notes: '' },
  ],
};

export const BUDGET = { office, original };
