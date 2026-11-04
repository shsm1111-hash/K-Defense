"""버전별 사진(<id>_version_photos.json)을 data/<id>.json 의 photos·versions 에 반영한다.
사용법: python3 tools/version_photos.py k9 k2 ...
"""
import json, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
SYSDATA = pathlib.Path("/home/claude/sysdata")
BAD = set(json.loads((SYSDATA / "bad_photo_urls.json").read_text())) if (SYSDATA / "bad_photo_urls.json").exists() else set()

def apply(sid):
    f = ROOT / "data" / f"{sid}.json"; d = json.loads(f.read_text(encoding="utf-8"))
    p = SYSDATA / sid / f"{sid}_version_photos.json"
    if not p.exists(): print(sid, "no file"); return
    rows = {r["v"]: r for r in json.loads(p.read_text(encoding="utf-8")) if r.get("src") and r["src"] not in BAD}
    n = 0
    for i, v in enumerate(d["versions"]):
        r = rows.get(v["v"])
        if not r or (v.get("photo") and not v["photo"].startswith("vp_")): continue
        key = f"vp_{i}"
        kind = r.get("kind") or "사진"
        d["photos"][key] = {"src": r["src"], "page": r.get("page") or r["src"], "by": r.get("by") or "출처",
                            "lic": "" if kind == "사진" else kind, "cap": r.get("cap") or v["v"]}
        v["photo"] = key; n += 1
    f.write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding="utf-8")
    print(sid, "version photos", n, "/", len(d["versions"]))

if __name__ == "__main__":
    for s in sys.argv[1:]: apply(s)
