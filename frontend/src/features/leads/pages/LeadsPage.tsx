import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeads, useUpdateLead, useDeleteLead } from '../hooks/useLeads'
import LeadsTable from '../components/LeadsTable'
import Kpi from '../../../components/Kpi'
import { SpinnerCentrado } from '../../../components/Spinner'
import api from '../../../lib/axios'

const filtros = ['TODOS', 'ACTIVO', 'HUMANO', 'CERRADO'] as const

export default function LeadsPage() {
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS')
  const [loadingWhatsapp, setLoadingWhatsapp] = useState<string | null>(null)

  const { data: leads = [], isLoading } = useLeads(
    filtroEstado !== 'TODOS' ? filtroEstado : undefined,
  )
  const updateLead = useUpdateLead()
  const deleteLead = useDeleteLead()
  const navigate = useNavigate()

  const total = leads.length
  const activos = leads.filter(l => l.estado === 'ACTIVO').length
  const humano = leads.filter(l => l.estado === 'HUMANO').length
  const listoParaCerrar = leads.filter(l => l.listo_para_cerrar).length

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total" valor={total} />
        <Kpi label="Activos" valor={activos} punto="bg-ok" tono="text-ok" />
        <Kpi label="Humano" valor={humano} punto="bg-info" tono="text-info" />
        <Kpi label="Listo cerrar" valor={listoParaCerrar} punto="bg-hot" destacado />
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
        {filtros.map(f => {
          const activo = f === filtroEstado
          return (
            <button
              key={f}
              type="button"
              aria-pressed={activo}
              onClick={() => setFiltroEstado(f)}
              className={`btn ${activo ? 'btn-primary' : 'btn-ghost'}`}
            >
              {f === 'TODOS' ? 'Todos' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <SpinnerCentrado />
      ) : leads.length === 0 ? (
        <div className="card p-10 text-center text-[14px] text-muted">
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
          onEliminar={async lead => {
            const { data } = await api.get<{ total: number }>(
              `/leads/${lead.id}/mensajes/count`,
            )
            const msg =
              data.total > 0
                ? `¿Eliminar a ${lead.nombre}? Se van a borrar también sus ${data.total} mensajes. Esto no se puede deshacer.`
                : `¿Eliminar a ${lead.nombre}? Esto no se puede deshacer.`
            if (!confirm(msg)) return
            setLoadingWhatsapp(lead.whatsapp)
            await deleteLead.mutateAsync(lead.id)
            setLoadingWhatsapp(null)
          }}
          onRowClick={id => navigate(`/leads/${id}`)}
          loadingWhatsapp={loadingWhatsapp}
        />
      )}
    </div>
  )
}
