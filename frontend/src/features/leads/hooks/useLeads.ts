import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../lib/axios'
import type { Lead } from '../../../types'

export function useLeads(estado?: string) {
  return useQuery({
    queryKey: ['leads', estado ?? 'all'],
    queryFn: () =>
      api.get<Lead[]>('/leads/', { params: estado ? { estado } : undefined }).then(r => r.data),
  })
}

export function useLead(id: number) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: () => api.get<Lead>(`/leads/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { nombre: string; whatsapp: string; tipo_inmueble?: string; zona?: string; superficie_m2?: string; intencion?: string }) =>
      api.post<Lead>('/leads/', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Lead> }) =>
      api.patch<Lead>(`/leads/${id}`, data).then(r => r.data),
    onSuccess: (lead) => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['lead', lead.id] })
    },
  })
}

export function useDeleteLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/leads/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}
