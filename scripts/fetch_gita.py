"""Fetch the Shrimad Bhagavad Gita from https://vedicscriptures.github.io
and write src/data/gita.json + gita-index.json.

The API is a static GitHub Pages JSON site (the same data as
https://github.com/vedicscriptures/bhagavad-gita-api). No auth needed.
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "data"
BASE = "https://vedicscriptures.github.io"


def fetch_json(path: str):
    url = f"{BASE}{path}"
    req = Request(url, headers={"User-Agent": "vachanalaya-build/1.0"})
    for attempt in range(4):
        try:
            with urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            if attempt == 3:
                raise
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError("unreachable")


def pick_english(slok: dict) -> str:
    for k in ("siva", "purohit", "gambir", "adi", "san", "raman", "abhinav"):
        v = slok.get(k) or {}
        if isinstance(v, dict) and v.get("et"):
            return v["et"].strip()
    return ""


def pick_hindi(slok: dict) -> str:
    for k in ("tej", "rams", "chinmay"):
        v = slok.get(k) or {}
        if isinstance(v, dict) and v.get("ht"):
            return v["ht"].strip()
    return ""


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    chapters_meta = fetch_json("/chapters/")
    chapters_out = []
    index_out = []

    for ch in chapters_meta:
        n = ch["chapter_number"]
        vcount = ch["verses_count"]
        print(f"chapter {n}: {vcount} verses")

        verses = []
        for v in range(1, vcount + 1):
            slok = fetch_json(f"/slok/{n}/{v}/")
            verses.append({
                "id": f"{n}.{v}",
                "sanskrit": (slok.get("slok") or "").strip(),
                "transliteration": (slok.get("transliteration") or "").strip(),
                "english": pick_english(slok),
                "hindi": pick_hindi(slok),
            })
            time.sleep(0.05)

        meaning_en = (ch.get("meaning") or {}).get("en", "")
        summary_en = (ch.get("summary") or {}).get("en", "")

        chapters_out.append({
            "id": f"chapter-{n}",
            "number": n,
            "name": ch.get("name", ""),
            "translation": ch.get("translation", ""),
            "transliteration": ch.get("transliteration", ""),
            "meaning": meaning_en,
            "summary": summary_en,
            "verses": verses,
        })
        index_out.append({
            "id": f"chapter-{n}",
            "number": n,
            "name": ch.get("name", ""),
            "translation": ch.get("translation", ""),
            "transliteration": ch.get("transliteration", ""),
            "meaning": meaning_en,
            "verseCount": vcount,
        })

    (OUT / "gita.json").write_text(
        json.dumps(chapters_out, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (OUT / "gita-index.json").write_text(
        json.dumps(index_out, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    total = sum(c["verseCount"] for c in index_out)
    print(f"wrote {len(chapters_out)} chapters, {total} verses")


if __name__ == "__main__":
    main()
