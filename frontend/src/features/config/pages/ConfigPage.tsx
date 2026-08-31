import { useState, useEffect, useRef } from 'react'
import { useConfig, useUpdateConfig } from '../hooks/useConfig'
import { useToast } from '../../../components/Toast'
import Toast from '../../../components/Toast'
import Spinner, { SpinnerCentrado } from '../../../components/Spinner'
import { IconOjo, IconOjoTachado } from '../../../components/icons'
import type { BotConfig } from '../../../types'

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-4 text-[15px] font-semibold text-ink">{titulo}</h2>
      <div className="flex flex-col gap-3.5">{children}</div>
    </section>
  )
}

export default function ConfigPage() {
  const { data: config, isLoading } = useConfig()
  const updateConfig = useUpdateConfig()
  const { toast, showToast } = useToast()
  const [form, setForm] = useState<Partial<BotConfig>>({})
  const [mostrarApiKey, setMostrarApiKey] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    if (config && !initialized.current) {
      setForm(config)
      initialized.current = true
    }
  }, [config])

  const setField = <K extends keyof BotConfig>(k: K, v: BotConfig[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  if (isLoading) {
    return <SpinnerCentrado />
  }

  return (
    <div className="flex max-w-[720px] flex-col gap-4 p-4 sm:p-6">
      <Seccion titulo="Empresa">
        <div>
          <label className="lbl" htmlFor="nombre_empresa">
            Nombre de la empresa
          </label>
          <input
            id="nombre_empresa"
            value={form.nombre_empresa || ''}
            onChange={e => setField('nombre_empresa', e.target.value)}
            className="field"
          />
        </div>
      </Seccion>

      <Seccion titulo="Encargado">
        <div>
          <label className="lbl" htmlFor="encargado_numero">
            Número de WhatsApp
          </label>
          <input
            id="encargado_numero"
            value={form.encargado_numero || ''}
            onChange={e => setField('encargado_numero', e.target.value)}
            className="field font-mono"
          />
          <p className="hint">Sin @s.whatsapp.net — ej: 5492614XXXXXXX</p>
        </div>
      </Seccion>

      <Seccion titulo="Seguimiento automático">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label className="lbl" htmlFor="horas_seguimiento">
              Horas entre seguimientos
            </label>
            <input
              id="horas_seguimiento"
              type="number"
              min={0}
              value={form.horas_seguimiento ?? ''}
              onChange={e => setField('horas_seguimiento', Number(e.target.value))}
              className="field"
            />
            {form.max_seguimientos === 1 && (
              <p className="hint">Se ignora con un solo seguimiento máximo: el lead entra directo a la lista.</p>
            )}
          </div>
          <div className="flex-1">
            <label className="lbl" htmlFor="max_seguimientos">
              Máximo de seguimientos
            </label>
            <input
              id="max_seguimientos"
              type="number"
              min={0}
              value={form.max_seguimientos ?? ''}
              onChange={e => setField('max_seguimientos', Number(e.target.value))}
              className="field"
            />
          </div>
        </div>
        <div>
          <label className="lbl" htmlFor="mensaje_seguimiento">
            Mensaje de seguimiento
          </label>
          <textarea
            id="mensaje_seguimiento"
            value={form.mensaje_seguimiento || ''}
            onChange={e => setField('mensaje_seguimiento', e.target.value)}
            rows={3}
            className="field resize-y"
          />
          <p className="hint">
            Variables disponibles: <code className="font-mono text-ink">{'{nombre}'}</code> y{' '}
            <code className="font-mono text-ink">{'{empresa}'}</code>
          </p>
        </div>
      </Seccion>

      <Seccion titulo="Evolution API">
        <div>
          <label className="lbl" htmlFor="server_url">
            URL del servidor
          </label>
          <input
            id="server_url"
            value={form.server_url || ''}
            onChange={e => setField('server_url', e.target.value)}
            className="field font-mono"
          />
        </div>
        <div>
          <label className="lbl" htmlFor="instance_name">
            Nombre de instancia
          </label>
          <input
            id="instance_name"
            value={form.instance_name || ''}
            onChange={e => setField('instance_name', e.target.value)}
            className="field font-mono"
          />
        </div>
        <div>
          <label className="lbl" htmlFor="apikey">
            API Key
          </label>
          <div className="flex gap-2">
            <input
              id="apikey"
              type={mostrarApiKey ? 'text' : 'password'}
              value={form.apikey || ''}
              onChange={e => setField('apikey', e.target.value)}
              className="field flex-1 font-mono"
            />
            <button
              type="button"
              onClick={() => setMostrarApiKey(!mostrarApiKey)}
              aria-label={mostrarApiKey ? 'Ocultar API key' : 'Mostrar API key'}
              className="btn btn-ghost shrink-0 px-3"
            >
              {mostrarApiKey ? (
                <IconOjoTachado className="size-[18px]" />
              ) : (
                <IconOjo className="size-[18px]" />
              )}
            </button>
          </div>
        </div>
      </Seccion>

      <Seccion titulo="Control del bot">
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={!!form.bot_activo}
            aria-label="Bot activo"
            onClick={() => setField('bot_activo', !form.bot_activo)}
            className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
              form.bot_activo ? 'bg-ok' : 'bg-line-strong'
            }`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-[left] ${
                form.bot_activo ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
          <span
            className={`text-[13.5px] font-medium ${form.bot_activo ? 'text-ok' : 'text-danger'}`}
          >
            {form.bot_activo ? 'Bot activo' : 'Bot pausado'}
          </span>
        </div>
      </Seccion>

      <button
        type="button"
        disabled={updateConfig.isPending}
        onClick={async () => {
          await updateConfig.mutateAsync(form)
          showToast('Configuración guardada ✓', 'success')
        }}
        className="btn btn-primary w-full py-3"
      >
        {updateConfig.isPending ? <Spinner size={15} tono="blanco" /> : 'Guardar configuración'}
      </button>

      <Toast toast={toast} onHide={() => {}} />
    </div>
  )
}
