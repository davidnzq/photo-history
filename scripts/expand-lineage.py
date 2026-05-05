#!/usr/bin/env python3
"""
Splice the newly added movements/photographers into the curated lineage tree.

Branches added:
  - pictorialism → cameron
  - evt-collodion → muybridge (parallel pre-cinema)
  - evt-collodion → brady → war-photography → lee-miller, bourke-white
  - steichen → fashion → penn → avedon → newton
  - evt-leica → latin-american-modernism → modotti → alvarez-bravo → iturbide
  - evt-kodak → black-american-photo → van-der-zee → parks → weems
  - evt-kodak → west-african-studio → keita → sidibe
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIN = ROOT / "src" / "data" / "lineage.json"


def find(node, target_id):
    """DFS for a node whose id == target_id; returns the node (mutable ref)."""
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

    # ── Cameron under pictorialism ─────────────────────────────────
    pict = find(tree, "movements/pictorialism")
    assert pict is not None, "pictorialism not found"
    add_child(pict, {
        "id": "photographers/cameron", "kind": "photographer",
        "refId": "cameron", "label": "Cameron", "year": 1864, "children": []
    })

    # ── Muybridge & Brady under collodion ──────────────────────────
    collodion = find(tree, "evt-collodion")
    assert collodion is not None
    add_child(collodion, {
        "id": "photographers/muybridge", "kind": "photographer",
        "refId": "muybridge", "label": "Muybridge", "year": 1878, "children": []
    })

    brady_branch = {
        "id": "photographers/brady", "kind": "photographer",
        "refId": "brady", "label": "Brady", "year": 1862,
        "children": [
            {
                "id": "movements/war-photography", "kind": "movement",
                "refId": "war-photography", "label": "战地摄影", "year": 1944,
                "children": [
                    {"id": "photographers/lee-miller", "kind": "photographer",
                     "refId": "lee-miller", "label": "Lee Miller", "year": 1945,
                     "children": []},
                    {"id": "photographers/bourke-white", "kind": "photographer",
                     "refId": "bourke-white", "label": "Bourke-White", "year": 1936,
                     "children": []},
                ],
            }
        ],
    }
    add_child(collodion, brady_branch)

    # ── Fashion movement under Steichen ────────────────────────────
    steichen = find(tree, "photographers/steichen")
    assert steichen is not None
    add_child(steichen, {
        "id": "movements/fashion", "kind": "movement",
        "refId": "fashion", "label": "时尚摄影", "year": 1965,
        "children": [
            {"id": "photographers/penn", "kind": "photographer",
             "refId": "penn", "label": "Penn", "year": 1948, "children": []},
            {"id": "photographers/avedon", "kind": "photographer",
             "refId": "avedon", "label": "Avedon", "year": 1955, "children": []},
            {"id": "photographers/newton", "kind": "photographer",
             "refId": "newton", "label": "Newton", "year": 1976, "children": []},
        ],
    })

    # ── Latin American Modernism: under E.Weston (its progenitor) ──
    e_weston = find(tree, "photographers/e-weston")
    assert e_weston is not None
    add_child(e_weston, {
        "id": "movements/latin-american-modernism", "kind": "movement",
        "refId": "latin-american-modernism", "label": "拉美现代主义", "year": 1939,
        "children": [
            {"id": "photographers/modotti", "kind": "photographer",
             "refId": "modotti", "label": "Modotti", "year": 1927, "children": []},
            {"id": "photographers/alvarez-bravo", "kind": "photographer",
             "refId": "alvarez-bravo", "label": "Bravo", "year": 1939, "children": [
                {"id": "photographers/iturbide", "kind": "photographer",
                 "refId": "iturbide", "label": "Iturbide", "year": 1979, "children": []},
            ]},
        ],
    })

    # ── Black American Photography under evt-kodak ─────────────────
    kodak = find(tree, "evt-kodak")
    assert kodak is not None
    add_child(kodak, {
        "id": "movements/black-american-photo", "kind": "movement",
        "refId": "black-american-photo", "label": "美国黑人摄影", "year": 1968,
        "children": [
            {"id": "photographers/van-der-zee", "kind": "photographer",
             "refId": "van-der-zee", "label": "Van Der Zee", "year": 1924, "children": [
                {"id": "photographers/parks", "kind": "photographer",
                 "refId": "parks", "label": "Parks", "year": 1942, "children": [
                    {"id": "photographers/weems", "kind": "photographer",
                     "refId": "weems", "label": "Weems", "year": 1990, "children": []},
                ]},
            ]},
        ],
    })

    # ── West African Studio Portraiture under evt-kodak ───────────
    add_child(kodak, {
        "id": "movements/west-african-studio", "kind": "movement",
        "refId": "west-african-studio", "label": "西非棚拍肖像", "year": 1965,
        "children": [
            {"id": "photographers/keita", "kind": "photographer",
             "refId": "keita", "label": "Keïta", "year": 1956, "children": [
                {"id": "photographers/sidibe", "kind": "photographer",
                 "refId": "sidibe", "label": "Sidibé", "year": 1963, "children": []},
            ]},
        ],
    })

    LIN.write_text(json.dumps(tree, ensure_ascii=False, indent=2), encoding="utf-8")
    print("lineage tree extended ✓")


if __name__ == "__main__":
    main()
