#!/usr/bin/env python3
"""Parse the Bhagavad Gita PDF into structured JSON for Vachanalaya.

Uses pdftotext (poppler) for cleaner extraction, then a small post-processing
pass to repair fi/fl ligatures that the PDF font dropped during extraction.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

PDF_PATH = Path(sys.argv[1] if len(sys.argv) > 1 else "/mnt/user-uploads/Bhagavad-Gita-English.pdf")
OUT_DIR = Path("src/data")
OUT_DIR.mkdir(parents=True, exist_ok=True)

CHAPTER_WORDS = [
    "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
    "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
    "SEVENTEEN", "EIGHTEEN",
]
# pdftotext spreads "CHAPTER ONE" as "C H AP T E R O N E"; build a tolerant matcher
def _spaced(word):
    return r"\s*".join(list(word))
CHAPTER_RE = re.compile(
    r"^\s*" + _spaced("CHAPTER") + r"\s+(" + "|".join(_spaced(w) for w in CHAPTER_WORDS) + r")\s*$"
)
VERSE_RE = re.compile(r"^TEXTS?\s+(\d+(?:\s*[–\-]\s*\d+)?)\s*$")

# Stems that resulted from a dropped "f" in fi/fl ligatures. Restricted to
# non-English stems so we don't accidentally glue real words together.
FI_STEMS = [
    "ield", "ields", "ight", "ights", "ighting", "ighter", "ighters",
    "ind", "inds", "inding", "inal", "inally", "inalize", "inance",
    "inances", "inancial", "ine", "ines", "inest", "inger", "ingers",
    "inish", "inished", "inishes", "ire", "ires", "ireplace",
    "irst", "ish", "ished", "ishing", "ive", "ives", "ively",
    "ix", "ixed", "ixes", "ixing", "igure", "igures",
    "icant", "icantly", "ication", "ications",
    "ic", "icial", "icially", "ift", "ifth", "ifty", "ifteen",
    "ictional", "iction", "ictions", "ictitious",
    "led", "less", "ll", "ller", "lls", "lling", "lly",
    "rst", "nal", "nally", "nd", "nds", "nish", "nished",
]
FL_STEMS = [
    "ight", "ights", "ighting",
    "ow", "ows", "owed", "owing", "owers", "ower",
    "uence", "uences", "uenced", "uencing", "uent",
    "uid", "uids", "uidly",
    "oor", "oors", "ock", "ocks", "ocked",
    "ood", "oods", "ooded", "ush", "ushed",
    "ame", "ames", "ag", "ags",
    "uctuate", "uctuation", "uctuations",
]

# Build replacement regexes
def _build_join_re(stems):
    # Word boundary + lowercase letter + space + stem (case-insensitive on stem? keep lower)
    return re.compile(r"(?<=[A-Za-z]) (" + "|".join(sorted(set(stems), key=len, reverse=True)) + r")\b")

def _build_start_re(stems):
    return re.compile(r"(?<![A-Za-z])(" + "|".join(sorted(set(stems), key=len, reverse=True)) + r")\b")

FI_JOIN_RE = _build_join_re(FI_STEMS)
FL_JOIN_RE = _build_join_re(FL_STEMS)
FI_START_RE = _build_start_re([s for s in FI_STEMS if s not in ("ic", "ive", "ire", "ix")])
FL_START_RE = _build_start_re([s for s in FL_STEMS if s not in ("ow", "ame", "ag")])

def fix_ligatures(text: str) -> str:
    text = FI_JOIN_RE.sub(lambda m: "fi" + m.group(1), text)
    text = FL_JOIN_RE.sub(lambda m: "fl" + m.group(1), text)
    # only apply start-of-token rules cautiously
    text = re.sub(r"\b ight\b", " fight", text)
    text = re.sub(r"\b ind\b", " find", text)
    text = re.sub(r"\b ire\b", " fire", text)
    return text

def extract_text() -> str:
    out = subprocess.run(
        ["pdftotext", "-enc", "UTF-8", str(PDF_PATH), "-"],
        check=True, capture_output=True,
    )
    return out.stdout.decode("utf-8", errors="replace")

def normalize_chapter_marker(line: str) -> int | None:
    s = line.strip()
    m = CHAPTER_RE.match(s)
    if not m:
        return None
    raw = re.sub(r"\s+", "", m.group(1)).upper()
    if raw in CHAPTER_WORDS:
        return CHAPTER_WORDS.index(raw) + 1
    return None

def slugify(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s

def main():
    raw = extract_text()
    raw = fix_ligatures(raw)
    lines = raw.splitlines()
    print(f"Lines: {len(lines)}", file=sys.stderr)

    chapter_starts = []
    for i, ln in enumerate(lines):
        n = normalize_chapter_marker(ln)
        if n:
            chapter_starts.append((i, n))

    seen = {}
    for idx, num in chapter_starts:
        if num not in seen:
            seen[num] = idx
    starts = sorted(seen.items(), key=lambda kv: kv[1])
    starts = [(idx, num) for num, idx in starts]
    starts.sort()
    print(f"Chapters: {[n for _, n in starts]}", file=sys.stderr)

    chapters = []
    for ci, (start, num) in enumerate(starts):
        end = starts[ci + 1][0] if ci + 1 < len(starts) else len(lines)
        body = lines[start + 1:end]

        # title: non-empty lines before first VERSE marker
        title_lines = []
        verse_start = None
        for j, ln in enumerate(body):
            s = ln.strip()
            if VERSE_RE.match(s):
                verse_start = j
                break
            if s and not s.lower().startswith("illustration") and not re.fullmatch(r"[\W_]+", s):
                title_lines.append(s)
        title = re.sub(r"\s+", " ", " ".join(title_lines)).strip() or f"Chapter {num}"

        verses = []
        if verse_start is not None:
            cur_id = None
            cur_buf = []
            for ln in body[verse_start:]:
                s = ln.strip()
                m = VERSE_RE.match(s)
                if m:
                    if cur_id is not None:
                        verses.append({"id": cur_id, "text": _clean("\n".join(cur_buf))})
                    cur_id = re.sub(r"\s+", "", m.group(1))
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

    (OUT_DIR / "gita.json").write_text(json.dumps(chapters, ensure_ascii=False, indent=2))
    idx = [{"id": c["id"], "number": c["number"], "title": c["title"], "verseCount": len(c["verses"])} for c in chapters]
    (OUT_DIR / "gita-index.json").write_text(json.dumps(idx, ensure_ascii=False, indent=2))
    print(f"Wrote {len(chapters)} chapters, {sum(len(c['verses']) for c in chapters)} verses", file=sys.stderr)

def _clean(text: str) -> str:
    # Drop page-break artifacts: bare numbers on their own line (page numbers)
    out = []
    for ln in text.splitlines():
        s = ln.strip()
        if re.fullmatch(r"\d{1,4}", s):
            continue
        out.append(ln)
    text = "\n".join(out)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text

if __name__ == "__main__":
    main()
