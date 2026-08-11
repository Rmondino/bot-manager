import { useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useMensajes } from '../../historial/hooks/useMensajes'
import { useWhatsappSend } from '../hooks/useWhatsappSend'
import { useUpdateLead } from '../../leads/hooks/useLeads'
import { useToast } from '../../../components/Toast'
import Toast from '../../../components/Toast'
import StatusBadge from '../../../components/StatusBadge'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import type { Lead } from '../../../types'

interface Props {
  lead: Lead
}

export default function ChatPanel({ lead }: Props) {
  const refetchInterval = lead.estado === 'HUMANO' ? 10000 : 60000
  const { data: mensajes = [] } = useMensajes(lead.whatsapp, { refetchInterval })
  const whatsappSend = useWhatsappSend()
  const updateLead = useUpdateLead()
  const { toast, showToast } = useToast()
  const queryClient = useQueryClient()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

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
  const mensajesConAvatar = mensajes.map((m, i) => {
    const current = new Date(m.fecha_hora).getTime()
    const diff = i > 0 ? current - prevDate : Infinity
    const mostrarAvatar = i === 0 || mensajes[i - 1].origen !== m.origen || diff > 60000
    prevDate = current
    return { ...m, mostrarAvatar }
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div
        style={{
          background: '#151820',
          borderBottom: '1px solid #252a3a',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#1c2030',
              color: '#7a8099',
              fontFamily: "'DM Mono', monospace",
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {lead.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#e8eaf0' }}>{lead.nombre}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#7a8099' }}>
              {lead.whatsapp}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <StatusBadge estado={lead.estado} />
          {lead.estado === 'HUMANO' && (
            <span style={{ color: '#2ecc71', fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
              ● Chat activo
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {mensajes.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: '#7a8099',
              fontSize: 14,
              marginTop: 40,
            }}
          >
            Sin mensajes registrados
          </div>
        ) : (
          mensajesConAvatar.map(m => (
            <MessageBubble
              key={m.id}
              mensaje={m}
              mostrarAvatar={m.mostrarAvatar}
              nombreLead={lead.nombre}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {lead.estado === 'HUMANO' && (
        <div
          style={{
            background: '#151820',
            borderTop: '1px solid #252a3a',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
          }}
        >
          <ChatInput onEnviar={handleEnviar} disabled={whatsappSend.isPending} />
        </div>
      )}

      {lead.estado === 'ACTIVO' && (
        <div
          style={{
            background: '#0d1a3a',
            borderTop: '1px solid #252a3a',
            padding: 16,
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#4f7cff', fontSize: 13, marginBottom: 10, margin: 0 }}>
            🤖 El bot está activo. Pausalo para escribir manualmente.
          </p>
          <button
            onClick={() => updateLead.mutateAsync({ id: lead.id, data: { estado: 'HUMANO' } })}
            style={{
              background: '#4f7cff',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '8px 18px',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            Pausar y tomar control
          </button>
        </div>
      )}

      {lead.estado === 'CERRADO' && (
        <div
          style={{
            background: '#1c2030',
            borderTop: '1px solid #252a3a',
            padding: 16,
            textAlign: 'center',
            color: '#7a8099',
            fontSize: 13,
          }}
        >
          🔒 Lead cerrado · Solo lectura
        </div>
      )}

      <Toast toast={toast} onHide={() => {}} />
    </div>
  )
}
