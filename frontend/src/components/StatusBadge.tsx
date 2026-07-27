type EstadoType = 'ACTIVO' | 'HUMANO' | 'CERRADO'

interface Props {
  estado: EstadoType
}

const estilos: Record<EstadoType, { bg: string; text: string; dot: string }> = {
  ACTIVO: { bg: '#0d2e1a', text: '#2ecc71', dot: '#2ecc71' },
  HUMANO: { bg: '#0d1a3a', text: '#4f7cff', dot: '#4f7cff' },
  CERRADO: { bg: '#2e0d0d', text: '#e55353', dot: '#e55353' },
}

export default function StatusBadge({ estado }: Props) {
  const e = estilos[estado]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 6,
        background: e.bg,
        color: e.text,
        fontSize: 11,
        fontWeight: 500,
        fontFamily: "'DM Mono', monospace",
        textTransform: 'uppercase',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: e.dot }} />
      {estado}
    </span>
  )
}
