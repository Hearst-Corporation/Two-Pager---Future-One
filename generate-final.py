#!/usr/bin/env python3
"""
GÉNÉRATION FINALE — pattern STATIC validé.
Image stable, seule la caméra se déplace selon la composition de chaque photo.
"""
import json, urllib.request, base64, time, threading, subprocess, sys
from pathlib import Path

API_KEY = "key_2b9ad50bf50d357c1d5dc73640824c742ad584427fd6a867f22f70dfd88c09e1ce71de6989f0c406e7230fe6722a8369d9ab941a7038800a424a83f68497a979"
PROXY = "http://localhost:3099"
ROOT = Path("/Users/adrienbeyondcrypto/Desktop/Prese Hub")
PUBLIC = ROOT / "public"
OUT_DIR = PUBLIC / "clips"
OUT_DIR.mkdir(exist_ok=True)
TMP = Path("/tmp/runway-jpg")
TMP.mkdir(exist_ok=True)
STATE_FILE = ROOT / "runway-state-final.json"
MAX_CONCURRENT = 3

# Base prompt qui force le STATIC + camera move uniquement
BASE = "Static image, only the camera moves. No deformation, no morphing, no animation of subjects. "

# Mouvement caméra adapté à la composition de chaque photo
TIMELINE = [
    {"seq": 2, "name": "cover-facade", "file": "cover-facade.png", "dur": 10,
     "prompt": BASE + "Slow forward dolly in toward the faceted red and gold facade. Pure camera move only."},

    {"seq": 3, "name": "hero-datacenter", "file": "hero-datacenter.png", "dur": 5,
     "prompt": BASE + "Slow forward dolly through the corridor toward the robot. Pure camera move only."},

    {"seq": 4, "name": "supercomputer-wide", "file": "supercomputer-wide.png", "dur": 10,
     "prompt": BASE + "Smooth forward dolly through the server corridor. Server racks pass on both sides. Pure camera move only."},

    {"seq": 5, "name": "supercomputer", "file": "supercomputer.png", "dur": 5,
     "prompt": BASE + "Slow lateral truck right past the server rack. Pure camera move only."},

    {"seq": 6, "name": "aerial-campus-red", "file": "aerial-campus-red.png", "dur": 5,
     "prompt": BASE + "Aerial drone moves smoothly forward over the campus. Pure camera move only."},

    {"seq": 7, "name": "water-compute", "file": "water-compute.png", "dur": 10,
     "prompt": BASE + "Slow vertical crane up along the water-compute towers. Pure camera move only."},

    {"seq": 8, "name": "hub-interior", "file": "hub-interior.png", "dur": 5,
     "prompt": BASE + "Slow forward dolly into the red and gold atrium. Pure camera move only."},

    {"seq": 9, "name": "aerial-campus-2", "file": "aerial-campus-2.png", "dur": 5,
     "prompt": BASE + "Aerial drone moves smoothly forward over the burgundy campus. Pure camera move only."},

    {"seq": 10, "name": "aerial-white", "file": "aerial-white.png", "dur": 10,
     "prompt": BASE + "Slow aerial pull-back from the white organic campus, revealing the full layout. Pure camera move only."},

    {"seq": 11, "name": "vault", "file": "vault.png", "dur": 5,
     "prompt": BASE + "Slow forward dolly through the white atrium hall. Pure camera move only."},

    {"seq": 12, "name": "amphitheater", "file": "amphitheater.png", "dur": 5,
     "prompt": BASE + "Slow forward dolly toward the amphitheater stage. Pure camera move only."},

    {"seq": 13, "name": "p3-picture", "file": "p3-picture.png", "dur": 5,
     "prompt": BASE + "Aerial drone glides smoothly forward over the curving S-shape campus. Pure camera move only."},

    {"seq": 14, "name": "hub-masterplan", "file": "hub-masterplan.png", "dur": 10,
     "prompt": BASE + "Smooth aerial truck right across the running track and stadium. Pure camera move only."},

    {"seq": 15, "name": "hub-school", "file": "hub-school.png", "dur": 5,
     "prompt": BASE + "Slow forward dolly into the school plaza. Pure camera move only."},

    {"seq": 16, "name": "hub-life", "file": "hub-life.png", "dur": 5,
     "prompt": BASE + "Smooth lateral truck right across the park scene. Pure camera move only."},

    {"seq": 17, "name": "hub-residential", "file": "hub-residential.png", "dur": 5,
     "prompt": BASE + "Smooth lateral truck right across the residential plaza. Pure camera move only."},

    {"seq": 18, "name": "hub-residential-2", "file": "hub-residential-2.png", "dur": 5,
     "prompt": BASE + "Slow aerial pull-back from the residential pond. Pure camera move only."},

    {"seq": 19, "name": "desalination", "file": "desalination.png", "dur": 5,
     "prompt": BASE + "Slow forward dolly into the golden plaza. Pure camera move only."},

    {"seq": 20, "name": "hub-restaurant", "file": "hub-restaurant.png", "dur": 10,
     "prompt": BASE + "Smooth forward dolly through the restaurant terrace, between tables. Pure camera move only."},

    {"seq": 21, "name": "hub-bar", "file": "hub-bar.png", "dur": 5,
     "prompt": BASE + "Smooth lateral truck right across the bar pavilion and pool. Pure camera move only."},

    {"seq": 22, "name": "hub-terrace", "file": "hub-terrace.png", "dur": 5,
     "prompt": BASE + "Smooth lateral truck right across the rooftop terrace. Pure camera move only."},

    {"seq": 23, "name": "p2-building", "file": "p2-building.png", "dur": 10,
     "prompt": BASE + "Fast forward dolly through the neon tunnel. Pure camera move only."},

    {"seq": 24, "name": "back-cover", "file": "back-cover.png", "dur": 10,
     "prompt": BASE + "Slow lateral truck right along the neon facade. Pure camera move only."},
]

# Skip ceux déjà téléchargés (cover-facade, hero-datacenter, supercomputer-wide)
SKIP = {2, 3, 4}
state = {c['seq']: dict(c, status='succeeded' if c['seq'] in SKIP else 'pending', task_id=None, url=None, error=None) for c in TIMELINE}
print(f"Skip déjà OK : {sorted(SKIP)} → {len([c for c in TIMELINE if c['seq'] not in SKIP])} clips à générer")

def save_state():
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)

def encode(file_path: Path, out_jpg: Path):
    if out_jpg.exists() and out_jpg.stat().st_size < 5_000_000:
        return
    subprocess.run(["ffmpeg", "-y", "-i", str(file_path), "-vf", "scale=1920:-1",
                    "-q:v", "2", str(out_jpg), "-loglevel", "error"], check=True)

def submit(clip):
    jpg = TMP / f"{clip['name']}.jpg"
    encode(PUBLIC / clip['file'], jpg)
    with open(jpg, "rb") as f:
        img_uri = "data:image/jpeg;base64," + base64.b64encode(f.read()).decode()
    body = json.dumps({"model": "gen4_turbo", "promptImage": img_uri,
        "promptText": clip['prompt'], "duration": clip['dur'], "ratio": "1280:720"}).encode()
    req = urllib.request.Request(f"{PROXY}/runway/generate", data=body,
        headers={"Content-Type":"application/json","X-API-Key":API_KEY}, method="POST")
    try:
        resp = urllib.request.urlopen(req, timeout=60)
        return json.loads(resp.read()).get('id')
    except urllib.error.HTTPError as e:
        err = e.read().decode()[:200]
        if e.code == 429:
            return ('RETRY', err)
        return ('ERROR', f"{e.code}: {err}")
    except Exception as e:
        return ('ERROR', str(e))

def poll(task_id):
    try:
        req = urllib.request.Request(f"{PROXY}/runway/status/{task_id}",
            headers={"X-API-Key": API_KEY})
        d = json.loads(urllib.request.urlopen(req, timeout=15).read())
        return d.get('status'), (d.get('output') or [None])[0], d.get('failure')
    except Exception as e:
        return None, None, str(e)

def status_line():
    c = {}
    for s in state.values():
        c[s['status']] = c.get(s['status'], 0) + 1
    return f"📊 pending={c.get('pending',0)} running={c.get('running',0)} ✓ ok={c.get('succeeded',0)} ✗ fail={c.get('failed',0)}"

print("="*80)
print(f"  GÉNÉRATION FINALE — {len(TIMELINE)} clips · pattern STATIC validé")
print("="*80)

print("\n[1/3] Encodage des images...")
ths = []
for c in TIMELINE:
    t = threading.Thread(target=encode, args=(PUBLIC / c['file'], TMP / f"{c['name']}.jpg"))
    t.start(); ths.append(t)
for t in ths: t.join()
print(f"  ✓ {len(TIMELINE)} prêtes\n")

print(f"[2/3] Soumission progressive (max {MAX_CONCURRENT} en parallèle, ~25s/clip)...\n")
sys.stdout.flush()

start = time.time()
last_print = 0

while True:
    elapsed = int(time.time() - start)
    in_flight = sum(1 for s in state.values() if s['status'] in ('submitted', 'running'))
    pending = [s for s in state.values() if s['status'] == 'pending']

    while in_flight < MAX_CONCURRENT and pending:
        clip = pending.pop(0)
        result = submit(clip)
        if isinstance(result, tuple):
            kind, msg = result
            if kind == 'RETRY':
                clip['status'] = 'pending'; break
            else:
                clip['status'] = 'failed'; clip['error'] = msg
                print(f"  ✗ #{clip['seq']:>2} {clip['name']:<22} → {msg[:60]}")
        elif result:
            clip['task_id'] = result; clip['status'] = 'submitted'
            in_flight += 1
            print(f"  ➤ #{clip['seq']:>2} {clip['name']:<22} → {result[:8]}...")
            save_state()
        sys.stdout.flush()
        time.sleep(0.4)

    active = [s for s in state.values() if s['status'] in ('submitted', 'running')]
    ths = []
    for s in active:
        def poll_one(s=s):
            status, url, fail = poll(s['task_id'])
            if status == 'SUCCEEDED':
                s['status'] = 'succeeded'; s['url'] = url
                out = OUT_DIR / f"clip-{s['seq']:02d}-{s['name']}.mp4"
                # Download avec timeout explicite
                try:
                    import socket
                    socket.setdefaulttimeout(60)
                    urllib.request.urlretrieve(url, out)
                    print(f"  ✓ #{s['seq']:>2} {s['name']:<22} downloaded ({out.stat().st_size//1024}KB)")
                except Exception as e:
                    print(f"  ⚠ #{s['seq']:>2} download fail: {e}")
                    s['status'] = 'download_pending'  # on retentera
            elif status == 'FAILED':
                s['status'] = 'failed'; s['error'] = str(fail)
                print(f"  ✗ #{s['seq']:>2} {s['name']:<22} FAILED: {fail}")
            elif status == 'RUNNING':
                s['status'] = 'running'
            sys.stdout.flush()
        t = threading.Thread(target=poll_one, daemon=True)
        t.start(); ths.append(t)
    # Timeout 30s par batch poll pour ne pas bloquer
    for t in ths:
        t.join(timeout=30)
    save_state()

    if elapsed - last_print >= 10:
        last_print = elapsed
        print(f"  [{elapsed:>3}s] {status_line()}")
        sys.stdout.flush()

    remaining = [s for s in state.values() if s['status'] in ('pending', 'submitted', 'running')]
    if not remaining: break
    if elapsed > 1800: break
    time.sleep(6)

print("\n" + "="*80)
print(f"  TERMINÉ — {status_line()}")
print("="*80)

ok = [s for s in state.values() if s['status'] == 'succeeded']
print(f"\n✓ {len(ok)} clips dans {OUT_DIR}/")
fail = [s for s in state.values() if s['status'] == 'failed']
for s in fail:
    print(f"✗ #{s['seq']:>2} {s['name']:<22} {(s.get('error') or '')[:80]}")
