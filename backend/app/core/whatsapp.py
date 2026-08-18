"""Normalización de números de WhatsApp.

Único lugar donde se decide qué es un número válido. Antes cada router lo
resolvía a su manera: algunos hacían `.replace('@s.whatsapp.net','')` a mano,
otros no validaban nada, y por ahí entraron filas con el número sin normalizar
y hasta con el texto de un mensaje en la columna del teléfono.
"""

from fastapi import HTTPException

SUFIJO_WHATSAPP = "@s.whatsapp.net"


def normalizar_whatsapp(whatsapp: str) -> str:
    """Devuelve el número pelado, o 400 si no parece un teléfono.

    Evolution API entrega el chat_id como `5492615135024@s.whatsapp.net`;
    en la base guardamos solo los dígitos.
    """
    numero = (whatsapp or "").strip().replace(SUFIJO_WHATSAPP, "")
    if not numero.isdigit() or not (8 <= len(numero) <= 15):
        raise HTTPException(status_code=400, detail=f"whatsapp inválido: {whatsapp!r}")
    return numero
