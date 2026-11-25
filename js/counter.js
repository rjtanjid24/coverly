/* Visitor counter: "Today" and "Total".
   Remote counting uses counterapi.dev (free, no key). Each browser is counted once per day.
   If the service cannot be reached, counts are kept in this browser only and marked as such. */
(function () {
  'use strict';
  const C = window.CPD;
  const cfg = C.COUNTER;
  const LS = { last: 'cpd.vc.last', total: 'cpd.vc.total', day: 'cpd.vc.day' };
  const read = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } };

  function dayKey() { const d = new Date(), p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; }
  const fmt = (n) => (typeof n === 'number' && isFinite(n)) ? n.toLocaleString('en-US') : '–';

  function paint(today, total, local) {
    document.querySelectorAll('[data-count-today]').forEach((el) => { el.textContent = fmt(today); });
    document.querySelectorAll('[data-count-total]').forEach((el) => { el.textContent = fmt(total); });
    document.querySelectorAll('.counter').forEach((el) => {
      el.hidden = false;
      el.title = local ? 'Counted on this device only (the shared counter could not be reached).' : 'Visitors counted once per browser per day.';
      el.classList.toggle('is-local', !!local);
    });
  }

  function localCounts(hit, day) {
    let total = parseInt(read(LS.total), 10) || 0;
    let today = read(LS.day) && read(LS.day).split('|')[0] === day ? parseInt(read(LS.day).split('|')[1], 10) || 0 : 0;
    if (hit) { total += 1; today += 1; write(LS.total, String(total)); write(LS.day, day + '|' + today); }
    return { today, total };
  }

  async function call(path) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 4500);
    try {
      const r = await fetch(`${cfg.base}/${cfg.namespace}/${path}`, { signal: ctl.signal, cache: 'no-store' });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      const n = Number(j.count != null ? j.count : j.value);
      if (!isFinite(n)) throw new Error('bad payload');
      return n;
    } finally { clearTimeout(t); }
  }

  async function start() {
    if (!cfg.enabled) { document.querySelectorAll('.counter').forEach((el) => { el.hidden = true; }); return; }
    const day = dayKey();
    const firstToday = read(LS.last) !== day;
    // Show something immediately from this device while the network call runs.
    const l0 = localCounts(false, day); if (l0.total) paint(l0.today, l0.total, true);
    try {
      const verb = firstToday ? '/up' : '';
      const [total, today] = await Promise.all([call('total' + verb), call('d-' + day + verb)]);
      if (firstToday) write(LS.last, day);
      paint(today, total, false);
    } catch (e) {
      const l = localCounts(firstToday, day);
      if (firstToday) write(LS.last, day);
      paint(l.today, l.total, true);
    }
  }
  C.counter = { start };
})();
