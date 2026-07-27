import { useState } from 'react'

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
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
          style={{
            resize: 'none',
            minHeight: 40,
            maxHeight: 120,
            overflow: 'auto',
            flex: 1,
            background: '#1c2030',
            border: '1px solid #252a3a',
            color: '#e8eaf0',
            borderRadius: 12,
            padding: '10px 14px',
            fontSize: 13,
            fontFamily: 'DM Sans, sans-serif',
            outline: 'none',
          }}
          onFocus={e => (e.target.style.borderColor = '#4f7cff')}
          onBlur={e => (e.target.style.borderColor = '#252a3a')}
        />
        <button
          onClick={handleEnviar}
          disabled={enviando || !texto.trim() || disabled}
          style={{
            background: '#4f7cff',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            padding: '10px 16px',
            fontSize: 16,
            cursor: enviando || !texto.trim() || disabled ? 'not-allowed' : 'pointer',
            opacity: enviando || !texto.trim() || disabled ? 0.6 : 1,
            lineHeight: 1,
          }}
        >
          {enviando ? (
            <span
              style={{
                display: 'inline-block',
                width: 14,
                height: 14,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
              }}
            />
          ) : (
            '▶'
          )}
        </button>
      </div>
      {texto.length > 200 && (
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: texto.length > 450 ? '#e55353' : '#7a8099',
            textAlign: 'right',
          }}
        >
          {texto.length}/500
        </div>
      )}
    </div>
  )
}
