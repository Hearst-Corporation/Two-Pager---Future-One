#!/usr/bin/env python3
"""
Génère chaque ligne de voix-off comme MP3 séparé, avec timing prévu.
Permet de caler PRECISEMENT chaque phrase sur l'image qu'elle accompagne.
"""
import urllib.request, json, os, subprocess
from pathlib import Path

KEY = "sk_275a17d334ad20a394bae0d227e22914a23682063cc6cbd5"
ADAM = "pNInz6obpgDQGcFmaJgB"  # voix Adam

OUT = Path("/Users/adrienbeyondcrypto/Desktop/Prese Hub/public/audio/voice-segments")
OUT.mkdir(parents=True, exist_ok=True)

# Chaque ligne avec timestamp de début (synchro avec les clips visuels)
# Timeline référence :
#   0-5s    : clip 1 H particules (silence + impact musical)
#   5-15s   : clip 2 cover-facade  → "FUTUR ONE" + intro
#  15-20s   : clip 3 hero-datacenter
#  20-30s   : clip 4 supercomputer-wide
#  30-50s   : clips 5-7 (machine, water)
#  60-70s   : clip 10 aerial-white (CASSURE)
#  85-95s   : clip 14 hub-masterplan (pivot ville)
# 120-130s  : clip 20 hub-restaurant (happiness)
# 145-156s  : clip 24 back-cover (final)

LINES = [
    # ACTE 1 — CHOC
    {"id": "01-title",       "start":  6, "text": "FUTUR ONE."},
    {"id": "02-intro1",      "start": 10, "text": "They say the future belongs to those who build it."},
    {"id": "03-intro2",      "start": 15, "text": "We have decided. The future will be here."},

    # ACTE 2 — LA MACHINE
    {"id": "04-machine",     "start": 22, "text": "In the heart of the desert, a machine breathes."},
    {"id": "05-processors",  "start": 30, "text": "Thousands of processors. One intelligence."},
    {"id": "06-water",       "start": 41, "text": "Water and computation, fused as one."},
    {"id": "07-civilization","start": 51, "text": "The infrastructure of a new civilization."},

    # CASSURE
    {"id": "08-cassure",     "start": 62, "text": "But a machine is not enough."},

    # ACTE 4 — LA VILLE
    {"id": "09-city",        "start": 71, "text": "Around this intelligence, a city awakens."},
    {"id": "10-schools",     "start": 81, "text": "Schools. Squares. Streets."},
    {"id": "11-campus",      "start": 87, "text": "A campus designed for the people who will live in it."},

    # ACTE 5 — HAPPINESS
    {"id": "12-revolution",  "start": 100, "text": "Because the real revolution is not technological."},
    {"id": "13-human",       "start": 106, "text": "It is human."},
    {"id": "14-joy",         "start": 113, "text": "The joy of meeting. Of growing. Of laughing together."},
    {"id": "15-mission",     "start": 124, "text": "This is our true mission: the well-being of every soul."},

    # ACTE 6 — CLOSING
    {"id": "16-final-name",  "start": 142, "text": "FUTUR ONE."},
    {"id": "17-final-tagline","start":146, "text": "Technology in service of life."},
    {"id": "18-final-qatar", "start": 151, "text": "Qatar. Two thousand thirty."},
]

print(f"Génération de {len(LINES)} segments voix...")
for line in LINES:
    out_path = OUT / f"{line['id']}.mp3"
    if out_path.exists() and out_path.stat().st_size > 1000:
        # Récup la durée
        d = subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",str(out_path)]).decode().strip()
        line['duration'] = float(d)
        print(f"  ⏭ {line['id']} ({d}s) déjà OK")
        continue

    body = json.dumps({
        "text": line['text'],
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.55,
            "similarity_boost": 0.80,
            "style": 0.30,
            "use_speaker_boost": True
        }
    }).encode()

    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{ADAM}",
        data=body,
        headers={"xi-api-key": KEY, "Content-Type": "application/json", "Accept": "audio/mpeg"},
        method="POST")
    try:
        resp = urllib.request.urlopen(req, timeout=120)
        with open(out_path, "wb") as f:
            f.write(resp.read())
        d = subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",str(out_path)]).decode().strip()
        line['duration'] = float(d)
        print(f"  ✓ {line['id']:<22} start={line['start']:>4}s  dur={float(d):>4.1f}s  end={line['start']+float(d):>5.1f}s")
    except Exception as e:
        print(f"  ✗ {line['id']}: {e}")

# Sauvegarde le mapping pour build-final
with open(OUT / "_timing.json", "w") as f:
    json.dump(LINES, f, indent=2)
print(f"\n📝 Timing sauvegardé : {OUT}/_timing.json")
