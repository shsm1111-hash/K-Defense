(async () => {
  const D = await fetch('../data/k9.json').then((r) => r.json());
  const $ = (id) => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = String(x); return e; };
  const fmt = (n) => Number(n).toLocaleString('ko-KR');
  const NS = 'http://www.w3.org/2000/svg';
  const S = (t, a = {}) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const TIER = { 확정: 't-ok', 보도: 't-news', 추정: 't-est', 해설: 't-note' };
  const chip = (t) => el('span', 'chip ' + (TIER[t] || 't-news'), t);
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const ST = { '운용 중': 'var(--c1)', '납품 중': 'var(--c2)', '인도 전': 'var(--c3)', '시제': 'var(--muted-mark)' };
  const CAT = { 배경: 'var(--muted-mark)', 개발: 'var(--c1)', 양산: 'var(--c2)', 수출: 'var(--c3)', 실전: 'var(--c4)', 개량: 'var(--c5)' };
  const RS = { 진행: 'var(--ok)', 협상: 'var(--warn)', 계획: 'var(--c1)', 경쟁: 'var(--c3)', 협력: 'var(--c2)', 구상: 'var(--muted-mark)' };

  const photo = (key, cls) => {
    const p = D.photos[key];
    const fig = el('figure', 'photo' + (cls ? ' ' + cls : ''));
    if (!p) return null;
    const img = el('img'); img.src = p.src; img.alt = p.cap; img.loading = key === 'hero' ? 'eager' : 'lazy'; img.decoding = 'async';
    const cap = el('figcaption');
    cap.append(p.cap + ' · 사진 ');
    const a = el('a', null, p.by); a.href = p.page; a.target = '_blank'; a.rel = 'noopener';
    cap.append(a, ' · ' + p.lic);
    fig.append(img);
    return { fig, cap };
  };
  const td = (x, c) => el('td', c || null, x == null ? '' : x);
  const tierTd = (t) => { const c = el('td'); c.append(chip(t)); return c; };

  // 계산값
  const counted = D.operators.filter((o) => o.counted);
  const nCountries = counted.length;
  const nQty = counted.reduce((s, o) => s + Number(o.qty), 0);
  const spec = (k) => D.specs.find((s) => s.key === k);
  const q3 = D.finance.find((f) => f.quarter === '3Q26');
  const unit = new Map(D.contracts.map((c) => [c.id, c.unit_comparable && c.value_krw_eok != null ? Math.round(c.value_krw_eok / c.qty) : null]));

  // 머리
  const h = photo('hero');
  $('hero-photo').append(h.fig.firstChild);
  $('hero-photo').parentElement.append(h.cap);
  $('lede').textContent = `국방과학연구소와 한화에어로스페이스가 독자 개발한 자주포로, 세계 자주포 수출 시장의 ${spec('market_share').value}를 차지하는 K방산 대표 수출 무기체계입니다. 지금까지 ${nCountries}개국과 완성 자주포 ${fmt(nQty)}문을 계약했고, 다음 무대는 자동장전 개량형 K9A2와 미국 시장입니다.`;
  const kpis = [
    ['국군 배치', spec('domestic_qty').value, '', 'K9·K9A1 전 계열'],
    ['수출 계약국', nCountries, '개국', '미국 시제 계약 제외'],
    ['수출 계약 수량', fmt(nQty), '문', '완성 자주포, 면허생산 포함'],
    ['세계 자주포 수출 점유율', spec('market_share').value, '', 'SIPRI 집계 인용 보도'],
    ['지상방산 수주잔고', q3.backlog_jo, '조원', `한화에어로 3Q26 말 · 수출 비중 ${q3.backlog_export_pct}%`],
  ];
  $('kpis').replaceChildren(...kpis.map(([l, v, u, n]) => {
    const k = el('div', 'kpi'); const vv = el('div', 'kpi-v', v); if (u) vv.append(el('small', null, u));
    k.append(el('div', 'kpi-l', l), vv, el('div', 'kpi-n', n)); return k;
  }));
  $('updated').textContent = `자료 기준일 ${D.updated}`;

  // 개요
  $('reasons').replaceChildren(...D.notes.filter((n) => n.kind === '배경').sort((a, b) => a.order - b.order).map((n) => { const li = el('li'); li.append(el('strong', null, n.title), el('p', null, n.detail)); return li; }));
  $('study').replaceChildren(...D.notes.filter((n) => n.kind === '공부').sort((a, b) => a.order - b.order).map((n) => { const d = el('div'); d.append(el('strong', null, n.title), el('p', null, n.detail)); return d; }));
  $('specs').replaceChildren(...D.specs.map((s) => { const tr = el('tr'); tr.append(td(s.item), td(s.value, 'strong'), tierTd(s.tier)); return tr; }));

  // 버전
  $('versions').replaceChildren(...D.versions.map((v) => {
    const card = el('article', 'ver');
    const p = v.photo && photo(v.photo);
    if (p) card.append(p.fig);
    else { const n = el('div', 'nophoto'); n.append(el('b', null, v.v), el('span', null, '공개 라이선스 사진 없음')); card.append(n); }
    if (p) { const c = el('div', 'credit'); c.append(...p.cap.childNodes); card.append(c); }
    const b = el('div', 'ver-b');
    const hh = el('div', 'ver-h'); hh.append(el('b', null, v.v), chip(v.tier));
    const dl = el('dl');
    [['기간', v.period], ['단계', v.stage], ['승무원', v.crew], ['발사속도', v.rof], ['장전', v.loading], ['사격통제·장비', v.fcs], ['기동', v.mobility], ['중량', v.weight], ['운용', v.users]]
      .forEach(([k, x]) => dl.append(el('dt', null, k), el('dd', null, x)));
    b.append(hh, dl); card.append(b);
    return card;
  }));

  // 연혁
  let cat = '';
  const cats = ['', '배경', '개발', '양산', '수출', '실전', '개량'];
  $('tl-filters').replaceChildren(...cats.map((c) => {
    const b = el('button'); b.type = 'button'; b.dataset.c = c;
    if (c) { const i = el('i'); i.style.background = CAT[c]; b.append(i); }
    b.append(c || '전체');
    b.addEventListener('click', () => { cat = c; drawTimeline(); });
    return b;
  }));
  function drawTimeline() {
    $('tl-filters').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.c === cat)));
    $('timeline').replaceChildren(...D.timeline.filter((t) => !cat || t.category === cat).map((t) => {
      const li = el('li'); li.style.setProperty('--c', CAT[t.category]);
      const body = el('div'); const hh = el('div', 'h');
      hh.append(el('span', 'cat', t.category), el('strong', null, t.title), chip(t.tier));
      body.append(hh, el('p', null, t.detail));
      li.append(el('div', 'when', t.date), el('span', 'dot'), body); return li;
    }));
  }
  drawTimeline();

  // 툴팁
  const tip = (host) => {
    const t = el('div', 'tip hidden'); host.append(t);
    return {
      show(ev, lines) {
        t.replaceChildren(...lines.map((l) => el('div', null, l))); t.classList.remove('hidden');
        const r = host.getBoundingClientRect(); let x = ev.clientX - r.left + 12; let y = ev.clientY - r.top + 12;
        if (x + t.offsetWidth > r.width) x = Math.max(0, ev.clientX - r.left - t.offsetWidth - 12);
        if (y + t.offsetHeight > r.height) y = Math.max(0, ev.clientY - r.top - t.offsetHeight - 12);
        t.style.left = x + 'px'; t.style.top = y + 'px';
      },
      hide() { t.classList.add('hidden'); },
    };
  };
  const measure = (svg, texts, cls) => {
    let w = 0; texts.forEach((s) => { const t = S('text', { class: cls || '' }); t.textContent = s; svg.append(t); w = Math.max(w, t.getComputedTextLength()); t.remove(); });
    return w;
  };

  // 가로 막대
  function hbar(host, rows, o) {
    const W = host.clientWidth || 600; const step = 28; const H = rows.length * step + 8;
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, height: H }); host.replaceChildren(svg);
    const ml = measure(svg, rows.map(o.label)) + 12;
    const mr = measure(svg, rows.map(o.valText), 'vlab') + 10;
    const max = Math.max(...rows.map(o.value)) || 1;
    const x = (v) => ml + (Math.max(ml + 20, W - mr) - ml) * (v / max);
    const tp = tip(host);
    rows.forEach((r, i) => {
      const y = 4 + i * step; const bh = step * 0.64; const sel = o.isSel && o.isSel(r);
      const g = S('g', { class: o.onClick ? 'hit' : '' });
      g.append(S('rect', { x: 0, y, width: W, height: step, fill: 'transparent' }));
      const lab = S('text', { x: ml - 10, y: y + step / 2, 'dominant-baseline': 'middle', 'text-anchor': 'end', class: sel ? 'sel' : '' }); lab.textContent = o.label(r); g.append(lab);
      g.append(S('rect', { x: ml, y: y + (step - bh) / 2, width: Math.max(2, x(o.value(r)) - ml), height: bh, rx: 3, fill: o.color(r), opacity: o.isSel ? (sel ? 1 : 0.55) : 0.9 }));
      const vl = S('text', { x: x(o.value(r)) + 6, y: y + step / 2, 'dominant-baseline': 'middle', class: 'vlab' }); vl.textContent = o.valText(r); g.append(vl);
      g.addEventListener('mousemove', (e) => tp.show(e, o.tip(r)));
      g.addEventListener('mouseleave', () => tp.hide());
      if (o.onClick) g.addEventListener('click', () => o.onClick(r));
      svg.append(g);
    });
  }

  // 수출
  let sel = '폴란드';
  $('st-legend').replaceChildren(...Object.entries(ST).map(([k, c]) => { const s = el('span'); const i = el('i'); i.style.background = c; s.append(i, k); return s; }));
  const pick = (c) => { sel = c; drawOps(); drawDetail(); drawSwim(); };
  function drawOps() {
    const rows = [...D.operators].sort((a, b) => b.qty - a.qty);
    hbar($('opbars'), rows, {
      label: (r) => r.country, value: (r) => r.qty, valText: (r) => fmt(r.qty) + '문', color: (r) => ST[r.status],
      isSel: (r) => r.country === sel, onClick: (r) => pick(r.country),
      tip: (r) => [r.country + ' · ' + r.status, fmt(r.qty) + '문' + (r.qty_note ? ' (' + r.qty_note + ')' : ''), r.local_name],
    });
  }
  function drawDetail() {
    const r = D.operators.find((o) => o.country === sel);
    const box = $('detail'); const parts = [];
    const p = r.photo && photo(r.photo);
    if (p) { parts.push(p.fig); const c = el('div', 'credit'); c.append(...p.cap.childNodes); parts.push(c); }
    const hh = el('div', 'dt-h'); hh.append(el('h2', null, r.country), el('span', 'dt-local', r.local_name)); parts.push(hh);
    const chips = el('div', 'dt-chips'); const st = el('span', 'chip st', r.status); st.style.setProperty('--c', ST[r.status]);
    chips.append(st, el('span', 'chip plain', r.region)); if (r.nato) chips.append(el('span', 'chip plain', 'NATO')); parts.push(chips);
    const dl = el('dl', 'dt-facts');
    [['계약 수량', fmt(r.qty) + '문' + (r.qty_note ? ' · ' + r.qty_note : '')], ['첫 계약', r.first_year], ['생산 방식', r.mode]].forEach(([k, v]) => dl.append(el('dt', null, k), el('dd', null, v)));
    parts.push(dl);
    const sec = (title, text, t) => { const s = el('div', 'dt-sec'); const h3 = el('h3', null, title); if (t) h3.append(chip(t)); s.append(h3, el('p', null, text)); return s; };
    parts.push(sec('왜 K9이 필요했나', r.why, r.tier));
    if (r.diff) parts.push(sec('이 나라만의 조건 (현지화·기술이전·요구사항)', r.diff, '해설'));
    const hs = el('div', 'dt-sec'); hs.append(el('h3', null, '수출 사업 타임라인'));
    const ol = el('ol', 'mini');
    D.contracts.filter((c) => c.country === r.country).forEach((c) => {
      const li = el('li'); const b = el('div'); const st2 = el('strong', null, `${c.variant} · ${fmt(c.qty)}문 `); st2.append(chip(c.tier));
      b.append(st2, el('p', null, `${c.value_orig} — ${c.scope}`)); li.append(el('span', 'd', c.date), b); ol.append(li);
    });
    hs.append(ol); parts.push(hs);
    box.replaceChildren(...parts);
  }
  function drawSwim() {
    const host = $('swim'); const rows = D.contracts;
    const first = new Map(); rows.forEach((r) => first.set(r.country, Math.min(first.get(r.country) ?? 9999, r.year)));
    const countries = [...first.keys()].sort((a, b) => first.get(a) - first.get(b));
    const W = host.clientWidth || 700; const step = 30; const top = 8; const bottom = 28; const H = top + countries.length * step + bottom;
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, height: H }); host.replaceChildren(svg);
    const ml = measure(svg, countries) + 16; const x0 = 1999.5; const x1 = 2027;
    const x = (v) => ml + 8 + (W - 14 - ml - 8) * ((v - x0) / (x1 - x0));
    const y = (c) => top + countries.indexOf(c) * step + step / 2;
    const maxQ = Math.max(...rows.map((r) => r.qty)); const rr = (q) => 3 + (Math.min(13, step / 2 - 2) - 3) * Math.sqrt(q / maxQ);
    const ticks = (W < 520 ? [2000, 2010, 2020, 2026] : [2000, 2005, 2010, 2015, 2020, 2026]);
    ticks.forEach((t) => { svg.append(S('line', { x1: x(t), x2: x(t), y1: top, y2: H - bottom, class: 'grid' })); const tx = S('text', { x: x(t), y: H - 8, 'text-anchor': 'middle' }); tx.textContent = t; svg.append(tx); });
    countries.forEach((c) => {
      svg.append(S('line', { x1: ml, x2: W - 14, y1: y(c), y2: y(c), class: 'grid', opacity: 0.6 }));
      const t = S('text', { x: ml - 8, y: y(c), 'dominant-baseline': 'middle', 'text-anchor': 'end', class: 'hit' + (c === sel ? ' sel' : '') }); t.textContent = c;
      t.addEventListener('click', () => pick(c)); svg.append(t);
    });
    const tp = tip(host);
    [...rows].sort((a, b) => b.qty - a.qty).forEach((r) => {
      const ci = S('circle', { cx: x(r.year), cy: y(r.country), r: rr(r.qty), fill: css('--c1') || '#4b5d2a', 'fill-opacity': r.country === sel ? 0.8 : 0.3, stroke: css('--c1') || '#4b5d2a', 'stroke-width': 1.2, class: 'hit' });
      if (r.tier === '추정') ci.setAttribute('stroke-dasharray', '3 2');
      ci.addEventListener('mousemove', (e) => tp.show(e, [`${r.date} · ${r.country}`, `${r.variant} ${fmt(r.qty)}문`, r.value_orig]));
      ci.addEventListener('mouseleave', () => tp.hide());
      ci.addEventListener('click', () => pick(r.country));
      svg.append(ci);
    });
  }
  let sort = { k: 'id', dir: 1 }; let cq = '';
  function drawContracts() {
    let rows = D.contracts.filter((r) => !cq || [r.country, r.variant, r.scope, r.date].join(' ').toLowerCase().includes(cq));
    const val = (r) => (sort.k === 'unit' ? unit.get(r.id) : r[sort.k]);
    rows = [...rows].sort((a, b) => {
      const va = val(a); const vb = val(b);
      if (va == null && vb == null) return 0; if (va == null) return 1; if (vb == null) return -1;
      return (typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb), 'ko')) * sort.dir;
    });
    $('contracts').replaceChildren(...rows.map((r) => {
      const tr = el('tr'); const u = unit.get(r.id);
      const src = el('td', 'hide-sm'); const a = el('a', null, r.source_name);
      if (/^https:\/\//.test(r.source_url)) { a.href = r.source_url; a.target = '_blank'; a.rel = 'noopener'; }
      src.append(a);
      tr.append(td(r.date, 'nowrap'), td(r.country, 'strong nowrap'), td(r.variant, 'hide-sm'), td(fmt(r.qty), 'num'),
        td(r.value_krw_eok == null ? '' : fmt(r.value_krw_eok), 'num'), td(u == null ? '' : fmt(u), 'num'),
        td(r.value_orig, 'hide-sm'), td(r.scope, 'hide-md'), tierTd(r.tier), src);
      return tr;
    }));
  }
  $('cq').addEventListener('input', (e) => { cq = e.target.value.trim().toLowerCase(); drawContracts(); });
  document.querySelectorAll('[data-sort]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.sort; sort = { k, dir: sort.k === k ? -sort.dir : (k === 'id' || k === 'country' ? 1 : -1) };
    document.querySelectorAll('[data-sort]').forEach((x) => x.closest('th').setAttribute('aria-sort', x === b ? (sort.dir > 0 ? 'ascending' : 'descending') : 'none'));
    drawContracts();
  }));
  drawContracts();

  // 단가·원가
  function drawUnit() {
    const rows = D.contracts.filter((c) => unit.get(c.id) != null).map((c) => ({ label: `${c.country} ${c.date}`, v: unit.get(c.id), kind: '수출' }));
    const d = spec('domestic_unit'); rows.push({ label: '국군 조달(참고)', v: d.num, kind: '국내' });
    rows.sort((a, b) => b.v - a.v);
    hbar($('unit'), rows, {
      label: (r) => r.label, value: (r) => r.v, valText: (r) => fmt(r.v) + '억', color: (r) => (r.kind === '국내' ? 'var(--c2)' : 'var(--c1)'),
      tip: (r) => [r.label, `대당 ${fmt(r.v)}억원`, r.kind === '국내' ? '국군 조달 단가 추정치' : '계약액 ÷ 수량 (패키지 포함)'],
    });
  }
  function drawFin() {
    const host = $('fin'); const rows = D.finance; const W = host.clientWidth || 420; const H = 220;
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, height: H }); host.replaceChildren(svg);
    const ymax = 30; const ticks = [0, 10, 20, 30]; const ml = measure(svg, ticks.map((t) => t + '%')) + 10; const mt = 22; const mb = 26;
    const y = (v) => mt + (H - mb - mt) * (1 - v / ymax);
    const bandW = (W - 6 - ml) / rows.length; const bw = Math.min(32, bandW * 0.6);
    ticks.forEach((t) => { svg.append(S('line', { x1: ml, x2: W - 6, y1: y(t), y2: y(t), class: 'grid' })); const tx = S('text', { x: ml - 6, y: y(t), 'dominant-baseline': 'middle', 'text-anchor': 'end' }); tx.textContent = t + '%'; svg.append(tx); });
    const tp = tip(host);
    rows.forEach((r, i) => {
      const cx = ml + bandW * i + bandW / 2;
      const g = S('g');
      g.append(S('rect', { x: cx - bw / 2, y: y(r.opm_pct), width: bw, height: Math.max(1, y(0) - y(r.opm_pct)), rx: 3, fill: 'var(--c1)' }));
      const v = S('text', { x: cx, y: y(r.opm_pct) - 6, 'text-anchor': 'middle', class: 'vlab' }); v.textContent = r.opm_pct + '%'; g.append(v);
      const q = S('text', { x: cx, y: H - 8, 'text-anchor': 'middle' }); q.textContent = r.quarter; g.append(q);
      g.append(S('rect', { x: cx - bandW / 2, y: mt, width: bandW, height: H - mb - mt, fill: 'transparent' }));
      g.addEventListener('mousemove', (e) => tp.show(e, [`${r.quarter} 지상방산`, `영업이익률 ${r.opm_pct}%`,
        r.revenue_eok != null ? `매출 ${fmt(r.revenue_eok)}억 · 영업이익 ${fmt(r.op_eok)}억` : '매출·영업이익 개별 미표기',
        r.export_share_pct != null ? `수출 비중 ${r.export_share_pct}%` : '수출 비중 미표기']));
      g.addEventListener('mouseleave', () => tp.hide());
      svg.append(g);
    });
  }
  ['engine', 'K10'].forEach((k) => { const p = photo(k); const w = el('div'); w.append(p.fig, p.cap); $('supply-photos').append(w); });
  const comp = (id, g) => $(id).replaceChildren(...D.components.filter((c) => c.group === g).map((c) => { const tr = el('tr'); tr.append(td(c.part, 'strong'), td(c.maker), td(c.detail, 'hide-sm'), tierTd(c.tier)); return tr; }));
  comp('comp-dom', '국내 핵심 구성품'); comp('comp-loc', '해외 현지 생산');

  // 계획
  $('road').replaceChildren(...D.roadmap.map((r) => {
    const li = el('li'); li.style.setProperty('--c', RS[r.status] || 'var(--muted-mark)');
    const b = el('div'); const hh = el('div', 'h'); hh.append(el('span', 'cat', r.status), el('strong', null, r.item), chip(r.tier));
    b.append(hh, el('p', null, r.detail)); li.append(el('div', 'when', r.when), el('span', 'dot'), b); return li;
  }));
  $('pipeline').replaceChildren(...D.pipeline.map((r) => { const tr = el('tr'); tr.append(td(r.country, 'strong nowrap'), td(r.opportunity), td(r.scale), td(r.stage, 'nowrap'), td(r.updated, 'hide-sm nowrap'), td(r.note, 'hide-md'), tierTd(r.tier)); return tr; }));

  // 사진 출처
  const seen = new Set();
  $('credits').replaceChildren(...Object.values(D.photos).filter((p) => !seen.has(p.page) && seen.add(p.page)).map((p) => {
    const li = el('li'); li.append(p.cap + ': '); const a = el('a', null, p.by); a.href = p.page; a.target = '_blank'; a.rel = 'noopener'; li.append(a, ' · ' + p.lic); return li;
  }));

  // 탭 (주소의 #으로 이동)
  const drawn = {};
  const drawers = { export: () => { drawOps(); drawDetail(); drawSwim(); }, cost: () => { drawUnit(); drawFin(); } };
  function route() {
    const id = ['overview', 'history', 'export', 'cost', 'plan'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'overview';
    document.querySelectorAll('.page').forEach((s) => s.classList.toggle('hidden', s.id !== id));
    document.querySelectorAll('.tabs a').forEach((a) => (a.dataset.tab === id ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    if (drawers[id]) { drawers[id](); drawn[id] = true; }
  }
  window.addEventListener('hashchange', () => { route(); });
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { const id = location.hash.slice(1); if (drawers[id]) drawers[id](); }, 150); });
  route();
})();
