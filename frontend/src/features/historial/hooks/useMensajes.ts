import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
