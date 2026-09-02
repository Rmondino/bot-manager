# Evidencia

Material tabular y conversacional para la tesis. Los **datos personales van
ofuscados**; el resto del contenido de los mensajes se conserva sin editar.

`barberia/` y `aislaciones/` — un negocio por carpeta (`leads.csv` + `mensajes.csv`;
barbería incluye además las tablas de la Tabla 6). El cruce entre los dos CSV se
hace por `lead_ref` (`L01`, `L02`, …).

## Anonimización

Mismo criterio que las notas de las tablas de la Tabla 6:

- **Nombre de contacto** — en la columna `nombre_anon` (`Lead NN`) y también donde
  aparece **dentro del texto** de un mensaje (`[nombre]`). Ídem el nombre del
  asesor.
- **Número de WhatsApp** — `549261*****NN`: prefijo de Mendoza + dos dígitos
  pseudoaleatorios por lead, sin ningún dígito del número real.
- **Documento / DNI** — en `datos_json` y cualquier corrida de 7 o más dígitos
  dentro del texto: todos los dígitos en `*` salvo los dos últimos.

Se conservan sin editar: fecha de ingreso, último mensaje y cierre, estado,
seguimientos, y los datos de calificación no personales (zona, superficie,
servicio, tipo de inmueble, intención), además del resto del texto conversacional.
