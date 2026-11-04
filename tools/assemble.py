"""조사 결과(sysdata/<id>/)와 IR·사진 설정을 합쳐 data/<id>.json 을 만든다.

사용법: python3 tools/assemble.py k21 cheongwang ...
설정은 tools/systems.json 에 있다.
"""
import json
import pathlib
import sys
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
SYSDATA = pathlib.Path("/home/claude/sysdata")
CONF = json.loads((ROOT / "tools" / "systems.json").read_text(encoding="utf-8"))

PARTS = ["contracts", "operators", "timeline", "specs", "versions", "components", "roadmap", "pipeline", "notes"]


def photo(file, by, lic, cap, width=960):
    q = urllib.parse.quote(file)
    return {
        "src": f"https://commons.wikimedia.org/wiki/Special:FilePath/{q}?width={width}",
        "page": "https://commons.wikimedia.org/wiki/File:" + urllib.parse.quote(file.replace(" ", "_")),
        "by": by, "lic": lic, "cap": cap,
    }


def load(sid, part):
    p = SYSDATA / sid / f"{sid}_{part}.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else []


def num(v):
    if v in (None, "", "None"):
        return None
    try:
        return float(str(v).replace(",", ""))
    except ValueError:
        return None


def assemble(sid):
    c = CONF[sid]
    meta = json.loads((SYSDATA / sid / f"{sid}_meta.json").read_text(encoding="utf-8"))
    data = {p: load(sid, p) for p in PARTS}
    ir = json.loads((ROOT / "data" / c["ir"]).read_text(encoding="utf-8"))
    if c.get("ir_override"):
        ir = {**ir, **c["ir_override"]}
    photos = {k: photo(*v) for k, v in c.get("photos", {}).items()}

    for v in data["versions"]:
        v["photo"] = c.get("version_photos", {}).get(v["v"])
    for o in data["operators"]:
        o["photo"] = c.get("operator_photos", {}).get(o["country"])
        o["qty"] = num(o.get("qty")) or 0
        o["counted"] = o.get("counted") in (True, "true", "True")
        o["nato"] = o.get("nato") in (True, "true", "True")
    for r in data["contracts"]:
        r["qty"] = num(r.get("qty")) or 0
        r["year"] = int(num(r.get("year")) or 0)
        r["value_krw_eok"] = num(r.get("value_krw_eok"))
        r["unit_comparable"] = r.get("unit_comparable") in (True, "true", "True")
    for s in data["specs"]:
        s["num"] = num(s.get("num"))
    for p in data["pipeline"]:
        p["value_krw_eok"] = num(p.get("value_krw_eok"))
        p["value_usd_eok"] = num(p.get("value_usd_eok"))

    features = meta.pop("features", [])
    meta.setdefault("segment_short", c["segment_short"])
    meta["segment_short"] = c["segment_short"]
    meta["backlog_note"] = c.get("backlog_note") or ir.get("backlog_note") or ""
    meta["supply_photos"] = c.get("supply_photos", [])
    kp = [k for k in meta.get("kpis", []) if k.get("src") != "backlog"]
    if ir.get("backlog"):
        kp = kp[:4] + [{"label": f"{c['segment_short']} 수주잔고", "src": "backlog", "note": f"{ir['company'].split('(')[0]} {{backlog_period}}{{backlog_export}} (IR)"}]
    meta["kpis"] = kp[:5]
    out = {"updated": "2026-11-04", "meta": meta, "features": features, **data, "photos": photos, "ir": ir}
    (ROOT / "data" / f"{sid}.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print("assembled", sid, {k: len(v) for k, v in data.items()})
    sys.path.insert(0, str(ROOT / "tools"))
    import companies, version_photos
    companies.apply(sid)
    version_photos.apply(sid)


if __name__ == "__main__":
    for s in sys.argv[1:]:
        assemble(s)
