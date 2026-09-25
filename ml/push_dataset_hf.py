"""Publication du jeu fusionne sur Hugging Face — a executer dans Colab."""

import glob
import os
from collections import Counter
import shutil

from huggingface_hub import HfApi

WTBD = "data/yolo_dataset"
DATASET_REPO = "OAoussama/blade-inspection-dataset"

api = HfApi()


def build_card() -> str:
    """Genere la fiche du jeu avec les effectifs reels."""
    names = ["craze", "corrosion", "surface_injure", "thunderstrike", "crack", "hide_craze"]
    rows, totals = [], Counter()

    for split in ("train", "val", "test"):
        counts = Counter()
        for path in glob.glob(f"{WTBD}/labels/{split}/*.txt"):
            for line in open(path):
                if line.strip():
                    counts[int(line.split()[0])] += 1
        n_img = len(glob.glob(f"{WTBD}/images/{split}/*"))
        rows.append((split, n_img, counts))
        totals.update(counts)

    table = "| Classe | " + " | ".join(s for s, _, _ in rows) + " | Total |\n"
    table += "|---|" + "---|" * (len(rows) + 1) + "\n"
    for cid, name in enumerate(names):
        cells = " | ".join(str(c.get(cid, 0)) for _, _, c in rows)
        table += f"| {name} | {cells} | {totals.get(cid, 0)} |\n"

    imgs = " · ".join(f"{s} : {n}" for s, n, _ in rows)

    return f"""---
license: cc-by-4.0
task_categories:
  - object-detection
tags:
  - wind-turbine
  - yolo
---

# Blade damage detection — jeu fusionne

Format YOLO : coordonnees normalisees entre 0 et 1, un fichier `.txt` par image.

Images : {imgs}

## Classes

L'ordre des identifiants est fige. Il correspond a l'enumeration
`DamageClass` du backend et aux poids publies. Le modifier renommerait
silencieusement chaque detection.

{table}

Les fichiers de labels vides sont volontaires : ce sont des images de
pales sans defaut, utilisees comme exemples negatifs.

## Sources

Deux jeux fusionnes apres remappage des identifiants de classe.

**WTBD** — Ji, L., Cheng, J., Wu, S. *Multiclass Dataset for Intelligent
Detection of Wind Turbine Blade Defects Using Drone Imagery.*
Scientific Data 13, 396 (2026). https://doi.org/10.1038/s41597-026-06762-x

**Beijing University** — *wind turbine Dataset.* Roboflow Universe (2023).
https://universe.roboflow.com/beijing-university-mgsyf/wind-turbine-iw8gk
Licence CC BY 4.0. Les neuf categories d'origine ont ete regroupees vers
cinq des six classes cibles ; les categories de salissure (poussiere,
depots) ont ete ecartees car elles ne constituent pas des defauts
structurels.

## Avertissement

Le jeu de **test** provient uniquement de WTBD et n'a pas ete modifie.
C'est ce qui permet de comparer les modeles entraines avant et apres
l'ajout du second jeu.
"""


def push() -> None:
    # Une seule archive plutot que des milliers de fichiers : un seul appel
    # reseau, pas de limitation de debit au telechargement.
    shutil.make_archive("data/yolo_dataset", "zip", "data", "yolo_dataset")

    api.upload_file(
        path_or_fileobj=f"{os.path.dirname(WTBD)}/yolo_dataset.zip",
        path_in_repo="yolo_dataset.zip",
        repo_id=DATASET_REPO,
        repo_type="dataset",
    )

    card = build_card()
    open("data/README.md", "w", encoding="utf-8").write(card)
    api.upload_file(
        path_or_fileobj="data/README.md",
        path_in_repo="README.md",
        repo_id=DATASET_REPO,
        repo_type="dataset",
    )

    # Etiquette la version : le notebook d'entrainement pourra pointer sur
    # v1 (WTBD seul) ou v2 (fusionne) pour reproduire un run precis.
    api.create_tag(repo_id=DATASET_REPO, tag="v2-merged",
                   repo_type="dataset", revision="main")

    print(card)
    print("\npublie et etiquete v2-merged")


if __name__ == "__main__":
    try:
        api.create_tag(repo_id=DATASET_REPO, tag="v1-wtbd",
                       repo_type="dataset", revision="main")
        print("tag v1-wtbd cree")
    except Exception as e:
        print("tag v1-wtbd deja present:", e)
    push()