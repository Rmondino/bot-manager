import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeads } from '../../leads/hooks/useLeads'
import { useMensajes } from '../../historial/hooks/useMensajes'
import { useConfig, useUpdateConfig } from '../../config/hooks/useConfig'

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

const valStyle: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 28,
  fontWeight: 600,
}

const badgeOrigen: Record<string, { bg: string; color: string }> = {
  LEAD: { bg: '#0d2e1a', color: '#2ecc71' },
  BOT: { bg: '#0d1a3a', color: '#4f7cff' },
  HUMANO: { bg: '#2e2200', color: '#f0b429' },
}

const tdStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: 13,
  fontFamily: "'DM Mono', monospace",
}

export default function DashboardPage() {
  const { data: leads = [] } = useLeads(undefined, { refetchInterval: 30000 })
  const { data: mensajes = [] } = useMensajes(undefined, { refetchInterval: 30000 })
  const { data: config } = useConfig()
  const updateConfig = useUpdateConfig()
  const navigate = useNavigate()

  const total = leads.length
  const activos = leads.filter(l => l.estado === 'ACTIVO').length
  const humano = leads.filter(l => l.estado === 'HUMANO').length
  const cerrados = leads.filter(l => l.estado === 'CERRADO').length
  const seguimientosTotales = leads.reduce((s, l) => s + l.seguimientos, 0)

  const ultimosMensajes = useMemo(
    () => mensajes.slice(-10).reverse(),
    [mensajes],
  )

  const leadsAtencion = useMemo(
    () =>
      leads
        .filter(l => l.estado === 'HUMANO')
        .sort((a, b) => {
          const da = a.ultimo_mensaje ? new Date(a.ultimo_mensaje).getTime() : 0
          const db = b.ultimo_mensaje ? new Date(b.ultimo_mensaje).getTime() : 0
          return da - db
        })
        .slice(0, 5),
    [leads],
  )

  const haceCuanto = (fecha: string | null) => {
    if (!fecha) return '—'
    const diff = Date.now() - new Date(fecha).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 60) return `hace ${min} min`
    return `hace ${Math.floor(min / 60)} hs`
  }

  return (
    <div style={{ padding: 24, color: '#e8eaf0' }}>
      {config && !config.bot_activo && (
        <div
          style={{
            background: '#2e0d0d',
            border: '1px solid #e55353',
            borderRadius: 10,
            padding: '12px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ color: '#e55353', fontSize: 13 }}>
            ⚠️ El bot está pausado — los mensajes entrantes no serán respondidos
          </span>
          <button
            onClick={() => updateConfig.mutateAsync({ bot_activo: true })}
            style={{
              background: '#2e0d0d',
              border: '1px solid #e55353',
              color: '#e55353',
              borderRadius: 8,
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            Activar bot
          </button>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          { label: 'Total', val: total, color: '#e8eaf0' },
          { label: 'Activos', val: activos, color: '#2ecc71' },
          { label: 'Humano', val: humano, color: '#4f7cff' },
          { label: 'Cerrados', val: cerrados, color: '#e55353' },
          { label: 'Seguimientos', val: seguimientosTotales, color: '#f0b429' },
        ].map(s => (
          <div key={s.label} style={cardStyle}>
            <div style={labelStyle}>{s.label}</div>
            <div style={{ ...valStyle, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: '#e8eaf0',
            fontFamily: 'DM Sans, sans-serif',
            marginBottom: 12,
          }}
        >
          Actividad reciente
        </div>
        <div
          style={{
            background: '#151820',
            border: '1px solid #252a3a',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1c2030', borderBottom: '1px solid #252a3a' }}>
                {['Origen', 'Whatsapp', 'Mensaje', 'Fecha'].map(h => (
                  <th
                    key={h}
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11,
                      color: '#7a8099',
                      textTransform: 'uppercase',
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontWeight: 500,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ultimosMensajes.map(m => (
                <tr
                  key={m.id}
                  style={{ borderBottom: '1px solid #252a3a' }}
                >
                  <td style={tdStyle}>
                    <span
                      style={{
                        background: badgeOrigen[m.origen].bg,
                        color: badgeOrigen[m.origen].color,
                        borderRadius: 4,
                        padding: '2px 8px',
                        fontSize: 11,
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      {m.origen}
                    </span>
                  </td>
                  <td style={tdStyle}>{m.lead_whatsapp}</td>
                  <td style={{ ...tdStyle, color: '#7a8099', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.mensaje.length > 80 ? m.mensaje.slice(0, 80) + '...' : m.mensaje}
                  </td>
                  <td style={{ ...tdStyle, color: '#7a8099' }}>
                    {new Date(m.fecha_hora).toLocaleString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: '#e8eaf0',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            Leads que necesitan atención
          </div>
          <button
            onClick={() => navigate('/leads')}
            style={{
              color: '#4f7cff',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            Ver todos →
          </button>
        </div>
        <div
          style={{
            background: '#151820',
            border: '1px solid #252a3a',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {leadsAtencion.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: '#2ecc71',
                padding: 24,
                fontSize: 14,
              }}
            >
              ✓ Sin leads pendientes de atención
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1c2030', borderBottom: '1px solid #252a3a' }}>
                  {['Nombre', 'Whatsapp', 'Hace cuánto'].map(h => (
                    <th
                      key={h}
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 11,
                        color: '#7a8099',
                        textTransform: 'uppercase',
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontWeight: 500,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leadsAtencion.map(l => (
                  <tr
                    key={l.id}
                    onClick={() => navigate(`/leads/${l.id}`)}
                    style={{
                      cursor: 'pointer',
                      borderBottom: '1px solid #252a3a',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1c2030')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ ...tdStyle, color: '#e8eaf0', fontFamily: 'DM Sans, sans-serif' }}>
                      {l.nombre}
                    </td>
                    <td style={tdStyle}>{l.whatsapp}</td>
                    <td style={{ ...tdStyle, color: '#7a8099' }}>
                      {haceCuanto(l.ultimo_mensaje)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
