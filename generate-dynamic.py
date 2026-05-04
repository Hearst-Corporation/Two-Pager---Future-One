#!/usr/bin/env python3
"""
Génération avec prompts ULTRA-DYNAMIQUES.
- Verbes d'action explicites
- Vitesse chiffrée (fast, rapid)
- Sujets qui bougent visiblement (gens, eau, lumières)
- Phrases courtes que Runway interprète mieux
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
STATE_FILE = ROOT / "runway-state-dynamic.json"
MAX_CONCURRENT = 3

# ──── PROMPTS V3 — DYNAMIQUE FORCÉ ──────────────────────────────────────────
TIMELINE = [
    {"seq": 2, "name": "cover-facade", "file": "cover-facade.png", "dur": 10,
     "prompt": "Camera flies upward fast along the red and gold faceted tower. Sand storms swirl rapidly across the building. Bright sunset rays sweep diagonally. Glass panels flash with reflections. Distant city lights flicker. Strong upward motion, high-speed crane shot, kinetic, alive."},

    {"seq": 3, "name": "hero-datacenter", "file": "hero-datacenter.png", "dur": 5,
     "prompt": "White humanoid robot walks confidently toward camera. Eyes flash blue. Server lights flicker rapidly behind. Mist drifts. Camera tracks back as robot advances. Fast forward motion, dramatic action."},

    {"seq": 4, "name": "supercomputer-wide", "file": "supercomputer-wide.png", "dur": 10,
     "prompt": "Camera dollies fast through the red server corridor. Red LED strips flash in waves on the floor. Server lights pulse rapidly. Bright reflections streak past. Fog flows past camera. High-speed forward motion, kinetic, motion blur."},

    {"seq": 5, "name": "supercomputer", "file": "supercomputer.png", "dur": 5,
     "prompt": "Camera orbits quickly around the red supercomputer rack. Red LEDs blink fast. Light reflections sweep across the polished floor. Mist swirls. Fast circular motion, kinetic energy."},

    {"seq": 6, "name": "aerial-campus-red", "file": "aerial-campus-red.png", "dur": 5,
     "prompt": "Drone flies fast forward over the red campus. Trees sway. Cars drive on roads. Water flows in canals. Birds fly across. Strong forward motion, high-speed aerial."},

    {"seq": 7, "name": "water-compute", "file": "water-compute.png", "dur": 10,
     "prompt": "Camera rises rapidly along the white tower. Massive waterfalls gush down powerfully. Sea waves crash and ripple. Foam splashes. Sunlight glints across metal. Fast vertical motion, strong action, dynamic water spray."},

    {"seq": 8, "name": "hub-interior", "file": "hub-interior.png", "dur": 5,
     "prompt": "Camera quickly tilts up inside the red gold atrium. Amber lights pulse fast. Reflections multiply across faceted walls. Light beams sweep. Fast vertigo motion, kinetic dynamic upward shot."},

    {"seq": 9, "name": "aerial-campus-2", "file": "aerial-campus-2.png", "dur": 5,
     "prompt": "Drone flies fast over the burgundy industrial campus. Smoke plumes rise from chimneys. Cars drive on roads. Solar panels flash in the sun. Fast forward motion, kinetic flyover."},

    {"seq": 10, "name": "aerial-white", "file": "aerial-white.png", "dur": 10,
     "prompt": "Drone glides smoothly forward over the curving white city. Water flows in canals. Trees sway gently. People walking on bridges. Slow majestic camera reveal, peaceful but flowing motion."},

    {"seq": 11, "name": "vault", "file": "vault.png", "dur": 5,
     "prompt": "People walk briskly across the white atrium. Sunlight beams stream down. Camera tracks forward through the space. Palm trees sway. Active people movement, walking pace, alive scene."},

    {"seq": 12, "name": "amphitheater", "file": "amphitheater.png", "dur": 5,
     "prompt": "Audience claps and reacts in the amphitheater. Speaker gestures animatedly on stage. Big screen face moves and talks. Palm trees sway. Camera pushes in slowly. Lively action, real human movement."},

    {"seq": 13, "name": "p3-picture", "file": "p3-picture.png", "dur": 5,
     "prompt": "Drone flies fast over the curving S-shape campus. Football players run on the field. Long shadows shift. Birds fly past. Fast forward aerial, golden hour, action visible on the field."},

    {"seq": 14, "name": "hub-masterplan", "file": "hub-masterplan.png", "dur": 10,
     "prompt": "Cyclists ride past camera on the path. Runners sprint on the red track. People walk and chat. Trees sway. Camera glides forward smoothly. Active sporty motion, multiple humans visible moving, alive park scene."},

    {"seq": 15, "name": "hub-school", "file": "hub-school.png", "dur": 5,
     "prompt": "Students walk fast across the school plaza, talking with tablets. Sunlight flickers through trees. Camera tracks alongside them. Active human movement, joyful walking pace, real social motion."},

    {"seq": 16, "name": "hub-life", "file": "hub-life.png", "dur": 5,
     "prompt": "Kids ride bikes laughing past camera. Parents walk and watch. Joggers run by. Trees sway in golden light. Camera glides smoothly. Lively park scene with multiple humans in motion, happy energy."},

    {"seq": 17, "name": "hub-residential", "file": "hub-residential.png", "dur": 5,
     "prompt": "Children play and run in the foreground. Parents walk slowly together. Water reflections shimmer. Palm trees sway. Camera moves smoothly across. Real family movement, alive happy suburban scene."},

    {"seq": 18, "name": "hub-residential-2", "file": "hub-residential-2.png", "dur": 5,
     "prompt": "Children play near the pond. Mother stands watching. Palm trees sway in breeze. Lights turn on in houses one by one. Camera arcs slowly. Peaceful magic hour, real life motion."},

    {"seq": 19, "name": "desalination", "file": "desalination.png", "dur": 5,
     "prompt": "Camera glides forward across the golden plaza at dusk. Water ripples on reflective floor. Lights glow stronger inside facades. Distant figures walk. Dust particles drift. Smooth flowing forward motion."},

    {"seq": 20, "name": "hub-restaurant", "file": "hub-restaurant.png", "dur": 10,
     "prompt": "Crowd of diners laughs and toasts glasses. Steam rises from plates. Waiters move between tables. Palm fronds sway strongly. String lights flicker. Camera glides fast through the terrace. Vibrant alive party scene, happy people in motion."},

    {"seq": 21, "name": "hub-bar", "file": "hub-bar.png", "dur": 5,
     "prompt": "People around the pool laugh and drink. Glasses clink. Fairy lights flicker rapidly. Palm trees sway. Reflections ripple on water. Camera glides past. Festive party energy, happy crowd in motion."},

    {"seq": 22, "name": "hub-terrace", "file": "hub-terrace.png", "dur": 5,
     "prompt": "Couples chat at sunset terrace, drinks in hand. Lights twinkle along edges. Pool ripples below. Camera pans smoothly. Warm conversation movement, alive sunset scene."},

    {"seq": 23, "name": "p2-building", "file": "p2-building.png", "dur": 10,
     "prompt": "Camera flies extremely fast through the fuchsia neon tunnel. Light streaks blur into hyper motion lines. Speed lines whip past. Floor reflections multiply. Hyperspeed forward motion, intense kinetic blur, transcendent flight."},

    {"seq": 24, "name": "back-cover", "file": "back-cover.png", "dur": 10,
     "prompt": "Camera pulls back smoothly from the glowing copper neon facade. Orange lights pulse and ripple across the surface in waves. Heat haze rises strongly. Sunset sky glows brighter. Birds fly past. Smooth retreating motion, dramatic emotional close."},
]

# Skip ceux déjà téléchargés (succès du run précédent)
already_done = {f.stem.replace('clip-', '').split('-', 1)[1] for f in OUT_DIR.glob('clip-*.mp4')}
print(f"Déjà OK : {sorted(already_done)}")
TODO = [c for c in TIMELINE if c['name'] not in already_done]
print(f"À regénérer (avec prompts dynamiques v3) : {len(TODO)} clips\n")

state = {c['seq']: dict(c, status='pending', task_id=None, url=None, error=None) for c in TODO}

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
    return out_path.stat().st_size

def status_line():
    counts = {}
    for s in state.values():
        counts[s['status']] = counts.get(s['status'], 0) + 1
    return f"📊 pending={counts.get('pending',0)} running={counts.get('running',0)} ✓ ok={counts.get('succeeded',0)} ✗ fail={counts.get('failed',0)}"

print("="*80)
print(f"  GÉNÉRATION DYNAMIQUE V3 — {len(TODO)} clips · prompts ultra-actifs")
print("="*80)

print("\n[1/3] Encodage...")
threads = []
for clip in TODO:
    t = threading.Thread(target=encode_image,
                         args=(PUBLIC / clip['file'], TMP / f"{clip['name']}.jpg"))
    t.start(); threads.append(t)
for t in threads: t.join()
print(f"  ✓ {len(TODO)} images encodées")

print(f"\n[2/3] Soumission progressive (max {MAX_CONCURRENT} parallèles)...")
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
                clip['status'] = 'failed'
                clip['error'] = msg
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
                s['status'] = 'succeeded'
                s['url'] = url
                out = OUT_DIR / f"clip-{s['seq']:02d}-{s['name']}.mp4"
                try:
                    download(url, out)
                    print(f"  ✓ #{s['seq']:>2} {s['name']:<22} downloaded")
                except Exception as e:
                    print(f"  ⚠ download failed: {e}")
            elif status == 'FAILED':
                s['status'] = 'failed'
                s['error'] = str(fail)
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
