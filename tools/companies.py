"""관련 기업(<id>_companies.json)과 추가 구성품(<id>_components_add.json)을 data/<id>.json 에 반영한다.

사용법: python3 tools/companies.py k9 k2 ...   (assemble.py 다음, build.py 전에 실행)
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SYSDATA = pathlib.Path("/home/claude/sysdata")


def num(v):
    try:
        return None if v in (None, "", "None") else float(str(v).replace(",", ""))
    except ValueError:
        return None


def apply(sid):
    f = ROOT / "data" / f"{sid}.json"
    d = json.loads(f.read_text(encoding="utf-8"))
    cp = SYSDATA / sid / f"{sid}_companies.json"
    if cp.exists():
        cos = json.loads(cp.read_text(encoding="utf-8"))
        for c in cos:
            c["importance"] = int(num(c.get("importance")) or 3)
            c["exposure_krw_eok"] = num(c.get("exposure_krw_eok"))
        d["companies"] = sorted(cos, key=lambda c: c["importance"])
    sp = SYSDATA / sid / f"{sid}_supplychain.json"
    if sp.exists():
        d["supplychain"] = json.loads(sp.read_text(encoding="utf-8"))
    cq = SYSDATA / sid / f"{sid}_competition.json"
    if cq.exists():
        d["competition"] = json.loads(cq.read_text(encoding="utf-8"))
    d.pop("obsidian", None)
    ap = SYSDATA / sid / f"{sid}_components_add.json"
    added = fixed = 0
    if ap.exists():
        comps = d["components"]
        have = {(c["part"], c["maker"]) for c in comps}
        n = len(comps)
        for row in json.loads(ap.read_text(encoding="utf-8")):
            if row.get("fix_id"):
                for c in comps:
                    if c.get("id") == row["fix_id"]:
                        c.update({k: v for k, v in row.items() if k != "fix_id"})
                        fixed += 1
            elif (row.get("part"), row.get("maker")) not in have:
                n += 1
                comps.append({"id": f"P{n:02d}", **row})
                added += 1
        # 국내 → 해외 순서 유지
        d["components"] = sorted(comps, key=lambda c: 0 if c["group"].startswith("국내") else 1)
    f.write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding="utf-8")
    print(sid, "companies", len(d.get("companies", [])), "comp+", added, "fix", fixed)


if __name__ == "__main__":
    for s in sys.argv[1:]:
        apply(s)
