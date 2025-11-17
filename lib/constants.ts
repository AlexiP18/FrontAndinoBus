/**
 * Constantes de la aplicación
 */

export const CIUDADES_ECUADOR = [
  'Quito',
  'Guayaquil',
  'Cuenca',
  'Ambato',
  'Loja',
  'Machala',
  'Riobamba',
  'Latacunga',
  'Ibarra',
  'Tulcán',
  'Huaquillas',
  'Cariamanga',
  'Santo Domingo',
  'Esmeraldas',
  'Manta',
  'Portoviejo',
] as const;

export const TIPOS_ASIENTO = {
  NORMAL: 'Normal',
  VIP: 'VIP',
  SEMI_CAMA: 'Semi-cama',
  CAMA: 'Cama',
} as const;

export const TIPOS_VIAJE = {
  DIRECTO: 'directo',
  CON_PARADAS: 'con_paradas',
} as const;

export const ESTADOS_RESERVA = {
  PENDIENTE: 'pendiente',
  CONFIRMADA: 'confirmada',
  CANCELADA: 'cancelada',
  EXPIRADA: 'expirada',
} as const;

export const ESTADOS_BOLETO = {
  EMITIDO: 'emitido',
  USADO: 'usado',
  ANULADO: 'anulado',
} as const;

export const METODOS_PAGO = {
  TRANSFERENCIA: 'transferencia',
  PAYPAL: 'paypal',
  TARJETA: 'tarjeta',
} as const;

export const DIAS_SEMANA = [
  { value: 'LUN', label: 'Lunes' },
  { value: 'MAR', label: 'Martes' },
  { value: 'MIE', label: 'Miércoles' },
  { value: 'JUE', label: 'Jueves' },
  { value: 'VIE', label: 'Viernes' },
  { value: 'SAB', label: 'Sábado' },
  { value: 'DOM', label: 'Domingo' },
] as const;

export const DESCUENTOS = {
  MENOR_EDAD: 0.15, // 15%
  TERCERA_EDAD: 0.20, // 20%
  DISCAPACITADO: 0.25, // 25%
} as const;

export const TIPO_PASAJERO = {
  REGULAR: 'regular',
  MENOR_EDAD: 'menor_edad',
  TERCERA_EDAD: 'tercera_edad',
  DISCAPACITADO: 'discapacitado',
} as const;
