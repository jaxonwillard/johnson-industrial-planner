// =============================================================================
//  Budget page — renders data/budget.js, lets you toggle/edit lines, remembers
//  edits in localStorage, exports CSV.
// =============================================================================
import { BUDGET } from '../data/budget.js';
import { VERSIONS } from '../data/property.js';

const params = new URLSearchParams(location.search);
let version = BUDGET[params.get('v')] ? params.get('v') : 'office';
const KEY = (v) => `jib-budget-${v}`;

const fmt = (n) => '$' + Math.round(n).toLocaleString();
const fmtU = (n) => n >= 100 ? '$' + Math.round(n).toLocaleString() : '$' + n.toFixed(2);

function loadState(v) {
  try { return JSON.parse(localStorage.getItem(KEY(v))) || {}; } catch { return {}; }
}
function saveState(v, s) { localStorage.setItem(KEY(v), JSON.stringify(s)); }

let state = {};
function effective(item) {
  const s = state.items?.[item.id] || {};
  return {
    included: s.included ?? item.included,
    qty: s.qty ?? item.qty,
    low: s.low ?? item.low,
    high: s.high ?? item.high,
  };
}
function unitCosts(item) {
  const e = effective(item);
  let low = e.low, high = e.high;
  if (item.owner) {
    const useOwner = state.ownerPricing ?? true;
    low += useOwner ? item.owner.costLow : item.owner.marketLow;
    high += useOwner ? item.owner.costHigh : item.owner.marketHigh;
  }
  return { low, high, mid: (low + high) / 2 };
}
function line(item) {
  const e = effective(item), u = unitCosts(item);
  return { low: e.qty * u.low, high: e.qty * u.high, mid: e.qty * u.mid };
}

function render() {
  const B = BUDGET[version];
  state = loadState(version);
  const contingency = state.contingencyPct ?? B.contingencyPct;
  const target = state.target ?? B.target;
  const ownerPricing = state.ownerPricing ?? true;

  document.title = `${B.title} — 2009 Johnson Industrial Blvd`;
  document.getElementById('b-title').textContent = B.title;
  document.getElementById('b-intro').textContent = B.intro;
  document.documentElement.style.setProperty('--accent', VERSIONS[version].accent);
  document.querySelectorAll('[data-version]').forEach(a => a.classList.toggle('active', a.dataset.version === version));
  document.getElementById('model-link').href = `viewer.html?v=${version}`;
  document.getElementById('contingency').value = contingency;
  document.getElementById('target').value = target ?? '';
  document.getElementById('owner-pricing').checked = ownerPricing;
  document.getElementById('target-wrap').style.display = B.target === null ? 'none' : '';
  document.getElementById('owner-wrap').style.display = B.items.some(i => i.owner) ? '' : 'none';

  // totals
  let incLow = 0, incHigh = 0, incMid = 0, optMid = 0, savings = 0;
  const catTotals = {};
  for (const it of B.items) {
    const e = effective(it), l = line(it);
    if (e.included) {
      incLow += l.low; incHigh += l.high; incMid += l.mid;
      catTotals[it.cat] = (catTotals[it.cat] || 0) + l.mid;
      if (it.owner && ownerPricing) savings += e.qty * (((it.owner.marketLow + it.owner.marketHigh) / 2) - ((it.owner.costLow + it.owner.costHigh) / 2));
    } else optMid += l.mid;
  }
  const contMid = incMid * contingency / 100, contLow = incLow * contingency / 100, contHigh = incHigh * contingency / 100;
  const grandMid = incMid + contMid, grandLow = incLow + contLow, grandHigh = incHigh + contHigh;

  // summary cards
  const S = document.getElementById('summary');
  const vsTarget = target ? grandMid / target : null;
  const cls = vsTarget === null ? '' : vsTarget <= 1.0 ? 'good' : vsTarget <= 1.15 ? 'warn' : 'bad';
  S.innerHTML = `
    <div class="card stat"><b>Included scope</b><div class="v">${fmt(incMid)}</div><div class="r">range ${fmt(incLow)} – ${fmt(incHigh)}</div></div>
    <div class="card stat"><b>Contingency ${contingency}%</b><div class="v">${fmt(contMid)}</div><div class="r">on included scope</div></div>
    <div class="card stat ${cls}"><b>Total with contingency</b><div class="v">${fmt(grandMid)}</div><div class="r">range ${fmt(grandLow)} – ${fmt(grandHigh)}</div>
      ${target ? `<div class="target-bar"><div class="fill ${grandMid > target ? 'over' : ''}" style="width:${Math.min(100, grandMid / (target * 1.3) * 100)}%"></div><div class="mark" style="left:${100 / 1.3}%"></div></div><div class="tiny">target ${fmt(target)} · ${grandMid <= target ? fmt(target - grandMid) + ' under' : fmt(grandMid - target) + ' over'}</div>` : ''}
    </div>
    ${B.items.some(i => i.owner) ? `<div class="card stat good"><b>Owner-supply savings</b><div class="v">${fmt(savings)}</div><div class="r">vs. market material on included lines</div></div>` : ''}
    <div class="card stat"><b>Priced options (off)</b><div class="v">${fmt(optMid)}</div><div class="r">switch on any line below</div></div>`;

  // table
  const T = document.getElementById('rows');
  let html = '';
  for (const cat of B.categories) {
    html += `<tr class="cat"><td colspan="8">${cat.name}<span class="sub">${fmt(catTotals[cat.id] || 0)} included</span></td></tr>`;
    for (const it of B.items.filter(i => i.cat === cat.id)) {
      const e = effective(it), u = unitCosts(it), l = line(it);
      const ownerBadge = it.owner ? `<span class="badge">${ownerPricing ? it.owner.label : 'market material'}</span>` : '';
      const optBadge = !it.included && !state.items?.[it.id]?.included ? '' : '';
      html += `<tr class="${e.included ? '' : 'off'}" data-id="${it.id}">
        <td><input type="checkbox" class="inc" ${e.included ? 'checked' : ''}></td>
        <td><span class="name">${it.name}</span>${ownerBadge}${it.included ? '' : '<span class="badge opt">option</span>'}</td>
        <td class="num"><input class="q" type="number" step="any" value="${e.qty}"></td>
        <td>${it.unit}</td>
        <td class="num"><input class="c lo" type="number" step="any" value="${e.low}">${it.owner ? `<div class="tiny">+ ${fmtU(u.low - e.low)} mat.</div>` : ''}</td>
        <td class="num"><input class="c hi" type="number" step="any" value="${e.high}">${it.owner ? `<div class="tiny">+ ${fmtU(u.high - e.high)} mat.</div>` : ''}</td>
        <td class="num"><strong>${fmt(l.mid)}</strong><div class="tiny">${fmt(l.low)} – ${fmt(l.high)}</div></td>
        <td class="notes">${it.notes || ''}</td>
      </tr>`;
    }
  }
  T.innerHTML = html;
  document.getElementById('foot').innerHTML = `
    <tr><td colspan="6">Included subtotal</td><td class="num">${fmt(incMid)}</td><td class="tiny">${fmt(incLow)} – ${fmt(incHigh)}</td></tr>
    <tr><td colspan="6">Contingency ${contingency}%</td><td class="num">${fmt(contMid)}</td><td></td></tr>
    <tr class="grand"><td colspan="6">Total</td><td class="num">${fmt(grandMid)}</td><td class="tiny">${fmt(grandLow)} – ${fmt(grandHigh)}</td></tr>`;

  // wire inputs
  T.querySelectorAll('tr[data-id]').forEach(tr => {
    const id = tr.dataset.id;
    const upd = (patch) => { state.items = state.items || {}; state.items[id] = { ...(state.items[id] || {}), ...patch }; saveState(version, state); render(); };
    tr.querySelector('.inc').addEventListener('change', e => upd({ included: e.target.checked }));
    tr.querySelector('.q').addEventListener('change', e => upd({ qty: parseFloat(e.target.value) || 0 }));
    tr.querySelector('.lo').addEventListener('change', e => upd({ low: parseFloat(e.target.value) || 0 }));
    tr.querySelector('.hi').addEventListener('change', e => upd({ high: parseFloat(e.target.value) || 0 }));
  });
}

document.getElementById('contingency').addEventListener('change', e => { state.contingencyPct = parseFloat(e.target.value) || 0; saveState(version, state); render(); });
document.getElementById('target').addEventListener('change', e => { state.target = parseFloat(e.target.value) || null; saveState(version, state); render(); });
document.getElementById('owner-pricing').addEventListener('change', e => { state.ownerPricing = e.target.checked; saveState(version, state); render(); });
document.getElementById('reset').addEventListener('click', () => { if (confirm('Discard your edits to this version\'s budget?')) { localStorage.removeItem(KEY(version)); render(); } });
document.getElementById('export').addEventListener('click', () => {
  const B = BUDGET[version];
  const rows = [['Included', 'Category', 'Item', 'Qty', 'Unit', 'Unit low', 'Unit high', 'Line low', 'Line mid', 'Line high', 'Notes']];
  for (const it of B.items) {
    const e = effective(it), u = unitCosts(it), l = line(it);
    const cat = B.categories.find(c => c.id === it.cat)?.name || it.cat;
    rows.push([e.included ? 'Y' : 'N', cat, it.name, e.qty, it.unit, u.low, u.high, Math.round(l.low), Math.round(l.mid), Math.round(l.high), it.notes || '']);
  }
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `budget-${version}.csv`; a.click(); URL.revokeObjectURL(a.href);
});
document.querySelectorAll('[data-version]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault(); version = a.dataset.version;
  const url = new URL(location.href); url.searchParams.set('v', version); history.replaceState(null, '', url); render();
}));

render();
