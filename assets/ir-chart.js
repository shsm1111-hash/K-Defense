// 기업 IR 분기 실적 차트 (모든 무기체계 페이지 공용)
// 막대: 수출·내수 매출(억원), 선: 영업이익률(%)
window.drawIR = function drawIR(host, ir) {
  const NS = 'http://www.w3.org/2000/svg';
  const S = (t, a = {}) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = String(x); return e; };
  const fmt = (n) => Number(n).toLocaleString('ko-KR');
  const rows = ir.quarters;
  const W = host.clientWidth || 600; const H = 260; const mt = 24; const mb = 28;
  const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, height: H });
  host.replaceChildren(svg);
  const tw = (s, cls) => { const t = S('text', { class: cls || '' }); t.textContent = s; svg.append(t); const w = t.getComputedTextLength(); t.remove(); return w; };
  const maxRev = Math.max(...rows.map((r) => r.revenue_eok));
  const step = maxRev > 30000 ? 10000 : 5000;
  const top = Math.ceil(maxRev / step) * step;
  const lt = []; for (let v = 0; v <= top; v += step) lt.push(v);
  const minP = Math.min(0, Math.floor(Math.min(...rows.map((r) => r.opm_pct)) / 10) * 10);
  const maxP = Math.max(30, Math.ceil(Math.max(...rows.map((r) => r.opm_pct)) / 10) * 10);
  const rt = []; for (let v = minP; v <= maxP; v += 10) rt.push(v);
  const ml = Math.max(...lt.map((v) => tw(fmt(v)))) + 10;
  const mr = Math.max(...rt.map((v) => tw(v + '%'))) + 10;
  const y = (v) => mt + (H - mb - mt) * (1 - v / top);
  const yp = (p) => mt + (H - mb - mt) * (1 - (p - minP) / (maxP - minP));
  const band = (W - ml - mr) / rows.length; const bw = Math.min(28, band * 0.62);
  lt.forEach((v) => {
    svg.append(S('line', { x1: ml, x2: W - mr, y1: y(v), y2: y(v), class: 'grid' }));
    const t = S('text', { x: ml - 6, y: y(v), 'dominant-baseline': 'middle', 'text-anchor': 'end' }); t.textContent = fmt(v); svg.append(t);
  });
  rt.forEach((v) => { const t = S('text', { x: W - mr + 6, y: yp(v), 'dominant-baseline': 'middle' }); t.textContent = v + '%'; svg.append(t); });
  const every = band < 34 ? 2 : 1;
  const tip = el('div', 'tip hidden'); host.append(tip);
  const pts = [];
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
    if (i % every === 0 || i === rows.length - 1) { const t = S('text', { x: cx, y: H - 8, 'text-anchor': 'middle' }); t.textContent = r.quarter; g.append(t); }
    g.append(S('rect', { x: cx - band / 2, y: mt, width: band, height: H - mb - mt, fill: 'transparent' }));
    g.addEventListener('mousemove', (e) => {
      const lines = [`${r.quarter} · ${ir.segment}`, `매출 ${fmt(r.revenue_eok)}억 · 영업이익 ${fmt(r.op_eok)}억`, `영업이익률 ${r.opm_pct}%`];
      if (hasSplit) { lines.push(`${lb.export} ${fmt(r.export_eok)}억 (${r.export_share_pct}%) · ${lb.domestic} ${fmt(r.domestic_eok)}억`); if (r.other_eok != null) lines.push(`${lb.other} ${fmt(r.other_eok)}억`); }
      lines.push(`출처: ${r.ir_doc}`);
      tip.replaceChildren(...lines.map((l) => el('div', null, l))); tip.classList.remove('hidden');
      const hr = host.getBoundingClientRect(); let x = e.clientX - hr.left + 12; let yy = e.clientY - hr.top + 12;
      if (x + tip.offsetWidth > hr.width) x = Math.max(0, e.clientX - hr.left - tip.offsetWidth - 12);
      if (yy + tip.offsetHeight > hr.height) yy = Math.max(0, e.clientY - hr.top - tip.offsetHeight - 12);
      tip.style.left = x + 'px'; tip.style.top = yy + 'px';
    });
    g.addEventListener('mouseleave', () => tip.classList.add('hidden'));
    svg.append(g);
    pts.push([cx, yp(r.opm_pct)]);
  });
  svg.append(S('path', { d: 'M' + pts.map((p) => p.join(',')).join('L'), fill: 'none', stroke: 'var(--c4)', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'pointer-events': 'none' }));
  pts.forEach((p, i) => svg.append(S('circle', { cx: p[0], cy: p[1], r: i === pts.length - 1 ? 4 : 2.5, fill: 'var(--c4)', 'pointer-events': 'none' })));
  const last = rows[rows.length - 1]; const lp = pts[pts.length - 1];
  const lab = S('text', { x: lp[0], y: lp[1] - 9, 'text-anchor': 'middle', class: 'vlab' }); lab.textContent = last.opm_pct + '%'; svg.append(lab);
};
