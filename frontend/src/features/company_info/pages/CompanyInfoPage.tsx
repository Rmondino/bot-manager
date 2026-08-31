import { useState, useEffect, useCallback } from 'react'
import {
  useCompanyInfo,
  useCreateCompanyInfo,
  useUpdateCompanyInfo,
  useDeleteCompanyInfo,
} from '../hooks/useCompanyInfo'
import { useToast } from '../../../components/Toast'
import Toast from '../../../components/Toast'
import { IconMas, IconChevron } from '../../../components/icons'
import api from '../../../lib/axios'
import type { CompanyInfo } from '../../../types'

export default function CompanyInfoPage() {
  const { data: entradas = [] } = useCompanyInfo()
  const createInfo = useCreateCompanyInfo()
  const updateInfo = useUpdateCompanyInfo()
  const deleteInfo = useDeleteCompanyInfo()
  const { toast, showToast } = useToast()
  const [modal, setModal] = useState<{ open: boolean; editando: CompanyInfo | null }>({
    open: false,
    editando: null,
  })
  const [formModal, setFormModal] = useState({ pregunta: '', respuesta: '', orden: 0 })
  const [showPrompt, setShowPrompt] = useState(false)
  const [promptTexto, setPromptTexto] = useState('')

  const abrirNueva = () => {
    setFormModal({ pregunta: '', respuesta: '', orden: entradas.length + 1 })
    setModal({ open: true, editando: null })
  }

  const abrirEditar = (e: CompanyInfo) => {
    setFormModal({ pregunta: e.pregunta, respuesta: e.respuesta, orden: e.orden })
    setModal({ open: true, editando: e })
  }

  const handleGuardar = async () => {
    if (modal.editando) {
      await updateInfo.mutateAsync({ id: modal.editando.id, data: formModal })
    } else {
      await createInfo.mutateAsync(formModal)
    }
    setModal({ open: false, editando: null })
    showToast('Guardado ✓', 'success')
  }

  const togglePrompt = async () => {
    if (!showPrompt) {
      const res = await api.get('/n8n/company-info/prompt')
      setPromptTexto(res.data as unknown as string)
    }
    setShowPrompt(!showPrompt)
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modal.open) setModal({ open: false, editando: null })
    },
    [modal.open],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="flex max-w-[860px] flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[16px] font-semibold text-ink">Info de la Empresa</h2>
        <button type="button" onClick={abrirNueva} className="btn btn-primary">
          <IconMas className="size-4" />
          Agregar entrada
        </button>
      </div>

      {entradas.length === 0 ? (
        <div className="card p-10 text-center text-[14px] text-muted">
          Todavía no hay entradas cargadas
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entradas.map(e => (
            <article key={e.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[14.5px] font-semibold text-ink">{e.pregunta}</h3>
                <span className="shrink-0 font-mono text-[11px] whitespace-nowrap text-subtle">
                  Orden: {e.orden}
                </span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-[13.5px] text-muted">{e.respuesta}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => abrirEditar(e)}
                  className="btn btn-sm btn-ghost"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('¿Eliminar esta entrada?')) deleteInfo.mutate(e.id)
                  }}
                  className="btn btn-sm btn-danger"
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

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
          {showPrompt ? 'Ocultar prompt' : 'Ver prompt del AI Agent'}
        </button>
        {showPrompt && (
          <textarea
            readOnly
            value={promptTexto}
            rows={10}
            aria-label="Prompt del AI Agent"
            className="field mt-2 resize-y font-mono text-[11.5px] text-muted"
          />
        )}
      </div>

      {modal.open && (
        <div
          className="modal-backdrop"
          onClick={e => {
            if (e.target === e.currentTarget) setModal({ open: false, editando: null })
          }}
        >
          <div className="modal-box max-w-[520px]" role="dialog" aria-modal="true">
            <h3 className="modal-title">
              {modal.editando ? 'Editar entrada' : 'Nueva entrada'}
            </h3>

            <div className="flex flex-col gap-3.5">
              <div>
                <label className="lbl" htmlFor="pregunta">
                  Pregunta
                </label>
                <input
                  id="pregunta"
                  value={formModal.pregunta}
                  onChange={e => setFormModal(p => ({ ...p, pregunta: e.target.value }))}
                  className="field"
                />
              </div>
              <div>
                <label className="lbl" htmlFor="respuesta">
                  Respuesta
                </label>
                <textarea
                  id="respuesta"
                  value={formModal.respuesta}
                  onChange={e => setFormModal(p => ({ ...p, respuesta: e.target.value }))}
                  rows={4}
                  className="field resize-y"
                />
              </div>
              <div>
                <label className="lbl" htmlFor="orden">
                  Orden
                </label>
                <input
                  id="orden"
                  type="number"
                  min={0}
                  value={formModal.orden}
                  onChange={e => setFormModal(p => ({ ...p, orden: Number(e.target.value) }))}
                  className="field"
                />
              </div>
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

      <Toast toast={toast} onHide={() => {}} />
    </div>
  )
}
