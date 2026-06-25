"""Build Valmiki Ramayana data files.

Sources:
- Sanskrit (Devanagari): jayeshmepani/HinduScriptures (one JSON per kanda).
- English translation: valmikiramayan.net (verse-by-verse, 6 of 7 kandas).
  Uttara kanda has no English on that site -> Sanskrit-only.

Outputs:
- public/data/valmiki-ramayana/<kanda-key>-<sarga>.json  (per-sarga reader payload)
- src/data/puranas/valmiki-ramayana.json                  (browse index)
"""
from __future__ import annotations

import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts" / ".cache" / "ramayana"
OUT_DATA = ROOT / "public" / "data" / "valmiki-ramayana"
INDEX_OUT = ROOT / "src" / "data" / "puranas" / "valmiki-ramayana.json"
CACHE.mkdir(parents=True, exist_ok=True)
OUT_DATA.mkdir(parents=True, exist_ok=True)
INDEX_OUT.parent.mkdir(parents=True, exist_ok=True)

UA = "Mozilla/5.0 (Vachanalaya build script)"

# (json_kaanda_value, url_dir, inner_prefix, display_label)
KANDAS = [
    ("balakanda",       "baala",    "bala",       "Bala Kanda"),
    ("ayodhyakanda",    "ayodhya",  "ayodhya",    "Ayodhya Kanda"),
    ("aranyakanda",     "aranya",   "aranya",     "Aranya Kanda"),
    ("kishkindhakanda", "kish",     "kishkindha", "Kishkindha Kanda"),
    ("sundarakanda",    "sundara",  "sundara",    "Sundara Kanda"),
    ("yudhhakanda",     "yuddha",   "yuddha",     "Yuddha Kanda"),
    ("uttarakanda",     None,       None,         "Uttara Kanda"),
]

KEY_FOR_JSON = {
    "balakanda": "bala", "ayodhyakanda": "ayodhya", "aranyakanda": "aranya",
    "kishkindhakanda": "kishkindha", "sundarakanda": "sundara",
    "yudhhakanda": "yuddha", "uttarakanda": "uttara",
}

RAW = "https://raw.githubusercontent.com/jayeshmepani/HinduScriptures/main/DharmicData/Ramayanas/ValmikiRamayana/{i}.json"


def http_get(url: str) -> bytes:
    req = Request(url, headers={"User-Agent": UA})
    with urlopen(req, timeout=60) as r:
        return r.read()


def fetch_cached(url: str, cache_path: Path) -> str | None:
    if cache_path.exists() and cache_path.stat().st_size > 200:
        return cache_path.read_text("utf-8", errors="replace")
    try:
        data = http_get(url)
    except Exception as e:
        print(f"  ! fetch fail {url}: {e}", file=sys.stderr)
        return None
    text = data.decode("utf-8", errors="replace")
    if "404 Not Found" in text[:400]:
        return None
    cache_path.write_text(text, encoding="utf-8")
    return text


VERSE_NUM_RE = re.compile(r"\|\|\s*\d+\s*-\s*\d+\s*-\s*(\d+)")


def parse_sarga_translation(html: str) -> dict[int, str]:
    """Return {verse_number: english_translation} from a sansN.htm page."""
    soup = BeautifulSoup(html, "html.parser")
    paras = soup.find_all("p")
    result: dict[int, str] = {}
    last_verse: int | None = None
    for p in paras:
        cls = " ".join(p.get("class", []))
        # Get text
        text = p.get_text(" ", strip=True)
        if "SanSloka" in cls:
            m = VERSE_NUM_RE.search(text)
            if m:
                last_verse = int(m.group(1))
            else:
                last_verse = None
        elif "tat" in cls.split() and last_verse is not None:
            # English translation paragraph
            existing = result.get(last_verse, "")
            result[last_verse] = (existing + " " + text).strip() if existing else text
    return result


def build_kanda(json_idx: int, json_kaanda: str, url_dir: str | None,
                inner_prefix: str | None, label: str) -> tuple[list[dict], list[dict]]:
    """Returns (chapter_meta_list, [None]) and writes per-sarga files."""
    print(f"\n== {label} ==")
    raw = http_get(RAW.format(i=json_idx))
    shlokas = json.loads(raw)
    # group by sarg
    by_sarga: dict[int, list[dict]] = {}
    for s in shlokas:
        by_sarga.setdefault(s["sarg"], []).append(s)
    sargas = sorted(by_sarga.keys())
    print(f"  {len(sargas)} sargas, {len(shlokas)} shlokas")

    key = KEY_FOR_JSON[json_kaanda]

    # Fetch translations for all sargas in parallel (if available).
    translations: dict[int, dict[int, str]] = {}
    if url_dir and inner_prefix:
        def fetch_one(sn: int):
            url = f"https://www.valmikiramayan.net/utf8/{url_dir}/sarga{sn}/{inner_prefix}sans{sn}.htm"
            cache = CACHE / f"{url_dir}_{sn}.htm"
            html = fetch_cached(url, cache)
            if not html:
                return sn, {}
            return sn, parse_sarga_translation(html)

        with ThreadPoolExecutor(max_workers=8) as ex:
            futs = [ex.submit(fetch_one, sn) for sn in sargas]
            done = 0
            for f in as_completed(futs):
                sn, tr = f.result()
                translations[sn] = tr
                done += 1
                if done % 25 == 0:
                    print(f"  fetched {done}/{len(sargas)}")
        matched = sum(len(v) for v in translations.values())
        print(f"  translations matched: {matched}/{len(shlokas)}")

    chapter_meta: list[dict] = []
    for sn in sargas:
        verses = []
        sh_list = sorted(by_sarga[sn], key=lambda x: x["shloka"])
        tr_map = translations.get(sn, {})
        for sh in sh_list:
            v = {
                "sanskrit": sh["text"].strip(),
            }
            eng = tr_map.get(sh["shloka"])
            if eng:
                v["text"] = eng
            verses.append(v)

        chapter_id = f"{key}-{sn}"
        title = f"Sarga {sn}"
        chapter = {
            "id": chapter_id,
            "section": key,
            "sectionLabel": label,
            "number": sn,
            "title": title,
            "verses": verses,
        }
        (OUT_DATA / f"{chapter_id}.json").write_text(
            json.dumps(chapter, ensure_ascii=False), encoding="utf-8"
        )
        chapter_meta.append({
            "id": chapter_id,
            "number": sn,
            "title": title,
            "verseCount": len(verses),
        })
    return chapter_meta, []


def main():
    sections = []
    order: list[str] = []
    total_v = 0
    total_c = 0
    for i, (json_kaanda, url_dir, inner_prefix, label) in enumerate(KANDAS, start=1):
        chapters, _ = build_kanda(i, json_kaanda, url_dir, inner_prefix, label)
        key = KEY_FOR_JSON[json_kaanda]
        sections.append({"key": key, "label": label, "chapters": chapters})
        for c in chapters:
            order.append(c["id"])
            total_v += c["verseCount"]
            total_c += 1

    index = {
        "slug": "valmiki-ramayana",
        "name": "Valmiki Ramayana",
        "totalChapters": total_c,
        "totalVerses": total_v,
        "sections": sections,
        "order": order,
    }
    INDEX_OUT.write_text(json.dumps(index, ensure_ascii=False), encoding="utf-8")
    print(f"\nWrote index: {total_c} sargas, {total_v} shlokas")


if __name__ == "__main__":
    main()
