# ARCHITECTURE.md — Estructura del proyecto

## Propósito

Sistema de gestión de leads para un bot de WhatsApp de **Aislaciones RH** (empresa de aislaciones en Mendoza, Argentina).
El backend expone una API REST que n8n consume para registrar y gestionar leads provenientes de WhatsApp (Evolution API).

## Stack tecnológico

| Capa | Tecnología | Puerto |
|------|-----------|--------|
| Frontend | React 19 + Vite 8 + TypeScript 6 + TanStack Query v5 + Axios + Tailwind CSS v4 | 5173 |
| Backend | FastAPI + SQLModel + Alembic | 8000 |
| Automatización | n8n | 5678 |
| DB Backend | PostgreSQL 16 | 5433 (local) |
| DB n8n | PostgreSQL 16 | interno |
| WhatsApp | Evolution API (VPS externo) | — |

## Estructura de carpetas

```
bot-manager/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              Punto de entrada FastAPI (CORS + routers)
│   │   ├── database.py           Engine SQLModel + get_session()
│   │   └── {dominio}/           Feature-based por dominio de negocio
│   │       ├── model.py          SQLModel table
│   │       ├── schema.py         Pydantic schemas de request/response
│   │       └── router.py         Endpoints del dominio
│   ├── Dockerfile                python:3.12-slim, uvicorn --reload
│   └── requirements.txt          fastapi, uvicorn, sqlmodel, psycopg2, python-dotenv, httpx, alembic
├── frontend/
│   ├── src/
│   │   ├── main.tsx              Entry point React (QueryClientProvider)
│   │   ├── App.tsx               Router / layout raíz
│   │   └── {feature}/           Feature-based por funcionalidad
│   │       ├── hooks/            TanStack Query hooks
│   │       ├── components/       Componentes de UI
│   │       └── pages/            Páginas/rutas de la feature
│   ├── Dockerfile                node:20-slim, npm run dev --host
│   └── package.json              React 19, @tanstack/react-query ^5, axios, tailwindcss v4
├── docker-compose.yml            Orquesta los 5 servicios
├── .env                          Variables de entorno locales (NO en git)
├── .gitignore
├── AGENTS.md                     Instrucciones para el IA
└── docs/memory/                  Sistema de memoria para el IA
```

## Servicios en docker-compose

- `postgres_n8n` — DB exclusiva para n8n
- `postgres_backend` — DB exclusiva para el backend (puerto 5433)
- `n8n` — Motor de automatización, lee de postgres_n8n, le pega al backend como `http://backend:8000`
- `backend` — FastAPI, lee DATABASE_URL del entorno, depende de postgres_backend
- `frontend` — Vite dev server, proxy inverso al backend

## Variables de entorno

### Llegan al backend:
- `DATABASE_URL` — conexión a PostgreSQL
- `N8N_URL` — URL interna de n8n (`http://n8n:5678`)
- `FRONTEND_URL` — URL del frontend para CORS (`http://localhost:5173`)

### En .env (local, no en git):
- `POSTGRES_N8N_PASSWORD`
- `POSTGRES_BACKEND_PASSWORD`
- `N8N_ENCRYPTION_KEY`

## API

- Base URL: `http://localhost:8000/api/v1/`
- n8n consume los endpoints como `http://backend:8000/api/v1/...`
- Sin autenticación por ahora (sistema interno)

## Comunicación entre servicios

- Frontend → Backend: `http://localhost:8000` (VITE_API_URL)
- Backend → n8n: `http://n8n:5678` (red interna Docker)
- Backend → DB: `postgresql://botadmin:${POSTGRES_BACKEND_PASSWORD}@postgres_backend:5432/bot_manager`
- n8n → DB n8n: `postgresql://n8n:${POSTGRES_N8N_PASSWORD}@postgres_n8n:5432/n8n`
- n8n → Backend: `http://backend:8000/api/v1/...` (red interna Docker)
