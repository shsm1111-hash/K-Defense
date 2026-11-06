"""글로벌 방산 Peer 비교 데이터 생성기.

사용법: python3 tools/peers.py
입력:
  data/peers_market.json      Yahoo Finance 시세·멀티플·재무 (브라우저로 수집, 2026-11-05 종가)
  sysdata/peers/meta.json     회사명·지역·주력 분야·관련 K방산 체계
  sysdata/peers/{us,eu,asia}.json  수주잔고·가이던스·최근 분기·K방산 경쟁 관계 (IR·보도 조사)
  data/*_ir.json              국내 6사 방산 부문 분기 실적 (기존 대시보드 IR 데이터)
출력:
  data/peers.json             peers/index.html 이 읽는 파일
"""
import json
import pathlib
import statistics

ROOT = pathlib.Path(__file__).resolve().parent.parent
D = ROOT / "data"
S = ROOT / "sysdata" / "peers"

mk = json.loads((D / "peers_market.json").read_text(encoding="utf-8"))
meta = json.loads((S / "meta.json").read_text(encoding="utf-8"))
res = {}
for f in ("us.json", "eu.json"):
    for r in json.loads((S / f).read_text(encoding="utf-8")):
        res[r["ticker"]] = r
asia = json.loads((S / "asia.json").read_text(encoding="utf-8"))
for r in asia["peers"]:
    res[r["ticker"]] = r
kr_bl = {r["t"]: r for r in asia["korea_backlog"]}
kr_3q = {r["t"]: r for r in asia["korea_3q26"]}

# ── 환율: 현지통화 1단위 = USD ──
fxq = mk["c"]
KRW = fxq["KRW=X"]["px"]
FX_KEY = {"USD": None, "KRW": "KRW=X", "EUR": "EURUSD=X", "GBp": "GBPUSD=X", "GBP": "GBPUSD=X",
          "SEK": "SEK=X", "NOK": "NOK=X", "JPY": "JPY=X", "TRY": "TRY=X", "INR": "INR=X", "SGD": "SGD=X"}
INVERT = {"KRW", "SEK", "NOK", "JPY", "TRY", "INR", "SGD"}  # 시세가 'USD 1 = X 현지통화'


def usd_per(cur, v=None):
    k = FX_KEY[cur]
    if k is None:
        return 1.0
    x = fxq[k]["px"] if v is None else v
    u = 1 / x if cur in INVERT else x
    return u / 100 if cur == "GBp" else u


# ── 월말 시계열 정리 ──
# Yahoo 월봉 타임스탬프는 '그 달 1일(현지)'이고 종가는 그 달 말 종가다. 수집 때 한 달 앞당겨
# 라벨을 붙였으므로 한 칸 뒤로 밀고, 끝에서 두 번째(11월 미완성 봉, 전일 종가)는 버린다.
raw_months = mk["months"]
months = []
for m in raw_months[:-2]:
    y, mo = map(int, m.split("-"))
    mo += 1
    if mo > 12:
        y, mo = y + 1, 1
    months.append(f"{y}-{mo:02d}")
months.append("2026-11")  # 11/5 종가
assert months[-2] == "2026-10", months[-3:]


def fix(series):
    return series[:-2] + [series[-1]]


fx_m = {k: fix(v["close"]) for k, v in fxq.items() if "=" in k}


def usd_series(cur, closes):
    k = FX_KEY[cur]
    out = []
    for i, c in enumerate(closes):
        if c is None:
            out.append(None)
            continue
        out.append(round(c * (1.0 if k is None else usd_per(cur, fx_m[k][i])), 6))
    return out


def ret(closes, base_month):
    i = months.index(base_month)
    b, e = closes[i], closes[-1]
    if b in (None, 0) or e is None:
        return None
    return round((e / b - 1) * 100, 1)


PERIODS = [("m1", "2026-09", "1개월", "9월 말 대비"),
           ("m3", "2026-07", "3개월", "7월 말 대비"),
           ("ytd", "2025-12", "연초 이후", "2025년 말 대비"),
           ("y1", "2025-10", "1년", "2025년 10월 말 대비"),
           ("y3", "2023-10", "3년", "2023년 10월 말 대비"),
           ("y5", "2021-12", "약 5년", "2021년 12월 말 대비")]


def backlog_usd(b):
    if not b or b.get("value") is None:
        return None
    v, u = b["value"], b["unit"]
    cur = u.split()[0]
    mult = {"bn": 1e9, "tn": 1e12, "crore": 1e7}[u.split()[1]]
    return v * mult * usd_per(cur) / 1e9


def ir_ttm(fname, n=4):
    q = json.loads((D / fname).read_text(encoding="utf-8"))["quarters"][-n:]
    rev = sum(r["revenue_eok"] for r in q)
    ops = [r.get("op_eok") for r in q]
    op = sum(ops) if all(o is not None for o in ops) else None
    ex = [r.get("export_share_pct") for r in q]
    exs = None
    if all(e is not None for e in ex):
        exs = round(sum(r["revenue_eok"] * r["export_share_pct"] for r in q) / rev, 1)
    return {"label": f"{q[0]['quarter']}~{q[-1]['quarter']}", "rev_eok": rev, "op_eok": op,
            "opm": round(op / rev * 100, 1) if op is not None else None, "export_pct": exs,
            "quarters": [{"q": r["quarter"], "rev": r["revenue_eok"], "op": r.get("op_eok"),
                          "opm": r.get("opm_pct"), "ex": r.get("export_share_pct")}
                         for r in json.loads((D / fname).read_text(encoding="utf-8"))["quarters"][-12:]]}


KR_IR = {"012450.KS": ("hanwha_land_ir.json", "지상방산"), "064350.KS": ("rotem_defense_ir.json", "방산(AD&RH)"),
         "047810.KS": ("kai_ir.json", "회사 전체"), "079550.KS": ("lig_ir.json", "회사 전체"),
         "272210.KS": ("hanwha_systems_ir.json", "방산"), "042660.KS": ("hanwhaocean_naval_ir.json", "특수선")}

# Yahoo 재무가 회사 공시와 어긋나는 종목은 공시로 덮어쓴다 (단위: 현지통화 백만)
OVERRIDE = {
    "7011.T": {  # 미쓰비시중공업 2025년도 결산(2026-05-12), 미쓰비시 로지스넥스트 제외 기준. 영업이익 자리는 사업이익
        "annual": [["2024-03", 3955800, 235500, 222000], ["2025-03", 4361100, 354900, 245400],
                   ["2026-03", 4974100, 432200, 332100]],
        "ttm": [5134100, 495100],  # FY25 + 1Q FY26 − 1Q FY25 (1Q FY26 매출 1조 1,942억·사업이익 1,596억, 전년 대비 +1,600억·+629억)
        "ttm_label": "2025.7~2026.6 (회사 공시 계산)",
        "src": "https://www.mhi.com/jp/finance/library/result/pdf/fy20254q/kessan_tansin.pdf",
        "note": "Yahoo 연간 재무의 연도 표기가 회사 공시와 어긋나 결산단신 수치로 바꿨습니다. 영업이익 대신 회사 기준 '사업이익'입니다.",
    },
}

rows = []
for m in meta:
    t = m["t"]
    q = mk["q"][t]
    c = mk["c"][t]
    f = mk["f"][t]
    cur = q["cur"]
    u = usd_per("GBP" if cur == "GBp" else cur)  # BAE는 주가만 펜스, 시가총액·재무는 파운드
    closes = fix(c["close"])
    px = closes[-1]
    r = {k: m.get(k) for k in ("t", "name", "short", "group", "country", "focus", "systems", "note")}
    r["cur"] = cur
    r["px"] = px
    r["mcap_usd_bn"] = round(q["mcap"] * u / 1e9, 2)
    r["mcap_krw_jo"] = round(q["mcap"] * u * KRW / 1e12, 2)
    r["ev_usd_bn"] = round(q["ev"] * u / 1e9, 2) if q.get("ev") else None

    # TTM 매출·영업이익 (국내는 3Q26 잠정실적이 Yahoo보다 먼저 나와 직접 반영)
    q_rev = [v for _, v in f["qRev"]][-3:]
    q_op = [v for _, v in f["qOp"]][-3:]
    if t in kr_3q and len(q_rev) == 3:
        k3 = kr_3q[t]
        rev_ttm = sum(q_rev) + k3["rev"]
        op_ttm = sum(q_op) + k3["op"]
        ttm_label = "4Q25~3Q26"
    else:
        rev_ttm = f["tRev"][0][1] if f["tRev"] else None
        op_ttm = f["tOp"][0][1] if f["tOp"] else None
        end = f["tRev"][0][0] if f["tRev"] else None
        ttm_label = f"{end} 기준 최근 4개 분기" if end else None
    ov = OVERRIDE.get(t)
    if ov:
        rev_ttm, op_ttm = ov["ttm"]
        ttm_label = ov["ttm_label"]
        f = dict(f)
        f["aRev"] = [[a[0], a[1]] for a in ov["annual"]]
        f["aOp"] = [[a[0], a[2]] for a in ov["annual"]]
        f["aNi"] = [[a[0], a[3]] for a in ov["annual"]]
        r["fin_override"] = {"src": ov["src"], "note": ov["note"]}
    r["ttm_label"] = ttm_label
    r["rev_ttm_usd_bn"] = round(rev_ttm * 1e6 * u / 1e9, 2) if rev_ttm else None
    r["rev_ttm_krw_jo"] = round(rev_ttm * 1e6 * u * KRW / 1e12, 2) if rev_ttm else None
    r["opm_ttm"] = round(op_ttm / rev_ttm * 100, 1) if rev_ttm and op_ttm is not None else None
    r["npm"] = round(q["npm"] * 100, 1) if q.get("npm") is not None else None

    # 연간 추이
    ann = []
    ops = dict(f["aOp"])
    nis = dict(f["aNi"])
    for d, v in f["aRev"]:
        o = ops.get(d)
        ann.append({"fy": d, "rev": v, "op": o, "ni": nis.get(d),
                    "opm": round(o / v * 100, 1) if o is not None and v else None})
    r["annual"] = ann
    r["annual_unit"] = f"{'GBP' if cur == 'GBp' else cur} 백만"
    if len(ann) >= 2:
        r["rev_g_fy"] = round((ann[-1]["rev"] / ann[-2]["rev"] - 1) * 100, 1)
        r["fy_last"] = ann[-1]["fy"]
    if len(ann) >= 4:
        r["rev_cagr3"] = round(((ann[-1]["rev"] / ann[-4]["rev"]) ** (1 / 3) - 1) * 100, 1)
    r["rev_g_q"] = round(q["rg"] * 100, 1) if q.get("rg") is not None else None

    # 멀티플
    pe = q.get("pe")
    pe_src = "Yahoo"
    if pe is None:
        ni4 = [v for _, v in f["qNi"]][-4:]
        if len(ni4) == 4 and sum(ni4) > 0:
            pe = q["mcap"] / (sum(ni4) * 1e6)
            pe_src = "시가총액 ÷ 최근 4개 분기 순이익(계산)"
    r["pe"] = round(pe, 1) if pe else None
    r["pe_src"] = pe_src
    r["fpe"] = round(q["fpe"], 1) if q.get("fpe") else None
    r["ev_ebitda"] = round(q["eve"], 1) if q.get("eve") else None
    r["ev_ebit"] = round(q["ev"] / (op_ttm * 1e6), 1) if q.get("ev") and op_ttm and op_ttm > 0 else None
    pb = q.get("pb")
    if cur == "GBp" and pb:
        pb = pb / 100  # 주가(펜스)와 장부가(파운드) 단위 불일치 보정
    r["pb"] = round(pb, 1) if pb else None
    r["ev_sales"] = round(q["evs"], 2) if q.get("evs") else None
    r["dy"] = round(q["dy"] * 100, 2) if q.get("dy") is not None else None
    r["tgt_upside"] = round((q["tgt"] / px - 1) * 100, 1) if q.get("tgt") else None
    r["n_analysts"] = q.get("nan")
    r["net_debt_usd_bn"] = round(((q.get("debt") or 0) - (q.get("cash") or 0)) * u / 1e9, 2)
    r["earn_next"] = (q.get("earn") or [None])[0]

    # 주가 수익률 (현지통화·달러 환산)
    us = usd_series(cur, closes)
    r["ret"] = {k: ret(closes, b) for k, b, _, _ in PERIODS}
    r["ret_usd"] = {k: ret(us, b) for k, b, _, _ in PERIODS}
    hi = max(v for v in closes if v is not None)
    r["from_high"] = round((px / hi - 1) * 100, 1)
    r["high_month"] = months[closes.index(hi)]
    r["series"] = closes
    r["series_usd"] = us

    # 수주잔고
    if t in kr_bl:
        b = kr_bl[t]
        r["backlog"] = b
        if "total_usd" in b:
            tot = b["total_usd"] * 10 * KRW / 1e4
            dfn = b["defense_usd"] * 10 * KRW / 1e4
            r["backlog_total_krw_jo"] = round(tot, 2)
            r["backlog_def_krw_jo"] = round(dfn, 2)
        else:
            r["backlog_total_krw_jo"] = b.get("total")
            r["backlog_def_krw_jo"] = b.get("defense")
        key = r["backlog_def_krw_jo"] or r["backlog_total_krw_jo"]
        r["backlog_usd_bn"] = round(key * 1e12 / KRW / 1e9, 1) if key else None
        r["backlog_asof"] = b["asof"]
        r["backlog_label"] = b["label"]
        r["backlog_src"] = b["source_url"]
        if t in KR_IR:
            seg = ir_ttm(*KR_IR[t][:1])
            seg["name"] = KR_IR[t][1]
            r["seg"] = seg
            if key:
                r["coverage"] = round(key * 1e4 / seg["rev_eok"], 1)
                r["coverage_basis"] = f"{b['label']} 잔고 ÷ {seg['name']} 최근 4개 분기 매출"
    elif t in res:
        x = res[t]
        bu = backlog_usd(x.get("backlog"))
        r["backlog_usd_bn"] = round(bu, 1) if bu else None
        r["backlog_asof"] = x["backlog"]["asof"]
        r["backlog_local"] = f"{x['backlog']['value']:,} {x['backlog']['unit']}"
        r["backlog_src"] = x["backlog"].get("source_url")
        bp = x.get("backlog_prev_year") or {}
        if bp.get("value") and x["backlog"].get("value") and "직접 비교 불가" not in (bp.get("asof") or ""):
            r["backlog_yoy"] = round((x["backlog"]["value"] / bp["value"] - 1) * 100, 1)
            r["backlog_prev_asof"] = bp.get("asof")
        if bu and r["rev_ttm_usd_bn"]:
            r["coverage"] = round(bu / r["rev_ttm_usd_bn"], 1)
            r["coverage_basis"] = "수주잔고 ÷ 최근 4개 분기 매출"
        if x.get("segment_defense_backlog"):
            r["backlog_seg"] = x["segment_defense_backlog"]
    if t in res:
        x = res[t]
        for k in ("defense_share_pct", "defense_share_source_url", "fy_guidance", "fy_guidance_source_url",
                  "recent_quarter", "kdefense_overlap", "key_programs", "notes", "notes_source_url"):
            if x.get(k) is not None:
                r[k] = x[k]
        if isinstance(r.get("defense_share_pct"), dict):
            r["defense_share_pct"] = str(r["defense_share_pct"].get("value"))
        if isinstance(r.get("fy_guidance"), dict):
            r["fy_guidance_source_url"] = r["fy_guidance"].get("source_url")
            r["fy_guidance"] = f"{r['fy_guidance']['label']}: {r['fy_guidance']['text']}"
    if t in kr_3q:
        r["kr_3q26"] = kr_3q[t]
    rows.append(r)

GROUPS = [("kr", "K방산"), ("us", "미국"), ("eu", "유럽"), ("as", "아시아·기타")]

# ── 멀티플 분기 이력 (stockanalysis.com) ──
hist_raw = json.loads((D / "peers_hist.json").read_text(encoding="utf-8"))
HQ = [f"{y % 100:02d}Q{q}" for y in range(2021, 2027) for q in range(1, 5)]
HQ = HQ[HQ.index("21Q3"):HQ.index("26Q3") + 1] + ["NOW"]
HK = ["fpe", "pe", "eve", "pb", "evs"]
for r in rows:
    h = hist_raw["data"].get(r["t"])
    if not h:
        continue
    pos = {b: i for i, b in enumerate(h["b"])}
    r["hist"] = {k: [h[k][pos[q]] if q in pos and pos[q] < len(h[k]) else None for q in HQ] for k in HK}
    r["hist_semi"] = sum(1 for b in h["b"] if b.endswith(("Q1", "Q3"))) == 0


def med(vals):
    v = [x for x in vals if x is not None]
    return round(statistics.median(v), 1) if v else None


stats = {}
for g, _ in GROUPS:
    gr = [r for r in rows if r["group"] == g]
    stats[g] = {
        "n": len(gr),
        "fpe": med([r["fpe"] for r in gr]),
        "pe": med([r["pe"] for r in gr]),
        "ev_ebitda": med([r["ev_ebitda"] for r in gr]),
        "ev_ebit": med([r["ev_ebit"] for r in gr]),
        "opm_ttm": med([r["opm_ttm"] for r in gr]),
        "rev_g_fy": med([r.get("rev_g_fy") for r in gr]),
        "rev_cagr3": med([r.get("rev_cagr3") for r in gr]),
        "coverage": med([r.get("coverage") for r in gr]),
        "ret": {k: med([r["ret_usd"][k] for r in gr]) for k, *_ in PERIODS},
        "from_high": med([r["from_high"] for r in gr]),
        "mcap_usd_bn": round(sum(r["mcap_usd_bn"] for r in gr), 1),
        "hist": {},
    }
    # 반기 보고 회사(BAE·탈레스·다쏘·ST엔지니어링)는 다음 분기에 직전 값을 한 번 이어 붙여 중앙값 구성이 흔들리지 않게 함
    for k in HK:
        series = []
        for i in range(len(HQ)):
            vals = []
            for r in gr:
                a = r.get("hist", {}).get(k)
                if not a:
                    continue
                v = a[i]
                if v is None and r.get("hist_semi") and i > 0:
                    v = a[i - 1]
                if v is not None:
                    vals.append(v)
            series.append(round(statistics.median(vals), 1) if len(vals) >= 3 else None)
        stats[g]["hist"][k] = series
        stats[g].setdefault("hist_n", {})[k] = [sum(1 for r in gr if r.get("hist", {}).get(k) and r["hist"][k][i] is not None) for i in range(len(HQ))]

out = {
    "asof": mk["asof"],
    "source": mk["source"],
    "fx": {"KRW": KRW, "note": "달러 환산은 각 월말 환율, 원화 환산은 2026-11-05 환율(1달러 = %.1f원)" % KRW},
    "months": months,
    "hq": HQ,
    "hist_source": hist_raw["source"],
    "hist_note": hist_raw["note"],
    "periods": [{"k": k, "base": b, "label": l, "basis": n} for k, b, l, n in PERIODS],
    "groups": [{"k": g, "label": l} for g, l in GROUPS],
    "stats": stats,
    "rows": rows,
}
(D / "peers.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"peers.json: {len(rows)}개사, {len(months)}개월")
for g, l in GROUPS:
    s = stats[g]
    print(f"  {l}: Fwd PER {s['fpe']} · EV/EBITDA {s['ev_ebitda']} · OPM {s['opm_ttm']} · 1Y(USD) {s['ret']['y1']} · 잔고배수 {s['coverage']}")

# ── 페이지 생성 (CSS·JS·데이터 캐시 무효화 해시) ──
import hashlib


def h(p):
    return hashlib.sha1((ROOT / p).read_bytes()).hexdigest()[:8]


page = (ROOT / "tools" / "peers.template.html").read_text(encoding="utf-8")
page = page.replace("{{css}}", h("assets/site.css")).replace("{{js}}", h("assets/peers.js")).replace("{{data}}", h("data/peers.json")).replace("{{xl}}", h("assets/xlsx.js"))
(ROOT / "peers").mkdir(exist_ok=True)
(ROOT / "peers" / "index.html").write_text(page, encoding="utf-8")
print("peers/index.html 생성")
