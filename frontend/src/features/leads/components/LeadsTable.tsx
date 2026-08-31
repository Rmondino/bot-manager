import StatusBadge, { ListoParaCerrarBadge } from '../../../components/StatusBadge'
import Spinner from '../../../components/Spinner'
import { useCamposLead } from '../../campos_lead/hooks/useCamposLead'
import type { Lead } from '../../../types'

/** Cuántos campos configurados se resumen en la columna de la lista. */
const CAMPOS_EN_LISTA = 2

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

export default function LeadsTable({
  leads,
  onPausar,
  onActivar,
  onRowClick,
  onEliminar,
  loadingWhatsapp,
}: Props) {
  const { data: campos = [] } = useCamposLead()
  // Los primeros campos activos por orden. Antes era tipo_inmueble · zona fijo.
  const camposResumen = campos.filter(c => c.activo).slice(0, CAMPOS_EN_LISTA)
  const tituloResumen = camposResumen.map(c => c.etiqueta).join(' · ') || 'Datos'

  return (
    <div className="card overflow-x-auto">
      <table className="tabla">
        <thead>
          <tr>
            <th className="th">Nombre</th>
            <th className="th">Whatsapp</th>
            <th className="th">Estado</th>
            <th className="th">{tituloResumen}</th>
            <th className="th">Último Msg</th>
            <th className="th text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {leads.map(lead => {
            const cargando = loadingWhatsapp === lead.whatsapp
            return (
              <tr
                key={lead.id}
                onClick={() => onRowClick(lead.id)}
                className={`row-link ${lead.listo_para_cerrar ? 'bg-hot-row' : ''}`}
              >
                <td className="td">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">{lead.nombre}</span>
                    {lead.listo_para_cerrar && <ListoParaCerrarBadge compacto />}
                  </span>
                </td>
                <td className="td font-mono text-[12.5px] whitespace-nowrap text-muted">
                  {lead.whatsapp}
                </td>
                <td className="td">
                  <StatusBadge estado={lead.estado} />
                </td>
                <td className="td text-muted">
                  {camposResumen
                    .map(c => lead.datos?.[c.clave])
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </td>
                <td className="td font-mono text-[12.5px] whitespace-nowrap text-muted">
                  {lead.ultimo_mensaje ? formatDate(lead.ultimo_mensaje) : '—'}
                </td>
                <td className="td" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    {cargando ? (
                      <Spinner size={16} />
                    ) : (
                      <>
                        {lead.estado === 'ACTIVO' && (
                          <button
                            type="button"
                            onClick={() => onPausar(lead.whatsapp)}
                            className="btn btn-sm border-info-line bg-info-bg text-info hover:bg-primary-soft"
                          >
                            Pausar
                          </button>
                        )}
                        {lead.estado === 'HUMANO' && (
                          <button
                            type="button"
                            onClick={() => onActivar(lead.whatsapp)}
                            className="btn btn-sm border-ok-line bg-ok-bg text-ok hover:bg-ok-line"
                          >
                            Activar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEliminar(lead)}
                          className="btn btn-sm btn-danger"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
