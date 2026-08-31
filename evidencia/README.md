# Evidencia

Material tabular y conversacional para la tesis, con nombre, teléfono y documento
**anonimizados**. El contenido de los mensajes se conserva sin editar.

## Archivos

| Archivo | Qué es | Origen |
|---|---|---|
| `tabla6-escenario1.md` | Cierre con datos capturados (Tabla 6 / Fig. 6b) | tabla `mensajes`, caso real RHbarber |
| `tabla6-escenario2.md` | Seguimiento sin datos (Tabla 6 / Fig. 8) | tabla `mensajes`, caso real RHbarber |
| `leads.csv` | Export completo de la tabla `leads` | `backend/scripts/export_evidencia.py` |
| `mensajes.csv` | Export completo de la tabla `mensajes` | `backend/scripts/export_evidencia.py` |

## Dataset de los CSV

Combina **2 leads reales** (los de las tablas `.md` de arriba) y **24 leads de
demostración** generados por `backend/scripts/seed_demo.py` — barbería RHbarber,
conversaciones y estados variados, `fecha_ingreso` repartida entre junio y agosto
de 2026. Los leads demo se distinguen por el `lead_id` con prefijo `DEMO-`
(los números de WhatsApp, fechas, horarios y DNIs se generan con un PRNG de
semilla fija, así que re-sembrar produce exactamente el mismo dataset).

## Anonimización (aplicada por `export_evidencia.py`)

- `nombre` → etiqueta `Lead NN` (por orden de `id`); el `lead_id` real no se emite,
  se reemplaza por `LNN`.
- `whatsapp` / `lead_whatsapp` → `549261*****NN`, donde `NN` es el índice del lead
  (no queda ningún dígito del número real). Se calcula igual en los dos CSV, así
  el cruce `leads.csv` ↔ `mensajes.csv` por `whatsapp_anon` (o por `lead_ref`)
  sigue siendo válido y único.
- `documento_lead` (en `datos_json`) y cualquier DNI suelto de 7–8 dígitos dentro
  del texto de un mensaje → todos los dígitos en `*` salvo los 2 últimos.

`mensajes.csv` va agrupado por lead (orden `L01`…`L26`) y cronológico dentro de
cada uno.

## Regenerar

```bash
# 1. cargar el dataset de demostración (idempotente, no toca los leads reales)
python backend/scripts/seed_demo.py

# 2. exportar los CSV anonimizados a esta carpeta
python backend/scripts/export_evidencia.py
```

Ambos scripts leen `DATABASE_URL` (default: la base local de `docker-compose`,
`postgres_backend` en `localhost:5433`).

## Notas

- Las fechas están en **UTC** tal como las guarda la base. Hora local de Mendoza
  = UTC − 3.
- La exportación es determinística: correrla de nuevo sin cambios en la base
  produce archivos idénticos.
