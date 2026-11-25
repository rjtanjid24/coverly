/* Cover page templates. Each template turns the state into an HTML string. */
(function () {
  'use strict';
  const C = window.CPD;

  /* ---------- helpers ---------- */
  const esc = (v) => String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const has = (v) => v != null && String(v).trim() !== '';
  const line = (cls, v) => has(v) ? `<div class="${cls}">${esc(v)}</div>` : '';
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  /* "Show blank lines" mode: key labels stay on the page with a line to write on. */
  let BLANK = false;
  const BLANKABLE = new Set(['Name', 'Roll', 'Roll No.', 'Reg. No.', 'Registration No.', 'Designation']);

  function fmtDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return has(iso) ? String(iso) : '';
    return `${parseInt(m[3], 10)} ${MONTHS[parseInt(m[2], 10) - 1]} ${m[1]}`;
  }

  function docLabel(s, practicalName) {
    if (s.docType === 'Other') return has(s.customDocType) ? s.customDocType.trim() : 'Document';
    if (practicalName && s.docType === 'Lab Report') return 'Laboratory Report';
    return s.docType;
  }

  function affiliation(s) {
    const a = (s.affiliation || '').trim();
    if (!a) return '';
    return /^affiliated/i.test(a) ? a : 'Affiliated to ' + a;
  }

  const isDefaultCollege = (s) => (s.collegeName || '').trim() === C.INSTITUTION.name;
  const courseLine = (s) => has(s.courseName) ? s.courseName.trim() + (has(s.courseCode) ? ` (${s.courseCode.trim()})` : '') : (has(s.courseCode) ? s.courseCode.trim() : '');
  const subjectLine = (s) => has(s.subject) ? s.subject.trim() + (has(s.subjectCode) ? ` (${s.subjectCode.trim()})` : '') : (has(s.subjectCode) ? s.subjectCode.trim() : '');
  const dateOf = (s) => fmtDate(C.OUTING.includes(s.docType) ? s.fieldDate : s.expDate);
  const outing = (s) => C.OUTING.includes(s.docType);
  const isPractical = (s) => C.PRACTICAL.includes(s.docType);
  const expLine = (s) => isPractical(s) && has(s.expTitle) ? `<div class="exp">${has(s.expNo) ? 'Experiment ' + esc(s.expNo) + ': ' : ''}${esc(s.expTitle)}</div>` : '';
  const placeLine = (s) => outing(s) && has(s.place) ? 'Place: ' + s.place.trim() : '';
  const teacherLines = (s) => [s.designation, s.teacherDept, s.teacherInst];

  const pairs = (list) => list.filter((p) => has(p[1]) || (BLANK && BLANKABLE.has(p[0])));
  const kv = (list, cls) => {
    const rows = pairs(list);
    if (!rows.length) return '';
    return `<dl class="kv ${cls || ''}">` + rows.map((r) => `<div><dt>${esc(r[0])}</dt><dd${has(r[1]) ? '' : ' class="blank"'}>${has(r[1]) ? esc(r[1]) : '&nbsp;'}</dd></div>`).join('') + '</dl>';
  };
  const table = (list, cls) => {
    const rows = pairs(list);
    return rows.length ? `<table class="${cls || ''}">${rows.map((x) => `<tr><th>${esc(x[0])}</th><td${has(x[1]) ? '' : ' class="blank"'}>${has(x[1]) ? esc(x[1]) : '&nbsp;'}</td></tr>`).join('')}</table>` : '';
  };

  const BL = '______________________';
  function personBlock(title, name, lines) {
    const ls = lines.filter(has);
    const nm = has(name) ? name : (BLANK ? BL : '');
    if (!nm && !ls.length) return '';
    return `<div class="person"><h4>${esc(title)}</h4>${line('pname', nm)}${ls.map((l) => `<div class="pline">${esc(l)}</div>`).join('')}</div>`;
  }
  function studentBlock(s) {
    const yr = [s.year, has(s.semester) ? s.semester + ' Semester' : ''].filter(has).join(', ');
    return personBlock('Submitted By', s.studentName, [
      has(s.roll) ? 'Roll No: ' + s.roll : (BLANK ? 'Roll No: ' + BL.slice(0, 14) : ''),
      has(s.reg) ? 'Registration No: ' + s.reg : (BLANK ? 'Registration No: ' + BL.slice(0, 10) : ''),
      [s.program, yr].filter(has).join(', '),
      s.dept,
      has(s.studentSession) ? 'Session: ' + s.studentSession : '',
      has(s.group) ? 'Group: ' + s.group : ''
    ]);
  }
  const teacherBlock = (s) => personBlock('Submitted To', s.submittedTo, teacherLines(s));
  const teacherRows = (s) => [['Name', s.submittedTo], ['Designation', s.designation], ['Department', s.teacherDept], ['Institution', s.teacherInst]];
  const studentRows = (s) => [['Name', s.studentName], ['Roll', s.roll], ['Reg. No.', s.reg], ['Program', s.program], ['Year', s.year], ['Semester', s.semester], ['Session', s.studentSession], ['Group', s.group]];

  const subsHTML = (s) => {
    const l = [subjectLine(s) && `Subject: ${subjectLine(s)}`, courseLine(s) && `Course: ${courseLine(s)}`, placeLine(s), outing(s) && s.fieldDate ? 'Date of Visit: ' + fmtDate(s.fieldDate) : ''].filter(Boolean);
    return `<div class="subs">${l.map((x) => `<div>${esc(x)}</div>`).join('')}</div>`;
  };
  const footHTML = (s) => {
    const f = [has(s.session) && `Academic Session: ${s.session}`, has(s.submissionDate) && `Date of Submission: ${fmtDate(s.submissionDate)}`].filter(Boolean);
    return `<div class="foot">${f.map((x) => `<span>${esc(x)}</span>`).join('')}</div>`;
  };

  /* ---------- logos ---------- */
  function sourceChain(key, s) {
    if (has(s.logos && s.logos[key])) return [];
    const chain = [];
    C.INSTITUTION.logos[key].forEach((u) => {
      if (/^https?:/i.test(u)) { chain.push({ u, c: 1 }); chain.push({ u, c: 0 }); } else chain.push({ u, c: 0 });
    });
    return chain;
  }
  function logoTag(key, s, cls) {
    const custom = has(s.logos && s.logos[key]);
    const r = !custom && C.resolved && C.resolved[key];
    const chain = custom ? [] : (r ? [] : sourceChain(key, s));
    const first = custom ? s.logos[key] : (r ? r.u : chain[0].u);
    const cors = r && r.c ? ' crossorigin="anonymous"' : '';
    const alt = key === 'nu' ? 'National University logo' : 'College logo';
    return `<img class="logo logo-${key} ${cls || ''}" data-logo="${key}" data-i="0" data-chain="${esc(JSON.stringify(chain))}"${cors} alt="${alt}" src="${esc(first)}">`;
  }
  const logoList = (s, cls) => [s.design.showNU ? logoTag('nu', s, cls) : '', s.design.showCollege ? logoTag('college', s, cls) : ''].filter(Boolean);
  const logoRow = (s, cls) => { const l = logoList(s, cls); return l.length ? `<div class="logos place-${s.design.logoPlacement}">${l.join('')}</div>` : ''; };

  /* ---------- templates ---------- */
  const T = {};

  T.classic = (s) => `
      <div class="top">${logoRow(s)}
        ${line('college', s.collegeName)}
        ${line('affil', affiliation(s))}
        ${isDefaultCollege(s) ? line('loc', C.INSTITUTION.location) : ''}
      </div>
      <div class="orn"><span></span><b></b><span></span></div>
      ${line('dept', s.dept)}
      <div class="grow soft"></div>
      <div class="doctype">${esc(docLabel(s))}</div>
      ${has(s.title) ? `<h1 class="title fit">${esc(s.title)}</h1>` : ''}
      ${expLine(s)}
      ${subsHTML(s)}
      <div class="grow"></div>
      <div class="cols">${teacherBlock(s)}${studentBlock(s)}</div>
      ${has(s.extra) ? `<div class="extra">${esc(s.extra)}</div>` : ''}
      ${footHTML(s)}`;

  T.minimal = (s) => {
    const by = kv(studentRows(s));
    const to = kv(teacherRows(s));
    const about = kv([['Subject', subjectLine(s)], ['Course', courseLine(s)], ['Department', s.dept], ['Place', outing(s) ? s.place : ''], ['Visit date', outing(s) ? fmtDate(s.fieldDate) : ''], ['Session', s.session], ['Submitted', fmtDate(s.submissionDate)]]);
    return `
      <div class="top">${logoRow(s, 'small')}<div class="mn-inst">${esc(s.collegeName)}${has(s.affiliation) ? `<small>${esc(affiliation(s))}</small>` : ''}</div></div>
      <div class="grow"></div>
      <div class="doctype">${esc(docLabel(s))}</div>
      <hr class="rule thick">
      ${has(s.title) ? `<h1 class="title fit">${esc(s.title)}</h1>` : ''}
      ${expLine(s)}
      <hr class="rule">
      <div class="grid">
        ${by ? `<section><h4>Submitted by</h4>${by}</section>` : ''}
        ${to ? `<section><h4>Submitted to</h4>${to}</section>` : ''}
        ${about ? `<section><h4>Details</h4>${about}</section>` : ''}
      </div>
      ${has(s.extra) ? `<div class="extra">${esc(s.extra)}</div>` : ''}`;
  };

  T.formal = (s) => {
    const nu = s.design.showNU ? logoTag('nu', s) : '';
    const co = s.design.showCollege ? logoTag('college', s) : '';
    return `
      <div class="head">
        <div class="side">${nu}</div>
        <div class="mid">${line('college', s.collegeName)}${line('affil', affiliation(s))}${isDefaultCollege(s) ? line('loc', C.INSTITUTION.location) : ''}</div>
        <div class="side">${co}</div>
      </div>
      <div class="dbl"></div>
      ${line('dept', s.dept)}
      <div class="doctype-box"><span>${esc(docLabel(s))}</span></div>
      ${has(s.title) ? `<h1 class="title fit">${esc(s.title)}</h1>` : ''}
      ${expLine(s)}
      ${subsHTML(s)}
      <div class="grow"></div>
      <div class="stack">${teacherBlock(s)}${studentBlock(s)}</div>
      ${has(s.extra) ? `<div class="extra">${esc(s.extra)}</div>` : ''}
      <div class="dbl thin"></div>
      ${footHTML(s)}`;
  };

  T.practical = (s) => {
    const rows = table([
      ['Course Title', s.courseName], ['Course Code', s.courseCode], ['Subject', subjectLine(s)],
      ['Experiment No.', isPractical(s) ? s.expNo : ''], ['Experiment Name', isPractical(s) ? (s.expTitle || s.title) : ''],
      ['Place', outing(s) ? s.place : ''],
      [outing(s) ? 'Date of Visit' : 'Date of Experiment', dateOf(s)], ['Date of Submission', fmtDate(s.submissionDate)], ['Academic Session', s.session]
    ], 'main');
    const stu = table(studentRows(s));
    const tea = table(teacherRows(s));
    return `
      <div class="band">${logoRow(s, 'small')}<div class="bt">${esc(s.collegeName)}${has(s.affiliation) ? `<small>${esc(affiliation(s))}</small>` : ''}</div></div>
      ${line('dept', s.dept)}
      <div class="doctype">${esc(docLabel(s, true))}</div>
      ${has(s.title) && (!isPractical(s) || s.title !== s.expTitle) ? `<h1 class="title fit">${esc(s.title)}</h1>` : ''}
      ${rows}
      <div class="grow"></div>
      <div class="two">
        ${stu ? `<section><h4>Student Details</h4>${stu}</section>` : ''}
        ${tea ? `<section><h4>Teacher Details</h4>${tea}</section>` : ''}
      </div>
      ${has(s.extra) ? `<div class="extra">${esc(s.extra)}</div>` : ''}`;
  };

  const MOLECULE = `<svg class="mol" viewBox="0 0 200 200" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><polygon points="100,20 169,60 169,140 100,180 31,140 31,60"/><polygon points="100,52 142,76 142,124 100,148 58,124 58,76" stroke-dasharray="4 5"/><circle cx="100" cy="20" r="6" fill="currentColor"/><circle cx="169" cy="60" r="6" fill="currentColor"/><circle cx="169" cy="140" r="6" fill="currentColor"/><circle cx="100" cy="180" r="6" fill="currentColor"/><circle cx="31" cy="140" r="6" fill="currentColor"/><circle cx="31" cy="60" r="6" fill="currentColor"/><line x1="169" y1="60" x2="196" y2="44"/><line x1="31" y1="140" x2="6" y2="156"/></svg>`;

  T.science = (s) => {
    const blk = (h, body) => body ? `<section class="blk"><h4>${esc(h)}</h4>${body}</section>` : '';
    const course = kv([['Subject', subjectLine(s)], ['Course', courseLine(s)], ['Experiment No.', isPractical(s) ? s.expNo : ''], ['Place', outing(s) ? s.place : ''], ['Date', dateOf(s)]]);
    const stu = kv(studentRows(s));
    const tea = kv(teacherRows(s));
    const sub = kv([['Session', s.session], ['Submitted', fmtDate(s.submissionDate)], ['Department', s.dept]]);
    const main = isPractical(s) && has(s.expTitle) ? s.expTitle : s.title;
    return `
      ${MOLECULE}
      <div class="top">${logoRow(s, 'small')}<div class="inst">${esc(s.collegeName)}${has(s.affiliation) ? `<small>${esc(affiliation(s))}</small>` : ''}</div></div>
      <div class="doctype">${esc(docLabel(s))}</div>
      ${has(main) ? `<h1 class="title fit">${esc(main)}</h1>` : ''}
      ${has(s.title) && main !== s.title ? `<div class="exp">${esc(s.title)}</div>` : ''}
      <div class="grow"></div>
      <div class="blocks">${blk('Course', course)}${blk('Student', stu)}${blk('Submitted to', tea)}${blk('Submission', sub)}</div>
      ${has(s.extra) ? `<div class="extra">${esc(s.extra)}</div>` : ''}`;
  };

  T.editorial = (s) => {
    const nu = s.design.showNU ? logoTag('nu', s, 'small') : '';
    const co = s.design.showCollege ? logoTag('college', s, 'small') : '';
    const left = kv(studentRows(s).map((r, i) => i === 0 ? ['Submitted by', r[1]] : r));
    const right = kv([['Submitted to', s.submittedTo], ['Designation', s.designation], ['Department', s.teacherDept], ['Institution', s.teacherInst], ['Course', courseLine(s)], ['Subject', subjectLine(s)], ['Place', outing(s) ? s.place : ''], ['Date', fmtDate(outing(s) ? (s.fieldDate || s.submissionDate) : s.submissionDate)]]);
    return `
      <div class="spine"><span>${esc(docLabel(s))}</span></div>
      <div class="main">
        <div class="top"><div class="inst">${esc(s.collegeName)}${has(s.dept) ? `<small>${esc(s.dept)}</small>` : ''}</div><div class="logos">${nu}${co}</div></div>
        <div class="grow"></div>
        <div class="kicker">${esc(docLabel(s))}${has(s.session) ? ' · ' + esc(s.session) : ''}</div>
        ${has(s.title) ? `<h1 class="title fit">${esc(s.title)}</h1>` : ''}
        ${expLine(s)}
        <div class="bar"></div>
        <div class="grow2"></div>
        <div class="cols">${left}${right}</div>
        ${has(s.extra) ? `<div class="extra">${esc(s.extra)}</div>` : ''}
        ${has(s.affiliation) ? `<div class="aff">${esc(affiliation(s))}</div>` : ''}
      </div>`;
  };

  /* Official Seal: round seal with curved college name, green and gold feel. */
  function sealSVG(s) {
    const words = String(s.collegeName || '').toUpperCase().trim().split(/\s+/).filter(Boolean);
    const half = Math.ceil(words.length / 2);
    let top = words.slice(0, half).join(' '), bot = words.slice(half).join(' ');
    if (!bot && isDefaultCollege(s)) bot = 'GAZIPUR';
    const size = (t, arc) => Math.max(5.5, Math.min(12, (arc * 0.92) / Math.max(1, t.length * 0.8)));
    const ts = size(top, 205), bs = size(bot, 245);
    return `<svg viewBox="0 0 200 200" class="ring" aria-hidden="true">
      <circle cx="100" cy="100" r="97" fill="none" stroke="var(--p)" stroke-width="3"/>
      <circle cx="100" cy="100" r="91" fill="none" stroke="var(--s)" stroke-width="1.2"/>
      <circle cx="100" cy="100" r="58" fill="#fff" stroke="var(--s)" stroke-width="1.2"/>
      <circle cx="100" cy="100" r="54" fill="none" stroke="var(--p)" stroke-width="1"/>
      <path id="arcT" d="M 24,100 A 76,76 0 0 1 176,100" fill="none"/>
      <path id="arcB" d="M 17,100 A 83,83 0 0 0 183,100" fill="none"/>
      <text font-family="var(--hfont)" font-weight="700" font-size="${ts}" letter-spacing="1.4" fill="var(--p)"><textPath href="#arcT" startOffset="50%" text-anchor="middle">${esc(top)}</textPath></text>
      <text font-family="var(--hfont)" font-weight="700" font-size="${bs}" letter-spacing="1.4" fill="var(--p)" dominant-baseline="hanging"><textPath href="#arcB" startOffset="50%" text-anchor="middle">${esc(bot)}</textPath></text>
      <circle cx="12" cy="100" r="2.6" fill="var(--s)"/><circle cx="188" cy="100" r="2.6" fill="var(--s)"/>
    </svg>`;
  }
  T.seal = (s) => {
    const main = s.design.showCollege ? logoTag('college', s) : (s.design.showNU ? logoTag('nu', s) : '');
    const nu = s.design.showCollege && s.design.showNU ? logoTag('nu', s, 'tiny') : '';
    return `
      <div class="top">
        <div class="sealwrap">${sealSVG(s)}<div class="sealmid">${main}</div></div>
        <div class="affil">${nu}<span>${esc(affiliation(s))}</span></div>
        ${isDefaultCollege(s) ? line('loc', C.INSTITUTION.location) : ''}
      </div>
      <div class="orn"><span></span><b></b><span></span></div>
      ${line('dept', s.dept)}
      <div class="grow soft"></div>
      <div class="doctype">${esc(docLabel(s))}</div>
      ${has(s.title) ? `<h1 class="title fit">${esc(s.title)}</h1>` : ''}
      ${expLine(s)}
      ${subsHTML(s)}
      <div class="grow"></div>
      <div class="cols">${teacherBlock(s)}${studentBlock(s)}</div>
      ${has(s.extra) ? `<div class="extra">${esc(s.extra)}</div>` : ''}
      ${footHTML(s)}`;
  };

  /* Bold Banner: solid color header with the title, details in cards. */
  T.banner = (s) => {
    const card = (h, body) => body ? `<section class="card"><h4>${esc(h)}</h4>${body}</section>` : '';
    const course = kv([['Subject', subjectLine(s)], ['Course', courseLine(s)], ['Place', outing(s) ? s.place : ''], ['Date', dateOf(s)], ['Session', s.session], ['Submitted', fmtDate(s.submissionDate)]]);
    return `
      <div class="hd">
        <div class="hrow">${logoRow(s, 'small')}<div class="hname">${esc(s.collegeName)}${has(s.affiliation) ? `<small>${esc(affiliation(s))}</small>` : ''}</div></div>
        <div class="pill">${esc(docLabel(s))}</div>
        ${has(s.title) ? `<h1 class="title fit">${esc(s.title)}</h1>` : ''}
        ${expLine(s)}
      </div>
      <div class="bd">
        <div class="cards">
          ${card('Submitted by', kv(studentRows(s).slice(0, 1).concat([['Roll', s.roll], ['Reg. No.', s.reg], ['Department', s.dept]], studentRows(s).slice(3))))}
          ${card('Submitted to', kv(teacherRows(s)))}
          ${card('Course details', course)}
        </div>
        <div class="grow"></div>
        ${has(s.extra) ? `<div class="extra">${esc(s.extra)}</div>` : ''}
      </div>`;
  };

  /* Group Project: member table and supervisor. */
  T.group = (s) => {
    const members = (s.members || []).filter((m) => has(m.name) || has(m.roll));
    const cols = [['Name', 'name'], ['ID / Roll', 'roll'], ['Section', 'section'], ['Role', 'role']].filter((c, i) => i === 0 || members.some((m) => has(m[c[1]])));
    const tbl = members.length ? `<table class="members"><thead><tr><th class="n">#</th>${cols.map((c) => `<th>${c[0]}</th>`).join('')}</tr></thead><tbody>${members.map((m, i) => `<tr><td class="n">${i + 1}</td>${cols.map((c) => `<td>${esc(m[c[1]] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table>` : '';
    const info = kv([['Department', s.dept], ['Subject', subjectLine(s)], ['Session', s.session], ['Submitted', fmtDate(s.submissionDate)]]);
    const sup = kv([['Supervisor', s.submittedTo], ['Designation', s.designation], ['Department', s.teacherDept], ['Institution', s.teacherInst]]);
    return `
      <div class="top">${logoRow(s, 'small')}${line('college', s.collegeName)}${line('affil', affiliation(s))}</div>
      <div class="orn"><span></span><b></b><span></span></div>
      <div class="doctype">${esc(docLabel(s))}</div>
      ${has(s.title) ? `<h1 class="title fit">${esc(s.title)}</h1>` : ''}
      ${has(courseLine(s)) ? `<div class="exp">${esc(courseLine(s))}</div>` : ''}
      <div class="grow soft"></div>
      ${tbl ? `<h4 class="sec">Group members${has(s.group) ? ' · ' + esc(s.group) : ''}</h4>${tbl}` : ''}
      <div class="grow"></div>
      <div class="two">
        ${sup ? `<section><h4>Submitted to</h4>${sup}</section>` : ''}
        ${info ? `<section><h4>Details</h4>${info}</section>` : ''}
      </div>
      ${has(s.extra) ? `<div class="extra">${esc(s.extra)}</div>` : ''}`;
  };

  /* ---------- page assembly ---------- */
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  function pageDims(s) {
    const d = s.design;
    let w, h;
    if (d.pageSize === 'custom') { w = clamp(+d.customW || 210, 100, 500); h = clamp(+d.customH || 297, 100, 700); }
    else { w = C.PAGE_SIZES[d.pageSize].w; h = C.PAGE_SIZES[d.pageSize].h; }
    if (d.pageSize !== 'custom' && d.orientation === 'landscape') { const t = w; w = h; h = t; }
    return { w, h };
  }
  const fontCss = (id) => (C.FONTS.find((f) => f.id === id) || C.FONTS[0]).css;

  function pageHTML(s) {
    const d = s.design;
    BLANK = !!d.blankLines;
    const { w, h } = pageDims(s);
    const font = fontCss(d.font);
    const hfont = d.headFont && d.headFont !== 'same' ? fontCss(d.headFont) : font;
    const style = `--p:${d.primary};--s:${d.secondary};--font:${font};--hfont:${hfont};--fs:${d.fontSize / 100};--bw:${d.borderWidth};--logo:${d.logoSize}mm;--k:1;width:${w}mm;height:${h}mm`;
    const body = (T[s.template] || T.classic)(s);
    const wm = has(d.watermark) ? `<div class="wm"><span>${esc(d.watermark.trim())}</span></div>` : '';
    const sigs = d.signatures ? `<div class="sigs"><div><i></i><span>Student's Signature</span></div><div><i></i><span>Teacher's Signature</span></div></div>` : '';
    return `<div class="page t-${s.template}${d.signatures ? ' has-sigs' : ''}" style="${esc(style)}">${wm}<div class="frame frame-${d.border}"><i></i></div><div class="content">${body}</div>${sigs}</div>`;
  }

  /* Shrink text until everything fits inside the page. */
  function fitPage(page) {
    if (!page) return;
    const content = page.querySelector('.content');
    if (!content) return;
    const over = () => content.scrollHeight > content.clientHeight + 1 || content.scrollWidth > content.clientWidth + 1;
    let k = 1;
    page.style.setProperty('--k', k);
    let guard = 0;
    while (over() && k > 0.5 && guard++ < 30) { k = Math.round((k - 0.025) * 1000) / 1000; page.style.setProperty('--k', k); }
  }

  /* Built-in emblem used when a logo cannot be loaded. */
  function emblem(key) {
    const t = key === 'nu' ? 'NU' : 'BBAGC';
    const fs = key === 'nu' ? 34 : 19;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#fff" stroke="#14284b" stroke-width="4"/><circle cx="50" cy="50" r="38" fill="none" stroke="#b08d3c" stroke-width="1.5"/><text x="50" y="${key === 'nu' ? 60 : 57}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="${fs}" fill="#14284b">${t}</text>${key === 'nu' ? '' : '<text x="50" y="72" text-anchor="middle" font-family="Georgia,serif" font-size="8" fill="#b08d3c">GAZIPUR</text>'}</svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  C.render = { pageHTML, pageDims, fitPage, emblem, esc, fmtDate, docLabel };
})();
