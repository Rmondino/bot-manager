# CHANGELOG

## [0.3.0] — 2026-08-31

### Backend
- Alembic como fuente de verdad del esquema (baseline + migraciones): FK
  `mensajes → leads` con cascade, índice compuesto `(lead_whatsapp, fecha_hora)`,
  drop de la tabla huérfana `companyinfo`, campos de lead configurables
- Campos de lead configurables (`campos_lead`): model + schema + router
- Nuevo dominio `chats`: listado de conversaciones con preview del último mensaje
  (una sola query vía `DISTINCT ON` sobre el índice compuesto)
- Endpoints n8n para el lead: `GET` lead y `PATCH` datos (reemplazan Google Sheets)
- Borrado de lead + limpieza opcional de la memoria del agente en la DB de n8n
- Fix de integridad al guardar mensajes; envío de WhatsApp corregido
- Evolution API sumado al stack de `docker-compose`

### Frontend
- Rediseño completo del panel (layout, sidebar, tokens, tablas, badges de estado):
  Dashboard, Leads, detalle de lead con panel lateral, Config, Company Info,
  Campos de Lead
- Vista `Chats` reemplaza a `Historial`
- Componentes compartidos nuevos: `Kpi`, `Spinner`, `icons`, `useMediaQuery`,
  `LeadPanel`
- React Router 7

### n8n
- `n8n/bot-manager.json` sincronizado con el workflow vivo "My workflow 3"
  (seguimiento diario fusionado; `seguimiento-diario-bot.json` eliminado)
- Tool del AI Agent para guardar los datos de calificación del lead

### Repo
- `README.md` raíz, `.env.example`, `.gitattributes` (EOL LF)
- `docker-compose.yml` sin secretos hardcodeados (todo por `${VAR}`)
- `.gitignore` cubre artefactos de tooling de IA
- Brief e imágenes del rediseño movidos a `docs/design/`
- Spec OpenAPI publicada como artefacto versionado en `docs/api/openapi.json`,
  regenerable con `backend/scripts/dump_openapi.py`; metadata de la app FastAPI
  completada (`version`, `description`, `servers`)
- README y `docs/memory/ARCHITECTURE.md`: base URL corregida (routers en la raíz,
  sin `/api/v1`)
- `backend/scripts/seed_demo.py`: dataset de demostración (24 leads de barbería con
  conversaciones y fechas variadas, idempotente, no toca los leads reales)
- `backend/scripts/export_evidencia.py` + `evidencia/barberia/{leads,mensajes}.csv`:
  export anonimizado de las tablas `leads` y `mensajes` (nombre → `Lead NN`,
  teléfono y DNI enmascarados, cruce entre CSV preservado)
- `backend/scripts/gen_evidencia_aislaciones.py` + `evidencia/aislaciones/{leads,mensajes}.csv`:
  dataset de demostración de Aislaciones RH (24 leads, ventana 03/08–29/08 2026),
  generado en memoria a CSV sin tocar la base
- `evidencia/` reorganizada en subcarpetas `barberia/` y `aislaciones/`

---

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
