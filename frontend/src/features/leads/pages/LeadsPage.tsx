import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeads, useUpdateLead } from '../hooks/useLeads'
import LeadsTable from '../components/LeadsTable'

const filtros = ['TODOS', 'ACTIVO', 'HUMANO', 'CERRADO'] as const

const cardStyle: React.CSSProperties = {
  background: '#151820',
  border: '1px solid #252a3a',
  borderRadius: 12,
  padding: 16,
}

const labelStyle: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 11,
  color: '#7a8099',
  textTransform: 'uppercase',
  marginBottom: 6,
}

const valorStyle: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 28,
  fontWeight: 600,
}

export default function LeadsPage() {
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS')
  const [loadingWhatsapp, setLoadingWhatsapp] = useState<string | null>(null)

  const { data: leads = [], isLoading } = useLeads(
    filtroEstado !== 'TODOS' ? filtroEstado : undefined,
  )
  const updateLead = useUpdateLead()
  const navigate = useNavigate()

  const total = leads.length
  const activos = leads.filter(l => l.estado === 'ACTIVO').length
  const humano = leads.filter(l => l.estado === 'HUMANO').length
  const listoParaCerrar = leads.filter(l => l.listo_para_cerrar).length

  return (
    <div style={{ padding: 24, color: '#e8eaf0' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div style={cardStyle}>
          <div style={labelStyle}>Total</div>
          <div style={{ ...valorStyle, color: '#e8eaf0' }}>{total}</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Activos</div>
          <div style={{ ...valorStyle, color: '#2ecc71' }}>{activos}</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Humano</div>
          <div style={{ ...valorStyle, color: '#4f7cff' }}>{humano}</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Listo cerrar</div>
          <div style={{ ...valorStyle, color: '#f0b429' }}>{listoParaCerrar}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {filtros.map(f => (
          <button
            key={f}
            onClick={() => setFiltroEstado(f)}
            style={{
              background: f === filtroEstado ? '#4f7cff' : '#151820',
              color: f === filtroEstado ? '#fff' : '#7a8099',
              border: f === filtroEstado ? 'none' : '1px solid #252a3a',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {f === 'TODOS' ? 'Todos' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <span
            style={{
              display: 'inline-block',
              width: 24,
              height: 24,
              border: '2px solid #252a3a',
              borderTopColor: '#4f7cff',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
            }}
          />
        </div>
      ) : leads.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#7a8099', padding: 40, fontSize: 14 }}>
          No hay leads en este estado
        </div>
      ) : (
        <LeadsTable
          leads={leads}
          onPausar={async wa => {
            setLoadingWhatsapp(wa)
            const lead = leads.find(l => l.whatsapp === wa)
            if (lead) {
              await updateLead.mutateAsync({ id: lead.id, data: { estado: 'HUMANO' } })
            }
            setLoadingWhatsapp(null)
          }}
          onActivar={async wa => {
            setLoadingWhatsapp(wa)
            const lead = leads.find(l => l.whatsapp === wa)
            if (lead) {
              await updateLead.mutateAsync({ id: lead.id, data: { estado: 'ACTIVO' } })
            }
            setLoadingWhatsapp(null)
          }}
          onRowClick={id => navigate(`/leads/${id}`)}
          loadingWhatsapp={loadingWhatsapp}
        />
      )}
    </div>
  )
}
