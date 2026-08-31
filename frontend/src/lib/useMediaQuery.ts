import { useSyncExternalStore } from 'react'

/**
 * Media query reactiva. Se usa para decidir en JS lo que no alcanza con CSS:
 * en pantallas angostas el panel de datos del lead no entra como columna, así
 * que directamente no se ofrece y la ficha completa queda en /leads/:id.
 */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    onChange => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
