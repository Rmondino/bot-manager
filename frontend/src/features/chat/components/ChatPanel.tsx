import { useRef, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useConversacion } from '../hooks/useMensajes'
import { useWhatsappSend } from '../hooks/useWhatsappSend'
import { useUpdateLead } from '../../leads/hooks/useLeads'
import { useToast } from '../../../components/Toast'
import Toast from '../../../components/Toast'
import StatusBadge from '../../../components/StatusBadge'
import { IconPanel, IconBot } from '../../../components/icons'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import type { Lead } from '../../../types'

interface Props {
  lead: Lead
  /** Si viene, el header muestra el boton para plegar el panel del lead. */
  onTogglePanel?: () => void
  panelAbierto?: boolean
}

const POR_PAGINA = 50

/** Etiqueta del separador de día: "Hoy", "Ayer" o la fecha larga. */
function etiquetaDia(iso: string) {
  const d = new Date(iso)
  const hoy = new Date()
  const ayer = new Date()
  ayer.setDate(hoy.getDate() - 1)

  const mismoDia = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()

  if (mismoDia(d, hoy)) return 'Hoy'
  if (mismoDia(d, ayer)) return 'Ayer'
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function ChatPanel({ lead, onTogglePanel, panelAbierto }: Props) {
  const refetchInterval = lead.estado === 'HUMANO' ? 10000 : 60000
  // Las paginas llegan de la mas nueva a la mas vieja (orden desc); se aplanan
  // y se invierten para mostrarlas en orden cronologico.
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useConversacion(
    lead.whatsapp,
    { refetchInterval, porPagina: POR_PAGINA },
  )
  const mensajes = useMemo(
    () => (data?.pages ?? []).flatMap(p => p.items).reverse(),
    [data],
  )
  const total = data?.pages?.[0]?.total ?? 0
  const whatsappSend = useWhatsappSend()
  const updateLead = useUpdateLead()
  const { toast, showToast } = useToast()
  const queryClient = useQueryClient()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Depende del id del ultimo mensaje y no del array: ese cambia de identidad
  // en cada refetch del polling y tironeaba el scroll mientras leias atras.
  const ultimoId = mensajes.length ? mensajes[mensajes.length - 1].id : null
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ultimoId])

  const handleEnviar = async (texto: string) => {
    try {
      await whatsappSend.mutateAsync({ whatsapp: lead.whatsapp, texto })
      queryClient.invalidateQueries({ queryKey: ['mensajes'] })
      showToast('Mensaje enviado ✓', 'success')
    } catch (e) {
      showToast('Error al enviar el mensaje', 'error')
      throw e
    }
  }

  let prevDate = 0
  let prevDia = ''
  const mensajesConMeta = mensajes.map((m, i) => {
    const current = new Date(m.fecha_hora).getTime()
    const diff = i > 0 ? current - prevDate : Infinity
    const mostrarAvatar = i === 0 || mensajes[i - 1].origen !== m.origen || diff > 60000
    const dia = new Date(m.fecha_hora).toDateString()
    const mostrarFecha = dia !== prevDia
    prevDate = current
    prevDia = dia
    return { ...m, mostrarAvatar, mostrarFecha }
  })

  return (
    <div className="flex h-full flex-col overflow-hidden bg-canvas">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-line bg-surface px-5 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[14px] font-semibold text-muted">
            {lead.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[14.5px] font-semibold text-ink">{lead.nombre}</div>
            <div className="font-mono text-[12px] text-subtle">{lead.whatsapp}</div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <StatusBadge estado={lead.estado} />
          {onTogglePanel && (
            <button
              type="button"
              onClick={onTogglePanel}
              title={panelAbierto ? 'Ocultar datos del lead' : 'Ver datos del lead'}
              aria-pressed={panelAbierto}
              className={`btn btn-sm ${
                panelAbierto ? 'border-info-line bg-info-bg text-info' : 'btn-ghost'
              }`}
            >
              <IconPanel className="size-4" />
              Datos
            </button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-5">
        {hasNextPage && (
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="btn btn-ghost btn-sm mb-2 self-center"
          >
            {isFetchingNextPage
              ? 'Cargando...'
              : `Ver mensajes anteriores (${mensajes.length} de ${total})`}
          </button>
        )}

        {mensajes.length === 0 ? (
          <p className="mt-10 text-center text-[14px] text-muted">Sin mensajes registrados</p>
        ) : (
          mensajesConMeta.map(m => (
            <div key={m.id} className="contents">
              {m.mostrarFecha && (
                <div className="my-1.5 flex items-center gap-3" role="separator">
                  <span className="h-px flex-1 bg-line" />
                  <span className="font-mono text-[11px] text-subtle first-letter:uppercase">
                    {etiquetaDia(m.fecha_hora)}
                  </span>
                  <span className="h-px flex-1 bg-line" />
                </div>
              )}
              <MessageBubble
                mensaje={m}
                mostrarAvatar={m.mostrarAvatar}
                nombreLead={lead.nombre}
              />
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {lead.estado === 'HUMANO' && (
        <div className="flex shrink-0 items-end gap-2 border-t border-line bg-surface px-4 py-3">
          <ChatInput onEnviar={handleEnviar} disabled={whatsappSend.isPending} />
        </div>
      )}

      {lead.estado === 'ACTIVO' && (
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-3 border-t border-info-line bg-info-bg px-4 py-3.5 text-center">
          <p className="m-0 flex items-center gap-2 text-[13.5px] text-info">
            <IconBot className="size-[18px] shrink-0" />
            El bot está activo. Pausalo para escribir manualmente.
          </p>
          <button
            type="button"
            onClick={() => updateLead.mutateAsync({ id: lead.id, data: { estado: 'HUMANO' } })}
            className="btn btn-primary btn-sm"
          >
            Pausar y tomar control
          </button>
        </div>
      )}

      {lead.estado === 'CERRADO' && (
        <div className="shrink-0 border-t border-line bg-surface-2 px-4 py-3.5 text-center text-[13.5px] text-muted">
          Lead cerrado · Solo lectura
        </div>
      )}

      <Toast toast={toast} onHide={() => {}} />
    </div>
  )
}
