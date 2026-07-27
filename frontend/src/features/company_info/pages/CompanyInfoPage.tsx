import { useState, useEffect, useCallback } from 'react'
import { useCompanyInfo, useCreateCompanyInfo, useUpdateCompanyInfo, useDeleteCompanyInfo } from '../hooks/useCompanyInfo'
import { useToast } from '../../../components/Toast'
import Toast from '../../../components/Toast'
import api from '../../../lib/axios'
import type { CompanyInfo } from '../../../types'

const inputStyle: React.CSSProperties = {
  background: '#1c2030',
  border: '1px solid #252a3a',
  color: '#e8eaf0',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  width: '100%',
  fontFamily: 'DM Sans, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
}

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
    <div style={{ padding: 24, color: '#e8eaf0' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600 }}>Info de la Empresa</div>
        <button
          onClick={abrirNueva}
          style={{
            background: '#4f7cff',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          ＋ Agregar entrada
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {entradas.map(e => (
          <div
            key={e.id}
            style={{
              background: '#151820',
              border: '1px solid #252a3a',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#e8eaf0',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {e.pregunta}
              </div>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: '#7a8099',
                  whiteSpace: 'nowrap',
                }}
              >
                Orden: {e.orden}
              </div>
            </div>
            <div
              style={{
                fontSize: 13,
                color: '#7a8099',
                marginTop: 6,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {e.respuesta}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                onClick={() => abrirEditar(e)}
                style={{
                  border: '1px solid #252a3a',
                  background: 'none',
                  color: '#7a8099',
                  borderRadius: 6,
                  padding: '4px 12px',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Editar
              </button>
              <button
                onClick={() => {
                  if (confirm('¿Eliminar esta entrada?')) deleteInfo.mutate(e.id)
                }}
                style={{
                  border: '1px solid #2e0d0d',
                  background: 'none',
                  color: '#e55353',
                  borderRadius: 6,
                  padding: '4px 12px',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <button
          onClick={togglePrompt}
          style={{
            color: '#4f7cff',
            border: 'none',
            background: 'none',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          {showPrompt ? '▲ Ocultar prompt' : '▼ Ver prompt del AI Agent'}
        </button>
        {showPrompt && (
          <textarea
            readOnly
            value={promptTexto}
            rows={10}
            style={{
              marginTop: 8,
              background: '#1c2030',
              border: '1px solid #252a3a',
              color: '#7a8099',
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              borderRadius: 8,
              padding: 12,
              width: '100%',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        )}
      </div>

      {modal.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setModal({ open: false, editando: null })
          }}
        >
          <div
            style={{
              background: '#151820',
              border: '1px solid #252a3a',
              borderRadius: 16,
              width: '100%',
              maxWidth: 500,
              padding: 24,
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#e8eaf0',
                marginBottom: 16,
              }}
            >
              {modal.editando ? 'Editar entrada' : 'Nueva entrada'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    color: '#7a8099',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Pregunta
                </label>
                <input
                  value={formModal.pregunta}
                  onChange={e => setFormModal(p => ({ ...p, pregunta: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    color: '#7a8099',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Respuesta
                </label>
                <textarea
                  value={formModal.respuesta}
                  onChange={e => setFormModal(p => ({ ...p, respuesta: e.target.value }))}
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    color: '#7a8099',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Orden
                </label>
                <input
                  type="number"
                  min={0}
                  value={formModal.orden}
                  onChange={e => setFormModal(p => ({ ...p, orden: Number(e.target.value) }))}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setModal({ open: false, editando: null })}
                style={{
                  border: '1px solid #252a3a',
                  background: 'none',
                  color: '#7a8099',
                  borderRadius: 8,
                  padding: '8px 20px',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                style={{
                  background: '#4f7cff',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 20px',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
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
