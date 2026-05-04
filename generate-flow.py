#!/usr/bin/env python3
"""
GÉNÉRATION "FLOW" — style du clip supercomputer-wide validé par le user.
Caméra qui circule, traverse, glisse droit. Pas d'effets, juste flux constant.
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
STATE_FILE = ROOT / "runway-state-flow.json"
MAX_CONCURRENT = 3

# ──── PROMPTS V4 — FLOW PUR ─────────────────────────────────────────────────
# Pattern : "Camera moves [DIRECTION] [SPEED] through/across [SCENE]. Continuous motion."
# Pas d'effets dramatiques, pas de zoom. Juste circulation pure droite.
TIMELINE = [
    {"seq": 2, "name": "cover-facade", "file": "cover-facade.png", "dur": 10,
     "prompt": "Camera moves smoothly forward and slightly upward along the facade. Continuous straight motion alongside the building. Slight parallax. No zoom. No effects. Pure traveling shot."},

    # #3 hero-datacenter on garde — le robot tourne la tête, c'est OK
    {"seq": 3, "name": "hero-datacenter", "file": "hero-datacenter.png", "dur": 5,
     "prompt": "Camera moves forward straight through the corridor. The robot stays centered. Server lights pass on both sides. Continuous straight motion. No zoom."},

    # #4 supercomputer-wide REFERENCE — on duplique le style
    {"seq": 4, "name": "supercomputer-wide", "file": "supercomputer-wide.png", "dur": 10,
     "prompt": "Camera moves forward fast through the server corridor. Racks pass on both sides. Red LED strips streak past on the floor. Continuous straight motion, traveling shot. No zoom, no rotation."},

    {"seq": 5, "name": "supercomputer", "file": "supercomputer.png", "dur": 5,
     "prompt": "Camera moves laterally past the server rack. Side tracking shot. Continuous straight motion. Lights blink. No zoom."},

    {"seq": 6, "name": "aerial-campus-red", "file": "aerial-campus-red.png", "dur": 5,
     "prompt": "Drone moves forward fast over the campus. Buildings pass below. Continuous straight motion, traveling aerial. No zoom, no rotation."},

    {"seq": 7, "name": "water-compute", "file": "water-compute.png", "dur": 10,
     "prompt": "Camera moves forward smoothly toward the towers. Water flows down the sides. Continuous straight motion. No zoom, no rotation. Pure approach."},

    {"seq": 8, "name": "hub-interior", "file": "hub-interior.png", "dur": 5,
     "prompt": "Camera moves forward through the red atrium. Walls pass on both sides. Continuous straight motion. No zoom."},

    {"seq": 9, "name": "aerial-campus-2", "file": "aerial-campus-2.png", "dur": 5,
     "prompt": "Drone moves forward fast over the burgundy campus. Buildings pass below. Continuous straight motion, traveling aerial. No zoom, no rotation."},

    {"seq": 10, "name": "aerial-white", "file": "aerial-white.png", "dur": 10,
     "prompt": "Drone moves forward smoothly over the white city. Buildings and water pass below. Continuous straight motion. No zoom, no rotation. Pure traveling aerial."},

    {"seq": 11, "name": "vault", "file": "vault.png", "dur": 5,
     "prompt": "Camera moves forward through the white atrium. People pass on both sides. Continuous straight motion. No zoom."},

    {"seq": 12, "name": "amphitheater", "file": "amphitheater.png", "dur": 5,
     "prompt": "Camera moves forward through the amphitheater toward the stage. Audience visible on both sides. Continuous straight motion. No zoom."},

    {"seq": 13, "name": "p3-picture", "file": "p3-picture.png", "dur": 5,
     "prompt": "Drone moves forward fast over the curving campus. Buildings pass below. Continuous straight motion, traveling aerial. No zoom."},

    {"seq": 14, "name": "hub-masterplan", "file": "hub-masterplan.png", "dur": 10,
     "prompt": "Camera moves forward across the running track. Track and stadium pass below. Continuous straight motion, traveling shot. No zoom, no rotation."},

    {"seq": 15, "name": "hub-school", "file": "hub-school.png", "dur": 5,
     "prompt": "Camera moves forward through the school plaza. Buildings pass on both sides. Continuous straight motion. No zoom."},

    {"seq": 16, "name": "hub-life", "file": "hub-life.png", "dur": 5,
     "prompt": "Camera moves forward through the park. Trees and people pass on both sides. Continuous straight motion. No zoom."},

    {"seq": 17, "name": "hub-residential", "file": "hub-residential.png", "dur": 5,
     "prompt": "Camera moves forward through the residential plaza. Houses pass on both sides. Continuous straight motion. No zoom."},

    {"seq": 18, "name": "hub-residential-2", "file": "hub-residential-2.png", "dur": 5,
     "prompt": "Camera moves forward across the residential pond. Houses pass on both sides. Continuous straight motion. No zoom."},

    {"seq": 19, "name": "desalination", "file": "desalination.png", "dur": 5,
     "prompt": "Camera moves forward through the golden plaza. Buildings pass on both sides. Continuous straight motion. No zoom."},

    {"seq": 20, "name": "hub-restaurant", "file": "hub-restaurant.png", "dur": 10,
     "prompt": "Camera moves forward fast through the restaurant terrace. Tables and people pass on both sides. Continuous straight motion, traveling shot. No zoom, no rotation."},

    {"seq": 21, "name": "hub-bar", "file": "hub-bar.png", "dur": 5,
     "prompt": "Camera moves forward through the bar pavilion. People and pool pass on both sides. Continuous straight motion. No zoom."},

    {"seq": 22, "name": "hub-terrace", "file": "hub-terrace.png", "dur": 5,
     "prompt": "Camera moves forward across the rooftop terrace. People and pool pass on both sides. Continuous straight motion. No zoom."},

    {"seq": 23, "name": "p2-building", "file": "p2-building.png", "dur": 10,
     "prompt": "Camera moves forward fast through the neon tunnel. Light streaks pass on both sides. Continuous straight motion, traveling shot. No zoom, no rotation."},

    {"seq": 24, "name": "back-cover", "file": "back-cover.png", "dur": 10,
     "prompt": "Camera moves forward along the neon facade. Lights pass continuously. Continuous straight motion, traveling shot. No zoom."},
]

# Re-générer TOUT pour cohérence (même les 7 anciens)
state = {c['seq']: dict(c, status='pending', task_id=None, url=None, error=None) for c in TIMELINE}

def save_state():
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)

def encode_image(file_path: Path, out_jpg: Path):
    if out_jpg.exists() and out_jpg.stat().st_size < 5_000_000:
        return
    subprocess.run(["ffmpeg", "-y", "-i", str(file_path), "-vf", "scale=1920:-1",
                    "-q:v", "2", str(out_jpg), "-loglevel", "error"], check=True)

def to_data_uri(jpg_path: Path) -> str:
    with open(jpg_path, "rb") as f:
        return "data:image/jpeg;base64," + base64.b64encode(f.read()).decode()

def submit(clip):
    jpg = TMP / f"{clip['name']}.jpg"
    encode_image(PUBLIC / clip['file'], jpg)
    body = json.dumps({
        "model": "gen4_turbo",
        "promptImage": to_data_uri(jpg),
        "promptText": clip['prompt'],
        "duration": clip['dur'],
        "ratio": "1280:720",
    }).encode()
    req = urllib.request.Request(f"{PROXY}/runway/generate", data=body,
        headers={"Content-Type": "application/json", "X-API-Key": API_KEY}, method="POST")
    try:
        resp = urllib.request.urlopen(req, timeout=60)
        data = json.loads(resp.read())
        return data.get('id')
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
        data = json.loads(urllib.request.urlopen(req, timeout=15).read())
        return data.get('status'), data.get('output', [None])[0], data.get('failure')
    except Exception as e:
        return None, None, str(e)

def download(url, out_path):
    urllib.request.urlretrieve(url, out_path)

def status_line():
    counts = {}
    for s in state.values():
        counts[s['status']] = counts.get(s['status'], 0) + 1
    return f"📊 pending={counts.get('pending',0)} running={counts.get('running',0)} ✓ ok={counts.get('succeeded',0)} ✗ fail={counts.get('failed',0)}"

print("="*80)
print(f"  GÉNÉRATION FLOW — {len(TIMELINE)} clips · style supercomputer-wide validé")
print("="*80)

print("\n[1/3] Encodage...")
threads = []
for clip in TIMELINE:
    t = threading.Thread(target=encode_image,
                         args=(PUBLIC / clip['file'], TMP / f"{clip['name']}.jpg"))
    t.start(); threads.append(t)
for t in threads: t.join()
print(f"  ✓ {len(TIMELINE)} images encodées")

print(f"\n[2/3] Soumission progressive (max {MAX_CONCURRENT}) ...")
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
                clip['status'] = 'pending'
                break
            else:
                clip['status'] = 'failed'; clip['error'] = msg
                print(f"  ✗ #{clip['seq']:>2} {clip['name']:<22} → {msg[:60]}")
        elif result:
            clip['task_id'] = result
            clip['status'] = 'submitted'
            in_flight += 1
            print(f"  ➤ #{clip['seq']:>2} {clip['name']:<22} → {result[:8]}...")
            save_state()
        sys.stdout.flush()
        time.sleep(0.4)

    active = [s for s in state.values() if s['status'] in ('submitted', 'running')]
    threads = []
    for s in active:
        def poll_one(s=s):
            status, url, fail = poll(s['task_id'])
            if status == 'SUCCEEDED':
                s['status'] = 'succeeded'; s['url'] = url
                out = OUT_DIR / f"clip-{s['seq']:02d}-{s['name']}.mp4"
                try:
                    download(url, out)
                    print(f"  ✓ #{s['seq']:>2} {s['name']:<22} downloaded")
                except Exception as e:
                    print(f"  ⚠ download failed: {e}")
            elif status == 'FAILED':
                s['status'] = 'failed'; s['error'] = str(fail)
                print(f"  ✗ #{s['seq']:>2} {s['name']:<22} FAILED")
            elif status == 'RUNNING':
                s['status'] = 'running'
            sys.stdout.flush()
        t = threading.Thread(target=poll_one)
        t.start(); threads.append(t)
    for t in threads: t.join()
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
