#!/usr/bin/env python3
"""Recover the 23 clips that were submitted before the script was killed."""
import json, urllib.request, time, threading
from pathlib import Path

API_KEY = "key_2b9ad50bf50d357c1d5dc73640824c742ad584427fd6a867f22f70dfd88c09e1ce71de6989f0c406e7230fe6722a8369d9ab941a7038800a424a83f68497a979"
PROXY = "http://localhost:3099"
ROOT = Path("/Users/adrienbeyondcrypto/Desktop/Prese Hub")
OUT = ROOT / "public" / "clips"
OUT.mkdir(exist_ok=True)

# Task IDs récupérés depuis les logs
TASKS = [
    {"seq": 2, "name": "cover-facade",       "task": "4a558a28"},
    {"seq": 3, "name": "hero-datacenter",    "task": "5605e596"},
    {"seq": 4, "name": "supercomputer-wide", "task": "7ac94b07"},
    {"seq": 5, "name": "supercomputer",      "task": "27a580f7"},
    {"seq": 6, "name": "aerial-campus-red",  "task": "3f727704"},
    {"seq": 7, "name": "water-compute",      "task": "558a33ea"},
    {"seq": 8, "name": "hub-interior",       "task": "afa30349"},
    {"seq": 9, "name": "aerial-campus-2",    "task": "9f22a286"},
    {"seq": 10, "name": "aerial-white",      "task": "49c94fa6"},
    {"seq": 11, "name": "vault",             "task": "f1e36e31"},
    {"seq": 12, "name": "amphitheater",      "task": "55ae2067"},
    {"seq": 13, "name": "p3-picture",        "task": "94658ed6"},
    {"seq": 14, "name": "hub-masterplan",    "task": "d7f851b1"},
    {"seq": 15, "name": "hub-school",        "task": "e91f1d71"},
    {"seq": 16, "name": "hub-life",          "task": "e0fe9462"},
    {"seq": 17, "name": "hub-residential",   "task": "085cd603"},
    {"seq": 18, "name": "hub-residential-2", "task": "fe482614"},
    {"seq": 19, "name": "desalination",      "task": "8053b71f"},
    {"seq": 20, "name": "hub-restaurant",    "task": "d058af12"},
    {"seq": 21, "name": "hub-bar",           "task": "9d1f8f58"},
    {"seq": 22, "name": "hub-terrace",       "task": "fee8a68e"},
    {"seq": 23, "name": "p2-building",       "task": "c188d7a0"},
    {"seq": 24, "name": "back-cover",        "task": "52fc9f70"},
]

# Need full task IDs — list all recent tasks from Runway
print("📡 Récupération de la liste complète des tasks Runway...")
req = urllib.request.Request(
    f"{PROXY}/runway/list",
    headers={"X-API-Key": API_KEY}
)
# pas implémenté côté proxy, on va faire directement
# Plan B : poll par préfixe ne marche pas, il faut l'ID complet
# Solution : on relance les jobs (pas grave, ils prennent 30s chacun)

print("\n⚠ Impossible de récupérer les task IDs complets depuis les préfixes.")
print("   Plan B : on RE-soumet tous les jobs → les anciens vont juste expirer côté Runway.")
print("   (Coût : 23 × 5 crédits = environ 115 crédits, pour info)\n")
