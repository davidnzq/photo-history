#!/usr/bin/env python3
"""
为每位摄影师补全 sources 字段 (英文 Wikipedia 词条 URL).

策略:
- 通过 MediaWiki API 用 photographer.name (英文/拉丁) 搜索词条
- 取第一条非消歧义结果, 提取 canonicalurl
- 仅在 sources 为空 / 不含 Wikipedia 链接时才补
- curl 调用, 限速 2s/次

Run:  python3 scripts/enrich-data.py
"""

import json
import subprocess
import time
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PHO = ROOT / "src" / "data" / "photographers.json"

EN_API = "https://en.wikipedia.org/w/api.php"


def curl_json(url):
    try:
        out = subprocess.run(
            ["curl", "-sSL", "--max-time", "12",
             "-H", "User-Agent: photo-history/1.0 (curated-data)",
             url],
            capture_output=True, text=True, check=False,
        )
        if out.returncode != 0:
            return None
        return json.loads(out.stdout)
    except Exception:
        return None


def find_wiki_url(name: str) -> str | None:
    """search en.wikipedia, then resolve canonical URL."""
    # Step 1: search
    qs = urllib.parse.urlencode({
        "action": "query",
        "list": "search",
        "srsearch": f'{name} photographer',
        "srlimit": "3",
        "format": "json",
    })
    data = curl_json(f"{EN_API}?{qs}")
    if not data:
        return None
    hits = data.get("query", {}).get("search", [])
    if not hits:
        return None

    # Step 2: pick best — prefer exact title match, then first hit
    title = None
    name_lower = name.lower()
    for h in hits:
        if h["title"].lower() == name_lower:
            title = h["title"]
            break
    if not title:
        title = hits[0]["title"]

    # Step 3: canonicalurl
    qs2 = urllib.parse.urlencode({
        "action": "query",
        "titles": title,
        "prop": "info",
        "inprop": "url",
        "format": "json",
    })
    data2 = curl_json(f"{EN_API}?{qs2}")
    if not data2:
        # fallback: construct standard URL
        return f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"
    pages = data2.get("query", {}).get("pages", {})
    if not pages:
        return None
    page = next(iter(pages.values()))
    return page.get("canonicalurl") or page.get("fullurl")


def main():
    pho = json.loads(PHO.read_text(encoding="utf-8"))

    new = 0
    skipped = 0
    failed = 0
    for p in pho:
        existing = p.get("sources", [])
        has_wiki = any("wikipedia.org" in s for s in existing)
        if has_wiki:
            skipped += 1
            continue

        time.sleep(2.0)
        url = find_wiki_url(p["name"])
        if not url:
            print(f"⨯ {p['id']}: cannot resolve Wikipedia for {p['name']!r}")
            failed += 1
            continue

        srcs = list(existing)
        if url not in srcs:
            srcs.append(url)
        p["sources"] = srcs
        print(f"✓ {p['id']}: {url}")
        new += 1

    PHO.write_text(json.dumps(pho, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n{new} new · {skipped} already · {failed} failed · {len(pho)} total")


if __name__ == "__main__":
    main()
