import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../lib/axios'

export function useWhatsappSend() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ whatsapp, texto }: { whatsapp: string; texto: string }) =>
      api.post('/whatsapp/send', { whatsapp, texto }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mensajes'] }),
  })
}
