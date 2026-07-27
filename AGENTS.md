# AGENTS.md — Instrucciones para el modelo de IA

Este archivo es leído automáticamente por OpenCode al inicio de cada sesión.

## Protocolo de inicio de sesión

Al comenzar cualquier sesión en este proyecto, SIEMPRE:

1. Leer `docs/memory/ARCHITECTURE.md` — entender la estructura del proyecto
2. Leer `docs/memory/PROGRESS.md` — ver qué se hizo y qué falta
3. Leer `docs/memory/DECISIONS.md` — respetar las decisiones ya tomadas
4. Leer `docs/memory/CONVENTIONS.md` — seguir los patrones establecidos
5. Leer `docs/memory/LEARNINGS.md` — evitar repetir errores o redescubrir cosas

No empezar a trabajar sin haber leído estos archivos primero.

## Protocolo de cierre de sesión

Al terminar cualquier sesión o cuando se complete una tarea importante:

1. Actualizar `docs/memory/PROGRESS.md` con lo que se hizo y lo que quedó pendiente
2. Si se tomó alguna decisión técnica relevante → actualizar `docs/memory/DECISIONS.md`
3. Si se encontró un bug, gotcha, o aprendizaje → actualizar `docs/memory/LEARNINGS.md`
4. Si se estableció un nuevo patrón o convención → actualizar `docs/memory/CONVENTIONS.md`
5. Si cambió la arquitectura → actualizar `docs/memory/ARCHITECTURE.md`

## Reglas generales

- Nunca ignorar los archivos de memoria aunque el usuario no lo pida explícitamente
- Si el usuario pide algo que contradice una decisión en DECISIONS.md, mencionarlo antes de proceder
- Mantener los archivos de memoria concisos — máximo 1-2 líneas por ítem
- Usar fechas en el formato `YYYY-MM-DD` al agregar entradas nuevas

## Estructura del proyecto

Ver `docs/memory/ARCHITECTURE.md` para el detalle completo.

```
bot-manager/
├── backend/          FastAPI + SQLModel + Alembic
├── frontend/         React 19 + Vite + TypeScript
├── docker-compose.yml
├── .env              NO subir a git — variables de entorno locales
└── docs/memory/      Archivos de memoria para el IA
```
