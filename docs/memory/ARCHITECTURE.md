# ARCHITECTURE.md — Estructura del proyecto

## Stack tecnológico

| Capa | Tecnología | Puerto |
|------|-----------|--------|
| Frontend | React 19 + Vite + TypeScript | 5173 |
| Backend | FastAPI + SQLModel + Alembic | 8000 |
| Automatización | n8n | 5678 |
| DB Backend | PostgreSQL 16 | 5433 (local) |
| DB n8n | PostgreSQL 16 | interno |

## Estructura de carpetas

```
bot-manager/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          Punto de entrada FastAPI
│   │   └── database.py      Engine SQLModel + sesión
│   ├── Dockerfile           python:3.12-slim, uvicorn --reload
│   └── requirements.txt     fastapi, uvicorn, sqlmodel, psycopg2, python-dotenv, httpx, alembic
├── frontend/
│   ├── src/
│   │   ├── App.tsx          Componente raíz (placeholder Vite por ahora)
│   │   └── main.tsx         Entry point React
│   ├── Dockerfile           node:20-slim, npm run dev --host
│   └── package.json         React 19, Vite 8, TypeScript 6
├── docker-compose.yml       Orquesta los 5 servicios
├── .env                     Variables de entorno locales (NO en git)
├── .gitignore
├── AGENTS.md                Instrucciones para el IA
└── docs/memory/             Sistema de memoria para el IA
```

## Servicios en docker-compose

- `postgres_n8n` — DB exclusiva para n8n
- `postgres_backend` — DB exclusiva para el backend (puerto 5433)
- `n8n` — Motor de automatización, lee de postgres_n8n
- `backend` — FastAPI, lee DATABASE_URL del entorno, depende de postgres_backend
- `frontend` — Vite dev server, llama a VITE_API_URL=http://localhost:8000

## Variables de entorno (.env)

```
POSTGRES_N8N_PASSWORD=...
POSTGRES_BACKEND_PASSWORD=...
N8N_ENCRYPTION_KEY=...
```

## Comunicación entre servicios

- Frontend → Backend: `http://localhost:8000` (VITE_API_URL)
- Backend → n8n: `http://n8n:5678` (N8N_URL, dentro de la red Docker)
- Backend → DB: `postgresql://botadmin:${POSTGRES_BACKEND_PASSWORD}@postgres_backend:5432/bot_manager`
- n8n → DB n8n: `postgresql://n8n:${POSTGRES_N8N_PASSWORD}@postgres_n8n:5432/n8n`
