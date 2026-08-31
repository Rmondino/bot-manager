# Bot Manager

Panel de supervisión y API de gestión de leads para el bot de WhatsApp de
**Aislaciones RH** (Mendoza, Argentina).

Un agente de WhatsApp (n8n + AI Agent) atiende y califica leads entrantes por
Evolution API. Este proyecto es el backend REST que registra y gestiona esos
leads, más un panel web interno para que el equipo supervise las conversaciones,
edite la configuración del bot y administre las FAQs.

## Stack

| Capa | Tecnología | Puerto |
|------|-----------|--------|
| Frontend | React 19 + Vite + TypeScript + TanStack Query v5 + React Router + Tailwind CSS v4 | 5173 |
| Backend | FastAPI + SQLModel + Alembic | 8000 |
| Automatización | n8n | 5678 |
| DB backend | PostgreSQL 16 | 5433 (host) |
| DB n8n | PostgreSQL 16 | interno |
| WhatsApp | Evolution API | 8080 |

## Estructura

```
bot-manager/
├── backend/
│   ├── app/
│   │   ├── main.py            FastAPI: CORS + routers
│   │   ├── database.py        engine SQLModel + get_session()
│   │   ├── core/              settings, serializers, helpers de WhatsApp
│   │   └── {dominio}/         model.py · schema.py · router.py
│   │                          (leads, mensajes, chats, config,
│   │                           company_info, campos_lead, whatsapp, n8n)
│   ├── alembic/               migraciones (fuente de verdad del esquema)
│   ├── scripts/               dump_openapi.py · seed_demo.py · export_evidencia.py · gen_evidencia_aislaciones.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── App.tsx            rutas
│       ├── components/        UI compartida (Layout, StatusBadge, Kpi, ...)
│       └── features/{feature}/  hooks/ · components/ · pages/
├── n8n/
│   ├── bot-manager.json       export del workflow vivo ("My workflow 3")
│   └── README.md              notas de importación / re-exportación
├── docs/
│   ├── api/openapi.json       especificación OpenAPI del backend (generada)
│   ├── design/                brief e imágenes de referencia del rediseño
│   └── memory/                notas de arquitectura / decisiones
├── evidencia/                 CSV/transcripciones anonimizados para la tesis
│   ├── barberia/              RHbarber: 2 casos reales + 24 demo
│   └── aislaciones/           Aislaciones RH: 24 demo
├── docker-compose.yml         orquesta todos los servicios
└── .env.example               plantilla de variables de entorno
```

## Puesta en marcha (Docker Compose)

```bash
cp .env.example .env      # completá los valores
docker compose up -d
```

Servicios: panel en `http://localhost:5173`, API en `http://localhost:8000`
(docs en `/docs`), n8n en `http://localhost:5678`, Evolution API en
`http://localhost:8080`.

El contenedor `backend` corre `alembic upgrade head` al arrancar; el esquema lo
maneja Alembic, no `create_all`.

## Desarrollo local (sin Docker)

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export DATABASE_URL=postgresql://botadmin:...@localhost:5433/bot_manager
alembic upgrade head
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm ci
npm run dev        # build de producción: npm run build
```

## Variables de entorno

Todas las claves están en [`.env.example`](.env.example). `.env` está
gitignoreado y no se sube nunca. `docker-compose.yml` sólo referencia variables
(`${...}`), sin secretos hardcodeados.

| Variable | Uso |
|---|---|
| `POSTGRES_N8N_PASSWORD` | contraseña de la DB de n8n |
| `POSTGRES_BACKEND_PASSWORD` | contraseña de la DB del backend |
| `N8N_ENCRYPTION_KEY` | clave fija de encriptación de credenciales de n8n |
| `EVOLUTION_API_KEY` | API key de Evolution API |
| `EVOLUTION_DB_PASSWORD` | contraseña de la DB de Evolution API |

El backend además lee `DATABASE_URL`, `N8N_DATABASE_URL` (opcional), `N8N_URL` y
`FRONTEND_URL` de su propio entorno (ver `backend/app/core/settings.py`).

## n8n

`n8n/bot-manager.json` es una foto del workflow vivo **"My workflow 3"** — el
único activo, que recibe los mensajes de WhatsApp, clasifica el origen, responde
con el AI Agent y persiste todo vía el backend. Las credenciales viven
encriptadas en la DB de n8n, no en el JSON. Ver [`n8n/README.md`](n8n/README.md)
para importar y re-exportar.

## API

- Base URL: `http://localhost:8000` (los routers montan en la raíz: `/leads`,
  `/chats`, `/mensajes`, `/config`, `/company-info`, `/campos-lead`, `/whatsapp`,
  `/n8n`). No hay prefijo `/api/v1`.
- n8n la consume desde la red interna como `http://backend:8000/n8n/...`
- Sin autenticación por ahora (sistema interno)

### Especificación OpenAPI

- Archivo versionado: [`docs/api/openapi.json`](docs/api/openapi.json)
- Con el backend levantado: Swagger UI en `http://localhost:8000/docs`,
  ReDoc en `http://localhost:8000/redoc`, JSON crudo en `/openapi.json`
- Regenerar el archivo tras cambiar endpoints o schemas:
  ```bash
  python backend/scripts/dump_openapi.py
  ```
  La `version` de la spec sale de `FastAPI(version=...)` en
  `backend/app/main.py` — subila al taggear un release.
