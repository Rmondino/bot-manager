import { useState, useEffect } from 'react'
import { useUpdateLead } from '../hooks/useLeads'
import { useCamposLead } from '../../campos_lead/hooks/useCamposLead'
import { useToast } from '../../../components/Toast'
import Toast from '../../../components/Toast'
import StatusBadge from '../../../components/StatusBadge'
import Spinner from '../../../components/Spinner'
import type { Lead } from '../../../types'

interface Props {
  lead: Lead
}

/**
 * Datos del lead: encabezado, estado, campos configurables y guardado.
 *
 * Vive aparte porque lo usan la ficha del lead y la seccion Chats. Guarda el
 * formulario en estado interno, asi que hay que montarlo con key={lead.id}
 * para que no arrastre valores al cambiar de lead.
 */
export default function LeadPanel({ lead }: Props) {
  const { data: campos = [] } = useCamposLead()
  const updateLead = useUpdateLead()
  const { toast, showToast } = useToast()

  const [form, setForm] = useState<Partial<Lead>>({})

  useEffect(() => {
    if (lead) setForm(lead)
  }, [lead])

  // Los campos de calificacion no son columnas: vienen de la config y sus
  // valores viven en lead.datos.
  const camposActivos = campos.filter(c => c.activo)
  const camposArchivados = campos.filter(
    c => !c.activo && (form.datos?.[c.clave] ?? '') !== '',
  )

  const valorDe = (clave: string) => form.datos?.[clave] ?? ''

  const handleChange = (field: keyof Lead, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleDato = (clave: string, value: string) => {
    setForm(prev => ({ ...prev, datos: { ...(prev.datos ?? {}), [clave]: value } }))
  }

  const handleGuardar = async () => {
    await updateLead.mutateAsync({ id: lead.id, data: form })
    showToast('Guardado ✓', 'success')
  }

  return (
    <aside className="flex w-full flex-col gap-4 overflow-y-auto bg-surface p-5 xl:w-[300px] xl:min-w-[300px]">
      <div>
        <h2 className="text-[17px] leading-tight font-semibold text-ink">{lead.nombre}</h2>
        <p className="mt-0.5 font-mono text-[12.5px] text-subtle">{lead.whatsapp}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <StatusBadge estado={lead.estado} />
          <span className="font-mono text-[11.5px] text-subtle">
            Ingreso: {new Date(lead.fecha_ingreso).toLocaleDateString('es-AR')}
          </span>
        </div>
      </div>

      <div className="h-px bg-line" />

      <div className="flex flex-col gap-3.5">
        <div>
          <label className="lbl" htmlFor="lead-estado">
            Estado
          </label>
          <select
            id="lead-estado"
            value={form.estado || ''}
            onChange={e => handleChange('estado', e.target.value)}
            className="field"
          >
            <option value="ACTIVO">ACTIVO</option>
            <option value="HUMANO">HUMANO</option>
            <option value="CERRADO">CERRADO</option>
          </select>
        </div>

        {camposActivos.map(campo => {
          const inputId = `campo-${campo.id}`
          return (
            <div key={campo.id}>
              <label className="lbl" htmlFor={inputId}>
                {campo.etiqueta}
              </label>
              {campo.tipo === 'opciones' ? (
                <select
                  id={inputId}
                  value={valorDe(campo.clave)}
                  onChange={e => handleDato(campo.clave, e.target.value)}
                  className="field"
                >
                  <option value="">—</option>
                  {(campo.opciones ?? '')
                    .split(',')
                    .map(o => o.trim())
                    .filter(Boolean)
                    .map(o => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                </select>
              ) : campo.tipo === 'textarea' ? (
                <textarea
                  id={inputId}
                  value={valorDe(campo.clave)}
                  onChange={e => handleDato(campo.clave, e.target.value)}
                  rows={3}
                  className="field resize-y"
                />
              ) : (
                <input
                  id={inputId}
                  type={campo.tipo === 'numero' ? 'number' : 'text'}
                  value={valorDe(campo.clave)}
                  onChange={e => handleDato(campo.clave, e.target.value)}
                  className="field"
                />
              )}
            </div>
          )
        })}

        {/* Campos desactivados que este lead alcanzó a completar: se muestran
            en solo lectura para no perder el dato de vista. */}
        {camposArchivados.map(campo => (
          <div key={campo.id}>
            <span className="lbl">
              {campo.etiqueta} <span className="text-line-strong">· archivado</span>
            </span>
            <input
              value={valorDe(campo.clave)}
              readOnly
              aria-label={`${campo.etiqueta} (archivado)`}
              className="field cursor-not-allowed opacity-60"
            />
          </div>
        ))}

        <label
          htmlFor="listo_para_cerrar"
          className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2.5 text-[13.5px] transition-colors ${
            form.listo_para_cerrar
              ? 'border-hot-line bg-hot-bg font-semibold text-hot'
              : 'border-line bg-surface-2 text-muted hover:border-line-strong'
          }`}
        >
          <input
            type="checkbox"
            checked={form.listo_para_cerrar || false}
            onChange={e => handleChange('listo_para_cerrar', e.target.checked)}
            id="listo_para_cerrar"
            className="size-4 shrink-0 accent-[#8a4b00]"
          />
          Listo para cerrar
        </label>

        <button
          type="button"
          onClick={handleGuardar}
          disabled={updateLead.isPending}
          className="btn btn-primary mt-0.5 w-full py-2.5"
        >
          {updateLead.isPending ? <Spinner size={15} tono="blanco" /> : 'Guardar cambios'}
        </button>
      </div>

      <Toast toast={toast} onHide={() => {}} />
    </aside>
  )
}
