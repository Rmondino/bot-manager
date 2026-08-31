import { useQuery } from '@tanstack/react-query'
import api from '../../../lib/axios'

export interface ChatItem {
  id: number
  nombre: string
  whatsapp: string
  estado: string
  listo_para_cerrar: boolean
  /** Preview del último mensaje. null si la conversación está vacía. */
  ultimo_texto: string | null
  ultimo_fecha: string | null
  ultimo_origen: string | null
}

export interface ChatsPage {
  items: ChatItem[]
  total: number
}

interface ChatsParams {
  /** Busca por nombre, número y también dentro del texto de los mensajes. */
  q?: string
  limit?: number
  offset?: number
}

export function useChats(
  params: ChatsParams = {},
  options?: { refetchInterval?: number },
) {
  const { q, limit = 50, offset = 0 } = params
  return useQuery({
    queryKey: ['chats', q ?? '', limit, offset],
    queryFn: () =>
      api
        .get<ChatsPage>('/chats/', { params: { q: q || undefined, limit, offset } })
        .then(r => r.data),
    refetchInterval: options?.refetchInterval,
  })
}
