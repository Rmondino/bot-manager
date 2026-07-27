import { useState, useEffect } from 'react'
import { useConfig, useUpdateConfig } from '../hooks/useConfig'
import { useToast } from '../../../components/Toast'
import Toast from '../../../components/Toast'
import type { BotConfig } from '../../../types'

const sectionStyle: React.CSSProperties = {
  background: '#151820',
  border: '1px solid #252a3a',
  borderRadius: 12,
  padding: 20,
  marginBottom: 16,
}

const labelStyle: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 11,
  color: '#7a8099',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: 6,
}

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

export default function ConfigPage() {
  const { data: config, isLoading } = useConfig()
  const updateConfig = useUpdateConfig()
  const { toast, showToast } = useToast()
  const [form, setForm] = useState<Partial<BotConfig>>({})
  const [mostrarApiKey, setMostrarApiKey] = useState(false)

  useEffect(() => {
    if (config) setForm(config)
  }, [config])

  const setField = <K extends keyof BotConfig>(k: K, v: BotConfig[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  if (isLoading) {
    return (
      <div
        style={{
          padding: 24,
          display: 'flex',
          justifyContent: 'center',
          color: '#7a8099',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 24,
            height: 24,
            border: '2px solid #252a3a',
            borderTopColor: '#4f7cff',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      </div>
    )
  }

  return (
    <div style={{ padding: 24, color: '#e8eaf0', maxWidth: 640 }}>
      <div style={sectionStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#e8eaf0' }}>
          EMPRESA
        </div>
        <label style={labelStyle}>Nombre de la empresa</label>
        <input
          value={form.nombre_empresa || ''}
          onChange={e => setField('nombre_empresa', e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={sectionStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#e8eaf0' }}>
          ENCARGADO
        </div>
        <label style={labelStyle}>Número de WhatsApp</label>
        <input
          value={form.encargado_numero || ''}
          onChange={e => setField('encargado_numero', e.target.value)}
          style={inputStyle}
        />
        <div
          style={{
            color: '#7a8099',
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            marginTop: 4,
          }}
        >
          Sin @s.whatsapp.net — ej: 5492614XXXXXXX
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#e8eaf0' }}>
          SEGUIMIENTO AUTOMÁTICO
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Horas entre seguimientos</label>
            <input
              type="number"
              min={0}
              value={form.horas_seguimiento ?? ''}
              onChange={e => setField('horas_seguimiento', Number(e.target.value))}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Máximo de seguimientos</label>
            <input
              type="number"
              min={0}
              value={form.max_seguimientos ?? ''}
              onChange={e => setField('max_seguimientos', Number(e.target.value))}
              style={inputStyle}
            />
          </div>
        </div>
        <label style={labelStyle}>Mensaje de seguimiento</label>
        <textarea
          value={form.mensaje_seguimiento || ''}
          onChange={e => setField('mensaje_seguimiento', e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
        <div
          style={{
            color: '#7a8099',
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            marginTop: 4,
          }}
        >
          Variables disponibles: {'{nombre}'} y {'{empresa}'}
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#e8eaf0' }}>
          EVOLUTION API
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>URL del servidor</label>
          <input
            value={form.server_url || ''}
            onChange={e => setField('server_url', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Nombre de instancia</label>
          <input
            value={form.instance_name || ''}
            onChange={e => setField('instance_name', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>API Key</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type={mostrarApiKey ? 'text' : 'password'}
              value={form.apikey || ''}
              onChange={e => setField('apikey', e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={() => setMostrarApiKey(!mostrarApiKey)}
              style={{
                background: '#1c2030',
                border: '1px solid #252a3a',
                borderRadius: 8,
                color: '#7a8099',
                cursor: 'pointer',
                padding: '0 12px',
                fontSize: 16,
              }}
            >
              {mostrarApiKey ? '🙈' : '👁'}
            </button>
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#e8eaf0' }}>
          CONTROL DEL BOT
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            onClick={() => setField('bot_activo', !form.bot_activo)}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              cursor: 'pointer',
              background: form.bot_activo ? '#2ecc71' : '#252a3a',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 2,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'white',
                transition: 'left 0.2s',
                left: form.bot_activo ? 22 : 2,
              }}
            />
          </div>
          <span
            style={{
              fontSize: 13,
              color: form.bot_activo ? '#2ecc71' : '#e55353',
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {form.bot_activo ? 'Bot activo' : 'Bot pausado'}
          </span>
        </div>
      </div>

      <button
        onClick={async () => {
          await updateConfig.mutateAsync(form)
          showToast('Configuración guardada ✓', 'success')
        }}
        style={{
          width: '100%',
          background: '#4f7cff',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          padding: 12,
          fontSize: 13,
          cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif',
          marginBottom: 16,
        }}
      >
        Guardar configuración
      </button>

      <Toast toast={toast} onHide={() => {}} />
    </div>
  )
}
