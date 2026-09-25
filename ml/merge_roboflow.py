"""Remappage, fusion et publication du jeu Roboflow — à exécuter dans Colab.

Prérequis :
  - /content/yolo_dataset/   jeu WTBD déjà préparé (images/ + labels/)
  - /content/roboflow/       export YOLOv8 du fork Roboflow, décompressé
"""

import glob
import os
import shutil
from collections import Counter

WTBD = "data/yolo_dataset"
RF = "data/roboflow"

# --------------------------------------------------------------------------
# 1. Remappage des identifiants de classe
#
# Roboflow trie les classes par ordre alphabetique, WTBD suit l'ordre de
# class_definitions.txt. Sans ce remappage, chaque detection serait mal
# etiquetee — et rien ne leverait d'erreur.
# --------------------------------------------------------------------------
WTBD_NAMES = ["craze", "corrosion", "surface_injure", "thunderstrike", "crack", "hide_craze"]
RF_NAMES = ["corrosion", "crack", "hide_craze", "surface_injure", "thunderstrike"]

# Construit depuis les noms plutot qu'ecrit a la main : si Roboflow
# reordonne lors d'un futur export, le mapping suit automatiquement.
REMAP = {i: WTBD_NAMES.index(name) for i, name in enumerate(RF_NAMES)}
print("Remappage Roboflow -> WTBD :")
for rf_id, name in enumerate(RF_NAMES):
    print(f"  {rf_id} {name:16s} -> {REMAP[rf_id]}")


def remap_labels() -> None:
    touched = 0
    for split in ("train", "valid", "test"):
        for path in glob.glob(f"{RF}/{split}/labels/*.txt"):
            out = []
            for line in open(path):
                parts = line.split()
                if not parts:
                    continue
                parts[0] = str(REMAP[int(parts[0])])
                out.append(" ".join(parts))
            # Un fichier vide reste vide : c'est une image sans defaut,
            # donc un exemple negatif — precisement ce qui manque au jeu
            # WTBD pour reduire les faux positifs.
            open(path, "w").write("\n".join(out))
            touched += 1
    print(f"\n{touched} fichiers de labels remappes.")


# --------------------------------------------------------------------------
# 2. Fusion
#
# Le jeu de TEST WTBD reste intact : c'est la seule facon de comparer
# honnetement le nouveau modele a la version v2. Les images de test
# Roboflow sont donc versees dans train.
# --------------------------------------------------------------------------
SPLIT_MAP = {"train": "train"}


def merge() -> None:
    moved = Counter()
    for rf_split, wtbd_split in SPLIT_MAP.items():
        for kind in ("images", "labels"):
            src = f"{RF}/{rf_split}/{kind}"
            dst = f"{WTBD}/{kind}/{wtbd_split}"
            os.makedirs(dst, exist_ok=True)
            for f in glob.glob(f"{src}/*"):
                # Les noms Roboflow contiennent un hash unique
                # (nom.rf.<hash>.jpg) : aucune collision possible avec les
                # fichiers WTBD numerotes.
                shutil.copy(f, dst)
                if kind == "images":
                    moved[wtbd_split] += 1
    print("\nImages ajoutees :", dict(moved))


# --------------------------------------------------------------------------
# 3. Verifications — a lire avant de lancer l'entrainement
# --------------------------------------------------------------------------
def verify() -> None:
    print("\n--- Instances par classe ---")
    for split in ("train", "val", "test"):
        counts = Counter()
        empty = 0
        files = glob.glob(f"{WTBD}/labels/{split}/*.txt")
        for path in files:
            if os.path.getsize(path) == 0:
                empty += 1
                continue
            for line in open(path):
                if line.strip():
                    counts[int(line.split()[0])] += 1

        print(f"\n{split} — {len(files)} fichiers, {empty} sans annotation")
        for cid in range(len(WTBD_NAMES)):
            print(f"  {cid} {WTBD_NAMES[cid]:16s} {counts.get(cid, 0):5d}")

        assert not counts or max(counts) < len(WTBD_NAMES), \
            f"Identifiant de classe hors bornes dans {split}"

    # Chaque image doit avoir son fichier de labels, meme vide.
    print("\n--- Appariement images / labels ---")
    for split in ("train", "val", "test"):
        imgs = {os.path.splitext(os.path.basename(p))[0]
                for p in glob.glob(f"{WTBD}/images/{split}/*")}
        lbls = {os.path.splitext(os.path.basename(p))[0]
                for p in glob.glob(f"{WTBD}/labels/{split}/*.txt")}
        manquants = imgs - lbls
        orphelins = lbls - imgs
        print(f"{split}: {len(imgs)} images, {len(manquants)} sans label, "
              f"{len(orphelins)} labels orphelins")

        # Cree les labels manquants comme fichiers vides (image de fond).
        for name in manquants:
            open(f"{WTBD}/labels/{split}/{name}.txt", "w").close()


if __name__ == "__main__":
    remap_labels()
    merge()
    verify()