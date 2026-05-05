#!/usr/bin/env python3
"""Re-génère les 7 clips clés en 10s (mêmes prompts que le run Kling validé)."""
import urllib.request, json, base64, time, threading, subprocess, os, sys, socket
from pathlib import Path

KEY = "2e8d79ea-fc03-4e92-9f2a-dca297ed7e0a:ce50dbb3e16582181144b6fac626a4e4"
ROOT = Path("/Users/adrienbeyondcrypto/Desktop/Prese Hub")
PUBLIC = ROOT / "public"
OUT = PUBLIC / "clips"
TMP = Path("/tmp/runway-jpg")
ENDPOINT = "https://queue.fal.run/fal-ai/kling-video/v2.1/standard/image-to-video"

# Les 7 moments clés (ouverture, machine forte, cassure, pivot ville, vie, tunnel, fin)
KEY_CLIPS = [
    {"seq": 2, "name": "cover-facade", "file": "cover-facade.png",
     "prompt": "Camera tilts up smoothly along the faceted red and gold facade tower. The building stays stable. Sunset sky glows softly behind. Cinematic crane shot."},
    {"seq": 4, "name": "supercomputer-wide", "file": "supercomputer-wide.png",
     "prompt": "Camera glides forward through the corridor of red and white server racks. Lights pulse on both sides. Smooth continuous forward motion. Cinematic dolly shot."},
    {"seq": 7, "name": "water-compute", "file": "water-compute.png",
     "prompt": "Camera slowly tilts up along the white tower emerging from the water. Water flows steadily down the sides. Reflections ripple on the sea. Cinematic crane shot."},
    {"seq": 10, "name": "aerial-white", "file": "aerial-white.png",
     "prompt": "Drone slowly pulls back revealing the white organic city with curving buildings and water channels. Smooth aerial reveal. Cinematic and peaceful."},
    {"seq": 14, "name": "hub-masterplan", "file": "hub-masterplan.png",
     "prompt": "Camera glides smoothly across the running track. Cyclists ride past in the foreground. Runners move on the track. Pedestrians walk. Cinematic tracking shot."},
    {"seq": 20, "name": "hub-restaurant", "file": "hub-restaurant.png",
     "prompt": "Camera glides smoothly through the restaurant terrace between the tables. Diners chat and eat. Palm trees sway. Sunset light. Cinematic tracking shot."},
    {"seq": 24, "name": "back-cover", "file": "back-cover.png",
     "prompt": "Camera slowly moves laterally to the right along the glowing copper neon facade. Lights reflect on the floor. Smooth tracking shot."},
]

def submit(c):
    jpg = TMP / f"{c['name']}.jpg"
    with open(jpg, "rb") as f:
        img_uri = "data:image/jpeg;base64," + base64.b64encode(f.read()).decode()
    body = json.dumps({
        "prompt": c['prompt'],
        "image_url": img_uri,
        "duration": "10",
        "aspect_ratio": "16:9",
    }).encode()
    req = urllib.request.Request(ENDPOINT, data=body,
        headers={"Authorization": f"Key {KEY}", "Content-Type": "application/json"},
        method="POST")
    return json.loads(urllib.request.urlopen(req, timeout=60).read())['request_id']

def poll(rid):
    req = urllib.request.Request(
        f"https://queue.fal.run/fal-ai/kling-video/requests/{rid}/status",
        headers={"Authorization": f"Key {KEY}"})
    return json.loads(urllib.request.urlopen(req, timeout=15).read()).get('status')

def fetch(rid):
    req = urllib.request.Request(
        f"https://queue.fal.run/fal-ai/kling-video/requests/{rid}",
        headers={"Authorization": f"Key {KEY}"})
    return json.loads(urllib.request.urlopen(req, timeout=15).read())

print("="*80)
print(f"  KLING 10s — {len(KEY_CLIPS)} clips clés")
print("="*80)

# Backup les versions 5s actuelles
for c in KEY_CLIPS:
    src = OUT / f"clip-{c['seq']:02d}-{c['name']}.mp4"
    if src.exists():
        backup = OUT / f"clip-{c['seq']:02d}-{c['name']}-5s-backup.mp4"
        if not backup.exists():
            os.rename(src, backup)
            print(f"  💾 backup → {backup.name}")

# Submit all
for c in KEY_CLIPS:
    c['rid'] = submit(c)
    c['status'] = 'IN_PROGRESS'
    print(f"  ➤ #{c['seq']:>2} {c['name']:<22} → {c['rid'][:8]}...")
    time.sleep(0.4)

# Poll
start = time.time()
socket.setdefaulttimeout(60)
while True:
    elapsed = int(time.time() - start)
    pending = [c for c in KEY_CLIPS if c.get('status') not in ('COMPLETED', 'FAILED')]
    if not pending: break

    threads = []
    for c in pending:
        def poll_one(c=c):
            try:
                s = poll(c['rid'])
                c['status'] = s
                if s == 'COMPLETED':
                    r = fetch(c['rid'])
                    url = r['video']['url']
                    out = OUT / f"clip-{c['seq']:02d}-{c['name']}.mp4"
                    urllib.request.urlretrieve(url, out)
                    print(f"  ✓ #{c['seq']:>2} {c['name']:<22} ({out.stat().st_size//1024}KB)")
            except Exception as e:
                print(f"  ⚠ #{c['seq']} poll: {e}")
            sys.stdout.flush()
        t = threading.Thread(target=poll_one, daemon=True)
        t.start(); threads.append(t)
    for t in threads: t.join(timeout=30)

    done = sum(1 for c in KEY_CLIPS if c.get('status') == 'COMPLETED')
    if elapsed % 20 == 0:
        print(f"  [{elapsed}s] ✓ {done}/{len(KEY_CLIPS)}")
        sys.stdout.flush()

    if elapsed > 1200: break
    time.sleep(8)

print("\n" + "="*80)
done = sum(1 for c in KEY_CLIPS if c.get('status') == 'COMPLETED')
print(f"  TERMINÉ — {done}/{len(KEY_CLIPS)} clips clés en 10s")
print("="*80)
