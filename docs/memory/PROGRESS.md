# PROGRESS.md — Estado del proyecto

## Completado

- 2026-07-27 — Setup inicial del proyecto (estructura de carpetas, docker-compose)
- 2026-07-27 — Backend: FastAPI mínimo con endpoint GET / que retorna `{"status": "ok"}`
- 2026-07-27 — Backend: SQLModel engine + función get_session() configurados
- 2026-07-27 — Frontend: React 19 + Vite + TypeScript scaffoldeado (pantalla placeholder)
- 2026-07-27 — Dockerfiles para backend (python:3.12-slim) y frontend (node:20-slim)
- 2026-07-27 — docker-compose con los 5 servicios: postgres_n8n, postgres_backend, n8n, backend, frontend
- 2026-07-27 — Credenciales movidas a .env, docker-compose usa variables de entorno
- 2026-07-27 — Repositorio git inicializado y pusheado a https://github.com/Rmondino/bot-manager
- 2026-07-27 — Sistema de memoria (docs/memory/ + AGENTS.md) creado

## En progreso

- (nada actualmente)

## Pendiente

- Definir modelos de datos (qué entidades maneja el bot manager)
- Crear migraciones con Alembic
- Implementar endpoints reales en el backend
- Conectar frontend con el backend (reemplazar placeholder de Vite)
- Configurar n8n con los workflows de automatización
- Definir qué bots se van a gestionar y cómo
