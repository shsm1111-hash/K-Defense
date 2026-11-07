/* 방문자 수 배너 — 오늘(한국 시간)·누적 방문.
 * 카운터: Abacus(https://abacus.jasoncameron.dev, 가입 없는 공개 카운터 API).
 * 방문 = 같은 브라우저에서 30분 넘게 쉬었다가 다시 들어오면 1회.
 * 사이트 주인은 주소 끝에 ?owner=1 을 한 번 붙여 열면 그 브라우저의 방문은 세지 않는다(?owner=0 으로 해제). */
(function () {
  const API = 'https://abacus.jasoncameron.dev';
  const NS = 'shsm1111-k-defense';
  const GAP = 30 * 60 * 1000;
  const ls = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* 저장 불가 브라우저 */ } }, del: (k) => { try { localStorage.removeItem(k); } catch (e) { /* 무시 */ } } };

  const q = new URLSearchParams(location.search);
  if (q.get('owner') === '1') ls.set('kd_owner', '1');
  if (q.get('owner') === '0') ls.del('kd_owner');
  const owner = ls.get('kd_owner') === '1';

  const kst = new Date(Date.now() + 9 * 3600 * 1000);
  const day = kst.toISOString().slice(0, 10).replace(/-/g, '');
  const keys = { total: 'visits-total', today: `visits-d${day}` };

  const now = Date.now();
  const last = +(ls.get('kd_last') || 0);
  const isNew = !owner && now - last > GAP;
  if (!owner) ls.set('kd_last', String(now));

  const css = `.kd-visits{position:fixed;right:16px;bottom:16px;z-index:50;display:flex;gap:14px;align-items:center;padding:8px 14px;border-radius:999px;background:var(--panel,#fff);border:1px solid var(--line,#ddd);box-shadow:0 2px 10px rgba(0,0,0,.08);font:500 13px/1.2 Pretendard,system-ui,sans-serif;color:var(--ink-2,#555);font-variant-numeric:tabular-nums}
.kd-visits b{color:var(--ink,#111);font-weight:700;margin-left:4px}
.kd-visits .kd-sep{width:1px;height:12px;background:var(--line,#ddd)}
.kd-visits .kd-me{font-size:11px;color:var(--accent,#556b2f)}
@media (max-width:640px){.kd-visits{right:10px;bottom:10px;padding:6px 11px;font-size:12px;gap:10px}}
@media print{.kd-visits{display:none}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.append(st);

  const box = document.createElement('div');
  box.className = 'kd-visits';
  box.setAttribute('role', 'status');
  box.title = '방문 수: 같은 브라우저에서 30분 넘게 쉬었다가 다시 들어오면 1회로 셉니다. 오늘은 한국 시간 기준이고, 사이트 운영자의 방문은 빼고 셉니다.';
  const part = (label) => { const s = document.createElement('span'); s.append(label); const b = document.createElement('b'); b.textContent = '…'; s.append(b); return [s, b]; };
  const [sToday, bToday] = part('오늘');
  const [sTotal, bTotal] = part('누적');
  const sep = document.createElement('i'); sep.className = 'kd-sep';
  box.append(sToday, sep, sTotal);
  if (owner) { const me = document.createElement('span'); me.className = 'kd-me'; me.textContent = '내 방문 제외 중'; box.append(me); }

  const nf = (v) => Number(v).toLocaleString('ko-KR');
  const call = (mode, key) => fetch(`${API}/${mode}/${NS}/${key}`, { cache: 'no-store' })
    .then((r) => (r.status === 404 ? { value: 0 } : r.ok ? r.json() : Promise.reject(r.status)))
    .then((j) => j.value);
  const mode = isNew ? 'hit' : 'get';

  const start = () => {
    document.body.append(box);
    Promise.all([call(mode, keys.today), call(mode, keys.total)])
      .then(([t, a]) => { bToday.textContent = nf(t); bTotal.textContent = nf(a); })
      .catch(() => { box.remove(); });
  };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
