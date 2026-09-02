"""Exporta las tablas `leads` y `mensajes` a CSV anonimizado, como evidencia.

Uso (con el stack de docker compose levantado):

    python backend/scripts/export_evidencia.py [--out-dir DIR]

Escribe `evidencia/barberia/leads.csv` y `evidencia/barberia/mensajes.csv` (la
base local está configurada para RHbarber). La anonimización es determinística
(misma entrada -> misma salida), así que volver a correrlo sin cambios en la base
no modifica los archivos.

Anonimización:
  - nombre     -> etiqueta "Lead NN" (por orden de id)
  - lead_id    -> "LNN"  (no se emite el lead_id real)
  - whatsapp   -> "549261*****NN", con un sufijo de 2 dígitos pseudoaleatorio
    por lead (determinístico, único, sin ningún dígito del número real). Se
    calcula igual para `leads` y `mensajes`, así el cruce entre los dos CSV por
    `whatsapp_anon` sigue siendo válido y único. El identificador estable del
    lead para cruzar es `lead_ref` (`LNN`).
  - documento_lead (en `datos`) y cualquier DNI suelto de 7-8 dígitos dentro del
    texto de un mensaje -> todos los dígitos en "*" menos los 2 últimos
  - el nombre del lead (completo o de pila) y el del asesor, cuando aparecen
    dentro del texto de un mensaje -> "[nombre]"
  - el resto del contenido conversacional se conserva sin editar
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import random
import re
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault(
    "DATABASE_URL", "postgresql://botadmin:backend_pass@localhost:5433/bot_manager"
)

from sqlmodel import Session, select  # noqa: E402

from app.core.serializers import a_utc_iso  # noqa: E402
from app.database import engine  # noqa: E402
from app.leads.model import Lead  # noqa: E402
from app.mensajes.model import Mensaje  # noqa: E402

_DNI_RE = re.compile(r"(?<!\d)\d{7,8}(?!\d)")

# Nombres de asesor que aparecen en los mensajes de los datasets ("soy Diego").
_STAFF = ("Marcos", "Diego")


def _rel(p: Path) -> Path | str:
    try:
        return p.relative_to(REPO_ROOT)
    except ValueError:
        return p


def _mask_digits(valor: str) -> str:
    """Deja sólo los 2 últimos dígitos; el resto pasa a '*'."""
    s = str(valor)
    return "*" * max(len(s) - 2, 0) + s[-2:]


def tel_anon_lista(cantidad: int) -> list[str]:
    """Un `whatsapp_anon` por lead: prefijo de Mendoza + sufijo de 2 dígitos
    pseudoaleatorio. Determinístico (semilla fija), único, y sin relación con el
    índice del lead ni con el número real (26 valores distintos de 100)."""
    rng = random.Random(97531)
    vistos: set[str] = set()
    salida: list[str] = []
    while len(salida) < cantidad:
        t = f"{rng.randint(0, 99):02d}"
        if t not in vistos:
            vistos.add(t)
            salida.append(f"549261*****{t}")
    return salida


def _mask_texto(texto: str) -> str:
    return _DNI_RE.sub(lambda m: _mask_digits(m.group()), texto or "")


def _mask_nombres(texto: str, nombre_lead: str) -> str:
    """Reemplaza por `[nombre]` el nombre del lead (completo o de pila) y el del
    asesor cuando aparecen dentro del texto de un mensaje. Mismo criterio que las
    tablas .md ('Nombre de contacto ... ofuscado')."""
    if not texto:
        return texto
    n = (nombre_lead or "").strip()
    if n:
        # Nombre completo: \b al inicio, sin \b al final (puede terminar en emoji).
        texto = re.sub(rf"\b{re.escape(n)}", "[nombre]", texto, flags=re.IGNORECASE)
        primero = n.split()[0]
        if len(primero) >= 3:
            texto = re.sub(rf"\b{re.escape(primero)}\b", "[nombre]", texto, flags=re.IGNORECASE)
    for asesor in _STAFF:
        texto = re.sub(rf"\b{re.escape(asesor)}\b", "[nombre]", texto, flags=re.IGNORECASE)
    return texto


def _mask_datos(datos: dict) -> str:
    out = dict(datos or {})
    if out.get("documento_lead"):
        out["documento_lead"] = _mask_digits(out["documento_lead"])
    return json.dumps(out, ensure_ascii=False, sort_keys=True)


def run_export(out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)

    with Session(engine) as session:
        leads = session.exec(select(Lead).order_by(Lead.id)).all()
        mensajes = session.exec(
            select(Mensaje).order_by(Mensaje.fecha_hora, Mensaje.id)
        ).all()

    # Mapa whatsapp real -> (ref anónima, teléfono anónimo, orden, nombre real).
    tels = tel_anon_lista(len(leads))
    anon = {
        lead.whatsapp: (f"L{i:02d}", tels[i - 1], i, lead.nombre)
        for i, lead in enumerate(leads, 1)
    }

    # mensajes.csv agrupado por lead (orden de id) y cronológico dentro de cada uno.
    mensajes.sort(key=lambda m: (anon.get(m.lead_whatsapp, ("", "", 10**9, ""))[2], m.fecha_hora, m.id))

    leads_path = out_dir / "leads.csv"
    with leads_path.open("w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh, lineterminator="\n")
        w.writerow([
            "lead_ref", "nombre_anon", "whatsapp_anon", "fecha_ingreso", "estado",
            "ultimo_mensaje", "seguimientos", "listo_para_cerrar", "fecha_cierre",
            "datos_json",
        ])
        for i, lead in enumerate(leads, 1):
            w.writerow([
                f"L{i:02d}",
                f"Lead {i:02d}",
                tels[i - 1],
                a_utc_iso(lead.fecha_ingreso),
                lead.estado,
                a_utc_iso(lead.ultimo_mensaje),
                lead.seguimientos,
                str(lead.listo_para_cerrar).lower(),
                a_utc_iso(lead.fecha_cierre) or "",
                _mask_datos(lead.datos),
            ])

    mensajes_path = out_dir / "mensajes.csv"
    huerfanos = 0
    with mensajes_path.open("w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh, lineterminator="\n")
        w.writerow(["lead_ref", "whatsapp_anon", "fecha_hora", "origen", "mensaje"])
        for m in mensajes:
            par = anon.get(m.lead_whatsapp)
            if par is None:
                huerfanos += 1
                continue
            ref, tel, _, nombre = par
            w.writerow([
                ref,
                tel,
                a_utc_iso(m.fecha_hora),
                m.origen,
                _mask_nombres(_mask_texto(m.mensaje), nombre),
            ])

    print(f"{_rel(leads_path)}: {len(leads)} filas")
    print(f"{_rel(mensajes_path)}: {len(mensajes) - huerfanos} filas")
    if huerfanos:
        print(f"AVISO: {huerfanos} mensajes sin lead asociado, omitidos")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out-dir", type=Path, default=REPO_ROOT / "evidencia" / "barberia",
        help="Directorio de salida (default: evidencia/barberia/)",
    )
    args = parser.parse_args()
    run_export(args.out_dir)
