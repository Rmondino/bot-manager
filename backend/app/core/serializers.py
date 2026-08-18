"""Serialización de fechas hacia el frontend.

En la base los timestamps se guardan con `datetime.utcnow()`, o sea naive pero
en UTC. Si se serializan tal cual, el `new Date(...)` del navegador los
interpreta como hora local y el chat muestra las horas corridas. Acá se les
marca el UTC explícito.
"""

from datetime import datetime, timezone
from typing import Optional


def a_utc_iso(dt: Optional[datetime]) -> Optional[str]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat().replace("+00:00", "Z")
