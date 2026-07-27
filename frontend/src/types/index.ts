export interface Lead {
  id: number
  lead_id: string
  nombre: string
  whatsapp: string
  fecha_ingreso: string
  estado: 'ACTIVO' | 'HUMANO' | 'CERRADO'
  ultimo_mensaje: string | null
  seguimientos: number
  listo_para_cerrar: boolean
  notas_encargado: string | null
  fecha_cierre: string | null
  tipo_inmueble: string | null
  zona: string | null
  superficie_m2: string | null
  intencion: string | null
  created_at: string
  updated_at: string
}

export interface Mensaje {
  id: number
  lead_whatsapp: string
  fecha_hora: string
  origen: 'LEAD' | 'BOT' | 'HUMANO'
  mensaje: string
}

export interface BotConfig {
  id: number
  nombre_empresa: string
  encargado_numero: string
  horas_seguimiento: number
  max_seguimientos: number
  mensaje_seguimiento: string
  server_url: string
  instance_name: string
  apikey: string
  bot_activo: boolean
  updated_at: string
}

export interface CompanyInfo {
  id: number
  pregunta: string
  respuesta: string
  orden: number
}
