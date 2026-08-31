# Evidencia

Material tabular y conversacional para la tesis, con nombre, teléfono y documento
**anonimizados**. El contenido de los mensajes se conserva sin editar.

```
evidencia/
├── barberia/       negocio de prueba RHbarber (barbería)
│   ├── tabla6-escenario1.md   Cierre con datos capturados (Tabla 6 / Fig. 6b)
│   ├── tabla6-escenario2.md   Seguimiento sin datos (Tabla 6 / Fig. 8)
│   ├── leads.csv              export de la tabla `leads`
│   └── mensajes.csv           export de la tabla `mensajes`
└── aislaciones/    negocio Aislaciones RH (aislación térmica/acústica)
    ├── leads.csv
    └── mensajes.csv
```

## barberia/

- `tabla6-escenario1.md` y `tabla6-escenario2.md`: dos **casos reales** exportados
  de la tabla `mensajes` (transcripción con anonimización manual).
- `leads.csv` / `mensajes.csv`: export completo de la base, generado por
  `backend/scripts/export_evidencia.py`. Combina esos **2 leads reales** con
  **24 leads de demostración** cargados por `backend/scripts/seed_demo.py`
  (conversaciones y estados variados, `fecha_ingreso` entre junio y agosto 2026,
  `lead_id` con prefijo `DEMO-`).

  ```bash
  python backend/scripts/seed_demo.py        # carga los 24 demo (idempotente)
  python backend/scripts/export_evidencia.py # -> evidencia/barberia/*.csv
  ```

## aislaciones/

- `leads.csv` / `mensajes.csv`: **24 leads de demostración** de consultas de
  aislación térmica/acústica en Mendoza, `fecha_ingreso` en las 4 semanas previas
  al 30/08/2026 (03/08 → 29/08, días hábiles). Campos de calificación:
  `tipo_inmueble`, `zona`, `superficie_m2`, `intencion`, `notas_encargado`.
- La base local está configurada para el otro negocio, así que este dataset **no
  se carga en la base**: `backend/scripts/gen_evidencia_aislaciones.py` lo arma
  en memoria y escribe los CSV directo.

  ```bash
  python backend/scripts/gen_evidencia_aislaciones.py  # -> evidencia/aislaciones/*.csv
  ```

## Anonimización (misma para los dos negocios)

- `nombre` → etiqueta `Lead NN` (por orden); el `lead_id` real no se emite, se
  reemplaza por `LNN`.
- `whatsapp` / `lead_whatsapp` → `549261*****NN`, donde `NN` es el índice del lead
  (no queda ningún dígito del número real). Se calcula igual en los dos CSV, así
  el cruce `leads.csv` ↔ `mensajes.csv` por `whatsapp_anon` (o por `lead_ref`)
  sigue siendo válido y único.
- `documento_lead` (barbería) y cualquier corrida de 7+ dígitos dentro del texto
  de un mensaje → dígitos en `*` salvo los 2 últimos.

`mensajes.csv` va agrupado por lead (`L01`…`LNN`) y cronológico dentro de cada uno.

## Notas

- Fechas en **UTC** tal como las guarda la base. Hora local de Mendoza = UTC − 3.
- Los "números aleatorios" (teléfonos, horarios, latencias entre mensajes, DNIs)
  salen de un PRNG con semilla fija: cada script es reproducible y determinístico
  (re-correrlo sin cambios no modifica los archivos).
