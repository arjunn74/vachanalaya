#!/usr/bin/env python3
"""Parse the Shiva Purana PDF (Vol. 1) into structured JSON for Vachanalaya.

This PDF (Motilal Banarsidass English translation, 1085 pages) contains the
Mahatmya (Glory), the Vidyesvara Samhita, and all five sections of the Rudra
Samhita. Chapters in the body are introduced by a "CHAPTER <ONE|TWO|...>"
heading followed by a parenthesized title, and each major section restarts
chapter numbering at ONE.
"""
import json
import re
import sys
from pathlib import Path

from pypdf import PdfReader

PDF_PATH = Path(
    sys.argv[1] if len(sys.argv) > 1 else "/mnt/user-uploads/Siva-The-Siva-Purana-English.pdf"
)
OUT_DIR = Path("src/data")
OUT_DIR.mkdir(parents=True, exist_ok=True)

NUM_WORDS = [
    "ONE","TWO","THREE","FOUR","FIVE","SIX","SEVEN","EIGHT","NINE","TEN",
    "ELEVEN","TWELVE","THIRTEEN","FOURTEEN","FIFTEEN","SIXTEEN","SEVENTEEN","EIGHTEEN","NINETEEN","TWENTY",
    "TWENTYONE","TWENTYTWO","TWENTYTHREE","TWENTYFOUR","TWENTYFIVE","TWENTYSIX","TWENTYSEVEN","TWENTYEIGHT","TWENTYNINE","THIRTY",
    "THIRTYONE","THIRTYTWO","THIRTYTHREE","THIRTYFOUR","THIRTYFIVE","THIRTYSIX","THIRTYSEVEN","THIRTYEIGHT","THIRTYNINE","FORTY",
    "FORTYONE","FORTYTWO","FORTYTHREE","FORTYFOUR","FORTYFIVE","FORTYSIX","FORTYSEVEN","FORTYEIGHT","FORTYNINE","FIFTY",
    "FIFTYONE","FIFTYTWO","FIFTYTHREE","FIFTYFOUR","FIFTYFIVE","FIFTYSIX","FIFTYSEVEN","FIFTYEIGHT","FIFTYNINE","SIXTY",
    "SIXTYONE","SIXTYTWO","SIXTYTHREE",
]
W2N = {w: i + 1 for i, w in enumerate(NUM_WORDS)}

# Tolerate occasional spurious whitespace from pypdf (e.g. "CHA PTER ONE").
CHAPTER_RE = re.compile(
    r"^\s*C\s*H\s*A\s*P\s*T\s*E\s*R\s+(" + "|".join(NUM_WORDS) + r")\s*$"
)
TITLE_PAREN_RE = re.compile(r"^\s*\(\s*(.+?)\s*\)\s*$")
RUNNING_HEADER_RE = re.compile(
    r"^\s*("
    r"S\s*I\s*V\s*A\s*P\s*U\s*R\s*A\s*N\s*A|"
    r"Sivapuran[a\u0101]|Sivapur[a\u0101][~n]a|"
    r"Rudrasa[mn]hit[a\u0101]|Vidye[s\u015b\u1e63]varasa[mn]hit[a\u0101]|"
    r"\u015aivapur[\u0101a]\u1e47a"
    r")",
    re.IGNORECASE,
)
PAGENUM_RE = re.compile(r"^\s*\d{1,4}\s*$")
SPEAKER_RE = re.compile(r"^[A-Z][A-Za-z\u00C0-\u017F\.\(\)\u015b\u1e63\u0101\u1e47]+\s+said\s*:?-?\s*$")


def slugify(text: str) -> str:
    t = re.sub(r"[^A-Za-z0-9]+", "-", text.lower()).strip("-")
    return t or "chapter"


def main() -> None:
    reader = PdfReader(str(PDF_PATH))
    pages = []
    for i in range(len(reader.pages)):
        try:
            pages.append(reader.pages[i].extract_text() or "")
        except Exception:
            pages.append("")
    print(f"Pages: {len(pages)}")

    # 1. Locate every CHAPTER heading (line-anchored, tolerant of letter-spacing).
    raw_hits: list[tuple[int, int, int]] = []  # (page_index, line_index, chapter_num)
    for pi, text in enumerate(pages):
        for li, line in enumerate(text.splitlines()):
            m = CHAPTER_RE.match(line)
            if m:
                raw_hits.append((pi, li, W2N[m.group(1)]))
                break  # one chapter heading per page

    print(f"Detected {len(raw_hits)} chapter headings")

    # 2. The book is divided into 7 sections; each begins with CHAPTER ONE.
    SECTIONS = [
        ("glory",      "Mahatmya",       "The Glory of Sivapurana"),
        ("vidyesvara", "Vidyesvara",     "Vidyesvara Samhita"),
        ("creation",   "Rudra: Creation","Rudra Samhita — Creation"),
        ("sati",       "Rudra: Sati",    "Rudra Samhita — Sati"),
        ("parvati",    "Rudra: Parvati", "Rudra Samhita — Parvati"),
        ("kumara",     "Rudra: Kumara",  "Rudra Samhita — Kumara"),
        ("yuddha",     "Rudra: Yuddha",  "Rudra Samhita — The Battles"),
    ]
    section_starts = [h for h in raw_hits if h[2] == 1]
    if len(section_starts) != len(SECTIONS):
        raise SystemExit(
            f"Expected {len(SECTIONS)} CHAPTER ONE boundaries, got {len(section_starts)}: {section_starts}"
        )

    # Map each chapter heading to a section index.
    def section_for(pi: int) -> int:
        idx = 0
        for s_i, (spi, _, _) in enumerate(section_starts):
            if pi >= spi:
                idx = s_i
        return idx

    # 3. Build chapter records with page ranges.
    chapters_meta = []
    for idx, (pi, li, num) in enumerate(raw_hits):
        end_pi = raw_hits[idx + 1][0] - 1 if idx + 1 < len(raw_hits) else len(pages) - 1
        # Edge case: next chapter starts on same page → use same page
        if idx + 1 < len(raw_hits) and raw_hits[idx + 1][0] == pi:
            end_pi = pi
        chapters_meta.append({"start_pi": pi, "start_li": li, "end_pi": end_pi, "section": section_for(pi)})

    # 4. Renumber chapters within each section (in detection order).
    by_section: dict[int, list[dict]] = {}
    for c in chapters_meta:
        by_section.setdefault(c["section"], []).append(c)
    for s_i, lst in by_section.items():
        for new_n, c in enumerate(lst, 1):
            c["number"] = new_n

    # 5. Extract title + body for each chapter.
    chapters_out = []
    global_n = 0
    for c in chapters_meta:
        sec_slug, sec_short, sec_full = SECTIONS[c["section"]]
        # Title: scan the next non-empty lines after the heading on its page;
        # accept a parenthesized line, else first short non-speaker line.
        first_page_lines = pages[c["start_pi"]].splitlines()
        title = None
        body_start_li = c["start_li"] + 1
        for k in range(c["start_li"] + 1, min(c["start_li"] + 8, len(first_page_lines))):
            ls = first_page_lines[k].strip()
            if not ls:
                continue
            m = TITLE_PAREN_RE.match(ls)
            if m:
                title = m.group(1).strip()
                body_start_li = k + 1
                break
            if SPEAKER_RE.match(ls) or re.match(r"^\d+[\.\-]", ls):
                break
            # accept a short non-speaker line as a title fallback
            if len(ls) < 80:
                title = ls.strip("()")
                body_start_li = k + 1
                break
        if not title:
            title = f"Chapter {c['number']}"

        # Gather body lines: rest of start page + intermediate full pages + start of next chapter's page
        body_lines: list[str] = first_page_lines[body_start_li:]
        for pi in range(c["start_pi"] + 1, c["end_pi"] + 1):
            body_lines.append("")  # paragraph break between pages
            body_lines.extend(pages[pi].splitlines())

        cleaned: list[str] = []
        for line in body_lines:
            ls = line.strip()
            if not ls:
                cleaned.append("")
                continue
            if RUNNING_HEADER_RE.match(ls):
                continue
            if PAGENUM_RE.match(ls):
                continue
            cleaned.append(line)
        full = "\n".join(cleaned)

        # Split into paragraphs on blank lines, then collapse soft wraps.
        paras = re.split(r"\n\s*\n+", full)
        verses = []
        for para in paras:
            joined = re.sub(r"[ \t]+", " ", para)
            joined = re.sub(r"(?<!\n)\n(?!\n)", " ", joined)
            joined = re.sub(r"\s+", " ", joined).strip()
            # Hyphenated soft-break artifacts: "exam­ple" or "exam- ple"
            joined = re.sub(r"[\u00ad]\s*", "", joined)
            joined = re.sub(r"(\w)-\s+(\w)", r"\1\2", joined)
            if not joined:
                continue
            verses.append({"text": joined})

        global_n += 1
        slug_base = slugify(title)[:60] or f"chapter-{c['number']}"
        cid = f"{sec_slug}-{c['number']:02d}-{slug_base}"
        chapters_out.append({
            "id": cid,
            "section": sec_slug,
            "sectionShort": sec_short,
            "sectionFull": sec_full,
            "number": c["number"],
            "globalNumber": global_n,
            "title": title,
            "verses": verses,
        })

    (OUT_DIR / "shiva-purana.json").write_text(json.dumps(chapters_out, ensure_ascii=False))
    index = [
        {
            "id": c["id"],
            "section": c["section"],
            "sectionShort": c["sectionShort"],
            "sectionFull": c["sectionFull"],
            "number": c["number"],
            "globalNumber": c["globalNumber"],
            "title": c["title"],
            "verseCount": len(c["verses"]),
        }
        for c in chapters_out
    ]
    (OUT_DIR / "shiva-purana-index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2))

    from collections import Counter
    counts = Counter(c["section"] for c in chapters_out)
    print("Wrote", len(chapters_out), "chapters")
    print("By section:", dict(counts))
    print("First chapter:", chapters_out[0]["title"], "verses:", len(chapters_out[0]["verses"]))
    for v in chapters_out[0]["verses"][:2]:
        print(" -", v["text"][:120])


if __name__ == "__main__":
    main()
