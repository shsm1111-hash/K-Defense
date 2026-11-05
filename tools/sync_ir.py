"""data/*_ir.json 의 매출·이익 분기(quarters)와 메타를 각 무기체계 data/<id>.json 의 ir 에 복사한다."""
import json, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
irs = {}
for p in (ROOT/"data").glob("*_ir.json"):
    d = json.loads(p.read_text(encoding="utf-8")); irs[d["company"]] = d
for sp in (ROOT/"data").glob("*.json"):
    if sp.name.endswith("_ir.json"): continue
    sd = json.loads(sp.read_text(encoding="utf-8"))
    co = sd.get("ir", {}).get("company")
    if co in irs:
        src = irs[co]
        for k in ("quarters","segment","source","note","labels","basis_breaks","backlog_q","backlog","backlog_note"):
            if k in src: sd["ir"][k] = src[k]
            elif k in sd["ir"] and k in ("labels",): del sd["ir"][k]
        sp.write_text(json.dumps(sd, ensure_ascii=False, indent=1), encoding="utf-8")
        print("synced", sp.name, "<-", co, len(src["quarters"]))
