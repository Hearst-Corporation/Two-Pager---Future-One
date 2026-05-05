#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# FUTUR ONE — Assemblage automatique de la vidéo finale
# ═══════════════════════════════════════════════════════════════════════════
# PRÉREQUIS :
#   1. Tous les clips MP4 dans public/clips/ (clip-01 à clip-24)
#   2. public/audio/voiceover.mp3 généré via ElevenLabs
#   3. public/audio/musique.mp3 généré via Suno
#
# UTILISATION :
#   bash 3-ASSEMBLE.sh
#
# RÉSULTAT :
#   public/FUTUR-ONE-FINAL.mp4 — vidéo complète avec son
# ═══════════════════════════════════════════════════════════════════════════

set -e
cd "$(dirname "$0")"

CLIPS_DIR="public/clips"
AUDIO_DIR="public/audio"
TMP="/tmp/futur-one-assembly"
OUT="public/FUTUR-ONE-FINAL.mp4"

mkdir -p "$TMP" "$AUDIO_DIR"

# ─── 1. Vérifier que tous les clips existent ─────────────────────────────────
echo "▸ [1/5] Vérification des clips..."
MISSING=0
for i in $(seq -f "%02g" 2 24); do
  FILE=$(ls "$CLIPS_DIR"/clip-${i}-*.mp4 2>/dev/null | head -1)
  if [ -z "$FILE" ]; then
    echo "  ⚠ MANQUANT: clip-$i"
    MISSING=$((MISSING+1))
  fi
done

# Le clip 1 (H particules) c'est le ffmpeg-rendered local
if [ ! -f "public/clip-01-H-particles.mp4" ]; then
  echo "  ⚠ MANQUANT: public/clip-01-H-particles.mp4"
  MISSING=$((MISSING+1))
fi

if [ $MISSING -gt 0 ]; then
  echo "❌ $MISSING clips manquants. On peut quand même continuer avec ce qu'on a."
  read -p "Continuer ? (y/N) " -n 1 -r
  echo
  [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
fi

# ─── 2. Normaliser tous les clips au même format (1280x720, 24fps) ───────────
echo "▸ [2/5] Normalisation des clips à 1280x720, 24fps..."
> "$TMP/concat.txt"

# Clip 1 (capture H locale)
if [ -f "public/clip-01-H-particles.mp4" ]; then
  ffmpeg -y -i "public/clip-01-H-particles.mp4" \
    -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,fps=24" \
    -c:v libx264 -preset fast -crf 18 -an \
    "$TMP/n01.mp4" -loglevel error
  echo "file '$TMP/n01.mp4'" >> "$TMP/concat.txt"
fi

# Clips 2-24 Kling
for i in $(seq -f "%02g" 2 24); do
  FILE=$(ls "$CLIPS_DIR"/clip-${i}-*.mp4 2>/dev/null | grep -v "STATIC\|KLING-STD\|KLING\|test" | head -1)
  if [ -n "$FILE" ]; then
    ffmpeg -y -i "$FILE" \
      -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,fps=24" \
      -c:v libx264 -preset fast -crf 18 -an \
      "$TMP/n${i}.mp4" -loglevel error
    echo "file '$TMP/n${i}.mp4'" >> "$TMP/concat.txt"
    echo "  ✓ clip-${i} normalisé"
  fi
done

# ─── 3. Concat tous les clips en une seule vidéo ─────────────────────────────
echo "▸ [3/5] Concaténation des clips..."
ffmpeg -y -f concat -safe 0 -i "$TMP/concat.txt" -c copy "$TMP/video-only.mp4" -loglevel error

DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$TMP/video-only.mp4")
echo "  ✓ Vidéo seule : ${DURATION}s"

# ─── 4. Ajouter audio (musique + voix) ───────────────────────────────────────
echo "▸ [4/5] Mixage audio..."

HAS_MUSIC=0
HAS_VOICE=0
[ -f "$AUDIO_DIR/musique.mp3" ] && HAS_MUSIC=1
[ -f "$AUDIO_DIR/voiceover.mp3" ] && HAS_VOICE=1

if [ $HAS_MUSIC -eq 1 ] && [ $HAS_VOICE -eq 1 ]; then
  echo "  ✓ Musique + voix détectées → mix complet"
  ffmpeg -y -i "$TMP/video-only.mp4" \
    -i "$AUDIO_DIR/musique.mp3" \
    -i "$AUDIO_DIR/voiceover.mp3" \
    -filter_complex "[1:a]volume=0.35[m];[2:a]volume=1.0[v];[m][v]amix=inputs=2:duration=longest[a]" \
    -map 0:v -map "[a]" \
    -c:v copy -c:a aac -b:a 192k \
    -shortest "$OUT" -loglevel error

elif [ $HAS_MUSIC -eq 1 ]; then
  echo "  ✓ Musique seule détectée"
  ffmpeg -y -i "$TMP/video-only.mp4" -i "$AUDIO_DIR/musique.mp3" \
    -filter_complex "[1:a]volume=0.7[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k \
    -shortest "$OUT" -loglevel error

elif [ $HAS_VOICE -eq 1 ]; then
  echo "  ✓ Voix seule détectée"
  ffmpeg -y -i "$TMP/video-only.mp4" -i "$AUDIO_DIR/voiceover.mp3" \
    -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k \
    -shortest "$OUT" -loglevel error

else
  echo "  ⚠ Aucun audio dans $AUDIO_DIR/ — sortie vidéo seule"
  cp "$TMP/video-only.mp4" "$OUT"
fi

# ─── 5. Récap ────────────────────────────────────────────────────────────────
echo "▸ [5/5] Terminé !"
SIZE=$(du -h "$OUT" | cut -f1)
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT" | xargs printf "%.1f")
echo
echo "═══════════════════════════════════════════════════════════════════════"
echo "  ✅ VIDÉO FINALE : $OUT"
echo "  ⏱  Durée : ${DUR}s"
echo "  📦 Taille : $SIZE"
echo "═══════════════════════════════════════════════════════════════════════"
echo
echo "  → Ouvre : open $OUT"
