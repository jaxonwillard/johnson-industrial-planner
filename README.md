# 2009 Johnson Industrial Blvd — planner

**Live site:** https://jaxonwillard.github.io/johnson-industrial-planner/

Static website with a 3D model of the whole property and a working remodel budget, in two versions
(runs on GitHub Pages; everything is plain HTML/JS with three.js vendored, no build step):

| Version | 3D model | Budget |
|---|---|---|
| **Original (as-is)** | `viewer.html?v=original` | `budget.html?v=original` — carrying costs + upkeep options |
| **Office Remodel** | `viewer.html?v=office` | `budget.html?v=office` — façade + office refresh, target ≈ $100k |

## Run it

Double-click **`serve.bat`** (needs Python on the PATH — it is). It runs `serve.py`, which serves the `Warehouse`
folder on `http://localhost:8080/` with no-cache headers (so edits show on a plain refresh) and opens
`http://localhost:8080/planner/`.

three.js r160 is vendored in `vendor/three/`, so no internet is needed. **Do not open the .html files by double-clicking** — browsers block module scripts on `file://` pages, and you'll get the blank viewer; always go through `serve.bat`.

## Directions used everywhere

Owner's words: **front** = street end, **back** = rear yard, **east** = Case Lumber side, **west** = Graphic Design side. (True north points toward the back; the compass in the model shows it.) The ground falls ~4' from front to back, so the slab is at grade at the entry and dock-height at the back wall.

## Files

```
planner/
  index.html          hub — version cards, facts, source docs
  viewer.html         3D viewer UI
  budget.html         budget UI
  data/property.js    ALL geometry: site, buildings, walls, openings, interiors, per version
  data/budget.js      budget line items per version
  js/build.js         turns property.js into three.js meshes
  js/viewer.js        camera, views, layers, section cut, click-to-inspect
  js/budget.js        budget math, editing, localStorage, CSV export
  css/style.css
```

## Editing

* **Move a door / add a window**: edit the `openings` arrays in `data/property.js`. `u` is the distance along the wall from its `a` end (left end as seen from outside), `w` width, `sill` height of the bottom above slab, `h` height.
* **Change a room layout**: edit `INTERIOR.original` / `INTERIOR.office` — partitions are `{a, b}` plan points with `doors: [{u, w}]`.
* **Change a cost**: `data/budget.js`. Lines with `owner` split labor (`low/high`) from material you supply (`owner.costLow/High`) vs. market (`owner.marketLow/High`).
* Edits made on the budget page itself are saved in the browser (localStorage); **Reset edits** returns to the file values.

## Coordinate system

Feet. `X` runs toward the street (SE), `Z` toward the Graphic Design side (SW), `Y` up from the slab (FFE 100.00). Origin is the junction wall between the two suites on the building centerline. True north points roughly toward the rear of the lot (`SITE.trueNorth`).

## Sources & assumptions

See **Assumptions & sources** in the viewer (button in the left panel) — everything that was scaled, inferred or assumed is listed there with the reason.
