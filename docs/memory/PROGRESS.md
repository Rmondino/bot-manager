# PROGRESS.md — Estado del proyecto

## Completado

- 2026-08-11 — n8n router: endpoints `GET /n8n/lead/{whatsapp}` y `PATCH /n8n/lead/{whatsapp}/datos` (reemplazan lookup/update de Google Sheets)
- 2026-07-30 — Fix: error 500 + CORS en envío de WhatsApp (try/except httpx + quitado allow_credentials=True)
- 2026-07-27 — Setup inicial del proyecto (estructura de carpetas, docker-compose)
- 2026-07-27 — Backend: FastAPI mínimo con endpoint GET /api/v1/health
- 2026-07-27 — Backend: SQLModel engine + función get_session() configurados
- 2026-07-27 — Backend: CORS configurado con FRONTEND_URL
- 2026-07-27 — Frontend: React 19 + Vite + TypeScript + TanStack Query + Axios + Tailwind v4
- 2026-07-27 — Frontend: QueryClientProvider y Axios instance configurados
- 2026-07-27 — Dockerfiles para backend (python:3.12-slim) y frontend (node:20-slim)
- 2026-07-27 — docker-compose con los 5 servicios: postgres_n8n, postgres_backend, n8n, backend, frontend
- 2026-07-27 — Credenciales movidas a .env, docker-compose usa variables de entorno
- 2026-07-27 — Repositorio git inicializado y pusheado a https://github.com/Rmondino/bot-manager
- 2026-07-27 — Sistema de memoria (docs/memory/ + AGENTS.md) creado y actualizado

## En progreso — Migración n8n de Google Sheets a backend API

### Backend (n8n router)
- [x] Fixed `POST /n8n/lead` (n8n_lead_upsert) — coerce whatsapp a str(), nombre fallback "Lead", ahora actualiza nombre si el lead ya existe
- [x] Endpoint `GET /n8n/lead/{whatsapp}` — reemplaza Google Sheets lookup (devuelve {existe, lead})
- [x] Endpoint `PATCH /n8n/lead/{whatsapp}/datos` — reemplaza Google Sheets update de campos (nombre, tipo_inmueble, zona, superficie_m2, intencion, notas_encargado); auto-crea el lead y solo pisa campos presentes
- [x] Fix: endpoints PATCH timestamp, PATCH estado, PATCH seguimiento ahora auto-crean el lead si no existe (antes devolvían 404)
- [x] Fix: feedback loop en POST /n8n/mensaje — si llega LEAD con mismo texto que BOT reciente, se ignora (el bot hablando solo)

### n8n Workflow (wf1_final.json)
- [x] Reemplazar todos los `Number(...)` por `toString()` en expresiones
- [x] Reemplazar todas las URLs inline `={{ }}` por sintaxis completa `=`
- [x] Configurar nodo Switch (origen): LEAD→0, ENCARGADO_COMANDO→1, ENCARGADO_AL_LEAD→2
- [x] Configurar nodo Switch Comando: PAUSAR→0, ACTIVAR→1, NOTA→2, LISTA→3
- [x] Conectar Clasificar Origen → Switch
- [x] Conectar Switch → Upsert lead backend / Parsear comando / Ignorar
- [x] Conectar Parsear comando → Switch Comando
- [x] Conectar Switch Comando → Backend PAUSAR / Backend ACTIVAR / Buscar lead por WA / Backend LISTA
- [x] Conectar Upsert lead backend → ?Estado es HUMANO? (en vez de → Leer config backend)
- [x] Importar wf1_final.json a n8n preservando credentials (vía PATCH sobre workflow existente)
- [ ] Activar workflow en n8n (verificar desde UI que todo funcione)

## Próximo paso

Implementar el **primer dominio: Leads** (base del sistema):

### Backend
- [ ] Modelo `Lead` en `backend/app/leads/model.py`
- [ ] Schemas en `backend/app/leads/schema.py`
- [ ] CRUD endpoints en `backend/app/leads/router.py`
- [ ] Health endpoint con status de BD en `backend/app/main.py`

### Frontend
- [ ] Feature `leads/` con hooks (useLeads, useLead, useCreateLead)
- [ ] Página de listado de leads
- [ ] Página de detalle de lead
- [ ] Formulario de creación manual de lead
