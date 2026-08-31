interface Props {
  /** Diámetro en px. */
  size?: number
  /** Sobre fondo primario el spinner tiene que ser blanco. */
  tono?: 'primary' | 'blanco'
  className?: string
}

export default function Spinner({ size = 22, tono = 'primary', className = '' }: Props) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      className={`inline-block shrink-0 animate-spin rounded-full border-2 ${
        tono === 'blanco'
          ? 'border-white/30 border-t-white'
          : 'border-line-strong border-t-primary'
      } ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

/** Spinner centrado, para estados de carga de página o de lista. */
export function SpinnerCentrado({ padding = 40 }: { padding?: number }) {
  return (
    <div className="flex justify-center" style={{ padding }}>
      <Spinner size={24} />
    </div>
  )
}
