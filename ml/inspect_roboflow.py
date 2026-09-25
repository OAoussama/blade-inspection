"""Inspection visuelle du jeu Roboflow — ml/inspect_roboflow.py"""

import glob
import os
import random
from collections import Counter

from PIL import Image, ImageDraw

RF = "data/roboflow/train"
OUT = "data/inspect"

# Identifiants WTBD (les labels ont deja ete remappes)
NAMES = {0: "craze", 1: "corrosion", 2: "surface_injure",
         3: "thunderstrike", 4: "crack", 5: "hide_craze"}

CLASSE = 4        # <-- la classe a inspecter
N_SAMPLES = 20

random.seed(42)

# Recense les images contenant la classe demandee
found, counts = [], Counter()
for lbl in glob.glob(f"{RF}/labels/*.txt"):
    ids = set()
    for line in open(lbl):
        if line.strip():
            ids.add(int(line.split()[0]))
    counts.update(ids)
    if CLASSE in ids:
        found.append(lbl)

print("Images par classe (presence, pas instances) :")
for cid in sorted(NAMES):
    print(f"  {cid} {NAMES[cid]:16s} {counts.get(cid, 0):5d}")

print(f"\n{len(found)} images contiennent '{NAMES[CLASSE]}'")

# Exporte un echantillon avec les boites tracees
out_dir = f"{OUT}/{NAMES[CLASSE]}"
os.makedirs(out_dir, exist_ok=True)

for lbl in random.sample(found, min(N_SAMPLES, len(found))):
    stem = os.path.splitext(os.path.basename(lbl))[0]
    img_path = next(iter(glob.glob(f"{RF}/images/{stem}.*")), None)
    if img_path is None:
        continue

    img = Image.open(img_path).convert("RGB")
    W, H = img.size
    draw = ImageDraw.Draw(img)

    for line in open(lbl):
        p = line.split()
        if not p:
            continue
        cid = int(p[0])
        # Format YOLO : centre x, centre y, largeur, hauteur (normalises)
        cx, cy, w, h = (float(v) for v in p[1:5])
        box = ((cx - w / 2) * W, (cy - h / 2) * H,
               (cx + w / 2) * W, (cy + h / 2) * H)
        color = "red" if cid == CLASSE else "gray"
        draw.rectangle(box, outline=color, width=3)
        draw.text((box[0] + 4, box[1] + 4), NAMES[cid], fill=color)

    img.save(f"{out_dir}/{stem}.jpg")

print(f"Echantillons dans {out_dir}")