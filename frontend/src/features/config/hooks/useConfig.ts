import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../lib/axios'
import type { BotConfig } from '../../../types'

export function useConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: () => api.get<BotConfig>('/config/').then(r => r.data),
  })
}

export function useUpdateConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<BotConfig>) =>
      api.put<BotConfig>('/config/', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config'] }),
  })
}
