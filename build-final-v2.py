#!/usr/bin/env python3
"""
ASSEMBLEUR FINAL FUTUR ONE v2 — sans drawtext
Textes : générés en PNG via Pillow puis overlay
"""
import subprocess, os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path("/Users/adrienbeyondcrypto/Desktop/Prese Hub")
CLIPS = ROOT / "public" / "clips"
AUDIO = ROOT / "public" / "audio"
TMP = Path("/tmp/futur-one-final")
TMP.mkdir(exist_ok=True)
OUT = ROOT / "public" / "FUTUR-ONE-FINAL.mp4"

# Étape 0 : générer les textes overlay en PNG transparents
print("▸ [0/4] Génération des PNG de texte...")

def make_text_png(text, size, out_path, color=(255,255,255,255), W=1920, H=1080):
    img = Image.new("RGBA", (W, H), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    font_paths = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Supplemental/Helvetica.ttc",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    font = None
    for fp in font_paths:
        if Path(fp).exists():
            try:
                font = ImageFont.truetype(fp, size)
                break
            except: pass
    if font is None:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0,0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (W - tw) // 2 - bbox[0]
    y = (H - th) // 2 - bbox[1]
    # Léger drop shadow pour la lisibilité
    draw.text((x+3, y+3), text, fill=(0,0,0,180), font=font)
    draw.text((x, y), text, fill=color, font=font)
    img.save(out_path)

make_text_png("FUTUR ONE", 180, TMP/"txt-title.png")
make_text_png("Technology in service of life", 50, TMP/"txt-tagline.png", color=(255,200,100,230))
make_text_png("From machine to human.", 90, TMP/"txt-cassure.png")
make_text_png("QATAR · 2030", 140, TMP/"txt-final.png")
print("  ✓ 4 PNG de texte créés")

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

# Skip step 1+2 si déjà fait
video_only = TMP / "video-only.mp4"
if not video_only.exists():
    print("\n▸ [1/4] Normalisation des 24 clips...")
    concat_list = TMP / "concat.txt"
    with open(concat_list, "w") as cf:
        for name, src in TIMELINE:
            out = TMP / f"n_{name}.mp4"
            if not (out.exists() and out.stat().st_size > 100_000):
                vf = ("scale=1920:1080:force_original_aspect_ratio=decrease,"
                      "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,"
                      "fps=24,"
                      "eq=contrast=1.05:saturation=1.08:gamma_r=1.02:gamma_g=1.0:gamma_b=0.96")
                subprocess.run(["ffmpeg", "-y", "-i", str(src),
                               "-vf", vf,
                               "-c:v", "libx264", "-preset", "fast", "-crf", "20",
                               "-an", str(out), "-loglevel", "error"], check=True)
            cf.write(f"file '{out}'\n")
    print("  ✓ 24 clips normalisés")

    print("\n▸ [2/4] Concaténation...")
    subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_list),
                    "-c", "copy", str(video_only), "-loglevel", "error"], check=True)
    print(f"  ✓ {video_only.name}")

# Étape 3 : ajouter les textes overlay via filter overlay (PNG transparents)
print("\n▸ [3/4] Ajout des textes overlay (PNG)...")
video_with_text = TMP / "video-with-text.mp4"
# Chaque overlay : -i PNG, puis [N:v]format=rgba,fade...[txt],[acc][txt]overlay=enable=...
# On enchaîne 4 overlays
filter_complex = (
    # Title FUTUR ONE → 2s à 8s, fade in/out
    "[1:v]format=rgba,fade=t=in:st=2:d=0.8:alpha=1,fade=t=out:st=7:d=0.8:alpha=1[t1];"
    "[0:v][t1]overlay=0:0:enable='between(t,2,8)'[v1];"

    # Tagline → 3s à 8s
    "[2:v]format=rgba,fade=t=in:st=3:d=0.8:alpha=1,fade=t=out:st=7:d=0.8:alpha=1[t2];"
    "[v1][t2]overlay=0:0:enable='between(t,3,8)'[v2];"

    # Cassure 'From machine to human' → 60s à 65s
    "[3:v]format=rgba,fade=t=in:st=60:d=0.8:alpha=1,fade=t=out:st=64:d=0.8:alpha=1[t3];"
    "[v2][t3]overlay=0:0:enable='between(t,60,65)'[v3];"

    # QATAR 2030 → 150s à fin
    "[4:v]format=rgba,fade=t=in:st=150:d=1:alpha=1[t4];"
    "[v3][t4]overlay=0:0:enable='between(t,150,156)'"
)

subprocess.run(["ffmpeg", "-y",
                "-i", str(video_only),
                "-i", str(TMP/"txt-title.png"),
                "-i", str(TMP/"txt-tagline.png"),
                "-i", str(TMP/"txt-cassure.png"),
                "-i", str(TMP/"txt-final.png"),
                "-filter_complex", filter_complex,
                "-c:v", "libx264", "-preset", "medium", "-crf", "20",
                "-pix_fmt", "yuv420p",
                "-an",
                str(video_with_text), "-loglevel", "error"], check=True)
print("  ✓ Textes intégrés")

# Étape 4 : mix audio
print("\n▸ [4/4] Mix audio (voix 100% + musique 30% ducking)...")
voix = AUDIO / "voiceover.mp3"
musique = AUDIO / "musique.mp3"

filter_audio = (
    # voix démarre à 5s, padded à 156s pour pas couper
    "[1:a]adelay=5000|5000,apad=whole_dur=156,volume=1.0,asplit=2[voice1][voice2];"
    "[2:a]volume=0.30[bgm];"
    # ducking : la musique baisse quand la voix parle
    "[bgm][voice1]sidechaincompress=threshold=0.05:ratio=8:attack=20:release=400[ducked];"
    # mix final, durée = vidéo (longest)
    "[ducked][voice2]amix=inputs=2:duration=longest:weights='1 1.3'[a]"
)

subprocess.run(["ffmpeg", "-y",
                "-i", str(video_with_text),
                "-i", str(voix),
                "-i", str(musique),
                "-filter_complex", filter_audio,
                "-map", "0:v", "-map", "[a]",
                "-c:v", "copy",
                "-c:a", "aac", "-b:a", "192k",
                "-t", "156",  # durée explicite = vidéo complète
                str(OUT), "-loglevel", "error"], check=True)

dur = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                               "-of", "csv=p=0", str(OUT)]).decode().strip()
size_mb = OUT.stat().st_size / 1024 / 1024

print("\n" + "="*70)
print(f"  🎬 VIDÉO FINALE : {OUT.name}")
print(f"  📁 Path : {OUT}")
print(f"  ⏱  Durée : {dur}s")
print(f"  📦 Taille : {size_mb:.1f} MB")
print("="*70)
