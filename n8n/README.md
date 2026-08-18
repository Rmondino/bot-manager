# Workflows de n8n

Versiones que funcionan de los workflows del bot. Formato export estándar de n8n
(objeto con `name`, `nodes`, `connections`, `settings`), listo para importar.

| Archivo | Workflow | Nodos | Descripción |
|---|---|---|---|
| `bot-manager.json` | `My workflow 3` (`MBhZxWsNy4L1xVf3`) | 57 | **El único activo.** Recibe mensajes de WhatsApp (webhook de Evolution API), clasifica origen (LEAD / ENCARGADO), responde con el AI Agent y guarda todo vía backend. Incluye el seguimiento diario, que se fusionó acá. |

> El nombre del workflow vivo (`My workflow 3`) no coincide con el del archivo. Conviene
> renombrarlo a `bot-manager` en n8n y borrar las copias inactivas (`bot-manager` viejo,
> `My workflow`, `Agente BOT Leads - Aislaciones RH`) para que deje de haber ambigüedad
> sobre cuál se está editando.

> `seguimiento-diario-bot.json` se eliminó: su workflow quedó inactivo al fusionarse el
> seguimiento en el de arriba, y el archivo tenía una apikey de Evolution hardcodeada.

## Credenciales de Evolution API

Ningún nodo debe tener el host, la instancia ni la apikey escritos a mano. Hay dos fuentes
según la rama:

- **Rama del bot** (entra por webhook): `$('Normalizacion').item.json.intance.{server_url,name,apikey}`,
  que vienen en el payload — el bot responde por la misma instancia que le entregó el mensaje.
- **Rama de seguimiento** (la dispara el cron, no hay webhook): sale de `GET /n8n/config`,
  y `Preparar mensaje seguimiento` la arrastra como `server_url`, `instance_name` y `apikey`.

Al escribir la expresión, **`={{ ... }}` sin espacio después del `=`**. Con `= {{ ... }}` n8n
toma el espacio como texto literal y lo mete en la URL o en el header, que falla con un 401
o un 404 difíciles de leer.

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
