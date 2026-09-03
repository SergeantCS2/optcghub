#!/usr/bin/env python3
"""Run the whole build. One command, no hand steps.

The sequence lives here rather than in the workflow so it can be run and tested
anywhere, and so CI and a PC cannot diverge (APEX landmine 40). PROTOCOL §6b:
any take that changes a step runs this from a clean directory before it ships,
because artifacts survive on disk and hide broken producers.
"""
import os, subprocess, sys, time
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

STEPS = [
    ("ingest",   ["tcgcsv.py"],       "TCGplayer catalogue + prices, via TCGCSV"),
    ("history",  ["history.py"],      "append today's prices to the committed sidecar"),
    ("catalog",  ["build_catalog.py"], "join, parse printings, precompute the confidence tables"),
    ("hashes",   ["hashes.py"],       "artwork fingerprints — images fetched, hashed, DISCARDED"),
    ("validate", ["validate.py", "--strict"], "refuse a catalogue that drifted"),
    ("app",      ["build_app.py"],    "assemble www/ and the bundle"),
    ("smoke",    ["smoke.mjs"],       "execute the SHIPPED app"),
    ("render",   ["render.mjs"],      "did it DRAW (APEX landmine 69)"),
    ("stamp",    ["stamp.py"],        "stamp the take into every ledger before the gate reads them"),
    ("gate",     ["gate.py"],         "the contract"),
]


def run(name, args, why):
    t0 = time.time()
    print(f"\n\u2500\u2500 {name}  ({why})")
    runner = ["node"] if args[0].endswith(".mjs") else [sys.executable]
    r = subprocess.run(runner + [os.path.join(HERE, args[0])] + args[1:], cwd=ROOT)
    if r.returncode:
        sys.exit(f"\n{name} failed ({r.returncode}) — pipeline stopped")
    print(f"   {time.time()-t0:.1f}s")


if __name__ == "__main__":
    only = [a for a in sys.argv[1:] if not a.startswith("--")] or None
    t0 = time.time()
    for name, args, why in STEPS:
        if only and name not in only:
            continue
        run(name, args, why)
    print(f"\npipeline complete in {time.time()-t0:.0f}s")
