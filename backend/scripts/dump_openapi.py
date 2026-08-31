"""Vuelca la especificación OpenAPI del backend a docs/api/openapi.json.

Uso (desde cualquier directorio):

    python backend/scripts/dump_openapi.py

Regenerá el archivo cada vez que cambien endpoints, schemas o la metadata de la
app en backend/app/main.py. El script no se conecta a la base: sólo introspecta
las rutas de FastAPI.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_DIR.parent
OUT_PATH = REPO_ROOT / "docs" / "api" / "openapi.json"

# Permite `from app.main import app` sin instalar el paquete.
sys.path.insert(0, str(BACKEND_DIR))

# Settings exige DATABASE_URL; para volcar el schema no hace falta una real.
os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost/db")

from app.main import app  # noqa: E402


def main() -> None:
    spec = app.openapi()
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps(spec, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"OpenAPI {spec['info']['version']} -> {OUT_PATH.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
