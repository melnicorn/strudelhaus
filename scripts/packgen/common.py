"""Helpers for writing lesson packs as Python and emitting JSON (scripts/packgen/*.py).

Run a generator with `python3 scripts/packgen/<pack>.py`; it writes public/packs/<pack>.json.
Then `npm run lessons:validate -- public/packs/<pack>.json` until it reports no errors.
The check helpers below mirror the check language in lib/lessons/dsl.ts.
"""
import json
import os

BEATS = [0, 0.25, 0.5, 0.75]
OFFBEATS = [0.125, 0.375, 0.625, 0.875]
SIXTEENTHS = [i / 16 for i in range(16)]
EIGHTHS = [i / 8 for i in range(8)]
TR909 = 'RolandTR909'
TR808 = 'RolandTR808'
TR707 = 'RolandTR707'


# ---------- checks ----------
def all_(*x): return {"all": list(x)}
def any_(*x): return {"any": list(x)}
def not_(x): return {"not": x}
def playsAt(s, at, cycles=None, sel=None):
    d = {"at": at}
    if sel is not None: d["sel"] = sel
    else: d["s"] = s
    if cycles: d["cycles"] = cycles
    return {"playsAt": d}
def includesTimes(s, at): return {"includesTimes": {"s": s, "at": at}}
def every(sel, *where, allowEmpty=False):
    d = {"sel": sel, "where": list(where)}
    if allowEmpty: d["allowEmpty"] = True
    return {"every": d}
def some(sel, *where):
    d = {"sel": sel}
    if where: d["where"] = list(where)
    return {"some": d}
def w(key, **k):
    d = {"key": key}; d.update(k); return d
def uses(n): return {"uses": n}
def matches(r): return {"matches": r}
def defines(n): return {"defines": n}
def block(name, kind=None, members=None):
    d = {"name": name}
    if kind is not None: d["kind"] = kind
    if members is not None: d["members"] = members
    return {"block": d}
def final(k): return {"final": k}
def inKey(key=None, sel=None):
    d = {}
    if key: d["key"] = key
    if sel: d["sel"] = sel
    return {"inKey": d}
def eq(a, b): return {"eq": [a, b]}
def neq(a, b): return {"neq": [a, b]}
def gt(a, b): return {"gt": [a, b]}
def gte(a, b): return {"gte": [a, b]}
def lt(a, b): return {"lt": [a, b]}
def lte(a, b): return {"lte": [a, b]}
def defined(v): return {"defined": v}
def between(v, lo, hi): return all_(gte(v, lo), lte(v, hi))

# values
def count(**sel): return {"count": sel}
def countOf(sel): return {"count": sel}
def distinct(sel, key, **k):
    d = {"sel": sel, "key": key}; d.update(k); return {"distinct": d}
def values(sel, key, **k):
    d = {"sel": sel, "key": key}; d.update(k); return {"values": d}
def valueAt(sel, key, **k):
    d = {"sel": sel, "key": key}; d.update(k); return {"valueAt": d}
def mx(sel, key, default=None):
    d = {"sel": sel, "key": key}
    if default is not None: d["default"] = default
    return {"max": d}
def mn(sel, key, default=None):
    d = {"sel": sel, "key": key}
    if default is not None: d["default"] = default
    return {"min": d}
def timeAt(sel, index): return {"timeAt": {"sel": sel, "index": index}}
BPM = {"bpm": True}
KEY = {"key": True}
CHORD_SIZE = {"maxChordSize": True}
def lowestPc(bar): return {"lowestPitchClass": {"bar": bar}}
ROWS = {"rows": True}
def rowBars(i): return {"rowBars": i}
def rowStart(i): return {"rowStart": i}
def maxCount(sel, bars): return {"maxCount": {"sel": sel, "bars": bars}}
def plus(a, b): return {"plus": [a, b]}
def minus(a, b): return {"minus": [a, b]}
def mul(a, b): return {"mul": [a, b]}

def notes(**k):
    d = {"note": True}; d.update(k); return d
def snd(s, **k):
    d = {"s": s}; d.update(k); return d


# ---------- lessons ----------
def task(text, hint, check, replacedLater=False):
    d = {"text": text, "hint": hint, "check": check}
    if replacedLater: d["replacedLater"] = True
    return d


def lesson(id, title, goal, concept, starter, tasks, steps, solution, teaches, tags, *, shape='concept', challenge=None,
           challengeSolution=None, summary=(), introduces=(), concepts=(), requires=None, composition=False, library=None,
           preload=None, reference=None):
    d = {"id": id, "title": title, "goal": goal, "concept": concept, "shape": shape, "starter": starter, "tasks": tasks}
    if challenge: d["challenge"] = challenge
    d["steps"] = steps
    d["solution"] = solution
    if challengeSolution: d["challengeSolution"] = challengeSolution
    d["summary"] = list(summary)
    d["introduces"] = list(introduces)
    if concepts: d["concepts"] = list(concepts)
    d["teaches"] = list(teaches)
    if requires is not None: d["requires"] = list(requires)
    d["tags"] = list(tags)
    if composition: d["composition"] = True
    if library is not None: d["library"] = library
    if preload: d["preload"] = preload
    if reference: d["reference"] = reference
    return d


def kit(*names, bank=TR909):
    return [{"s": n, "bank": bank} for n in names]


def track(id, title, blurb, lessons, kind='skills', requires=None, tags=()):
    d = {"id": id, "title": title, "blurb": blurb, "kind": kind}
    if requires is not None: d["requires"] = list(requires)
    if tags: d["tags"] = list(tags)
    d["lessons"] = [l["id"] if isinstance(l, dict) else l for l in lessons]
    return d


def pack(id, title, description, tracks, lessons, *, author='Strudel Workshop', tags=(), skills=None, samples=None):
    d = {"format": "strudel-workshop-pack", "version": 1, "id": id, "title": title, "description": description, "author": author, "tags": list(tags)}
    if skills: d["skills"] = skills
    if samples: d["samples"] = samples
    d["tracks"] = tracks
    d["lessons"] = lessons
    return d


def write(p, out=None):
    out = out or os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'packs', f"{p['id']}.json")
    with open(out, 'w') as f:
        json.dump(p, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print(f"{out}: {len(p['lessons'])} lessons in {len(p['tracks'])} track(s)")
