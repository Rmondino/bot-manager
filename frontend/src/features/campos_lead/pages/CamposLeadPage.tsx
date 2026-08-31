import { useState, useEffect, useCallback } from 'react'
import {
  useCamposLead,
  useCreateCampoLead,
  useUpdateCampoLead,
  useDeleteCampoLead,
  fetchUsoCampo,
  type CampoLeadInput,
  type UsoCampo,
} from '../hooks/useCamposLead'
import { useToast } from '../../../components/Toast'
import Toast from '../../../components/Toast'
import { IconMas, IconChevron } from '../../../components/icons'
import api from '../../../lib/axios'
import type { CampoLead, TipoCampo } from '../../../types'

const TIPOS: { valor: TipoCampo; label: string }[] = [
  { valor: 'texto', label: 'Texto' },
  { valor: 'numero', label: 'Número' },
  { valor: 'opciones', label: 'Opciones' },
  { valor: 'textarea', label: 'Texto largo' },
]

const FORM_VACIO: CampoLeadInput = {
  clave: '',
  etiqueta: '',
  descripcion: '',
  opciones: '',
  tipo: 'texto',
  pide_el_bot: true,
  activo: true,
  orden: 0,
}

export default function CamposLeadPage() {
  const { data: campos = [] } = useCamposLead()
  const createCampo = useCreateCampoLead()
  const updateCampo = useUpdateCampoLead()
  const deleteCampo = useDeleteCampoLead()
  const { toast, showToast } = useToast()

  const [modal, setModal] = useState<{ open: boolean; editando: CampoLead | null }>({
    open: false,
    editando: null,
  })
  const [form, setForm] = useState<CampoLeadInput>(FORM_VACIO)
  const [showPrompt, setShowPrompt] = useState(false)
  const [promptTexto, setPromptTexto] = useState('')
  // Confirmación de borrado: se abre solo cuando hay datos cargados en juego.
  const [borrado, setBorrado] = useState<{ campo: CampoLead; uso: UsoCampo } | null>(null)

  const setField = <K extends keyof CampoLeadInput>(k: K, v: CampoLeadInput[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const abrirNuevo = () => {
    setForm({ ...FORM_VACIO, orden: campos.length + 1 })
    setModal({ open: true, editando: null })
  }

  const abrirEditar = (c: CampoLead) => {
    setForm({
      clave: c.clave,
      etiqueta: c.etiqueta,
      descripcion: c.descripcion ?? '',
      opciones: c.opciones ?? '',
      tipo: c.tipo,
      pide_el_bot: c.pide_el_bot,
      activo: c.activo,
      orden: c.orden,
    })
    setModal({ open: true, editando: c })
  }

  const handleGuardar = async () => {
    try {
      if (modal.editando) {
        // clave no se manda: es inmutable.
        const { clave, ...resto } = form
        void clave
        await updateCampo.mutateAsync({ id: modal.editando.id, data: resto })
      } else {
        await createCampo.mutateAsync(form)
      }
      setModal({ open: false, editando: null })
      showToast('Guardado ✓', 'success')
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
      showToast(typeof detail === 'string' ? detail : 'No se pudo guardar', 'error')
    }
  }

  const toggleActivo = async (c: CampoLead) => {
    await updateCampo.mutateAsync({ id: c.id, data: { activo: !c.activo } })
    showToast(c.activo ? 'Campo desactivado' : 'Campo activado', 'success')
  }

  const pedirBorrado = async (c: CampoLead) => {
    const uso = await fetchUsoCampo(c.id)
    if (uso.total === 0) {
      if (confirm(`¿Eliminar el campo "${c.etiqueta}"? Ningún lead tiene este dato cargado.`)) {
        await deleteCampo.mutateAsync(c.id)
        showToast('Campo eliminado', 'success')
      }
      return
    }
    // Con datos en juego no alcanza un confirm(): hay que mostrar a quiénes afecta.
    setBorrado({ campo: c, uso })
  }

  const confirmarBorrado = async () => {
    if (!borrado) return
    const res = await deleteCampo.mutateAsync(borrado.campo.id)
    setBorrado(null)
    showToast(`Campo eliminado de ${res.leads_afectados} lead(s)`, 'success')
  }

  const togglePrompt = async () => {
    if (!showPrompt) {
      const res = await api.get('/n8n/lead-fields/prompt')
      setPromptTexto(res.data as unknown as string)
    }
    setShowPrompt(!showPrompt)
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Escape') return
    setModal(m => (m.open ? { open: false, editando: null } : m))
    setBorrado(b => (b ? null : b))
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="flex max-w-[860px] flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-[62ch]">
          <h2 className="text-[16px] font-semibold text-ink">Datos del Lead</h2>
          <p className="mt-1 text-[13.5px] text-muted">
            Qué información recopila el bot durante la conversación. Los campos activos se le
            piden al asistente y aparecen en la ficha del lead.
          </p>
        </div>
        <button type="button" onClick={abrirNuevo} className="btn btn-primary">
          <IconMas className="size-4" />
          Agregar campo
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {campos.map(c => (
          <article key={c.id} className={`card p-4 ${c.activo ? '' : 'bg-surface-2'}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className={`text-[14.5px] font-semibold ${c.activo ? 'text-ink' : 'text-muted'}`}
                  >
                    {c.etiqueta}
                  </h3>
                  {!c.activo && (
                    <span className="badge border-idle-line bg-idle-bg text-idle">inactivo</span>
                  )}
                  {!c.pide_el_bot && (
                    <span className="badge border-hot-line bg-hot-bg text-hot">interno</span>
                  )}
                </div>
                <p className="mt-1 font-mono text-[12px] text-subtle">
                  {c.clave} · {c.tipo}
                  {c.opciones ? ` · ${c.opciones}` : ''}
                </p>
                {c.descripcion && (
                  <p className="mt-1.5 text-[13.5px] text-muted">{c.descripcion}</p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleActivo(c)}
                  className="btn btn-sm btn-ghost"
                >
                  {c.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  type="button"
                  onClick={() => abrirEditar(c)}
                  className="btn btn-sm border-info-line bg-info-bg text-info hover:bg-primary-soft"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => pedirBorrado(c)}
                  className="btn btn-sm btn-danger"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div>
        <button
          type="button"
          onClick={togglePrompt}
          aria-expanded={showPrompt}
          className="btn btn-sm btn-quiet -ml-2"
        >
          <IconChevron
            className={`size-4 transition-transform ${showPrompt ? 'rotate-180' : ''}`}
          />
          {showPrompt ? 'Ocultar' : 'Ver'} lo que recibe el AI Agent
        </button>
        {showPrompt && (
          <textarea
            readOnly
            value={promptTexto}
            rows={8}
            aria-label="Lo que recibe el AI Agent"
            className="field mt-2 resize-y font-mono text-[12px] text-muted"
          />
        )}
      </div>

      {modal.open && (
        <div
          onClick={e => e.target === e.currentTarget && setModal({ open: false, editando: null })}
          className="modal-backdrop"
        >
          <div className="modal-box max-w-[540px]" role="dialog" aria-modal="true">
            <h3 className="modal-title">{modal.editando ? 'Editar campo' : 'Nuevo campo'}</h3>

            <div className="flex flex-col gap-3.5">
              <div>
                <label className="lbl" htmlFor="etiqueta">
                  Etiqueta
                </label>
                <input
                  id="etiqueta"
                  value={form.etiqueta}
                  onChange={e => setField('etiqueta', e.target.value)}
                  placeholder="Tipo de inmueble"
                  className="field"
                />
              </div>

              <div>
                <label className="lbl" htmlFor="clave">
                  Clave
                </label>
                <input
                  id="clave"
                  value={form.clave}
                  onChange={e => setField('clave', e.target.value)}
                  disabled={!!modal.editando}
                  placeholder="tipo_inmueble"
                  className="field font-mono"
                />
                <p className="hint">
                  {modal.editando
                    ? 'No se puede cambiar: los datos ya guardados quedarían bajo la clave anterior.'
                    : 'Minúsculas, números y guion bajo. Es el identificador interno que usa el bot.'}
                </p>
              </div>

              <div>
                <label className="lbl" htmlFor="descripcion">
                  Descripción para el bot
                </label>
                <input
                  id="descripcion"
                  value={form.descripcion ?? ''}
                  onChange={e => setField('descripcion', e.target.value)}
                  placeholder="barrio o ciudad que mencione"
                  className="field"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="lbl" htmlFor="tipo">
                    Tipo
                  </label>
                  <select
                    id="tipo"
                    value={form.tipo}
                    onChange={e => setField('tipo', e.target.value as TipoCampo)}
                    className="field"
                  >
                    {TIPOS.map(t => (
                      <option key={t.valor} value={t.valor}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-[110px]">
                  <label className="lbl" htmlFor="orden-campo">
                    Orden
                  </label>
                  <input
                    id="orden-campo"
                    type="number"
                    min={0}
                    value={form.orden}
                    onChange={e => setField('orden', Number(e.target.value))}
                    className="field"
                  />
                </div>
              </div>

              {form.tipo === 'opciones' && (
                <div>
                  <label className="lbl" htmlFor="opciones">
                    Opciones
                  </label>
                  <input
                    id="opciones"
                    value={form.opciones ?? ''}
                    onChange={e => setField('opciones', e.target.value)}
                    placeholder="Casa,Departamento,Local"
                    className="field"
                  />
                  <p className="hint">Separadas por coma.</p>
                </div>
              )}

              <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-line bg-surface-2 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={form.pide_el_bot}
                  onChange={e => setField('pide_el_bot', e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-[#1e4bc8]"
                />
                <span className="text-[13.5px] text-ink">
                  El bot lo pregunta
                  <span className="text-muted"> — destildado para notas internas del encargado</span>
                </span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal({ open: false, editando: null })}
                className="btn btn-ghost"
              >
                Cancelar
              </button>
              <button type="button" onClick={handleGuardar} className="btn btn-primary">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {borrado && (
        <div
          onClick={e => e.target === e.currentTarget && setBorrado(null)}
          className="modal-backdrop"
        >
          <div
            className="modal-box max-w-[540px] border-danger-line"
            role="alertdialog"
            aria-modal="true"
          >
            <h3 className="modal-title mb-3">Eliminar "{borrado.campo.etiqueta}"</h3>

            <p className="mb-3.5 text-[13.5px] text-ink">
              <strong className="font-semibold">{borrado.uso.total}</strong> lead(s) tienen este
              dato guardado y se les va a borrar. Esta acción no se puede deshacer.
            </p>

            <div className="mb-3.5 max-h-[220px] overflow-y-auto rounded-md border border-line bg-surface-2 p-3">
              {borrado.uso.leads.map(l => (
                <div key={l.whatsapp} className="py-0.5 font-mono text-[12px] text-muted">
                  {l.nombre} · {l.whatsapp} · <span className="text-ink">{l.valor}</span>
                </div>
              ))}
              {borrado.uso.total > borrado.uso.leads.length && (
                <div className="pt-1.5 text-[12px] text-subtle">
                  …y {borrado.uso.total - borrado.uso.leads.length} más
                </div>
              )}
            </div>

            <p className="mb-5 text-[13.5px] text-muted">
              Si solo querés dejar de pedirlo, <strong className="text-ink">desactivalo</strong> en
              vez de borrarlo: el campo sale del bot pero los datos se conservan.
            </p>

            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setBorrado(null)} className="btn btn-ghost">
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await updateCampo.mutateAsync({
                    id: borrado.campo.id,
                    data: { activo: false },
                  })
                  setBorrado(null)
                  showToast('Campo desactivado, datos conservados', 'success')
                }}
                className="btn btn-ghost text-ink"
              >
                Mejor desactivar
              </button>
              <button
                type="button"
                onClick={confirmarBorrado}
                className="btn bg-danger text-white hover:bg-danger/90"
              >
                Eliminar igual
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onHide={() => {}} />
    </div>
  )
}
