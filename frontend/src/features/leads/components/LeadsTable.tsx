import StatusBadge from '../../../components/StatusBadge'
import type { Lead } from '../../../types'

interface Props {
  leads: Lead[]
  onPausar: (whatsapp: string) => void
  onActivar: (whatsapp: string) => void
  onRowClick: (id: number) => void
  onEliminar: (lead: Lead) => void
  loadingWhatsapp: string | null
}

function formatDate(dt: string | null | undefined) {
  if (!dt) return null
  const d = new Date(dt)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm} ${hh}:${min}`
}

const thStyle: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 11,
  color: '#7a8099',
  textTransform: 'uppercase',
  padding: '12px 16px',
  textAlign: 'left',
  fontWeight: 500,
}

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 13,
}

const accionBtnStyle: React.CSSProperties = {
  borderRadius: 6,
  padding: '5px 12px',
  fontSize: 12,
  cursor: 'pointer',
  fontFamily: 'DM Sans, sans-serif',
}

export default function LeadsTable({ leads, onPausar, onActivar, onRowClick, onEliminar, loadingWhatsapp }: Props) {
  return (
    <div style={{ background: '#151820', border: '1px solid #252a3a', borderRadius: 12, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#1c2030', borderBottom: '1px solid #252a3a' }}>
            <th style={thStyle}>Nombre</th>
            <th style={thStyle}>Whatsapp</th>
            <th style={thStyle}>Estado</th>
            <th style={thStyle}>Inmueble</th>
            <th style={thStyle}>Último Msg</th>
            <th style={thStyle}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {leads.map(lead => (
            <tr
              key={lead.id}
              onClick={() => onRowClick(lead.id)}
              style={{ cursor: 'pointer', transition: 'background 0.15s', borderBottom: '1px solid #252a3a' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1c2030')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <td style={tdStyle}>
                <span style={{ fontWeight: 500, color: '#e8eaf0', fontFamily: 'DM Sans, sans-serif' }}>
                  {lead.nombre}
                </span>
                {lead.listo_para_cerrar && (
                  <span
                    style={{
                      background: '#2e2200',
                      color: '#f0b429',
                      borderRadius: 5,
                      padding: '2px 7px',
                      fontSize: 11,
                      fontFamily: "'DM Mono', monospace",
                      marginLeft: 6,
                    }}
                  >
                    🔥 Listo
                  </span>
                )}
              </td>
              <td style={{ ...tdStyle, fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#7a8099' }}>
                {lead.whatsapp}
              </td>
              <td style={tdStyle}>
                <StatusBadge estado={lead.estado} />
              </td>
              <td style={{ ...tdStyle, fontSize: 13, color: '#7a8099', fontFamily: 'DM Sans, sans-serif' }}>
                {[lead.tipo_inmueble, lead.zona].filter(Boolean).join(' · ') || '—'}
              </td>
              <td style={{ ...tdStyle, fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#7a8099' }}>
                {lead.ultimo_mensaje ? formatDate(lead.ultimo_mensaje) : '—'}
              </td>
              <td style={tdStyle} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {lead.estado === 'ACTIVO' && loadingWhatsapp !== lead.whatsapp && (
                  <button
                    onClick={() => onPausar(lead.whatsapp)}
                    style={{
                      ...accionBtnStyle,
                      background: '#0d1a3a',
                      color: '#4f7cff',
                      border: '1px solid #0d1a3a',
                    }}
                  >
                    Pausar
                  </button>
                )}
                {lead.estado === 'HUMANO' && loadingWhatsapp !== lead.whatsapp && (
                  <button
                    onClick={() => onActivar(lead.whatsapp)}
                    style={{
                      ...accionBtnStyle,
                      background: '#0d2e1a',
                      color: '#2ecc71',
                      border: '1px solid #0d2e1a',
                    }}
                  >
                    Activar
                  </button>
                )}
                {loadingWhatsapp !== lead.whatsapp && (
                  <button
                    onClick={() => onEliminar(lead)}
                    style={{
                      ...accionBtnStyle,
                      background: 'transparent',
                      color: '#e55353',
                      border: '1px solid #2e0d0d',
                    }}
                  >
                    Eliminar
                  </button>
                )}
                {loadingWhatsapp === lead.whatsapp && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 16,
                      height: 16,
                      border: '2px solid #252a3a',
                      borderTopColor: '#4f7cff',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite',
                    }}
                  />
                )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
