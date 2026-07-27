import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLead, useUpdateLead } from '../hooks/useLeads'
import { useToast } from '../../../components/Toast'
import Toast from '../../../components/Toast'
import StatusBadge from '../../../components/StatusBadge'
import ChatPanel from '../../chat/components/ChatPanel'
import type { Lead } from '../../../types'

const inputStyle: React.CSSProperties = {
  background: '#1c2030',
  border: '1px solid #252a3a',
  color: '#e8eaf0',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  width: '100%',
  fontFamily: 'DM Sans, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 10,
  color: '#7a8099',
  textTransform: 'uppercase',
  marginBottom: 4,
}

export default function LeadDetailPage() {
  const { id } = useParams()
  const { data: lead, isLoading } = useLead(Number(id))
  const updateLead = useUpdateLead()
  const navigate = useNavigate()
  const { toast, showToast } = useToast()

  const [form, setForm] = useState<Partial<Lead>>({})

  useEffect(() => {
    if (lead) setForm(lead)
  }, [lead])

  const handleChange = (field: keyof Lead, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleGuardar = async () => {
    await updateLead.mutateAsync({ id: lead!.id, data: form })
    showToast('Guardado ✓', 'success')
  }

  if (isLoading || !lead) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d0f14',
        }}
      >
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
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div
        style={{
          width: 280,
          minWidth: 280,
          background: '#151820',
          borderRight: '1px solid #252a3a',
          overflowY: 'auto',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <button
          onClick={() => navigate('/leads')}
          style={{
            background: 'none',
            border: 'none',
            color: '#7a8099',
            cursor: 'pointer',
            fontSize: 13,
            textAlign: 'left',
            padding: 0,
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          ← Volver
        </button>

        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#e8eaf0', marginBottom: 4 }}>
            {lead.nombre}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#7a8099', marginBottom: 8 }}>
            {lead.whatsapp}
          </div>
          <StatusBadge estado={lead.estado} />
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#7a8099', marginTop: 8 }}>
            Ingreso: {new Date(lead.fecha_ingreso).toLocaleDateString('es-AR')}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #252a3a' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={labelStyle}>Estado</div>
            <select
              value={form.estado || ''}
              onChange={e => handleChange('estado', e.target.value)}
              style={inputStyle}
            >
              <option value="ACTIVO">ACTIVO</option>
              <option value="HUMANO">HUMANO</option>
              <option value="CERRADO">CERRADO</option>
            </select>
          </div>

          <div>
            <div style={labelStyle}>Tipo de inmueble</div>
            <input
              value={form.tipo_inmueble || ''}
              onChange={e => handleChange('tipo_inmueble', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <div style={labelStyle}>Zona</div>
            <input
              value={form.zona || ''}
              onChange={e => handleChange('zona', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <div style={labelStyle}>Superficie (m²)</div>
            <input
              value={form.superficie_m2 || ''}
              onChange={e => handleChange('superficie_m2', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <div style={labelStyle}>Intención</div>
            <input
              value={form.intencion || ''}
              onChange={e => handleChange('intencion', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <div style={labelStyle}>Notas del encargado</div>
            <textarea
              value={form.notas_encargado || ''}
              onChange={e => handleChange('notas_encargado', e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={form.listo_para_cerrar || false}
              onChange={e => handleChange('listo_para_cerrar', e.target.checked)}
              id="listo_para_cerrar"
            />
            <label htmlFor="listo_para_cerrar" style={{ fontSize: 13, color: '#e8eaf0', cursor: 'pointer' }}>
              Listo para cerrar
            </label>
          </div>

          <button
            onClick={handleGuardar}
            style={{
              width: '100%',
              background: '#4f7cff',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: 10,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              marginTop: 4,
            }}
          >
            Guardar cambios
          </button>
        </div>

        <Toast toast={toast} onHide={() => {}} />
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ChatPanel lead={lead} />
      </div>
    </div>
  )
}
