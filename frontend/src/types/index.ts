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
  fecha_cierre: string | null
  /** Datos de calificación. Las claves las define CampoLead. */
  datos: Record<string, string>
  created_at: string
  updated_at: string
}

export type TipoCampo = 'texto' | 'numero' | 'opciones' | 'textarea'

export interface CampoLead {
  id: number
  /** Key dentro de Lead.datos. Inmutable una vez creado. */
  clave: string
  etiqueta: string
  descripcion: string | null
  /** Valores permitidos separados por coma, para tipo === 'opciones'. */
  opciones: string | null
  tipo: TipoCampo
  pide_el_bot: boolean
  activo: boolean
  orden: number
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
