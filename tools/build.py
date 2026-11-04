"""무기체계 페이지 생성기.

사용법: python3 tools/build.py k9 k2
data/<id>.json 의 meta 값으로 tools/system.template.html 을 채워 <id>/index.html 을 만든다.
"""
import html
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TEMPLATE = (ROOT / "tools" / "system.template.html").read_text(encoding="utf-8")


def legend(has_split):
    if has_split:
        return ('<span><i style="background:var(--c1)"></i>수출 매출</span>'
                '<span><i style="background:var(--c2)"></i>내수 매출</span>')
    return '<span><i style="background:var(--c1)"></i>부문 매출</span>'


def build(sys_id):
    data = json.loads((ROOT / "data" / f"{sys_id}.json").read_text(encoding="utf-8"))
    meta = data["meta"]
    has_split = any(q.get("export_eok") is not None for q in data["ir"]["quarters"])
    values = {
        "id": sys_id,
        "name": meta["name"],
        "short": meta["short"],
        "alias": meta["alias"],
        "maker": meta["maker"],
        "eyebrow": meta["eyebrow"],
        "why_note": meta["why_note"],
        "spec_note": meta["spec_note"],
        "version_note": meta["version_note"],
        "unit_word": meta["unit_word"],
        "unit_desc": meta["unit_desc"],
        "company": data["ir"]["company"],
        "segment_short": meta["segment_short"],
        "backlog_note": meta["backlog_note"],
        "ir_url": data["ir"]["source"]["url"],
        "fin_bar_desc": "분기별 매출(막대: 진한색 수출, 연한색 내수, 억원)" if has_split else "분기별 매출(막대, 억원. 회사가 부문별 수출·내수를 따로 공개하지 않음)",
    }
    out = TEMPLATE
    for key, val in values.items():
        out = out.replace("{{" + key + "}}", html.escape(str(val), quote=True))
    out = out.replace("{{fin_legend}}", legend(has_split))
    assert "{{" not in out, out[out.index("{{"): out.index("{{") + 40]
    target = ROOT / sys_id / "index.html"
    target.parent.mkdir(exist_ok=True)
    target.write_text(out, encoding="utf-8")
    print("built", target.relative_to(ROOT))


if __name__ == "__main__":
    for s in sys.argv[1:]:
        build(s)
