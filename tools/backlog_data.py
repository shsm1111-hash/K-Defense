"""각 사 IR 실적발표 자료에서 옮긴 분기별 수주잔고(사업부문별)를 IR 파일과 무기체계 데이터에 반영한다.
사용법: python3 tools/backlog_data.py   (그다음 build.py)
"""
import json, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent

def pct(a, b): return round(a / b * 100, 1) if b else None

S = {}
# 한화에어로스페이스 지상방산: 회사가 총액과 수출 비중(%)만 공개 → 수출/내수 금액은 총액×비중으로 계산
hl = [("4Q23",27.9,66),("1Q24",29.8,68),("2Q24",30.3,68),("3Q24",29.9,69),("4Q24",32.4,68),("1Q25",31.4,65),
      ("2Q25",31.7,65),("3Q25",31.0,69),("4Q25",37.2,71),("1Q26",38.2,74),("2Q26",38.3,75),("3Q26",35.0,74)]
S["hanwha_land_ir.json"] = {
 "unit":"조원","title":"지상방산 수주잔고 (수출·내수)",
 "segments":[{"key":"exp","label":"수출","color":"c1"},{"key":"dom","label":"내수","color":"c2"}],
 "export_keys":["exp"],"focus":None,
 "rows":[{"period":p,"total":t,"values":{"exp":round(t*e/100,2),"dom":round(t*(100-e)/100,2)},"export_pct":e,"calc":True} for p,t,e in hl],
 "note":"지상방산 부문 기준. 회사는 총액과 수출 비중(%)을 공개하며, 수출·내수 금액은 총액×비중으로 계산했습니다. 각 분기 IR 실적발표 '사업부문별 실적' 페이지.",
}
# 현대로템: 사업부문별 수주잔고(억원). 방산 = 디펜스솔루션(~1Q26) → AD&RH(2Q26~)
rt = [("4Q23",54259,114096,6648),("1Q24",52296,127090,6501),("2Q24",50133,133196,6586),("3Q24",44755,136563,8615),
      ("4Q24",38727,140646,8205),("1Q25",33991,168611,8585),("2Q25",25440,182557,8371),("3Q25",107897,180028,8163),
      ("4Q25",105181,184533,8021),("1Q26",101021,189365,7795),("2Q26",98197,198670,7179),("3Q26",95228,190310,5882)]
S["rotem_defense_ir.json"] = {
 "unit":"조원","title":"현대로템 사업부문별 수주잔고",
 "segments":[{"key":"def","label":"방산(디펜스솔루션→AD&RH)","color":"c1"},{"key":"rail","label":"레일솔루션(RS)","color":"c2"},{"key":"eco","label":"에코플랜트(EP)","color":"c5"}],
 "export_keys":[],"focus":"def",
 "rows":[{"period":p,"total":round((a+b+c)/1e4,2),"values":{"def":round(a/1e4,2),"rail":round(b/1e4,2),"eco":round(c/1e4,2)}} for p,a,b,c in rt],
 "note":"각 분기 IR 실적발표 '사업부문별 수주잔고'(억원)를 조원으로 환산. 방산 부문은 2026년 2분기부터 AD&RH로 이름이 바뀌었고 과거치는 같은 숫자로 유지됩니다. 회사는 방산 잔고의 수출·내수를 나눠 공개하지 않습니다(3Q25 급증은 2025.8 폴란드 K2 2차 실행계약 반영).",
}
# KAI: 국내사업 / 완제기수출 / 기체구조물(억원)
ka = [("4Q23",90671,53294,73794),("1Q24",86623,52471,73624),("2Q24",97436,51017,84138),("3Q24",93365,48635,82080),
      ("4Q24",91127,52919,102948),("1Q25",89172,52229,101168),("2Q25",106384,59934,100415),("3Q25",105000,58439,99234),
      ("4Q25",None,None,None,273000),("1Q26",None,None,None,265532),("2Q26",109170,50256,98076),("3Q26",105381,61930,95544)]
rows=[]
for r in ka:
    if r[1] is None:
        rows.append({"period":r[0],"total":round(r[4]/1e4,2),"values":None,"export_pct":None}); continue
    p,a,b,c=r; t=a+b+c
    rows.append({"period":p,"total":round(t/1e4,2),"values":{"dom":round(a/1e4,2),"exp":round(b/1e4,2),"aero":round(c/1e4,2)},"export_pct":pct(b,t)})
S["kai_ir.json"] = {
 "unit":"조원","title":"KAI 사업별 수주잔고",
 "segments":[{"key":"exp","label":"완제기 수출","color":"c1"},{"key":"dom","label":"국내사업","color":"c2"},{"key":"aero","label":"기체구조물(보잉·에어버스 등)","color":"c5"}],
 "export_keys":["exp"],"focus":None,"rows":rows,
 "note":"각 분기 IR Report 경영실적 표(억원). 수출 비중은 완제기 수출 잔고 기준이며, 기체구조물도 대부분 해외 항공기 제조사 납품입니다. 4Q25는 연도별 수주잔고 차트의 27.3조원, 1Q26은 총액만 공개돼 부문 구분이 없습니다.",
}
# LIG: 수출(천궁-II 중동 / 기타) · 내수(개발 / 양산), 조원
lg = [("4Q23",(6.66,4.27,2.71,5.94)),("1Q24",19.29),("2Q24",19.01),("3Q24",18.39),("4Q24",(6.58,4.05,2.42,7.01)),
      ("1Q25",(10.18,3.90,2.25,6.55)),("2Q25",(9.99,4.18,2.80,6.49)),("3Q25",(10.24,4.34,2.84,6.01)),
      ("4Q25",(10.17,4.23,5.25,6.59)),("1Q26",(9.99,4.17,5.08,6.06)),("2Q26",(9.89,4.16,4.89,5.63))]
LGT={"4Q23":19.59,"4Q24":20.05,"1Q25":22.88,"2Q25":23.46,"3Q25":23.42,"4Q25":26.23,"1Q26":25.31,"2Q26":24.57}  # 회사 표의 합계
rows=[]
for p,v in lg:
    if isinstance(v,float): rows.append({"period":p,"total":v,"values":None,"export_pct":None}); continue
    a,b,c,d=v; t=LGT.get(p, round(a+b+c+d,2))
    rows.append({"period":p,"total":t,"values":{"msam":a,"expo":b,"dev":c,"mass":d},"export_pct":pct(a+b,t)})
S["lig_ir.json"] = {
 "unit":"조원","title":"LIG D&A 수주잔고 (수출·내수)",
 "segments":[{"key":"msam","label":"수출: 중동 천궁-II(UAE·사우디·이라크)","color":"c1"},{"key":"expo","label":"수출: 기타","color":"c4"},{"key":"dev","label":"내수: 개발","color":"c5"},{"key":"mass","label":"내수: 양산","color":"c2"}],
 "export_keys":["msam","expo"],"focus":None,"rows":rows,
 "note":"각 분기 IR '영업(잠정)실적 – 수주잔고' 표(조원). 2024년 1~3분기는 총액만 공개. 3Q26 자료는 아직 게시 전입니다.",
}
# 한화오션: 인도기준 수주잔량(억 달러)
ho = [("3Q25",240.2,23.7,52.8,316.7),("4Q25",259.3,10.0,52.5,321.8),("1Q26",260.2,35.9,52.5,348.6),("2Q26",252.5,36.5,48.7,337.7),("3Q26",268.3,39.1,54.8,362.2)]
S["hanwhaocean_naval_ir.json"] = {
 "unit":"억달러","title":"한화오션 사업부별 수주잔고",
 "segments":[{"key":"naval","label":"특수선 및 기타","color":"c1"},{"key":"merchant","label":"상선","color":"c2"},{"key":"energy","label":"해양·에너지플랜트","color":"c5"}],
 "export_keys":[],"focus":"naval",
 "rows":[{"period":p,"total":t,"values":{"merchant":a,"energy":b,"naval":c}} for p,a,b,c,t in ho],
 "note":"각 분기 실적발표 '종합 수주잔고'(인도기준, 억 달러). 1Q26부터 사업 양수한 풍력·플랜트가 에너지플랜트에 포함됐습니다. 특수선 잔고의 수출·내수는 나눠 공개하지 않습니다.",
}
S["hanwha_systems_ir.json"] = None  # 한화시스템 IR은 수주잔고를 공개하지 않음

for f, bs in S.items():
    p = ROOT/"data"/f; d = json.loads(p.read_text(encoding="utf-8"))
    if bs is None:
        d["backlog_q"] = None
        d["backlog_note"] = "한화시스템 분기 실적발표 자료에는 수주잔고가 공개되지 않습니다."
    else:
        d["backlog_q"] = bs
        # KPI·표용 backlog: 대상 부문(또는 전사) 조원 기준
        bl = []
        for r in bs["rows"]:
            v = r["values"][bs["focus"]] if bs["focus"] and r["values"] else (r["total"] if not bs["focus"] else None)
            if v is None: continue
            if bs["unit"] == "억달러": v = round(v*1400/1e4, 2)
            bl.append({"period": r["period"], "backlog_jo": v, "export_pct": r.get("export_pct")})
        d["backlog"] = bl
    p.write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding="utf-8")
    # 무기체계 데이터에 들어 있는 IR 사본 갱신
    for sp in (ROOT/"data").glob("*.json"):
        if sp.name.endswith("_ir.json"): continue
        sd = json.loads(sp.read_text(encoding="utf-8"))
        if sd.get("ir", {}).get("company") == d["company"]:
            for k in ("backlog_q","backlog","backlog_note"):
                if k in d: sd["ir"][k] = d[k]
            sd["meta"]["backlog_note"] = ""
            sp.write_text(json.dumps(sd, ensure_ascii=False, indent=1), encoding="utf-8")
            print("updated", sp.name, "from", f)
