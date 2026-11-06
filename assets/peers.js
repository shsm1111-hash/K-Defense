// 글로벌 방산 Peer 비교 페이지
(async function () {
  const NS = 'http://www.w3.org/2000/svg';
  const S = (t, a = {}) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = String(x); return e; };
  const $ = (id) => document.getElementById(id);
  const D = await fetch(document.body.dataset.data).then((r) => r.json());
  const ROWS = D.rows;
  const BY = Object.fromEntries(ROWS.map((r) => [r.t, r]));
  const GL = Object.fromEntries(D.groups.map((g) => [g.k, g.label]));
  const GC = (g) => `var(--g-${g})`;
  const SYS = { k9: 'K9 자주포', k2: 'K2 전차', chunmoo: '천무', redback: '레드백', k21: 'K21 보병전투차', fa50: 'FA-50', kf21: 'KF-21', msam2: '천궁-II', lsam: 'L-SAM', cheongwang: '천광', kss3: '장보고-III' };

  const nf = (v, d = 1) => (v == null || Number.isNaN(v) ? '—' : Number(v).toLocaleString('ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d }));
  const pct = (v, d = 1) => (v == null ? '—' : (v > 0 ? '+' : '') + nf(v, d) + '%');
  const mult = (v) => (v == null || v <= 0 ? '—' : nf(v, 1) + '배');
  const jo = (v) => (v == null ? '—' : v >= 100 ? nf(v, 0) + '조' : v >= 10 ? nf(v, 1) + '조' : nf(v, 2) + '조');
  const signCls = (v) => (v == null ? '' : v < 0 ? 'neg' : v > 0 ? 'pos' : '');
  const med = (a) => { const v = a.filter((x) => x != null).sort((x, y) => x - y); if (!v.length) return null; const m = v.length >> 1; return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2; };
  const textW = (svg, s, cls) => { const t = S('text', { class: cls || '' }); t.textContent = s; svg.append(t); const w = t.getComputedTextLength(); t.remove(); return w; };

  $('asof').textContent = D.asof.replace(/-/g, '.').replace(/\.0/g, '.');
  $('glegend').append(...D.groups.map((g) => { const s = el('span'); const i = el('i', 'gdot'); i.style.background = GC(g.k); s.append(i, `${g.label} ${D.stats[g.k].n}사`); return s; }));
  $('foot-src').textContent = `시세·멀티플·재무: ${D.source}. 컨센서스 EPS(12M·24M Fwd·연도별 PER 계산): ${D.est_note} 수주잔고·가이던스·최근 분기: 각 사 IR·실적 보도자료와 언론 보도(기업별 상세에 출처 링크). 국내 방산 부문 실적: 각 사 IR 실적발표 자료. ${D.fx.note}.`;

  // ── 탭 ──
  const tabs = [...document.querySelectorAll('.tabs a')];
  const showTab = (id) => {
    tabs.forEach((a) => a.setAttribute('aria-current', a.dataset.tab === id ? 'page' : 'false'));
    document.querySelectorAll('section.page').forEach((s) => s.classList.toggle('hidden', s.id !== id));
    drawVisible();
  };
  tabs.forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); history.replaceState(null, '', '#' + a.dataset.tab); showTab(a.dataset.tab); }));

  // ── 공통: 세그먼트 버튼 ──
  function seg(host, opts, cur, on) {
    const box = $(host);
    const set = (v) => { box.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v))); };
    box.replaceChildren(...opts.map(([v, l]) => { const b = el('button', null, l); b.type = 'button'; b.dataset.v = v; b.addEventListener('click', () => { set(v); on(v); }); return b; }));
    set(cur);
  }
  const GRP_OPTS = [['all', '전체'], ...D.groups.map((g) => [g.k, g.label])];

  // ── 툴팁 ──
  function tipFor(host) { const t = el('div', 'tip hidden'); host.append(t); return t; }
  function placeTip(tip, host, e, lines) {
    tip.replaceChildren(...lines);
    tip.classList.remove('hidden');
    const r = host.getBoundingClientRect();
    let x = e.clientX - r.left + 14; const y = e.clientY - r.top + 14;
    if (x + tip.offsetWidth > r.width) x = e.clientX - r.left - tip.offsetWidth - 14;
    tip.style.left = Math.max(0, x) + 'px'; tip.style.top = y + 'px';
  }
  const tl = (a, b, color) => { const d = el('div', 'row'); const l = el('span'); if (color) { const i = el('i'); i.style.background = color; l.append(i); } l.append(a); d.append(l, el('b', null, b)); return d; };

  // ── KPI ──
  const st = D.stats;
  const fgn = ROWS.filter((r) => r.group !== 'kr');
  const fgnMed = (f) => med(fgn.map(f));
  const kpis = [
    ['K방산 12M Fwd PER 중앙값', nf(st.kr.per_12m) + '배', `해외 21사 ${nf(fgnMed((r) => r.per_12m))}배 · 미국 ${nf(st.us.per_12m)} · 유럽 ${nf(st.eu.per_12m)} · 트레일링 ${nf(st.kr.pe)}배`],
    ['K방산 1년 수익률 중앙값', pct(st.kr.ret.y1), `달러 환산 · 해외 21사 ${pct(fgnMed((r) => r.ret_usd.y1))}`],
    ['K방산 고점 대비 중앙값', pct(st.kr.from_high), `2021.12 이후 월말 최고가 대비 · 해외 ${pct(fgnMed((r) => r.from_high))}`],
    ['K방산 잔고 배수 중앙값', nf(st.kr.coverage) + '년', `해외 21사 ${nf(fgnMed((r) => r.coverage))}년 · 방산 부문 기준`],
  ];
  $('kpis').replaceChildren(...kpis.map(([l, v, n]) => { const k = el('div', 'kpi'); k.append(el('div', 'kpi-l', l), el('div', 'kpi-v', v), el('div', 'kpi-n', n)); return k; }));

  // ── 요약: 핵심 메시지 ──
  const top = (f, n, g) => ROWS.filter((r) => (!g || r.group === g) && f(r) != null).sort((a, b) => f(b) - f(a)).slice(0, n);
  const bot = (f, n, g) => ROWS.filter((r) => (!g || r.group === g) && f(r) != null).sort((a, b) => f(a) - f(b)).slice(0, n);
  const names = (a, f) => a.map((r) => `${r.short} ${f(r)}`).join(', ');
  const de = ['RHM.DE', 'R3NK.DE'].map((t) => BY[t]);
  const usBl = ['LMT', 'RTX', 'GD', 'HII'].map((t) => BY[t]).filter((r) => r.backlog_yoy != null);
  const take = [
    [`K방산은 지난 1년 해외 방산주보다 크게 빠졌습니다`,
      `달러 환산 1년 수익률 중앙값이 K방산 ${pct(st.kr.ret.y1)}, 미국 ${pct(st.us.ret.y1)}, 유럽 ${pct(st.eu.ret.y1)}, 아시아·기타 ${pct(st.as.ret.y1)}입니다. 가장 많이 빠진 곳은 ${names(bot((r) => r.ret_usd.y1, 3), (r) => pct(r.ret_usd.y1, 0))}이고, 국내 7사 모두 2021년 말 이후 월말 고점보다 ${Math.floor(-Math.max(...ROWS.filter((r) => r.group === 'kr').map((r) => r.from_high)) / 10) * 10}% 넘게 낮습니다. 다만 약 5년 수익률은 여전히 ${names(top((r) => r.ret_usd.y5, 3, 'kr'), (r) => pct(r.ret_usd.y5, 0))}로 해외보다 훨씬 높아, 앞서 오른 폭을 되돌리는 구간으로 볼 수 있습니다.`],
    [`이제 12M Fwd PER은 해외보다 낮은 쪽입니다`,
      `K방산 12M Fwd PER 중앙값은 ${nf(st.kr.per_12m)}배로 미국(${nf(st.us.per_12m)}배)·유럽(${nf(st.eu.per_12m)}배)보다 낮고, 아시아·기타(${nf(st.as.per_12m)}배)와는 차이가 더 큽니다. 연도별로는 FY26 ${nf(st.kr.per_fy['2026'])}배 → FY27 ${nf(st.kr.per_fy['2027'])}배 → FY28 ${nf(st.kr.per_fy['2028'])}배로, 컨센서스상 이익 증가 폭(FY26→28 EPS 연평균 ${pct(st.kr.eps_cagr, 0)})이 미국(${pct(st.us.eps_cagr, 0)})·유럽(${pct(st.eu.eps_cagr, 0)})보다 커서 멀리 볼수록 더 싸 보입니다. 현대로템(${mult(BY['064350.KS'].per_12m)})·한화오션(${mult(BY['042660.KS'].per_12m)})·한화에어로(${mult(BY['012450.KS'].per_12m)})가 낮은 쪽이고, KAI(${mult(BY['047810.KS'].per_12m)})·한화시스템(${mult(BY['272210.KS'].per_12m)})은 해외 중앙값 수준 이상입니다. 다만 주가 급락 뒤 컨센서스 EPS가 아직 하향 조정되지 않았을 수 있습니다.`],
    [`수주잔고는 매출의 ${nf(st.kr.coverage)}년 치로 해외보다 두껍습니다`,
      `방산 부문 기준 잔고 배수 중앙값이 K방산 ${nf(st.kr.coverage)}년, 미국 ${nf(st.us.coverage)}년, 유럽 ${nf(st.eu.coverage)}년입니다. 잔고는 충분한데 주가가 빠졌다는 것은 시장이 '잔고가 매출·이익으로 바뀌는 속도와 수익성', 그리고 다음 대형 수주(폴란드 K2 3차·K9 3차 등)를 더 문제 삼고 있다는 뜻으로 읽을 수 있습니다.`],
    [`독일 지상장비 업체도 같은 조정을 받고 있습니다`,
      `K9·K2·레드백과 유럽 지상장비 시장에서 맞붙는 ${de.map((r) => `${r.short}(1년 ${pct(r.ret_usd.y1, 0)})`).join('·')}도 크게 빠졌습니다. 라인메탈은 11월 5일 독일 Boxer 발주 지연 등으로 석 달 새 두 번째 가이던스를 내렸습니다. 반면 미국 대형사는 PAC-3·잠수함 같은 다년 계약으로 잔고가 1년 새 ${usBl.map((r) => `${r.short} ${pct(r.backlog_yoy, 0)}`).join(', ')} 늘었고 주가도 상대적으로 버텼습니다.`],
    [`이익률은 회사 전체로 보면 낮지만 방산 부문은 다릅니다`,
      `회사 전체 영업이익률 중앙값은 K방산 ${nf(st.kr.opm_ttm)}%로 미국(${nf(st.us.opm_ttm)}%)·유럽(${nf(st.eu.opm_ttm)}%)보다 낮습니다. 하지만 방산 부문만 보면 현대로템 ${nf(BY['064350.KS'].seg?.opm)}%, 한화에어로 지상방산 ${nf(BY['012450.KS'].seg?.opm)}%로 해외 대형사보다 높습니다. 수출 비중이 높은 부문일수록 이익률이 높습니다('실적·수주잔고' 탭의 국내 방산 부문 표).`],
  ];
  $('takeaways').replaceChildren(...take.map(([h, p]) => { const li = el('li'); li.append(el('strong', null, h), el('p', null, p)); return li; }));

  // ── 요약: 지역 중앙값 표 ──
  (function () {
    const cols = [['Trailing PER', (s) => mult(s.pe)], ['12M Fwd', (s) => mult(s.per_12m)], ['24M Fwd', (s) => mult(s.per_24m)], ['FY26E', (s) => mult(s.per_fy['2026'])], ['FY27E', (s) => mult(s.per_fy['2027'])], ['FY28E', (s) => mult(s.per_fy['2028'])], ['EV/EBITDA', (s) => mult(s.ev_ebitda)], ['EV/EBIT', (s) => mult(s.ev_ebit)],
      ['영업이익률', (s) => nf(s.opm_ttm) + '%'], ['FY 매출 성장', (s) => pct(s.rev_g_fy)], ['3년 매출 CAGR', (s) => pct(s.rev_cagr3)],
      ['잔고 배수', (s) => nf(s.coverage) + '년'], ['1년 수익률', (s) => pct(s.ret.y1)], ['연초 이후', (s) => pct(s.ret.ytd)], ['고점 대비', (s) => pct(s.from_high)], ['시총 합계', (s) => '$' + nf(s.mcap_usd_bn, 0) + 'bn']];
    const th = el('thead'); const tr = el('tr'); tr.append(el('th', null, '지역')); cols.forEach(([h]) => tr.append(el('th', 'num', h))); th.append(tr);
    const tb = el('tbody');
    D.groups.forEach((g) => {
      const s = st[g.k]; const r = el('tr'); if (g.k === 'kr') r.className = 'kr';
      const nm = el('td'); const n = el('span', 'nm'); const i = el('i', 'gdot'); i.style.background = GC(g.k); n.append(i, `${g.label} `, el('small', null, `${s.n}사`)); nm.append(n); r.append(nm);
      cols.forEach(([, f]) => r.append(el('td', 'num', f(s)))); tb.append(r);
    });
    $('grp-tbl').replaceChildren(th, tb);
  })();

  // ── 가로 막대 (수익률 순위·잔고 배수) ──
  function hbar(host, items, opt) {
    const box = $(host); const W = box.clientWidth || 700; const rowH = 22; const mt = 8; const mb = 22;
    const H = mt + mb + rowH * items.length;
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, height: H, role: 'img', 'aria-label': opt.aria });
    box.replaceChildren(svg);
    const tip = tipFor(box);
    const lw = Math.max(...items.map((d) => textW(svg, d.label))) + 12;
    const vals = items.map((d) => d.v);
    const lo = Math.min(0, ...vals); const hi = Math.max(0, ...vals);
    const fmtV = opt.fmt;
    const vw = Math.max(...items.map((d) => textW(svg, fmtV(d.v), 'vlab small'))) + 10;
    const x0 = lw + (lo < 0 ? vw : 0); const x1 = W - vw;
    const x = (v) => x0 + (x1 - x0) * ((v - lo) / ((hi - lo) || 1));
    const ticks = opt.ticks(lo, hi);
    ticks.forEach((v) => {
      svg.append(S('line', { x1: x(v), x2: x(v), y1: mt, y2: H - mb, class: v === 0 ? 'zero' : 'grid' }));
      const t = S('text', { x: x(v), y: H - 6, 'text-anchor': 'middle', class: 'axis-t' }); t.textContent = opt.tick(v); svg.append(t);
    });
    items.forEach((d, i) => {
      const y = mt + i * rowH; const g = S('g', { class: 'hit' });
      const a = x(Math.min(0, d.v)); const b = x(Math.max(0, d.v));
      const lab = S('text', { x: lw - 8, y: y + rowH / 2, 'dominant-baseline': 'middle', 'text-anchor': 'end', class: d.strong ? 'sel' : '' }); lab.textContent = d.label;
      const w = Math.max(1, b - a); const rx = Math.min(4, w / 2);
      // 바닥(0)쪽은 직각, 끝쪽만 둥글게
      const yy = y + 4; const hh = rowH - 8;
      const path = d.v >= 0
        ? `M${a},${yy} H${b - rx} Q${b},${yy} ${b},${yy + rx} V${yy + hh - rx} Q${b},${yy + hh} ${b - rx},${yy + hh} H${a} Z`
        : `M${b},${yy} H${a + rx} Q${a},${yy} ${a},${yy + rx} V${yy + hh - rx} Q${a},${yy + hh} ${a + rx},${yy + hh} H${b} Z`;
      g.append(S('rect', { x: 0, y, width: W, height: rowH, fill: 'transparent' }), lab, S('path', { d: path, fill: GC(d.group) }));
      const vt = S('text', { x: d.v >= 0 ? b + 5 : a - 5, y: y + rowH / 2, 'dominant-baseline': 'middle', 'text-anchor': d.v >= 0 ? 'start' : 'end', class: 'vlab small' }); vt.textContent = fmtV(d.v); g.append(vt);
      g.addEventListener('mousemove', (e) => placeTip(tip, box, e, opt.tipLines(d)));
      g.addEventListener('mouseleave', () => tip.classList.add('hidden'));
      g.addEventListener('click', () => openCompany(d.t));
      svg.append(g);
    });
  }
  const niceTicks = (lo, hi, n = 5) => {
    const span = hi - lo || 1; const raw = span / n; const p = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => span / s <= n + 1) || p * 10;
    const out = []; for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6);
    return out;
  };

  // 요약: 수익률 순위
  let rankP = 'y1'; let rankC = 'usd';
  const PER = Object.fromEntries(D.periods.map((p) => [p.k, p]));
  function drawRank() {
    const key = rankC === 'usd' ? 'ret_usd' : 'ret';
    const items = ROWS.filter((r) => r[key][rankP] != null).map((r) => ({ t: r.t, label: r.short, v: r[key][rankP], group: r.group, strong: r.group === 'kr' })).sort((a, b) => b.v - a.v);
    $('rank-note').textContent = `${rankC === 'usd' ? '달러 환산' : '현지통화'}, ${PER[rankP].basis}. 막대를 누르면 기업별 상세로 이동합니다.${rankC === 'local' ? ' 튀르키예(아셀산)는 리라 인플레이션 때문에 현지통화 수익률이 부풀려 보입니다.' : ''}`;
    hbar('rank-chart', items, {
      aria: '기간 주가 수익률 순위', fmt: (v) => pct(v, 0), ticks: (lo, hi) => niceTicks(lo, hi), tick: (v) => v + '%',
      tipLines: (d) => { const r = BY[d.t]; return [el('div', null, `${r.name} · ${r.country}`), tl('현지통화', pct(r.ret[rankP])), tl('달러 환산', pct(r.ret_usd[rankP])), tl('고점 대비', pct(r.from_high))]; },
    });
  }
  seg('rank-period', [['m3', '3개월'], ['ytd', '연초 이후'], ['y1', '1년'], ['y3', '3년'], ['y5', '약 5년']], rankP, (v) => { rankP = v; drawRank(); });
  seg('rank-cur', [['usd', '달러'], ['local', '현지통화']], rankC, (v) => { rankC = v; drawRank(); });

  // ── 주가: 지수 라인 ──
  const DEF_SEL = ['012450.KS', '064350.KS', '079550.KS', 'RHM.DE', 'LMT', 'SAAB-B.ST'];
  const SLOTS = ['--s1', '--s2', '--s3', '--s4', '--s5', '--s6'];
  let sel = new Map(DEF_SEL.map((t, i) => [t, SLOTS[i]])); // 회사 → 색 슬롯 (선택한 동안 고정)
  let lineP = 'y3'; let lineC = 'usd';
  const START = { y1: '2025-10', y3: '2023-10', y5: '2021-12' };
  function renderPick() {
    const box = $('line-pick'); box.replaceChildren();
    D.groups.forEach((g) => {
      const row = el('div', 'pick-row'); const h = el('b'); const i = el('i'); i.style.background = GC(g.k); h.append(i, g.label); row.append(h);
      ROWS.filter((r) => r.group === g.k).forEach((r) => {
        const b = el('button'); b.type = 'button'; const dot = el('i'); const on = sel.has(r.t);
        if (on) dot.style.background = `var(${sel.get(r.t)})`;
        b.append(dot, r.short); b.setAttribute('aria-pressed', String(on));
        b.disabled = !on && sel.size >= 6; if (b.disabled) b.title = '최대 6개까지 비교할 수 있습니다';
        b.addEventListener('click', () => {
          if (sel.has(r.t)) { if (sel.size > 1) sel.delete(r.t); } else if (sel.size < 6) { const used = new Set(sel.values()); sel.set(r.t, SLOTS.find((s) => !used.has(s))); }
          renderPick(); drawLine();
        });
        row.append(b);
      });
      box.append(row);
    });
  }
  function drawLine() {
    const box = $('line-chart'); const W = box.clientWidth || 800; const H = 360; const mt = 16; const mb = 28; const ml = 44;
    const i0 = D.months.indexOf(START[lineP]); const ms = D.months.slice(i0);
    const key = lineC === 'usd' ? 'series_usd' : 'series';
    const series = [...sel.entries()].map(([t, slot]) => {
      const r = BY[t]; const raw = r[key].slice(i0); const b = raw.find((v) => v != null); const bi = raw.findIndex((v) => v != null);
      return { t, r, slot, bi, vals: raw.map((v) => (v == null ? null : (v / b) * 100)) };
    });
    const all = series.flatMap((s) => s.vals.filter((v) => v != null));
    const lo = Math.min(...all, 100); const hi = Math.max(...all, 100);
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, height: H, role: 'img', 'aria-label': '주가 지수 비교' });
    box.replaceChildren(svg); const tip = tipFor(box);
    const mr = Math.max(...series.map((s) => textW(svg, s.r.short, 'lbl-end'))) + 16;
    const x = (i) => ml + (W - ml - mr) * (i / (ms.length - 1));
    const log = hi / lo > 6; // 차이가 크면 로그 눈금
    const fy = log ? (v) => Math.log(v) : (v) => v;
    const y = (v) => mt + (H - mt - mb) * (1 - (fy(v) - fy(lo)) / (fy(hi) - fy(lo)));
    let ticks = log ? [25, 50, 100, 200, 400, 800, 1600, 3200].filter((v) => v >= lo * 0.9 && v <= hi * 1.1) : niceTicks(lo, hi, 6);
    ticks.forEach((v) => { svg.append(S('line', { x1: ml, x2: W - mr, y1: y(v), y2: y(v), class: v === 100 ? 'zero' : 'grid' })); const t = S('text', { x: ml - 6, y: y(v), 'text-anchor': 'end', 'dominant-baseline': 'middle', class: 'axis-t' }); t.textContent = v; svg.append(t); });
    const every = Math.ceil(ms.length / 8);
    ms.forEach((m, i) => { if (i % every === 0 || i === ms.length - 1) { const t = S('text', { x: x(i), y: H - 8, 'text-anchor': i === ms.length - 1 ? 'end' : 'middle', class: 'axis-t' }); t.textContent = i === ms.length - 1 ? '11.5' : m.slice(2).replace('-', '.'); svg.append(t); } });
    series.forEach((s) => {
      let d = ''; s.vals.forEach((v, i) => { if (v == null) return; d += (d && s.vals[i - 1] != null ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(v).toFixed(1); });
      svg.append(S('path', { d, fill: 'none', stroke: `var(${s.slot})`, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    });
    // 끝 라벨 (겹치면 아래로 밀기)
    const ends = series.map((s) => ({ s, v: s.vals[s.vals.length - 1], yy: y(s.vals[s.vals.length - 1]) })).sort((a, b) => a.yy - b.yy);
    for (let i = 1; i < ends.length; i++) if (ends[i].yy - ends[i - 1].yy < 15) ends[i].yy = ends[i - 1].yy + 15;
    ends.forEach((e) => {
      svg.append(S('circle', { cx: x(ms.length - 1), cy: y(e.v), r: 4, fill: `var(${e.s.slot})`, stroke: 'var(--panel)', 'stroke-width': 2 }));
      const t = S('text', { x: x(ms.length - 1) + 8, y: e.yy, 'dominant-baseline': 'middle', class: 'lbl-end', fill: 'var(--ink)' }); t.textContent = `${e.s.r.short} ${nf(e.v, 0)}`; svg.append(t);
    });
    // 십자선
    const cross = S('line', { y1: mt, y2: H - mb, stroke: 'var(--muted)', 'stroke-dasharray': '3 3', visibility: 'hidden' }); svg.append(cross);
    const dots = series.map((s) => { const c = S('circle', { r: 4, fill: `var(${s.slot})`, stroke: 'var(--panel)', 'stroke-width': 2, visibility: 'hidden' }); svg.append(c); return c; });
    const hit = S('rect', { x: ml, y: mt, width: W - ml - mr, height: H - mt - mb, fill: 'transparent' }); svg.append(hit);
    hit.addEventListener('mousemove', (e) => {
      const r = svg.getBoundingClientRect(); const px = (e.clientX - r.left) * (W / r.width);
      const i = Math.max(0, Math.min(ms.length - 1, Math.round(((px - ml) / (W - ml - mr)) * (ms.length - 1))));
      cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.setAttribute('visibility', 'visible');
      series.forEach((s, k) => { const v = s.vals[i]; if (v == null) { dots[k].setAttribute('visibility', 'hidden'); return; } dots[k].setAttribute('cx', x(i)); dots[k].setAttribute('cy', y(v)); dots[k].setAttribute('visibility', 'visible'); });
      const lab = i === ms.length - 1 ? '2026.11.5' : ms[i].replace('-', '.') + ' 말';
      placeTip(tip, box, e, [el('div', null, `${lab} · 시작점=100 (${lineC === 'usd' ? '달러' : '현지통화'})`),
        ...series.slice().sort((a, b) => (b.vals[i] ?? -1) - (a.vals[i] ?? -1)).map((s) => tl(s.r.short, s.vals[i] == null ? '—' : nf(s.vals[i], 0), `var(${s.slot})`))]);
    });
    hit.addEventListener('mouseleave', () => { tip.classList.add('hidden'); cross.setAttribute('visibility', 'hidden'); dots.forEach((d) => d.setAttribute('visibility', 'hidden')); });
    if (log) { const t = S('text', { x: ml, y: mt - 4, class: 'axis-t' }); t.textContent = '로그 눈금'; svg.append(t); }
  }
  seg('line-period', [['y1', '1년'], ['y3', '3년'], ['y5', '약 5년']], lineP, (v) => { lineP = v; drawLine(); });
  seg('line-cur', [['usd', '달러'], ['local', '현지통화']], lineC, (v) => { lineC = v; drawLine(); });
  $('line-reset').addEventListener('click', () => { sel = new Map(DEF_SEL.map((t, i) => [t, SLOTS[i]])); renderPick(); drawLine(); });
  renderPick();

  // ── 정렬 표 공통 ──
  function sortTable(host, cols, rowsFn, opt = {}) {
    let sk = opt.sort || null; let dir = -1;
    function render() {
      const rows = rowsFn();
      if (sk != null) { const c = cols[sk]; rows.sort((a, b) => { const va = c.v(a); const vb = c.v(b); if (va == null) return 1; if (vb == null) return -1; return typeof va === 'string' ? dir * va.localeCompare(vb) * -1 : dir * (vb - va) * -1; }); }
      const th = el('thead'); const tr = el('tr');
      cols.forEach((c, i) => { const h = el('th', c.num ? 'num' : null); if (c.v) { const b = el('button', null, c.h); b.type = 'button'; b.addEventListener('click', () => { if (sk === i) dir = -dir; else { sk = i; dir = c.asc ? 1 : -1; } render(); }); h.append(b); if (sk === i) h.setAttribute('aria-sort', dir === 1 ? 'ascending' : 'descending'); } else h.textContent = c.h; if (c.title) h.title = c.title; tr.append(h); });
      th.append(tr); const tb = el('tbody');
      (opt.pre ? opt.pre() : []).forEach((r) => tb.append(r));
      rows.forEach((r) => { const t = el('tr'); if (r.group === 'kr') t.className = 'kr'; cols.forEach((c) => { const td = el('td', c.num ? 'num' : null); const out = c.f(r); if (out instanceof Node) td.append(out); else td.textContent = out; if (c.cls) { const k = c.cls(r); if (k) td.classList.add(k); } t.append(td); }); tb.append(t); });
      $(host).replaceChildren(th, tb);
    }
    render(); return render;
  }
  const nameCell = (r) => { const s = el('span', 'nm'); const i = el('i', 'gdot'); i.style.background = GC(r.group); const b = el('button', 'lnk', r.short); b.type = 'button'; b.addEventListener('click', () => openCompany(r.t)); s.append(i, b, el('small', null, r.country)); return s; };
  const NAMECOL = { h: '회사', f: nameCell, v: (r) => r.short, asc: true };

  // 주가: 수익률 표
  let retC = 'usd'; let retG = 'all';
  const retCols = [NAMECOL, ...D.periods.map((p) => ({ h: p.label, title: p.basis, num: true, v: (r) => r[retC === 'usd' ? 'ret_usd' : 'ret'][p.k], f: (r) => pct(r[retC === 'usd' ? 'ret_usd' : 'ret'][p.k]), cls: (r) => signCls(r[retC === 'usd' ? 'ret_usd' : 'ret'][p.k]) })),
    { h: '고점 대비', num: true, v: (r) => r.from_high, f: (r) => pct(r.from_high), title: '2021.12 이후 월말 최고가 대비 (현지통화)' },
    { h: '고점 시기', num: true, v: (r) => r.high_month, f: (r) => r.high_month.replace('-', '.') },
    { h: '현재가', num: true, v: null, f: (r) => `${nf(r.px, r.px > 1000 ? 0 : 2)} ${r.cur === 'GBp' ? 'p' : r.cur}` }];
  const renderRet = sortTable('ret-tbl', retCols, () => ROWS.filter((r) => retG === 'all' || r.group === retG), { sort: 4 });
  seg('ret-cur', [['usd', '달러'], ['local', '현지통화']], retC, (v) => { retC = v; renderRet(); });
  seg('ret-grp', GRP_OPTS, retG, (v) => { retG = v; renderRet(); });

  // ── 밸류에이션: 산점도 ──
  const XOPT = { rev_g_fy: ['최근 회계연도 매출 성장률', (r) => r.rev_g_fy, '%'], rev_cagr3: ['3년 매출 CAGR', (r) => r.rev_cagr3, '%'], opm_ttm: ['영업이익률', (r) => r.opm_ttm, '%'], coverage: ['잔고 배수', (r) => r.coverage, '년'] };
  const YOPT = { per_12m: ['12M Fwd PER', (r) => r.per_12m], per_24m: ['24M Fwd PER', (r) => r.per_24m], fy27: ['FY27E PER', (r) => r.per_fy?.['2027']], pe: ['Trailing PER', (r) => r.pe], ev_ebitda: ['EV/EBITDA', (r) => r.ev_ebitda] };
  let scX = 'opm_ttm'; let scY = 'per_12m';
  function drawScatter() {
    const box = $('sc-chart'); const W = box.clientWidth || 800; const H = 420; const mt = 20; const mb = 40; const ml = 48; const mr = 20;
    const [xl, xf, xu] = XOPT[scX]; const [yl, yf] = YOPT[scY];
    let pts = ROWS.map((r) => ({ r, xv: xf(r), yv: yf(r) })).filter((p) => p.xv != null && p.yv != null && p.yv > 0);
    // 극단값(한화에어로 FY 매출 +138% 같은 연결 편입 효과)은 축 끝에 붙이고 표시
    const xs = pts.map((p) => p.xv).sort((a, b) => a - b); const ys = pts.map((p) => p.yv).sort((a, b) => a - b);
    const q = (a, f) => a[Math.floor((a.length - 1) * f)];
    const xCap = Math.max(q(xs, 0.95) * 1.4, q(xs, 0.9)); const yCap = Math.max(q(ys, 0.95) * 1.3, 40);
    const xlo = Math.min(0, ...xs); const xhi = Math.min(xs[xs.length - 1], xCap); const yhi = Math.min(ys[ys.length - 1], yCap);
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, height: H, role: 'img', 'aria-label': `${xl} 대비 ${yl}` }); box.replaceChildren(svg); const tip = tipFor(box);
    const x = (v) => ml + (W - ml - mr) * ((Math.min(v, xhi) - xlo) / ((xhi - xlo) || 1));
    const y = (v) => mt + (H - mt - mb) * (1 - Math.min(v, yhi) / yhi);
    niceTicks(xlo, xhi, 6).forEach((v) => { svg.append(S('line', { x1: x(v), x2: x(v), y1: mt, y2: H - mb, class: v === 0 ? 'zero' : 'grid' })); const t = S('text', { x: x(v), y: H - mb + 16, 'text-anchor': 'middle', class: 'axis-t' }); t.textContent = v + xu; svg.append(t); });
    niceTicks(0, yhi, 5).forEach((v) => { svg.append(S('line', { x1: ml, x2: W - mr, y1: y(v), y2: y(v), class: 'grid' })); const t = S('text', { x: ml - 6, y: y(v), 'text-anchor': 'end', 'dominant-baseline': 'middle', class: 'axis-t' }); t.textContent = v + '배'; svg.append(t); });
    const xt = S('text', { x: W - mr, y: H - 4, 'text-anchor': 'end', class: 'axis-t' }); xt.textContent = xl + ' →'; svg.append(xt);
    const yt = S('text', { x: ml, y: mt - 6, class: 'axis-t' }); yt.textContent = '↑ ' + yl; svg.append(yt);
    // 지역 중앙값 십자 표시는 생략하고, K방산 점만 진하게 라벨
    // 라벨 배치: 국내 먼저 자리를 잡고, 위·아래·오른쪽·왼쪽 중 겹치지 않는 곳에. 못 찾으면 해외 회사는 라벨 생략(툴팁으로 확인)
    pts.forEach((p) => { p.cx = x(p.xv); p.cy = y(p.yv); });
    const boxes = pts.map((p) => ({ x0: p.cx - 6, x1: p.cx + 6, y0: p.cy - 6, y1: p.cy + 6 }));
    const hitBox = (b) => boxes.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);
    const order = pts.slice().sort((a, b) => (b.r.group === 'kr') - (a.r.group === 'kr'));
    order.forEach((p) => {
      const capped = p.xv > xhi || p.yv > yhi; const txt = p.r.short + (capped ? ' ▸' : '');
      const w = textW(svg, txt, 'dot-lbl') + 2; const hgt = 12;
      const cands = [[p.cx - w / 2, p.cy - 9 - hgt, 'middle', p.cy - 9], [p.cx - w / 2, p.cy + 9, 'middle', p.cy + 9 + 10], [p.cx + 9, p.cy - hgt / 2, 'start', p.cy + 4], [p.cx - 9 - w, p.cy - hgt / 2, 'end', p.cy + 4]];
      for (const [bx, by, anchor, ty] of cands) {
        const b = { x0: bx, x1: bx + w, y0: by, y1: by + hgt };
        if (bx < ml || bx + w > W - mr + 10 || by < mt - 14 || hitBox(b)) continue;
        boxes.push(b); p.lbl = { x: anchor === 'middle' ? p.cx : anchor === 'start' ? p.cx + 9 : p.cx - 9, y: ty, anchor, txt }; break;
      }
      if (!p.lbl && p.r.group === 'kr') p.lbl = { x: p.cx, y: p.cy - 9, anchor: 'middle', txt };
    });
    pts.sort((a, b) => (a.r.group === 'kr') - (b.r.group === 'kr'));
    pts.forEach((p) => {
      const cx = p.cx; const cy = p.cy; const g = S('g', { class: 'hit' });
      const capped = p.xv > xhi || p.yv > yhi;
      g.append(S('circle', { cx, cy, r: 12, fill: 'transparent' }));
      g.append(S('circle', { cx, cy, r: p.r.group === 'kr' ? 6 : 5, fill: GC(p.r.group), stroke: 'var(--panel)', 'stroke-width': 2 }));
      if (p.lbl) { const t = S('text', { x: p.lbl.x, y: p.lbl.y, 'text-anchor': p.lbl.anchor, class: 'dot-lbl' + (p.r.group === 'kr' ? ' sel' : '') }); t.textContent = p.lbl.txt; g.append(t); }
      g.addEventListener('mousemove', (e) => placeTip(tip, box, e, [el('div', null, `${p.r.name} · ${GL[p.r.group]}`), tl(xl, nf(p.xv) + xu), tl(yl, mult(p.yv)), tl('시가총액', jo(p.r.mcap_krw_jo) + '원'), ...(capped ? [el('div', null, '값이 커서 축 끝에 붙여 표시했습니다')] : [])]));
      g.addEventListener('mouseleave', () => tip.classList.add('hidden'));
      g.addEventListener('click', () => openCompany(p.r.t));
      svg.append(g);
    });
  }
  seg('sc-x', Object.entries(XOPT).map(([k, v]) => [k, v[0]]), scX, (v) => { scX = v; drawScatter(); });
  seg('sc-y', Object.entries(YOPT).map(([k, v]) => [k, v[0]]), scY, (v) => { scY = v; drawScatter(); });

  // ── 밸류에이션: 멀티플 추이 ──
  const MH = { fpe: 'Forward PER', pe: 'Trailing PER', eve: 'EV/EBITDA', pb: 'PBR', evs: 'EV/매출' };
  let mhK = 'fpe'; let mhMode = 'group';
  let mhSel = new Map(['012450.KS', '064350.KS', 'RHM.DE', 'LMT'].map((t, i) => [t, SLOTS[i]]));
  const qLabel = (q) => (q === 'NOW' ? '11.5' : `'${q.slice(0, 2)} ${q.slice(2)}`);
  function renderMhPick() {
    const box = $('mh-pick'); box.replaceChildren(); box.classList.toggle('hidden', mhMode !== 'co');
    if (mhMode !== 'co') return;
    D.groups.forEach((g) => {
      const row = el('div', 'pick-row'); const h = el('b'); const i = el('i'); i.style.background = GC(g.k); h.append(i, g.label); row.append(h);
      ROWS.filter((r) => r.group === g.k).forEach((r) => {
        const has = r.hist && r.hist[mhK].some((v) => v != null);
        const b = el('button'); b.type = 'button'; const dot = el('i'); const on = mhSel.has(r.t);
        if (on) dot.style.background = `var(${mhSel.get(r.t)})`;
        b.append(dot, r.short); b.setAttribute('aria-pressed', String(on));
        b.disabled = !has || (!on && mhSel.size >= 6); if (!has) b.title = `${MH[mhK]} 이력 없음`;
        b.addEventListener('click', () => {
          if (mhSel.has(r.t)) { if (mhSel.size > 1) mhSel.delete(r.t); } else if (mhSel.size < 6) { const used = new Set(mhSel.values()); mhSel.set(r.t, SLOTS.find((x) => !used.has(x))); }
          renderMhPick(); drawMult();
        });
        row.append(b);
      });
      box.append(row);
    });
  }
  function drawMult() {
    const box = $('mh-chart'); const W = box.clientWidth || 800; const H = 360; const mt = 16; const mb = 28; const ml = 44;
    const hq = D.hq;
    let series;
    if (mhMode === 'group') series = D.groups.map((g) => ({ key: g.k, label: g.label, color: GC(g.k), vals: st[g.k].hist[mhK], n: st[g.k].hist_n[mhK] }));
    else series = [...mhSel.entries()].map(([t, slot]) => ({ key: t, label: BY[t].short, color: `var(${slot})`, vals: (BY[t].hist || {})[mhK] || hq.map(() => null) }));
    const all = series.flatMap((s) => s.vals.filter((v) => v != null));
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, height: H, role: 'img', 'aria-label': `${MH[mhK]} 추이` });
    box.replaceChildren(svg); const tip = tipFor(box);
    if (!all.length) { const t = S('text', { x: W / 2, y: H / 2, 'text-anchor': 'middle' }); t.textContent = '선택한 회사의 이력이 없습니다'; svg.append(t); return; }
    // 단일 회사면 5년 평균 ±1표준편차 밴드
    let band = null;
    if (series.length === 1) {
      const v = series[0].vals.filter((x) => x != null); const m = v.reduce((a, b) => a + b, 0) / v.length;
      const sd = Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length); band = { m, sd };
      all.push(m + sd, Math.max(0, m - sd));
    }
    const hi = Math.max(...all) * 1.05; const lo = 0;
    const mr = Math.max(...series.map((s) => textW(svg, `${s.label} 00.0배`, 'lbl-end'))) + 14;
    const x = (i) => ml + (W - ml - mr) * (i / (hq.length - 1));
    const y = (v) => mt + (H - mt - mb) * (1 - (v - lo) / (hi - lo));
    niceTicks(lo, hi, 5).forEach((v) => { svg.append(S('line', { x1: ml, x2: W - mr, y1: y(v), y2: y(v), class: v === 0 ? 'zero' : 'grid' })); const t = S('text', { x: ml - 6, y: y(v), 'text-anchor': 'end', 'dominant-baseline': 'middle', class: 'axis-t' }); t.textContent = v + '배'; svg.append(t); });
    hq.forEach((q, i) => { if (q.endsWith('Q4') || q === 'NOW') { const t = S('text', { x: x(i), y: H - 8, 'text-anchor': q === 'NOW' ? 'end' : 'middle', class: 'axis-t' }); t.textContent = q === 'NOW' ? '11.5' : (q.endsWith('Q4') ? '20' + q.slice(0, 2) + '말' : qLabel(q)); svg.append(t); } });
    if (band) {
      const s0 = series[0];
      svg.append(S('rect', { x: ml, y: y(band.m + band.sd), width: W - ml - mr, height: Math.max(0, y(Math.max(0, band.m - band.sd)) - y(band.m + band.sd)), fill: s0.color, opacity: 0.1 }));
      svg.append(S('line', { x1: ml, x2: W - mr, y1: y(band.m), y2: y(band.m), stroke: s0.color, 'stroke-dasharray': '5 4', 'stroke-width': 1.5 }));
      const t = S('text', { x: ml + 4, y: y(band.m) - 5, class: 'axis-t' }); t.textContent = `평균 ${nf(band.m)}배 · 음영 ±1표준편차`; svg.append(t);
    }
    // 빈 분기는 건너뛰고 이어 그림 (반기 보고·자료 공백)
    series.forEach((s) => {
      let d = ''; s.vals.forEach((v, i) => { if (v == null) return; d += (d ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(v).toFixed(1); });
      svg.append(S('path', { d, fill: 'none', stroke: s.color, 'stroke-width': mhMode === 'group' && s.key === 'kr' ? 2.75 : 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
      s.vals.forEach((v, i) => { if (v != null && (s.vals[i - 1] == null || s.vals[i + 1] == null)) svg.append(S('circle', { cx: x(i), cy: y(v), r: 2.5, fill: s.color })); });
    });
    const ends = series.map((s) => { let i = s.vals.length - 1; while (i >= 0 && s.vals[i] == null) i--; return i < 0 ? null : { s, i, v: s.vals[i], yy: y(s.vals[i]) }; }).filter(Boolean).sort((a, b) => a.yy - b.yy);
    for (let i = 1; i < ends.length; i++) if (ends[i].yy - ends[i - 1].yy < 15) ends[i].yy = ends[i - 1].yy + 15;
    ends.forEach((e) => {
      svg.append(S('circle', { cx: x(e.i), cy: y(e.v), r: 4, fill: e.s.color, stroke: 'var(--panel)', 'stroke-width': 2 }));
      const t = S('text', { x: x(hq.length - 1) + 8, y: e.yy, 'dominant-baseline': 'middle', class: 'lbl-end', fill: 'var(--ink)' }); t.textContent = `${e.s.label} ${nf(e.v)}배`; svg.append(t);
    });
    const cross = S('line', { y1: mt, y2: H - mb, stroke: 'var(--muted)', 'stroke-dasharray': '3 3', visibility: 'hidden' }); svg.append(cross);
    const hit = S('rect', { x: ml, y: mt, width: W - ml - mr, height: H - mt - mb, fill: 'transparent' }); svg.append(hit);
    hit.addEventListener('mousemove', (e) => {
      const r = svg.getBoundingClientRect(); const px = (e.clientX - r.left) * (W / r.width);
      const i = Math.max(0, Math.min(hq.length - 1, Math.round(((px - ml) / (W - ml - mr)) * (hq.length - 1))));
      cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.setAttribute('visibility', 'visible');
      const head = hq[i] === 'NOW' ? '2026.11.5' : `20${hq[i].slice(0, 2)}년 ${hq[i].slice(3)}분기 말`;
      placeTip(tip, box, e, [el('div', null, `${head} · ${MH[mhK]}`), ...series.slice().sort((a, b) => (b.vals[i] ?? -1) - (a.vals[i] ?? -1)).map((s) => tl(s.label + (s.n ? ` (${s.n[i]}사)` : ''), s.vals[i] == null ? '—' : nf(s.vals[i]) + '배', s.color))]);
    });
    hit.addEventListener('mouseleave', () => { tip.classList.add('hidden'); cross.setAttribute('visibility', 'hidden'); });
    $('mh-note').textContent = mhMode === 'group'
      ? `지역별 ${MH[mhK]} 중앙값의 분기말 추이입니다. 같은 시점에 값이 있는 회사가 3곳 이상일 때만 중앙값을 냅니다(툴팁에 회사 수). 개별 회사의 밴드(5년 평균 ±1표준편차)는 '회사 비교'에서 한 회사만 고르면 나옵니다.`
      : `회사별 ${MH[mhK]}의 분기말 추이입니다. 하나만 고르면 5년 평균과 ±1표준편차 범위(밴드)를 함께 보여 줍니다. 최대 6개.`;
  }
  $('mh-foot').textContent = `출처: ${D.hist_source}. ${D.hist_note} Forward PER은 각 분기말 당시 제공처(S&P Global) 컨센서스 기준으로, 향후 12개월 또는 다음 회계연도 EPS를 씁니다. 그래서 아래 표에서 직접 계산한 12M Fwd PER과 정의가 조금 다릅니다. Trailing PER은 직전 4개 분기 실제 순이익 기준입니다. PER·EV/EBITDA는 이익이 급변하는 시기(한화오션 흑자전환, 한화에어로 한화오션 연결)에 크게 튀므로 예상 PER과 함께 보세요.`;
  seg('mh-metric', Object.entries(MH), mhK, (v) => { mhK = v; renderMhPick(); drawMult(); });
  seg('mh-mode', [['group', '지역 중앙값'], ['co', '회사 비교']], mhMode, (v) => { mhMode = v; renderMhPick(); drawMult(); });
  renderMhPick();

  // 밸류에이션 표
  let valG = 'all';
  const valCols = [NAMECOL,
    { h: '시가총액', num: true, v: (r) => r.mcap_krw_jo, f: (r) => jo(r.mcap_krw_jo) },
    { h: 'Trailing PER', num: true, v: (r) => r.pe, f: (r) => mult(r.pe), title: '직전 4개 분기 실제 순이익 기준. 국내는 시가총액 ÷ 최근 4개 분기 지배주주 순이익으로 계산' },
    { h: '12M Fwd', num: true, v: (r) => r.per_12m, f: (r) => mult(r.per_12m), title: '앞으로 12개월 EPS = 회계연도별 컨센서스 EPS를 겹치는 기간 비율로 가중 (12월 결산: FY26 16%·FY27 84%)' },
    { h: '24M Fwd', num: true, v: (r) => r.per_24m, f: (r) => mult(r.per_24m), title: '앞으로 24개월 연평균 EPS 기준 (12월 결산: FY26 8%·FY27 50%·FY28 42%)' },
    { h: 'FY26E', num: true, v: (r) => r.per_fy?.['2026'], f: (r) => mult(r.per_fy?.['2026']), title: '2026 회계연도 컨센서스 EPS 기준 (3월 결산은 2027년 3월 결산)' },
    { h: 'FY27E', num: true, v: (r) => r.per_fy?.['2027'], f: (r) => mult(r.per_fy?.['2027']) },
    { h: 'FY28E', num: true, v: (r) => r.per_fy?.['2028'], f: (r) => mult(r.per_fy?.['2028']), title: '컨센서스가 2개 연도만 있는 회사(사브·다쏘·콩스베르그·아셀산·HAL·BEL)는 비어 있음' },
    { h: 'EPS CAGR', num: true, v: (r) => r.eps_cagr, f: (r) => pct(r.eps_cagr, 0), title: 'FY26E → FY28E 컨센서스 EPS 연평균 증가율' },
    { h: 'EV/EBITDA', num: true, v: (r) => r.ev_ebitda, f: (r) => mult(r.ev_ebitda) },
    { h: 'EV/EBIT', num: true, v: (r) => r.ev_ebit, f: (r) => mult(r.ev_ebit), title: '기업가치 ÷ 최근 4개 분기 영업이익(계산)' },
    { h: 'PBR', num: true, v: (r) => r.pb, f: (r) => mult(r.pb) },
    { h: 'EV/매출', num: true, v: (r) => r.ev_sales, f: (r) => mult(r.ev_sales) },
    { h: '배당수익률', num: true, v: (r) => r.dy, f: (r) => (r.dy == null ? '—' : nf(r.dy, 2) + '%') },
    { h: '목표가 괴리', num: true, v: (r) => r.tgt_upside, f: (r) => pct(r.tgt_upside, 0), cls: (r) => signCls(r.tgt_upside), title: '애널리스트 평균 목표가 ÷ 현재가 − 1' },
    { h: '애널리스트', num: true, v: (r) => r.n_analysts, f: (r) => (r.n_analysts ? r.n_analysts + '명' : '—') }];
  const valPre = () => (valG === 'all' ? D.groups : D.groups.filter((g) => g.k === valG)).map((g) => {
    const s = st[g.k]; const rs = ROWS.filter((r) => r.group === g.k); const tr = el('tr', 'grp');
    const vals = [`${g.label} 중앙값`, '', mult(s.pe), mult(s.per_12m), mult(s.per_24m), mult(s.per_fy['2026']), mult(s.per_fy['2027']), mult(s.per_fy['2028']), pct(s.eps_cagr, 0), mult(s.ev_ebitda), mult(s.ev_ebit), mult(med(rs.map((r) => r.pb))), mult(med(rs.map((r) => r.ev_sales))), nf(med(rs.map((r) => r.dy)), 2) + '%', pct(med(rs.map((r) => r.tgt_upside)), 0), ''];
    vals.forEach((v, i) => tr.append(el('td', i ? 'num' : null, v))); return tr;
  });
  const renderVal = sortTable('val-tbl', valCols, () => ROWS.filter((r) => valG === 'all' || r.group === valG), { sort: 3, pre: valPre });
  seg('val-grp', GRP_OPTS, valG, (v) => { valG = v; renderVal(); });

  // ── 실적: 잔고 배수 막대 ──
  function drawCov() {
    const items = ROWS.filter((r) => r.coverage != null).map((r) => ({ t: r.t, label: r.short, v: r.coverage, group: r.group, strong: r.group === 'kr' })).sort((a, b) => b.v - a.v);
    hbar('cov-chart', items, {
      aria: '수주잔고 배수', fmt: (v) => nf(v) + '년', ticks: (lo, hi) => niceTicks(0, hi), tick: (v) => v + '년',
      tipLines: (d) => { const r = BY[d.t]; return [el('div', null, r.name), tl('수주잔고', r.backlog_local || (jo(r.backlog_def_krw_jo || r.backlog_total_krw_jo) + '원')), tl('기준', r.backlog_asof), tl('계산', r.coverage_basis)]; },
    });
  }
  let earnG = 'all';
  const earnCols = [NAMECOL,
    { h: '매출(4개 분기)', num: true, v: (r) => r.rev_ttm_krw_jo, f: (r) => jo(r.rev_ttm_krw_jo), title: '원화 환산' },
    { h: '회계연도 매출 성장', num: true, v: (r) => r.rev_g_fy, f: (r) => pct(r.rev_g_fy), cls: (r) => signCls(r.rev_g_fy), title: '가장 최근 회계연도의 전년 대비 성장률(현지통화)' },
    { h: '3년 CAGR', num: true, v: (r) => r.rev_cagr3, f: (r) => pct(r.rev_cagr3) },
    { h: '영업이익률', num: true, v: (r) => r.opm_ttm, f: (r) => (r.opm_ttm == null ? '—' : nf(r.opm_ttm) + '%') },
    { h: '순이익률', num: true, v: (r) => r.npm, f: (r) => (r.npm == null ? '—' : nf(r.npm) + '%') },
    { h: '수주잔고', num: true, v: (r) => r.backlog_usd_bn, f: (r) => (r.backlog_usd_bn == null ? '—' : '$' + nf(r.backlog_usd_bn, 1) + 'bn'), title: '달러 환산. 국내는 방산 부문 잔고(KAI·LIG는 전체)' },
    { h: '잔고 증가(1년)', num: true, v: (r) => r.backlog_yoy, f: (r) => pct(r.backlog_yoy, 0), cls: (r) => signCls(r.backlog_yoy) },
    { h: '잔고 배수', num: true, v: (r) => r.coverage, f: (r) => (r.coverage == null ? '—' : nf(r.coverage) + '년') },
    { h: '방산 비중', v: (r) => r.defense_share_pct || '', f: (r) => (r.defense_share_pct ? '약 ' + String(r.defense_share_pct).split(' (')[0].replace(/[~+]/g, '').trim() + '%' : r.group === 'kr' ? '부문 표 참고' : '—') },
    { h: '잔고 기준', v: null, f: (r) => (r.backlog_asof || '—').split(' (')[0] }];
  const renderEarn = sortTable('earn-tbl', earnCols, () => ROWS.filter((r) => earnG === 'all' || r.group === earnG), { sort: 8 });
  seg('earn-grp', GRP_OPTS, earnG, (v) => { earnG = v; renderEarn(); });

  // 국내 방산 부문 표
  (function () {
    const kr = ROWS.filter((r) => r.seg);
    const th = el('thead'); const tr = el('tr');
    ['회사', '부문', '기간', '부문 매출', '부문 영업이익률', '수출 비중', '부문 수주잔고', '잔고 배수', '회사 전체 영업이익률'].forEach((h, i) => tr.append(el('th', i > 2 ? 'num' : null, h))); th.append(tr);
    const tb = el('tbody');
    kr.forEach((r) => {
      const s = r.seg; const t = el('tr', 'kr');
      const bl = r.backlog_def_krw_jo || r.backlog_total_krw_jo;
      [nameCell(r), s.name, s.label, jo(s.rev_eok / 1e4), s.opm == null ? '미공개' : nf(s.opm) + '%', s.export_pct == null ? '—' : nf(s.export_pct) + '%', bl ? jo(bl) + ` (${r.backlog_asof})` : '미공개', r.coverage == null ? '—' : nf(r.coverage) + '년', r.opm_ttm == null ? '—' : nf(r.opm_ttm) + '%']
        .forEach((v, i) => { const td = el('td', i > 2 ? 'num' : null); if (v instanceof Node) td.append(v); else td.textContent = v; t.append(td); });
      tb.append(t);
    });
    $('seg-tbl').replaceChildren(th, tb);
  })();

  // ── 기업별 상세 ──
  const selBox = $('dt-sel');
  D.groups.forEach((g) => { const og = document.createElement('optgroup'); og.label = g.label; ROWS.filter((r) => r.group === g.k).forEach((r) => { const o = document.createElement('option'); o.value = r.t; o.textContent = `${r.short} (${r.t})`; og.append(o); }); selBox.append(og); });
  let cur = '012450.KS';
  selBox.addEventListener('change', () => { cur = selBox.value; history.replaceState(null, '', '#company/' + cur); drawDetail(); });
  function openCompany(t) { cur = t; selBox.value = t; history.replaceState(null, '', '#company/' + t); showTab('company'); window.scrollTo({ top: document.querySelector('.tabs').offsetTop - 4, behavior: 'smooth' }); }

  function vbars(host, data, opt) {
    const W = host.clientWidth || 420; const H = 200; const mt = 20; const mb = 24;
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, height: H, role: 'img', 'aria-label': opt.aria }); host.replaceChildren(svg);
    const vals = data.map((d) => d.v).filter((v) => v != null);
    const lo = Math.min(0, ...vals); const hi = Math.max(0, ...vals) || 1;
    const ml = 8; const band = (W - ml * 2) / data.length; const bw = Math.min(46, band * 0.55);
    const y = (v) => mt + (H - mt - mb) * (1 - (v - lo) / ((hi - lo) || 1));
    svg.append(S('line', { x1: ml, x2: W - ml, y1: y(0), y2: y(0), class: 'zero' }));
    data.forEach((d, i) => {
      const cx = ml + band * i + band / 2;
      const t = S('text', { x: cx, y: H - 6, 'text-anchor': 'middle', class: 'axis-t' }); t.textContent = d.l; svg.append(t);
      if (d.v == null) return;
      if (opt.line) {
        svg.append(S('circle', { cx, cy: y(d.v), r: 4, fill: GC(opt.group), stroke: 'var(--panel)', 'stroke-width': 2 }));
        if (i > 0 && data[i - 1].v != null) svg.insertBefore(S('line', { x1: ml + band * (i - 1) + band / 2, y1: y(data[i - 1].v), x2: cx, y2: y(d.v), stroke: GC(opt.group), 'stroke-width': 2 }), svg.firstChild.nextSibling);
      } else {
        const a = y(Math.max(0, d.v)); const b = y(Math.min(0, d.v));
        svg.append(S('rect', { x: cx - bw / 2, y: a, width: bw, height: Math.max(1, b - a), rx: 3, fill: GC(opt.group) }));
      }
      const vt = S('text', { x: cx, y: (d.v >= 0 ? y(d.v) : y(d.v) + 14) - 6, 'text-anchor': 'middle', class: 'vlab small' }); vt.textContent = opt.fmt(d.v); svg.append(vt);
    });
  }
  const link = (href, txt) => { const a = el('a', null, txt); a.href = href; a.target = '_blank'; a.rel = 'noopener'; return a; };
  function drawDetail() {
    const r = BY[cur];
    $('dt-title').textContent = `${r.name}`;
    $('dt-sub').textContent = `${r.t} · ${r.country} · ${GL[r.group]} · ${r.focus}`;
    const body = $('dt-body'); body.replaceChildren();
    if (r.note || r.fin_override) { const n = el('p', 'note'); n.style.marginBottom = '12px'; n.textContent = [r.note, r.fin_override?.note].filter(Boolean).join(' '); body.append(n); }
    const fx = (v) => v;
    const cells = [
      ['시가총액', jo(r.mcap_krw_jo) + '원', `$${nf(r.mcap_usd_bn, 1)}bn`],
      ['12M Fwd PER', mult(r.per_12m), `24M Fwd ${mult(r.per_24m)} · Trailing ${mult(r.pe)}`],
      ['연도별 PER (배)', [r.per_fy?.['2026'], r.per_fy?.['2027'], r.per_fy?.['2028']].map((v) => (v == null || v <= 0 ? '—' : nf(v))).join(' → '), `FY26E → FY27E → FY28E${r.fye === 3 ? ' (3월 결산: FY26=2027.3)' : ''}`],
      ['EV/EBITDA', mult(r.ev_ebitda), `EV/EBIT ${mult(r.ev_ebit)}`],
      ['영업이익률', r.opm_ttm == null ? '—' : nf(r.opm_ttm) + '%', r.ttm_label || ''],
      ['1년 수익률', pct(r.ret_usd.y1), `현지통화 ${pct(r.ret.y1)}`],
      ['고점 대비', pct(r.from_high), `고점 ${r.high_month.replace('-', '.')}`],
      ['수주잔고', r.backlog_local || (r.backlog_def_krw_jo || r.backlog_total_krw_jo ? jo(r.backlog_def_krw_jo || r.backlog_total_krw_jo) + '원' : '미공개'), [r.backlog_label, r.backlog_asof].filter(Boolean).join(' · ')],
      ['잔고 배수', r.coverage == null ? '—' : nf(r.coverage) + '년', r.backlog_yoy != null ? `잔고 1년 ${pct(r.backlog_yoy, 0)}` : ''],
      ['목표가 괴리', pct(r.tgt_upside, 0), (r.n_analysts ? `애널리스트 ${r.n_analysts}명 평균` : '') + (r.tgt_upside > 60 ? ' · 급락 뒤 목표가 조정 지연 가능' : '')],
      r.earn_next && r.earn_next > D.asof ? ['다음 실적 발표', r.earn_next.replace(/-/g, '.'), 'Yahoo 일정 기준'] : ['최근 실적 발표', r.earn_next ? r.earn_next.replace(/-/g, '.') : '—', '다음 일정 미정'],
    ];
    const grid = el('div', 'dt-grid'); cells.forEach(([b, s, sm]) => { const d = el('div'); d.append(el('b', null, b), el('span', null, s), el('small', null, sm)); grid.append(d); }); body.append(grid);
    void fx;

    const two = el('div', 'two'); two.style.marginTop = '16px';
    const unitWord = r.annual_unit.replace('백만', '').trim();
    const bigDiv = r.cur === 'KRW' ? [1e6, '조원'] : r.cur === 'JPY' ? [1e6, '조엔'] : r.cur === 'INR' ? [1e5, '천억 루피'] : r.cur === 'TRY' ? [1e3, '십억 리라'] : r.cur === 'SEK' || r.cur === 'NOK' ? [1e3, `십억 ${unitWord}`] : [1e3, `십억 ${unitWord}`];
    const c1 = el('article', 'card'); c1.style.background = 'var(--bg)'; c1.append(el('h3', null, `연간 매출 (${bigDiv[1]})`)); const h1 = el('div', 'chart'); c1.append(h1);
    const c2 = el('article', 'card'); c2.style.background = 'var(--bg)'; c2.append(el('h3', null, '연간 영업이익률 (%)')); const h2 = el('div', 'chart'); c2.append(h2);
    two.append(c1, c2); body.append(two);
    const fyL = (fy) => (fy.endsWith('-12') ? fy.slice(0, 4) : `FY${fy.slice(2, 4)}.${fy.slice(5)}`);
    requestAnimationFrame(() => {
      vbars(h1, r.annual.map((a) => ({ l: fyL(a.fy), v: a.rev / bigDiv[0] })), { aria: '연간 매출', group: r.group, fmt: (v) => nf(v, v >= 100 ? 0 : 1) });
      vbars(h2, r.annual.map((a) => ({ l: fyL(a.fy), v: a.opm })), { aria: '연간 영업이익률', group: r.group, line: true, fmt: (v) => nf(v) + '%' });
    });
    const an = el('p', 'note'); an.textContent = `${r.annual_unit} 단위 원자료를 환산했습니다. 출처: ${r.fin_override ? '회사 결산 자료' : 'Yahoo Finance 연간 재무'}.`; body.append(an);

    if (r.seg) {
      const sc = el('article', 'card'); sc.style.cssText = 'background:var(--bg);margin-top:16px';
      sc.append(el('h3', null, `${r.seg.name} 분기 실적 (IR)`));
      const h = el('div', 'chart'); sc.append(h); body.append(sc);
      requestAnimationFrame(() => vbars(h, r.seg.quarters.map((q2) => ({ l: q2.q, v: q2.rev / 1e4 })), { aria: '부문 분기 매출', group: r.group, fmt: (v) => nf(v, 2) }));
      const p = el('p', 'note'); p.textContent = `막대 값은 분기 매출(조원). 최근 4개 분기 영업이익률 ${r.seg.opm == null ? '미공개' : nf(r.seg.opm) + '%'}, 수출 비중 ${r.seg.export_pct == null ? '—' : nf(r.seg.export_pct) + '%'}.`; sc.append(p);
    }

    const sec = (title, content, src) => { const d = el('div', 'dt-sec'); d.append(el('h3', null, title)); if (typeof content === 'string') d.append(el('p', null, content)); else d.append(content); if (src) { const s = el('div', 'srcs'); s.append(link(src, '출처')); d.append(s); } body.append(d); };
    if (r.kdefense_overlap) sec('K방산과 어디서 맞붙나', r.kdefense_overlap);
    if (r.systems?.length) { const d = el('div', 'srcs'); d.style.fontSize = '13px'; r.systems.forEach((s) => { const a = el('a', null, SYS[s] + ' 페이지 →'); a.href = `../${s}/`; d.append(a); }); sec(r.group === 'kr' ? '관련 무기체계 페이지' : '관련 K방산 무기체계 페이지', d); }
    if (r.recent_quarter) { const q2 = r.recent_quarter; sec(`최근 실적 (${q2.label})`, `${q2.highlight || ''} 매출 ${nf(q2.revenue, q2.revenue > 100 ? 0 : 2)} ${q2.revenue_unit}${q2.yoy_revenue_growth_pct != null ? `(전년 대비 ${pct(q2.yoy_revenue_growth_pct)})` : ''}${q2.op_margin_pct != null ? `, 이익률 ${nf(q2.op_margin_pct)}%${q2.op_margin_note ? '(' + q2.op_margin_note + ')' : ''}` : ''}.`, q2.source_url); }
    if (r.kr_3q26) sec('3분기 잠정실적 반영', `Yahoo 재무에 아직 없는 3Q26 매출 ${jo(r.kr_3q26.rev / 1e6)}원, 영업이익 ${nf(r.kr_3q26.op / 100, 0)}억원을 최근 4개 분기 합산에 넣었습니다.`, r.kr_3q26.src);
    if (r.eps) {
      const u = r.eps_unit === 'KRW' ? '원' : ` ${r.eps_unit}`; const f = (v) => (v == null ? '없음' : nf(v, v >= 100 ? 0 : 2) + u);
      const wtxt = (w) => (w ? Object.entries(w).map(([k, x]) => `FY${k.slice(2)} ${Math.round(x * 100)}%`).join('·') : '');
      sec('컨센서스 EPS와 PER', `FY26E ${f(r.eps['2026'])}(PER ${mult(r.per_fy['2026'])}) → FY27E ${f(r.eps['2027'])}(${mult(r.per_fy['2027'])}) → FY28E ${f(r.eps['2028'])}(${mult(r.per_fy['2028'])}). 12M Fwd EPS ${f(r.eps_12m)} [${wtxt(r.w12)}] → ${mult(r.per_12m)}, 24M Fwd 연평균 EPS ${f(r.eps_24m)} [${wtxt(r.w24)}] → ${mult(r.per_24m)}. Trailing PER ${mult(r.pe)}. 출처: ${r.est_src}${r.fye === 3 ? ' · 3월 결산이라 FY26은 2027년 3월 결산' : ''}.`, r.est_url);
    }
    if (r.fy_guidance) sec('회사 가이던스', r.fy_guidance, r.fy_guidance_source_url);
    if (r.backlog) sec('수주잔고', `${r.backlog.label} ${r.backlog_def_krw_jo || r.backlog_total_krw_jo ? jo(r.backlog_def_krw_jo || r.backlog_total_krw_jo) + '원' : '미공개'} (${r.backlog.asof}). ${r.backlog.note || ''}`, r.backlog.source_url);
    else if (r.backlog_local) sec('수주잔고', `${r.backlog_local} (${r.backlog_asof})${r.backlog_yoy != null ? `, 1년 전(${r.backlog_prev_asof}) 대비 ${pct(r.backlog_yoy, 0)}` : ''}.${r.backlog_seg ? ` 이 중 ${r.backlog_seg.segment} 부문 ${r.backlog_seg.value} ${r.backlog_seg.unit}.` : ''}`, r.backlog_src);
    if (r.defense_share_pct) { const ds = String(r.defense_share_pct); const m2 = ds.match(/^~?([\d.\-+]+)\+?\s*(\((.*)\))?/); sec('방산 비중', m2 ? `약 ${m2[1].replace(/\+$/, '')}%${m2[3] ? ' · ' + m2[3] : ''}` : ds, r.defense_share_source_url); }
    if (r.key_programs) { const ul = el('ul', 'guide'); r.key_programs.forEach((k) => ul.append(el('li', null, k))); sec('주요 프로그램', ul); }
    if (r.notes) sec('2026년 주목할 점', r.notes, r.notes_source_url);
  }

  // ── K방산 경쟁 관계 지도 ──
  (function () {
    const box = $('sysmap');
    Object.entries(SYS).forEach(([k, name]) => {
      const d = el('div'); const h = el('h3'); const a = el('a', null, name + ' →'); a.href = `../${k}/`; h.append(a); d.append(h);
      const krs = ROWS.filter((r) => r.group === 'kr' && r.systems.includes(k));
      const fs = ROWS.filter((r) => r.group !== 'kr' && r.systems.includes(k));
      const mk = (label, arr) => { const w = el('div'); w.append(el('div', 'note', label)); const c = el('div', 'chips2'); arr.forEach((r) => { const b = el('button'); b.type = 'button'; const i = el('i', 'gdot'); i.style.background = GC(r.group); b.append(i, r.short); b.title = r.name; b.addEventListener('click', () => openCompany(r.t)); c.append(b); }); w.append(c); return w; };
      d.append(mk('국내 상장사', krs), mk('해외 상장 경쟁·협력사', fs));
      const best = fs.map((r) => ({ r, s: (r.kdefense_overlap || '').split(/(?<=[.다])\s/).find((x) => x.includes(name.replace(' 자주포', '').replace(' 전차', '').replace(' 보병전투차', ''))) })).filter((x) => x.s).sort((a, b) => a.s.length - b.s.length).slice(0, 2);
      best.forEach((x) => d.append(el('p', 'note', `${x.r.short}: ${x.s}`)));
      box.append(d);
    });
  })();

  // ── 읽는 법 ──
  const gl = [
    ['Trailing PER', '주가 ÷ 직전 4개 분기(최근 12개월) 실제 주당순이익. 이미 나온 실적 기준이라 확정적이지만, 이익이 빠르게 늘거나 일회성 손익이 있으면 왜곡됩니다.'],
    ['12M Fwd PER', '주가 ÷ 앞으로 12개월 컨센서스 EPS. 회계연도별 EPS를 겹치는 기간만큼 가중합니다. 11월 5일 기준 12월 결산 회사는 FY26 16%·FY27 84%, 3월 결산 회사는 FY26(2027.3) 40%·FY27 60%입니다. 연도가 바뀔 때 숫자가 갑자기 뛰지 않아 셀사이드에서 가장 많이 씁니다.'],
    ['24M Fwd PER', '주가 ÷ 앞으로 24개월 연평균 컨센서스 EPS(12월 결산: FY26 8%·FY27 50%·FY28 42%). 이익이 빠르게 느는 회사를 한 해 더 멀리 보고 평가할 때 씁니다.'],
    ['FY26E·FY27E·FY28E PER', '주가 ÷ 해당 회계연도 컨센서스 EPS. 국내는 지배주주 EPS(네이버증권·와이즈리포트), 해외는 FactSet 조정 EPS(MarketWatch·finanzen.net) 또는 Yahoo 컨센서스입니다. 3월 결산(미쓰비시중공·HAL·BEL)의 FY26은 2027년 3월 결산입니다.'],
    ['EV/EBITDA·EV/EBIT', '기업가치(시가총액 + 순차입금) ÷ 영업 현금이익 또는 영업이익. 부채 구조가 다른 회사를 비교할 때 PER보다 공정합니다. EV/EBIT은 이 페이지에서 최근 4개 분기 영업이익으로 직접 계산했습니다.'],
    ['잔고 배수', '수주잔고 ÷ 최근 4개 분기 매출. 지금 받아 둔 일감이 몇 년 치 매출인지 보여 줍니다. 방산은 인도까지 수년이 걸려 3~5년이 흔합니다.'],
    ['달러 환산 수익률', '각 월말 환율로 주가를 달러로 바꿔 계산했습니다. 해외 투자자가 실제로 느끼는 수익률에 가깝고, 원화 약세 구간에는 국내 종목 수익률이 더 낮게 나옵니다.'],
    ['고점 대비', '2021년 12월 이후 월말 종가 중 최고가 대비 현재가(현지통화). 일중 고점이 아니라 월말 기준이라 실제 고점 대비 낙폭보다 작게 나올 수 있습니다.'],
    ['목표가 괴리', '애널리스트 평균 목표가 ÷ 현재가 − 1. 주가가 급락한 직후에는 목표가 조정이 늦어 크게 나옵니다.'],
  ];
  $('glossary').replaceChildren(...gl.map(([h, p]) => { const d = el('div'); d.append(el('strong', null, h), el('p', null, p)); return d; }));
  const cv = [
    ['한화에어로스페이스', '2025년부터 한화오션을 연결 반영해 회사 전체 매출·이익에 조선이 섞여 있고, 2025년 매출 성장률(+138%)도 편입 효과입니다. 방산은 지상방산 부문 표로 보세요.'],
    ['한화오션', '매출 대부분이 상선입니다. 잔고 배수는 특수선(방산) 잔고 54.8억 달러 ÷ 특수선 매출로 계산했습니다.'],
    ['국내 3분기 실적', 'Yahoo 재무는 2분기까지만 반영돼 있어, 10월 말 발표된 3Q26 잠정실적(매출·영업이익)을 직접 넣어 최근 4개 분기를 다시 계산했습니다. LIG D&A는 3분기 실적 발표 전이라 2분기까지입니다. 순이익 기반 PER은 2분기까지 4개 분기 기준입니다.'],
    ['미쓰비시중공업', 'Yahoo 연간 재무의 연도 표기가 회사 공시와 어긋나 2025년도 결산단신 수치로 바꿨습니다. 방산·우주 부문은 매출의 약 5분의 1입니다.'],
    ['BAE시스템즈', '런던 상장 주가는 펜스(p) 단위, 재무는 파운드 단위라 환산 때 따로 처리했습니다.'],
    ['아셀산', '튀르키예 리라 고인플레이션으로 현지통화 수익률·매출 성장률이 부풀려 보입니다. 달러 환산으로 비교하세요.'],
    ['엘빗·HAL·ST엔지니어링', '3분기(또는 반기) 실적이 아직 나오지 않았거나 반기 실적만 내는 회사는 직전 공시 기준입니다. 기업별 상세에 기준 시점을 적었습니다.'],
    ['멀티플 출처', 'Trailing PER·EV/EBITDA·PBR·목표가는 Yahoo Finance 집계, 연도별·12M·24M Fwd PER은 회사별 컨센서스 EPS로 직접 계산했습니다(기업별 상세에 EPS 출처 링크). 이전에 표에 있던 \'예상 PER\'(Yahoo)은 확인해 보니 다음 회계연도(FY27) EPS 기준이라 FY27E PER과 같습니다.'],
    ['컨센서스 범위', '사브·다쏘·콩스베르그·아셀산·HAL·BEL은 무료로 확인 가능한 컨센서스가 2개 연도뿐이라 FY28E와 24M Fwd가 비어 있습니다. 국내 컨센서스는 주가 급락 뒤 하향 조정이 늦을 수 있습니다.'],
  ];
  $('caveats').replaceChildren(...cv.map(([b, t]) => { const li = el('li'); li.append(el('b', null, b + ': '), t); return li; }));

  // ── 엑셀 원자료 다운로드 ──
  if (window.XL) {
    const T = window.XL.table; const day = D.asof.replace(/-/g, '');
    const fname = (x) => `K-Defense_Peer_${x}_${day}`;
    const card = (id) => $(id)?.closest('article.card');
    const SRC = [['항목', '내용'], ['기준일', D.asof], ['시세·멀티플·재무', D.source], ['컨센서스 EPS', D.est_note], ['회계연도 규칙', D.est_rule], ['12M·24M Fwd 계산', '오늘부터 12(24)개월 구간에 각 회계연도가 겹치는 날짜 비율로 컨센서스 EPS를 가중한 연평균 EPS로 주가를 나눔'], ['멀티플 분기 이력', D.hist_source], ['이력 정리 규칙', D.hist_note], ['환율', D.fx.note], ['수주잔고·가이던스', '각 사 IR·실적 보도자료·언론 보도 (회사별 출처 열 참고)'], ['국내 방산 부문', '각 사 IR 실적발표 자료'], ['주의', '투자 권유가 아닌 공부용 자료. 데이터 제공처마다 수치가 다를 수 있음']];
    const srcSheet = { name: '출처·설명', rows: SRC };
    const coCols = [['t', '티커'], ['name', '회사'], [(r) => GL[r.group], '지역'], ['country', '국가'], ['focus', '주력 분야'], ['cur', '통화'], ['px', '현재가(현지통화)'],
      ['mcap_krw_jo', '시가총액(조원)'], ['mcap_usd_bn', '시가총액($bn)'], ['ev_usd_bn', 'EV($bn)'], ['pe', 'Trailing PER'], [(r) => r.pe_src, 'Trailing PER 계산 기준'], ['per_12m', '12M Fwd PER'], ['per_24m', '24M Fwd PER'], [(r) => r.per_fy?.['2026'], 'FY26E PER'], [(r) => r.per_fy?.['2027'], 'FY27E PER'], [(r) => r.per_fy?.['2028'], 'FY28E PER'], ['eps_unit', 'EPS 통화'], [(r) => r.eps?.['2026'], 'FY26E EPS'], [(r) => r.eps?.['2027'], 'FY27E EPS'], [(r) => r.eps?.['2028'], 'FY28E EPS'], ['eps_12m', '12M Fwd EPS'], ['eps_24m', '24M Fwd EPS(연평균)'], ['eps_cagr', 'EPS CAGR FY26→28(%)'], [(r) => (r.fye === 3 ? '3월' : '12월'), '결산월'], ['est_src', 'EPS 컨센서스 출처'], ['est_url', 'EPS 출처 링크'], ['fpe', '(참고) Yahoo Forward PER=FY27'], ['ev_ebitda', 'EV/EBITDA'], ['ev_ebit', 'EV/EBIT(계산)'], ['pb', 'PBR'], ['ev_sales', 'EV/매출'], ['dy', '배당수익률(%)'], ['tgt_upside', '목표가 괴리(%)'], ['n_analysts', '애널리스트 수'],
      ['ttm_label', '최근 4개 분기 기준'], ['rev_ttm_krw_jo', '매출 4개 분기(조원)'], ['rev_ttm_usd_bn', '매출 4개 분기($bn)'], ['opm_ttm', '영업이익률(%)'], ['npm', '순이익률(%)'], ['fy_last', '최근 회계연도'], ['rev_g_fy', '회계연도 매출 성장(%)'], ['rev_cagr3', '3년 매출 CAGR(%)'],
      ['backlog_usd_bn', '수주잔고($bn)'], [(r) => r.backlog_local || (r.backlog_def_krw_jo || r.backlog_total_krw_jo ? (r.backlog_def_krw_jo || r.backlog_total_krw_jo) + ' 조원' : null), '수주잔고(원 단위)'], ['backlog_label', '잔고 범위'], ['backlog_asof', '잔고 기준'], ['backlog_yoy', '잔고 1년 증가(%)'], ['coverage', '잔고 배수(년)'], ['coverage_basis', '잔고 배수 계산'], ['defense_share_pct', '방산 비중'], ['backlog_src', '잔고 출처']];
    const retCols = (key) => [['t', '티커'], ['name', '회사'], [(r) => GL[r.group], '지역'], ...D.periods.map((pp) => [(r) => r[key][pp.k], `${pp.label}(%) · ${pp.basis}`]), ['from_high', '고점 대비(%)'], ['high_month', '고점 월']];
    const priceSheet = (key, nm) => ({ name: nm, rows: [['월말', ...ROWS.map((r) => `${r.short} (${r.t})`)], ...D.months.map((m, i) => [i === D.months.length - 1 ? '2026-11-05' : m, ...ROWS.map((r) => (r[key][i] == null ? null : +r[key][i].toPrecision(6)))])] });
    const histSheet = (k) => ({ name: `추이_${MH[k].replace('/', '÷')}`, rows: [['분기', ...ROWS.map((r) => `${r.short} (${r.t})`)], ...D.hq.map((q, i) => [q === 'NOW' ? '2026-11-05' : `20${q.slice(0, 2)}-${q.slice(2)}`, ...ROWS.map((r) => (r.hist ? r.hist[k][i] : null))])] });
    const medSheet = () => ({ name: '추이_지역 중앙값', rows: [['분기', ...D.groups.flatMap((g) => Object.keys(MH).map((k) => `${g.label} ${MH[k]}`))], ...D.hq.map((q, i) => [q === 'NOW' ? '2026-11-05' : `20${q.slice(0, 2)}-${q.slice(2)}`, ...D.groups.flatMap((g) => Object.keys(MH).map((k) => st[g.k].hist[k][i]))])] });
    const grpSheet = () => ({ name: '지역 중앙값', rows: [['지역', '회사 수', 'Trailing PER', '12M Fwd PER', '24M Fwd PER', 'FY26E PER', 'FY27E PER', 'FY28E PER', 'EPS CAGR FY26→28(%)', 'EV/EBITDA', 'EV/EBIT', '영업이익률(%)', 'FY 매출 성장(%)', '3년 CAGR(%)', '잔고 배수(년)', ...D.periods.map((pp) => `${pp.label} 수익률(달러, %)`), '고점 대비(%)', '시총 합계($bn)'],
      ...D.groups.map((g) => { const x = st[g.k]; return [g.label, x.n, x.pe, x.per_12m, x.per_24m, x.per_fy['2026'], x.per_fy['2027'], x.per_fy['2028'], x.eps_cagr, x.ev_ebitda, x.ev_ebit, x.opm_ttm, x.rev_g_fy, x.rev_cagr3, x.coverage, ...D.periods.map((pp) => x.ret[pp.k]), x.from_high, x.mcap_usd_bn]; })] });
    const annualSheet = () => ({ name: '연간 실적', rows: T(ROWS.flatMap((r) => r.annual.map((a) => ({ t: r.t, name: r.name, unit: r.annual_unit, fy: a.fy, rev: a.rev, op: a.op, ni: a.ni, opm: a.opm, src: r.fin_override ? r.fin_override.src : 'Yahoo Finance' }))), [['t', '티커'], ['name', '회사'], ['unit', '단위'], ['fy', '회계연도 말'], ['rev', '매출'], ['op', '영업이익'], ['ni', '순이익'], ['opm', '영업이익률(%)'], ['src', '출처']]) });
    const segSheet = () => ({ name: '국내 방산 부문 분기', rows: T(ROWS.filter((r) => r.seg).flatMap((r) => r.seg.quarters.map((q) => ({ t: r.t, name: r.name, seg: r.seg.name, q: q.q, rev: q.rev, op: q.op, opm: q.opm, ex: q.ex }))), [['t', '티커'], ['name', '회사'], ['seg', '부문'], ['q', '분기'], ['rev', '매출(억원)'], ['op', '영업이익(억원)'], ['opm', '영업이익률(%)'], ['ex', '수출 비중(%)']]) });
    const segSum = () => ({ name: '국내 방산 부문 요약', rows: T(ROWS.filter((r) => r.seg), [['t', '티커'], ['name', '회사'], [(r) => r.seg.name, '부문'], [(r) => r.seg.label, '기간'], [(r) => r.seg.rev_eok, '부문 매출(억원)'], [(r) => r.seg.op_eok, '부문 영업이익(억원)'], [(r) => r.seg.opm, '부문 영업이익률(%)'], [(r) => r.seg.export_pct, '수출 비중(%)'], [(r) => r.backlog_def_krw_jo || r.backlog_total_krw_jo, '부문 수주잔고(조원)'], ['backlog_asof', '잔고 기준'], ['coverage', '잔고 배수(년)'], ['opm_ttm', '회사 전체 영업이익률(%)']]) });
    const qualSheet = () => ({ name: '가이던스·경쟁 관계', rows: T(ROWS, [['t', '티커'], ['name', '회사'], [(r) => GL[r.group], '지역'], [(r) => (r.systems || []).map((x) => SYS[x]).join(', '), '관련 K방산 체계'], ['kdefense_overlap', 'K방산과 맞붙는 지점'], ['key_programs', '주요 프로그램'], ['fy_guidance', '가이던스'], ['fy_guidance_source_url', '가이던스 출처'], [(r) => r.recent_quarter?.label, '최근 실적 기간'], [(r) => r.recent_quarter?.highlight, '최근 실적 요약'], [(r) => r.recent_quarter?.source_url, '최근 실적 출처'], ['notes', '2026년 주목할 점'], ['notes_source_url', '출처'], ['note', '데이터 메모']]) });
    const mapSheet = () => ({ name: '체계별 경쟁사', rows: [['무기체계', '페이지', '국내 상장사', '해외 상장 경쟁·협력사'], ...Object.entries(SYS).map(([k, nm]) => [nm, `https://shsm1111-hash.github.io/K-Defense/${k}/`, ROWS.filter((r) => r.group === 'kr' && r.systems.includes(k)).map((r) => r.name).join(', '), ROWS.filter((r) => r.group !== 'kr' && r.systems.includes(k)).map((r) => `${r.name}(${r.t})`).join(', ')])] });
    const coSheet = () => ({ name: '회사별 지표', rows: T(ROWS, coCols) });

    window.XL.attach(card('grp-tbl'), fname('지역중앙값'), () => [grpSheet(), coSheet(), srcSheet]);
    window.XL.attach(card('rank-chart'), () => fname('수익률'), () => [{ name: '수익률(달러)', rows: T(ROWS, retCols('ret_usd')) }, { name: '수익률(현지통화)', rows: T(ROWS, retCols('ret')) }, srcSheet]);
    window.XL.attach(card('line-chart'), fname('월말주가'), () => [priceSheet('series', '월말 주가(현지통화)'), priceSheet('series_usd', '월말 주가(달러 환산)'), { name: '통화', rows: T(ROWS, [['t', '티커'], ['name', '회사'], ['cur', '통화']]) }, srcSheet]);
    window.XL.attach(card('ret-tbl'), fname('기간별수익률'), () => [{ name: '수익률(달러)', rows: T(ROWS, retCols('ret_usd')) }, { name: '수익률(현지통화)', rows: T(ROWS, retCols('ret')) }, srcSheet]);
    window.XL.attach(card('mh-chart'), fname('멀티플추이'), () => [medSheet(), ...Object.keys(MH).map(histSheet), srcSheet]);
    window.XL.attach(card('sc-chart'), fname('멀티플_성장_이익률'), () => [coSheet(), srcSheet]);
    window.XL.attach(card('val-tbl'), fname('밸류에이션'), () => [coSheet(), grpSheet(), srcSheet]);
    window.XL.attach(card('cov-chart'), fname('수주잔고배수'), () => [coSheet(), segSum(), srcSheet]);
    window.XL.attach(card('earn-tbl'), fname('실적_수주잔고'), () => [coSheet(), annualSheet(), srcSheet]);
    window.XL.attach(card('seg-tbl'), fname('국내방산부문'), () => [segSum(), segSheet(), srcSheet]);
    window.XL.attach(card('sysmap'), fname('체계별경쟁사'), () => [mapSheet(), qualSheet(), srcSheet]);
    // 기업별 상세: 지금 고른 회사 한 곳
    const detailCard = card('dt-body');
    window.XL.attach(detailCard, () => fname(`기업_${BY[cur].short}`), () => {
      const r = BY[cur];
      const kv = [['항목', '값'], ...coCols.map(([k, h]) => [h, typeof k === 'function' ? k(r) : r[k]]), ['가이던스', r.fy_guidance], ['K방산과 맞붙는 지점', r.kdefense_overlap], ['주요 프로그램', (r.key_programs || []).join(' · ')], ['2026년 주목할 점', r.notes], ['데이터 메모', [r.note, r.fin_override?.note].filter(Boolean).join(' ')]];
      const sheets = [{ name: '요약', rows: kv },
        { name: '연간 실적', rows: T(r.annual, [['fy', '회계연도 말'], ['rev', `매출(${r.annual_unit})`], ['op', '영업이익'], ['ni', '순이익'], ['opm', '영업이익률(%)']]) },
        { name: '월말 주가', rows: [['월말', `주가(${r.cur})`, '주가(달러 환산)'], ...D.months.map((m, i) => [i === D.months.length - 1 ? '2026-11-05' : m, r.series[i], r.series_usd[i] == null ? null : +r.series_usd[i].toPrecision(6)])] }];
      if (r.hist) sheets.push({ name: '멀티플 추이', rows: [['분기', ...Object.values(MH)], ...D.hq.map((q, i) => [q === 'NOW' ? '2026-11-05' : `20${q.slice(0, 2)}-${q.slice(2)}`, ...Object.keys(MH).map((k) => r.hist[k][i])])] });
      if (r.seg) sheets.push({ name: `${r.seg.name} 분기`, rows: T(r.seg.quarters, [['q', '분기'], ['rev', '매출(억원)'], ['op', '영업이익(억원)'], ['opm', '영업이익률(%)'], ['ex', '수출 비중(%)']]) });
      sheets.push(srcSheet); return sheets;
    }, '이 회사 엑셀');
    // 머리말: 전체 데이터 한 번에
    const all = el('div', 'xl-all');
    all.append(window.XL.button(() => [coSheet(), grpSheet(), { name: '수익률(달러)', rows: T(ROWS, retCols('ret_usd')) }, { name: '수익률(현지통화)', rows: T(ROWS, retCols('ret')) }, priceSheet('series', '월말 주가(현지통화)'), priceSheet('series_usd', '월말 주가(달러)'), medSheet(), ...Object.keys(MH).map(histSheet), annualSheet(), segSum(), segSheet(), qualSheet(), mapSheet(), srcSheet], fname('전체'), '전체 데이터 엑셀로 받기'), el('span', 'note', '28개사 지표·주가·멀티플 추이·실적·출처를 시트별로 담은 파일'));
    $('glegend').after(all);
  }

  // ── 그리기 (보이는 탭만, 창 크기 바뀌면 다시) ──
  function drawVisible() {
    const v = document.querySelector('section.page:not(.hidden)')?.id;
    if (v === 'summary') drawRank();
    if (v === 'price') drawLine();
    if (v === 'valuation') { drawMult(); drawScatter(); }
    if (v === 'earnings') drawCov();
    if (v === 'company') drawDetail();
  }
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(drawVisible, 150); });
  const [start, tk] = decodeURIComponent(location.hash.slice(1)).split('/');
  if (start === 'company' && BY[tk]) { cur = tk; selBox.value = tk; }
  showTab(tabs.some((a) => a.dataset.tab === start) ? start : 'summary');
})();
