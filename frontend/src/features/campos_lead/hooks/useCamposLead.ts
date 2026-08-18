import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../lib/axios'
import type { CampoLead } from '../../../types'

export interface UsoCampo {
  total: number
  leads: { nombre: string; whatsapp: string; valor: string | null }[]
}

export type CampoLeadInput = Omit<CampoLead, 'id'>

export function useCamposLead() {
  return useQuery({
    queryKey: ['campos-lead'],
    queryFn: () => api.get<CampoLead[]>('/campos-lead/').then(r => r.data),
  })
}

export function useCreateCampoLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CampoLeadInput) =>
      api.post<CampoLead>('/campos-lead/', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campos-lead'] }),
  })
}

export function useUpdateCampoLead() {
  const qc = useQueryClient()
  return useMutation({
    // `clave` no viaja: el backend la ignora porque es inmutable.
    mutationFn: ({ id, data }: { id: number; data: Partial<CampoLeadInput> }) =>
      api.put<CampoLead>(`/campos-lead/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campos-lead'] })
      // Los leads muestran sus datos según esta config.
      qc.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

export function useDeleteCampoLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.delete<{ ok: boolean; leads_afectados: number }>(`/campos-lead/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campos-lead'] })
      // El borrado purga el dato de los leads, así que su caché quedó vieja.
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['lead'] })
    },
  })
}

/** Qué leads perderían su dato si se borra el campo. Se pide al abrir el diálogo. */
export function fetchUsoCampo(id: number) {
  return api.get<UsoCampo>(`/campos-lead/${id}/uso`).then(r => r.data)
}
