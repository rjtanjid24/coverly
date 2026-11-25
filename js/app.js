/* Academic Cover Page Designer: home page, studio dashboard, preview, export, storage. */
(function () {
  'use strict';
  const C = window.CPD;
  const R = C.render;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const KEY = { state: 'cpd.state.v2', profiles: 'cpd.profiles.v1', copies: 'cpd.copies.v2' };
  const MM = 96 / 25.4;
  const SECTIONS = ['templates', 'details', 'design', 'saved'];

  /* ---------- icons ---------- */
  const ICON = {
    layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    palette: '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 1 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.3-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3A4.7 4.7 0 0 0 22 10.7C22 5.9 17.5 2 12 2Z"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    type: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>'
  };
  const svg = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;

  /* ---------- storage ---------- */
  const store = {
    get(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  /* ---------- state ---------- */
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const todayISO = () => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
  const freshState = () => { const s = clone(C.DEFAULT_STATE); s.submissionDate = todayISO(); return s; };
  function mergeState(base, saved) {
    const out = clone(base);
    if (!saved || typeof saved !== 'object') return out;
    Object.keys(out).forEach((k) => {
      if (k === 'design' || k === 'logos') {
        if (saved[k] && typeof saved[k] === 'object') Object.keys(out[k]).forEach((j) => { if (saved[k][j] !== undefined && typeof saved[k][j] === typeof out[k][j]) out[k][j] = saved[k][j]; });
      } else if (k === 'members') {
        if (Array.isArray(saved.members)) out.members = saved.members.slice(0, 12).map((m) => ({ name: String((m && m.name) || ''), roll: String((m && m.roll) || ''), section: String((m && m.section) || ''), role: String((m && m.role) || '') }));
      } else if (saved[k] !== undefined && typeof saved[k] === typeof out[k]) out[k] = saved[k];
    });
    if (!C.TEMPLATES.some((t) => t.id === out.template)) out.template = 'classic';
    if (!C.DOC_TYPES.includes(out.docType)) out.docType = 'Assignment';
    if (!C.FONTS.some((f) => f.id === out.design.font)) out.design.font = 'baskerville';
    if (out.design.headFont !== 'same' && !C.FONTS.some((f) => f.id === out.design.headFont)) out.design.headFont = 'same';
    return out;
  }
  let state = mergeState(freshState(), store.get(KEY.state, null));
  let zoom = 1;
  let pendingLogo = { nu: '', college: '' };
  const has = (v) => v != null && String(v).trim() !== '';

  /* ---------- toast + modal ---------- */
  let toastTimer;
  function toast(msg, isErr) {
    const t = $('#toast');
    t.textContent = msg; t.classList.toggle('err', !!isErr); t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), isErr ? 6000 : 2800);
  }
  let modalTimer;
  function modal(title, text, ms) {
    const m = $('#modal');
    $('#mIco').innerHTML = svg('check'); $('#mTitle').textContent = title; $('#mText').textContent = text;
    m.setAttribute('aria-hidden', 'false'); m.classList.add('show');
    clearTimeout(modalTimer); modalTimer = setTimeout(hideModal, ms || 2400);
  }
  function hideModal() { const m = $('#modal'); m.classList.remove('show'); m.setAttribute('aria-hidden', 'true'); }
  function armed(btn, armedLabel, fn) {
    const orig = btn.dataset.label || btn.textContent;
    btn.dataset.label = orig;
    if (btn.dataset.armed) { clearTimeout(+btn.dataset.armed); delete btn.dataset.armed; btn.textContent = orig; fn(); return; }
    btn.textContent = armedLabel;
    btn.dataset.armed = setTimeout(() => { delete btn.dataset.armed; btn.textContent = orig; }, 3500);
  }

  /* ---------- share (copy site link) ---------- */
  function siteURL() { return location.href.split('#')[0]; }
  async function copyText(text) {
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch (e) { /* fall through */ }
    try {
      const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok;
    } catch (e) { return false; }
  }
  async function shareSite() {
    const url = siteURL();
    if (await copyText(url)) modal('Link copied!', 'Send it to your friends so they can design their cover pages too.');
    else toast('Copy this link: ' + url, true);
  }

  /* ---------- form building ---------- */
  function fieldHTML(f) {
    const id = 'f_' + f.id;
    let ctl;
    if (f.type === 'select') ctl = `<select id="${id}" data-key="${f.id}">${f.options.map((o) => `<option>${R.esc(o)}</option>`).join('')}</select>`;
    else if (f.type === 'textarea') ctl = `<textarea id="${id}" data-key="${f.id}" maxlength="${f.max || 300}" placeholder="${R.esc(f.placeholder || '')}"></textarea>`;
    else ctl = `<input id="${id}" type="${f.type}" data-key="${f.id}" ${f.max ? `maxlength="${f.max}"` : ''} placeholder="${R.esc(f.placeholder || '')}" autocomplete="off">`;
    return `<div class="field${f.wide ? ' wide' : ''}" data-field="${f.id}" ${f.show ? `data-show="${f.show.join('|')}"` : ''}><label for="${id}"><span>${R.esc(f.label)}</span></label>${ctl}<div class="error" id="${id}_err" role="alert"></div></div>`;
  }

  const THUMBS = {
    classic: [[40, 7, 20, 9, 'o'], [24, 20, 52, 3, 'p'], [32, 26, 36, 2], [14, 42, 72, 6, 'p'], [24, 52, 52, 2], [10, 74, 36, 12], [54, 74, 36, 12], [30, 92, 40, 2]],
    seal: [[38, 6, 24, 14, 'o'], [22, 24, 56, 3, 'p'], [14, 36, 72, 6, 'p'], [24, 46, 52, 2], [10, 72, 36, 12], [54, 72, 36, 12], [30, 90, 40, 2]],
    minimal: [[10, 8, 12, 6, 'o'], [58, 9, 32, 2], [10, 44, 16, 1.5, 'g'], [10, 48, 78, 7, 'p'], [10, 58, 50, 5, 'p'], [10, 72, 80, 1], [10, 78, 24, 10], [38, 78, 24, 10], [66, 78, 24, 10]],
    formal: [[9, 8, 15, 9, 'o'], [76, 8, 15, 9, 'o'], [30, 9, 40, 3, 'p'], [30, 14, 40, 2], [9, 24, 82, 2, 'p'], [30, 38, 40, 4, 'g'], [14, 48, 72, 6, 'p'], [12, 76, 34, 12], [54, 76, 34, 12]],
    banner: [[0, 0, 100, 36, 'p'], [8, 8, 14, 7, 'o'], [8, 22, 20, 3, 'g'], [8, 28, 70, 5], [8, 46, 84, 10], [8, 60, 84, 10], [8, 74, 84, 10]],
    practical: [[7, 6, 86, 13, 'p'], [30, 26, 40, 4, 'p'], [7, 36, 86, 6], [7, 45, 86, 6], [7, 54, 86, 6], [7, 63, 86, 6], [7, 78, 41, 14], [52, 78, 41, 14]],
    science: [[0, 0, 11, 100, 'p'], [18, 8, 18, 6, 'o'], [40, 9, 44, 3, 'p'], [18, 36, 14, 3, 'g'], [18, 44, 70, 8, 'p'], [18, 56, 50, 4, 'p'], [18, 74, 34, 11], [56, 74, 34, 11]],
    group: [[40, 6, 20, 8, 'o'], [24, 18, 52, 3, 'p'], [16, 28, 68, 5, 'p'], [8, 42, 84, 5, 'p'], [8, 49, 84, 5], [8, 56, 84, 5], [8, 63, 84, 5], [8, 80, 40, 12], [52, 80, 40, 12]],
    editorial: [[0, 0, 22, 100, 'p'], [30, 8, 34, 3, 'p'], [74, 8, 18, 6, 'o'], [30, 50, 60, 10, 'p'], [30, 64, 22, 1.5, 'g'], [30, 80, 28, 10], [62, 80, 28, 10]]
  };
  const thumbHTML = (id) => (THUMBS[id] || []).map((b) => `<i class="${b[4] || ''}" style="left:${b[0]}%;top:${b[1]}%;width:${b[2]}%;height:${b[3]}%"></i>`).join('');

  const QUICK = [
    { label: 'Assignment Cover', docType: 'Assignment', template: 'classic' },
    { label: 'Practical Notebook Cover', docType: 'Practical Notebook', template: 'practical' },
    { label: 'Lab Report Cover', docType: 'Lab Report', template: 'science' },
    { label: 'Field Report Cover', docType: 'Fieldwork Report', template: 'editorial' },
    { label: 'Excursion Report Cover', docType: 'Excursion Report', template: 'banner' },
    { label: 'Group Project Cover', docType: 'Group Project', template: 'group' }
  ];

  const RAIL = [['templates', 'Templates', 'layout'], ['details', 'Details', 'edit'], ['design', 'Design', 'palette'], ['saved', 'Saved', 'save'], ['preview', 'Preview', 'eye']];

  function buildPanel() {
    const opt = (list) => list.map((o) => `<option value="${o.id}">${R.esc(o.name)}</option>`).join('');
    $('#rail').innerHTML = RAIL.map((r) => `<button type="button" data-sec="${r[0]}" aria-selected="false">${svg(r[2])}<span>${r[1]}</span></button>`).join('');

    let h = '';
    /* templates */
    h += `<div class="psec" data-psec="templates"><h2>Templates</h2><p class="sub">Your details carry over when you switch layouts.</p>
      <section class="card"><h3>Quick start</h3><div class="chips" id="quickPresets">${QUICK.map((q, i) => `<button type="button" class="chip" data-quick="${i}">${R.esc(q.label)}</button>`).join('')}</div></section>
      <section class="card"><h3>Layouts</h3><div class="tpl-grid">${C.TEMPLATES.map((t) =>
        `<button type="button" class="tpl" data-tpl="${t.id}" aria-pressed="false"><span class="thumb">${thumbHTML(t.id)}</span><b>${R.esc(t.name)}</b><small>${R.esc(t.note)}</small></button>`).join('')}</div></section></div>`;

    /* details */
    h += `<div class="psec" data-psec="details"><h2>Details</h2><p class="sub">Empty fields never appear on the cover.</p>`;
    C.FIELDS.forEach((g, i) => {
      h += `<details class="card" ${i < 2 ? 'open' : ''}><summary>${R.esc(g.group)}</summary><div class="grid2">${g.fields.map(fieldHTML).join('')}</div></details>`;
      if (g.group === 'Student') {
        h += `<details class="card" id="memCard" open><summary>Group members</summary>
          <p class="hint">Shown on the Group Project template. Up to 12 members.</p>
          <div class="mem-list" id="memList"></div>
          <button type="button" class="btn small" id="memAdd" style="margin-top:10px">Add member</button></details>`;
      }
    });
    h += `</div>`;

    /* design */
    h += `<div class="psec" data-psec="design"><h2>Design</h2><p class="sub">Colors, fonts, borders, logos and page.</p>
      <section class="card"><h3>Colors</h3>
        <div class="swatches" id="swatches">${C.COLOR_PRESETS.map((p) =>
          `<button type="button" class="sw ${p.id === 'custom' ? 'custom' : ''}" data-preset="${p.id}" title="${R.esc(p.name)}" aria-label="${R.esc(p.name)}" aria-pressed="false" ${p.p ? `style="background:${p.p}"` : ''}>${p.s ? `<i style="background:${p.s}"></i>` : ''}</button>`).join('')}</div>
        <p class="hint" id="presetName" style="margin:8px 0 10px"></p>
        <div class="grid2">
          <div class="field"><label for="d_primary"><span>Primary color</span></label><input id="d_primary" type="color" data-d="primary"></div>
          <div class="field"><label for="d_secondary"><span>Secondary color</span></label><input id="d_secondary" type="color" data-d="secondary"></div>
        </div></section>
      <section class="card"><h3>Typography</h3><div class="grid2">
        <div class="field wide"><label for="d_font"><span>Body font</span></label><select id="d_font" data-d="font">${opt(C.FONTS)}</select></div>
        <div class="field wide"><label for="d_headFont"><span>Heading font</span></label><select id="d_headFont" data-d="headFont"><option value="same">Same as body</option>${opt(C.FONTS)}</select></div>
        <div class="field wide"><label for="d_fontSize"><span>Font size <b class="val" data-val="fontSize"></b></span></label><input id="d_fontSize" type="range" min="80" max="125" step="1" data-d="fontSize"></div>
      </div></section>
      <section class="card"><h3>Border</h3><div class="grid2">
        <div class="field"><label for="d_border"><span>Style</span></label><select id="d_border" data-d="border">${opt(C.BORDERS)}</select></div>
        <div class="field"><label for="d_borderWidth"><span>Thickness <b class="val" data-val="borderWidth"></b></span></label><input id="d_borderWidth" type="range" min="1" max="6" step="0.5" data-d="borderWidth"></div>
      </div></section>
      <section class="card"><h3>Logos</h3><div class="grid2">
        <label class="check"><input type="checkbox" id="d_showCollege" data-d="showCollege"><span>College logo</span></label>
        <label class="check"><input type="checkbox" id="d_showNU" data-d="showNU"><span>National University logo</span></label>
        <div class="field"><label for="d_logoSize"><span>Logo size <b class="val" data-val="logoSize"></b></span></label><input id="d_logoSize" type="range" min="12" max="42" step="1" data-d="logoSize"></div>
        <div class="field"><label for="d_logoPlacement"><span>Placement</span></label><select id="d_logoPlacement" data-d="logoPlacement"><option value="center">Center</option><option value="left">Left</option><option value="right">Right</option></select></div>
      </div>
      ${['college', 'nu'].map((k) => `<div class="field" style="margin-top:12px"><span>${k === 'nu' ? 'Replace National University logo' : 'Replace college logo'}</span>
        <div class="logo-prev"><img id="prev_${k}" alt="" hidden><input type="file" id="up_${k}" data-up="${k}" accept="image/png,image/jpeg,image/webp,image/svg+xml"></div>
        <div class="row wrap" id="upActions_${k}" hidden><button type="button" class="btn small primary" data-use="${k}">Use this logo</button><button type="button" class="btn small" data-cancel="${k}">Cancel</button></div>
        <button type="button" class="btn small" data-defaultlogo="${k}" hidden style="align-self:flex-start">Back to official logo</button>
        <div class="error" id="upErr_${k}" role="alert"></div></div>`).join('')}</section>
      <section class="card"><h3>Page</h3><div class="grid2">
        <div class="field"><label for="d_pageSize"><span>Page size</span></label><select id="d_pageSize" data-d="pageSize"><option value="a4">A4</option><option value="letter">Letter</option><option value="custom">Custom size</option></select></div>
        <div class="field"><label for="d_orientation"><span>Orientation</span></label><select id="d_orientation" data-d="orientation"><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></div>
        <div class="field" data-custom><label for="d_customW"><span>Width (mm)</span></label><input id="d_customW" type="number" min="100" max="500" step="1" data-d="customW"><div class="error" id="d_customW_err" role="alert"></div></div>
        <div class="field" data-custom><label for="d_customH"><span>Height (mm)</span></label><input id="d_customH" type="number" min="100" max="700" step="1" data-d="customH"><div class="error" id="d_customH_err" role="alert"></div></div>
      </div></section>
      <section class="card"><h3>Extras</h3>
        <div class="field"><label for="d_watermark"><span>Watermark text (optional)</span></label><input id="d_watermark" type="text" maxlength="40" data-d="watermark" placeholder="e.g. Botany"></div>
        <label class="check" style="margin-top:6px"><input type="checkbox" id="d_signatures" data-d="signatures"><span>Add signature lines for student and teacher</span></label>
        <label class="check"><input type="checkbox" id="d_blankLines" data-d="blankLines"><span>Show blank lines for empty name, roll, reg. and designation</span></label>
      </section></div>`;

    /* saved */
    h += `<div class="psec" data-psec="saved"><h2>Saved</h2><p class="sub">Your work saves automatically in this browser.</p>
      <section class="card"><h3>Profiles</h3>
        <p class="hint">Store your name, roll, registration, department, year, semester and session to reuse.</p>
        <div class="row"><label class="grow"><span>Profile name</span><input type="text" id="profileName" placeholder="e.g. My details"></label><button type="button" class="btn small" id="btnSaveProfile">Save</button></div>
        <div id="profileList" class="profile-list"></div></section>
      <section class="card"><h3>Drafts</h3>
        <div class="row wrap"><button type="button" class="btn small" id="btnDuplicate">Duplicate this design</button>
        <button type="button" class="btn small" id="btnSaveDesign">Download design file</button>
        <label class="btn small file">Load design file<input type="file" id="designFile" accept="application/json,.json" hidden></label></div>
        <div id="duplicateList" class="profile-list"></div></section>
      <section class="card"><h3>Privacy</h3><p class="hint">Everything stays on this device. Clearing removes your draft, profiles and copies.</p>
        <button type="button" class="btn small danger" id="btnClearSaved">Clear saved data</button></section></div>`;

    $('#panelBody').innerHTML = h;
  }

  /* ---------- form <-> state ---------- */
  function syncForm() {
    $$('[data-key]').forEach((el) => { el.value = state[el.dataset.key] == null ? '' : state[el.dataset.key]; });
    $$('[data-d]').forEach((el) => {
      const v = state.design[el.dataset.d];
      if (el.type === 'checkbox') el.checked = !!v; else el.value = v;
    });
    $$('[data-val]').forEach((el) => { const k = el.dataset.val; el.textContent = k === 'fontSize' ? state.design[k] + '%' : state.design[k] + (k === 'logoSize' ? ' mm' : ' px'); });
    $$('.tpl').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tpl === state.template)));
    $$('.sw').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.preset === state.design.preset)));
    const pr = C.COLOR_PRESETS.find((p) => p.id === state.design.preset);
    $('#presetName').textContent = pr ? pr.name : '';
    applyVisibility();
    renderMembers();
    ['college', 'nu'].forEach((k) => {
      const custom = !!state.logos[k];
      const prev = $('#prev_' + k);
      prev.hidden = !custom && !pendingLogo[k]; prev.src = pendingLogo[k] || state.logos[k] || '';
      $('[data-defaultlogo="' + k + '"]').hidden = !custom;
      $('#upActions_' + k).hidden = !pendingLogo[k];
    });
    updateMeter();
  }

  function applyVisibility() {
    $$('[data-show]').forEach((el) => { el.hidden = !el.dataset.show.split('|').includes(state.docType); });
    const custom = state.design.pageSize === 'custom';
    $$('[data-custom]').forEach((el) => { el.hidden = !custom; });
    $('#d_orientation').disabled = custom;
    $('#memCard').hidden = !(state.docType === 'Group Project' || state.template === 'group');
  }

  function renderMembers() {
    const list = $('#memList');
    const rows = state.members.map((m, i) => `<div class="mem">
      <input type="text" data-mi="${i}" data-mf="name" value="${R.esc(m.name)}" placeholder="Name" aria-label="Member ${i + 1} name" maxlength="60">
      <input type="text" data-mi="${i}" data-mf="roll" value="${R.esc(m.roll)}" placeholder="ID / Roll" aria-label="Member ${i + 1} roll" maxlength="20">
      <input type="text" data-mi="${i}" data-mf="section" value="${R.esc(m.section)}" placeholder="Section" aria-label="Member ${i + 1} section" maxlength="12">
      <input type="text" data-mi="${i}" data-mf="role" value="${R.esc(m.role)}" placeholder="Role" aria-label="Member ${i + 1} role" maxlength="24">
      <button type="button" class="x" data-memdel="${i}" aria-label="Remove member ${i + 1}">&times;</button></div>`).join('');
    // Only rebuild when the row count changes so typing never loses focus.
    if (list.dataset.n !== String(state.members.length) || list.dataset.rev !== String(memRev)) { list.innerHTML = rows; list.dataset.n = state.members.length; list.dataset.rev = memRev; }
    $('#memAdd').disabled = state.members.length >= 12;
  }
  let memRev = 0;

  function onInput(e) {
    const t = e.target;
    if (t.dataset.mi !== undefined) { state.members[+t.dataset.mi][t.dataset.mf] = t.value; commit(); return; }
    if (t.dataset.key) {
      state[t.dataset.key] = t.value;
      const fld = t.closest('.field'); if (fld) fld.classList.remove('invalid');
      if (t.dataset.key === 'docType') applyVisibility();
    } else if (t.dataset.d) {
      const k = t.dataset.d;
      const v = t.type === 'checkbox' ? t.checked : (t.type === 'range' || t.type === 'number') ? Number(t.value) : t.value;
      if (t.type === 'number' && !validateDim(t)) return;
      state.design[k] = v;
      if (k === 'primary' || k === 'secondary') {
        const match = C.COLOR_PRESETS.find((p) => p.p && p.p.toLowerCase() === state.design.primary.toLowerCase() && p.s.toLowerCase() === state.design.secondary.toLowerCase());
        state.design.preset = match ? match.id : 'custom';
        $$('.sw').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.preset === state.design.preset)));
        const pr = C.COLOR_PRESETS.find((p) => p.id === state.design.preset); $('#presetName').textContent = pr ? pr.name : '';
      }
      const out = $('[data-val="' + k + '"]');
      if (out) out.textContent = k === 'fontSize' ? v + '%' : v + (k === 'logoSize' ? ' mm' : ' px');
      if (k === 'pageSize') applyVisibility();
    } else return;
    commit();
  }

  function validateDim(el) {
    const min = 100, max = el.dataset.d === 'customH' ? 700 : 500;
    const err = $('#' + el.id + '_err');
    const n = Number(el.value);
    const bad = !el.value || isNaN(n) || n < min || n > max;
    err.textContent = bad ? `Enter a value between ${min} and ${max} mm.` : '';
    return !bad;
  }

  function updateMeter() {
    const keys = ['title', 'studentName', 'roll', 'reg', 'dept', 'session', 'submittedTo', 'designation', 'submissionDate'];
    const n = keys.filter((k) => has(state[k])).length;
    $('#meterFill').style.width = Math.round(n / keys.length * 100) + '%';
    $('#meterText').textContent = `${n}/${keys.length} key details`;
  }

  /* ---------- rendering ---------- */
  let rafId = 0, saveTimer = 0, lastHTML = '';
  function commit() {
    cancelAnimationFrame(rafId); rafId = requestAnimationFrame(render);
    clearTimeout(saveTimer); saveTimer = setTimeout(persist, 350);
    updateMeter();
  }
  function persist() {
    let ok = store.set(KEY.state, state);
    if (!ok) {
      const lite = clone(state); lite.logos = { nu: '', college: '' };
      if (store.set(KEY.state, lite)) { toast('Saved without your uploaded logos because browser storage is full.', true); ok = true; }
    }
    const now = new Date(); const p = (n) => String(n).padStart(2, '0');
    $('#saveStatus').textContent = ok ? `Draft saved at ${p(now.getHours())}:${p(now.getMinutes())}` : 'Could not save in this browser';
  }
  function render() {
    if (document.body.dataset.view !== 'studio') return;
    const html = R.pageHTML(state);
    const sheet = $('#sheet');
    if (html !== lastHTML) { sheet.innerHTML = html; lastHTML = html; }
    R.fitPage(sheet.firstElementChild);
    const { w, h } = R.pageDims(state);
    let st = $('#pageStyle'); if (!st) { st = document.createElement('style'); st.id = 'pageStyle'; document.head.appendChild(st); }
    st.textContent = `@page { size: ${w}mm ${h}mm; margin: 0; }`;
    layoutSheet();
  }
  function layoutSheet() {
    if (document.body.dataset.view !== 'studio') return;
    const { w, h } = R.pageDims(state);
    const pw = w * MM, ph = h * MM;
    const canvas = $('#canvas'), sheet = $('#sheet'), wrap = $('#sheetWrap');
    const cs = getComputedStyle(canvas);
    const availW = canvas.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const availH = canvas.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (availW <= 0) return;
    const mobile = window.matchMedia('(max-width: 900px)').matches;
    let k = mobile ? availW / pw : Math.min(availW / pw, availH / ph);
    k = Math.min(k, 1.5) * zoom;
    sheet.style.width = pw + 'px'; sheet.style.height = ph + 'px';
    sheet.style.transform = `scale(${k})`;
    wrap.style.width = pw * k + 'px'; wrap.style.height = ph * k + 'px';
    $('#stageInfo').textContent = `${+w.toFixed(1)} × ${+h.toFixed(1)} mm · ${Math.round(k * 100)}%`;
  }

  /* ---------- logo loading with fallbacks ---------- */
  C.resolved = C.resolved || {};
  function advanceLogo(img) {
    if (img.dataset.fb) return;
    const key = img.dataset.logo;
    let chain = []; try { chain = JSON.parse(img.dataset.chain || '[]'); } catch (e) { /* ignore */ }
    const i = (+img.dataset.i || 0) + 1;
    img.dataset.i = i;
    const item = chain[i];
    if (item) { if (item.c) img.crossOrigin = 'anonymous'; else img.removeAttribute('crossorigin'); img.src = item.u; }
    else { img.dataset.fb = '1'; img.removeAttribute('crossorigin'); img.src = R.emblem(key === 'nu' ? 'nu' : 'college'); C.resolved[key] = { u: R.emblem(key === 'nu' ? 'nu' : 'college'), c: 0 }; }
  }
  document.addEventListener('error', (e) => { const t = e.target; if (t && t.tagName === 'IMG' && t.dataset && t.dataset.logo) advanceLogo(t); }, true);
  document.addEventListener('load', (e) => {
    const t = e.target;
    if (!t || t.tagName !== 'IMG' || !t.dataset || !t.dataset.logo) return;
    const key = t.dataset.logo;
    if ((key === 'nu' || key === 'college') && !state.logos[key] && !t.dataset.fb) C.resolved[key] = { u: t.getAttribute('src'), c: t.crossOrigin ? 1 : 0 };
    if (t.closest('#sheet')) R.fitPage($('#sheet').firstElementChild);
  }, true);

  function brandLogos() {
    const chain = C.INSTITUTION.logos.college.map((u) => ({ u, c: 0 }));
    $$('[data-brand]').forEach((img) => { img.dataset.logo = 'college-brand'; img.dataset.i = '0'; img.dataset.chain = JSON.stringify(chain); img.src = chain[0].u; });
  }

  /* ---------- logo upload ---------- */
  function readLogo(file) {
    return new Promise((resolve, reject) => {
      if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) return reject(new Error('Choose a PNG, JPG, WebP or SVG image.'));
      if (file.size > 3 * 1024 * 1024) return reject(new Error('That image is larger than 3 MB. Choose a smaller file.'));
      const fr = new FileReader();
      fr.onerror = () => reject(new Error('The file could not be read.'));
      fr.onload = () => {
        if (file.type === 'image/svg+xml') return resolve(fr.result);
        const img = new Image();
        img.onerror = () => reject(new Error('That file is not a valid image.'));
        img.onload = () => {
          const max = 700, k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/png'));
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  /* ---------- validation ---------- */
  function validate() {
    const missing = [];
    const groupNames = state.template === 'group' && state.members.some((m) => has(m.name));
    if (!has(state.title) && !(C.PRACTICAL.includes(state.docType) && has(state.expTitle))) missing.push('title');
    if (!has(state.studentName) && !groupNames) missing.push('studentName');
    $$('.field.invalid').forEach((f) => f.classList.remove('invalid'));
    $$('[id^="f_"][id$="_err"]').forEach((e) => { e.textContent = ''; });
    missing.forEach((k) => { const el = $('#f_' + k); if (el) { el.closest('.field').classList.add('invalid'); $('#f_' + k + '_err').textContent = 'Required before you export.'; } });
    if (missing.length) {
      setSec('details');
      const first = $('#f_' + missing[0]);
      const det = first.closest('details'); if (det) det.open = true;
      first.focus();
      toast('Add the ' + (missing.length > 1 ? 'title and student name' : missing[0] === 'title' ? 'title' : 'student name') + ' first.', true);
      return false;
    }
    if (state.design.pageSize === 'custom') {
      const a = validateDim($('#d_customW')), b = validateDim($('#d_customH'));
      if (!(a && b)) { setSec('design'); toast('Fix the custom page size first.', true); return false; }
    }
    return true;
  }

  /* ---------- export helpers ---------- */
  function waitImages(root, timeout) {
    const t0 = Date.now();
    return new Promise((resolve) => {
      (function poll() {
        const bad = $$('img', root).some((i) => !(i.complete && i.naturalWidth > 0));
        if (!bad || Date.now() - t0 > (timeout || 7000)) resolve(); else setTimeout(poll, 80);
      })();
    });
  }
  function isTainted(img) {
    try { const c = document.createElement('canvas'); c.width = c.height = 1; const x = c.getContext('2d'); x.drawImage(img, 0, 0, 1, 1); x.getImageData(0, 0, 1, 1); return false; } catch (e) { return true; }
  }
  async function buildExportPage() {
    const root = $('#captureRoot');
    root.innerHTML = R.pageHTML(state);
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) { /* ignore */ } }
    await waitImages(root);
    const page = root.firstElementChild;
    R.fitPage(page);
    return page;
  }
  /* html2canvas skips SVG images, so convert any SVG logo (fallback emblem or uploaded SVG) to PNG first. */
  function rasterizeSvgLogos(page) {
    const jobs = $$('img.logo', page).filter((img) => /^data:image\/svg\+xml/i.test(img.src)).map((img) => new Promise((resolve) => {
      const src = new Image();
      src.onload = () => {
        const nw = src.naturalWidth || 300, nh = src.naturalHeight || 300;
        const k = 600 / Math.max(nw, nh);
        const c = document.createElement('canvas'); c.width = Math.round(nw * k); c.height = Math.round(nh * k);
        c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
        img.onload = () => resolve(); img.onerror = () => resolve();
        img.src = c.toDataURL('image/png');
      };
      src.onerror = () => resolve();
      src.src = img.src;
    }));
    return Promise.all(jobs);
  }
  async function replaceTainted(page) {
    const bad = $$('img.logo', page).filter(isTainted);
    bad.forEach((img) => { img.removeAttribute('crossorigin'); img.dataset.fb = '1'; img.src = R.emblem(img.dataset.logo === 'nu' ? 'nu' : 'college'); });
    if (bad.length) await waitImages(page);
    await rasterizeSvgLogos(page);
    return bad.length;
  }
  function fileBase() {
    const clean = (s) => String(s || '').trim().replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '');
    const parts = [clean((state.title || R.docLabel(state)).slice(0, 60)), clean(state.studentName)].filter(Boolean);
    return parts.join('_') || 'Cover_Page';
  }
  function setBusy(b, which) {
    $$('#btnPdf, #btnJpg, #btnPrint').forEach((x) => { x.disabled = b; });
    $('#btnPdf').textContent = b && which === 'pdf' ? 'Preparing…' : 'Download PDF';
    $('#btnJpg').textContent = b && which === 'jpg' ? 'Preparing…' : 'JPG';
  }
  function saveBlob(blob, name) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  async function captureCanvas() {
    const page = await buildExportPage();
    const swapped = await replaceTainted(page);
    const { w, h } = R.pageDims(state);
    const scale = Math.min(3, 6500 / Math.max(w, h) / MM);
    const canvas = await window.html2canvas(page, {
      scale, useCORS: true, backgroundColor: '#ffffff', logging: false,
      onclone: (doc) => { const r = doc.getElementById('captureRoot'); if (r) { r.style.position = 'absolute'; r.style.left = '0'; r.style.top = '0'; r.style.zIndex = '0'; } }
    });
    return { canvas, w, h, swapped };
  }
  function thanks(kind, swapped) {
    if (swapped) toast('Saved. A logo could not be embedded, so a placeholder was used. See the README to add logo files.', true);
    modal('Thank you!', `Your ${kind} is ready. Share this tool with your friends.`, 3200);
  }
  async function exportAs(kind) {
    if (!validate()) return;
    if (!window.html2canvas || (kind === 'pdf' && !(window.jspdf && window.jspdf.jsPDF))) { toast('The export library did not load. Use Print and choose Save as PDF.', true); return; }
    setBusy(true, kind);
    const sy = $('#canvas').scrollTop;
    try {
      const { canvas, w, h, swapped } = await captureCanvas();
      if (kind === 'pdf') {
        const pdf = new window.jspdf.jsPDF({ orientation: w > h ? 'landscape' : 'portrait', unit: 'mm', format: [w, h], compress: true });
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.96), 'JPEG', 0, 0, w, h, undefined, 'FAST');
        pdf.save(fileBase() + '.pdf');
        thanks('PDF', swapped);
      } else {
        await new Promise((res, rej) => canvas.toBlob((b) => { if (!b) return rej(new Error('blob')); saveBlob(b, fileBase() + '.jpg'); res(); }, 'image/jpeg', 0.95));
        thanks('JPG image', swapped);
      }
    } catch (err) {
      console.error(err);
      toast(kind === 'pdf' ? 'The PDF could not be created. Try Print and choose Save as PDF.' : 'The image could not be created. Try the PDF instead.', true);
    } finally { $('#captureRoot').innerHTML = ''; setBusy(false); $('#canvas').scrollTop = sy; }
  }

  async function doPrint() {
    if (!validate()) return;
    setBusy(true, 'print');
    try {
      const page = await buildExportPage();
      await replaceTainted(page);
      $('#printRoot').innerHTML = page.outerHTML;
      $('#captureRoot').innerHTML = '';
      await waitImages($('#printRoot'));
      setTimeout(() => window.print(), 150);
    } catch (err) { console.error(err); toast('Printing could not start.', true); }
    finally { setBusy(false); }
  }
  window.addEventListener('afterprint', () => { if ($('#printRoot').innerHTML) { $('#printRoot').innerHTML = ''; modal('Thank you!', 'Hope your cover page prints well. Share this tool with your friends.', 3200); } });

  /* ---------- profiles, copies, drafts ---------- */
  let profiles = store.get(KEY.profiles, []);
  let copies = store.get(KEY.copies, []);
  const listItem = (id, name, sub, a, b) => `<div class="profile-item"><div class="name">${R.esc(name)}<small>${R.esc(sub)}</small></div><button type="button" class="btn small" data-${a}="${id}">${b[0]}</button><button type="button" class="btn small danger" data-${b[1]}="${id}">Delete</button></div>`;
  function renderLists() {
    $('#profileList').innerHTML = profiles.map((p) => listItem(p.id, p.name, [p.data.studentName, p.data.roll && 'Roll ' + p.data.roll].filter(Boolean).join(' · '), 'useprofile', ['Use', 'delprofile'])).join('');
    $('#duplicateList').innerHTML = copies.map((c) => listItem(c.id, c.name, new Date(c.id).toLocaleString(), 'loadcopy', ['Open', 'delcopy'])).join('');
  }
  function saveProfile() {
    const input = $('#profileName'); const name = input.value.trim();
    if (!name) { input.focus(); toast('Give the profile a name first.', true); return; }
    const data = {}; C.PROFILE_KEYS.forEach((k) => { data[k] = state[k]; });
    const existing = profiles.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (existing) existing.data = data; else profiles.push({ id: Date.now(), name, data });
    store.set(KEY.profiles, profiles); input.value = ''; renderLists(); toast('Profile saved.');
  }
  function duplicateDesign() {
    const name = (state.title || R.docLabel(state)).slice(0, 50);
    copies.unshift({ id: Date.now(), name, state: clone(state) }); copies = copies.slice(0, 12);
    if (!store.set(KEY.copies, copies)) { copies.shift(); toast('Browser storage is full. Clear saved data and try again.', true); return; }
    renderLists(); toast('A copy of this design was saved under Drafts.');
  }
  function replaceState(next) { state = mergeState(freshState(), next); pendingLogo = { nu: '', college: '' }; lastHTML = ''; memRev++; syncForm(); commit(); }

  /* ---------- sections ---------- */
  function updateRail() {
    const st = $('#viewStudio');
    $$('#rail button').forEach((b) => b.setAttribute('aria-selected', String(st.dataset.mview === 'preview' ? b.dataset.sec === 'preview' : b.dataset.sec === st.dataset.sec)));
  }
  function setSec(sec) {
    const st = $('#viewStudio');
    if (sec === 'preview') st.dataset.mview = 'preview';
    else { st.dataset.sec = sec; st.dataset.mview = 'edit'; }
    updateRail();
    if (sec === 'preview') requestAnimationFrame(layoutSheet);
    $('#panel').scrollTop = 0;
  }

  /* ---------- home page ---------- */
  const FEATURES = [
    ['layout', '9 distinct templates', 'Classic, Official Seal, Formal, Minimal, Bold Banner, Practical Notebook, Science, Group Project and Editorial.'],
    ['edit', 'Smart fields', 'Fields change with the document type, including Excursion Report and Group Project. Empty fields disappear.'],
    ['type', 'Fonts and Bangla support', '13 fonts with separate heading and body choices, including Hind Siliguri, Noto and Tiro Bangla.'],
    ['palette', 'Colors, borders, watermark', '11 color themes, five border styles, optional watermark and signature lines.'],
    ['download', 'PDF, JPG and Print', 'Sharp A4 export in PDF or JPG, or print straight from your browser. Letter and custom sizes too.'],
    ['save', 'Remembers your details', 'Your last draft is saved in the browser. Save profiles with your name, roll and session.'],
    ['image', 'Logos you can replace', 'Official logos are built in. Upload your own and preview it before using it.'],
    ['shield', 'Private by design', 'No account, no database. Your information never leaves your device.']
  ];

  function fitMini(box) {
    const page = box.querySelector('.page'); if (!page) return;
    const w = parseFloat(page.style.width) * MM;
    page.style.transform = `scale(${box.clientWidth / w})`;
  }
  function mountMini(box, tpl) {
    const s = clone(state); s.template = tpl;
    box.innerHTML = R.pageHTML(s);
    const page = box.firstElementChild;
    page.style.transformOrigin = 'top left';
    R.fitPage(page);
    fitMini(box);
  }
  function renderHome() {
    mountMini($('#heroMini'), state.template);
    const g = $('#gallery');
    if (!g.dataset.built) {
      g.innerHTML = C.TEMPLATES.map((t) => `<button type="button" class="g-item" data-gopen="${t.id}"><span class="shot" data-mini="${t.id}"></span><span><b>${R.esc(t.name)}</b><small>${R.esc(t.note)}</small></span></button>`).join('');
      g.dataset.built = '1';
    }
    $$('[data-mini]', g).forEach((b) => mountMini(b, b.dataset.mini));
    const fg = $('#featGrid');
    if (!fg.dataset.built) { fg.innerHTML = FEATURES.map((f) => `<div class="feat"><div class="ic">${svg(f[0])}</div><h3>${R.esc(f[1])}</h3><p>${R.esc(f[2])}</p></div>`).join(''); fg.dataset.built = '1'; }
  }

  /* ---------- routing ---------- */
  let current = '';
  function route() {
    const h = (location.hash || '').replace('#', '');
    const view = h.startsWith('studio') ? 'studio' : 'home';
    const changed = view !== current;
    current = view;
    document.body.dataset.view = view;
    $('#viewHome').hidden = view !== 'home';
    $('#viewStudio').hidden = view !== 'studio';
    if (view === 'studio') {
      if (changed) { window.scrollTo(0, 0); updateRail(); requestAnimationFrame(() => { lastHTML = ''; render(); }); }
      document.title = 'Studio · Academic Cover Page Designer';
    } else {
      document.title = 'Academic Cover Page Designer';
      if (changed) { renderHome(); }
      const target = h && document.getElementById(h);
      if (target) requestAnimationFrame(() => target.scrollIntoView()); else if (changed) window.scrollTo(0, 0);
    }
  }

  /* ---------- wiring ---------- */
  function wire() {
    const panel = $('#panel');
    panel.addEventListener('input', onInput);
    panel.addEventListener('change', onInput);

    $('#rail').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setSec(b.dataset.sec); });

    panel.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const ds = b.dataset;
      if (ds.tpl) { state.template = ds.tpl; syncForm(); commit(); }
      else if (ds.preset) {
        const p = C.COLOR_PRESETS.find((x) => x.id === ds.preset);
        if (p.p) { state.design.primary = p.p; state.design.secondary = p.s; }
        state.design.preset = p.id; syncForm(); commit();
        if (p.id === 'custom') $('#d_primary').focus();
      }
      else if (ds.quick !== undefined) {
        const q = QUICK[+ds.quick];
        state.docType = q.docType; state.template = q.template; state.title = '';
        if (!C.PRACTICAL.includes(q.docType)) { state.expNo = ''; state.expTitle = ''; state.expDate = ''; }
        if (!C.OUTING.includes(q.docType)) { state.place = ''; state.fieldDate = ''; }
        syncForm(); commit(); setSec('details');
        const t = $('#f_title'); t.closest('details').open = true; t.focus();
        toast(q.label + ' ready. Enter the title.');
      }
      else if (b.id === 'memAdd') { if (state.members.length < 12) { state.members.push({ name: '', roll: '', section: '', role: 'Member' }); memRev++; renderMembers(); commit(); } }
      else if (ds.memdel !== undefined) { state.members.splice(+ds.memdel, 1); memRev++; renderMembers(); commit(); }
      else if (ds.useprofile) { const p = profiles.find((x) => x.id === +ds.useprofile); if (p) { Object.assign(state, p.data); syncForm(); commit(); toast('Profile applied.'); } }
      else if (ds.delprofile) { profiles = profiles.filter((x) => x.id !== +ds.delprofile); store.set(KEY.profiles, profiles); renderLists(); }
      else if (ds.loadcopy) { const c = copies.find((x) => x.id === +ds.loadcopy); if (c) { replaceState(c.state); toast('Design opened.'); } }
      else if (ds.delcopy) { copies = copies.filter((x) => x.id !== +ds.delcopy); store.set(KEY.copies, copies); renderLists(); }
      else if (ds.use) { state.logos[ds.use] = pendingLogo[ds.use]; pendingLogo[ds.use] = ''; $('#up_' + ds.use).value = ''; lastHTML = ''; syncForm(); commit(); toast('Logo replaced.'); }
      else if (ds.cancel) { pendingLogo[ds.cancel] = ''; $('#up_' + ds.cancel).value = ''; $('#upErr_' + ds.cancel).textContent = ''; syncForm(); }
      else if (ds.defaultlogo) { state.logos[ds.defaultlogo] = ''; lastHTML = ''; syncForm(); commit(); toast('Official logo restored.'); }
      else if (b.id === 'btnSaveProfile') saveProfile();
      else if (b.id === 'btnDuplicate') duplicateDesign();
      else if (b.id === 'btnClearSaved') armed(b, 'Click again to clear', () => { Object.values(KEY).forEach(store.del); profiles = []; copies = []; renderLists(); replaceState(freshState()); toast('Saved data cleared.'); });
      else if (b.id === 'btnSaveDesign') {
        saveBlob(new Blob([JSON.stringify({ app: 'academic-cover-page-designer', version: 2, state }, null, 2)], { type: 'application/json' }), fileBase() + '.design.json');
      }
    });

    panel.addEventListener('change', async (e) => {
      const k = e.target.dataset.up;
      if (k) {
        const err = $('#upErr_' + k); err.textContent = '';
        const f = e.target.files && e.target.files[0]; if (!f) return;
        try { pendingLogo[k] = await readLogo(f); syncForm(); }
        catch (ex) { err.textContent = ex.message; e.target.value = ''; pendingLogo[k] = ''; syncForm(); }
      }
      if (e.target.id === 'designFile') {
        const f = e.target.files[0]; if (!f) return;
        const fr = new FileReader();
        fr.onload = () => { try { const j = JSON.parse(fr.result); if (!j.state || !j.state.template) throw new Error('x'); replaceState(j.state); toast('Design loaded.'); } catch (x) { toast('That is not a design file from this app.', true); } };
        fr.readAsText(f); e.target.value = '';
      }
    });
    $('#profileName').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); saveProfile(); } });

    $('#btnReset').addEventListener('click', (e) => armed(e.currentTarget, 'Confirm reset', () => { replaceState(freshState()); toast('Everything is back to the example.'); }));
    $('#btnPdf').addEventListener('click', () => exportAs('pdf'));
    $('#btnJpg').addEventListener('click', () => exportAs('jpg'));
    $('#btnPrint').addEventListener('click', doPrint);
    $('#zoomIn').addEventListener('click', () => { zoom = Math.min(2, +(zoom + 0.1).toFixed(2)); layoutSheet(); });
    $('#zoomOut').addEventListener('click', () => { zoom = Math.max(0.4, +(zoom - 0.1).toFixed(2)); layoutSheet(); });
    $('#zoomFit').addEventListener('click', () => { zoom = 1; layoutSheet(); });

    document.addEventListener('click', (e) => {
      const s = e.target.closest('.js-share'); if (s) { shareSite(); return; }
      const g = e.target.closest('[data-gopen]');
      if (g) { state.template = g.dataset.gopen; syncForm(); commit(); setSec('templates'); location.hash = '#studio'; }
    });
    $('#modal').addEventListener('click', hideModal);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideModal(); });

    window.addEventListener('hashchange', route);
    const resize = () => { layoutSheet(); $$('.mini, .shot').forEach(fitMini); };
    if ('ResizeObserver' in window) new ResizeObserver(layoutSheet).observe($('#canvas'));
    window.addEventListener('resize', resize);
    if (document.fonts) document.fonts.ready.then(() => { lastHTML = ''; commit(); if (current === 'home') renderHome(); });
  }

  /* ---------- start ---------- */
  buildPanel(); brandLogos(); wire(); syncForm(); renderLists(); route();
  setSec(state.template ? 'templates' : 'details');
  if (C.counter) C.counter.start();
})();
