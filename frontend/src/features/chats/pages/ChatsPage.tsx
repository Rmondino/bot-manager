import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useChats } from '../hooks/useChats'
import { useLead } from '../../leads/hooks/useLeads'
import ChatList from '../components/ChatList'
import ChatPanel from '../../chat/components/ChatPanel'
import LeadPanel from '../../leads/components/LeadPanel'
import { SpinnerCentrado } from '../../../components/Spinner'
import { IconBuscar } from '../../../components/icons'
import { useMediaQuery } from '../../../lib/useMediaQuery'

const POR_PAGINA = 50

export default function ChatsPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [mostrarPanel, setMostrarPanel] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [busquedaDebounced, setBusquedaDebounced] = useState('')
  const [limit, setLimit] = useState(POR_PAGINA)

  // Debajo de 1280px el panel del lead no entra como tercera columna: se oculta
  // y la ficha completa sigue disponible en /leads/:id.
  const hayLugarParaPanel = useMediaQuery('(min-width: 1280px)')

  // Sin debounce cada tecla dispara un request.
  useEffect(() => {
    const t = setTimeout(() => {
      setBusquedaDebounced(busqueda)
      setLimit(POR_PAGINA)
    }, 300)
    return () => clearTimeout(t)
  }, [busqueda])

  const { data, isLoading } = useChats(
    { q: busquedaDebounced, limit },
    { refetchInterval: 30000 },
  )
  const chats = data?.items ?? []
  const total = data?.total ?? 0

  const seleccionadoId = id ? Number(id) : null

  // Sin :id en la URL abre la conversación con actividad más reciente, que es
  // la primera de la lista. La URL es lo único que persiste el chat abierto:
  // las convenciones del proyecto prohíben localStorage.
  useEffect(() => {
    if (!seleccionadoId && chats.length > 0) {
      navigate(`/chats/${chats[0].id}`, { replace: true })
    }
  }, [seleccionadoId, chats, navigate])

  const { data: lead } = useLead(seleccionadoId ?? 0)

  return (
    <div className="flex h-full flex-col overflow-hidden md:flex-row">
      <div className="flex h-[40%] w-full shrink-0 flex-col overflow-hidden border-b border-line bg-surface md:h-full md:w-[300px] md:border-r md:border-b-0 xl:w-[320px]">
        <div className="shrink-0 border-b border-line p-3">
          <div className="relative">
            <IconBuscar className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, número o mensaje..."
              aria-label="Buscar conversaciones"
              className="field pl-9"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <SpinnerCentrado padding={30} />
          ) : (
            <>
              <ChatList
                chats={chats}
                seleccionadoId={seleccionadoId}
                onSeleccionar={leadId => navigate(`/chats/${leadId}`)}
              />
              {chats.length < total && (
                <div className="p-3 text-center">
                  <button
                    type="button"
                    onClick={() => setLimit(l => l + POR_PAGINA)}
                    className="btn btn-ghost btn-sm"
                  >
                    Cargar más ({chats.length} de {total})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        {lead ? (
          // key fuerza el remount al cambiar de chat: ChatPanel guarda su
          // paginación en estado interno y no la resetea solo.
          <ChatPanel
            key={lead.id}
            lead={lead}
            onTogglePanel={hayLugarParaPanel ? () => setMostrarPanel(v => !v) : undefined}
            panelAbierto={mostrarPanel}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-[14px] text-muted">
            {chats.length === 0 ? 'No hay conversaciones todavía' : 'Elegí un chat'}
          </div>
        )}
      </div>

      {lead && mostrarPanel && hayLugarParaPanel && (
        <div className="flex shrink-0 overflow-hidden border-l border-line">
          {/* Mismo key que el chat: LeadPanel guarda el formulario en estado
              interno y sin esto arrastraría los valores del lead anterior. */}
          <LeadPanel key={lead.id} lead={lead} />
        </div>
      )}
    </div>
  )
}
