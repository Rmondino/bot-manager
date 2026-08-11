interface Props {
  estado: string
}

const estilos: Record<string, { bg: string; text: string; dot: string }> = {
  ACTIVO: { bg: '#0d2e1a', text: '#2ecc71', dot: '#2ecc71' },
  HUMANO: { bg: '#0d1a3a', text: '#4f7cff', dot: '#4f7cff' },
  CERRADO: { bg: '#2e0d0d', text: '#e55353', dot: '#e55353' },
}

const fallback = { bg: '#1c2030', text: '#7a8099', dot: '#7a8099' }

export default function StatusBadge({ estado }: Props) {
  const e = estilos[estado] ?? fallback
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
