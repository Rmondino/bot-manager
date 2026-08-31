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
  success: 'border-ok-line bg-ok-bg text-ok',
  error: 'border-danger-line bg-danger-bg text-danger',
  info: 'border-info-line bg-info-bg text-info',
}

export default function Toast({ toast, onHide }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      onClick={onHide}
      className={`fixed right-6 bottom-6 z-300 rounded-lg border px-4 py-3 text-[13.5px] font-medium shadow-pop transition-all duration-200 ${
        colors[toast.tipo]
      } ${toast.visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-5 opacity-0'}`}
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
