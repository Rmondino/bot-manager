# LEARNINGS.md — Aprendizajes, bugs y gotchas

Formato: `YYYY-MM-DD — Descripción`

---

## Configuración y entorno

- 2026-07-27 — docker-compose.yml lée automáticamente el archivo `.env` de la misma carpeta — no hace falta `env_file:` explícito para las variables `${VAR}` en el compose
- 2026-07-27 — Las contraseñas hardcodeadas en docker-compose.yml se suben al repo si no se mueven a `.env` antes del primer commit — siempre sanitizar antes del `git init`
- 2026-07-27 — `database.py` tenía un fallback con credenciales reales: `os.getenv("DATABASE_URL", "postgresql://botadmin:backend_pass@...")` — los fallbacks hardcodeados con credenciales son un riesgo aunque no se suban al repo, mejor fallar explícitamente
- 2026-07-27 — El puerto 5432 de postgres_backend puede chocar con una instalación local de PostgreSQL — usar 5433 como puerto externo es una buena práctica en desarrollo

## Git / GitHub

- 2026-07-27 — `gh auth login` requiere ir a https://github.com/login/device con el código que muestra la terminal — el flujo es: elegir GitHub.com → HTTPS → Login with browser → ingresar el código
- 2026-07-27 — El `.gitignore` del frontend no cubre el proyecto raíz — siempre crear un `.gitignore` en la raíz además de los de cada subcarpeta
