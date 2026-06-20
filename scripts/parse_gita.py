#!/usr/bin/env python3
"""Parse the Bhagavad Gita PDF into structured JSON for Vachanalaya."""
import json
import re
import sys
from pathlib import Path

from pypdf import PdfReader

PDF_PATH = Path(sys.argv[1] if len(sys.argv) > 1 else "/mnt/user-uploads/Bhagavad-Gita-English.pdf")
OUT_DIR = Path("src/data")
OUT_DIR.mkdir(parents=True, exist_ok=True)

CHAPTER_WORDS = [
    "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
    "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
    "SEVENTEEN", "EIGHTEEN",
]
CHAPTER_RE = re.compile(r"^CHAPTER\s+(" + "|".join(CHAPTER_WORDS) + r")\s*$")
# Verse markers like "TEXT 1", "TEXTS 16–18", "TEXT 16-18"
VERSE_RE = re.compile(r"^TEXTS?\s+(\d+(?:\s*[–\-]\s*\d+)?)\s*$")

def slugify(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s

def main():
    reader = PdfReader(str(PDF_PATH))
    print(f"Pages: {len(reader.pages)}", file=sys.stderr)
    all_lines: list[str] = []
    for page in reader.pages:
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        for ln in text.splitlines():
            all_lines.append(ln.rstrip())

    # Find chapter boundaries
    chapter_starts: list[tuple[int, int]] = []  # (line_idx, chapter_number)
    for i, ln in enumerate(all_lines):
        m = CHAPTER_RE.match(ln.strip())
        if m:
            num = CHAPTER_WORDS.index(m.group(1)) + 1
            chapter_starts.append((i, num))

    # Dedupe: keep only first occurrence of each chapter number (later refs in TOC pages)
    seen = {}
    for idx, num in chapter_starts:
        if num not in seen:
            seen[num] = idx
    chapter_starts = sorted(seen.items(), key=lambda x: x[0])  # (num, idx)
    chapter_starts = [(idx, num) for num, idx in chapter_starts]
    chapter_starts.sort()
    print(f"Detected chapters: {[n for _, n in chapter_starts]}", file=sys.stderr)

    chapters = []
    for ci, (start, num) in enumerate(chapter_starts):
        end = chapter_starts[ci + 1][0] if ci + 1 < len(chapter_starts) else len(all_lines)
        body = all_lines[start + 1:end]

        # Extract title: non-empty lines after CHAPTER X, before first VERSE marker
        title_lines: list[str] = []
        verse_start = None
        for j, ln in enumerate(body):
            s = ln.strip()
            if VERSE_RE.match(s):
                verse_start = j
                break
            if s and not s.startswith("Illustration"):
                title_lines.append(s)
        title = " ".join(title_lines).strip() or f"Chapter {num}"
        # Clean leading punctuation/noise
        title = re.sub(r"\s+", " ", title)

        # Split verses
        verses = []
        if verse_start is not None:
            cur_id = None
            cur_buf: list[str] = []
            for ln in body[verse_start:]:
                s = ln.strip()
                m = VERSE_RE.match(s)
                if m:
                    if cur_id is not None:
                        verses.append({"id": cur_id, "text": _clean("\n".join(cur_buf))})
                    cur_id = m.group(1).replace(" ", "")
                    cur_buf = []
                else:
                    cur_buf.append(ln)
            if cur_id is not None:
                verses.append({"id": cur_id, "text": _clean("\n".join(cur_buf))})

        chapters.append({
            "id": f"chapter-{num}",
            "number": num,
            "title": title,
            "verses": verses,
        })

    # Write outputs
    full = OUT_DIR / "gita.json"
    idx_file = OUT_DIR / "gita-index.json"
    full.write_text(json.dumps(chapters, ensure_ascii=False, indent=2))
    idx = [{"id": c["id"], "number": c["number"], "title": c["title"], "verseCount": len(c["verses"])} for c in chapters]
    idx_file.write_text(json.dumps(idx, ensure_ascii=False, indent=2))
    print(f"Wrote {full} ({len(chapters)} chapters, {sum(len(c['verses']) for c in chapters)} verses)", file=sys.stderr)

def _clean(text: str) -> str:
    # Collapse 3+ blank lines, trim ends
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text

if __name__ == "__main__":
    main()
