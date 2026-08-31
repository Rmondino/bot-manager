# Tabla 6 — Escenario 1: Cierre con datos capturados

**Negocio de prueba:** RHbarber (barbería, no Aislaciones RH)
**Fecha:** 21/08/2026
**Fuente:** tabla `mensajes` del backend (Bot Manager API), exportación directa vía consulta SQL
**Fuente primaria de:** Tabla 6 (§6.4.4), Figura 6(b)

**Nota de anonimización.** Nombre de contacto y número de WhatsApp del lead ofuscados. Documento de identidad aportado por el lead durante la conversación, ofuscado. El precio, el servicio y el contenido conversacional se conservan sin editar.

---

```
[15:25:55] Lead: Hola
[15:25:55] Bot:  Hola, ¿cómo estás? ¿En qué te puedo ayudar hoy con tu consulta sobre nuestra barbería?

[15:26:52] Lead: Cuál es el precio del corte ?
[15:26:52] Bot:  El corte de pelo está a $14.000. Si querés corte de pelo y barba, el precio es $17.000. ¿Te gustaría reservar un turno o necesitás más info?

[15:27:21] Lead: Quiero reservar turno
[15:27:21] Bot:  Perfecto, para avanzarte con la reserva necesito tu número de DNI y si querés solo el corte de pelo o el combo de corte + barba. ¿Me pasás esos datos así te agendo?

[15:28:02] Lead: Necesito corte de pelo , [DNI ofuscado]
[15:28:02] Bot:  Ya tomé tus datos para el corte de pelo. Te vamos a contactar para coordinar tu turno y dejar todo listo.
```

**Notificación disparada al encargado (backend → Evolution API):**

```
🔥 Lead listo para cerrar:
👤 [nombre ofuscado]
📱 [teléfono ofuscado]
documento: [ofuscado]
servicio: Corte de pelo
```

---

*Elaboración propia a partir de la tabla `mensajes` del backend. Corresponde a la misma prueba funcional documentada en la Figura 6(b) de la tesis.*
