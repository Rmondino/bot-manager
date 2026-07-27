import { Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div style={{ padding: 24, color: '#e8eaf0', background: '#0d0f14', minHeight: '100vh' }}>
      <Outlet />
    </div>
  )
}
