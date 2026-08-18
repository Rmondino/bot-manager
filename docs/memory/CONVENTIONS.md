# CONVENTIONS.md — Patrones y convenciones establecidas

## General

- Idioma del código técnico: inglés (nombres de hooks, queries, variables técnicas)
- Idioma del dominio de negocio: español (nombres de modelos, campos, rutas)
- Fechas en formato `YYYY-MM-DD`
- Código simple y explícito, sin abstracciones innecesarias

## Backend (FastAPI + SQLModel)

### Estructura feature-based
```
backend/app/{dominio}/
├── model.py      SQLModel con table=True (entidad de BD)
├── schema.py     Pydantic models para request/response
└── router.py     APIRouter con los endpoints del dominio
```

### Reglas
- `backend/app/database.py` — engine y get_session()
- `backend/app/main.py` — instancia FastAPI, CORS, include_routers con prefijo `/api/v1/{dominio}`
- Sesión BD: inyectar con `Depends(get_session)` en los routers
- Variables de entorno: siempre con `os.getenv("VAR")` sin fallbacks hardcodeados
- Migraciones: Alembic. **No usar `create_all`** — crea tablas nuevas pero nunca altera las existentes, así que un cambio de esquema se pierde en silencio.
- Los nombres de los dominios van en español (leads, clientes, obras, presupuestos)

### Migraciones

El contenedor corre `alembic upgrade head` antes de levantar uvicorn, así que
al arrancar la base queda al día sola. Para crear una migración:

```bash
docker compose exec backend alembic revision --autogenerate -m "descripcion"
docker compose exec backend alembic upgrade head
```

Dos cosas que ya nos mordieron:

- **Siempre revisar el archivo generado antes de aplicarlo.** El autogenerate
  compara los modelos contra la base *viva*: si la tabla ya existe produce un
  diff, no un `create_table`. Para generar un baseline real hay que apuntar a
  una base vacía.
- **Probar el camino desde cero**, no solo el incremental: `alembic upgrade head`
  sobre una base nueva. Un error que solo aparece ahí (por ejemplo un import
  faltante en la migración) es invisible si la base existente se estampó con
  `alembic stamp`.

### Ejemplo de ruta
```python
router = APIRouter(prefix="/api/v1/leads", tags=["Leads"])
```

## Frontend (React + Vite + TypeScript)

### Estructura feature-based
```
frontend/src/{feature}/
├── hooks/         Hooks con TanStack Query (useLeads, useCreateLead, etc.)
├── components/    Componentes de UI de la feature
└── pages/         Páginas/rutas que combinan hooks + components
```

### Reglas
- Componentes: PascalCase, archivos `.tsx`
- Hooks: camelCase con prefijo `use`, archivos `.ts`
- Queries de TanStack Query: hooks con nombre `use{Recurso}` (useLeads, useLead)
- Mutations: hooks con nombre `use{Accion}{Recurso}` (useCreateLead, useUpdateLead)
- Axios instance: `frontend/src/lib/axios.ts` con baseURL configurada
- NO usar localStorage ni sessionStorage
- NO usar `any` salvo justificación explícita
- Variables de entorno: `import.meta.env.VITE_API_URL`

## Estilos (Tailwind CSS v4)

- Archivo base: `frontend/src/index.css` con `@import "tailwindcss"`
- Sin archivos .css adicionales — usar clases utilitarias en JSX
- Paleta de colores personalizada (si aplica) en `@theme` dentro de index.css

## Docker

- Imágenes base: `python:3.12-slim` (backend), `node:20-slim` (frontend)
- Red interna: `bot_network` (bridge)
- Volúmenes nombrados para persistencia de datos de Postgres y n8n
- Variables sensibles: siempre desde `.env` con `${VAR}` en docker-compose.yml

## Git

- Rama principal: `main`
- Commits en español o inglés, mensajes descriptivos
- NO commitear: `.env`, `__pycache__`, `node_modules`, `dist`
