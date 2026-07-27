import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../lib/axios'
import type { CompanyInfo } from '../../../types'

export function useCompanyInfo() {
  return useQuery({
    queryKey: ['company-info'],
    queryFn: () => api.get<CompanyInfo[]>('/company-info/').then(r => r.data),
  })
}

export function useCreateCompanyInfo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { pregunta: string; respuesta: string; orden: number }) =>
      api.post<CompanyInfo>('/company-info/', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company-info'] }),
  })
}

export function useUpdateCompanyInfo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CompanyInfo> }) =>
      api.put<CompanyInfo>(`/company-info/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company-info'] }),
  })
}

export function useDeleteCompanyInfo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/company-info/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company-info'] }),
  })
}
