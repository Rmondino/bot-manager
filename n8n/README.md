# Workflows de n8n

Versiones que funcionan de los workflows del bot. Formato export estándar de n8n
(objeto con `name`, `nodes`, `connections`, `settings`), listo para importar.

| Archivo | Workflow | Nodos | Descripción |
|---|---|---|---|
| `agente-bot-leads.json` | Agente BOT Leads - Aislaciones RH | 54 | Flujo principal: recibe mensajes de WhatsApp (webhook de Evolution API), clasifica origen (LEAD / ENCARGADO), procesa comandos y responde vía backend. |
| `seguimiento-diario.json` | Seguimiento Diario - Aislaciones RH | 11 | Corre a diario y dispara los seguimientos automáticos a leads según la config del backend. |

## Importar en n8n

1. Abrí n8n (`http://localhost:5678`) → **Workflows** → **Import from File**.
2. Elegí el `.json` correspondiente.
3. Reasigná las **credenciales** (Postgres, OpenAI, Evolution API): no se exportan por seguridad, hay que seleccionarlas a mano tras importar.

## Notas

- Las credenciales viven encriptadas en la base `postgres_n8n`, **no** en estos archivos.
- La carpeta `_scratch/` (gitignoreada) guarda los scripts y volcados intermedios que se usaron para armar/depurar estos workflows. No forman parte del proyecto.
