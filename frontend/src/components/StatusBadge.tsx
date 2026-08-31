interface Props {
  estado: string
}

/**
 * Un color = un significado en toda la app.
 *
 * CERRADO va en gris y no en rojo: es un final normal del lead, no un error.
 * El rojo queda reservado para problemas reales (bot pausado, eliminar), que
 * es lo único que tiene que alarmar.
 */
const estilos: Record<string, { clases: string; etiqueta: string }> = {
  ACTIVO: {
    clases: 'bg-ok-bg text-ok border-ok-line',
    etiqueta: 'Activo',
  },
  HUMANO: {
    clases: 'bg-info-bg text-info border-info-line',
    etiqueta: 'Humano',
  },
  CERRADO: {
    clases: 'bg-idle-bg text-idle border-idle-line',
    etiqueta: 'Cerrado',
  },
}

const fallback = { clases: 'bg-idle-bg text-idle border-idle-line', etiqueta: '—' }

export default function StatusBadge({ estado }: Props) {
  const e = estilos[estado] ?? { ...fallback, etiqueta: estado }
  return (
    <span className={`badge ${e.clases}`}>
      <span className="badge-dot" />
      {e.etiqueta}
    </span>
  )
}

/**
 * `listo_para_cerrar`: el lead calificado y listo para vender. Es el dato más
 * valioso del panel, así que se escribe completo en vez de quedar como un chip
 * con emoji al lado del nombre.
 */
export function ListoParaCerrarBadge({ compacto = false }: { compacto?: boolean }) {
  return (
    <span
      className={`badge border-hot-line bg-hot-bg text-hot ${compacto ? 'px-2 text-[11px]' : ''}`}
    >
      Listo para cerrar
    </span>
  )
}
