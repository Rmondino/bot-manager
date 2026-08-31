# Tabla 6 — Escenario 2: Seguimiento sin datos

**Negocio de prueba:** RHbarber (barbería, no Aislaciones RH)
**Fecha:** 21/08/2026
**Fuente:** tabla `mensajes` del backend (Bot Manager API), exportación directa vía consulta SQL
**Fuente primaria de:** Tabla 6 (§4.6, §6.4.4), Figura 8

**Nota de anonimización.** Nombre de contacto y número de WhatsApp del lead ofuscados. El resto del contenido conversacional se conserva sin editar.

**Nota sobre horario.** Los timestamps de la tabla `mensajes` (zona horaria del servidor de base de datos) no coinciden literalmente con los declarados en el pie de la Figura 8 (12:36 → 13:16); el intervalo entre el mensaje del lead y el seguimiento automático es el mismo en ambas fuentes (40 minutos), por lo que la discrepancia corresponde a una diferencia de zona horaria entre el registro de base de datos y la captura de pantalla, no a un evento distinto.

---

```
[15:36:06] Lead: hola buenas
[15:36:06] Bot:  Hola, ¿cómo estás? ¿En qué puedo ayudarte hoy con los servicios de RHbarber?

[16:16:50] Bot (seguimiento automático, sin intervención humana):
           Hola [nombre ofuscado], te escribimos desde Barberia RHbarber.
           estamos ddisponibles para cualquier consulta!
```

**Notificación disparada al encargado (backend → Evolution API):**

```
⏰ Seguimiento enviado:
👤 [nombre ofuscado]
📱 [teléfono ofuscado]

El lead pasó a modo HUMANO. Esperando tu contacto.
```

---

*Elaboración propia a partir de la tabla `mensajes` del backend. Corresponde a la misma prueba funcional documentada en la Figura 8 de la tesis. El texto "ddisponibles" es un error tipográfico real del sistema de producción, transcripto sin corregir para preservar fidelidad a la fuente.*
