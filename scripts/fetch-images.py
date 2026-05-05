#!/usr/bin/env python3
"""
Resolve a curated list of (photographer_id, Wikimedia file title) to actual
upload.wikimedia.org URLs via the Commons API, verify each returns 200,
and patch the matching work entry in photographers.json.

Targets only public-domain works (pre-1929 US, pre-EU 70-year, FSA,
Library of Congress holdings). Modern copyrighted works (Avedon, Newton,
Cartier-Bresson) intentionally NOT in this list.

Run:  python3 scripts/fetch-images.py
"""

import json
import subprocess
import time
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PHO = ROOT / "src" / "data" / "photographers.json"

# (photographer_id, work_index, Wikimedia File: title without 'File:' prefix)
# 选取明确公有领域 (作者过世 70+ 年 OR FSA/LoC 政府作品)
# 即便部分 URL 解析失败,fallback 占位仍然能用。
TARGETS = [
    # ── 19 世纪开山 ─────────────────────────────────────────
    ("niepce", 0, "View from the Window at Le Gras, Joseph Nicéphore Niépce.jpg"),
    ("daguerre", 0, "Boulevard du Temple by Daguerre.jpg"),
    ("talbot", 0, "Latticed window at lacock abbey 1835.jpg"),
    ("nadar", 0, "Sarah Bernhardt by Nadar"),
    ("atget", 0, "Atget Avenue des Gobelins"),
    ("marey", 0, "Marey chronophotograph"),

    # ── 维多利亚 / 早期 ────────────────────────────────────
    ("cameron", 0, "Julia Margaret Cameron Sir John Herschel"),
    ("muybridge", 0, "The Horse in Motion-anim.gif"),
    ("brady", 0, "Mathew Brady Civil War portrait Lincoln"),
    ("curtis", 0, "Edward Curtis Canyon de Chelly Navajo"),

    # ── Pictorialism ───────────────────────────────────────
    ("stieglitz", 0, "Alfred Stieglitz - The Steerage - Google Art Project.jpg"),
    ("steichen", 0, "Edward Steichen The Pond Moonlight 1904"),
    ("kasebier", 0, "Gertrude Käsebier Blessed Art Thou Among Women"),
    ("drtikol", 0, "Drtikol Wave"),
    ("lang-jingshan", 0, "Lang Jingshan Spring Trees"),

    # ── Russian Constructivism ─────────────────────────────
    ("rodchenko", 0, "Rodchenko Stairs"),
    ("lissitzky", 0, "El Lissitzky The Constructor self portrait"),

    # ── New Objectivity ────────────────────────────────────
    ("sander", 0, "August Sander Young Farmers Westerwald"),
    ("renger-patzsch", 0, "Renger-Patzsch factory pipes"),

    # ── Czech / Central European ───────────────────────────
    ("sudek", 0, "Josef Sudek Prague window"),

    # ── 直接摄影 / f64 ─────────────────────────────────────
    ("strand", 0, "Paul Strand Wall Street 1915"),
    ("a-adams", 0, "Ansel Adams Moonrise Hernandez New Mexico"),
    ("e-weston", 0, "Edward Weston Pepper No. 30"),
    ("abbott", 0, "Berenice Abbott Nightview New York"),

    # ── FSA (US gov) ───────────────────────────────────────
    ("lange", 0, "Migrant Mother by Dorothea Lange"),
    ("evans", 0, "Walker Evans Allie Mae Burroughs"),
    ("rothstein", 0, "Dust storm Cimarron County Oklahoma 1936"),

    # ── 拉美 ───────────────────────────────────────────────
    ("modotti", 0, "Tina Modotti workers parade"),
    ("chambi", 0, "Martín Chambi self portrait Machu Picchu"),

    # ── 美国黑人 ───────────────────────────────────────────
    ("parks", 0, "American Gothic Gordon Parks 1942"),
    ("van-der-zee", 0, "James Van Der Zee Couple Harlem"),
]


COMMONS_API = "https://commons.wikimedia.org/w/api.php"


def curl_get(url):
    """curl GET → response body (str) or None."""
    try:
        out = subprocess.run(
            ["curl", "-sSL", "--max-time", "12",
             "-H", "User-Agent: photo-history/1.0 (curated-data)",
             url],
            capture_output=True, text=True, check=False,
        )
        if out.returncode != 0:
            print(f"  curl GET err ({out.returncode}): {out.stderr.strip()[:160]}")
            return None
        return out.stdout
    except Exception as e:
        print(f"  curl error: {e}")
        return None


def resolve_by_title(title):
    """Query Commons API for the imageinfo URL by exact File: title."""
    params = {
        "action": "query",
        "titles": f"File:{title}",
        "prop": "imageinfo",
        "iiprop": "url|mime",
        "format": "json",
    }
    qs = urllib.parse.urlencode(params)
    body = curl_get(f"{COMMONS_API}?{qs}")
    if body is None:
        return None
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return None
    pages = data.get("query", {}).get("pages", {})
    if not pages:
        return None
    page = next(iter(pages.values()))
    if "missing" in page or "imageinfo" not in page:
        return None
    info = page["imageinfo"][0]
    return info.get("url"), title


def search_file(query):
    """Search Commons in file namespace, return list of File: titles."""
    params = {
        "action": "query",
        "list": "search",
        "srsearch": query,
        "srnamespace": "6",  # File: namespace
        "srlimit": "5",
        "format": "json",
    }
    qs = urllib.parse.urlencode(params)
    body = curl_get(f"{COMMONS_API}?{qs}")
    if body is None:
        return []
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return []
    return [hit["title"].removeprefix("File:") for hit in data.get("query", {}).get("search", [])]


def resolve_file(title_or_query):
    """First try exact title; if not found, search and try top hits."""
    r = resolve_by_title(title_or_query)
    if r:
        return r
    print(f"  exact miss, searching: {title_or_query!r}")
    for cand in search_file(title_or_query):
        print(f"    candidate: {cand}")
        r = resolve_by_title(cand)
        if r:
            return r
    return None


def strip_utm(url):
    """Drop ?utm_source=... query string Commons API appends for analytics."""
    return url.split("?", 1)[0] if "?utm_" in url else url


def head_check(url):
    """curl --head — returns True if 200/30x (Commons sometimes redirects)."""
    try:
        out = subprocess.run(
            ["curl", "-sI", "--max-time", "10",
             "-H", "User-Agent: photo-history/1.0 (curated-data)",
             url],
            capture_output=True, text=True, check=False,
        )
        if out.returncode != 0:
            return False
        first_line = out.stdout.splitlines()[0] if out.stdout else ""
        return "200" in first_line or "302" in first_line or "301" in first_line
    except Exception:
        return False


def main():
    pho = json.loads(PHO.read_text(encoding="utf-8"))
    by_id = {p["id"]: p for p in pho}

    matched = 0
    failed = 0
    skipped = 0
    for pid, idx, title in TARGETS:
        p = by_id.get(pid)
        if not p:
            print(f"⨯ photographer not found: {pid}")
            continue
        if idx >= len(p.get("works", [])):
            print(f"⨯ {pid}: works[{idx}] out of range")
            continue
        # idempotent: skip if already has a verified image
        if p["works"][idx].get("image"):
            print(f"= {pid}: already has image, skipping")
            skipped += 1
            continue

        # rate-limit Commons API
        time.sleep(3.0)
        result = resolve_file(title)
        if not result:
            print(f"⨯ {pid}: cannot resolve {title!r}")
            failed += 1
            continue
        url, used_title = result
        url = strip_utm(url)

        if not head_check(url):
            print(f"⨯ {pid}: HEAD !=200 for {url}")
            failed += 1
            continue

        p["works"][idx]["image"] = url
        # source attribution to the file's commons page
        sources = p.setdefault("sources", [])
        commons_page = (
            "https://commons.wikimedia.org/wiki/File:"
            + urllib.parse.quote(used_title.replace(" ", "_"))
        )
        if commons_page not in sources:
            sources.append(commons_page)
        print(f"✓ {pid}: {url}")
        matched += 1

    PHO.write_text(json.dumps(pho, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n{matched} new · {skipped} already · {failed} failed · {len(TARGETS)} attempted")


if __name__ == "__main__":
    main()
