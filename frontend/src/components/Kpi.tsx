interface Props {
  label: string
  valor: number
  /** Clase de fondo del punto de color (ej. `bg-ok`). Ata la métrica al estado. */
  punto?: string
  tono?: string
  /** Tarjeta destacada, para "listo para cerrar": la señal más valiosa del panel. */
  destacado?: boolean
}

export default function Kpi({
  label,
  valor,
  punto,
  tono = 'text-ink',
  destacado = false,
}: Props) {
  return (
    <div
      className={`rounded-lg border px-4 py-3.5 shadow-card ${
        destacado ? 'border-hot-line bg-hot-bg' : 'border-line bg-surface'
      }`}
    >
      <div
        className={`flex items-center gap-1.5 text-[11.5px] font-semibold tracking-[0.06em] uppercase ${
          destacado ? 'text-hot' : 'text-subtle'
        }`}
      >
        {punto && <i className={`block size-[7px] shrink-0 rounded-full ${punto}`} />}
        {label}
      </div>
      <div
        className={`mt-1.5 text-[31px] leading-none font-semibold tracking-[-0.02em] tabular-nums ${
          destacado ? 'text-hot' : tono
        }`}
      >
        {valor}
      </div>
    </div>
  )
}
