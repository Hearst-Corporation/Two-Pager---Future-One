#!/usr/bin/env python3
"""
ASSEMBLEUR FINAL FUTUR ONE v3
- Voix multi-segments synchronisée sur le visuel
- Musique plus forte (50% au lieu de 30%)
- Inverser clips 23 ↔ 24 (tunnel à la fin)
- Color grade chaude
- Textes overlay
"""
import subprocess, json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path("/Users/adrienbeyondcrypto/Desktop/Prese Hub")
CLIPS = ROOT / "public" / "clips"
AUDIO = ROOT / "public" / "audio"
SEGMENTS = AUDIO / "voice-segments"
TMP = Path("/tmp/futur-one-final")
TMP.mkdir(exist_ok=True)
OUT = ROOT / "public" / "FUTUR-ONE-FINAL.mp4"

# ─── TEXTES OVERLAY ──────────────────────────────────────────────────────────
print("▸ [1/5] Génération PNG textes...")
def make_text_png(text, size, out_path, color=(255,255,255,255), W=1920, H=1080, y_offset=0):
    img = Image.new("RGBA", (W, H), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    for fp in ["/System/Library/Fonts/Helvetica.ttc",
               "/System/Library/Fonts/Supplemental/Helvetica.ttc",
               "/System/Library/Fonts/HelveticaNeue.ttc"]:
        if Path(fp).exists():
            try: font = ImageFont.truetype(fp, size); break
            except: pass
    bbox = draw.textbbox((0,0), text, font=font)
    tw, th = bbox[2]-bbox[0], bbox[3]-bbox[1]
    x = (W - tw) // 2 - bbox[0]
    y = (H - th) // 2 - bbox[1] + y_offset
    # Drop shadow plus marqué pour la lisibilité
    draw.text((x+4, y+4), text, fill=(0,0,0,200), font=font)
    draw.text((x, y), text, fill=color, font=font)
    img.save(out_path)

make_text_png("FUTUR ONE", 200, TMP/"txt-title.png")
make_text_png("Technology in service of life", 50, TMP/"txt-tagline.png", color=(255,200,100,255), y_offset=130)
make_text_png("From machine to human.", 90, TMP/"txt-cassure.png")
make_text_png("QATAR · 2030", 150, TMP/"txt-final.png")
print("  ✓ 4 PNG")

# ─── ORDRE DES CLIPS — H retiré, 23↔24 INVERSÉS, certains raccourcis pour rythme ─
# Format : (name, src, target_duration_in_seconds)
# None = garder la durée native du clip
TIMELINE = [
    ("clip-02-cover-facade",       CLIPS/"clip-02-cover-facade.mp4",       None),  # 10s
    ("clip-03-hero-datacenter",    CLIPS/"clip-03-hero-datacenter.mp4",    None),  # 5s
    ("clip-04-supercomputer-wide", CLIPS/"clip-04-supercomputer-wide.mp4", None),  # 10s
    ("clip-05-supercomputer",      CLIPS/"clip-05-supercomputer.mp4",      3.5),   # 5→3.5s
    ("clip-06-aerial-campus-red",  CLIPS/"clip-06-aerial-campus-red.mp4",  3.5),   # 5→3.5s
    ("clip-07-water-compute",      CLIPS/"clip-07-water-compute.mp4",      None),  # 10s
    ("clip-08-hub-interior",       CLIPS/"clip-08-hub-interior.mp4",       None),  # 5s
    ("clip-09-aerial-campus-2",    CLIPS/"clip-09-aerial-campus-2.mp4",    3.5),   # 5→3.5s
    ("clip-10-aerial-white",       CLIPS/"clip-10-aerial-white.mp4",       None),  # 10s (CASSURE)
    ("clip-11-vault",              CLIPS/"clip-11-vault.mp4",              3.5),   # 5→3.5s
    ("clip-12-amphitheater",       CLIPS/"clip-12-amphitheater.mp4",       None),  # 5s
    ("clip-13-p3-picture",         CLIPS/"clip-13-p3-picture.mp4",         3.5),   # 5→3.5s
    ("clip-14-hub-masterplan",     CLIPS/"clip-14-hub-masterplan.mp4",     None),  # 10s
    ("clip-15-hub-school",         CLIPS/"clip-15-hub-school.mp4",         None),  # 5s
    ("clip-16-hub-life",           CLIPS/"clip-16-hub-life.mp4",           None),  # 5s
    ("clip-17-hub-residential",    CLIPS/"clip-17-hub-residential.mp4",    3.5),   # 5→3.5s
    ("clip-18-hub-residential-2",  CLIPS/"clip-18-hub-residential-2.mp4",  3.5),   # 5→3.5s
    ("clip-19-desalination",       CLIPS/"clip-19-desalination.mp4",       None),  # 5s
    ("clip-20-hub-restaurant",     CLIPS/"clip-20-hub-restaurant.mp4",     None),  # 10s
    ("clip-21-hub-bar",            CLIPS/"clip-21-hub-bar.mp4",            3.5),   # 5→3.5s
    ("clip-22-hub-terrace",        CLIPS/"clip-22-hub-terrace.mp4",        3.5),   # 5→3.5s
    ("clip-24-back-cover",         CLIPS/"clip-24-back-cover.mp4",         None),  # 10s
    ("clip-23-p2-building",        CLIPS/"clip-23-p2-building.mp4",        None),  # 5s (final tunnel)
]
# Total : 22 clips, durée ~138s

# ─── NORMALISATION ───────────────────────────────────────────────────────────
print("\n▸ [2/5] Normalisation 1080p 24fps + raccourcis...")
concat_list = TMP / "concat-v3.txt"
with open(concat_list, "w") as cf:
    for entry in TIMELINE:
        name, src, target_dur = entry
        # Suffixe pour distinguer les versions raccourcies
        suffix = f"_{target_dur}s" if target_dur else ""
        out = TMP / f"n_{name}{suffix}.mp4"
        if not (out.exists() and out.stat().st_size > 100_000):
            vf = ("scale=1920:1080:force_original_aspect_ratio=decrease,"
                  "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,"
                  "fps=24,"
                  "eq=contrast=1.05:saturation=1.08:gamma_r=1.02:gamma_g=1.0:gamma_b=0.96")
            cmd = ["ffmpeg", "-y", "-i", str(src), "-vf", vf,
                   "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-an"]
            if target_dur:
                cmd += ["-t", str(target_dur)]
            cmd += [str(out), "-loglevel", "error"]
            subprocess.run(cmd, check=True)
        cf.write(f"file '{out}'\n")
print(f"  ✓ {len(TIMELINE)} clips")

# Concat
print("\n▸ [3/5] Concat...")
video_only = TMP / "video-only-v3.mp4"
subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_list),
                "-c", "copy", str(video_only), "-loglevel", "error"], check=True)
dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries",
            "format=duration", "-of", "csv=p=0", str(video_only)]).decode().strip())
print(f"  ✓ Vidéo: {dur:.1f}s")

# ─── TEXTES OVERLAY (ajustés à l'ordre 23/24 inversé) ────────────────────────
# Maintenant clip 24 (back-cover) est AVANT clip 23 (p2-building tunnel)
# clip 23 finit à 156s, donc QATAR 2030 reste à la fin
print("\n▸ [4/5] Textes overlay...")
video_with_text = TMP / "video-with-text-v3.mp4"
# 4 textes principaux + 6 cartouches d'actes
# Timeline finale 137s :
#   00.0s  : Acte 1 (CHOC) commence — chapitre "THE VISION"
#   15.0s  : Acte 2 (MACHINE) commence — chapitre "THE INFRASTRUCTURE"
#   50.5s  : Cassure (aerial-white) — chapitre "THE PAUSE"
#   60.5s  : Acte 4 (VILLE) commence (vault) — chapitre "THE CITY"
#   87.5s  : Acte 5 (HAPPINESS) commence (hub-life) — chapitre "THE PEOPLE"
#  121.5s  : Acte 6 (CLOSING) commence (back-cover) — chapitre "THE PROMISE"
filter_complex = (
    # Titre principal FUTUR ONE (1-4s)
    "[1:v]format=rgba[t1];"
    "[0:v][t1]overlay=0:0:enable='between(t,1,4)'[v1];"
    # Tagline (1-4s)
    "[2:v]format=rgba[t2];"
    "[v1][t2]overlay=0:0:enable='between(t,1,4)'[v2];"
    # "From machine to human" (51-55s) — cassure
    "[3:v]format=rgba[t3];"
    "[v2][t3]overlay=0:0:enable='between(t,51,55)'[v3];"
    # QATAR 2030 (132-137s) — final
    "[4:v]format=rgba[t4];"
    "[v3][t4]overlay=0:0:enable='between(t,132,137)'[v4];"

    # ── 6 CARTOUCHES DE CHAPITRE (entrée/sortie en fade) ──
    # Chap 1 : THE VISION (15→19s) — début acte 2 MACHINE
    "[5:v]format=rgba,fade=t=in:st=15:d=0.5:alpha=1,fade=t=out:st=18:d=0.7:alpha=1[c1];"
    "[v4][c1]overlay=0:0:enable='between(t,15,19)'[v5];"
    # Chap 2 : THE INFRASTRUCTURE (32→36s) — water-compute
    "[6:v]format=rgba,fade=t=in:st=32:d=0.5:alpha=1,fade=t=out:st=35:d=0.7:alpha=1[c2];"
    "[v5][c2]overlay=0:0:enable='between(t,32,36)'[v6];"
    # Chap 3 : THE PAUSE (51→55s) — désactivé pour ne pas chevaucher From machine to human
    # (on garde juste le texte central déjà en place)

    # Chap 4 : THE CITY (60→64s) — début acte VILLE
    "[7:v]format=rgba,fade=t=in:st=60.5:d=0.5:alpha=1,fade=t=out:st=63:d=0.7:alpha=1[c4];"
    "[v6][c4]overlay=0:0:enable='between(t,60.5,64)'[v7];"
    # Chap 5 : THE PEOPLE (87.5→91.5s) — début acte HAPPINESS
    "[8:v]format=rgba,fade=t=in:st=87.5:d=0.5:alpha=1,fade=t=out:st=90.5:d=0.7:alpha=1[c5];"
    "[v7][c5]overlay=0:0:enable='between(t,87.5,91.5)'[v8];"
    # Chap 6 : THE PROMISE (121.5→125.5s) — début closing
    "[9:v]format=rgba,fade=t=in:st=121.5:d=0.5:alpha=1,fade=t=out:st=124.5:d=0.7:alpha=1[c6];"
    "[v8][c6]overlay=0:0:enable='between(t,121.5,125.5)'"
)
subprocess.run(["ffmpeg", "-y",
                "-i", str(video_only),
                "-i", str(TMP/"txt-title.png"),     # 1
                "-i", str(TMP/"txt-tagline.png"),   # 2
                "-i", str(TMP/"txt-cassure.png"),   # 3
                "-i", str(TMP/"txt-final.png"),     # 4
                "-i", str(TMP/"chap-1-vision.png"),  # 5
                "-i", str(TMP/"chap-2-infra.png"),   # 6
                "-i", str(TMP/"chap-4-city.png"),    # 7
                "-i", str(TMP/"chap-5-people.png"),  # 8
                "-i", str(TMP/"chap-6-promise.png"), # 9
                "-filter_complex", filter_complex,
                "-c:v", "libx264", "-preset", "medium", "-crf", "20",
                "-pix_fmt", "yuv420p", "-an",
                str(video_with_text), "-loglevel", "error"], check=True)
print("  ✓ Textes + 5 cartouches de chapitre intégrés")

# ─── MIX AUDIO PRO — UN SEUL FICHIER VOIX (volume unifié) ────────────────────
# Voix continue déjà traitée (compression, EQ, room reverb, loudnorm -16 LUFS)
# Musique alignée 137s avec breath sur cassure
# Ducking sidechain pour gérer la dynamique entre voix et musique

print("\n▸ [5/5] Mix audio pro (voix continue + musique sidechainée)...")

# Voix démarre à 1.5s pour laisser respirer le piano sur cover-facade
# Voix dure 95s, donc finit à 96.5s — laisse 40s de musique pure jusqu'à 137s
filter_audio = (
    # Voix : delay 1.5s, padded jusqu'à 137s pour ne pas couper le mix
    "[2:a]adelay=1500|1500,apad=whole_dur=137,asplit=2[voice_main][voice_sc];"
    # Musique : démarre à 0s, pad à 137s
    "[1:a]afade=t=in:st=0:d=1,afade=t=out:st=135:d=2,volume=1.0,apad=whole_dur=137[music_raw];"
    # Sidechain ducking ADOUCI — ratio 4 (vs 8) + release 800ms pour éviter trous
    "[music_raw][voice_sc]sidechaincompress=threshold=0.05:ratio=4:attack=40:release=800:makeup=1.5[music_ducked];"
    # Mix final : duration=longest pour ne PAS couper après la voix
    "[music_ducked][voice_main]amix=inputs=2:duration=longest:weights='0.95 1.6':normalize=0[mix];"
    # Limiter final + normalisation broadcast EBU R128
    "[mix]alimiter=limit=0.95:level_in=1:level_out=1,loudnorm=I=-16:TP=-1.5:LRA=11[a]"
)

inputs = ["-i", str(video_with_text), "-i", str(AUDIO/"musique.mp3"), "-i", str(AUDIO/"voiceover-final.mp3")]

cmd = ["ffmpeg", "-y"] + inputs + [
    "-filter_complex", filter_audio,
    "-map", "0:v", "-map", "[a]",
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", "192k",
    "-t", "137",
    str(OUT), "-loglevel", "error"
]
subprocess.run(cmd, check=True)

dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries",
            "format=duration", "-of", "csv=p=0", str(OUT)]).decode().strip())
size_mb = OUT.stat().st_size / 1024 / 1024

print("\n" + "="*70)
print(f"  🎬 VIDÉO FINALE V3 : {OUT.name}")
print(f"  ⏱  Durée : {dur:.1f}s")
print(f"  📦 Taille : {size_mb:.1f} MB")
print(f"  🎤 Voix : {len(voice_mp3s)} segments synchronisés")
print(f"  🎵 Musique : 55% (plus forte que v1)")
print(f"  🔄 Clips 23↔24 INVERSÉS (tunnel à la fin)")
print("="*70)
