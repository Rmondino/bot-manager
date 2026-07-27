# DECISIONS.md — Decisiones técnicas tomadas

Formato: `YYYY-MM-DD — Decisión — Por qué`

---

## Infraestructura

- 2026-07-27 — Dos bases de datos PostgreSQL separadas (una para n8n, otra para el backend) — buena práctica de aislamiento, cada servicio dueño de sus datos
- 2026-07-27 — Variables de entorno en `.env` en lugar de hardcodear credenciales en docker-compose.yml — seguridad básica, .env excluido del repositorio git
- 2026-07-27 — Puerto 5433 para postgres_backend (en lugar del 5432 por defecto) — evita conflicto si hay un PostgreSQL local instalado

## Backend

- 2026-07-27 — FastAPI + SQLModel + Alembic — SQLModel unifica Pydantic + SQLAlchemy, Alembic para migraciones
- 2026-07-27 — DATABASE_URL sin fallback hardcodeado en database.py — la app debe fallar explícitamente si no tiene configuración, no silenciosamente con credenciales de desarrollo

## Frontend

- 2026-07-27 — React 19 + Vite + TypeScript — stack moderno, Vite como bundler por velocidad de HMR
- 2026-07-27 — Frontend corre en dev mode dentro de Docker (npm run dev --host) — simplicidad en desarrollo, no build de producción por ahora
