import { Outlet, NavLink } from 'react-router-dom'
import { useConfig } from '../features/config/hooks/useConfig'

const links = [
  { to: '/', icon: '🏠', label: 'Dashboard' },
  { to: '/leads', icon: '👥', label: 'Leads' },
  { to: '/historial', icon: '💬', label: 'Historial' },
  { to: '/config', icon: '⚙️', label: 'Configuración' },
  { to: '/company-info', icon: '🏢', label: 'Info Empresa' },
  { to: '/campos-lead', icon: '📋', label: 'Datos del Lead' },
]

export default function Layout() {
  const { data: config, isLoading } = useConfig()

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', overflow: 'hidden' }}>
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          height: '100vh',
          position: 'sticky',
          top: 0,
          background: '#0d0f14',
          borderRight: '1px solid #252a3a',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '20px 16px',
            borderBottom: '1px solid #252a3a',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: '#4f7cff',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}
          >
            🏠
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#e8eaf0', fontFamily: 'DM Sans, sans-serif' }}>
              Panel de Leads
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#7a8099' }}>
              Aislaciones RH
            </div>
          </div>
        </div>

        <nav
          style={{
            flex: 1,
            padding: '12px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              style={({ isActive }) => ({
                padding: '10px 12px',
                borderRadius: 8,
                color: isActive ? '#4f7cff' : '#7a8099',
                background: isActive ? '#0d1a3a' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 14,
                fontFamily: 'DM Sans, sans-serif',
                textDecoration: 'none',
                transition: 'background 0.15s',
              })}
              onMouseEnter={e => {
                if (!e.currentTarget.classList.contains('active'))
                  e.currentTarget.style.background = '#1c2030'
              }}
              onMouseLeave={e => {
                if (!e.currentTarget.classList.contains('active'))
                  e.currentTarget.style.background = 'transparent'
              }}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div
          style={{
            padding: 16,
            borderTop: '1px solid #252a3a',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: '#7a8099',
          }}
        >
          {isLoading ? (
            '...'
          ) : (
            <>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: config?.bot_activo ? '#2ecc71' : '#e55353',
                }}
              />
              {config?.bot_activo ? 'Bot activo' : 'Bot pausado'}
            </>
          )}
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', background: '#0d0f14' }}>
        <Outlet />
      </main>
    </div>
  )
}
