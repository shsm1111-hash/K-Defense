// 무기체계 페이지: 데이터 카드마다 엑셀 원자료 다운로드 버튼
(async function () {
  if (!window.XL) return;
  const D = await fetch(document.body.dataset.data).then((r) => r.json());
  const T = window.XL.table; const M = D.meta || {};
  const name = M.short || M.name || 'system';
  const fname = (x) => `K-Defense_${name}_${x}_${String(D.updated || '').replace(/[^0-9]/g, '')}`;
  const card = (id) => document.getElementById(id)?.closest('article.card');
  const TIER = (r) => r.tier;
  const src = { name: '출처·설명', rows: [['항목', '내용'], ['무기체계', M.name], ['기준일', D.updated], ['신뢰도', '확정=공시·정부 발표 / 보도=언론·리포트 / 추정=계산·추산 / 해설=맥락 설명'], ['실적 출처', D.ir?.source || ''], ['페이지', location.href.split('#')[0]], ['주의', '투자 권유가 아닌 공부용 자료']] };

  const specs = () => ({ name: '제원·규모', rows: T(D.specs, [['group', '구분'], ['item', '항목'], ['value', '값'], ['num', '숫자'], [TIER, '신뢰도']]) });
  const timeline = () => ({ name: '개발 연혁', rows: T(D.timeline, [['date', '시기'], ['category', '분류'], ['title', '내용'], ['detail', '설명'], [TIER, '신뢰도']]) });
  const versions = () => ({ name: '버전별 차이', rows: T(D.versions, [['v', '버전'], ['period', '기간'], ['stage', '단계'], ['crew', '승무원'], ['rof', '발사속도'], ['loading', '장전'], ['fcs', '사격통제·장비'], ['mobility', '기동'], ['weight', '중량'], ['users', '운용'], [TIER, '신뢰도']]) });
  const contracts = () => ({ name: '수출 계약', rows: T(D.contracts, [['id', '번호'], ['date', '계약 시기'], ['country', '국가'], ['variant', '모델'], ['qty', '수량'], ['qty_note', '수량 메모'], ['value_krw_eok', '계약액(억원)'], ['value_orig', '원 표기'], [(r) => (r.unit_comparable && r.value_krw_eok && Number(r.qty) ? Math.round(r.value_krw_eok / Number(r.qty) * 10) / 10 : null), '단가(억원, 계산)'], ['scope', '범위'], [TIER, '신뢰도'], ['source_name', '출처'], ['source_url', '출처 링크']]) });
  const operators = () => ({ name: '수출·운용 국가', rows: T(D.operators, [['country', '국가'], ['region', '지역'], ['local_name', '현지 명칭'], ['first_year', '첫 계약'], ['qty', '수량'], ['qty_note', '수량 메모'], ['mode', '도입 방식'], ['status', '상태'], ['nato', 'NATO'], ['why', '도입 배경'], ['diff', '국가별 차이'], [TIER, '신뢰도']]) });
  const rivals = () => ({ name: '해외 경쟁 체계', rows: T(D.competition?.rivals, [['name', '체계'], ['maker', '제조사'], ['origin', '국가'], ['unit_price', '단가'], ['strengths', '강점'], ['weaknesses', '약점'], ['users', '운용국'], ['status', '상태'], ['vs', '우리 체계와 비교']]) });
  const cases = () => ({ name: '국제 경쟁 사례', rows: T(D.competition?.cases, [['year', '연도'], ['country', '국가'], ['program', '사업'], ['result', '결과'], ['winner', '선정'], ['competitors', '경쟁 체계'], ['value', '규모'], ['reasons', '이유'], ['lesson', '시사점'], [TIER, '신뢰도'], ['source_url', '출처']]) });
  const matrix = () => { const m = D.competition?.matrix; if (!m || !Array.isArray(m.rows)) return null; return { name: '비교표', rows: [['항목', ...(m.systems || [])], ...m.rows.map((r) => [r.axis, ...(r.values || [])])] }; };
  const factors = () => ({ name: '이기는·지는 요인', rows: [['구분', '내용'], ...(D.competition?.win_factors || []).map((x) => ['이기는 요인', x]), ...(D.competition?.loss_factors || []).map((x) => ['지는 요인', x])] });
  const companies = () => ({ name: '관련 기업', rows: T(D.companies, [['name', '회사'], ['ticker', '종목코드'], ['market', '시장'], ['role', '역할'], ['importance', '중요도'], ['parts', '담당 품목'], ['exposure', '체계 관련 수주'], ['exposure_krw_eok', '규모(억원)'], ['why', '투자 포인트'], [TIER, '신뢰도'], ['source_url', '출처']]) });
  const components = () => ({ name: '구성품·생산업체', rows: T(D.components, [['group', '구분'], ['part', '구성품'], ['maker', '생산업체'], ['detail', '설명'], [TIER, '신뢰도']]) });
  const supply = () => ({ name: '상장사 공급망', rows: T(D.supplychain?.listed, [['name', '회사'], ['ticker', '종목코드'], ['market', '시장'], ['tier', '단계'], ['parts', '품목'], ['sensitivity', '실적 민감도'], ['exposure', '비중·규모'], ['benefit', '수혜'], ['risk', '리스크'], ['catalyst', '다음 변수'], ['tier_conf', '신뢰도'], ['source_url', '출처']]) });
  const sRisks = () => ({ name: '공급망 리스크', rows: T(D.supplychain?.system_risks, [['risk', '리스크'], ['detail', '설명'], ['affected', '영향 기업']]) });
  const sCats = () => ({ name: '앞으로 볼 이벤트', rows: T(D.supplychain?.catalysts, [['when', '시기'], ['event', '이벤트'], ['beneficiaries', '관련 기업']]) });
  const ir = () => ({ name: '분기 실적', rows: T(D.ir?.quarters, [['quarter', '분기'], ['basis', '기준'], ['revenue_eok', `매출(${D.ir?.unit || '억원'})`], ['export_eok', '수출 매출'], ['domestic_eok', '내수 매출'], ['other_eok', '기타'], ['export_share_pct', '수출 비중(%)'], ['op_eok', '영업이익'], ['opm_pct', '영업이익률(%)'], ['company_op_eok', '회사 전체 영업이익'], ['ir_doc', '출처 자료'], [TIER, '신뢰도']]) });
  const backlog = () => {
    const b = D.ir?.backlog_q; if (!b) return D.ir?.backlog?.length ? { name: '수주잔고', rows: T(D.ir.backlog) } : null;
    const segs = b.segments || []; const segKey = (sg) => sg.key; const segName = (sg) => sg.label;
    return { name: '분기 수주잔고', rows: [['분기', `합계(${b.unit || ''})`, ...segs.map(segName), '수출 비중(%)', '부문 금액 계산 여부'], ...b.rows.map((r) => [r.period, r.total, ...segs.map((sg) => r.values?.[segKey(sg)] ?? null), r.export_pct, r.calc ? '총액×비중으로 계산' : ''])] };
  };
  const roadmap = () => ({ name: '향후 계획', rows: T(D.roadmap, [['when', '시기'], ['item', '내용'], ['detail', '설명'], ['status', '상태'], [TIER, '신뢰도']]) });
  const pipeline = () => ({ name: '수주 파이프라인', rows: T(D.pipeline, [['country', '국가'], ['opportunity', '사업'], ['scale', '수량·물량'], ['value_krw_eok', '사업 규모(억원)'], ['value_usd_eok', '사업 규모(억달러)'], ['value_basis', '금액 근거'], ['value_note', '금액 메모'], ['stage', '단계'], ['updated', '기준'], ['note', '비고'], [TIER, '신뢰도'], ['source_url', '출처']]) });

  const A = (id, label, fn) => window.XL.attach(card(id), fname(label), () => [...fn().filter(Boolean), src]);
  A('specs', '제원', () => [specs()]);
  A('versions', '버전', () => [versions()]);
  A('timeline', '개발연혁', () => [timeline()]);
  A('opbars', '수출국가', () => [operators(), contracts()]);
  A('swim', '수출타임라인', () => [contracts()]);
  A('contracts', '수출계약', () => [contracts()]);
  A('cp-rivals', '경쟁체계', () => [rivals(), matrix()]);
  A('cp-matrix', '경쟁비교', () => [matrix(), rivals()]);
  A('cp-cases', '경쟁사례', () => [cases(), factors()]);
  A('co-grid', '관련기업', () => [companies()]);
  A('comp-dom', '구성품', () => [components()]);
  A('sc-flow', '공급망', () => [supply(), sRisks(), sCats()]);
  A('sc-list', '공급망', () => [supply(), sRisks(), sCats()]);
  A('sc-risks', '공급망리스크', () => [sRisks(), sCats()]);
  A('unit', '계약단가', () => [contracts()]);
  A('fin', '분기실적', () => [ir()]);
  A('bl-chart', '수주잔고', () => [backlog()]);
  A('road', '향후계획', () => [roadmap()]);
  A('pipeline', '수주파이프라인', () => [pipeline()]);
  // 머리말: 이 체계 전체
  const kp = document.getElementById('kpis');
  if (kp) {
    const box = document.createElement('div'); box.className = 'xl-all';
    const note = document.createElement('span'); note.className = 'note'; note.textContent = '제원·연혁·수출 계약·경쟁·기업·공급망·실적·수주잔고·계획·파이프라인을 시트별로 담은 파일';
    box.append(window.XL.button(() => [specs(), versions(), timeline(), operators(), contracts(), rivals(), matrix(), cases(), factors(), companies(), components(), supply(), sRisks(), sCats(), ir(), backlog(), roadmap(), pipeline(), src].filter(Boolean), fname('전체'), `${name} 전체 데이터 엑셀로 받기`), note);
    kp.before(box);
  }
})();
