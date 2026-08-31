import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import api from '../../../lib/axios'
import type { Mensaje } from '../../../types'

export interface MensajesPage {
  items: Mensaje[]
  total: number
}

interface MensajesParams {
  whatsapp?: string
  /** Busca en el texto y en el número. Se resuelve en el servidor. */
  q?: string
  limit?: number
  offset?: number
  orden?: 'asc' | 'desc'
}

export function useMensajes(
  params: MensajesParams = {},
  options?: { refetchInterval?: number },
) {
  const { whatsapp, q, limit = 50, offset = 0, orden = 'asc' } = params
  return useQuery({
    // Todos los parámetros entran en la key: si no, dos páginas distintas
    // compartirían caché.
    queryKey: ['mensajes', whatsapp ?? 'all', q ?? '', limit, offset, orden],
    queryFn: () =>
      api
        .get<MensajesPage>('/mensajes/', {
          params: { whatsapp, q: q || undefined, limit, offset, orden },
        })
        .then(r => r.data),
    refetchInterval: options?.refetchInterval,
  })
}

export function useCreateMensaje() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { lead_whatsapp: string; origen: string; mensaje: string }) =>
      api.post<Mensaje>('/mensajes/', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mensajes'] }),
  })
}

/**
 * Conversacion de un lead, paginada hacia atras.
 *
 * Trae las paginas mas nuevas primero (orden desc) y acumula. Se usa
 * useInfiniteQuery y no un `limit` creciente porque el backend topea limit en
 * 200: agrandarlo rompia con 422 en conversaciones largas.
 */
export function useConversacion(
  whatsapp: string,
  options?: { refetchInterval?: number; porPagina?: number },
) {
  const porPagina = options?.porPagina ?? 50
  return useInfiniteQuery({
    queryKey: ['mensajes', 'conversacion', whatsapp, porPagina],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      api
        .get<MensajesPage>('/mensajes/', {
          params: { whatsapp, limit: porPagina, offset: pageParam, orden: 'desc' },
        })
        .then(r => r.data),
    getNextPageParam: (ultima, paginas) => {
      const traidos = paginas.reduce((n, p) => n + p.items.length, 0)
      return traidos < ultima.total ? traidos : undefined
    },
    // Solo la primera pagina se refresca sola: es donde caen los mensajes nuevos.
    refetchInterval: options?.refetchInterval,
    enabled: !!whatsapp,
  })
}
