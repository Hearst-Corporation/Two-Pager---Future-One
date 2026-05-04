#!/usr/bin/env python3
"""
v2 — robuste : sauvegarde IMMÉDIATE des UUIDs, retries, respect concurrence 3.
"""
import json, urllib.request, base64, time, threading, subprocess, os, sys, queue
from pathlib import Path

API_KEY = "key_2b9ad50bf50d357c1d5dc73640824c742ad584427fd6a867f22f70dfd88c09e1ce71de6989f0c406e7230fe6722a8369d9ab941a7038800a424a83f68497a979"
PROXY = "http://localhost:3099"
ROOT = Path("/Users/adrienbeyondcrypto/Desktop/Prese Hub")
PUBLIC = ROOT / "public"
OUT_DIR = PUBLIC / "clips"
OUT_DIR.mkdir(exist_ok=True)
TMP = Path("/tmp/runway-jpg")
TMP.mkdir(exist_ok=True)
STATE_FILE = ROOT / "runway-state.json"

# Concurrence Runway : 3 max simultaneous (selon /v1/organization)
MAX_CONCURRENT = 3

TIMELINE = [
    {"seq": 2, "name": "cover-facade", "file": "cover-facade.png", "dur": 10,
     "prompt": "Aggressive cinematic crane shot rising vertically up the FUTUR ONE faceted red and gold facade tower. Camera moves dramatically upward revealing the geometric triangulated surface. Golden sand particles swirl and rise in spiraling motion. Heat haze actively distorts the air. Sunset light beams sweep diagonally across reflective panels from left to right. Window reflections shimmer. Distant Qatar skyline visible at base. Strong forward parallax, anamorphic lens flares burst at peak frame. Dynamic, kinetic, alive, IMAX cinematography"},
    {"seq": 3, "name": "hero-datacenter", "file": "hero-datacenter.png", "dur": 5,
     "prompt": "White and gold humanoid robot turns its head smoothly toward camera in a futuristic data center corridor. Eyes glow as scanning lasers sweep. Rhythmic LED pulses on server racks behind. Cold mist drifts at floor level. Strong forward parallax depth. Kinetic, photorealistic, IMAX cinema"},
    {"seq": 4, "name": "supercomputer-wide", "file": "supercomputer-wide.png", "dur": 10,
     "prompt": "Aggressive forward dolly through the corridor of red and white server racks marked with the FUTUR ONE 8 logo. Red LED accent strips pulse rhythmically on the floor in waves. Server lights flicker in sync with hidden beat. Cold blue mist swirls actively at floor level. Reflections shimmer on polished surface. Strong parallax depth, vanishing point. Cinematic IMAX data center cinematography, kinetic, alive, photorealistic"},
    {"seq": 5, "name": "supercomputer", "file": "supercomputer.png", "dur": 5,
     "prompt": "Tight cinematic orbit around a single tall white and red supercomputer rack with FUTUR ONE 8 branding. Red LEDs pulse aggressively on indicator lights. Reflections shimmer on the polished floor. Active light beams sweep across casing. Photorealistic, shallow depth of field, kinetic motion"},
    {"seq": 6, "name": "aerial-campus-red", "file": "aerial-campus-red.png", "dur": 5,
     "prompt": "Fast aerial drone sweep over the angular red campus with artificial river and palm trees. Heat haze shimmers actively. Long desert shadows shift dynamically. Distant Doha skyline visible at horizon. Birds banking through frame. Dust kicked up by wind. Kinetic drone cinematography, photorealistic"},
    {"seq": 7, "name": "water-compute", "file": "water-compute.png", "dur": 10,
     "prompt": "Ultra-slow majestic low-angle crane rise alongside the white and burgundy cylindrical water-compute towers emerging from the sea. Water cascades pour dramatically from the structure base, foam churning. Sunlight glints on metallic surfaces. Sky reflects on water surface with rippling distortion. Camera tilts up to reveal full scale. Cinematic IMAX, photorealistic, awe-inspiring scale"},
    {"seq": 8, "name": "hub-interior", "file": "hub-interior.png", "dur": 5,
     "prompt": "Vertigo upward camera tilt inside the monumental red and gold hub interior atrium. Light beams cross the geometric surfaces, reflections multiply on faceted walls. Warm amber accent lights pulse on the central tower. Strong parallax depth. Cinematic IMAX, kinetic, photorealistic"},
    {"seq": 9, "name": "aerial-campus-2", "file": "aerial-campus-2.png", "dur": 5,
     "prompt": "Fast aerial pan over the burgundy angular campus with industrial chimneys at horizon. Subtle heat smoke rises from chimneys. Sun shadows shift quickly across rooftops. Solar panels glint. Long desert horizon stretches. Kinetic drone cinematography, photorealistic, magic hour color grade"},
    {"seq": 10, "name": "aerial-white", "file": "aerial-white.png", "dur": 10,
     "prompt": "BREATH OF CALM. Soft slow cinematic aerial reveal of the organic curving white campus with geodesic dome, gardens and water channels. Camera glides gently forward and down. Water ripples softly in canals. Trees sway in light breeze. Atmosphere shifts from industrial intensity to natural serenity. Anamorphic lens, photorealistic, peaceful warm color grade, dreamy IMAX"},
    {"seq": 11, "name": "vault", "file": "vault.png", "dur": 5,
     "prompt": "Smooth tracking shot through the white organic interior atrium with palm trees. People walk gracefully across the polished floor. Soft sunlight streams through skylights. Gentle motion of figures, calm atmosphere. Cinematic photorealistic, anamorphic, warm soft tones"},
    {"seq": 12, "name": "amphitheater", "file": "amphitheater.png", "dur": 5,
     "prompt": "Cinematic slow camera move across the curved multi-story amphitheater. Audience listens attentively, some clap, the speaker on stage gestures. Large screen behind shows a face addressing the crowd. Palm trees gently sway. Warm natural lighting. Photorealistic, cinematic depth of field, alive moment"},
    {"seq": 13, "name": "p3-picture", "file": "p3-picture.png", "dur": 5,
     "prompt": "Sweeping aerial reveal at magic hour over the curving S-shaped campus with football field. Long warm shadows stretch across the grass. Players moving on the field. Soft golden sunlight bathes the architecture. Photorealistic IMAX drone cinematography, anamorphic, peaceful kinetic motion"},
    {"seq": 14, "name": "hub-masterplan", "file": "hub-masterplan.png", "dur": 10,
     "prompt": "Wide cinematic establishing aerial shot of the campus with running track and modern stadium. Cyclists smoothly cross foreground path. Runners sprint along the red running track. Pedestrians walk and chat in golden hour light. Trees gently sway in warm breeze. Long soft shadows stretch. Atmosphere of healthy active life. Cinematic anamorphic, photorealistic, warm natural color grade, peaceful kinetic motion"},
    {"seq": 15, "name": "hub-school", "file": "hub-school.png", "dur": 5,
     "prompt": "Dynamic ground-level tracking shot through the international school plaza. Students walk with tablets and laptops, talking animatedly. Sunlight streams through glass facades, palm trees sway. Bright daylight, joyful learning energy. Photorealistic, cinematic anamorphic, kinetic warm motion"},
    {"seq": 16, "name": "hub-life", "file": "hub-life.png", "dur": 5,
     "prompt": "Vibrant tracking shot through the public park at golden hour. Kids on bicycles roll past camera laughing. Parents watching children play. Joggers run past. Trees rustle warmly in evening light. Atmospheric depth, soft sun flares. Pure happiness in motion, photorealistic, cinematic anamorphic, alive"},
    {"seq": 17, "name": "hub-residential", "file": "hub-residential.png", "dur": 5,
     "prompt": "Cinematic glide across the residential district plaza. Children playing in the foreground, parents walking, families gathered around water features. Soft golden hour light, palm trees swaying. Modern white houses behind. Pure suburban happiness, photorealistic, warm anamorphic cinematography"},
    {"seq": 18, "name": "hub-residential-2", "file": "hub-residential-2.png", "dur": 5,
     "prompt": "Slow camera arc around the residential pond at dusk. Children playing by water edge, mother sitting on grass, palm trees gently swaying. Warm interior lights flickering on in homes. Reflections rippling on water. Photorealistic cinematic anamorphic, peaceful magic hour"},
    {"seq": 19, "name": "desalination", "file": "desalination.png", "dur": 5,
     "prompt": "Slow cinematic glide across the golden copper-clad architectural plaza at dusk. Reflective water on the polished ground. Soft warm interior lights glow through facades. Distant skyline silhouette. People walking in foreground. Atmospheric depth, photorealistic, anamorphic, peaceful warm color grade"},
    {"seq": 20, "name": "hub-restaurant", "file": "hub-restaurant.png", "dur": 10,
     "prompt": "Sweeping cinematic glide through the vibrant outdoor restaurant terrace at golden hour. Diners laugh animatedly, glasses raised in toast, steam rising from plates. Palm fronds sway in evening breeze. String lights flicker warmly. Reflections dance on polished surfaces. Faces glowing with joy. Atmospheric depth of field, anamorphic lens flares, photorealistic, alive, warm color grade — pure happiness in motion"},
    {"seq": 21, "name": "hub-bar", "file": "hub-bar.png", "dur": 5,
     "prompt": "Cinematic camera glide across the elegant bar pavilion with sail-like canopies. Crowd gathered around the reflecting pool, fairy lights twinkle warmly above. People in conversation, laughter, glasses clinking. Palm trees with light strings sway. Reflections shimmer on water. Pure festive joy, photorealistic, warm anamorphic, alive"},
    {"seq": 22, "name": "hub-terrace", "file": "hub-terrace.png", "dur": 5,
     "prompt": "Cinematic camera glide across the rooftop terrace at sunset. Couples and friends in conversation, drinks in hand, gentle laughter. Reflective pool below. Warm string lights flicker. Distant skyline glow. Soft warm color grade, photorealistic, anamorphic depth of field, peaceful golden hour"},
    {"seq": 23, "name": "p2-building", "file": "p2-building.png", "dur": 10,
     "prompt": "Hyperspeed forward camera flight through the futuristic fuchsia and gold light tunnel. Light streaks blur into hypnotic motion lines on both sides. Floor reflections multiply the lights. Vanishing point in distance. Strong kinetic motion blur, transcendent dream-like sequence. Cinematic IMAX, photorealistic, dynamic"},
    {"seq": 24, "name": "back-cover", "file": "back-cover.png", "dur": 10,
     "prompt": "Slow majestic pull-back from the glowing copper and gold neon facade with circuit-like patterns. Camera retreats while orange lights pulse rhythmically across the building surface. Atmospheric haze in foreground. Sunset glow at horizon. Final breath of the journey, transcendent closing shot. Cinematic IMAX anamorphic, photorealistic, epic and emotional"},
]

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
    """Soumet un clip et retourne le task_id ou None en cas d'erreur."""
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
            return ('RETRY', err)  # quota / concurrent
        return ('ERROR', f"{e.code}: {err}")
    except Exception as e:
        return ('ERROR', str(e))

def poll(task_id):
    """Retourne (status, output_url_or_error)."""
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
    counts = {'pending': 0, 'submitted': 0, 'running': 0, 'succeeded': 0, 'failed': 0}
    for s in state.values():
        counts[s['status']] = counts.get(s['status'], 0) + 1
    return f"📊 pending={counts.get('pending',0)} submitted={counts.get('submitted',0)} running={counts.get('running',0)} ✓ succeeded={counts.get('succeeded',0)} ✗ failed={counts.get('failed',0)}"

# ─── PHASE 1 — encode (parallèle) ────────────────────────────────────────────
print("\n" + "="*80)
print(f"  GÉNÉRATION RUNWAY — {len(TIMELINE)} clips · concurrence max 3")
print("="*80)
print("\n[1/3] Encodage des images en JPG...")
threads = []
for clip in TIMELINE:
    t = threading.Thread(target=encode_image,
                         args=(PUBLIC / clip['file'], TMP / f"{clip['name']}.jpg"))
    t.start(); threads.append(t)
for t in threads: t.join()
print(f"  ✓ {len(TIMELINE)} images encodées")

# ─── PHASE 2 — submission avec respect de la concurrence ─────────────────────
print(f"\n[2/3] Soumission progressive (max {MAX_CONCURRENT} en parallèle)...")
sys.stdout.flush()

start = time.time()
last_print = 0

while True:
    elapsed = int(time.time() - start)

    # Combien de clips sont actuellement "running" ou "submitted" ?
    in_flight = sum(1 for s in state.values() if s['status'] in ('submitted', 'running'))

    # Nouveaux à soumettre
    pending = [s for s in state.values() if s['status'] == 'pending']

    # Soumettre tant qu'on a de la place
    while in_flight < MAX_CONCURRENT and pending:
        clip = pending.pop(0)
        result = submit(clip)
        if isinstance(result, tuple):
            kind, msg = result
            if kind == 'RETRY':
                # On retentera plus tard
                clip['status'] = 'pending'
                print(f"  ⏸ #{clip['seq']:>2} {clip['name']:<22} 429 → retry")
                break  # on attend
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
        else:
            clip['status'] = 'failed'
            clip['error'] = 'no task_id'

        sys.stdout.flush()
        time.sleep(0.4)  # gentle pacing

    # Poll les running
    active = [s for s in state.values() if s['status'] in ('submitted', 'running')]
    threads = []
    for s in active:
        def poll_one(s=s):
            status, url, fail = poll(s['task_id'])
            if status == 'SUCCEEDED':
                s['status'] = 'succeeded'
                s['url'] = url
                # download immédiat pour ne pas perdre l'URL (expire 24-48h)
                out = OUT_DIR / f"clip-{s['seq']:02d}-{s['name']}.mp4"
                try:
                    download(url, out)
                    print(f"  ✓ #{s['seq']:>2} {s['name']:<22} downloaded")
                except Exception as e:
                    print(f"  ⚠ #{s['seq']:>2} download failed: {e}")
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

    # Status board
    if elapsed - last_print >= 10:
        last_print = elapsed
        print(f"  [{elapsed:>3}s] {status_line()}")
        sys.stdout.flush()

    # Done ?
    remaining = [s for s in state.values() if s['status'] in ('pending', 'submitted', 'running')]
    if not remaining:
        break

    if elapsed > 1800:  # 30 min max
        print("⚠ Timeout 30 min — arrêt")
        break

    time.sleep(6)

# ─── PHASE 3 — résumé ────────────────────────────────────────────────────────
print("\n" + "="*80)
print("  TERMINÉ.")
print("="*80)
print(f"\n{status_line()}\n")

ok = [s for s in state.values() if s['status'] == 'succeeded']
fail = [s for s in state.values() if s['status'] == 'failed']

print(f"✓ {len(ok)} clips téléchargés dans {OUT_DIR}/")
for s in fail:
    print(f"✗ #{s['seq']:>2} {s['name']:<22} {s.get('error','')[:80]}")

# manifest
manifest = {
    "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    "clips": [{
        "seq": s['seq'], "name": s['name'], "duration": s['dur'],
        "file": f"clip-{s['seq']:02d}-{s['name']}.mp4" if s['status'] == 'succeeded' else None,
        "status": s['status'],
        "task_id": s.get('task_id'),
        "url": s.get('url'),
    } for s in state.values()]
}
with open(OUT_DIR / "manifest.json", "w") as f:
    json.dump(manifest, f, indent=2)
print(f"\n📝 Manifest : {OUT_DIR}/manifest.json")
