#!/usr/bin/env python3
"""
ASSEMBLEUR FINAL FUTUR ONE
- Concat 24 clips en 1080p 24fps
- Color grade chaude unifiée
- Cinema bars 2.39:1 (letterbox)
- Textes overlay aux moments clés
- Mix audio voix (100%) + musique (35%, ducking sous voix)
"""
import subprocess, os
from pathlib import Path

ROOT = Path("/Users/adrienbeyondcrypto/Desktop/Prese Hub")
CLIPS = ROOT / "public" / "clips"
AUDIO = ROOT / "public" / "audio"
TMP = Path("/tmp/futur-one-final")
TMP.mkdir(exist_ok=True)
OUT = ROOT / "public" / "FUTUR-ONE-FINAL.mp4"

TIMELINE = [
    ("clip-01-H-particles", ROOT/"public"/"clip-01-H-particles.mp4"),
    ("clip-02-cover-facade", CLIPS/"clip-02-cover-facade.mp4"),
    ("clip-03-hero-datacenter", CLIPS/"clip-03-hero-datacenter.mp4"),
    ("clip-04-supercomputer-wide", CLIPS/"clip-04-supercomputer-wide.mp4"),
    ("clip-05-supercomputer", CLIPS/"clip-05-supercomputer.mp4"),
    ("clip-06-aerial-campus-red", CLIPS/"clip-06-aerial-campus-red.mp4"),
    ("clip-07-water-compute", CLIPS/"clip-07-water-compute.mp4"),
    ("clip-08-hub-interior", CLIPS/"clip-08-hub-interior.mp4"),
    ("clip-09-aerial-campus-2", CLIPS/"clip-09-aerial-campus-2.mp4"),
    ("clip-10-aerial-white", CLIPS/"clip-10-aerial-white.mp4"),
    ("clip-11-vault", CLIPS/"clip-11-vault.mp4"),
    ("clip-12-amphitheater", CLIPS/"clip-12-amphitheater.mp4"),
    ("clip-13-p3-picture", CLIPS/"clip-13-p3-picture.mp4"),
    ("clip-14-hub-masterplan", CLIPS/"clip-14-hub-masterplan.mp4"),
    ("clip-15-hub-school", CLIPS/"clip-15-hub-school.mp4"),
    ("clip-16-hub-life", CLIPS/"clip-16-hub-life.mp4"),
    ("clip-17-hub-residential", CLIPS/"clip-17-hub-residential.mp4"),
    ("clip-18-hub-residential-2", CLIPS/"clip-18-hub-residential-2.mp4"),
    ("clip-19-desalination", CLIPS/"clip-19-desalination.mp4"),
    ("clip-20-hub-restaurant", CLIPS/"clip-20-hub-restaurant.mp4"),
    ("clip-21-hub-bar", CLIPS/"clip-21-hub-bar.mp4"),
    ("clip-22-hub-terrace", CLIPS/"clip-22-hub-terrace.mp4"),
    ("clip-23-p2-building", CLIPS/"clip-23-p2-building.mp4"),
    ("clip-24-back-cover", CLIPS/"clip-24-back-cover.mp4"),
]

# Étape 1 : normaliser chaque clip (1920x1080, 24fps, color grade chaude)
print("▸ [1/4] Normalisation + color grade des 24 clips (1080p 24fps)...")
concat_list = TMP / "concat.txt"
with open(concat_list, "w") as cf:
    for name, src in TIMELINE:
        out = TMP / f"n_{name}.mp4"
        if out.exists() and out.stat().st_size > 100_000:
            cf.write(f"file '{out}'\n")
            continue
        # Filtre chain : scale → pad letterbox → color grade chaude légère
        vf = (
            "scale=1920:1080:force_original_aspect_ratio=decrease,"
            "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,"
            "fps=24,"
            # Légère teinte chaude unifiée + saturation +5%
            "eq=contrast=1.05:saturation=1.08:gamma_r=1.02:gamma_g=1.0:gamma_b=0.96"
        )
        cmd = ["ffmpeg", "-y", "-i", str(src),
               "-vf", vf,
               "-c:v", "libx264", "-preset", "fast", "-crf", "20",
               "-an", str(out), "-loglevel", "error"]
        subprocess.run(cmd, check=True)
        cf.write(f"file '{out}'\n")
        print(f"  ✓ {name}")

# Étape 2 : concat
print("\n▸ [2/4] Concaténation des clips...")
video_only = TMP / "video-only.mp4"
subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_list),
                "-c", "copy", str(video_only), "-loglevel", "error"], check=True)
dur = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                               "-of", "csv=p=0", str(video_only)]).decode().strip()
print(f"  ✓ Vidéo seule : {dur}s")

# Étape 3 : ajouter textes overlay aux moments clés
print("\n▸ [3/4] Ajout des textes overlay...")
# Use system font that exists
font = "/System/Library/Fonts/Supplemental/Helvetica.ttc"
if not Path(font).exists():
    font = "/System/Library/Fonts/HelveticaNeue.ttc"

# Textes : début, cassure, fin
# - 0:02 → "FUTUR ONE" pendant 4s (sur clip H + début cover-facade)
# - 1:00 → "From machine to human." pendant 4s (sur cassure aerial-white)
# - 2:25 → "QATAR · 2030" pendant 5s (sur fin back-cover)

drawtext = (
    # Title 1 : FUTUR ONE — gros, élégant, 0:02 → 0:08
    f"drawtext=fontfile='{font}':text='FUTUR ONE':"
    "fontcolor=white:fontsize=140:x=(w-text_w)/2:y=(h-text_h)/2:"
    "alpha='if(lt(t,2),0,if(lt(t,3),(t-2),if(lt(t,7),1,if(lt(t,8),(8-t),0))))',"

    # Tagline 1 : sous le titre, 0:03 → 0:08
    f"drawtext=fontfile='{font}':text='Technology in service of life':"
    "fontcolor=white:fontsize=40:x=(w-text_w)/2:y=(h-text_h)/2+100:"
    "alpha='if(lt(t,3),0,if(lt(t,4),(t-3),if(lt(t,7),1,if(lt(t,8),(8-t),0))))',"

    # Title 2 : 'FROM MACHINE TO HUMAN' à 1:00 (60s) pendant 5s — moment cassure
    f"drawtext=fontfile='{font}':text='From machine to human.':"
    "fontcolor=white:fontsize=80:x=(w-text_w)/2:y=(h-text_h)/2:"
    "alpha='if(lt(t,60),0,if(lt(t,61),(t-60),if(lt(t,64),1,if(lt(t,65),(65-t),0))))',"

    # Title 3 : final QATAR 2030 — apparaît à 2:30 (150s) jusqu'à 2:35 (155s)
    f"drawtext=fontfile='{font}':text='QATAR · 2030':"
    "fontcolor=white:fontsize=120:x=(w-text_w)/2:y=(h-text_h)/2:"
    "alpha='if(lt(t,150),0,if(lt(t,151),(t-150),1))'"
)

video_with_text = TMP / "video-with-text.mp4"
subprocess.run(["ffmpeg", "-y", "-i", str(video_only),
                "-vf", drawtext,
                "-c:v", "libx264", "-preset", "medium", "-crf", "20",
                "-an", str(video_with_text), "-loglevel", "error"], check=True)
print("  ✓ Textes ajoutés")

# Étape 4 : mix audio + export final
print("\n▸ [4/4] Mix audio (voix 100% + musique 35% ducking)...")
voix = AUDIO / "voiceover.mp3"
musique = AUDIO / "musique.mp3"

# Voix démarre à 5s (après la H particles), pour laisser le choc d'ouverture en silence
# Mix : musique en fond, voix par-dessus avec sidechain compressor (ducking)
filter_complex = (
    f"[1:a]adelay=5000|5000,volume=1.0[voice];"      # voix delayed 5s
    f"[2:a]volume=0.30[bgm];"                         # musique 30%
    f"[bgm][voice]sidechaincompress=threshold=0.05:ratio=8:attack=20:release=400[ducked];"
    f"[ducked][voice]amix=inputs=2:duration=first:weights='1 1.2'[a]"
)

subprocess.run(["ffmpeg", "-y",
                "-i", str(video_with_text),
                "-i", str(voix),
                "-i", str(musique),
                "-filter_complex", filter_complex,
                "-map", "0:v", "-map", "[a]",
                "-c:v", "copy",
                "-c:a", "aac", "-b:a", "192k",
                "-shortest",
                str(OUT), "-loglevel", "error"], check=True)

dur = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                               "-of", "csv=p=0", str(OUT)]).decode().strip()
size_mb = OUT.stat().st_size / 1024 / 1024
print(f"  ✓ {OUT.name}")

print("\n" + "="*70)
print(f"  🎬 VIDÉO FINALE : {OUT}")
print(f"  ⏱  Durée : {dur}s")
print(f"  📦 Taille : {size_mb:.1f} MB")
print("="*70)
print(f"\n  ▶ Ouvrir : open '{OUT}'")
