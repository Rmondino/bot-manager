# DECISIONS.md — Decisiones técnicas tomadas

Formato: `YYYY-MM-DD — Decisión — Por qué`

---

## Infraestructura

- 2026-07-27 — Dos bases de datos PostgreSQL separadas (una para n8n, otra para el backend) — buena práctica de aislamiento, cada servicio dueño de sus datos
- 2026-07-27 — Variables de entorno en `.env` en lugar de hardcodear credenciales en docker-compose.yml — seguridad básica, .env excluido del repositorio git
- 2026-07-27 — Puerto 5433 para postgres_backend (en lugar del 5432 por defecto) — evita conflicto si hay un PostgreSQL local instalado
- 2026-08-14 — Excepción acotada al aislamiento de bases: el backend borra directo en `n8n_chat_histories` (base de n8n) al eliminar un lead — sin esto la memoria del agente sobrevive al borrado y el bot recuerda una conversación que la app ya no tiene. Alcance limitado a un `DELETE` por `session_id`, vía `N8N_DATABASE_URL` (opcional) y en `try/except`: si n8n no está disponible el lead se borra igual. Se prefirió a un webhook de n8n por tener menos piezas móviles y no depender de que n8n esté arriba

## Backend

- 2026-07-27 — FastAPI + SQLModel + Alembic — SQLModel unifica Pydantic + SQLAlchemy, Alembic para migraciones
- 2026-07-27 — DATABASE_URL sin fallback hardcodeado en database.py — la app debe fallar explícitamente si no tiene configuración
- 2026-07-27 — Arquitectura feature-based por dominio (`backend/app/{dominio}/model.py, schema.py, router.py`) — mejor organización que modules planos, cada dominio autocontenido
- 2026-07-27 — Prefijo `/api/v1/` en todos los endpoints — versionado de API desde el vamos, n8n consume como `http://backend:8000/api/v1/...`
- 2026-07-27 — Sin autenticación por ahora — sistema interno, se agrega si hace falta después

## Frontend

- 2026-07-27 — React 19 + Vite + TypeScript — stack moderno, Vite como bundler por velocidad de HMR
- 2026-07-27 — TanStack Query v5 para data fetching — manejo de caché, loading/error states, mutations optimistas
- 2026-07-27 — Axios como HTTP client — interceptors, tipado, mejor ergonomía que fetch nativo
- 2026-07-27 — Tailwind CSS v4 — estilos utilitarios, sin runtime CSS, bundle mínimo
- 2026-07-27 — Arquitectura feature-based (`frontend/src/{feature}/hooks/, components/, pages/`) — misma lógica que backend, cada feature autocontenida
- 2026-07-27 — No usar localStorage ni sessionStorage — estado siempre en memoria o servidor, evita desincronización

## Idioma

- 2026-07-27 — Términos de negocio en español (lead, cliente, obra, presupuesto), términos técnicos en inglés (hook, query, mutation, router, schema, model) — el dominio es comprensible para el negocio, el código es estándar para desarrolladores
