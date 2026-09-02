"""Genera el dataset de demostración de **Aislaciones RH** directo a CSV.

A diferencia de `seed_demo.py` + `export_evidencia.py` (que cargan y leen de la
base), este script arma el dataset en memoria y escribe los CSV ya anonimizados.
No toca la base: la base local está configurada para otro negocio (RHbarber).

Uso:

    python backend/scripts/gen_evidencia_aislaciones.py [--out-dir DIR]

Escribe `evidencia/aislaciones/leads.csv` y `evidencia/aislaciones/mensajes.csv`,
con las mismas columnas y la misma anonimización que los CSV de barbería.

24 leads de consultas de aislación térmica/acústica en Mendoza, con
`fecha_ingreso` repartida en las 4 semanas previas al 30/08/2026
(02/08 → 30/08), días hábiles y hora comercial. Todos los "números aleatorios"
(teléfonos, horarios, latencias entre mensajes) salen de un PRNG con semilla
fija: el CSV es reproducible pero no "redondo".

Anonimización:
  - nombre     -> "Lead NN"
  - lead_id    -> "LNN"  (no se emite un id real)
  - whatsapp   -> "549261*****NN", con un sufijo de 2 dígitos pseudoaleatorio
    por lead (determinístico, único, sin dígitos reales ni relación con el
    índice); idéntico en los dos CSV. El cruce estable es `lead_ref`.
  - cualquier corrida de 7-11 dígitos dentro del texto de un mensaje (un teléfono
    o documento que el lead pudiera tipear) -> dígitos en "*" menos los 2 últimos
  - el nombre del lead (completo o de pila) y el del asesor, cuando aparecen
    dentro del texto de un mensaje -> "[nombre]"
  - el resto del contenido conversacional se conserva sin editar
"""

from __future__ import annotations

import argparse
import csv
import json
import random
import re
from datetime import date, datetime, timedelta
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

_SEED = 20260830
_RNG = random.Random(_SEED)
_UTC_OFFSET = timedelta(hours=3)  # Mendoza (UTC-3) -> UTC naive

_VENTANA_INICIO = date(2026, 8, 2)
_VENTANA_FIN = date(2026, 8, 30)

_NUM_RE = re.compile(r"(?<!\d)\d{7,11}(?!\d)")


# --- Textos del bot (Aislaciones RH) -----------------------------------------

GREETING = (
    "Hola, ¿cómo estás? Soy el asistente de Aislaciones RH. ¿En qué te puedo "
    "ayudar con tu consulta de aislación térmica o acústica?"
)
SERVICIOS = (
    "Hacemos aislación térmica y acústica en techos, paredes y entrepisos, para "
    "inmuebles residenciales y comerciales en toda Mendoza."
)
PRECIO = (
    "El valor depende de la superficie y del sistema (lana de vidrio, poliuretano "
    "proyectado, EPS). Para pasarte un número necesito algunos datos del inmueble."
)
ASK_DATOS = (
    "Para avanzar con un presupuesto estimado necesito: tipo de inmueble (casa, "
    "departamento, local, galpón), zona, superficie aproximada en m² y si es para "
    "obra nueva o una refacción."
)
CAPTURADO = (
    "Listo, ya registré tu consulta. Un asesor te va a contactar para coordinar "
    "una visita y pasarte el presupuesto detallado."
)


def _seguimiento(nombre: str) -> str:
    return (
        f"Hola {nombre.split()[0]}, te escribimos desde Aislaciones RH. ¿Pudiste "
        "ver la info que te pasamos? Quedamos a disposición 🙌"
    )


# --- Generadores deterministas ---------------------------------------------------

def _fechas_ingreso(cantidad: int) -> list[datetime]:
    """`cantidad` instantes crecientes, en días hábiles (sin domingos) dentro de
    la ventana, con el primero y el último pegados a los bordes."""
    habiles = [
        _VENTANA_INICIO + timedelta(days=i)
        for i in range((_VENTANA_FIN - _VENTANA_INICIO).days + 1)
        if (_VENTANA_INICIO + timedelta(days=i)).weekday() != 6  # sin domingos
    ]
    horas = list(range(9, 19))
    pesos = [2, 3, 3, 4, 4, 4, 4, 3, 3, 2]
    elegidas = sorted(_RNG.choice(habiles) for _ in range(cantidad))
    elegidas[0], elegidas[-1] = habiles[0], habiles[-1]  # cubrir toda la ventana
    salida: list[datetime] = []
    for d in elegidas:
        h = _RNG.choices(horas, weights=pesos)[0]
        local = datetime(
            d.year, d.month, d.day, h,
            _RNG.randint(0, 59), _RNG.randint(0, 59), _RNG.randint(0, 999_999),
        )
        salida.append(local + _UTC_OFFSET)
    salida.sort()  # el índice de lead queda alineado con el orden cronológico
    return salida


def _gap(prev_origen: str | None, origen: str) -> timedelta:
    us = _RNG.randint(0, 999_999)
    if prev_origen is None:
        return timedelta(seconds=_RNG.randint(2, 6), microseconds=us)
    if origen == "SEG":
        return timedelta(seconds=_RNG.randint(30 * 60, 3 * 3600), microseconds=us)
    if origen == "BOT":
        if prev_origen == "BOT":
            return timedelta(milliseconds=_RNG.randint(3, 30), microseconds=_RNG.randint(0, 999))
        return timedelta(milliseconds=_RNG.randint(5, 45), microseconds=_RNG.randint(0, 999))
    if origen == "HUMANO":
        return timedelta(seconds=_RNG.randint(3 * 60, 40 * 60), microseconds=us)
    # LEAD
    if _RNG.random() < 0.15:
        return timedelta(seconds=_RNG.randint(8 * 60, 50 * 60), microseconds=us)
    return timedelta(seconds=_RNG.randint(15, 260), microseconds=us)


# --- Anonimización -------------------------------------------------------------

def _mask_digits(valor: str) -> str:
    s = str(valor)
    return "*" * max(len(s) - 2, 0) + s[-2:]


def _tels_anon(cantidad: int) -> list[str]:
    """Un `whatsapp_anon` por lead: prefijo de Mendoza + sufijo de 2 dígitos
    pseudoaleatorio. Determinístico (semilla propia), único, sin relación con el
    índice del lead (24 valores distintos de 100). El cruce estable es `lead_ref`."""
    rng = random.Random(24680)
    vistos: set[str] = set()
    salida: list[str] = []
    while len(salida) < cantidad:
        t = f"{rng.randint(0, 99):02d}"
        if t not in vistos:
            vistos.add(t)
            salida.append(f"549261*****{t}")
    return salida


def _mask_texto(texto: str) -> str:
    return _NUM_RE.sub(lambda m: _mask_digits(m.group()), texto or "")


# Nombres de asesor que aparecen en los mensajes ("soy Marcos", "soy Diego").
_STAFF = ("Marcos", "Diego")


def _mask_nombres(texto: str, nombre_lead: str) -> str:
    """Reemplaza por `[nombre]` el nombre del lead (completo o de pila) y el del
    asesor cuando aparecen dentro del texto de un mensaje. Mismo criterio que las
    tablas .md de la barbería ('Nombre de contacto ... ofuscado')."""
    if not texto:
        return texto
    n = (nombre_lead or "").strip()
    if n:
        texto = re.sub(rf"\b{re.escape(n)}", "[nombre]", texto, flags=re.IGNORECASE)
        primero = n.split()[0]
        if len(primero) >= 3:
            texto = re.sub(rf"\b{re.escape(primero)}\b", "[nombre]", texto, flags=re.IGNORECASE)
    for asesor in _STAFF:
        texto = re.sub(rf"\b{re.escape(asesor)}\b", "[nombre]", texto, flags=re.IGNORECASE)
    return texto


def _a_utc_iso(dt: datetime | None) -> str:
    if dt is None:
        return ""
    return dt.isoformat() + "Z"


# --- Dataset -----------------------------------------------------------------
# n, nombre, estado, listo, seguimientos, datos, cierre_dias (o None),
# msgs=[(origen, texto)]. origen "SEG" = seguimiento automático (se guarda "BOT").
LEADS: list[dict] = [
    # --- Consulta de precio / técnica, sin calificar (ACTIVO) ---
    dict(
        n=1, nombre="Martín Ávila", estado="ACTIVO", listo=False, seguimientos=0,
        datos={}, cierre_dias=None,
        msgs=[
            ("LEAD", "Hola, quería consultar por aislación de un techo de chapa"),
            ("BOT", GREETING),
            ("LEAD", "es una casa, el techo de chapa se recalienta muchísimo en verano"),
            ("BOT", PRECIO),
        ],
    ),
    dict(
        n=2, nombre="Lucía Cornejo", estado="ACTIVO", listo=False, seguimientos=0,
        datos={"tipo_inmueble": "Departamento"}, cierre_dias=None,
        msgs=[
            ("LEAD", "hola, hacen aislación acústica? escucho todo del vecino"),
            ("BOT", GREETING),
            ("LEAD", "es un depto, pared medianera con el vecino"),
            ("BOT", "Sí, hacemos aislación acústica de paredes. Sobre la medianera se arma un trasdosado con panel y lana. " + PRECIO),
        ],
    ),
    dict(
        n=3, nombre="Diego Funes", estado="ACTIVO", listo=False, seguimientos=0,
        datos={"tipo_inmueble": "Galpón"}, cierre_dias=None,
        msgs=[
            ("LEAD", "buenas, necesito aislar la cubierta de un galpón"),
            ("BOT", GREETING),
            ("LEAD", "es para bajar la temperatura adentro, se trabaja de día"),
            ("BOT", "Para galpones lo más habitual es poliuretano proyectado bajo la cubierta. " + PRECIO),
        ],
    ),
    dict(
        n=4, nombre="Sabrina Páez", estado="ACTIVO", listo=False, seguimientos=0,
        datos={}, cierre_dias=None,
        msgs=[
            ("LEAD", "trabajan en Luján de Cuyo?"),
            ("BOT", GREETING),
            ("LEAD", "sí, la zona, si cubren Luján"),
            ("BOT", "Sí, trabajamos en todo el Gran Mendoza, Luján incluido."),
        ],
    ),
    dict(
        n=5, nombre="Hernán Ruiz", estado="ACTIVO", listo=False, seguimientos=0,
        datos={}, cierre_dias=None,
        msgs=[
            ("LEAD", "qué diferencia hay entre lana de vidrio y poliuretano proyectado?"),
            ("BOT", GREETING),
            ("BOT", "La lana de vidrio va en mantas o paneles y es más económica; el poliuretano se proyecta, sella mejor las juntas y rinde más por espesor, pero sale más. La elección depende del techo y del presupuesto."),
            ("LEAD", "ok gracias, lo tengo en cuenta"),
        ],
    ),
    dict(
        n=6, nombre="Carolina Vega", estado="ACTIVO", listo=False, seguimientos=0,
        datos={"tipo_inmueble": "Local"}, cierre_dias=None,
        msgs=[
            ("LEAD", "Hola, tengo un local que es un horno en verano, el techo es losa"),
            ("BOT", GREETING),
            ("LEAD", "quiero saber qué se puede hacer y un precio aproximado"),
            ("BOT", "En losa se puede aislar por arriba con EPS y contrapiso, o por abajo con cielorraso más lana. " + PRECIO),
        ],
    ),
    dict(
        n=7, nombre="Pablo Moyano", estado="ACTIVO", listo=False, seguimientos=0,
        datos={}, cierre_dias=None,
        msgs=[
            ("LEAD", "cuánto sale el m2 de aislación de techo aprox?"),
            ("BOT", GREETING),
            ("BOT", PRECIO),
            ("LEAD", "dale, después te paso los datos"),
        ],
    ),
    dict(
        n=8, nombre="Rocío Bianchi", estado="ACTIVO", listo=False, seguimientos=0,
        datos={"intencion": "Consulta técnica"}, cierre_dias=None,
        msgs=[
            ("LEAD", "consulta técnica: se me hace agua el techo por dentro en invierno, es condensación?"),
            ("BOT", GREETING),
            ("LEAD", "techo de chapa sin cielorraso, gotea cuando hace mucho frío"),
            ("BOT", "Sí, es condensación: la chapa fría junta la humedad del ambiente. Se resuelve con aislación y una barrera de vapor del lado interior. Un asesor te puede pasar el detalle."),
        ],
    ),
    # --- Calificado, datos completos, listo_para_cerrar ---
    dict(
        n=9, nombre="Fernando Gómez", estado="HUMANO", listo=True, seguimientos=0,
        datos={"tipo_inmueble": "Casa", "zona": "Godoy Cruz", "superficie_m2": "110",
               "intencion": "Refacción"},
        cierre_dias=None,
        msgs=[
            ("LEAD", "Hola, quiero aislar el techo de mi casa"),
            ("BOT", GREETING),
            ("LEAD", "cuánto puede salir?"),
            ("BOT", PRECIO),
            ("LEAD", "es una refacción, casa en Godoy Cruz, el techo son unos 110 m2"),
            ("BOT", ASK_DATOS),
            ("LEAD", "casa, Godoy Cruz, 110 m2, refacción"),
            ("BOT", CAPTURADO),
        ],
    ),
    dict(
        n=10, nombre="Valeria Sosa", estado="ACTIVO", listo=True, seguimientos=0,
        datos={"tipo_inmueble": "Departamento", "zona": "Ciudad de Mendoza",
               "superficie_m2": "65", "intencion": "Refacción"},
        cierre_dias=None,
        msgs=[
            ("LEAD", "buenas, aislación térmica para un depto de 65 m2 en Ciudad"),
            ("BOT", GREETING),
            ("BOT", ASK_DATOS),
            ("LEAD", "departamento, Ciudad de Mendoza, 65 m2, es refacción"),
            ("BOT", CAPTURADO),
        ],
    ),
    dict(
        n=11, nombre="Andrés Molina", estado="HUMANO", listo=True, seguimientos=0,
        datos={"tipo_inmueble": "Galpón", "zona": "Luján de Cuyo", "superficie_m2": "400",
               "intencion": "Nueva construcción"},
        cierre_dias=None,
        msgs=[
            ("LEAD", "estamos construyendo un galpón en Luján y queremos aislar la cubierta"),
            ("BOT", GREETING),
            ("LEAD", "son 400 m2 de cubierta, obra nueva"),
            ("BOT", ASK_DATOS),
            ("LEAD", "galpón, Luján de Cuyo, 400 m2, obra nueva"),
            ("BOT", CAPTURADO),
            ("HUMANO", "Hola Andrés, soy Marcos de Aislaciones RH. ¿Tenés los planos de la cubierta? Así vamos con un número más preciso."),
        ],
    ),
    dict(
        n=12, nombre="Mariana Torres", estado="ACTIVO", listo=True, seguimientos=0,
        datos={"tipo_inmueble": "Casa", "zona": "Chacras de Coria", "superficie_m2": "180",
               "intencion": "Nueva construcción",
               "notas_encargado": "Obra en pozo, coordinar visita con el arquitecto."},
        cierre_dias=None,
        msgs=[
            ("LEAD", "Hola! casa nueva en Chacras, queremos aislación en techo y paredes"),
            ("BOT", GREETING),
            ("BOT", ASK_DATOS),
            ("LEAD", "casa, Chacras de Coria, 180 m2 cubiertos, obra nueva"),
            ("BOT", CAPTURADO),
        ],
    ),
    dict(
        n=13, nombre="Cristian Bustos", estado="HUMANO", listo=True, seguimientos=0,
        datos={"tipo_inmueble": "Local", "zona": "Guaymallén", "superficie_m2": "90",
               "intencion": "Refacción"},
        cierre_dias=None,
        msgs=[
            ("LEAD", "hola, local en Guaymallén, quiero aislar el techo, se trabaja mal por el calor"),
            ("BOT", GREETING),
            ("BOT", ASK_DATOS),
            ("LEAD", "local comercial, Guaymallén, unos 90 m2, refacción"),
            ("BOT", CAPTURADO),
        ],
    ),
    dict(
        n=14, nombre="Julieta Ferrari", estado="ACTIVO", listo=True, seguimientos=0,
        datos={"tipo_inmueble": "Casa", "zona": "Maipú", "superficie_m2": "95",
               "intencion": "Refacción"},
        cierre_dias=None,
        msgs=[
            ("LEAD", "quiero presupuesto para aislar el techo de una casa en Maipú"),
            ("BOT", GREETING),
            ("BOT", ASK_DATOS),
            ("LEAD", "casa, Maipú, 95 m2, refacción"),
            ("BOT", CAPTURADO),
        ],
    ),
    # --- Sin respuesta -> seguimiento automático (HUMANO, seguimientos=1) ---
    dict(
        n=15, nombre="Emiliano Cáceres", estado="HUMANO", listo=False, seguimientos=1,
        datos={}, cierre_dias=None,
        msgs=[("LEAD", "hola"), ("BOT", GREETING), ("SEG", None)],
    ),
    dict(
        n=16, nombre="Antonella Ledesma", estado="HUMANO", listo=False, seguimientos=1,
        datos={}, cierre_dias=None,
        msgs=[
            ("LEAD", "precio aislación de techo?"),
            ("BOT", GREETING),
            ("BOT", PRECIO),
            ("SEG", None),
        ],
    ),
    dict(
        n=17, nombre="Gastón Herrera", estado="HUMANO", listo=False, seguimientos=1,
        datos={}, cierre_dias=None,
        msgs=[
            ("LEAD", "hola queria consultar unas cosas sobre aislacion"),
            ("BOT", GREETING),
            ("SEG", None),
        ],
    ),
    dict(
        n=18, nombre="Micaela Ponce", estado="HUMANO", listo=False, seguimientos=1,
        datos={}, cierre_dias=None,
        msgs=[("LEAD", "buenas"), ("BOT", GREETING), ("SEG", None)],
    ),
    # --- Cerrado (CERRADO, fecha_cierre) ---
    dict(
        n=19, nombre="Gonzalo Rivas", estado="CERRADO", listo=True, seguimientos=0,
        datos={"tipo_inmueble": "Casa", "zona": "Dorrego", "superficie_m2": "130",
               "intencion": "Refacción",
               "notas_encargado": "Presupuesto enviado y aceptado. Obra agendada."},
        cierre_dias=3,
        msgs=[
            ("LEAD", "Hola, quiero aislar el techo de mi casa en Dorrego"),
            ("BOT", GREETING),
            ("BOT", ASK_DATOS),
            ("LEAD", "casa, Dorrego, 130 m2, refacción"),
            ("BOT", CAPTURADO),
            ("HUMANO", "Hola Gonzalo, te paso el presupuesto por mail hoy. Coordinamos visita para el jueves."),
        ],
    ),
    dict(
        n=20, nombre="Belén Aguilar", estado="CERRADO", listo=False, seguimientos=0,
        datos={"tipo_inmueble": "Departamento", "zona": "Ciudad de Mendoza",
               "superficie_m2": "70", "intencion": "Consulta técnica"},
        cierre_dias=2,
        msgs=[
            ("LEAD", "consulta: el techo del último piso del edificio transmite mucho calor a mi depto"),
            ("BOT", GREETING),
            ("LEAD", "es un depto de 70 m2 en Ciudad, quería saber si tiene solución"),
            ("BOT", "Tiene solución: se aísla la losa del techo del edificio por arriba, o el cielorraso de tu depto por dentro. Conviene una visita técnica."),
            ("HUMANO", "Hola Belén, para eso necesitamos el ok del consorcio si es la losa común. Te explico las dos opciones por teléfono."),
        ],
    ),
    dict(
        n=21, nombre="Ramiro Ortega", estado="CERRADO", listo=True, seguimientos=1,
        datos={"tipo_inmueble": "Galpón", "zona": "Russell", "superficie_m2": "520",
               "intencion": "Nueva construcción"},
        cierre_dias=5,
        msgs=[
            ("LEAD", "galpón nuevo en Russell, 520 m2, necesito aislar cubierta"),
            ("BOT", GREETING),
            ("BOT", ASK_DATOS),
            ("LEAD", "galpón, Russell, 520 m2, obra nueva"),
            ("BOT", CAPTURADO),
            ("SEG", None),
            ("LEAD", "sí, sigo interesado, esta semana confirmo la visita"),
        ],
    ),
    dict(
        n=22, nombre="Daniela Campos", estado="CERRADO", listo=False, seguimientos=0,
        datos={"tipo_inmueble": "Casa", "zona": "Las Heras", "superficie_m2": "100",
               "intencion": "Refacción"},
        cierre_dias=4,
        msgs=[
            ("LEAD", "Hola, precio aproximado de aislar un techo de 100 m2 en Las Heras"),
            ("BOT", GREETING),
            ("BOT", ASK_DATOS),
            ("LEAD", "casa, Las Heras, 100 m2, refacción"),
            ("BOT", CAPTURADO),
            ("LEAD", "lo voy a ver más adelante, gracias"),
        ],
    ),
    # --- Borde ---
    dict(
        n=23, nombre="Ignacio Ferreyra", estado="ACTIVO", listo=False, seguimientos=0,
        datos={}, cierre_dias=None,
        msgs=[("LEAD", "hola")],
    ),
    dict(
        n=24, nombre="Paula Ríos", estado="HUMANO", listo=False, seguimientos=0,
        datos={"tipo_inmueble": "Casa", "zona": "Villa Nueva"}, cierre_dias=None,
        msgs=[
            ("LEAD", "Hola, tengo una casa antigua con techo de tejas y machimbre, se puede aislar sin sacar todo?"),
            ("BOT", GREETING),
            ("LEAD", "no quiero levantar las tejas si se puede evitar"),
            ("BOT", "En algunos casos se aísla desde adentro, con cielorraso y lana, sin tocar las tejas. Depende del estado del machimbre."),
            ("LEAD", "y eso lo pueden ver en una visita?"),
            ("HUMANO", "Hola Paula, soy Diego. Sí, hacemos una visita sin cargo para medir y ver el techo por dentro. ¿En qué zona estás?"),
            ("LEAD", "Villa Nueva, Guaymallén"),
            ("HUMANO", "Perfecto. ¿Te queda bien el martes a la mañana?"),
            ("LEAD", "el martes lo confirmo, gracias"),
        ],
    ),
]


def _fila_lead(i: int, tel: str, spec: dict, fecha_ingreso: datetime,
               ultimo: datetime, fecha_cierre: datetime | None) -> list:
    return [
        f"L{i:02d}",
        f"Lead {i:02d}",
        tel,
        _a_utc_iso(fecha_ingreso),
        spec["estado"],
        _a_utc_iso(ultimo),
        spec["seguimientos"],
        str(spec["listo"]).lower(),
        _a_utc_iso(fecha_cierre),
        json.dumps(spec["datos"], ensure_ascii=False, sort_keys=True),
    ]


def run(out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    fechas = _fechas_ingreso(len(LEADS))
    tels = _tels_anon(len(LEADS))

    filas_leads: list[list] = []
    filas_msgs: list[list] = []

    for i, (spec, fecha_ingreso) in enumerate(zip(LEADS, fechas), 1):
        tel = tels[i - 1]

        t = fecha_ingreso
        prev: str | None = None
        tiempos: list[datetime] = []
        for origen, texto in spec["msgs"]:
            t = t + _gap(prev, origen)
            real_origen = "BOT" if origen == "SEG" else origen
            if texto is None:
                texto = _seguimiento(spec["nombre"])
            msg = _mask_nombres(_mask_texto(texto), spec["nombre"])
            filas_msgs.append([f"L{i:02d}", tel, _a_utc_iso(t), real_origen, msg])
            tiempos.append(t)
            prev = real_origen

        ultimo = max(tiempos)
        fecha_cierre = None
        if spec["cierre_dias"] is not None:
            margen = _RNG.randint(20 * 60, spec["cierre_dias"] * 24 * 3600)
            fecha_cierre = ultimo + timedelta(seconds=margen, microseconds=_RNG.randint(0, 999_999))

        filas_leads.append(_fila_lead(i, tel, spec, fecha_ingreso, ultimo, fecha_cierre))

    leads_path = out_dir / "leads.csv"
    with leads_path.open("w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh, lineterminator="\n")
        w.writerow([
            "lead_ref", "nombre_anon", "whatsapp_anon", "fecha_ingreso", "estado",
            "ultimo_mensaje", "seguimientos", "listo_para_cerrar", "fecha_cierre",
            "datos_json",
        ])
        w.writerows(filas_leads)

    msgs_path = out_dir / "mensajes.csv"
    with msgs_path.open("w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh, lineterminator="\n")
        w.writerow(["lead_ref", "whatsapp_anon", "fecha_hora", "origen", "mensaje"])
        w.writerows(filas_msgs)

    try:
        lp, mp = leads_path.relative_to(REPO_ROOT), msgs_path.relative_to(REPO_ROOT)
    except ValueError:
        lp, mp = leads_path, msgs_path
    print(f"{lp}: {len(filas_leads)} filas")
    print(f"{mp}: {len(filas_msgs)} filas")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out-dir", type=Path, default=REPO_ROOT / "evidencia" / "aislaciones",
        help="Directorio de salida (default: evidencia/aislaciones/)",
    )
    args = parser.parse_args()
    run(args.out_dir)
