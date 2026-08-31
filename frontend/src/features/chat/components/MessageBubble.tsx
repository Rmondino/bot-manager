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

/**
 * El cuerpo del mensaje va siempre en `text-ink`, nunca coloreado por origen:
 * la transcripción es lo que más se lee del panel. Quién habló se distingue por
 * el lado, el tinte de la burbuja y la inicial del avatar.
 */
export default function MessageBubble({ mensaje, mostrarAvatar, nombreLead }: Props) {
  const isLead = mensaje.origen === 'LEAD'
  const isBot = mensaje.origen === 'BOT'

  const avatar = isLead
    ? { inicial: nombreLead.charAt(0).toUpperCase(), clases: 'bg-ok-bg text-ok' }
    : isBot
      ? { inicial: 'B', clases: 'bg-info-bg text-info' }
      : { inicial: 'RH', clases: 'bg-idle-bg text-idle' }

  const burbuja = isLead
    ? 'rounded-bl-[4px] border-line bg-surface'
    : isBot
      ? 'rounded-br-[4px] border-info-line bg-info-bg'
      : 'rounded-br-[4px] border-ok-line bg-ok-bg'

  const autor = isLead ? '' : isBot ? 'Bot · ' : 'Vos · '

  return (
    <div className={`flex max-w-[74%] gap-2.5 ${isLead ? '' : 'ml-auto flex-row-reverse'}`}>
      <div
        className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${avatar.clases}`}
        style={{ visibility: mostrarAvatar ? 'visible' : 'hidden' }}
        aria-hidden={!mostrarAvatar}
      >
        {avatar.inicial}
      </div>

      <div
        className={`min-w-0 rounded-lg border px-3.5 py-2.5 text-[14px] leading-[1.55] break-words whitespace-pre-wrap text-ink ${burbuja}`}
      >
        {mensaje.mensaje}
        <span
          className={`mt-1 block font-mono text-[10.5px] text-muted ${
            isLead ? 'text-left' : 'text-right'
          }`}
        >
          {autor}
          {formatTime(mensaje.fecha_hora)}
        </span>
      </div>
    </div>
  )
}
