import { useState, useEffect } from 'react'
import { useMensajes } from '../hooks/useMensajes'

const POR_PAGINA = 50

const badgeOrigen: Record<string, { bg: string; color: string }> = {
  LEAD: { bg: '#0d2e1a', color: '#2ecc71' },
  BOT: { bg: '#0d1a3a', color: '#4f7cff' },
  HUMANO: { bg: '#2e2200', color: '#f0b429' },
}

export default function HistorialPage() {
  const [busqueda, setBusqueda] = useState('')
  const [busquedaDebounced, setBusquedaDebounced] = useState('')
  const [limit, setLimit] = useState(POR_PAGINA)

  // Debounce: sin esto cada tecla dispara un request al servidor.
  useEffect(() => {
    const t = setTimeout(() => {
      setBusquedaDebounced(busqueda)
      setLimit(POR_PAGINA)
    }, 300)
    return () => clearTimeout(t)
  }, [busqueda])

  // La búsqueda y el orden los resuelve el servidor: antes se descargaba la
  // tabla entera y se filtraba acá, así que "Cargar más" sobre una búsqueda
  // solo miraba lo ya descargado.
  const { data, isLoading } = useMensajes({
    q: busquedaDebounced,
    limit,
    orden: 'desc',
  })

  const mensajesMostrados = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <div style={{ padding: 24, color: '#e8eaf0' }}>
      <input
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        placeholder="Buscar por número o texto del mensaje..."
        style={{
          background: '#151820',
          border: '1px solid #252a3a',
          color: '#e8eaf0',
          borderRadius: 8,
          padding: '8px 14px',
          fontFamily: "'DM Mono', monospace",
          fontSize: 13,
          marginBottom: 16,
          width: 300,
          outline: 'none',
        }}
        onFocus={e => (e.target.style.borderColor = '#4f7cff')}
        onBlur={e => (e.target.style.borderColor = '#252a3a')}
      />

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
              {['Origen', 'Whatsapp', 'Mensaje', 'Fecha y hora'].map(h => (
                <th
                  key={h}
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    color: '#7a8099',
                    textTransform: 'uppercase',
                    padding: '12px 16px',
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
            {isLoading ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 40 }}>
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
                </td>
              </tr>
            ) : mensajesMostrados.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    textAlign: 'center',
                    color: '#7a8099',
                    padding: 40,
                    fontSize: 14,
                  }}
                >
                  No se encontraron mensajes
                </td>
              </tr>
            ) : (
              mensajesMostrados.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #252a3a' }}>
                  <td style={{ padding: '12px 16px' }}>
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
                  <td
                    style={{
                      padding: '12px 16px',
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 13,
                      color: '#7a8099',
                    }}
                  >
                    {m.lead_whatsapp}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: 13,
                      color: '#7a8099',
                      maxWidth: 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.mensaje.length > 100 ? m.mensaje.slice(0, 100) + '...' : m.mensaje}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11,
                      color: '#7a8099',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {new Date(m.fecha_hora).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mensajesMostrados.length < total && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            onClick={() => setLimit(l => l + POR_PAGINA)}
            style={{
              background: '#151820',
              border: '1px solid #252a3a',
              color: '#7a8099',
              borderRadius: 8,
              padding: '8px 20px',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            Cargar más ({mensajesMostrados.length} de {total})
          </button>
        </div>
      )}
    </div>
  )
}
