"""
save_model.py — Sérialise le DSO3Engine dans dso3_model.joblib
Lancez ce script UNE FOIS avant de démarrer l'API FastAPI.

    python save_model.py
"""

import joblib
from dso3_pipeline import DSO3Engine

engine = DSO3Engine()
output = "dso3_model.joblib"
joblib.dump(engine, output, compress=3)

import os
size_kb = os.path.getsize(output) / 1024
print(f"✅ Modèle sauvegardé : {output}  ({size_kb:.1f} KB)")

# Vérification
loaded = joblib.load(output)
print(f"✅ Rechargement OK : {loaded.model}")
