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

VEDA_HEADINGS = {
    "RIG-VEDA": "Rig",
    "SHUKLA-YAJUR-VEDA": "Shukla Yajur",
    "SHUKLA YAJUR-VEDA": "Shukla Yajur",
    "KRISHNA-YAJUR-VEDA": "Krishna Yajur",
    "KRISHNA YAJUR-VEDA": "Krishna Yajur",
    "SAMA-VEDA": "Sama",
    "SAMA VEDA": "Sama",
    "ATHARVA-VEDA": "Atharva",
    "ATHARVA VEDA": "Atharva",
}

def slugify(title: str) -> str:
    t = title.lower()
    t = re.sub(r"upanishad$", "", t).strip()
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t or "unknown"

def main():
    reader = PdfReader(str(PDF_PATH))
    total_pages = len(reader.pages)
    print(f"PDF pages: {total_pages}")

    # 1) Build TOC by scanning early pages
    toc_text = ""
    for i in range(1, 7):
        toc_text += "\n" + reader.pages[i].extract_text()

    entries = []  # (number, title, veda, startPage1based)
    current_veda = None
    lines = toc_text.splitlines()
    line_re = re.compile(r"^\s*(\d{1,3})\s*\.\s*(.+?)\s*\.{2,}\s*(\d{1,4})\s*$")
    for line in lines:
        stripped = line.strip()
        upper = stripped.upper()
        for key, veda in VEDA_HEADINGS.items():
            if key in upper and len(stripped) < 40:
                current_veda = veda
                break
        m = line_re.match(line)
        if m and current_veda:
            num = int(m.group(1))
            title = m.group(2).strip()
            start = int(m.group(3))
            entries.append((num, title, current_veda, start))

    # Dedupe by number, keep first
    seen = set()
    unique = []
    for e in entries:
        if e[0] in seen:
            continue
        seen.add(e[0])
        unique.append(e)
    entries = unique
    print(f"TOC entries found: {len(entries)}")

    # Compute end pages
    entries_sorted = sorted(entries, key=lambda x: x[3])
    ranges = []
    for i, (num, title, veda, start) in enumerate(entries_sorted):
        end = entries_sorted[i + 1][3] - 1 if i + 1 < len(entries_sorted) else total_pages
        ranges.append((num, title, veda, start, end))

    # Extract page texts (0-based index = pageNumber - 1, but PDF page 1 = printed page 1)
    # The printed pages start from cover; printed page numbers in TOC correspond to PDF page index + offset.
    # By inspection page 0 = "The 108 Upanishads", page 1 = TOC. Printed page numbers seem to map ~directly.
    # Let's calibrate: TOC says Aitareya starts at 7. Find "Aitareya Upanishad" heading in pages.
    offset = 0
    for candidate in range(0, 15):
        try:
            txt = reader.pages[7 + candidate - 1].extract_text() or ""
        except Exception:
            continue
        if "Aitareya" in txt[:300]:
            offset = candidate - 1
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

    header_re = re.compile(r"^(RIG-VEDA|SHUKLA[- ]YAJUR-VEDA|KRISHNA[- ]YAJUR-VEDA|SAMA[- ]VEDA|ATHARVA[- ]VEDA)\s*$", re.I)
    pagenum_re = re.compile(r"^\s*\d{1,4}\s*$")
    verse_re = re.compile(r"^([IVX]+(?:[-.][ivx\d]+){0,3})[\.:]\s+(.*)$")

    upanishads = []
    used_slugs = {}
    for num, title, veda, start, end in ranges:
        chunks = []
        for p in range(start, end + 1):
            text = get_text(p)
            cleaned_lines = []
            for line in text.splitlines():
                ls = line.strip()
                if not ls:
                    cleaned_lines.append("")
                    continue
                if header_re.match(ls):
                    continue
                if pagenum_re.match(ls):
                    continue
                cleaned_lines.append(line)
            chunks.append("\n".join(cleaned_lines))
        full = "\n".join(chunks)

        # Normalize whitespace: join lines that aren't paragraph breaks
        # Split into paragraphs by blank lines
        paragraphs = re.split(r"\n\s*\n", full)
        verses = []
        for para in paragraphs:
            para = re.sub(r"[ \t]+", " ", para)
            # Join soft-wrapped lines (single newlines) into one line
            joined = re.sub(r"(?<!\n)\n(?!\n)", " ", para).strip()
            if not joined:
                continue
            m = verse_re.match(joined)
            if m:
                verses.append({"id": m.group(1), "text": m.group(2).strip()})
            else:
                # Try splitting by verse markers inside the paragraph
                parts = re.split(r"(?=\b[IVX]+(?:[-.][ivx\d]+){1,3}[\.:]\s)", joined)
                added = False
                for part in parts:
                    part = part.strip()
                    if not part:
                        continue
                    m2 = verse_re.match(part)
                    if m2:
                        verses.append({"id": m2.group(1), "text": m2.group(2).strip()})
                    else:
                        verses.append({"text": part})
                    added = True
                if not added:
                    verses.append({"text": joined})

        # Drop the leading title line if present as first verse
        if verses and title.split()[0].lower() in verses[0].get("text", "").lower()[:60] and len(verses[0].get("text","")) < 120:
            verses = verses[1:]

        slug = slugify(title)
        if slug in used_slugs:
            used_slugs[slug] += 1
            slug = f"{slug}-{used_slugs[slug]}"
        else:
            used_slugs[slug] = 1

        upanishads.append({
            "id": slug,
            "number": num,
            "title": title if title.lower().endswith("upanishad") else f"{title} Upanishad",
            "veda": veda,
            "verses": verses,
        })

    upanishads.sort(key=lambda u: u["number"])
    (OUT_DIR / "upanishads.json").write_text(json.dumps(upanishads, ensure_ascii=False, indent=0))
    index = [{"id": u["id"], "number": u["number"], "title": u["title"], "veda": u["veda"], "verseCount": len(u["verses"])} for u in upanishads]
    (OUT_DIR / "upanishads-index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2))
    print(f"Wrote {len(upanishads)} upanishads.")
    print("Sample:", upanishads[0]["title"], "verses:", len(upanishads[0]["verses"]))
    if upanishads[0]["verses"]:
        print("First verse:", upanishads[0]["verses"][0])

if __name__ == "__main__":
    main()
