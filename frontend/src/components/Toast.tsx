import { useState } from 'react'

interface ToastState {
  mensaje: string
  tipo: 'success' | 'error' | 'info'
  visible: boolean
}

interface Props {
  toast: ToastState
  onHide: () => void
}

const colors = {
  success: { border: '#2ecc71', text: '#2ecc71' },
  error: { border: '#e55353', text: '#e55353' },
  info: { border: '#4f7cff', text: '#4f7cff' },
}

export default function Toast({ toast, onHide }: Props) {
  const c = colors[toast.tipo]
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 300,
        background: '#1c2030',
        border: `1px solid ${c.border}`,
        borderRadius: 10,
        padding: '12px 18px',
        fontSize: 13,
        fontFamily: 'DM Sans, sans-serif',
        color: c.text,
        opacity: toast.visible ? 1 : 0,
        transform: toast.visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.2s, transform 0.2s',
        pointerEvents: toast.visible ? 'auto' : 'none',
      }}
      onClick={onHide}
    >
      {toast.mensaje}
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    mensaje: '',
    tipo: 'success',
    visible: false,
  })

  const showToast = (mensaje: string, tipo: 'success' | 'error' | 'info' = 'success') => {
    setToast({ mensaje, tipo, visible: true })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
  }

  return { toast, showToast }
}
