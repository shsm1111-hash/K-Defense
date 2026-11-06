// 엑셀(.xlsx) 원자료 다운로드 공용 모듈
// 사용: XL.attach(cardElement, '파일이름', () => [{ name: '시트', rows: [[헤더...], [값...]] }, ...])
(function () {
  const LIB = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
  let loading = null;
  const load = () => {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (!loading) loading = new Promise((res, rej) => { const s = document.createElement('script'); s.src = LIB; s.onload = () => res(window.XLSX); s.onerror = () => { loading = null; rej(new Error('엑셀 라이브러리를 불러오지 못했습니다')); }; document.head.append(s); });
    return loading;
  };
  const clean = (v) => {
    if (v == null) return null;
    if (typeof v === 'number' || typeof v === 'boolean') return v;
    if (Array.isArray(v)) return v.map((x) => (x && typeof x === 'object' ? JSON.stringify(x) : x)).join(' · ');
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  };
  // 객체 배열 → [헤더, ...행]. cols 를 주면 [키, 헤더] 순서대로, 없으면 모든 키를 처음 나온 순서로
  function table(list, cols) {
    list = list || [];
    if (!cols) { const seen = []; list.forEach((o) => Object.keys(o || {}).forEach((k) => { if (!seen.includes(k)) seen.push(k); })); cols = seen.map((k) => [k, k]); }
    return [cols.map((c) => c[1]), ...list.map((o) => cols.map(([k]) => clean(typeof k === 'function' ? k(o) : o?.[k])))];
  }
  async function download(name, sheets) {
    const X = await load();
    const wb = X.utils.book_new();
    const used = new Set();
    sheets.filter((s) => s && s.rows && s.rows.length).forEach((s) => {
      let nm = String(s.name).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Sheet';
      let i = 2; while (used.has(nm)) nm = (String(s.name).slice(0, 28) + ' ' + i++);
      used.add(nm);
      const ws = X.utils.aoa_to_sheet(s.rows.map((r) => r.map(clean)));
      // 열 너비: 내용 길이 기준(최대 60자)
      const w = []; s.rows.forEach((r) => r.forEach((v, j) => { const n = v == null ? 0 : String(v).length; w[j] = Math.min(60, Math.max(w[j] || 6, n + 2)); }));
      ws['!cols'] = w.map((x) => ({ wch: x }));
      if (s.rows.length > 1) ws['!autofilter'] = { ref: X.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: s.rows.length - 1, c: Math.max(0, s.rows[0].length - 1) } }) };
      X.utils.book_append_sheet(wb, ws, nm);
    });
    X.writeFile(wb, name.replace(/[\\/:*?"<>|]/g, ' ') + '.xlsx');
  }
  function button(getSheets, fileName, label) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'xl-btn'; b.title = '이 칸의 원자료를 엑셀(.xlsx)로 받기';
    b.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M8 2v8m0 0L5 7m3 3 3-3M3 12.5h10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span></span>';
    b.querySelector('span').textContent = label || '엑셀';
    b.addEventListener('click', async () => {
      const old = b.querySelector('span').textContent; b.disabled = true; b.querySelector('span').textContent = '만드는 중…';
      try { const fn = typeof fileName === 'function' ? fileName() : fileName; await download(fn, getSheets()); }
      catch (e) { console.error(e); b.title = e.message || String(e); b.querySelector('span').textContent = '실패 · 다시 시도'; setTimeout(() => { b.querySelector('span').textContent = old; }, 3000); b.disabled = false; return; }
      b.querySelector('span').textContent = old; b.disabled = false;
    });
    return b;
  }
  // 카드 머리에 버튼 붙이기: .card-h 가 있으면 그 안에, 없으면 오른쪽 위
  function attach(card, fileName, getSheets, label) {
    if (!card || card.querySelector(':scope > .xl-btn, :scope > .card-h > .xl-btn')) return;
    const b = button(getSheets, fileName, label);
    const head = card.querySelector(':scope > .card-h');
    if (head) head.append(b); else { card.classList.add('has-xl'); b.classList.add('xl-abs'); card.prepend(b); }
  }
  window.XL = { download, table, button, attach };
})();
