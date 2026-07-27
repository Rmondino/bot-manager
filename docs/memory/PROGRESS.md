# PROGRESS.md — Estado del proyecto

## Completado

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
