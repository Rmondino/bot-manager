# CHANGELOG

## [0.2.0] — 2026-07-27

### Modelos de datos
- Lead: 17 campos (lead_id, whatsapp, nombre, fecha_ingreso, estado, seguimientos, tipo_inmueble, zona, superficie_m2, intencion, notas_encargado, fechas)
- Mensaje: vinculado por lead_whatsapp, con origen (LEAD/BOT/HUMANO)
- BotConfig: configuración fija del bot (Evolution API, seguimientos, empresa)
- CompanyInfo: tabla Q&A para respuestas automáticas del bot
- Schemas Pydantic sincronizados (Create, Update, Response) para cada modelo

### Backend
- FastAPI + SQLModel + PostgreSQL con CORS habilitado
- Arquitectura feature-based: leads, mensajes, config, company_info, whatsapp, n8n
- Settings con pydantic-settings (DATABASE_URL, N8N_URL, FRONTEND_URL)
- Lifespan con create_all automático al iniciar
- Health endpoint en GET /api/v1/health

### Frontend
- React 19 + Vite 8 + TypeScript 6
- TanStack Query v5 configurado con QueryClientProvider
- Axios instance configurada
- Tailwind CSS v4 con @tailwindcss/vite

---

## [0.1.0] — 2026-07-27

### Infraestructura
- Docker Compose con 5 servicios: postgres_n8n, postgres_backend, n8n, backend, frontend
- Credenciales movidas a .env
- Repositorio GitHub: https://github.com/Rmondino/bot-manager

### Sistema de memoria para IA
- AGENTS.md en raíz con protocolo de inicio/cierre de sesión
- docs/memory/ con ARCHITECTURE.md, DECISIONS.md, PROGRESS.md, CONVENTIONS.md, LEARNINGS.md
