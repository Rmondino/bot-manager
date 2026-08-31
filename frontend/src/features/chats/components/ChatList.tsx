import StatusBadge, { ListoParaCerrarBadge } from '../../../components/StatusBadge'
import type { ChatItem } from '../hooks/useChats'

interface Props {
  chats: ChatItem[]
  seleccionadoId: number | null
  onSeleccionar: (id: number) => void
}

/** Hora si es de hoy, si no la fecha corta. Igual criterio que WhatsApp. */
function formatFecha(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const hoy = new Date()
  const mismoDia =
    d.getDate() === hoy.getDate() &&
    d.getMonth() === hoy.getMonth() &&
    d.getFullYear() === hoy.getFullYear()
  return mismoDia
    ? d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

/** Quién escribió el último mensaje. Antes eran emojis 🤖 / 👤. */
const PREFIJO_ORIGEN: Record<string, string> = {
  BOT: 'Bot: ',
  HUMANO: 'Vos: ',
  LEAD: '',
}

export default function ChatList({ chats, seleccionadoId, onSeleccionar }: Props) {
  if (chats.length === 0) {
    return <p className="p-6 text-center text-[13px] text-muted">No hay chats que coincidan</p>
  }

  return (
    <ul className="flex flex-col">
      {chats.map(c => {
        const activo = c.id === seleccionadoId
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSeleccionar(c.id)}
              aria-current={activo ? 'true' : undefined}
              className={`relative flex w-full cursor-pointer gap-2.5 border-b border-line px-3.5 py-3 text-left transition-colors ${
                activo ? 'bg-primary-soft' : 'hover:bg-surface-2'
              }`}
            >
              {activo && (
                <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-primary" />
              )}

              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[14px] font-semibold text-muted">
                {c.nombre.charAt(0).toUpperCase()}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13.5px] font-semibold text-ink">{c.nombre}</span>
                  <span className="shrink-0 font-mono text-[10.5px] text-subtle">
                    {formatFecha(c.ultimo_fecha)}
                  </span>
                </span>

                <span className="mt-0.5 mb-1.5 block truncate text-[12.5px] text-muted">
                  {c.ultimo_texto
                    ? (PREFIJO_ORIGEN[c.ultimo_origen ?? ''] ?? '') +
                      c.ultimo_texto.replace(/\s+/g, ' ').trim()
                    : 'Sin mensajes'}
                </span>

                <span className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge estado={c.estado} />
                  {c.listo_para_cerrar && <ListoParaCerrarBadge compacto />}
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
