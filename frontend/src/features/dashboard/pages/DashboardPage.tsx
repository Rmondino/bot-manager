import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeads } from '../../leads/hooks/useLeads'
import { useMensajes } from '../../chat/hooks/useMensajes'
import { useConfig, useUpdateConfig } from '../../config/hooks/useConfig'
import Kpi from '../../../components/Kpi'
import StatusBadge, { ListoParaCerrarBadge } from '../../../components/StatusBadge'
import { IconAlerta, IconCheck } from '../../../components/icons'

/** A partir de acá un lead sin respuesta se marca como frío. */
const MINUTOS_FRIO = 60

const origenBadge: Record<string, { clases: string; sigla: string }> = {
  LEAD: { clases: 'bg-ok-bg text-ok', sigla: 'LEAD' },
  BOT: { clases: 'bg-info-bg text-info', sigla: 'BOT' },
  HUMANO: { clases: 'bg-idle-bg text-idle', sigla: 'RH' },
}

export default function DashboardPage() {
  const { data: leads = [] } = useLeads(undefined, { refetchInterval: 30000 })
  // Solo los últimos 10: antes se descargaba la tabla entera cada 30 segundos
  // para quedarse con eso mismo.
  const { data: mensajesPage } = useMensajes(
    { limit: 10, orden: 'desc' },
    { refetchInterval: 30000 },
  )
  const { data: config } = useConfig()
  const updateConfig = useUpdateConfig()
  const navigate = useNavigate()

  const total = leads.length
  const activos = leads.filter(l => l.estado === 'ACTIVO').length
  const humano = leads.filter(l => l.estado === 'HUMANO').length
  const cerrados = leads.filter(l => l.estado === 'CERRADO').length
  const listoParaCerrar = leads.filter(l => l.listo_para_cerrar).length
  const seguimientosTotales = leads.reduce((s, l) => s + l.seguimientos, 0)

  // Ya vienen ordenados desc desde el servidor.
  const ultimosMensajes = mensajesPage?.items ?? []

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

  const minutosDesde = (fecha: string | null) =>
    fecha === null ? null : Math.floor((Date.now() - new Date(fecha).getTime()) / 60000)

  const haceCuanto = (fecha: string | null) => {
    const min = minutosDesde(fecha)
    if (min === null) return '—'
    if (min < 60) return `hace ${min} min`
    return `hace ${Math.floor(min / 60)} hs`
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      {config && !config.bot_activo && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-danger-line bg-danger-bg px-4 py-3 text-[13.5px] text-danger">
          <IconAlerta className="size-[18px] shrink-0" />
          El bot está pausado — los mensajes entrantes no serán respondidos
          <button
            type="button"
            onClick={() => updateConfig.mutateAsync({ bot_activo: true })}
            className="btn btn-sm ml-auto bg-danger text-white hover:bg-danger/90"
          >
            Activar bot
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Total" valor={total} />
        <Kpi label="Activos" valor={activos} punto="bg-ok" tono="text-ok" />
        <Kpi label="Humano" valor={humano} punto="bg-info" tono="text-info" />
        <Kpi label="Listo cerrar" valor={listoParaCerrar} punto="bg-hot" destacado />
        <Kpi label="Cerrados" valor={cerrados} punto="bg-idle" tono="text-idle" />
        <Kpi label="Seguimientos" valor={seguimientosTotales} tono="text-muted" />
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1.5fr_1fr]">
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Leads que necesitan atención</h2>
            {leadsAtencion.length > 0 && (
              <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-subtle">
                {leadsAtencion.length}
              </span>
            )}
            <button
              type="button"
              onClick={() => navigate('/leads')}
              className="btn btn-sm btn-quiet ml-auto"
            >
              Ver todos →
            </button>
          </div>

          {leadsAtencion.length === 0 ? (
            <div className="flex items-center justify-center gap-2 p-8 text-[14px] text-ok">
              <IconCheck className="size-4" />
              Sin leads pendientes de atención
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="tabla">
                <thead>
                  <tr>
                    <th className="th">Nombre</th>
                    <th className="th">Whatsapp</th>
                    <th className="th">Estado</th>
                    <th className="th">Hace cuánto</th>
                  </tr>
                </thead>
                <tbody>
                  {leadsAtencion.map(l => {
                    const min = minutosDesde(l.ultimo_mensaje)
                    const frio = min !== null && min >= MINUTOS_FRIO
                    return (
                      <tr
                        key={l.id}
                        onClick={() => navigate(`/leads/${l.id}`)}
                        className={`row-link ${l.listo_para_cerrar ? 'bg-hot-row' : ''}`}
                      >
                        <td className="td">
                          <span className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                            {l.nombre}
                            {l.listo_para_cerrar && <ListoParaCerrarBadge compacto />}
                          </span>
                        </td>
                        <td className="td font-mono text-[12.5px] whitespace-nowrap text-muted">
                          {l.whatsapp}
                        </td>
                        <td className="td">
                          <StatusBadge estado={l.estado} />
                        </td>
                        <td
                          className={`td font-mono text-[12.5px] whitespace-nowrap ${
                            frio ? 'font-medium text-hot' : 'text-muted'
                          }`}
                        >
                          {haceCuanto(l.ultimo_mensaje)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Actividad reciente</h2>
            <button
              type="button"
              onClick={() => navigate('/chats')}
              className="btn btn-sm btn-quiet ml-auto"
            >
              Ver chats →
            </button>
          </div>

          {ultimosMensajes.length === 0 ? (
            <p className="p-8 text-center text-[14px] text-muted">Sin actividad todavía</p>
          ) : (
            <ul className="flex flex-col">
              {ultimosMensajes.map(m => {
                const o = origenBadge[m.origen] ?? origenBadge.LEAD
                return (
                  <li key={m.id} className="flex gap-3 border-b border-line px-4 py-3 last:border-b-0">
                    <span
                      className={`flex size-[26px] shrink-0 items-center justify-center rounded-sm text-[10px] font-bold ${o.clases}`}
                    >
                      {o.sigla}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[13.5px] leading-snug text-ink">
                        {m.mensaje}
                      </p>
                      <span className="mt-1 block font-mono text-[11px] text-subtle">
                        {m.lead_whatsapp} ·{' '}
                        {new Date(m.fecha_hora).toLocaleString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
