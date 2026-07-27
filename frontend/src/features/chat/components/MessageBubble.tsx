import type { Mensaje } from '../../../types'

interface Props {
  mensaje: Mensaje
  mostrarAvatar: boolean
  nombreLead: string
}

function formatTime(fecha_hora: string) {
  return new Date(fecha_hora).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MessageBubble({ mensaje, mostrarAvatar, nombreLead }: Props) {
  const isLead = mensaje.origen === 'LEAD'
  const isBot = mensaje.origen === 'BOT'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 8,
        marginBottom: 4,
        justifyContent: isLead ? 'flex-start' : 'flex-end',
      }}
    >
      {isLead && (
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: '#1c2030',
            color: '#7a8099',
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            visibility: mostrarAvatar ? 'visible' : 'hidden',
            flexShrink: 0,
          }}
        >
          {nombreLead.charAt(0).toUpperCase()}
        </div>
      )}

      <div
        style={{
          background: isLead ? '#1c2030' : isBot ? '#0d1a3a' : '#0d2e1a',
          borderLeft: isLead ? '3px solid #2ecc71' : undefined,
          borderRight: isBot ? '3px solid #4f7cff' : !isLead ? '3px solid #2ecc71' : undefined,
          borderRadius: isLead ? '0 12px 12px 12px' : '12px 0 12px 12px',
          padding: '10px 14px',
          maxWidth: '70%',
          fontSize: 13,
          color: isLead ? '#e8eaf0' : isBot ? '#4f7cff' : '#2ecc71',
          lineHeight: 1.5,
        }}
      >
        <div>{mensaje.mensaje}</div>
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: '#7a8099',
            textAlign: isLead ? 'right' : 'right',
            marginTop: 4,
          }}
        >
          {isBot ? '🤖 ' : !isLead ? '👤 ' : ''}
          {formatTime(mensaje.fecha_hora)}
        </div>
      </div>

      {!isLead && <div style={{ width: 30, flexShrink: 0 }} />}
    </div>
  )
}
