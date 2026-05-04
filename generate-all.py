#!/usr/bin/env python3
"""
Génère les 23 clips Runway en parallèle (le clip 1 H-particles est déjà capturé en local).
Chaque image est compressée en JPG ≤2MB avant envoi.
"""

import json, urllib.request, base64, time, threading, subprocess, os, sys
from pathlib import Path

API_KEY = "key_2b9ad50bf50d357c1d5dc73640824c742ad584427fd6a867f22f70dfd88c09e1ce71de6989f0c406e7230fe6722a8369d9ab941a7038800a424a83f68497a979"
PROXY = "http://localhost:3099"
ROOT = Path("/Users/adrienbeyondcrypto/Desktop/Prese Hub")
PUBLIC = ROOT / "public"
OUT_DIR = PUBLIC / "clips"
OUT_DIR.mkdir(exist_ok=True)
TMP = Path("/tmp/runway-jpg")
TMP.mkdir(exist_ok=True)

# Timeline officielle (sans H-particles qui est déjà en local)
TIMELINE = [
    # ACTE 1
    {"seq": 2, "name": "cover-facade", "file": "cover-facade.png", "dur": 10,
     "prompt": "Aggressive cinematic crane shot rising vertically up the FUTUR ONE faceted red and gold facade tower. Camera moves dramatically upward revealing the geometric triangulated surface. Golden sand particles swirl and rise in spiraling motion. Heat haze actively distorts the air. Sunset light beams sweep diagonally across reflective panels from left to right. Window reflections shimmer. Distant Qatar skyline visible at base. Strong forward parallax, anamorphic lens flares burst at peak frame. Dynamic, kinetic, alive, IMAX cinematography"},

    # ACTE 2
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

    # ACTE 3 — CASSURE
    {"seq": 10, "name": "aerial-white", "file": "aerial-white.png", "dur": 10,
     "prompt": "BREATH OF CALM. Soft slow cinematic aerial reveal of the organic curving white campus with geodesic dome, gardens and water channels. Camera glides gently forward and down. Water ripples softly in canals. Trees sway in light breeze. Atmosphere shifts from industrial intensity to natural serenity. Anamorphic lens, photorealistic, peaceful warm color grade, dreamy IMAX"},

    # ACTE 4
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

    # ACTE 5
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

    # ACTE 6
    {"seq": 22, "name": "hub-terrace", "file": "hub-terrace.png", "dur": 5,
     "prompt": "Cinematic camera glide across the rooftop terrace at sunset. Couples and friends in conversation, drinks in hand, gentle laughter. Reflective pool below. Warm string lights flicker. Distant skyline glow. Soft warm color grade, photorealistic, anamorphic depth of field, peaceful golden hour"},

    {"seq": 23, "name": "p2-building", "file": "p2-building.png", "dur": 10,
     "prompt": "Hyperspeed forward camera flight through the futuristic fuchsia and gold light tunnel. Light streaks blur into hypnotic motion lines on both sides. Floor reflections multiply the lights. Vanishing point in distance. Strong kinetic motion blur, transcendent dream-like sequence. Cinematic IMAX, photorealistic, dynamic"},

    {"seq": 24, "name": "back-cover", "file": "back-cover.png", "dur": 10,
     "prompt": "Slow majestic pull-back from the glowing copper and gold neon facade with circuit-like patterns. Camera retreats while orange lights pulse rhythmically across the building surface. Atmospheric haze in foreground. Sunset glow at horizon. Final breath of the journey, transcendent closing shot. Cinematic IMAX anamorphic, photorealistic, epic and emotional"},
]


def encode_image(file_path: Path, out_jpg: Path):
    """Convertit en JPG 1920px wide, qualité 2 (haute)."""
    if out_jpg.exists() and out_jpg.stat().st_size < 5_000_000:
        return  # déjà fait
    cmd = ["ffmpeg", "-y", "-i", str(file_path), "-vf", "scale=1920:-1",
           "-q:v", "2", str(out_jpg), "-loglevel", "error"]
    subprocess.run(cmd, check=True)


def to_data_uri(jpg_path: Path) -> str:
    with open(jpg_path, "rb") as f:
        return "data:image/jpeg;base64," + base64.b64encode(f.read()).decode()


def submit(clip):
    jpg_path = TMP / f"{clip['name']}.jpg"
    encode_image(PUBLIC / clip['file'], jpg_path)
    img_uri = to_data_uri(jpg_path)

    body = json.dumps({
        "model": "gen4_turbo",
        "promptImage": img_uri,
        "promptText": clip['prompt'],
        "duration": clip['dur'],
        "ratio": "1280:720",
    }).encode()

    req = urllib.request.Request(
        f"{PROXY}/runway/generate", data=body,
        headers={"Content-Type": "application/json", "X-API-Key": API_KEY},
        method="POST"
    )
    try:
        resp = urllib.request.urlopen(req, timeout=60)
        data = json.loads(resp.read())
        clip['task_id'] = data['id']
        clip['status'] = 'RUNNING'
        print(f"  ✓ #{clip['seq']:>2} {clip['name']:<20} → {data['id'][:8]}...")
    except urllib.error.HTTPError as e:
        clip['status'] = 'FAILED'
        clip['error'] = f"{e.code} {e.read().decode()[:100]}"
        print(f"  ✗ #{clip['seq']:>2} {clip['name']:<20} → {clip['error']}")
    except Exception as e:
        clip['status'] = 'FAILED'
        clip['error'] = str(e)
        print(f"  ✗ #{clip['seq']:>2} {clip['name']:<20} → {e}")


def poll(clip):
    if clip.get('status') != 'RUNNING':
        return
    try:
        req = urllib.request.Request(
            f"{PROXY}/runway/status/{clip['task_id']}",
            headers={"X-API-Key": API_KEY}
        )
        data = json.loads(urllib.request.urlopen(req, timeout=15).read())
        clip['status'] = data.get('status')
        clip['progress'] = data.get('progress', 0)
        if clip['status'] == 'SUCCEEDED':
            clip['url'] = data.get('output', [None])[0]
        elif clip['status'] == 'FAILED':
            clip['error'] = data.get('failureCode', 'unknown')
    except Exception as e:
        clip['error'] = str(e)


def download(clip):
    out = OUT_DIR / f"clip-{clip['seq']:02d}-{clip['name']}.mp4"
    urllib.request.urlretrieve(clip['url'], out)
    return out.stat().st_size


print("\n" + "="*80)
print(f"  GÉNÉRATION RUNWAY — {len(TIMELINE)} clips · timeline 'From Machine to Human'")
print("="*80)

# Step 1 — Encode all images first (parallel)
print("\n[1/3] Encodage des images en JPG...")
threads = []
for clip in TIMELINE:
    t = threading.Thread(target=encode_image,
                         args=(PUBLIC / clip['file'], TMP / f"{clip['name']}.jpg"))
    t.start()
    threads.append(t)
for t in threads:
    t.join()
print(f"  ✓ {len(TIMELINE)} images encodées dans {TMP}")

# Step 2 — Submit all jobs (sequential to respect rate limits)
print(f"\n[2/3] Soumission des {len(TIMELINE)} jobs Runway...")
for clip in TIMELINE:
    submit(clip)
    time.sleep(0.3)  # gentle pacing

active = [c for c in TIMELINE if c.get('status') == 'RUNNING']
print(f"\n  → {len(active)} jobs actifs, {len(TIMELINE)-len(active)} échecs initiaux")

# Step 3 — Poll until all done
print(f"\n[3/3] Polling jusqu'à completion (toutes les 8s)...")
start = time.time()
last_print = 0
while True:
    elapsed = int(time.time() - start)
    pending = [c for c in TIMELINE if c.get('status') == 'RUNNING']
    if not pending:
        break

    # Poll all in parallel
    threads = [threading.Thread(target=poll, args=(c,)) for c in pending]
    for t in threads: t.start()
    for t in threads: t.join()

    # Status board
    if elapsed - last_print >= 8:
        last_print = elapsed
        done = sum(1 for c in TIMELINE if c.get('status') == 'SUCCEEDED')
        running = sum(1 for c in TIMELINE if c.get('status') == 'RUNNING')
        failed = sum(1 for c in TIMELINE if c.get('status') == 'FAILED')
        print(f"  [{elapsed:>3}s] ✓ {done:>2} succeeded · ⏳ {running:>2} running · ✗ {failed} failed")
        sys.stdout.flush()

    if elapsed > 600:
        print("\n⚠ Timeout 10 min — arrêt du polling")
        break
    time.sleep(8)

# Step 4 — Download all
print("\n[4/4] Téléchargement des vidéos...")
total_size = 0
for clip in TIMELINE:
    if clip.get('status') == 'SUCCEEDED' and clip.get('url'):
        size = download(clip)
        total_size += size
        print(f"  ✓ #{clip['seq']:>2} {clip['name']:<20} {size/1024/1024:.1f} MB")
    elif clip.get('status') == 'FAILED':
        print(f"  ✗ #{clip['seq']:>2} {clip['name']:<20} FAILED: {clip.get('error', '?')}")

print(f"\n  Total : {total_size/1024/1024:.0f} MB téléchargés dans {OUT_DIR}")
print("\n" + "="*80)
print("  TERMINÉ.")
print("="*80)

# Sauvegarde JSON pour le montage
import json
manifest = {
    "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    "clips": [{
        "seq": c['seq'],
        "name": c['name'],
        "duration": c['dur'],
        "file": f"clip-{c['seq']:02d}-{c['name']}.mp4" if c.get('status') == 'SUCCEEDED' else None,
        "status": c.get('status'),
        "error": c.get('error'),
    } for c in TIMELINE]
}
with open(ROOT / "public/clips/manifest.json", "w") as f:
    json.dump(manifest, f, indent=2)
print(f"  Manifest : public/clips/manifest.json")
