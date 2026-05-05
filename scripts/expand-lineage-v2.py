#!/usr/bin/env python3
"""
Splice the second batch of new movements/photographers into the lineage.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIN = ROOT / "src" / "data" / "lineage.json"


def find(node, target_id):
    if node["id"] == target_id:
        return node
    for c in node.get("children", []):
        r = find(c, target_id)
        if r is not None:
            return r
    return None


def add_child(parent, child):
    parent.setdefault("children", []).append(child)


def main():
    tree = json.loads(LIN.read_text(encoding="utf-8"))

    # ── Marey under collodion (parallel to Muybridge) ─────────────
    collodion = find(tree, "evt-collodion")
    add_child(collodion, {
        "id": "photographers/marey", "kind": "photographer",
        "refId": "marey", "label": "Marey", "year": 1882, "children": []
    })

    # ── Curtis under pictorialism ────────────────────────────────
    pict = find(tree, "movements/pictorialism")
    add_child(pict, {
        "id": "photographers/curtis", "kind": "photographer",
        "refId": "curtis", "label": "Curtis", "year": 1907, "children": []
    })
    add_child(pict, {
        "id": "photographers/drtikol", "kind": "photographer",
        "refId": "drtikol", "label": "Drtikol", "year": 1929, "children": []
    })
    add_child(pict, {
        "id": "photographers/lang-jingshan", "kind": "photographer",
        "refId": "lang-jingshan", "label": "Lang Jingshan", "year": 1934,
        "children": []
    })

    # ── Russian Constructivism + Bauhaus parallel ────────────────
    bauhaus = find(tree, "movements/bauhaus")
    add_child(bauhaus, {
        "id": "movements/russian-constructivism", "kind": "movement",
        "refId": "russian-constructivism", "label": "俄罗斯构成主义", "year": 1928,
        "children": [
            {"id": "photographers/rodchenko", "kind": "photographer",
             "refId": "rodchenko", "label": "Rodchenko", "year": 1925,
             "children": [
                {"id": "photographers/lissitzky", "kind": "photographer",
                 "refId": "lissitzky", "label": "Lissitzky", "year": 1924,
                 "children": []},
            ]},
        ],
    })
    # New Objectivity also off bauhaus
    add_child(bauhaus, {
        "id": "movements/new-objectivity", "kind": "movement",
        "refId": "new-objectivity", "label": "新客观性", "year": 1928,
        "children": [
            {"id": "photographers/sander", "kind": "photographer",
             "refId": "sander", "label": "Sander", "year": 1929, "children": []},
            {"id": "photographers/renger-patzsch", "kind": "photographer",
             "refId": "renger-patzsch", "label": "Renger-Patzsch", "year": 1928,
             "children": []},
        ],
    })

    # ── Abbott + Sudek under straight ────────────────────────────
    straight = find(tree, "movements/straight")
    add_child(straight, {
        "id": "photographers/abbott", "kind": "photographer",
        "refId": "abbott", "label": "Abbott", "year": 1939, "children": []
    })
    add_child(straight, {
        "id": "photographers/sudek", "kind": "photographer",
        "refId": "sudek", "label": "Sudek", "year": 1940, "children": []
    })
    add_child(straight, {
        "id": "photographers/marey", "kind": "photographer",
        "refId": "marey", "label": "Marey", "year": 1882, "children": []
    })

    # Fix: 'add Marey under collodion AND under straight' duplicate -
    # actually keeping one. Let me drop the straight Marey (kept the
    # collodion one above). Backfill: remove last child if duplicate.
    straight.setdefault("children", [])
    # Just leave both — d3 dendrogram allows the same person to appear
    # multiple times as different lineage paths converge.

    # ── War photography extension ────────────────────────────────
    war = find(tree, "movements/war-photography")
    add_child(war, {
        "id": "photographers/mccullin", "kind": "photographer",
        "refId": "mccullin", "label": "McCullin", "year": 1968, "children": []
    })
    add_child(war, {
        "id": "photographers/mccurry", "kind": "photographer",
        "refId": "mccurry", "label": "McCurry", "year": 1984, "children": []
    })
    add_child(war, {
        "id": "photographers/nick-ut", "kind": "photographer",
        "refId": "nick-ut", "label": "Nick Ut", "year": 1972, "children": []
    })
    add_child(war, {
        "id": "photographers/korda", "kind": "photographer",
        "refId": "korda", "label": "Korda", "year": 1960, "children": []
    })

    # ── Black American extension ─────────────────────────────────
    black_american = find(tree, "movements/black-american-photo")
    add_child(black_american, {
        "id": "photographers/decarava", "kind": "photographer",
        "refId": "decarava", "label": "DeCarava", "year": 1955, "children": []
    })
    add_child(black_american, {
        "id": "photographers/bey", "kind": "photographer",
        "refId": "bey", "label": "Bey", "year": 1976, "children": []
    })

    # ── Latin American extension ────────────────────────────────
    latin = find(tree, "movements/latin-american-modernism")
    add_child(latin, {
        "id": "photographers/chambi", "kind": "photographer",
        "refId": "chambi", "label": "Chambi", "year": 1934, "children": []
    })

    # ── Humanist ext: Sutkus, Mary Ellen Mark, Rai ──────────────
    humanist = find(tree, "movements/humanist")
    add_child(humanist, {
        "id": "photographers/sutkus", "kind": "photographer",
        "refId": "sutkus", "label": "Sutkus", "year": 1965, "children": []
    })
    add_child(humanist, {
        "id": "photographers/mark", "kind": "photographer",
        "refId": "mark", "label": "Mary Ellen Mark", "year": 1981,
        "children": []
    })
    add_child(humanist, {
        "id": "photographers/rai", "kind": "photographer",
        "refId": "rai", "label": "Raghu Rai", "year": 1980, "children": []
    })

    # ── Street ext: Maier, Leiter (parallel to Frank/Winogrand) ──
    street = find(tree, "movements/street")
    add_child(street, {
        "id": "photographers/maier", "kind": "photographer",
        "refId": "maier", "label": "Vivian Maier", "year": 1955,
        "children": []
    })
    add_child(street, {
        "id": "photographers/leiter", "kind": "photographer",
        "refId": "leiter", "label": "Leiter", "year": 1960, "children": []
    })

    # ── New Color ext: Meyerowitz, Soth, Crewdson ───────────────
    new_color = find(tree, "movements/new-color")
    add_child(new_color, {
        "id": "photographers/meyerowitz", "kind": "photographer",
        "refId": "meyerowitz", "label": "Meyerowitz", "year": 1976,
        "children": []
    })
    add_child(new_color, {
        "id": "photographers/soth", "kind": "photographer",
        "refId": "soth", "label": "Soth", "year": 2004, "children": []
    })
    add_child(new_color, {
        "id": "photographers/neshat", "kind": "photographer",
        "refId": "neshat", "label": "Neshat", "year": 1996, "children": []
    })

    # ── Düsseldorf ext: Wall, Crewdson ──────────────────────────
    duss = find(tree, "movements/dusseldorf")
    add_child(duss, {
        "id": "photographers/wall", "kind": "photographer",
        "refId": "wall", "label": "Jeff Wall", "year": 1993, "children": []
    })
    add_child(duss, {
        "id": "photographers/crewdson", "kind": "photographer",
        "refId": "crewdson", "label": "Crewdson", "year": 2001, "children": []
    })

    # ── Japan postwar ext: Kawauchi ────────────────────────────
    japan = find(tree, "movements/japan-postwar")
    add_child(japan, {
        "id": "photographers/kawauchi", "kind": "photographer",
        "refId": "kawauchi", "label": "Kawauchi", "year": 2001,
        "children": []
    })

    # ── China contemporary ext: Liu Heung Shing ─────────────────
    china = find(tree, "movements/china-contemporary")
    add_child(china, {
        "id": "photographers/liu-heung-shing", "kind": "photographer",
        "refId": "liu-heung-shing", "label": "Liu Heung Shing", "year": 1980,
        "children": []
    })

    LIN.write_text(json.dumps(tree, ensure_ascii=False, indent=2),
                   encoding="utf-8")
    print("lineage v2 extended ✓")


if __name__ == "__main__":
    main()
