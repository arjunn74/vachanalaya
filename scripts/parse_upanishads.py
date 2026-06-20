#!/usr/bin/env python3
"""Parse the 108 Upanishads PDF into structured JSON for Vachanalaya."""
import json
import re
import sys
from pathlib import Path

from pypdf import PdfReader

PDF_PATH = Path(sys.argv[1] if len(sys.argv) > 1 else "/mnt/user-uploads/108-Upanishads-English.pdf")
OUT_DIR = Path("src/data")
OUT_DIR.mkdir(parents=True, exist_ok=True)


def normalize_veda(raw: str) -> str:
    u = raw.upper().replace(" ", "").replace("-", "")
    if u.startswith("RIG"): return "Rig"
    if u.startswith("SUKLA") or u.startswith("SHUKLA"): return "Shukla Yajur"
    if u.startswith("KRISHNA"): return "Krishna Yajur"
    if u.startswith("SAMA"): return "Sama"
    if u.startswith("ATHARV"): return "Atharva"
    return "Unknown"


def slugify(title: str) -> str:
    t = title.lower()
    t = re.sub(r"\bupanishad\b", "", t).strip()
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t or "unknown"


def main():
    reader = PdfReader(str(PDF_PATH))
    total_pages = len(reader.pages)
    print(f"PDF pages: {total_pages}")

    toc_text = ""
    for i in range(1, 5):
        toc_text += "\n" + reader.pages[i].extract_text()

    veda_re = re.compile(r"^\s*([A-Z][A-Z\- ]+?VEDA)\s*\.{2,}\s*(\d+)\s*$")
    item_re = re.compile(r"^\s*(\d{1,3})\s*\.\s*(.+?)\s*\.{2,}\s*(\d{1,4})\s*$")

    veda_marks = []  # (startPage, vedaName)
    items = []       # (num, title, startPage)
    for line in toc_text.splitlines():
        m = veda_re.match(line)
        if m:
            veda_marks.append((int(m.group(2)), normalize_veda(m.group(1))))
            continue
        m = item_re.match(line)
        if m:
            num = int(m.group(1))
            if 1 <= num <= 108:
                items.append((num, m.group(2).strip(), int(m.group(3))))

    # Dedupe items by number
    seen = set()
    uniq = []
    for it in items:
        if it[0] in seen: continue
        seen.add(it[0])
        uniq.append(it)
    items = sorted(uniq, key=lambda x: x[0])
    veda_marks.sort()
    print(f"Veda markers: {veda_marks}")
    print(f"Items: {len(items)}")

    def veda_for(page: int) -> str:
        current = "Unknown"
        for p, v in veda_marks:
            if page >= p:
                current = v
        return current

    # Calibrate offset using Aitareya (item 1, listed at page 7)
    offset = 0
    target_start = items[0][2]
    for cand in range(-2, 5):
        idx = target_start - 1 + cand
        if 0 <= idx < total_pages:
            txt = reader.pages[idx].extract_text() or ""
            if "Aitareya" in txt[:200]:
                offset = cand
                break
    print(f"Page offset: {offset}")

    def get_text(printed_page: int) -> str:
        idx = printed_page - 1 + offset
        if 0 <= idx < total_pages:
            try:
                return reader.pages[idx].extract_text() or ""
            except Exception:
                return ""
        return ""

    header_re = re.compile(r"^[A-Z][A-Z \-]*VEDA\s*$")
    pagenum_re = re.compile(r"^\s*\d{1,4}\s*$")
    verse_re = re.compile(r"^([IVX]+(?:[-.][ivx\d]+){0,3})[\.:]\s+(.*)$", re.S)

    # Compute end pages
    ranges = []
    for i, (num, title, start) in enumerate(items):
        end = items[i + 1][2] - 1 if i + 1 < len(items) else total_pages
        ranges.append((num, title, start, end))

    upanishads = []
    used = {}
    for num, title, start, end in ranges:
        chunks = []
        for p in range(start, end + 1):
            text = get_text(p)
            cleaned = []
            for line in text.splitlines():
                ls = line.strip()
                if not ls:
                    cleaned.append("")
                    continue
                if header_re.match(ls):
                    continue
                if pagenum_re.match(ls):
                    continue
                cleaned.append(line)
            chunks.append("\n".join(cleaned))
        full = "\n".join(chunks)

        paragraphs = re.split(r"\n\s*\n", full)
        verses = []
        for para in paragraphs:
            para = re.sub(r"[ \t]+", " ", para)
            joined = re.sub(r"(?<!\n)\n(?!\n)", " ", para).strip()
            joined = re.sub(r"\s+", " ", joined)
            if not joined:
                continue
            # Split on verse markers within the paragraph
            parts = re.split(r"(?=\b[IVX]+(?:[-.][ivx\d]+){1,3}[\.:]\s)", joined)
            for part in parts:
                part = part.strip()
                if not part:
                    continue
                m = verse_re.match(part)
                if m:
                    verses.append({"id": m.group(1), "text": m.group(2).strip()})
                else:
                    verses.append({"text": part})

        # Drop a leading verse that is just the Upanishad title
        if verses and not verses[0].get("id"):
            t = verses[0]["text"].lower()
            tw = title.lower().split()[0]
            if tw in t[:80] and len(verses[0]["text"]) < 140:
                verses = verses[1:]

        slug = slugify(title)
        if slug in used:
            used[slug] += 1
            slug = f"{slug}-{used[slug]}"
        else:
            used[slug] = 1

        upanishads.append({
            "id": slug,
            "number": num,
            "title": title if title.lower().endswith("upanishad") else f"{title} Upanishad",
            "veda": veda_for(start),
            "verses": verses,
        })

    (OUT_DIR / "upanishads.json").write_text(json.dumps(upanishads, ensure_ascii=False))
    index = [{"id": u["id"], "number": u["number"], "title": u["title"], "veda": u["veda"], "verseCount": len(u["verses"])} for u in upanishads]
    (OUT_DIR / "upanishads-index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2))
    print(f"Wrote {len(upanishads)} upanishads")
    from collections import Counter
    print("By veda:", Counter(u["veda"] for u in upanishads))
    print("First:", upanishads[0]["title"], "verses:", len(upanishads[0]["verses"]))
    if upanishads[0]["verses"][:2]:
        for v in upanishads[0]["verses"][:3]:
            print(" -", v)


if __name__ == "__main__":
    main()
