#!/usr/bin/env python3
"""
Génération Kling 2.1 Standard via fal.ai.
Pattern : MOUVEMENT CLAIR + ZERO FUMÉE + ZERO effets bizarres.
"""
import urllib.request, json, base64, time, threading, subprocess, os, sys
from pathlib import Path

KEY = "2e8d79ea-fc03-4e92-9f2a-dca297ed7e0a:ce50dbb3e16582181144b6fac626a4e4"
ROOT = Path("/Users/adrienbeyondcrypto/Desktop/Prese Hub")
PUBLIC = ROOT / "public"
OUT = PUBLIC / "clips"
OUT.mkdir(exist_ok=True)
TMP = Path("/tmp/runway-jpg")
TMP.mkdir(exist_ok=True)
STATE_FILE = ROOT / "kling-state.json"
ENDPOINT = "https://queue.fal.run/fal-ai/kling-video/v2.1/standard/image-to-video"
MAX_CONCURRENT = 4  # fal.ai standard

# Mouvements adaptés à chaque image, sans fumée, sans effets
TIMELINE = [
    {"seq": 2, "name": "cover-facade", "file": "cover-facade.png", "dur": "5",
     "prompt": "Camera tilts up smoothly along the faceted red and gold facade tower. The building stays stable. Sunset sky glows softly behind. Cinematic crane shot."},

    {"seq": 3, "name": "hero-datacenter", "file": "hero-datacenter.png", "dur": "5",
     "prompt": "Camera moves forward slowly through the corridor toward the white humanoid robot. The robot stands still. Server lights pulse gently on both sides. Cinematic dolly in."},

    {"seq": 4, "name": "supercomputer-wide", "file": "supercomputer-wide.png", "dur": "5",
     "prompt": "Camera glides forward through the corridor of red and white server racks. Lights pulse on both sides. Smooth continuous forward motion. Cinematic dolly shot."},

    {"seq": 5, "name": "supercomputer", "file": "supercomputer.png", "dur": "5",
     "prompt": "Camera moves laterally to the right past the server rack. Indicator LEDs blink gently. Smooth tracking shot."},

    {"seq": 6, "name": "aerial-campus-red", "file": "aerial-campus-red.png", "dur": "5",
     "prompt": "Drone moves smoothly forward over the red campus and palm trees. Buildings pass below. Smooth aerial tracking shot."},

    {"seq": 7, "name": "water-compute", "file": "water-compute.png", "dur": "5",
     "prompt": "Camera slowly tilts up along the white tower emerging from the water. Water flows steadily down the sides. Reflections ripple on the sea. Cinematic crane shot."},

    {"seq": 8, "name": "hub-interior", "file": "hub-interior.png", "dur": "5",
     "prompt": "Camera moves forward into the red and gold geometric atrium. Light reflections gently shift on the walls. Cinematic dolly in."},

    {"seq": 9, "name": "aerial-campus-2", "file": "aerial-campus-2.png", "dur": "5",
     "prompt": "Drone glides smoothly forward over the burgundy campus. Buildings pass below. Sun shadows shift gently. Smooth aerial tracking."},

    {"seq": 10, "name": "aerial-white", "file": "aerial-white.png", "dur": "5",
     "prompt": "Drone slowly pulls back revealing the white organic city with curving buildings and water channels. Smooth aerial reveal. Cinematic and peaceful."},

    {"seq": 11, "name": "vault", "file": "vault.png", "dur": "5",
     "prompt": "Camera moves forward through the white atrium hall. People walk calmly through the space. Sunlight streams down. Smooth dolly shot."},

    {"seq": 12, "name": "amphitheater", "file": "amphitheater.png", "dur": "5",
     "prompt": "Camera moves forward through the amphitheater toward the stage. Audience listens attentively. Speaker stands on stage. Smooth dolly shot."},

    {"seq": 13, "name": "p3-picture", "file": "p3-picture.png", "dur": "5",
     "prompt": "Drone moves smoothly forward over the curving S-shape campus and football field. Long shadows stretch in golden hour light. Smooth aerial tracking."},

    {"seq": 14, "name": "hub-masterplan", "file": "hub-masterplan.png", "dur": "5",
     "prompt": "Camera glides smoothly across the running track. Cyclists ride past in the foreground. Runners move on the track. Pedestrians walk. Cinematic tracking shot."},

    {"seq": 15, "name": "hub-school", "file": "hub-school.png", "dur": "5",
     "prompt": "Camera moves forward through the school plaza. Students walk and chat. Sunlight bright. Smooth dolly shot."},

    {"seq": 16, "name": "hub-life", "file": "hub-life.png", "dur": "5",
     "prompt": "Camera glides smoothly across the park. Kids ride bicycles. Parents walk. Trees gently sway. Cinematic tracking shot in golden hour."},

    {"seq": 17, "name": "hub-residential", "file": "hub-residential.png", "dur": "5",
     "prompt": "Camera moves smoothly across the residential plaza. Children play in the foreground. Parents walk. Palm trees gently sway. Smooth tracking shot."},

    {"seq": 18, "name": "hub-residential-2", "file": "hub-residential-2.png", "dur": "5",
     "prompt": "Camera slowly pulls back revealing the residential pond with houses around it. Children play near the water. Sunset light. Smooth aerial reveal."},

    {"seq": 19, "name": "desalination", "file": "desalination.png", "dur": "5",
     "prompt": "Camera moves forward through the golden architectural plaza at sunset. Reflective floor. Soft lights glow inside the buildings. Smooth dolly shot."},

    {"seq": 20, "name": "hub-restaurant", "file": "hub-restaurant.png", "dur": "5",
     "prompt": "Camera glides smoothly through the restaurant terrace between the tables. Diners chat and eat. Palm trees sway. Sunset light. Cinematic tracking shot."},

    {"seq": 21, "name": "hub-bar", "file": "hub-bar.png", "dur": "5",
     "prompt": "Camera moves smoothly across the bar pavilion with the pool. People in conversation around the water. String lights twinkle gently. Smooth tracking shot."},

    {"seq": 22, "name": "hub-terrace", "file": "hub-terrace.png", "dur": "5",
     "prompt": "Camera glides smoothly across the rooftop terrace at sunset. Couples chat, drinks in hand. Smooth tracking shot."},

    {"seq": 23, "name": "p2-building", "file": "p2-building.png", "dur": "5",
     "prompt": "Camera moves quickly forward through the fuchsia neon tunnel. Light streaks pass on both sides. Fast continuous forward motion."},

    {"seq": 24, "name": "back-cover", "file": "back-cover.png", "dur": "5",
     "prompt": "Camera slowly moves laterally to the right along the glowing copper neon facade. Lights reflect on the floor. Smooth tracking shot."},
]

state = {c['seq']: dict(c, status='pending', request_id=None, url=None, error=None) for c in TIMELINE}

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
    body = json.dumps({
        "prompt": clip['prompt'],
        "image_url": img_uri,
        "duration": clip['dur'],
        "aspect_ratio": "16:9",
    }).encode()
    req = urllib.request.Request(ENDPOINT, data=body,
        headers={"Authorization": f"Key {KEY}", "Content-Type": "application/json"},
        method="POST")
    try:
        resp = urllib.request.urlopen(req, timeout=60)
        return json.loads(resp.read())['request_id']
    except urllib.error.HTTPError as e:
        return ('ERROR', f"{e.code}: {e.read().decode()[:200]}")
    except Exception as e:
        return ('ERROR', str(e))

def poll(rid):
    try:
        status_url = f"https://queue.fal.run/fal-ai/kling-video/requests/{rid}/status"
        req = urllib.request.Request(status_url, headers={"Authorization": f"Key {KEY}"})
        d = json.loads(urllib.request.urlopen(req, timeout=15).read())
        return d.get('status')
    except Exception as e:
        return None

def fetch_result(rid):
    resp_url = f"https://queue.fal.run/fal-ai/kling-video/requests/{rid}"
    req = urllib.request.Request(resp_url, headers={"Authorization": f"Key {KEY}"})
    return json.loads(urllib.request.urlopen(req, timeout=15).read())

def status_line():
    c = {}
    for s in state.values():
        c[s['status']] = c.get(s['status'], 0) + 1
    return f"📊 pending={c.get('pending',0)} running={c.get('running',0)} ✓ ok={c.get('succeeded',0)} ✗ fail={c.get('failed',0)}"

print("="*80)
print(f"  KLING 2.1 STANDARD — {len(TIMELINE)} clips · mouvements propres")
print("="*80)

print("\n[1/3] Encodage...")
ths = []
for c in TIMELINE:
    t = threading.Thread(target=encode, args=(PUBLIC / c['file'], TMP / f"{c['name']}.jpg"))
    t.start(); ths.append(t)
for t in ths: t.join()
print(f"  ✓ {len(TIMELINE)} prêtes\n")

print(f"[2/3] Soumission progressive (max {MAX_CONCURRENT} en parallèle)...\n")
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
            clip['status'] = 'failed'; clip['error'] = result[1]
            print(f"  ✗ #{clip['seq']:>2} {clip['name']:<22} → {result[1][:60]}")
        elif result:
            clip['request_id'] = result; clip['status'] = 'submitted'
            in_flight += 1
            print(f"  ➤ #{clip['seq']:>2} {clip['name']:<22} → {result[:8]}...")
            save_state()
        sys.stdout.flush()
        time.sleep(0.4)

    active = [s for s in state.values() if s['status'] in ('submitted', 'running')]
    ths = []
    for s in active:
        def poll_one(s=s):
            status = poll(s['request_id'])
            if status == 'COMPLETED':
                try:
                    result = fetch_result(s['request_id'])
                    s['url'] = result['video']['url']
                    s['status'] = 'succeeded'
                    out = OUT / f"clip-{s['seq']:02d}-{s['name']}.mp4"
                    import socket
                    socket.setdefaulttimeout(60)
                    urllib.request.urlretrieve(s['url'], out)
                    print(f"  ✓ #{s['seq']:>2} {s['name']:<22} downloaded ({out.stat().st_size//1024}KB)")
                except Exception as e:
                    s['status'] = 'download_pending'
                    print(f"  ⚠ #{s['seq']:>2} download retry: {e}")
            elif status in ('FAILED', 'CANCELED'):
                s['status'] = 'failed'
                print(f"  ✗ #{s['seq']:>2} {s['name']:<22} {status}")
            elif status == 'IN_PROGRESS':
                s['status'] = 'running'
            sys.stdout.flush()
        t = threading.Thread(target=poll_one, daemon=True)
        t.start(); ths.append(t)
    for t in ths:
        t.join(timeout=30)
    save_state()

    if elapsed - last_print >= 15:
        last_print = elapsed
        print(f"  [{elapsed:>3}s] {status_line()}")
        sys.stdout.flush()

    remaining = [s for s in state.values() if s['status'] in ('pending', 'submitted', 'running', 'download_pending')]
    if not remaining: break
    if elapsed > 2400: break  # 40 min max
    time.sleep(8)

print("\n" + "="*80)
print(f"  TERMINÉ — {status_line()}")
print("="*80)
ok = [s for s in state.values() if s['status'] == 'succeeded']
print(f"\n✓ {len(ok)} clips dans {OUT}/")
fail = [s for s in state.values() if s['status'] == 'failed']
for s in fail:
    print(f"✗ #{s['seq']:>2} {s['name']:<22} {(s.get('error') or '')[:80]}")
