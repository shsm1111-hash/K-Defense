// 기업 IR 분기 실적 차트 (모든 무기체계 페이지 공용)
// 막대: 수출·내수 매출(억원), 선: 영업이익률(%)
window.drawIR = function drawIR(host, ir) {
  const NS = 'http://www.w3.org/2000/svg';
  const S = (t, a = {}) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = String(x); return e; };
  const fmt = (n) => Number(n).toLocaleString('ko-KR');
  const rows = ir.quarters; const opmRows = rows.filter((r) => r.opm_pct != null);
  const W = host.clientWidth || 600; const H = 260; const mt = 24; const mb = 28;
  const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, height: H });
  host.replaceChildren(svg);
  const tw = (s, cls) => { const t = S('text', { class: cls || '' }); t.textContent = s; svg.append(t); const w = t.getComputedTextLength(); t.remove(); return w; };
  const maxRev = Math.max(...rows.map((r) => r.revenue_eok));
  const step = maxRev > 30000 ? 10000 : 5000;
  const top = Math.ceil(maxRev / step) * step;
  const lt = []; for (let v = 0; v <= top; v += step) lt.push(v);
  const shareRows = rows.filter((r) => r.export_share_pct != null);
  const hasShare = shareRows.length > 0;
  const pctVals = opmRows.map((r) => r.opm_pct).concat(shareRows.map((r) => r.export_share_pct));
  const pstep = hasShare ? 20 : 10;
  const minP = Math.min(0, Math.floor(Math.min(...pctVals, 0) / pstep) * pstep);
  const maxP = hasShare ? 100 : Math.max(30, Math.ceil(Math.max(...pctVals, 0) / 10) * 10);
  const rt = []; for (let v = minP; v <= maxP; v += pstep) rt.push(v);
  const ml = Math.max(...lt.map((v) => tw(fmt(v)))) + 10;
  const mr = Math.max(...rt.map((v) => tw(v + '%'))) + 10;
  const y = (v) => mt + (H - mb - mt) * (1 - v / top);
  const yp = (p) => mt + (H - mb - mt) * (1 - (p - minP) / (maxP - minP));
  const band = (W - ml - mr) / rows.length; const bw = Math.min(28, band * 0.62);
  const brk = (ir.basis_breaks || []).map((b) => rows.findIndex((r) => r.quarter === b.from)).filter((i) => i > 0);
  brk.forEach((i) => { const x = ml + band * i; svg.append(S('line', { x1: x, x2: x, y1: mt, y2: H - mb, stroke: 'var(--muted)', 'stroke-dasharray': '3 3' })); });
  lt.forEach((v) => {
    svg.append(S('line', { x1: ml, x2: W - mr, y1: y(v), y2: y(v), class: 'grid' }));
    const t = S('text', { x: ml - 6, y: y(v), 'dominant-baseline': 'middle', 'text-anchor': 'end' }); t.textContent = fmt(v); svg.append(t);
  });
  rt.forEach((v) => { const t = S('text', { x: W - mr + 6, y: yp(v), 'dominant-baseline': 'middle' }); t.textContent = v + '%'; svg.append(t); });
  const every = band < 22 ? 4 : band < 34 ? 2 : 1;
  const tip = el('div', 'tip hidden'); host.append(tip);
  const pts = []; const spts = [];
  rows.forEach((r, i) => {
    const cx = ml + band * i + band / 2;
    const g = S('g');
    const hasSplit = r.export_eok != null && r.domestic_eok != null;
    const lb = ir.labels || { export: '수출', domestic: '내수', other: '기타' };
    if (hasSplit) {
      const parts = [[r.export_eok, 'var(--c1)'], [r.domestic_eok, 'var(--c2)']];
      if (r.other_eok != null) parts.push([r.other_eok, 'var(--c5)']);
      let base = 0;
      parts.forEach(([v, col]) => { g.append(S('rect', { x: cx - bw / 2, y: y(base + v), width: bw, height: Math.max(0, y(base) - y(base + v)), fill: col, rx: 2 })); base += v; });
    } else {
      g.append(S('rect', { x: cx - bw / 2, y: y(r.revenue_eok), width: bw, height: y(0) - y(r.revenue_eok), fill: 'var(--c1)', rx: 2 }));
    }
    if (i % every === 0 || (i === rows.length - 1 && every > 1 && i % every === every - 1)) { const t = S('text', { x: cx, y: H - 8, 'text-anchor': 'middle' }); t.textContent = r.quarter; g.append(t); }
    g.append(S('rect', { x: cx - band / 2, y: mt, width: band, height: H - mb - mt, fill: 'transparent' }));
    g.addEventListener('mousemove', (e) => {
      const lines = [`${r.quarter} · ${r.basis || ir.segment}`];
      if (r.op_eok != null) lines.push(`매출 ${fmt(r.revenue_eok)}억 · 영업이익 ${fmt(r.op_eok)}억`, `영업이익률 ${r.opm_pct}%`);
      else lines.push(`매출 ${fmt(r.revenue_eok)}억 · 부문 영업이익 미공개` + (r.company_op_eok != null ? ` (회사 전체 영업이익 ${fmt(r.company_op_eok)}억)` : ''));
      if (hasSplit) { lines.push(`${lb.export} ${fmt(r.export_eok)}억 (${r.export_share_pct}%${r.export_src ? ', ' + r.export_src : ''}) · ${lb.domestic} ${fmt(r.domestic_eok)}억`); if (r.other_eok != null) lines.push(`${lb.other} ${fmt(r.other_eok)}억`); }
      lines.push(`출처: ${r.ir_doc}`);
      tip.replaceChildren(...lines.map((l) => el('div', null, l))); tip.classList.remove('hidden');
      const hr = host.getBoundingClientRect(); let x = e.clientX - hr.left + 12; let yy = e.clientY - hr.top + 12;
      if (x + tip.offsetWidth > hr.width) x = Math.max(0, e.clientX - hr.left - tip.offsetWidth - 12);
      if (yy + tip.offsetHeight > hr.height) yy = Math.max(0, e.clientY - hr.top - tip.offsetHeight - 12);
      tip.style.left = x + 'px'; tip.style.top = yy + 'px';
    });
    g.addEventListener('mouseleave', () => tip.classList.add('hidden'));
    svg.append(g);
    if (r.opm_pct != null) pts.push([cx, yp(r.opm_pct)]);
    if (r.export_share_pct != null) spts.push([cx, yp(r.export_share_pct), r.export_share_pct]);
  });
  if (spts.length) {
    svg.append(S('path', { d: 'M' + spts.map((p) => p[0] + ',' + p[1]).join('L'), fill: 'none', stroke: 'var(--c3)', 'stroke-width': 2, 'stroke-dasharray': '5 4', 'stroke-linejoin': 'round', 'pointer-events': 'none' }));
    spts.forEach((p, i) => svg.append(S('rect', { x: p[0] - 3, y: p[1] - 3, width: 6, height: 6, fill: 'var(--c3)', 'pointer-events': 'none' })));
    const ls = spts[spts.length - 1]; const sl = S('text', { x: ls[0] - 8, y: ls[1] - 9, 'text-anchor': 'end', class: 'vlab' }); sl.textContent = '수출 ' + ls[2] + '%'; svg.append(sl);
  }
  if (pts.length) {
  svg.append(S('path', { d: 'M' + pts.map((p) => p.join(',')).join('L'), fill: 'none', stroke: 'var(--c4)', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'pointer-events': 'none' }));
  pts.forEach((p, i) => svg.append(S('circle', { cx: p[0], cy: p[1], r: i === pts.length - 1 ? 4 : 2.5, fill: 'var(--c4)', 'pointer-events': 'none' })));
  const last = opmRows[opmRows.length - 1]; const lp = pts[pts.length - 1];
  const lab = S('text', { x: lp[0] - (spts.length ? 8 : 0), y: lp[1] + (spts.length && lp[1] > spts[spts.length - 1][1] ? 18 : -9), 'text-anchor': spts.length ? 'end' : 'middle', class: 'vlab' }); lab.textContent = (spts.length ? '이익률 ' : '') + last.opm_pct + '%'; svg.append(lab);
  }
};

// 분기별 수주잔고 (사업부문별 누적 막대 + 수출 비중 선)
window.drawBacklog = function drawBacklog(host, bs) {
  const NS = 'http://www.w3.org/2000/svg';
  const S = (t, a = {}) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = String(x); return e; };
  const rows = bs.rows; const U = bs.unit;
  const f = (v) => (v == null ? '—' : Number(v).toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: U === '억달러' ? 1 : 2 }));
  const W = host.clientWidth || 600; const H = 270; const mt = 26; const mb = 28;
  const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, height: H });
  host.replaceChildren(svg);
  const tw = (s) => { const t = S('text'); t.textContent = s; svg.append(t); const w = t.getComputedTextLength(); t.remove(); return w; };
  const maxV = Math.max(...rows.map((r) => r.total));
  const step = maxV > 200 ? 100 : maxV > 40 ? 10 : 5;
  const top = Math.ceil((maxV * 1.08) / step) * step;
  const lt = []; for (let v = 0; v <= top; v += step) lt.push(v);
  const hasPct = rows.some((r) => r.export_pct != null);
  const ml = Math.max(...lt.map((v) => tw(f(v)))) + 10; const mr = hasPct ? tw('100%') + 12 : 12;
  const y = (v) => mt + (H - mb - mt) * (1 - v / top);
  const yp = (p) => mt + (H - mb - mt) * (1 - p / 100);
  const band = (W - ml - mr) / rows.length; const bw = Math.min(30, band * 0.62);
  lt.forEach((v) => { svg.append(S('line', { x1: ml, x2: W - mr, y1: y(v), y2: y(v), class: 'grid' })); const t = S('text', { x: ml - 6, y: y(v), 'dominant-baseline': 'middle', 'text-anchor': 'end' }); t.textContent = f(v); svg.append(t); });
  if (hasPct) [0, 20, 40, 60, 80, 100].forEach((v) => { const t = S('text', { x: W - mr + 6, y: yp(v), 'dominant-baseline': 'middle' }); t.textContent = v + '%'; svg.append(t); });
  const tip = el('div', 'tip hidden'); host.append(tip);
  const every = band < 22 ? 4 : band < 34 ? 2 : 1; const pts = [];
  rows.forEach((r, i) => {
    const cx = ml + band * i + band / 2; const g = S('g');
    if (r.values) {
      let base = 0;
      bs.segments.forEach((s) => { const v = r.values[s.key] || 0; g.append(S('rect', { x: cx - bw / 2, y: y(base + v), width: bw, height: Math.max(0, y(base) - y(base + v)), fill: `var(--${s.color})`, rx: 2, opacity: bs.focus && s.key !== bs.focus ? 0.55 : 1 })); base += v; });
    } else {
      g.append(S('rect', { x: cx - bw / 2, y: y(r.total), width: bw, height: y(0) - y(r.total), fill: 'var(--muted-mark)', rx: 2 }));
    }
    const lab = S('text', { x: cx, y: y(r.total) - 5, 'text-anchor': 'middle', class: 'vlab small' }); if (band >= 34 || i === rows.length - 1) { lab.textContent = f(r.total); g.append(lab); }
    if (i % every === 0 || i === rows.length - 1) { const t = S('text', { x: cx, y: H - 8, 'text-anchor': 'middle' }); t.textContent = r.period; g.append(t); }
    g.append(S('rect', { x: cx - band / 2, y: mt, width: band, height: H - mb - mt, fill: 'transparent' }));
    g.addEventListener('mousemove', (e) => {
      const L = [`${r.period} 수주잔고 ${f(r.total)}${U}`];
      if (r.values) bs.segments.forEach((s) => L.push(`${s.label} ${f(r.values[s.key])}${U}`)); else L.push('부문 구분 미공개(총액만)');
      if (bs.export_keys.length && r.values) { const ex = bs.export_keys.reduce((a, k) => a + (r.values[k] || 0), 0); L.push(`수출 ${f(ex)}${U} · 비중 ${r.export_pct}%${r.calc ? ' (총액×비중)' : ''}`); }
      tip.replaceChildren(...L.map((l) => el('div', null, l))); tip.classList.remove('hidden');
      const hr = host.getBoundingClientRect(); let x = e.clientX - hr.left + 12; let yy = e.clientY - hr.top + 12;
      if (x + tip.offsetWidth > hr.width) x = Math.max(0, e.clientX - hr.left - tip.offsetWidth - 12);
      if (yy + tip.offsetHeight > hr.height) yy = Math.max(0, e.clientY - hr.top - tip.offsetHeight - 12);
      tip.style.left = x + 'px'; tip.style.top = yy + 'px';
    });
    g.addEventListener('mouseleave', () => tip.classList.add('hidden'));
    svg.append(g);
    if (r.export_pct != null) pts.push([cx, yp(r.export_pct), r.export_pct]);
  });
  if (pts.length) {
    if (pts.length > 1) svg.append(S('path', { d: 'M' + pts.map((p) => p[0] + ',' + p[1]).join('L'), fill: 'none', stroke: 'var(--c3)', 'stroke-width': 2, 'stroke-dasharray': '5 4', 'pointer-events': 'none' }));
    pts.forEach((p) => svg.append(S('rect', { x: p[0] - 3, y: p[1] - 3, width: 6, height: 6, fill: 'var(--c3)', 'pointer-events': 'none' })));
    const l = pts[pts.length - 1]; const t = S('text', { x: l[0] - 8, y: l[1] - 9, 'text-anchor': 'end', class: 'vlab' }); t.textContent = '수출 ' + l[2] + '%'; svg.append(t);
  }
};
