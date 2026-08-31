import { useState } from 'react'
import Spinner from '../../../components/Spinner'
import { IconEnviar } from '../../../components/icons'

interface Props {
  onEnviar: (texto: string) => Promise<void>
  disabled: boolean
}

export default function ChatInput({ onEnviar, disabled }: Props) {
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleEnviar = async () => {
    if (!texto.trim() || enviando) return
    setEnviando(true)
    const textoGuardado = texto
    setTexto('')
    try {
      await onEnviar(textoGuardado)
    } catch {
      setTexto(textoGuardado)
    } finally {
      setEnviando(false)
    }
  }

  const bloqueado = enviando || !texto.trim() || disabled

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex items-end gap-2">
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleEnviar()
            }
          }}
          rows={1}
          placeholder="Escribí un mensaje..."
          disabled={disabled}
          className="field max-h-[120px] min-h-[42px] flex-1 resize-none rounded-lg py-2.5 text-[14px]"
        />
        <button
          type="button"
          onClick={handleEnviar}
          disabled={bloqueado}
          aria-label="Enviar mensaje"
          className="btn btn-primary size-[42px] shrink-0 p-0"
        >
          {enviando ? <Spinner size={15} tono="blanco" /> : <IconEnviar className="size-[17px]" />}
        </button>
      </div>
      {texto.length > 200 && (
        <div
          className={`text-right font-mono text-[11px] ${
            texto.length > 450 ? 'font-medium text-danger' : 'text-subtle'
          }`}
        >
          {texto.length}/500
        </div>
      )}
    </div>
  )
}
