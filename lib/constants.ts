/**
 * Constantes de la aplicación
 */

// URL base de la API
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

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

/**
 * DEPRECATED: Los datos de provincias y cantones ahora se obtienen desde la API
 * Usar ubicacionApi.getProvincias() en su lugar
 * 
 * Este array se mantiene temporalmente para backwards compatibility
 * pero será removido en una versión futura.
 */
export const PROVINCIAS_CANTONES_ECUADOR_DEPRECATED = [
  {
    provincia: 'Azuay',
    capital: 'Cuenca',
    lat: -2.9001,
    lon: -79.0059,
    cantones: [
      { nombre: 'Cuenca', lat: -2.9001, lon: -79.0059, esCapital: true },
      { nombre: 'Girón', lat: -3.1647, lon: -79.1494, esCapital: false },
      { nombre: 'Gualaceo', lat: -2.8925, lon: -78.7794, esCapital: false },
      { nombre: 'Paute', lat: -2.7769, lon: -78.7572, esCapital: false },
      { nombre: 'Santa Isabel', lat: -3.2667, lon: -79.3167, esCapital: false },
    ]
  },
  {
    provincia: 'Bolívar',
    capital: 'Guaranda',
    lat: -1.5897,
    lon: -79.0059,
    cantones: [
      { nombre: 'Guaranda', lat: -1.5897, lon: -79.0059, esCapital: true },
      { nombre: 'Caluma', lat: -1.6167, lon: -79.2833, esCapital: false },
      { nombre: 'Chimbo', lat: -1.6333, lon: -79.0333, esCapital: false },
      { nombre: 'San Miguel', lat: -1.7167, lon: -79.0500, esCapital: false },
    ]
  },
  {
    provincia: 'Cañar',
    capital: 'Azogues',
    lat: -2.7394,
    lon: -78.8476,
    cantones: [
      { nombre: 'Azogues', lat: -2.7394, lon: -78.8476, esCapital: true },
      { nombre: 'Cañar', lat: -2.5589, lon: -78.9394, esCapital: false },
      { nombre: 'La Troncal', lat: -2.4231, lon: -79.3394, esCapital: false },
    ]
  },
  {
    provincia: 'Carchi',
    capital: 'Tulcán',
    lat: 0.8110,
    lon: -77.7178,
    cantones: [
      { nombre: 'Tulcán', lat: 0.8110, lon: -77.7178, esCapital: true },
      { nombre: 'Bolívar', lat: 0.4833, lon: -77.8667, esCapital: false },
      { nombre: 'Espejo', lat: 0.6167, lon: -77.8667, esCapital: false },
      { nombre: 'Mira', lat: 0.5667, lon: -77.7167, esCapital: false },
    ]
  },
  {
    provincia: 'Chimborazo',
    capital: 'Riobamba',
    lat: -1.6635,
    lon: -78.6547,
    cantones: [
      { nombre: 'Riobamba', lat: -1.6635, lon: -78.6547, esCapital: true },
      { nombre: 'Alausí', lat: -2.2000, lon: -78.8500, esCapital: false },
      { nombre: 'Guano', lat: -1.6000, lon: -78.6333, esCapital: false },
      { nombre: 'Pallatanga', lat: -2.0000, lon: -78.9667, esCapital: false },
    ]
  },
  {
    provincia: 'Cotopaxi',
    capital: 'Latacunga',
    lat: -0.9346,
    lon: -78.6156,
    cantones: [
      { nombre: 'Latacunga', lat: -0.9346, lon: -78.6156, esCapital: true },
      { nombre: 'La Maná', lat: -0.9400, lon: -79.2267, esCapital: false },
      { nombre: 'Pujilí', lat: -0.9500, lon: -78.7000, esCapital: false },
      { nombre: 'Salcedo', lat: -1.0333, lon: -78.5833, esCapital: false },
      { nombre: 'Saquisilí', lat: -0.8333, lon: -78.6667, esCapital: false },
    ]
  },
  {
    provincia: 'El Oro',
    capital: 'Machala',
    lat: -3.2581,
    lon: -79.9553,
    cantones: [
      { nombre: 'Machala', lat: -3.2581, lon: -79.9553, esCapital: true },
      { nombre: 'Arenillas', lat: -3.5500, lon: -80.0667, esCapital: false },
      { nombre: 'El Guabo', lat: -3.2333, lon: -79.8333, esCapital: false },
      { nombre: 'Huaquillas', lat: -3.4764, lon: -80.2308, esCapital: false },
      { nombre: 'Pasaje', lat: -3.3263, lon: -79.8070, esCapital: false },
      { nombre: 'Santa Rosa', lat: -3.4489, lon: -79.9597, esCapital: false },
    ]
  },
  {
    provincia: 'Esmeraldas',
    capital: 'Esmeraldas',
    lat: 0.9682,
    lon: -79.6519,
    cantones: [
      { nombre: 'Esmeraldas', lat: 0.9682, lon: -79.6519, esCapital: true },
      { nombre: 'Atacames', lat: 0.8667, lon: -79.8500, esCapital: false },
      { nombre: 'Muisne', lat: 0.6000, lon: -80.0167, esCapital: false },
      { nombre: 'Quinindé', lat: 0.3167, lon: -79.4667, esCapital: false },
      { nombre: 'San Lorenzo', lat: 1.2833, lon: -78.8333, esCapital: false },
    ]
  },
  {
    provincia: 'Galápagos',
    capital: 'Puerto Baquerizo Moreno',
    lat: -0.7436,
    lon: -90.3054,
    cantones: [
      { nombre: 'Puerto Baquerizo Moreno', lat: -0.7436, lon: -90.3054, esCapital: true },
      { nombre: 'Puerto Ayora', lat: -0.7397, lon: -90.3147, esCapital: false },
      { nombre: 'Puerto Villamil', lat: -0.9500, lon: -90.9667, esCapital: false },
    ]
  },
  {
    provincia: 'Guayas',
    capital: 'Guayaquil',
    lat: -2.1709,
    lon: -79.9224,
    cantones: [
      { nombre: 'Guayaquil', lat: -2.1709, lon: -79.9224, esCapital: true },
      { nombre: 'Daule', lat: -1.8667, lon: -79.9833, esCapital: false },
      { nombre: 'Durán', lat: -2.1717, lon: -79.8392, esCapital: false },
      { nombre: 'Milagro', lat: -2.1344, lon: -79.5944, esCapital: false },
      { nombre: 'Playas', lat: -2.6333, lon: -80.3833, esCapital: false },
      { nombre: 'Salinas', lat: -2.2145, lon: -80.9558, esCapital: false },
      { nombre: 'Samborondón', lat: -1.9667, lon: -79.7333, esCapital: false },
    ]
  },
  {
    provincia: 'Imbabura',
    capital: 'Ibarra',
    lat: 0.3499,
    lon: -78.1263,
    cantones: [
      { nombre: 'Ibarra', lat: 0.3499, lon: -78.1263, esCapital: true },
      { nombre: 'Antonio Ante', lat: 0.3333, lon: -78.1500, esCapital: false },
      { nombre: 'Cotacachi', lat: 0.3000, lon: -78.2667, esCapital: false },
      { nombre: 'Otavalo', lat: 0.2333, lon: -78.2667, esCapital: false },
      { nombre: 'Pimampiro', lat: 0.3833, lon: -77.9500, esCapital: false },
    ]
  },
  {
    provincia: 'Loja',
    capital: 'Loja',
    lat: -3.9930,
    lon: -79.2040,
    cantones: [
      { nombre: 'Loja', lat: -3.9930, lon: -79.2040, esCapital: true },
      { nombre: 'Catamayo', lat: -3.9833, lon: -79.3500, esCapital: false },
      { nombre: 'Cariamanga', lat: -4.3333, lon: -79.5500, esCapital: false },
      { nombre: 'Macará', lat: -4.3833, lon: -79.9500, esCapital: false },
      { nombre: 'Pindal', lat: -3.8667, lon: -79.9167, esCapital: false },
    ]
  },
  {
    provincia: 'Los Ríos',
    capital: 'Babahoyo',
    lat: -1.8015,
    lon: -79.5345,
    cantones: [
      { nombre: 'Babahoyo', lat: -1.8015, lon: -79.5345, esCapital: true },
      { nombre: 'Baba', lat: -1.7167, lon: -79.5333, esCapital: false },
      { nombre: 'Montalvo', lat: -1.7833, lon: -79.2833, esCapital: false },
      { nombre: 'Quevedo', lat: -1.0275, lon: -79.4631, esCapital: false },
      { nombre: 'Ventanas', lat: -1.4500, lon: -79.4667, esCapital: false },
      { nombre: 'Vinces', lat: -1.5500, lon: -79.7500, esCapital: false },
    ]
  },
  {
    provincia: 'Manabí',
    capital: 'Portoviejo',
    lat: -1.0546,
    lon: -80.4549,
    cantones: [
      { nombre: 'Portoviejo', lat: -1.0546, lon: -80.4549, esCapital: true },
      { nombre: 'Bahía de Caráquez', lat: -0.5983, lon: -80.4244, esCapital: false },
      { nombre: 'Chone', lat: -0.6833, lon: -80.1000, esCapital: false },
      { nombre: 'El Carmen', lat: -0.2667, lon: -79.4500, esCapital: false },
      { nombre: 'Jipijapa', lat: -1.3483, lon: -80.5789, esCapital: false },
      { nombre: 'Manta', lat: -0.9500, lon: -80.7333, esCapital: false },
      { nombre: 'Montecristi', lat: -1.0500, lon: -80.6667, esCapital: false },
    ]
  },
  {
    provincia: 'Morona Santiago',
    capital: 'Macas',
    lat: -2.3088,
    lon: -78.1157,
    cantones: [
      { nombre: 'Macas', lat: -2.3088, lon: -78.1157, esCapital: true },
      { nombre: 'Gualaquiza', lat: -3.4000, lon: -78.5667, esCapital: false },
      { nombre: 'Limón Indanza', lat: -2.9667, lon: -78.4167, esCapital: false },
      { nombre: 'Sucúa', lat: -2.4500, lon: -78.1667, esCapital: false },
    ]
  },
  {
    provincia: 'Napo',
    capital: 'Tena',
    lat: -0.9950,
    lon: -77.8167,
    cantones: [
      { nombre: 'Tena', lat: -0.9950, lon: -77.8167, esCapital: true },
      { nombre: 'Archidona', lat: -0.9167, lon: -77.8000, esCapital: false },
      { nombre: 'El Chaco', lat: -0.3333, lon: -77.8167, esCapital: false },
      { nombre: 'Quijos', lat: -0.2667, lon: -77.8667, esCapital: false },
    ]
  },
  {
    provincia: 'Orellana',
    capital: 'Francisco de Orellana',
    lat: -0.4664,
    lon: -76.9871,
    cantones: [
      { nombre: 'Francisco de Orellana (Coca)', lat: -0.4664, lon: -76.9871, esCapital: true },
      { nombre: 'La Joya de los Sachas', lat: -0.3500, lon: -76.6167, esCapital: false },
      { nombre: 'Loreto', lat: -0.7000, lon: -77.2833, esCapital: false },
    ]
  },
  {
    provincia: 'Pastaza',
    capital: 'Puyo',
    lat: -1.4877,
    lon: -78.0037,
    cantones: [
      { nombre: 'Puyo', lat: -1.4877, lon: -78.0037, esCapital: true },
      { nombre: 'Mera', lat: -1.4667, lon: -78.1167, esCapital: false },
      { nombre: 'Santa Clara', lat: -1.2500, lon: -77.8667, esCapital: false },
    ]
  },
  {
    provincia: 'Pichincha',
    capital: 'Quito',
    lat: -0.1807,
    lon: -78.4678,
    cantones: [
      { nombre: 'Quito', lat: -0.1807, lon: -78.4678, esCapital: true },
      { nombre: 'Cayambe', lat: 0.0417, lon: -78.1444, esCapital: false },
      { nombre: 'Machachi', lat: -0.5100, lon: -78.5667, esCapital: false },
      { nombre: 'Pedro Moncayo', lat: 0.1167, lon: -78.1167, esCapital: false },
      { nombre: 'Rumiñahui', lat: -0.3667, lon: -78.4500, esCapital: false },
      { nombre: 'San Miguel de los Bancos', lat: -0.0167, lon: -78.9000, esCapital: false },
    ]
  },
  {
    provincia: 'Santa Elena',
    capital: 'Santa Elena',
    lat: -2.2267,
    lon: -80.8590,
    cantones: [
      { nombre: 'Santa Elena', lat: -2.2267, lon: -80.8590, esCapital: true },
      { nombre: 'La Libertad', lat: -2.2333, lon: -80.9000, esCapital: false },
      { nombre: 'Salinas', lat: -2.2145, lon: -80.9558, esCapital: false },
    ]
  },
  {
    provincia: 'Santo Domingo de los Tsáchilas',
    capital: 'Santo Domingo',
    lat: -0.2521,
    lon: -79.1753,
    cantones: [
      { nombre: 'Santo Domingo', lat: -0.2521, lon: -79.1753, esCapital: true },
    ]
  },
  {
    provincia: 'Sucumbíos',
    capital: 'Nueva Loja',
    lat: 0.0868,
    lon: -76.8873,
    cantones: [
      { nombre: 'Nueva Loja (Lago Agrio)', lat: 0.0868, lon: -76.8873, esCapital: true },
      { nombre: 'Cascales', lat: 0.1167, lon: -77.2667, esCapital: false },
      { nombre: 'Cuyabeno', lat: 0.0000, lon: -75.9167, esCapital: false },
      { nombre: 'Shushufindi', lat: 0.1833, lon: -76.6500, esCapital: false },
    ]
  },
  {
    provincia: 'Tungurahua',
    capital: 'Ambato',
    lat: -1.2543,
    lon: -78.6226,
    cantones: [
      { nombre: 'Ambato', lat: -1.2543, lon: -78.6226, esCapital: true },
      { nombre: 'Baños de Agua Santa', lat: -1.3967, lon: -78.4231, esCapital: false },
      { nombre: 'Cevallos', lat: -1.3500, lon: -78.6167, esCapital: false },
      { nombre: 'Mocha', lat: -1.4833, lon: -78.6500, esCapital: false },
      { nombre: 'Patate', lat: -1.3167, lon: -78.5000, esCapital: false },
      { nombre: 'Pelileo', lat: -1.3333, lon: -78.5500, esCapital: false },
      { nombre: 'Píllaro', lat: -1.1667, lon: -78.5333, esCapital: false },
      { nombre: 'Quero', lat: -1.3833, lon: -78.6167, esCapital: false },
      { nombre: 'Tisaleo', lat: -1.3333, lon: -78.6500, esCapital: false },
    ]
  },
  {
    provincia: 'Zamora Chinchipe',
    capital: 'Zamora',
    lat: -4.0672,
    lon: -78.9507,
    cantones: [
      { nombre: 'Zamora', lat: -4.0672, lon: -78.9507, esCapital: true },
      { nombre: 'Chinchipe', lat: -4.8833, lon: -78.9667, esCapital: false },
      { nombre: 'Nangaritza', lat: -4.2667, lon: -78.6667, esCapital: false },
      { nombre: 'Yacuambi', lat: -3.6167, lon: -78.9000, esCapital: false },
    ]
  },
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
