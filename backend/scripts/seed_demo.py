"""Seed de datos de demostración para mostrar el funcionamiento del bot.

Inserta 24 leads de barbería (negocio de prueba RHbarber) con conversaciones,
estados y fechas variadas repartidas entre junio y agosto de 2026.

Uso (con el stack de docker compose levantado):

    python backend/scripts/seed_demo.py

Es idempotente: cada lead demo usa `lead_id` con prefijo `DEMO-` y un WhatsApp
propio. Si el lead ya existe se saltea. El script nunca borra ni modifica leads
reales (los que no tienen ese prefijo).

Realismo del tiempo. Todos los instantes se derivan de un PRNG con semilla fija
(`_SEED`), así que el dataset es reproducible pero no "redondo":
  - `fecha_ingreso`: día hábil (mar-sáb), hora comercial, con segundos y
    microsegundos aleatorios.
  - respuesta del BOT a un mensaje del lead: 5-45 ms después (el bot registra el
    entrante y su respuesta casi juntos, igual que en los datos reales).
  - mensaje siguiente del lead: decenas de segundos a unos minutos, y de vez en
    cuando una pausa larga.
  - intervención de un HUMANO: minutos a media hora.
  - seguimiento automático: entre 30 min y 3 h después del último mensaje.
"""

from __future__ import annotations

import os
import random
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

# Valor local de docker-compose; se puede pisar con la variable de entorno.
os.environ.setdefault(
    "DATABASE_URL", "postgresql://botadmin:backend_pass@localhost:5433/bot_manager"
)

from sqlmodel import Session, select  # noqa: E402

from app.database import engine  # noqa: E402
from app.leads.model import Lead  # noqa: E402
from app.mensajes.model import Mensaje  # noqa: E402

# Semilla fija: los "números aleatorios" (teléfonos, DNIs, horarios, latencias
# entre mensajes) salen siempre iguales, de modo que re-sembrar produce el mismo
# dataset y la exportación a CSV es estable.
_SEED = 20260831
_RNG = random.Random(_SEED)

# Mendoza es UTC-3; en la base los timestamps se guardan naive en UTC.
_UTC_OFFSET = timedelta(hours=3)

# Reservados: los dos leads reales que respaldan las figuras de la tesis.
_TELEFONOS_USADOS = {"5492615586278", "5492617723283"}


GREETING = (
    "Hola, ¿cómo estás? ¿En qué te puedo ayudar hoy con tu consulta sobre "
    "nuestra barbería?"
)
PRICE = (
    "El corte de pelo está a $14.000. Si querés corte de pelo y barba, el precio "
    "es $17.000. ¿Te gustaría reservar un turno o necesitás más info?"
)
ASK_DATOS = (
    "Perfecto, para avanzarte con la reserva necesito tu número de DNI y si "
    "querés solo el corte de pelo o el combo de corte + barba. ¿Me pasás esos "
    "datos así te agendo?"
)
HORARIOS = (
    "Atendemos de martes a sábado de 10 a 20 h, sin turno para consultas y con "
    "turno para cortes."
)


def _capturado(servicio: str) -> str:
    return (
        f"Ya tomé tus datos para el {servicio.lower()}. Te vamos a contactar para "
        "coordinar tu turno y dejar todo listo."
    )


def _seguimiento(nombre: str) -> str:
    return (
        f"Hola {nombre.split()[0]}, te escribimos desde RHbarber. Quedamos a "
        "disposición para cualquier consulta 🙌"
    )


# --- Generadores deterministas (consumen _RNG en orden fijo) --------------------

def _nuevo_telefono() -> str:
    while True:
        tel = "549261" + "".join(str(_RNG.randint(0, 9)) for _ in range(7))
        if tel not in _TELEFONOS_USADOS:
            _TELEFONOS_USADOS.add(tel)
            return tel


def _nuevo_dni() -> str:
    return str(_RNG.randint(38_000_000, 45_999_999))


def _fechas_ingreso(cantidad: int) -> list[datetime]:
    """`cantidad` instantes crecientes, en días hábiles (mar-sáb) y hora
    comercial, desde el 2026-06-02, con separación irregular."""
    salida: list[datetime] = []
    d = date(2026, 6, 2)
    # Tarde/noche pesa más que la mañana.
    horas = list(range(10, 20))
    pesos = [2, 2, 3, 3, 4, 4, 4, 4, 3, 2]
    while len(salida) < cantidad:
        if d.weekday() in (1, 2, 3, 4, 5):  # lunes=0 ... domingo=6
            h = _RNG.choices(horas, weights=pesos)[0]
            local = datetime(
                d.year, d.month, d.day, h,
                _RNG.randint(0, 59), _RNG.randint(0, 59), _RNG.randint(0, 999_999),
            )
            salida.append(local + _UTC_OFFSET)
        d += timedelta(days=_RNG.randint(1, 4))
    return salida


def _gap(prev_origen: str | None, origen: str) -> timedelta:
    """Tiempo entre el mensaje anterior y este, según quién habla."""
    us = _RNG.randint(0, 999_999)
    if prev_origen is None:
        return timedelta(seconds=_RNG.randint(2, 6), microseconds=us)  # ingreso -> 1er msg
    if origen == "SEG":  # seguimiento automático
        return timedelta(seconds=_RNG.randint(30 * 60, 3 * 3600), microseconds=us)
    if origen == "BOT":
        if prev_origen == "BOT":  # respuesta del bot en varias partes
            return timedelta(milliseconds=_RNG.randint(3, 30), microseconds=_RNG.randint(0, 999))
        return timedelta(milliseconds=_RNG.randint(5, 45), microseconds=_RNG.randint(0, 999))
    if origen == "HUMANO":
        return timedelta(seconds=_RNG.randint(2 * 60, 30 * 60), microseconds=us)
    # LEAD
    if _RNG.random() < 0.15:  # pausa larga: se fue y volvió
        return timedelta(seconds=_RNG.randint(8 * 60, 45 * 60), microseconds=us)
    return timedelta(seconds=_RNG.randint(12, 240), microseconds=us)


# --- Dataset ------------------------------------------------------------------
# Cada lead: n, nombre, estado, listo, seguimientos, datos, cierre_dias (o None)
# y msgs=[(origen, texto)]. origen "SEG" = seguimiento automático (se guarda como
# "BOT"). El marcador "{dni}" en datos y en los textos se reemplaza por un DNI
# generado para ese lead.
LEADS: list[dict] = [
    # --- Consulta de precio, sin calificar (ACTIVO) ---
    dict(
        n=1, nombre="Martín Suárez", estado="ACTIVO", listo=False, seguimientos=0,
        datos={}, cierre_dias=None,
        msgs=[
            ("LEAD", "Hola, buenas"),
            ("BOT", GREETING),
            ("LEAD", "Qué precio tiene el corte?"),
            ("BOT", PRICE),
        ],
    ),
    dict(
        n=2, nombre="Carla Domínguez", estado="ACTIVO", listo=False, seguimientos=0,
        datos={"servicio_lead": "Corte de pelo"}, cierre_dias=None,
        msgs=[
            ("LEAD", "hola"),
            ("BOT", GREETING),
            ("LEAD", "cuanto el corte de pelo solo"),
            ("BOT", PRICE),
            ("LEAD", "ok lo pienso y te aviso, gracias"),
        ],
    ),
    dict(
        n=3, nombre="Nicolás Ferreyra", estado="ACTIVO", listo=False, seguimientos=0,
        datos={}, cierre_dias=None,
        msgs=[
            ("LEAD", "Buen día, precios y horarios?"),
            ("BOT", GREETING),
            ("BOT", PRICE),
            ("LEAD", "y de qué hora a qué hora abren?"),
            ("BOT", HORARIOS),
        ],
    ),
    dict(
        n=4, nombre="Sofía Benítez", estado="ACTIVO", listo=False, seguimientos=0,
        datos={}, cierre_dias=None,
        msgs=[
            ("LEAD", "hacen fade / degradé?"),
            ("BOT", GREETING),
            ("LEAD", "eso, corte con máquina degradé"),
            ("BOT", "Sí, hacemos degradé. Entra dentro del corte de pelo, $14.000."),
        ],
    ),
    dict(
        n=5, nombre="Julián Rearte", estado="ACTIVO", listo=False, seguimientos=0,
        datos={"servicio_lead": "Corte + barba"}, cierre_dias=None,
        msgs=[
            ("LEAD", "corte y barba cuanto queda?"),
            ("BOT", GREETING),
            ("BOT", PRICE),
            ("LEAD", "buenísimo, después coordino"),
        ],
    ),
    dict(
        n=6, nombre="Agustina Molina", estado="ACTIVO", listo=False, seguimientos=0,
        datos={}, cierre_dias=None,
        msgs=[
            ("LEAD", "dónde quedan?"),
            ("BOT", GREETING),
            ("LEAD", "sí, la dirección"),
            ("BOT", "Estamos en Godoy Cruz, cerca de la plaza. Te paso la ubicación cuando reserves el turno."),
        ],
    ),
    dict(
        n=7, nombre="Bruno Cabrera", estado="ACTIVO", listo=False, seguimientos=0,
        datos={}, cierre_dias=None,
        msgs=[
            ("LEAD", "precio corte?"),
            ("BOT", GREETING),
            ("BOT", PRICE),
            ("LEAD", "gracias!"),
        ],
    ),
    dict(
        n=8, nombre="Rocío Contreras", estado="ACTIVO", listo=False, seguimientos=0,
        datos={}, cierre_dias=None,
        msgs=[
            ("LEAD", "Hola quería saber cuánto está el corte"),
            ("BOT", GREETING),
            ("BOT", PRICE),
        ],
    ),
    # --- Calificado y listo para vender (datos completos, listo_para_cerrar) ---
    dict(
        n=9, nombre="Lucas Pereyra", estado="HUMANO", listo=True, seguimientos=0,
        datos={"servicio_lead": "Corte de pelo", "documento_lead": "{dni}"},
        cierre_dias=None,
        msgs=[
            ("LEAD", "Hola"),
            ("BOT", GREETING),
            ("LEAD", "Cuál es el precio del corte ?"),
            ("BOT", PRICE),
            ("LEAD", "Quiero reservar turno"),
            ("BOT", ASK_DATOS),
            ("LEAD", "Necesito corte de pelo, {dni}"),
            ("BOT", _capturado("Corte de pelo")),
        ],
    ),
    dict(
        n=10, nombre="Valentina Ríos", estado="ACTIVO", listo=True, seguimientos=0,
        datos={"servicio_lead": "Corte + barba", "documento_lead": "{dni}"},
        cierre_dias=None,
        msgs=[
            ("LEAD", "buenas, quiero turno para corte y barba"),
            ("BOT", GREETING),
            ("BOT", ASK_DATOS),
            ("LEAD", "corte + barba. dni {dni}"),
            ("BOT", _capturado("Corte + barba")),
        ],
    ),
    dict(
        n=11, nombre="Matías Ledesma", estado="HUMANO", listo=True, seguimientos=0,
        datos={"servicio_lead": "Corte de pelo", "documento_lead": "{dni}"},
        cierre_dias=None,
        msgs=[
            ("LEAD", "hola, precio del corte?"),
            ("BOT", GREETING),
            ("BOT", PRICE),
            ("LEAD", "listo, reservo"),
            ("BOT", ASK_DATOS),
            ("LEAD", "solo corte, {dni}"),
            ("BOT", _capturado("Corte de pelo")),
        ],
    ),
    dict(
        n=12, nombre="Camila Aguirre", estado="ACTIVO", listo=True, seguimientos=0,
        datos={"servicio_lead": "Corte + barba", "documento_lead": "{dni}"},
        cierre_dias=None,
        msgs=[
            ("LEAD", "Hola! quería sacar un turno"),
            ("BOT", GREETING),
            ("BOT", ASK_DATOS),
            ("LEAD", "el combo corte + barba"),
            ("LEAD", "{dni}"),
            ("BOT", _capturado("Corte + barba")),
        ],
    ),
    dict(
        n=13, nombre="Tomás Villegas", estado="HUMANO", listo=True, seguimientos=0,
        datos={"servicio_lead": "Corte de pelo", "documento_lead": "{dni}"},
        cierre_dias=None,
        msgs=[
            ("LEAD", "Buenas, quiero reservar"),
            ("BOT", GREETING),
            ("BOT", ASK_DATOS),
            ("LEAD", "Corte de pelo. DNI {dni}"),
            ("BOT", _capturado("Corte de pelo")),
            ("HUMANO", "Hola Tomás, te confirmo el turno para el sábado 10 h. ¿Te queda bien?"),
        ],
    ),
    dict(
        n=14, nombre="Florencia Ibáñez", estado="ACTIVO", listo=True, seguimientos=0,
        datos={"servicio_lead": "Corte + barba", "documento_lead": "{dni}"},
        cierre_dias=None,
        msgs=[
            ("LEAD", "hola quiero turno corte y barba"),
            ("BOT", GREETING),
            ("BOT", ASK_DATOS),
            ("LEAD", "corte + barba, {dni}"),
            ("BOT", _capturado("Corte + barba")),
        ],
    ),
    # --- Sin respuesta -> seguimiento automático (HUMANO, seguimientos=1) ---
    dict(
        n=15, nombre="Emiliano Sosa", estado="HUMANO", listo=False, seguimientos=1,
        datos={}, cierre_dias=None,
        msgs=[
            ("LEAD", "hola"),
            ("BOT", GREETING),
            ("SEG", None),
        ],
    ),
    dict(
        n=16, nombre="Antonella Gómez", estado="HUMANO", listo=False, seguimientos=1,
        datos={}, cierre_dias=None,
        msgs=[
            ("LEAD", "precio corte de pelo?"),
            ("BOT", GREETING),
            ("BOT", PRICE),
            ("SEG", None),
        ],
    ),
    dict(
        n=17, nombre="Federico Luna", estado="HUMANO", listo=False, seguimientos=1,
        datos={}, cierre_dias=None,
        msgs=[
            ("LEAD", "hola queria consultar unas cosas"),
            ("BOT", GREETING),
            ("SEG", None),
        ],
    ),
    dict(
        n=18, nombre="Micaela Ortiz", estado="HUMANO", listo=False, seguimientos=1,
        datos={}, cierre_dias=None,
        msgs=[
            ("LEAD", "buenas"),
            ("BOT", GREETING),
            ("SEG", None),
        ],
    ),
    # --- Atendido / cerrado (CERRADO, fecha_cierre) ---
    dict(
        n=19, nombre="Gonzalo Peralta", estado="CERRADO", listo=True, seguimientos=0,
        datos={"servicio_lead": "Corte de pelo", "documento_lead": "{dni}"},
        cierre_dias=2,
        msgs=[
            ("LEAD", "Hola, turno para corte"),
            ("BOT", GREETING),
            ("BOT", ASK_DATOS),
            ("LEAD", "corte de pelo, {dni}"),
            ("BOT", _capturado("Corte de pelo")),
            ("HUMANO", "Listo Gonzalo, te esperamos el jueves 11 h."),
        ],
    ),
    dict(
        n=20, nombre="Belén Navarro", estado="CERRADO", listo=False, seguimientos=0,
        datos={"servicio_lead": "Corte + barba"}, cierre_dias=1,
        msgs=[
            ("LEAD", "corte y barba, tienen lugar mañana?"),
            ("BOT", GREETING),
            ("BOT", PRICE),
            ("HUMANO", "Hola Belén, mañana tenemos a las 17 h. ¿Te sirve?"),
            ("LEAD", "sí perfecto, ahí voy"),
        ],
    ),
    dict(
        n=21, nombre="Ramiro Escudero", estado="CERRADO", listo=True, seguimientos=1,
        datos={"servicio_lead": "Corte de pelo", "documento_lead": "{dni}"},
        cierre_dias=4,
        msgs=[
            ("LEAD", "hola, quiero sacar turno"),
            ("BOT", GREETING),
            ("BOT", ASK_DATOS),
            ("LEAD", "corte de pelo. {dni}"),
            ("BOT", _capturado("Corte de pelo")),
            ("SEG", None),
            ("LEAD", "sí dale, el viernes puedo"),
        ],
    ),
    dict(
        n=22, nombre="Daniela Quiroga", estado="CERRADO", listo=False, seguimientos=0,
        datos={"servicio_lead": "Corte de pelo"}, cierre_dias=3,
        msgs=[
            ("LEAD", "Buen día, precio del corte?"),
            ("BOT", GREETING),
            ("BOT", PRICE),
            ("LEAD", "ok gracias, después paso"),
        ],
    ),
    # --- Borde ---
    dict(
        n=23, nombre="Ignacio Bravo", estado="ACTIVO", listo=False, seguimientos=0,
        datos={}, cierre_dias=None,
        msgs=[
            ("LEAD", "hola"),
        ],
    ),
    dict(
        n=24, nombre="Paula Miranda", estado="HUMANO", listo=False, seguimientos=0,
        datos={}, cierre_dias=None,
        msgs=[
            ("LEAD", "Hola, tengo el pelo muy largo y rulos, hacen ese tipo de corte?"),
            ("BOT", GREETING),
            ("LEAD", "es corte de tijera, con forma, no maquina"),
            ("BOT", "Sí, hacemos corte de tijera con forma. Es corte de pelo, $14.000."),
            ("LEAD", "y me lo puede hacer una persona con experiencia en rulos?"),
            ("HUMANO", "Hola Paula, soy Diego. Sí, hago corte en rizado. ¿Querés que te reserve?"),
            ("LEAD", "sí, la semana que viene"),
            ("HUMANO", "Genial. Pasame tu DNI y vemos el día."),
            ("LEAD", "mañana te confirmo bien el día"),
        ],
    ),
]


def _lead_id(n: int) -> str:
    return f"DEMO-{n:03d}"


def _construir(spec: dict, fecha_ingreso: datetime, whatsapp: str) -> tuple[list[Mensaje], str | None]:
    dni = _nuevo_dni() if _usa_dni(spec) else None
    msgs: list[Mensaje] = []
    t = fecha_ingreso
    prev: str | None = None
    for origen, texto in spec["msgs"]:
        t = t + _gap(prev, origen)
        real_origen = "BOT" if origen == "SEG" else origen
        if texto is None:  # seguimiento automático
            texto = _seguimiento(spec["nombre"])
        elif dni is not None:
            texto = texto.replace("{dni}", dni)
        msgs.append(
            Mensaje(lead_whatsapp=whatsapp, fecha_hora=t, origen=real_origen, mensaje=texto)
        )
        prev = real_origen
    return msgs, dni


def _usa_dni(spec: dict) -> bool:
    if spec["datos"].get("documento_lead") == "{dni}":
        return True
    return any("{dni}" in (txt or "") for _, txt in spec["msgs"])


def run_seed() -> None:
    insertados = 0
    existentes = 0
    fechas = _fechas_ingreso(len(LEADS))

    with Session(engine) as session:
        for spec, fecha_ingreso in zip(LEADS, fechas):
            lead_id = _lead_id(spec["n"])
            if session.exec(select(Lead).where(Lead.lead_id == lead_id)).first():
                existentes += 1
                continue

            whatsapp = _nuevo_telefono()
            mensajes, dni = _construir(spec, fecha_ingreso, whatsapp)
            ultimo = max(m.fecha_hora for m in mensajes)

            datos = dict(spec["datos"])
            if datos.get("documento_lead") == "{dni}":
                datos["documento_lead"] = dni

            fecha_cierre = None
            if spec["cierre_dias"] is not None:
                margen = _RNG.randint(20 * 60, spec["cierre_dias"] * 24 * 3600)
                fecha_cierre = ultimo + timedelta(seconds=margen, microseconds=_RNG.randint(0, 999_999))

            session.add(
                Lead(
                    lead_id=lead_id,
                    nombre=spec["nombre"],
                    whatsapp=whatsapp,
                    fecha_ingreso=fecha_ingreso,
                    estado=spec["estado"],
                    ultimo_mensaje=ultimo,
                    seguimientos=spec["seguimientos"],
                    listo_para_cerrar=spec["listo"],
                    fecha_cierre=fecha_cierre,
                    datos=datos,
                    created_at=fecha_ingreso + timedelta(microseconds=_RNG.randint(20, 90)),
                    updated_at=ultimo + timedelta(microseconds=_RNG.randint(10, 60)),
                )
            )
            session.add_all(mensajes)
            insertados += 1

        session.commit()
        total = session.exec(select(Lead)).all()

    print(f"Leads demo insertados : {insertados}")
    print(f"Ya existentes (saltados): {existentes}")
    print(f"Total de leads en la tabla: {len(total)}")


if __name__ == "__main__":
    run_seed()
