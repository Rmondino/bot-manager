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
import api from '../../../lib/axios'
import type { CampoLead, TipoCampo } from '../../../types'

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

const labelStyle: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 11,
  color: '#7a8099',
  textTransform: 'uppercase',
  marginBottom: 6,
  display: 'block',
}

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
    <div style={{ padding: 24, color: '#e8eaf0' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600 }}>Datos del Lead</div>
        <button
          onClick={abrirNuevo}
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
          ＋ Agregar campo
        </button>
      </div>

      <div style={{ fontSize: 13, color: '#7a8099', marginBottom: 20 }}>
        Qué información recopila el bot durante la conversación. Los campos activos se le
        piden al asistente y aparecen en la ficha del lead.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {campos.map(c => (
          <div
            key={c.id}
            style={{
              background: '#151820',
              border: '1px solid #252a3a',
              borderRadius: 12,
              padding: 16,
              opacity: c.activo ? 1 : 0.55,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>
                  {c.etiqueta}
                  {!c.activo && (
                    <span
                      style={{
                        marginLeft: 8,
                        background: '#252a3a',
                        color: '#7a8099',
                        borderRadius: 5,
                        padding: '2px 7px',
                        fontSize: 11,
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      inactivo
                    </span>
                  )}
                  {!c.pide_el_bot && (
                    <span
                      style={{
                        marginLeft: 8,
                        background: '#2e2200',
                        color: '#f0b429',
                        borderRadius: 5,
                        padding: '2px 7px',
                        fontSize: 11,
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      interno
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12,
                    color: '#7a8099',
                  }}
                >
                  {c.clave} · {c.tipo}
                  {c.opciones ? ` · ${c.opciones}` : ''}
                </div>
                {c.descripcion && (
                  <div style={{ fontSize: 13, color: '#7a8099', marginTop: 6 }}>
                    {c.descripcion}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => toggleActivo(c)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #252a3a',
                    color: '#7a8099',
                    borderRadius: 6,
                    padding: '5px 12px',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {c.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => abrirEditar(c)}
                  style={{
                    background: '#0d1a3a',
                    border: '1px solid #0d1a3a',
                    color: '#4f7cff',
                    borderRadius: 6,
                    padding: '5px 12px',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  Editar
                </button>
                <button
                  onClick={() => pedirBorrado(c)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #2e0d0d',
                    color: '#e55353',
                    borderRadius: 6,
                    padding: '5px 12px',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <button
          onClick={togglePrompt}
          style={{
            background: 'none',
            border: 'none',
            color: '#4f7cff',
            fontSize: 13,
            cursor: 'pointer',
            padding: 0,
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          {showPrompt ? '▲ Ocultar' : '▼ Ver'} lo que recibe el AI Agent
        </button>
        {showPrompt && (
          <textarea
            readOnly
            value={promptTexto}
            rows={8}
            style={{
              ...inputStyle,
              marginTop: 10,
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              resize: 'vertical',
            }}
          />
        )}
      </div>

      {modal.open && (
        <div
          onClick={e => e.target === e.currentTarget && setModal({ open: false, editando: null })}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
        >
          <div
            style={{
              background: '#151820',
              border: '1px solid #252a3a',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 520,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>
              {modal.editando ? 'Editar campo' : 'Nuevo campo'}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Etiqueta</label>
              <input
                value={form.etiqueta}
                onChange={e => setField('etiqueta', e.target.value)}
                placeholder="Tipo de inmueble"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Clave</label>
              <input
                value={form.clave}
                onChange={e => setField('clave', e.target.value)}
                disabled={!!modal.editando}
                placeholder="tipo_inmueble"
                style={{
                  ...inputStyle,
                  fontFamily: "'DM Mono', monospace",
                  opacity: modal.editando ? 0.5 : 1,
                  cursor: modal.editando ? 'not-allowed' : 'text',
                }}
              />
              <div style={{ fontSize: 11, color: '#7a8099', marginTop: 6 }}>
                {modal.editando
                  ? 'No se puede cambiar: los datos ya guardados quedarían bajo la clave anterior.'
                  : 'Minúsculas, números y guion bajo. Es el identificador interno que usa el bot.'}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Descripción para el bot</label>
              <input
                value={form.descripcion ?? ''}
                onChange={e => setField('descripcion', e.target.value)}
                placeholder="barrio o ciudad que mencione"
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Tipo</label>
                <select
                  value={form.tipo}
                  onChange={e => setField('tipo', e.target.value as TipoCampo)}
                  style={inputStyle}
                >
                  {TIPOS.map(t => (
                    <option key={t.valor} value={t.valor}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ width: 110 }}>
                <label style={labelStyle}>Orden</label>
                <input
                  type="number"
                  min={0}
                  value={form.orden}
                  onChange={e => setField('orden', Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
            </div>

            {form.tipo === 'opciones' && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Opciones</label>
                <input
                  value={form.opciones ?? ''}
                  onChange={e => setField('opciones', e.target.value)}
                  placeholder="Casa,Departamento,Local"
                  style={inputStyle}
                />
                <div style={{ fontSize: 11, color: '#7a8099', marginTop: 6 }}>
                  Separadas por coma.
                </div>
              </div>
            )}

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 20,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={form.pide_el_bot}
                onChange={e => setField('pide_el_bot', e.target.checked)}
              />
              <span style={{ fontSize: 13 }}>
                El bot lo pregunta
                <span style={{ color: '#7a8099' }}>
                  {' '}
                  — destildado para notas internas del encargado
                </span>
              </span>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setModal({ open: false, editando: null })}
                style={{
                  background: 'transparent',
                  border: '1px solid #252a3a',
                  color: '#7a8099',
                  borderRadius: 8,
                  padding: '8px 16px',
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
                  border: 'none',
                  color: 'white',
                  borderRadius: 8,
                  padding: '8px 16px',
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

      {borrado && (
        <div
          onClick={e => e.target === e.currentTarget && setBorrado(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
        >
          <div
            style={{
              background: '#151820',
              border: '1px solid #2e0d0d',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 520,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
              Eliminar "{borrado.campo.etiqueta}"
            </div>
            <div style={{ fontSize: 13, color: '#e8eaf0', marginBottom: 14 }}>
              <strong>{borrado.uso.total}</strong> lead(s) tienen este dato guardado y se les
              va a borrar. Esta acción no se puede deshacer.
            </div>

            <div
              style={{
                background: '#1c2030',
                border: '1px solid #252a3a',
                borderRadius: 8,
                padding: 12,
                marginBottom: 14,
                maxHeight: 220,
                overflowY: 'auto',
              }}
            >
              {borrado.uso.leads.map(l => (
                <div
                  key={l.whatsapp}
                  style={{
                    fontSize: 12,
                    fontFamily: "'DM Mono', monospace",
                    color: '#7a8099',
                    padding: '3px 0',
                  }}
                >
                  {l.nombre} · {l.whatsapp} · <span style={{ color: '#e8eaf0' }}>{l.valor}</span>
                </div>
              ))}
              {borrado.uso.total > borrado.uso.leads.length && (
                <div style={{ fontSize: 12, color: '#7a8099', paddingTop: 6 }}>
                  …y {borrado.uso.total - borrado.uso.leads.length} más
                </div>
              )}
            </div>

            <div style={{ fontSize: 13, color: '#7a8099', marginBottom: 20 }}>
              Si solo querés dejar de pedirlo, <strong style={{ color: '#e8eaf0' }}>desactivalo</strong>{' '}
              en vez de borrarlo: el campo sale del bot pero los datos se conservan.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setBorrado(null)}
                style={{
                  background: 'transparent',
                  border: '1px solid #252a3a',
                  color: '#7a8099',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await updateCampo.mutateAsync({
                    id: borrado.campo.id,
                    data: { activo: false },
                  })
                  setBorrado(null)
                  showToast('Campo desactivado, datos conservados', 'success')
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #252a3a',
                  color: '#e8eaf0',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Mejor desactivar
              </button>
              <button
                onClick={confirmarBorrado}
                style={{
                  background: '#e55353',
                  border: 'none',
                  color: 'white',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
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
