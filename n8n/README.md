# Workflows de n8n

Versiones que funcionan de los workflows del bot. Formato export estándar de n8n
(objeto con `name`, `nodes`, `connections`, `settings`), listo para importar.

| Archivo | Workflow | Nodos | Descripción |
|---|---|---|---|
| `bot-manager.json` | bot-manager | 44 | Flujo principal: recibe mensajes de WhatsApp (webhook de Evolution API), clasifica origen (LEAD / ENCARGADO), procesa comandos y responde vía backend. |
| `seguimiento-diario-bot.json` | Seguimiento Diario - bot | 11 | Corre a diario y dispara los seguimientos automáticos a leads según la config del backend. |

## Importar en n8n

1. Abrí n8n (`http://localhost:5678`) → **Workflows** → **Import from File**.
2. Elegí el `.json` correspondiente.
3. Reasigná las **credenciales** (Postgres, OpenAI, Evolution API): no se exportan por seguridad, hay que seleccionarlas a mano tras importar.

## Re-exportar desde n8n

Estos archivos son una "foto": si editás o renombrás un workflow en la UI de n8n,
**no** se actualizan solos. Para volver a volcar el estado vivo desde la base:

```bash
# ver ids y nombres actuales
docker compose exec -T postgres_n8n psql -U n8n -d n8n -A -F $'\t' \
  -c "SELECT id, name, active FROM workflow_entity ORDER BY \"updatedAt\" DESC;"

# exportar un workflow por id a un archivo importable
docker compose exec -T postgres_n8n psql -U n8n -d n8n -t -A -c \
  "SELECT json_build_object('name',name,'nodes',nodes,'connections',connections,'settings',settings,'staticData',\"staticData\",'pinData',\"pinData\")::text FROM workflow_entity WHERE id='<ID>';" \
  | python -c "import sys,json; d=json.loads(sys.stdin.buffer.read().decode('utf-8')); json.dump(d,open('n8n/<archivo>.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)"
```

## Notas

- Las credenciales viven encriptadas en la base `postgres_n8n`, **no** en estos archivos.
- La carpeta `_scratch/` (gitignoreada) guarda los scripts y volcados intermedios que se usaron para armar/depurar estos workflows. No forman parte del proyecto.
