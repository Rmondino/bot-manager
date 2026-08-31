# Prompt: Rediseño UI panel Bot Manager

> Brief usado para el rediseño del panel. Las 2 imágenes de referencia (Hostay y
> Lodgify) están en [`refs/`](refs/): `hostay-dashboard.webp` y `lodgify-dashboard.webp`.

---

Quiero que rediseñes el frontend del **panel de supervisión de Bot Manager** (Vite + React + TypeScript) usando la skill `ui-ux-pro-max` que ya está conectada. Seguí este proceso, en orden:

## 1. Análisis previo (no toques código todavía)
- Recorré el proyecto actual: estructura de carpetas, componentes existentes, sistema de estilos (CSS/Tailwind/CSS Modules/lo que sea), rutas, y cómo maneja el estado (hooks, context, fetch a la API).
- Identificá qué pantallas/vistas tiene hoy: listado de conversaciones, detalle de conversación, estado del bot (`estado` / `listo_para_cerrar`), configuración (tabla `config` singleton), FAQs de la empresa (`company_info`), etc.
- No asumas stack de estilos: confirmá si hay Tailwind, styled-components, CSS plano, etc., y trabajá sobre eso (no metas una librería nueva salvo que sea imprescindible).

## 2. Contexto de producto (usalo para elegir la dirección visual)
Es un **panel interno B2B**, no un producto consumer. Lo usa el equipo de Aislaciones RH para supervisar conversaciones de un agente de WhatsApp que califica leads. Prioridades reales del usuario:
- Escaneo rápido del estado de cada conversación (¿está calificando? ¿lista para cerrar? ¿abandonada?)
- Confianza y seriedad — es una herramienta de trabajo diaria, no algo lúdico
- Buena legibilidad de texto/chat (hay transcripciones de conversaciones) y de datos tabulares
- Uso probablemente en desktop, por personal no técnico

Con ese contexto, **usá la skill para decidir vos la dirección visual** (paleta, densidad, estilo de sidebar, tipografía) — no fuerces una réplica de las imágenes de referencia. Te paso 2 dashboards como inspiración de patrones de layout, no como piel a copiar:

- **Imagen 1 (Hostay)**: sidebar oscuro, tarjetas de métricas arriba, gráficos con tooltips, tabla de bookings abajo, panel lateral de ratings/actividad.
- **Imagen 2 (Lodgify)**: layout más claro y liviano, mismo patrón de tarjetas + gráfico + dona + tabla, pero con más aire y una paleta más suave.

Sacá de ambas lo que sirva para *este* producto (por ejemplo: la jerarquía de tarjetas de métricas arriba, la tabla de "booking list" es análoga a nuestra tabla de conversaciones, el patrón de sidebar con ítem activo destacado) y aplicá los criterios de accesibilidad/contraste/tipografía que da la skill para el tipo de producto "admin dashboard / SaaS interno".

## 3. Sistema de diseño primero
Antes de tocar componentes, definí y documentá (podés dejarlo en un archivo `design-tokens` o similar):
- Paleta (primario, estados: activo/calificando/cerrado/abandonado, fondo, texto)
- Tipografía (par de fuentes o una sola familia con pesos)
- Espaciado y radios de borde consistentes
- Estilo de tarjetas, tablas y badges de estado

## 4. Aplicación por partes
Rediseñá en este orden, componente por componente, sin romper la lógica ni los llamados a la API existentes:
1. Layout base (sidebar + header)
2. Vista principal (métricas/resumen de conversaciones)
3. Tabla/listado de conversaciones (con badges de estado claros para `estado` y `listo_para_cerrar`)
4. Vista de detalle de conversación (chat/transcripción)
5. Configuración / FAQs

## 5. Restricciones
- No cambiar nombres de props, hooks, ni la forma en que se consumen los endpoints — esto es solo capa visual.
- Mantené todos los textos/labels en español tal cual están.
- Responsive: que no se rompa en pantallas más chicas, aunque el uso principal sea desktop.
- Priorizá contraste y legibilidad por sobre "efecto visual" — es una herramienta de trabajo.

Antes de aplicar cambios grandes, mostrame primero la propuesta de paleta + tokens + un mockup del layout principal para que la apruebe.
