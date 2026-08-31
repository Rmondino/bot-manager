import { useState, useEffect, useCallback } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useConfig } from '../features/config/hooks/useConfig'
import {
  IconDashboard,
  IconLeads,
  IconChats,
  IconConfig,
  IconEmpresa,
  IconCampos,
  IconMarca,
  IconMenu,
  IconCerrar,
} from './icons'

type Link = {
  to: string
  label: string
  Icono: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement
}

const supervision: Link[] = [
  { to: '/', label: 'Dashboard', Icono: IconDashboard },
  { to: '/leads', label: 'Leads', Icono: IconLeads },
  { to: '/chats', label: 'Chats', Icono: IconChats },
]

const ajustes: Link[] = [
  { to: '/config', label: 'Configuración', Icono: IconConfig },
  { to: '/company-info', label: 'Info Empresa', Icono: IconEmpresa },
  { to: '/campos-lead', label: 'Datos del Lead', Icono: IconCampos },
]

/** Título del header por ruta. El detalle de lead cuelga de /leads. */
function tituloDe(pathname: string) {
  if (pathname === '/') return 'Dashboard'
  if (pathname.startsWith('/leads/')) return 'Ficha del lead'
  const todos = [...supervision, ...ajustes]
  return todos.find(l => l.to !== '/' && pathname.startsWith(l.to))?.label ?? 'Panel de Leads'
}

function itemClases(isActive: boolean) {
  return [
    'relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] transition-colors',
    isActive
      ? 'bg-nav-active font-medium text-white'
      : 'text-nav-text hover:bg-nav-surface hover:text-white',
  ].join(' ')
}

/**
 * @param colapsable Entre 1024 y 1280px el sidebar se reduce a un riel de
 *   iconos. El drawer del mobile siempre muestra las etiquetas.
 */
function Navegacion({
  colapsable,
  onNavegar,
}: {
  colapsable: boolean
  onNavegar?: () => void
}) {
  // Con el riel activo la etiqueta solo aparece a partir de xl.
  const label = colapsable ? 'hidden xl:inline' : 'inline'

  const render = (l: Link) => (
    <NavLink
      key={l.to}
      to={l.to}
      end={l.to === '/'}
      onClick={onNavegar}
      title={l.label}
      className={({ isActive }) => itemClases(isActive)}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              aria-hidden
              className="absolute top-2 -left-2.5 bottom-2 w-[3px] rounded-r-[3px] bg-primary-on-dark"
            />
          )}
          <l.Icono className={`size-[18px] shrink-0 ${isActive ? 'text-primary-on-dark' : ''}`} />
          <span className={label}>{l.label}</span>
        </>
      )}
    </NavLink>
  )

  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2.5">
      {supervision.map(render)}
      <div
        className={`px-2.5 pt-4 pb-1.5 font-mono text-[10px] tracking-[0.1em] text-nav-label uppercase ${
          colapsable ? 'hidden xl:block' : 'block'
        }`}
      >
        Configuración
      </div>
      {colapsable && <div className="mx-2.5 my-2 h-px bg-nav-line xl:hidden" />}
      {ajustes.map(render)}
    </nav>
  )
}

function Marca({ colapsable }: { colapsable: boolean }) {
  return (
    <div className="flex items-center gap-3 border-b border-nav-line px-4 py-[15px]">
      <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-[#3d6bee] to-primary text-white">
        <IconMarca className="size-[19px]" />
      </div>
      <div className={`min-w-0 ${colapsable ? 'hidden xl:block' : 'block'}`}>
        <div className="text-[14px] leading-tight font-semibold text-white">Panel de Leads</div>
        <div className="font-mono text-[11px] text-nav-text">Aislaciones RH</div>
      </div>
    </div>
  )
}

export default function Layout() {
  const { data: config, isLoading } = useConfig()
  const { pathname } = useLocation()
  const [drawer, setDrawer] = useState(false)

  // El drawer se cierra con Escape, con el backdrop, con su botón de cerrar y
  // al tocar un ítem (onNavegar). No hace falta un efecto sobre la ruta.
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setDrawer(false)
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const botActivo = config?.bot_activo

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <aside className="hidden shrink-0 flex-col border-r border-nav-line bg-nav lg:flex lg:w-[68px] xl:w-[236px]">
        <Marca colapsable />
        <Navegacion colapsable />
      </aside>

      {drawer && (
        <div
          className="fixed inset-0 z-200 flex lg:hidden"
          onClick={e => e.target === e.currentTarget && setDrawer(false)}
        >
          <div className="absolute inset-0 bg-ink/50" />
          <aside className="relative flex w-[236px] flex-col bg-nav shadow-pop">
            <button
              type="button"
              onClick={() => setDrawer(false)}
              aria-label="Cerrar menú"
              className="absolute top-4 right-3 cursor-pointer rounded-md p-1.5 text-nav-text transition-colors hover:bg-nav-surface hover:text-white"
            >
              <IconCerrar className="size-4" />
            </button>
            <Marca colapsable={false} />
            <Navegacion colapsable={false} onNavegar={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-4 border-b border-line bg-surface px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Abrir menú"
            className="btn btn-ghost -ml-1 p-2 lg:hidden"
          >
            <IconMenu className="size-[18px]" />
          </button>

          <div className="min-w-0">
            <span className="block font-mono text-[11px] text-subtle">Aislaciones RH</span>
            <h1 className="truncate text-[19px] leading-tight font-semibold tracking-[-0.01em]">
              {tituloDe(pathname)}
            </h1>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {!isLoading && (
              <span
                className={`badge ${
                  botActivo
                    ? 'border-ok-line bg-ok-bg text-ok'
                    : 'border-danger-line bg-danger-bg text-danger'
                }`}
              >
                <span className="badge-dot" />
                {botActivo ? 'Bot activo' : 'Bot pausado'}
              </span>
            )}
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-info-line bg-primary-soft text-[12.5px] font-semibold text-primary">
              RH
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
