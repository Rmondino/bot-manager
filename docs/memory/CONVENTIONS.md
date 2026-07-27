# CONVENTIONS.md — Patrones y convenciones establecidas

## General

- Idioma del código: inglés (variables, funciones, clases)
- Idioma de comentarios y docs: español
- Fechas en formato `YYYY-MM-DD`

## Backend (FastAPI + SQLModel)

- Estructura de carpetas: `backend/app/` para todo el código fuente
- Módulo de base de datos: `backend/app/database.py` — engine y get_session()
- Punto de entrada: `backend/app/main.py` — instancia de FastAPI
- Dependencia de sesión: inyectar con `Depends(get_session)` en los routers
- Variables de entorno: siempre con `os.getenv("VAR")` sin fallbacks hardcodeados
- Migraciones: Alembic (pendiente de configurar)
- Modelos: SQLModel con `table=True` para ORM, sin `table=True` para schemas Pydantic

## Frontend (React + Vite + TypeScript)

- Componentes: PascalCase, archivos `.tsx`
- Hooks: camelCase con prefijo `use`, archivos `.ts`
- Carpeta de assets: `frontend/src/assets/`
- Variable de entorno API: `import.meta.env.VITE_API_URL`
- Tipado estricto: no usar `any` salvo justificación explícita

## Docker

- Imágenes base: `python:3.12-slim` (backend), `node:20-slim` (frontend)
- Red interna: `bot_network` (bridge)
- Volúmenes nombrados para persistencia de datos de Postgres y n8n
- Variables sensibles: siempre desde `.env` con `${VAR}` en docker-compose.yml

## Git

- Rama principal: `main`
- Commits en español o inglés, mensajes descriptivos
- NO commitear: `.env`, `__pycache__`, `node_modules`, `dist`
