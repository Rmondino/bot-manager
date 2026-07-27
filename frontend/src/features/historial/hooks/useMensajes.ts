import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../lib/axios'
import type { Mensaje } from '../../../types'

export function useMensajes(whatsapp?: string, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['mensajes', whatsapp ?? 'all'],
    queryFn: () =>
      api.get<Mensaje[]>('/mensajes/', { params: whatsapp ? { whatsapp } : undefined }).then(r => r.data),
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
