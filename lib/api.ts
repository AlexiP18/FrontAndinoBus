/**
 * API Service - Centralized HTTP client for backend communication
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8081';

// Tipos de respuesta
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Configuración base de fetch
const fetchConfig = (token?: string, method: string = 'GET', body?: unknown): RequestInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  return config;
};

// Manejo de errores
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  // Manejar respuestas vacías (204 No Content, etc.)
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return undefined as T;
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : undefined as T;
};

// ==================== AUTENTICACIÓN ====================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nombres?: string;
  apellidos?: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  rol: string;
  nombres?: string;
  apellidos?: string;
  
  // Campos adicionales para COOPERATIVA
  rolCooperativa?: string; // ADMIN | OFICINISTA | CHOFER
  cooperativaId?: number;
  cooperativaNombre?: string;
  cedula?: string;
  telefono?: string;
  
  // Campos para confirmación de email
  message?: string;
  requiresConfirmation?: boolean;
}

export interface MeResponse {
  userId: number;
  email: string;
  rol: 'CLIENTE' | 'COOPERATIVA' | 'ADMIN';
  nombres?: string;
  apellidos?: string;
  fotoUrl?: string;
  
  // Campos adicionales para COOPERATIVA
  rolCooperativa?: 'ADMIN' | 'OFICINISTA' | 'CHOFER';
  cooperativaId?: number;
  cooperativaNombre?: string;
  cedula?: string;
  telefono?: string;
}

/**
 * Resuelve una URL de recurso estático (imágenes, logos, etc.)
 * Maneja URLs relativas y absolutas correctamente
 */
export const resolveResourceUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  
  // Si ya es una URL absoluta, la retornamos tal cual
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  
  // Si es una URL relativa, la concatenamos con BASE_URL
  return `${BASE_URL}${url.startsWith('/') ? url : '/' + url}`;
};

export const authApi = {
  /**
   * Login para usuarios CLIENTE (tabla: app_user)
   */
  loginCliente: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/auth/login-cliente`, fetchConfig(undefined, 'POST', credentials));
    return handleResponse<AuthResponse>(response);
  },

  /**
   * Login para usuarios COOPERATIVA (tabla: usuario_cooperativa)
   * Incluye: ADMIN, OFICINISTA, CHOFER
   */
  loginCooperativa: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/auth/login-cooperativa`, fetchConfig(undefined, 'POST', credentials));
    return handleResponse<AuthResponse>(response);
  },

  /**
   * Login para ADMINISTRADOR del sistema (hardcoded)
   */
  loginAdmin: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/auth/login-admin`, fetchConfig(undefined, 'POST', credentials));
    return handleResponse<AuthResponse>(response);
  },

  /**
   * Login genérico (mantener para compatibilidad, usa loginCliente)
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/auth/login-cliente`, fetchConfig(undefined, 'POST', credentials));
    return handleResponse<AuthResponse>(response);
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/auth/register`, fetchConfig(undefined, 'POST', data));
    return handleResponse<AuthResponse>(response);
  },

  me: async (token: string): Promise<MeResponse> => {
    const response = await fetch(`${API_URL}/users/me`, fetchConfig(token));
    return handleResponse<MeResponse>(response);
  },

  logout: async (token: string): Promise<void> => {
    const response = await fetch(`${API_URL}/auth/logout`, fetchConfig(token, 'POST'));
    if (!response.ok) {
      throw new Error('Error al cerrar sesión');
    }
  },
};

// ==================== CLIENTE PERFIL ====================

export interface UpdateClienteRequest {
  nombres: string;
  apellidos: string;
  telefono?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const clienteApi = {
  /**
   * Actualizar perfil del cliente autenticado
   */
  updateProfile: async (data: UpdateClienteRequest, token: string): Promise<void> => {
    const response = await fetch(`${API_URL}/cliente/perfil`, fetchConfig(token, 'PUT', data));
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al actualizar perfil' }));
      throw new Error(errorData.message || 'Error al actualizar perfil');
    }
  },

  /**
   * Cambiar contraseña del cliente autenticado
   */
  changePassword: async (data: ChangePasswordRequest, token: string): Promise<void> => {
    const response = await fetch(`${API_URL}/cliente/cambiar-password`, fetchConfig(token, 'PUT', data));
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al cambiar contraseña' }));
      throw new Error(errorData.message || 'Error al cambiar contraseña');
    }
  },
};

// ==================== RUTAS Y VIAJES ====================

export interface BuscarRutasParams {
  origen?: string;
  destino?: string;
  fecha?: string;
  cooperativa?: string;
  tipoAsiento?: string;
  tipoViaje?: string;
  page?: number;
  size?: number;
}

export interface RutaItem {
  frecuenciaId: number;
  cooperativaId: number;
  cooperativa: string;
  origen: string;
  destino: string;
  horaSalida: string;
  duracionEstimada: string;
  tipoViaje: string;
  asientosPorTipo: Record<string, number>;
  fecha?: string;
  precio?: number;
  precioBase?: number;
  busPlaca?: string;
  busMarca?: string;
}

export interface RutasResponse {
  items: RutaItem[];
  total: number;
  page: number;
  size: number;
}

export interface DisponibilidadResponse {
  viajeId: number;
  totalAsientos: number;
  disponibles: number;
  porTipo: Record<string, number>;
}

export interface BusInfo {
  viajeId: number;
  busId: number;
  cooperativa: string;
  numeroInterno: string;
  placa: string;
  chasisMarca: string;
  carroceriaMarca: string;
  fotoUrl?: string;
}

export const rutasApi = {
  buscar: async (params: BuscarRutasParams): Promise<RutasResponse> => {
    const queryParams = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    );
    const response = await fetch(`${API_URL}/rutas/buscar?${queryParams}`);
    return handleResponse<RutasResponse>(response);
  },

  obtenerDisponibilidad: async (viajeId: number): Promise<DisponibilidadResponse> => {
    const response = await fetch(`${API_URL}/viajes/${viajeId}/disponibilidad`);
    return handleResponse<DisponibilidadResponse>(response);
  },

  obtenerBusInfo: async (viajeId: number): Promise<BusInfo> => {
    const response = await fetch(`${API_URL}/viajes/${viajeId}/bus`);
    return handleResponse<BusInfo>(response);
  },

  obtenerViajesPorFecha: async (fecha: string, page = 0, size = 20) => {
    const response = await fetch(`${API_URL}/viajes?fecha=${fecha}&page=${page}&size=${size}`);
    return handleResponse(response);
  },
};

// ==================== RESERVAS Y VENTAS ====================

export interface ReservaCreateRequest {
  viajeId?: number;
  frecuenciaId?: number;
  fecha?: string;
  asientos: string[];
  pasajeros?: Array<{
    nombre: string;
    cedula: string;
    email?: string;
    tipoPasajero?: string;
  }>;
  // Campos legacy/adicionales
  tipoAsiento?: string;
  tramoOrigen?: string;
  tramoDestino?: string;
  clienteId?: number;
  clienteEmail?: string;
}

export interface ReservaResponse {
  id: number;
  viajeId: number;
  asientos: string[];
  estado: string;
  fechaExpira: string;
}

export interface ReservaDetalleResponse extends ReservaResponse {
  cliente: string;
  monto: number;
}

export interface EmitirBoletoRequest {
  reservaId: number;
  clienteNombre: string;
  clienteCedula?: string;
  clienteEmail?: string;
  metodoPago: string;
}

export interface BoletoResponse {
  codigo: string;
  reservaId: number;
  estado: string;
  clienteNombre: string;
  asientos: string[];
  monto: number;
  fechaEmision: string;
  qr?: string;
  qrUrl?: string;
}

export const ventasApi = {
  crearReserva: async (data: ReservaCreateRequest, token?: string): Promise<ReservaResponse> => {
    const response = await fetch(`${API_URL}/reservas`, fetchConfig(token, 'POST', data));
    return handleResponse<ReservaResponse>(response);
  },

  obtenerReserva: async (id: number, token?: string): Promise<ReservaDetalleResponse> => {
    const response = await fetch(`${API_URL}/reservas/${id}`, fetchConfig(token));
    return handleResponse<ReservaDetalleResponse>(response);
  },

  emitirBoleto: async (data: EmitirBoletoRequest, token?: string): Promise<BoletoResponse> => {
    const response = await fetch(`${API_URL}/boletos/emitir`, fetchConfig(token, 'POST', data));
    return handleResponse<BoletoResponse>(response);
  },

  obtenerBoleto: async (codigo: string, token?: string): Promise<BoletoResponse> => {
    const response = await fetch(`${API_URL}/boletos/${codigo}`, fetchConfig(token));
    return handleResponse<BoletoResponse>(response);
  },

  pagoTransferencia: async (formData: FormData, token?: string): Promise<{ paymentId: string }> => {
    const response = await fetch(`${API_URL}/pagos/transferencia`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });
    return handleResponse<{ paymentId: string }>(response);
  },
};

// ==================== COOPERATIVAS ====================

export interface CooperativaCreateRequest {
  nombre: string;
  ruc: string;
  logoUrl?: string;
  activo?: boolean;
}

export type CooperativaUpdateRequest = CooperativaCreateRequest;

export interface CooperativaResponse {
  id: number;
  nombre: string;
  ruc: string;
  logoUrl?: string;
  activo: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const cooperativasApi = {
  listar: async (search?: string, page = 0, size = 20, token?: string): Promise<PageResponse<CooperativaResponse>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search) params.append('search', search);
    const response = await fetch(`${API_URL}/cooperativas?${params}`, fetchConfig(token));
    return handleResponse<PageResponse<CooperativaResponse>>(response);
  },

  obtener: async (id: number, token?: string): Promise<CooperativaResponse> => {
    const response = await fetch(`${API_URL}/cooperativas/${id}`, fetchConfig(token));
    return handleResponse<CooperativaResponse>(response);
  },

  crear: async (data: CooperativaCreateRequest, token?: string): Promise<CooperativaResponse> => {
    const response = await fetch(`${API_URL}/cooperativas`, fetchConfig(token, 'POST', data));
    return handleResponse<CooperativaResponse>(response);
  },

  actualizar: async (id: number, data: CooperativaUpdateRequest, token?: string): Promise<CooperativaResponse> => {
    const response = await fetch(`${API_URL}/cooperativas/${id}`, fetchConfig(token, 'PUT', data));
    return handleResponse<CooperativaResponse>(response);
  },

  eliminar: async (id: number, token?: string): Promise<void> => {
    await fetch(`${API_URL}/cooperativas/${id}`, fetchConfig(token, 'DELETE'));
  },
};

// ==================== BUSES ====================

export interface BusCreateRequest {
  numeroInterno: string;
  placa: string;
  chasisMarca: string;
  carroceriaMarca: string;
  fotoUrl?: string;
  activo?: boolean;
}

export interface BusResponse extends BusCreateRequest {
  id: number;
  cooperativaId: number;
}

export const busesApi = {
  listarPorCooperativa: async (cooperativaId: number, page = 0, size = 20, token?: string): Promise<PageResponse<BusResponse>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    const response = await fetch(`${API_URL}/cooperativas/${cooperativaId}/buses?${params}`, fetchConfig(token));
    return handleResponse<PageResponse<BusResponse>>(response);
  },

  obtener: async (id: number, token?: string): Promise<BusResponse> => {
    const response = await fetch(`${API_URL}/buses/${id}`, fetchConfig(token));
    return handleResponse<BusResponse>(response);
  },

  crear: async (cooperativaId: number, data: BusCreateRequest, token?: string): Promise<BusResponse> => {
    const response = await fetch(`${API_URL}/cooperativas/${cooperativaId}/buses`, fetchConfig(token, 'POST', data));
    return handleResponse<BusResponse>(response);
  },
};

// ==================== FRECUENCIAS ====================

export interface FrecuenciaCreateRequest {
  origen: string;
  destino: string;
  horaSalida: string;
  duracionEstimadaMin: number;
  diasOperacion: string;
  activa?: boolean;
}

export interface FrecuenciaResponse extends FrecuenciaCreateRequest {
  id: number;
  cooperativaId: number;
}

export const frecuenciasApi = {
  listarPorCooperativa: async (cooperativaId: number, search?: string, page = 0, size = 20, token?: string): Promise<PageResponse<FrecuenciaResponse>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search) params.append('search', search);
    const response = await fetch(`${API_URL}/cooperativas/${cooperativaId}/frecuencias?${params}`, fetchConfig(token));
    return handleResponse<PageResponse<FrecuenciaResponse>>(response);
  },

  obtener: async (id: number, token?: string): Promise<FrecuenciaResponse> => {
    const response = await fetch(`${API_URL}/frecuencias/${id}`, fetchConfig(token));
    return handleResponse<FrecuenciaResponse>(response);
  },

  crear: async (cooperativaId: number, data: FrecuenciaCreateRequest, token?: string): Promise<FrecuenciaResponse> => {
    const response = await fetch(`${API_URL}/cooperativas/${cooperativaId}/frecuencias`, fetchConfig(token, 'POST', data));
    return handleResponse<FrecuenciaResponse>(response);
  },

  actualizar: async (id: number, data: FrecuenciaCreateRequest, token?: string): Promise<FrecuenciaResponse> => {
    const response = await fetch(`${API_URL}/frecuencias/${id}`, fetchConfig(token, 'PUT', data));
    return handleResponse<FrecuenciaResponse>(response);
  },

  eliminar: async (id: number, token?: string): Promise<void> => {
    await fetch(`${API_URL}/frecuencias/${id}`, fetchConfig(token, 'DELETE'));
  },
};

// ==================== RESERVAS ====================

// La interfaz ReservaCreateRequest ya está definida anteriormente

export interface ReservaCreateRequestLegacy {
  viajeId: number;
  tramoOrigen?: string;
  tramoDestino?: string;
  asientos: string[]; // ["1A", "2B"]
  tipoAsiento?: string; // "NORMAL" | "VIP"
  clienteId?: number;
  clienteEmail?: string; // Email del cliente (requerido en dev)
}

export interface ReservaResponse {
  id: number;
  viajeId: number;
  asientos: string[];
  estado: string; // "PENDIENTE" | "PAGADO" | "CANCELADO" | "EXPIRADO"
  fechaExpira: string;
}

export interface ReservaDetalleResponse {
  id: number;
  viajeId: number;
  cliente: string;
  asientos: string[];
  estado: string;
  monto: number;
  // Información del viaje
  fecha?: string;
  horaSalida?: string;
  origen?: string;
  destino?: string;
  busPlaca?: string;
  cooperativaNombre?: string;
  rutaNombre?: string;
  codigoBoleto?: string;
}

export interface AsientoDisponibilidadDto {
  numeroAsiento: string; // "1", "2", "3", etc.
  tipoAsiento: string; // "NORMAL" | "VIP" | "ACONDICIONADO"
  estado: string; // "DISPONIBLE" | "RESERVADO" | "VENDIDO" | "BLOQUEADO"
  fila: number | null; // Fila del asiento en el layout
  columna: number | null; // Columna del asiento (0-4, donde 0-1 izq, 2 centro, 3-4 der)
  piso: number | null; // Piso del asiento (1 o 2 para buses de dos pisos)
}

export interface AsientosViajeResponse {
  viajeId: number; // ID real del viaje para crear reservas
  asientos: AsientoDisponibilidadDto[];
}

export interface AsientosEstadisticas {
  total: number;
  disponibles: number;
  reservados: number;
  vendidos: number;
}

export interface ReservaCooperativaDto {
  id: number;
  viajeId: number;
  clienteEmail: string;
  asientos: number;
  estado: string;
  monto: number;
  expiresAt?: string;
  createdAt?: string;
  fecha?: string;
  horaSalida?: string;
  origen?: string;
  destino?: string;
  busPlaca?: string;
  rutaNombre?: string;
}

export const reservasApi = {
  crear: async (data: ReservaCreateRequest, token?: string): Promise<ReservaResponse> => {
    const response = await fetch(`${API_URL}/reservas`, fetchConfig(token, 'POST', data));
    return handleResponse<ReservaResponse>(response);
  },

  obtener: async (reservaId: number, token: string): Promise<ReservaDetalleResponse> => {
    const response = await fetch(`${API_URL}/reservas/${reservaId}`, fetchConfig(token));
    return handleResponse<ReservaDetalleResponse>(response);
  },

  misReservas: async (token: string, clienteEmail?: string): Promise<ReservaDetalleResponse[]> => {
    const url = clienteEmail 
      ? `${API_URL}/reservas/mis-reservas?clienteEmail=${encodeURIComponent(clienteEmail)}`
      : `${API_URL}/reservas/mis-reservas`;
    const response = await fetch(url, fetchConfig(token));
    return handleResponse<ReservaDetalleResponse[]>(response);
  },

  cancelar: async (reservaId: number, token: string): Promise<void> => {
    await fetch(`${API_URL}/reservas/${reservaId}`, fetchConfig(token, 'DELETE'));
  },

  obtenerAsientosDisponibles: async (viajeId: number, token?: string): Promise<AsientoDisponibilidadDto[]> => {
    const response = await fetch(`${API_URL}/reservas/viaje/${viajeId}/asientos`, fetchConfig(token));
    return handleResponse<AsientoDisponibilidadDto[]>(response);
  },

  obtenerAsientosDisponiblesPorFrecuencia: async (frecuenciaId: number, fecha: string, token?: string): Promise<AsientosViajeResponse> => {
    const response = await fetch(`${API_URL}/reservas/frecuencia/${frecuenciaId}/asientos?fecha=${fecha}`, fetchConfig(token));
    return handleResponse<AsientosViajeResponse>(response);
  },

  obtenerPorCooperativa: async (cooperativaId: number, estado?: string, token?: string): Promise<ReservaCooperativaDto[]> => {
    const url = estado 
      ? `${API_URL}/reservas/cooperativa/${cooperativaId}?estado=${estado}`
      : `${API_URL}/reservas/cooperativa/${cooperativaId}`;
    const response = await fetch(url, fetchConfig(token));
    return handleResponse<ReservaCooperativaDto[]>(response);
  },
};

// ==================== VIAJES - ASIENTOS ====================

export const viajeAsientosApi = {
  /**
   * Obtiene todos los asientos de un viaje con su estado actual
   */
  obtenerAsientos: async (viajeId: number, token?: string): Promise<AsientoDisponibilidadDto[]> => {
    const response = await fetch(`${API_URL}/viajes/${viajeId}/asientos`, fetchConfig(token));
    return handleResponse<AsientoDisponibilidadDto[]>(response);
  },

  /**
   * Obtiene solo los asientos disponibles de un viaje
   */
  obtenerDisponibles: async (viajeId: number, token?: string): Promise<AsientoDisponibilidadDto[]> => {
    const response = await fetch(`${API_URL}/viajes/${viajeId}/asientos/disponibles`, fetchConfig(token));
    return handleResponse<AsientoDisponibilidadDto[]>(response);
  },

  /**
   * Obtiene estadísticas de ocupación de un viaje
   */
  obtenerEstadisticas: async (viajeId: number, token?: string): Promise<AsientosEstadisticas> => {
    const response = await fetch(`${API_URL}/viajes/${viajeId}/asientos/estadisticas`, fetchConfig(token));
    return handleResponse<AsientosEstadisticas>(response);
  },

  /**
   * Inicializa los asientos de un viaje basándose en el layout del bus
   */
  inicializar: async (viajeId: number, token: string): Promise<{success: boolean, mensaje: string, asientosCreados: number}> => {
    const response = await fetch(`${API_URL}/viajes/${viajeId}/asientos/inicializar`, fetchConfig(token, 'POST'));
    return handleResponse<{success: boolean, mensaje: string, asientosCreados: number}>(response);
  },
};

// ==================== PAGOS ====================

export interface PagoConfirmacionRequest {
  reservaId: number;
  metodoPago: string; // "EFECTIVO" | "TARJETA" | "PAYPAL"
  referencia?: string;
}

export interface PagoResponse {
  reservaId: number;
  estado: string; // "PAGADO" | "RECHAZADO"
  mensaje: string;
}

export const pagosApi = {
  confirmar: async (data: PagoConfirmacionRequest, token: string): Promise<PagoResponse> => {
    const response = await fetch(`${API_URL}/pagos/confirmar`, fetchConfig(token, 'POST', data));
    return handleResponse<PagoResponse>(response);
  },
};

// ==================== BOLETOS ====================

export interface BoletoResponse {
  codigoBoleto: string; // Formato: AB-YYYYMMDD-XXXXX
  reservaId: number;
  estado: string;
  codigoQR: string; // Data URL base64 del QR
}

export const boletosApi = {
  generar: async (reservaId: number, token: string): Promise<BoletoResponse> => {
    const response = await fetch(`${API_URL}/boletos/reserva/${reservaId}`, fetchConfig(token));
    return handleResponse<BoletoResponse>(response);
  },
};

// ==================== COOPERATIVA ====================

export interface BusDto {
  id: number;
  numeroInterno: string;
  placa: string;
  chasisMarca?: string;
  carroceriaMarca?: string;
  capacidadAsientos: number;
  estado: 'DISPONIBLE' | 'EN_SERVICIO' | 'MANTENIMIENTO' | 'PARADA';
  activo: boolean;
  fotoUrl?: string;
}

export interface RutaDto {
  id: number;
  origen: string;
  destino: string;
}

export interface FrecuenciaDto {
  id: number;
  ruta?: RutaDto;
  horaSalida: string; // "HH:mm"
  duracionEstimadaMin?: number;
  diasSemana?: string;
  activa: boolean;
  paradas?: ParadaIntermediaDto[];
}

export interface ParadaIntermediaDto {
  id: number;
  ciudad: string;
  ordenParada: number;
  minutosDesdeOrigen: number;
  precioAdicional?: number;
}

export interface AsignacionBusFrecuenciaDto {
  id: number;
  bus: BusDto;
  frecuencia?: FrecuenciaDto;
  fechaInicio: string; // ISO date
  fechaFin?: string; // ISO date
  estado: 'ACTIVA' | 'SUSPENDIDA' | 'FINALIZADA';
  observaciones?: string;
}

export interface DiaParadaBusDto {
  id: number;
  bus: BusDto;
  fecha: string; // ISO date
  motivo: 'MANTENIMIENTO' | 'EXCESO_CAPACIDAD' | 'OTRO';
  observaciones?: string;
}

export interface AsignarBusRequest {
  busId: number;
  frecuenciaId: number;
  fechaInicio: string; // ISO date
  fechaFin?: string; // ISO date
  observaciones?: string;
}

export interface RegistrarDiaParadaRequest {
  busId: number;
  fecha: string; // ISO date
  motivo: 'MANTENIMIENTO' | 'EXCESO_CAPACIDAD' | 'OTRO';
  observaciones?: string;
}

export interface ResumenDisponibilidadDto {
  totalBuses: number;
  busesDisponibles: number;
  busesEnServicio: number;
  busesMantenimiento: number;
  busesParada: number;
  frecuenciasActivas?: number;
  excesoBuses: number;
}

// ==================== COOPERATIVA STATS ====================

export interface CooperativaStats {
  cooperativaId: number;
  totalBuses: number;
  busesActivos: number;
  totalPersonal: number;
  ventasDelMes: number;
  ventasDeHoy: number;
}

export interface AdminStats {
  busesActivos: number;
  totalPersonal: number;
  choferes: number;
  oficinistas: number;
  ventasHoy: number;
  viajesHoy: number;
}

export interface OficinistaStats {
  boletosVendidosHoy: number;
  recaudadoHoy: number;
  reservasPendientes: number;
  viajesProgramados: number;
  pasajerosRegistrados: number;
}

export interface ViajeActual {
  viajeId: number;
  origen: string;
  destino: string;
  fecha: string;
  horaSalida: string;
  busPlaca: string;
  bus?: string; // Alias opcional
  pasajerosConfirmados: number;
  pasajeros?: number; // Alias opcional
  estado: string;
}

export interface ChoferStats {
  viajesDelMes: number;
  pasajerosTransportados: number;
  calificacion: number;
  viajeActual?: ViajeActual;
}

export interface BusInfoDto {
  id: number;
  placa: string;
  modelo: string;
  capacidad: number;
  estado: string;
  anioFabricacion?: number;
}

export interface BusesListResponse {
  buses: BusInfoDto[];
  total: number;
}

export interface PersonalInfoDto {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  rolCooperativa: string;
  cedula: string;
  telefono: string;
  activo: boolean;
}

export interface PersonalListResponse {
  personal: PersonalInfoDto[];
  total: number;
}

// ==================== REPORTES COOPERATIVA ====================

export interface ResumenCooperativaResponse {
  // Ventas
  ventasTotales: number;
  ventasCambio: number;
  totalTransacciones: number;
  ticketPromedio: number;
  
  // Viajes
  totalViajes: number;
  viajesCompletados: number;
  viajesCancelados: number;
  viajesPendientes: number;
  
  // Ocupación
  ocupacionPromedio: number;
  ocupacionMasAlta: number;
  ocupacionMasBaja: number;
  asientosTotalesVendidos: number;
  
  // Recursos
  totalBuses: number;
  busesActivos: number;
  totalChoferes: number;
  choferesActivos: number;
  totalRutas: number;
  rutasActivas: number;
}

export interface VentaDiariaDto {
  fecha: string;
  diaSemana: string;
  monto: number;
  transacciones: number;
}

export interface RutaVentasDto {
  rutaId: number;
  nombreRuta: string;
  terminalOrigen: string;
  terminalDestino: string;
  ventas: number;
  boletos: number;
}

export interface ReporteVentasResponse {
  ventasTotales: number;
  cambioVentas: number;
  totalTransacciones: number;
  ticketPromedio: number;
  ventasDiarias: number;
  ventasPorDia: VentaDiariaDto[];
  topRutas: RutaVentasDto[];
}

export interface ViajeEstadoDto {
  estado: string;
  cantidad: number;
  porcentaje: number;
}

export interface ViajeDiarioDto {
  fecha: string;
  diaSemana: string;
  total: number;
  completados: number;
  cancelados: number;
}

export interface ViajeRutaDto {
  rutaId: number;
  nombreRuta: string;
  totalViajes: number;
  viajesCompletados: number;
  porcentajeOcupacion: number;
}

export interface ViajeBusDto {
  busId: number;
  placa: string;
  totalViajes: number;
  viajesCompletados: number;
  horasTrabajadas: number;
}

export interface ReporteViajesResponse {
  totalViajes: number;
  viajesCompletados: number;
  viajesCancelados: number;
  viajesPendientes: number;
  viajesEnRuta: number;
  porcentajeCompletados: number;
  porcentajeCancelados: number;
  viajesPorEstado: ViajeEstadoDto[];
  viajesPorDia: ViajeDiarioDto[];
  viajesPorRuta: ViajeRutaDto[];
  viajesPorBus: ViajeBusDto[];
}

export interface OcupacionDiariaDto {
  fecha: string;
  diaSemana: string;
  porcentaje: number;
  asientosVendidos: number;
  asientosTotales: number;
}

export interface OcupacionRutaDto {
  nombreRuta: string;
  ocupacionPromedio: number;
  viajes: number;
}

export interface OcupacionHoraDto {
  hora: number;
  ocupacionPromedio: number;
  viajes: number;
}

export interface ReporteOcupacionResponse {
  ocupacionPromedio: number;
  ocupacionMasAlta: number;
  ocupacionMasBaja: number;
  asientosTotales: number;
  asientosVendidos: number;
  asientosDisponibles: number;
  ocupacionPorDia: OcupacionDiariaDto[];
  ocupacionPorRuta: OcupacionRutaDto[];
  ocupacionPorHora: OcupacionHoraDto[];
}

export interface DetalleRutaDto {
  rutaId: number;
  terminalOrigen: string;
  terminalDestino: string;
  nombreRuta: string;
  distanciaKm: number;
  duracionMinutos: number;
  precioBase: number;
  frecuenciasActivas: number;
  viajesRealizados: number;
  ingresosTotales: number;
  ocupacionPromedio: number;
  activa: boolean;
}

export interface ReporteRutasResponse {
  totalRutas: number;
  rutasActivas: number;
  frecuenciasActivas: number;
  rutas: DetalleRutaDto[];
}

export const cooperativaApi = {
  // ========== Buses ==========
  obtenerBuses: async (cooperativaId: number, token: string): Promise<BusDto[]> => {
    const response = await fetch(
      `${API_URL}/cooperativa/buses?cooperativaId=${cooperativaId}`,
      fetchConfig(token)
    );
    return handleResponse<BusDto[]>(response);
  },

  obtenerBusesDisponibles: async (
    cooperativaId: number,
    fecha: string,
    token: string
  ): Promise<BusDto[]> => {
    const response = await fetch(
      `${API_URL}/cooperativa/buses/disponibles?cooperativaId=${cooperativaId}&fecha=${fecha}`,
      fetchConfig(token)
    );
    return handleResponse<BusDto[]>(response);
  },

  /**
   * Obtener lista de buses de la cooperativa (para dashboard)
   */
  getBuses: async (cooperativaId: number, token: string): Promise<BusesListResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/buses`,
      fetchConfig(token)
    );
    return handleResponse<BusesListResponse>(response);
  },

  // ========== Asignaciones ==========
  asignarBus: async (
    data: AsignarBusRequest,
    token: string
  ): Promise<AsignacionBusFrecuenciaDto> => {
    const response = await fetch(
      `${API_URL}/cooperativa/asignaciones`,
      fetchConfig(token, 'POST', data)
    );
    return handleResponse<AsignacionBusFrecuenciaDto>(response);
  },

  obtenerAsignaciones: async (
    cooperativaId: number,
    token: string
  ): Promise<AsignacionBusFrecuenciaDto[]> => {
    const response = await fetch(
      `${API_URL}/cooperativa/asignaciones?cooperativaId=${cooperativaId}`,
      fetchConfig(token)
    );
    return handleResponse<AsignacionBusFrecuenciaDto[]>(response);
  },

  finalizarAsignacion: async (asignacionId: number, token: string): Promise<void> => {
    await fetch(
      `${API_URL}/cooperativa/asignaciones/${asignacionId}/finalizar`,
      fetchConfig(token, 'PATCH')
    );
  },

  // ========== Días de Parada ==========
  registrarDiaParada: async (
    data: RegistrarDiaParadaRequest,
    token: string
  ): Promise<DiaParadaBusDto> => {
    const response = await fetch(
      `${API_URL}/cooperativa/dias-parada`,
      fetchConfig(token, 'POST', data)
    );
    return handleResponse<DiaParadaBusDto>(response);
  },

  obtenerDiasParada: async (
    cooperativaId: number,
    fechaInicio: string,
    fechaFin: string,
    token: string
  ): Promise<DiaParadaBusDto[]> => {
    const response = await fetch(
      `${API_URL}/cooperativa/dias-parada?cooperativaId=${cooperativaId}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      fetchConfig(token)
    );
    return handleResponse<DiaParadaBusDto[]>(response);
  },

  // ========== Resumen ==========
  obtenerResumenDisponibilidad: async (
    cooperativaId: number,
    fecha: string,
    token: string
  ): Promise<ResumenDisponibilidadDto> => {
    const response = await fetch(
      `${API_URL}/cooperativa/resumen-disponibilidad?cooperativaId=${cooperativaId}&fecha=${fecha}`,
      fetchConfig(token)
    );
    return handleResponse<ResumenDisponibilidadDto>(response);
  },

  // ========== Frecuencias ==========
  obtenerFrecuencias: async (cooperativaId: number, token?: string): Promise<FrecuenciaDto[]> => {
    const response = await fetch(
      `${API_URL}/cooperativas/${cooperativaId}/frecuencias`,
      fetchConfig(token)
    );
    const pageResponse = await handleResponse<PageResponse<FrecuenciaDto>>(response);
    return pageResponse.content;
  },

  // ========== Estadísticas ==========
  /**
   * Obtener estadísticas generales de la cooperativa
   */
  getStats: async (cooperativaId: number, token: string): Promise<CooperativaStats> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/stats`,
      fetchConfig(token)
    );
    return handleResponse<CooperativaStats>(response);
  },

  /**
   * Obtener estadísticas para el dashboard de Admin Cooperativa
   */
  getAdminStats: async (cooperativaId: number, token: string): Promise<AdminStats> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/admin-stats`,
      fetchConfig(token)
    );
    return handleResponse<AdminStats>(response);
  },

  /**
   * Obtener estadísticas para el dashboard de Oficinista
   */
  getOficinistaStats: async (cooperativaId: number, token: string): Promise<OficinistaStats> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/oficinista-stats`,
      fetchConfig(token)
    );
    return handleResponse<OficinistaStats>(response);
  },

  /**
   * Obtener estadísticas para el dashboard de Chofer
   */
  getChoferStats: async (choferId: number, token: string): Promise<ChoferStats> => {
    const response = await fetch(
      `${API_URL}/cooperativa/chofer/${choferId}/stats`,
      fetchConfig(token)
    );
    return handleResponse<ChoferStats>(response);
  },

  /**
   * Obtener lista de personal de la cooperativa
   */
  getPersonal: async (cooperativaId: number, token: string): Promise<PersonalListResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/personal`,
      fetchConfig(token)
    );
    return handleResponse<PersonalListResponse>(response);
  },

  // ========== REPORTES ==========
  
  /**
   * Obtener resumen general de la cooperativa
   */
  getResumenReportes: async (
    cooperativaId: number, 
    fechaInicio: string, 
    fechaFin: string, 
    token: string
  ): Promise<ResumenCooperativaResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/reportes/resumen?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      fetchConfig(token)
    );
    return handleResponse<ResumenCooperativaResponse>(response);
  },

  /**
   * Obtener reporte de ventas
   */
  getReporteVentas: async (
    cooperativaId: number, 
    fechaInicio: string, 
    fechaFin: string, 
    token: string
  ): Promise<ReporteVentasResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/reportes/ventas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      fetchConfig(token)
    );
    return handleResponse<ReporteVentasResponse>(response);
  },

  /**
   * Obtener reporte de viajes
   */
  getReporteViajes: async (
    cooperativaId: number, 
    fechaInicio: string, 
    fechaFin: string, 
    token: string
  ): Promise<ReporteViajesResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/reportes/viajes?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      fetchConfig(token)
    );
    return handleResponse<ReporteViajesResponse>(response);
  },

  /**
   * Obtener reporte de ocupación
   */
  getReporteOcupacion: async (
    cooperativaId: number, 
    fechaInicio: string, 
    fechaFin: string, 
    token: string
  ): Promise<ReporteOcupacionResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/reportes/ocupacion?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      fetchConfig(token)
    );
    return handleResponse<ReporteOcupacionResponse>(response);
  },

  /**
   * Obtener reporte de rutas
   */
  getReporteRutas: async (
    cooperativaId: number, 
    fechaInicio: string, 
    fechaFin: string, 
    token: string
  ): Promise<ReporteRutasResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/reportes/rutas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      fetchConfig(token)
    );
    return handleResponse<ReporteRutasResponse>(response);
  },
};

// ==================== SUPER ADMIN ====================

export interface SuperAdminStats {
  totalCooperativas: number;
  cooperativasActivas: number;
  totalBuses: number;
  busesActivos: number;
  totalUsuarios: number;
  usuariosActivos: number;
  ventasTotalesHoy: number;
  viajesHoy: number;
  reservasPendientes: number;
}

export interface CooperativaInfo {
  id: number;
  nombre: string;
  ruc: string;
  logoUrl?: string;
  cantidadBuses: number;
  cantidadPersonal: number;
  activo: boolean;
}

export interface ClienteInfo {
  id: number;
  email: string;
  nombres: string;
  apellidos: string;
  activo: boolean;
  createdAt: string;
}

export const superAdminApi = {
  /**
   * Obtener estadísticas globales del sistema
   */
  getStats: async (token: string): Promise<SuperAdminStats> => {
    const response = await fetch(
      `${API_URL}/admin/stats`,
      fetchConfig(token)
    );
    return handleResponse<SuperAdminStats>(response);
  },

  /**
   * Obtener lista de todas las cooperativas
   */
  getAllCooperativas: async (token: string): Promise<CooperativaInfo[]> => {
    const response = await fetch(
      `${API_URL}/admin/cooperativas`,
      fetchConfig(token)
    );
    return handleResponse<CooperativaInfo[]>(response);
  },

  /**
   * Activar o desactivar una cooperativa
   */
  toggleCooperativaEstado: async (cooperativaId: number, activo: boolean, token: string): Promise<void> => {
    const response = await fetch(
      `${API_URL}/admin/cooperativas/${cooperativaId}/toggle-estado?activo=${activo}`,
      fetchConfig(token, 'PATCH')
    );
    return handleResponse<void>(response);
  },

  /**
   * Obtener lista de todos los clientes
   */
  getAllClientes: async (token: string): Promise<ClienteInfo[]> => {
    const response = await fetch(
      `${API_URL}/admin/clientes`,
      fetchConfig(token)
    );
    return handleResponse<ClienteInfo[]>(response);
  },

  /**
   * Activar o desactivar un cliente
   */
  toggleClienteEstado: async (clienteId: number, activo: boolean, token: string): Promise<void> => {
    const response = await fetch(
      `${API_URL}/admin/clientes/${clienteId}/toggle-estado?activo=${activo}`,
      fetchConfig(token, 'PATCH')
    );
    return handleResponse<void>(response);
  },
};

// ==================== BUS MANAGEMENT ====================

export interface CreateBusRequest {
  numeroInterno?: string;
  placa: string;
  chasisMarca?: string;
  carroceriaMarca?: string;
  fotoUrl?: string;
  capacidadAsientos?: number;
  tieneDosNiveles?: boolean;
  capacidadPiso1?: number;
  capacidadPiso2?: number;
  estado?: string;
}

export interface UpdateBusRequest {
  numeroInterno?: string;
  placa?: string;
  chasisMarca?: string;
  carroceriaMarca?: string;
  fotoUrl?: string;
  capacidadAsientos?: number;
  tieneDosNiveles?: boolean;
  capacidadPiso1?: number;
  capacidadPiso2?: number;
  estado?: string;
  activo?: boolean;
}

export interface BusDetailResponse {
  id: number;
  cooperativaId: number;
  cooperativaNombre: string;
  numeroInterno?: string;
  placa: string;
  chasisMarca?: string;
  carroceriaMarca?: string;
  fotoUrl?: string;
  capacidadAsientos: number;
  tieneDosNiveles?: boolean;
  capacidadPiso1?: number;
  capacidadPiso2?: number;
  estado: string;
  activo: boolean;
}

export const busApi = {
  /**
   * Crear un nuevo bus
   */
  create: async (cooperativaId: number, data: CreateBusRequest, token: string): Promise<BusDetailResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/buses`,
      fetchConfig(token, 'POST', data)
    );
    return handleResponse<BusDetailResponse>(response);
  },

  /**
   * Actualizar un bus existente
   */
  update: async (cooperativaId: number, busId: number, data: UpdateBusRequest, token: string): Promise<BusDetailResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/buses/${busId}`,
      fetchConfig(token, 'PUT', data)
    );
    return handleResponse<BusDetailResponse>(response);
  },

  /**
   * Eliminar (desactivar) un bus
   */
  delete: async (cooperativaId: number, busId: number, token: string): Promise<void> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/buses/${busId}`,
      fetchConfig(token, 'DELETE')
    );
    if (!response.ok) {
      throw new Error('Error al eliminar el bus');
    }
  },

  /**
   * Obtener detalles de un bus
   */
  getById: async (cooperativaId: number, busId: number, token: string): Promise<BusDetailResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/buses/${busId}`,
      fetchConfig(token)
    );
    return handleResponse<BusDetailResponse>(response);
  },

  /**
   * Listar todos los buses de una cooperativa
   */
  list: async (cooperativaId: number, token: string): Promise<BusDetailResponse[]> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/buses`,
      fetchConfig(token)
    );
    return handleResponse<BusDetailResponse[]>(response);
  },

  /**
   * Cambiar estado activo/inactivo de un bus
   */
  toggleActivo: async (cooperativaId: number, busId: number, nuevoEstado: boolean, token: string): Promise<BusDetailResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/buses/${busId}`,
      fetchConfig(token, 'PUT', { activo: nuevoEstado })
    );
    return handleResponse<BusDetailResponse>(response);
  },
};

// ==================== BUS-CHOFER (Asignación de choferes a buses) ====================

export interface BusChoferResponse {
  id: number;
  busId: number;
  busPlaca: string;
  busNumeroInterno?: string;
  choferId: number;
  choferNombre: string;
  choferCedula: string;
  choferTelefono?: string;
  choferFotoUrl?: string;
  tipo: 'PRINCIPAL' | 'ALTERNO';
  orden: number;
  activo: boolean;
  createdAt: string;
}

export interface AsignarChoferRequest {
  choferId: number;
  tipo: 'PRINCIPAL' | 'ALTERNO';
}

export interface ChoferAsignacion {
  choferId: number;
  tipo: 'PRINCIPAL' | 'ALTERNO';
  orden?: number;
}

export interface SincronizarChoferesRequest {
  choferes: ChoferAsignacion[];
}

export interface ChoferDisponible {
  id: number;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  cedula: string;
  telefono?: string;
  email: string;
  fotoUrl?: string;
  numeroLicencia?: string;
  tipoLicencia?: string;
  fechaVencimientoLicencia?: string;
  yaAsignado: boolean;
  busAsignadoPlaca?: string;
}

export const busChoferApi = {
  /**
   * Obtener choferes asignados a un bus
   */
  getChoferes: async (cooperativaId: number, busId: number, token: string): Promise<BusChoferResponse[]> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/buses/${busId}/choferes`,
      fetchConfig(token)
    );
    return handleResponse<BusChoferResponse[]>(response);
  },

  /**
   * Obtener choferes disponibles para asignar
   */
  getChoferesDisponibles: async (cooperativaId: number, busId: number, token: string): Promise<ChoferDisponible[]> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/buses/${busId}/choferes/disponibles`,
      fetchConfig(token)
    );
    return handleResponse<ChoferDisponible[]>(response);
  },

  /**
   * Asignar un chofer a un bus
   */
  asignarChofer: async (cooperativaId: number, busId: number, data: AsignarChoferRequest, token: string): Promise<BusChoferResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/buses/${busId}/choferes`,
      fetchConfig(token, 'POST', data)
    );
    return handleResponse<BusChoferResponse>(response);
  },

  /**
   * Sincronizar todos los choferes de un bus (reemplaza todas las asignaciones)
   */
  sincronizarChoferes: async (cooperativaId: number, busId: number, data: SincronizarChoferesRequest, token: string): Promise<BusChoferResponse[]> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/buses/${busId}/choferes/sincronizar`,
      fetchConfig(token, 'PUT', data)
    );
    return handleResponse<BusChoferResponse[]>(response);
  },

  /**
   * Remover un chofer de un bus
   */
  removerChofer: async (cooperativaId: number, busId: number, choferId: number, token: string): Promise<void> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/buses/${busId}/choferes/${choferId}`,
      fetchConfig(token, 'DELETE')
    );
    if (!response.ok) {
      throw new Error('Error al remover el chofer del bus');
    }
  },
};

// ==================== ASIENTO LAYOUT ====================

export interface AsientoResponse {
  id: number;
  numeroAsiento: number;
  fila: number;
  columna: number;
  tipoAsiento: 'NORMAL' | 'VIP' | 'ACONDICIONADO';
  piso: number; // 1 o 2
  habilitado: boolean;
}

export interface BusLayoutResponse {
  busId: number;
  placa: string;
  capacidadTotal: number;
  capacidadHabilitada: number;
  maxFilas: number;
  maxColumnas: number;
  asientos: AsientoResponse[];
}

export interface GenerateLayoutRequest {
  filas: number;
  columnas: number;
  sobrescribir: boolean;
  incluirFilaTrasera?: boolean;
  piso?: number; // 1 o 2 (opcional, por defecto 1)
}

export interface UpdateAsientoRequest {
  tipoAsiento?: 'NORMAL' | 'VIP' | 'ACONDICIONADO';
  habilitado?: boolean;
}

export interface UpdateAsientoItem {
  id?: number;
  numeroAsiento?: number;
  fila?: number;
  columna?: number;
  tipoAsiento?: 'NORMAL' | 'VIP' | 'ACONDICIONADO';
  habilitado?: boolean;
}

export interface BulkUpdateAsientosRequest {
  asientos: UpdateAsientoItem[];
}

export interface AsientoOperationResponse {
  success: boolean;
  message: string;
  asientosCreados: number;
  asientosActualizados: number;
  asientosHabilitados?: number;
  asientosDeshabilitados?: number;
}

export const asientoLayoutApi = {
  /**
   * Obtener el layout de asientos de un bus
   */
  getLayout: async (busId: number, token: string): Promise<BusLayoutResponse> => {
    const response = await fetch(
      `${API_URL}/buses/${busId}/asientos`,
      fetchConfig(token)
    );
    return handleResponse<BusLayoutResponse>(response);
  },

  /**
   * Generar layout automático en grid
   */
  generateLayout: async (busId: number, data: GenerateLayoutRequest, token: string): Promise<AsientoOperationResponse> => {
    const response = await fetch(
      `${API_URL}/buses/${busId}/asientos/generate`,
      fetchConfig(token, 'POST', data)
    );
    return handleResponse<AsientoOperationResponse>(response);
  },

  /**
   * Actualizar un asiento individual
   */
  updateAsiento: async (busId: number, asientoId: number, data: UpdateAsientoRequest, token: string): Promise<AsientoResponse> => {
    const response = await fetch(
      `${API_URL}/buses/${busId}/asientos/${asientoId}`,
      fetchConfig(token, 'PUT', data)
    );
    return handleResponse<AsientoResponse>(response);
  },

  /**
   * Actualizar múltiples asientos
   */
  bulkUpdate: async (busId: number, data: BulkUpdateAsientosRequest, token: string): Promise<AsientoOperationResponse> => {
    const response = await fetch(
      `${API_URL}/buses/${busId}/asientos/bulk`,
      fetchConfig(token, 'PUT', data)
    );
    return handleResponse<AsientoOperationResponse>(response);
  },

  /**
   * Eliminar layout completo
   */
  deleteLayout: async (busId: number, token: string): Promise<AsientoOperationResponse> => {
    const response = await fetch(
      `${API_URL}/buses/${busId}/asientos`,
      fetchConfig(token, 'DELETE')
    );
    return handleResponse<AsientoOperationResponse>(response);
  },
};

// ==================== PERSONAL MANAGEMENT ====================

export interface CreatePersonalRequest {
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  cedula: string;
  telefono?: string;
  rolCooperativa: string; // ADMIN | OFICINISTA | CHOFER
  // Campos adicionales para CHOFER
  numeroLicencia?: string;
  tipoLicencia?: string;
  fechaVencimientoLicencia?: string;
}

export interface UpdatePersonalRequest {
  nombres?: string;
  apellidos?: string;
  email?: string;
  cedula?: string;
  telefono?: string;
  rolCooperativa?: string;
  activo?: boolean;
  // Campos adicionales para CHOFER
  numeroLicencia?: string;
  tipoLicencia?: string;
  fechaVencimientoLicencia?: string;
}

export interface PersonalDetailResponse {
  id: number;
  cooperativaId: number;
  cooperativaNombre: string;
  nombres: string;
  apellidos: string;
  email: string;
  cedula: string;
  telefono?: string;
  rolCooperativa: string;
  activo: boolean;
  fotoUrl?: string;
  // Campos adicionales para CHOFER
  numeroLicencia?: string;
  tipoLicencia?: string;
  fechaVencimientoLicencia?: string;
  // Bus asignado (solo para CHOFER)
  busAsignadoId?: number;
  busAsignadoPlaca?: string;
  busAsignadoNumeroInterno?: string;
}

export const personalApi = {
  /**
   * Crear un nuevo usuario de personal
   */
  create: async (cooperativaId: number, data: CreatePersonalRequest, token: string): Promise<PersonalDetailResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/personal`,
      fetchConfig(token, 'POST', data)
    );
    return handleResponse<PersonalDetailResponse>(response);
  },

  /**
   * Actualizar un usuario existente
   */
  update: async (cooperativaId: number, personalId: number, data: UpdatePersonalRequest, token: string): Promise<PersonalDetailResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/personal/${personalId}`,
      fetchConfig(token, 'PUT', data)
    );
    return handleResponse<PersonalDetailResponse>(response);
  },

  /**
   * Eliminar (desactivar) un usuario
   */
  delete: async (cooperativaId: number, personalId: number, token: string): Promise<void> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/personal/${personalId}`,
      fetchConfig(token, 'DELETE')
    );
    if (!response.ok) {
      throw new Error('Error al eliminar el usuario');
    }
  },

  /**
   * Obtener detalles de un usuario
   */
  getById: async (cooperativaId: number, personalId: number, token: string): Promise<PersonalDetailResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/personal/${personalId}`,
      fetchConfig(token)
    );
    return handleResponse<PersonalDetailResponse>(response);
  },

  /**
   * Listar todo el personal de una cooperativa
   */
  list: async (cooperativaId: number, token: string): Promise<PersonalDetailResponse[]> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/personal`,
      fetchConfig(token)
    );
    return handleResponse<PersonalDetailResponse[]>(response);
  },
};

// ==================== VIAJES ====================

export interface ViajeDisponible {
  id: number;
  origen: string;
  destino: string;
  fecha: string;
  horaSalida: string;
  busPlaca: string;
  capacidadTotal: number;
  asientosDisponibles: number;
  precioBase: number;
  estado: string;
}

export interface ViajeDetalle {
  id: number;
  origen: string;
  destino: string;
  fecha: string;
  horaSalida: string;
  horaLlegadaEstimada?: string;
  busPlaca: string;
  busMarca: string;
  capacidadTotal: number;
  asientosDisponibles: number;
  precioBase: number;
  estado: string;
  asientos: AsientoInfo[];
}

export interface AsientoInfo {
  id: number;
  numeroAsiento: string;
  tipoAsiento: string;
  estado: string;
  reservaId?: number;
}

export const viajesApi = {
  /**
   * Listar viajes disponibles por cooperativa y fecha
   */
  getByCooperativaAndFecha: async (cooperativaId: number, fecha: string, token: string): Promise<ViajeDisponible[]> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/viajes?fecha=${fecha}`,
      fetchConfig(token)
    );
    return handleResponse<ViajeDisponible[]>(response);
  },

  /**
   * Obtener detalle de un viaje con sus asientos
   */
  getById: async (cooperativaId: number, viajeId: number, token: string): Promise<ViajeDetalle> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/viajes/${viajeId}`,
      fetchConfig(token)
    );
    return handleResponse<ViajeDetalle>(response);
  },
};

// ==================== VENTA PRESENCIAL ====================

export interface CreateVentaPresencialRequest {
  // Opción 1: viajeId directo
  viajeId?: number;
  // Opción 2: frecuencia + fecha (se resuelve en backend)
  cooperativaId?: number;
  frecuenciaId?: number;
  fecha?: string;
  
  // Asientos - se puede usar cualquiera
  asientoIds?: number[];
  asientos?: string[];
  
  // Datos del cliente
  clienteNombres: string;
  clienteApellidos: string;
  clienteCedula: string;
  clienteTelefono?: string;
  clienteEmail?: string;
  telefono?: string;
  email?: string;
  
  // Pago
  metodoPago: 'EFECTIVO' | 'TARJETA';
  totalPagado?: number;
  precioTotal?: number;
}

export interface VentaPresencialResponse {
  reservaId: number;
  viajeId: number;
  asientos: string[];
  clienteNombres: string;
  clienteApellidos: string;
  clienteCedula: string;
  totalPagado: number;
  metodoPago: string;
  estado: string;
  mensaje: string;
}

export const ventasPresencialesApi = {
  /**
   * Crear una venta presencial (pago inmediato desde oficinista)
   */
  create: async (data: CreateVentaPresencialRequest, token: string): Promise<VentaPresencialResponse> => {
    const response = await fetch(
      `${API_URL}/ventas-presenciales`,
      fetchConfig(token, 'POST', data)
    );
    return handleResponse<VentaPresencialResponse>(response);
  },
};

// ==================== VIAJE CHOFER ====================

export interface PasajeroViaje {
  reservaId: number;
  clienteEmail: string;
  asientos: string[];
  estado: string;
  verificado: boolean;
}

export interface CoordenadaDTO {
  latitud?: number;
  longitud?: number;
  nombreTerminal?: string;
  canton?: string;
  provincia?: string;
}

export interface ViajeChofer {
  id: number | null;
  frecuenciaId?: number; // ID de la frecuencia (cuando no hay viaje creado aún)
  origen: string;
  destino: string;
  fecha: string;
  horaSalidaProgramada: string;
  horaSalidaReal?: string;
  horaLlegadaEstimada?: string;
  horaLlegadaReal?: string;
  busPlaca: string;
  busMarca?: string;
  capacidadTotal?: number;
  capacidadPiso1?: number; // Capacidad del primer piso
  capacidadPiso2?: number; // Capacidad del segundo piso (0 si es bus de un piso)
  estado: string;
  pasajeros: PasajeroViaje[];
  totalPasajeros?: number;
  pasajerosVerificados?: number;
  // Información de coordenadas para el mapa
  coordenadaOrigen?: CoordenadaDTO;
  coordenadaDestino?: CoordenadaDTO;
  // Información de la cooperativa
  cooperativaId?: number;
  cooperativaNombre?: string;
}

export interface ViajeOperacionResponse {
  viajeId: number;
  estado: string;
  mensaje: string;
}

export interface ViajeHistorial {
  id: number;
  origen: string;
  destino: string;
  fecha: string;
  horaSalidaProgramada: string;
  horaSalidaReal?: string;
  horaLlegadaEstimada?: string;
  horaLlegadaReal?: string;
  busPlaca: string;
  totalPasajeros: number;
  promedioCalificacion?: number;
  totalCalificaciones: number;
  observaciones?: string;
}

export interface CalificacionResponse {
  id: number;
  viajeId: number;
  clienteEmail: string;
  puntuacion: number;
  comentario?: string;
  fechaCalificacion: string;
  origen?: string;
  destino?: string;
  fechaViaje?: string;
}

export interface CalificacionesChoferResponse {
  calificaciones: CalificacionResponse[];
  promedioCalificacion: number;
  totalCalificaciones: number;
}

export interface RutaChofer {
  id: number;
  origen: string; // Cantón de origen
  destino: string; // Cantón de destino
  terminalOrigenNombre?: string; // Nombre de la terminal de origen
  terminalDestinoNombre?: string; // Nombre de la terminal de destino
  horaSalida: string;
  duracionEstimadaMin?: number;
  diasOperacion?: string;
  activa: boolean;
  totalViajesRealizados: number;
  busPlaca?: string; // Placa del bus asignado
}

export const viajeChoferApi = {
  /**
   * Obtener el viaje del día del chofer
   */
  getViajeDelDia: async (choferId: number, fecha: string, token: string): Promise<ViajeChofer | null> => {
    const response = await fetch(
      `${API_URL}/chofer/${choferId}/viaje?fecha=${fecha}`,
      fetchConfig(token)
    );
    
    if (response.status === 204) {
      return null; // No hay viaje
    }
    
    return handleResponse<ViajeChofer>(response);
  },

  /**
   * Iniciar un viaje
   */
  iniciar: async (viajeId: number, token: string): Promise<ViajeOperacionResponse> => {
    const response = await fetch(
      `${API_URL}/chofer/viaje/${viajeId}/iniciar`,
      fetchConfig(token, 'POST', {})
    );
    return handleResponse<ViajeOperacionResponse>(response);
  },

  /**
   * Finalizar un viaje
   */
  finalizar: async (viajeId: number, observaciones: string, token: string): Promise<ViajeOperacionResponse> => {
    const response = await fetch(
      `${API_URL}/chofer/viaje/${viajeId}/finalizar`,
      fetchConfig(token, 'POST', { observaciones })
    );
    return handleResponse<ViajeOperacionResponse>(response);
  },

  /**
   * Obtener historial de viajes completados
   */
  getHistorial: async (choferId: number, token: string, fechaInicio?: string, fechaFin?: string): Promise<ViajeHistorial[]> => {
    let url = `${API_URL}/chofer/${choferId}/historial`;
    if (fechaInicio && fechaFin) {
      url += `?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
    }
    const response = await fetch(url, fetchConfig(token));
    return handleResponse<ViajeHistorial[]>(response);
  },

  /**
   * Obtener calificaciones de un viaje específico
   */
  getCalificacionesViaje: async (viajeId: number, token: string): Promise<CalificacionResponse[]> => {
    const response = await fetch(
      `${API_URL}/chofer/viaje/${viajeId}/calificaciones`,
      fetchConfig(token)
    );
    return handleResponse<CalificacionResponse[]>(response);
  },

  /**
   * Obtener todas las calificaciones del chofer
   */
  getCalificacionesChofer: async (choferId: number, token: string): Promise<CalificacionesChoferResponse> => {
    const response = await fetch(
      `${API_URL}/chofer/${choferId}/calificaciones`,
      fetchConfig(token)
    );
    return handleResponse<CalificacionesChoferResponse>(response);
  },

  /**
   * Obtener las rutas asignadas a la cooperativa del chofer
   */
  getMisRutas: async (choferId: number, token: string): Promise<RutaChofer[]> => {
    const response = await fetch(
      `${API_URL}/chofer/${choferId}/mis-rutas`,
      fetchConfig(token)
    );
    return handleResponse<RutaChofer[]>(response);
  },
};

// ==================== HELPER FUNCTIONS ====================

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
};

export const removeToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// ==================== RUTAS (SuperAdmin) ====================

export interface RutaResponse {
  id: number;
  nombre: string;
  origen: string;
  destino: string;
  distanciaKm?: number;
  duracionEstimadaMinutos?: number;
  descripcion?: string;
  aprobadaAnt: boolean;
  numeroResolucionAnt?: string;
  fechaAprobacionAnt?: string;
  vigenciaHasta?: string;
  observacionesAnt?: string;
  activo: boolean;
  tipoRuta?: 'INTERPROVINCIAL' | 'INTRAPROVINCIAL';
  terminalOrigenId?: number;
  terminalDestinoId?: number;
  terminalOrigenNombre?: string;
  terminalDestinoNombre?: string;
  cantidadCaminos?: number;
}

export interface CreateRutaRequest {
  nombre: string;
  origen: string;
  destino: string;
  distanciaKm?: number;
  duracionEstimadaMinutos?: number;
  descripcion?: string;
  aprobadaAnt?: boolean;
  numeroResolucionAnt?: string;
  fechaAprobacionAnt?: string;
  vigenciaHasta?: string;
  observacionesAnt?: string;
}

export interface UpdateRutaRequest {
  nombre?: string;
  origen?: string;
  destino?: string;
  distanciaKm?: number;
  duracionEstimadaMinutos?: number;
  descripcion?: string;
  aprobadaAnt?: boolean;
  numeroResolucionAnt?: string;
  fechaAprobacionAnt?: string;
  vigenciaHasta?: string;
  observacionesAnt?: string;
  activo?: boolean;
}

export const rutasAdminApi = {
  getAll: async (filter?: 'activas' | 'aprobadas', tipoRuta?: 'INTERPROVINCIAL' | 'INTRAPROVINCIAL', token?: string): Promise<RutaResponse[]> => {
    const params = new URLSearchParams();
    if (filter) params.append('filter', filter);
    if (tipoRuta) params.append('tipoRuta', tipoRuta);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_URL}/admin/rutas${queryString}`, fetchConfig(token));
    return handleResponse<RutaResponse[]>(response);
  },

  getById: async (id: number, token: string): Promise<RutaResponse> => {
    const response = await fetch(`${API_URL}/admin/rutas/${id}`, fetchConfig(token));
    return handleResponse<RutaResponse>(response);
  },

  create: async (data: CreateRutaRequest, token: string): Promise<RutaResponse> => {
    const response = await fetch(`${API_URL}/admin/rutas`, fetchConfig(token, 'POST', data));
    return handleResponse<RutaResponse>(response);
  },

  update: async (id: number, data: UpdateRutaRequest, token: string): Promise<RutaResponse> => {
    const response = await fetch(`${API_URL}/admin/rutas/${id}`, fetchConfig(token, 'PUT', data));
    return handleResponse<RutaResponse>(response);
  },

  delete: async (id: number, token: string): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/rutas/${id}`, fetchConfig(token, 'DELETE'));
    if (!response.ok) {
      throw new Error('Error al eliminar la ruta');
    }
  },
};

// ==================== CONFIGURACIÓN GLOBAL (SuperAdmin) ====================

export interface ConfiguracionGlobal {
  id: number;
  nombreAplicacion?: string;
  logoUrl?: string;
  logoSmallUrl?: string;
  faviconUrl?: string;
  colorPrimario?: string;
  colorSecundario?: string;
  colorAcento?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
  emailSoporte?: string;
  telefonoSoporte?: string;
  whatsappSoporte?: string;
  direccionFisica?: string;
  horarioAtencion?: string;
  sitioWeb?: string;
  terminosCondicionesUrl?: string;
  politicaPrivacidadUrl?: string;
  descripcion?: string;
}

export interface UpdateConfiguracionRequest {
  nombreAplicacion?: string;
  logoUrl?: string;
  logoSmallUrl?: string;
  faviconUrl?: string;
  colorPrimario?: string;
  colorSecundario?: string;
  colorAcento?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
  emailSoporte?: string;
  telefonoSoporte?: string;
  whatsappSoporte?: string;
  direccionFisica?: string;
  horarioAtencion?: string;
  sitioWeb?: string;
  terminosCondicionesUrl?: string;
  politicaPrivacidadUrl?: string;
  descripcion?: string;
}

export const configuracionApi = {
  get: async (token?: string): Promise<ConfiguracionGlobal> => {
    const response = await fetch(`${API_URL}/admin/configuracion`, fetchConfig(token));
    return handleResponse<ConfiguracionGlobal>(response);
  },

  update: async (data: UpdateConfiguracionRequest, token: string): Promise<ConfiguracionGlobal> => {
    const response = await fetch(
      `${API_URL}/admin/configuracion`,
      fetchConfig(token, 'PUT', data)
    );
    return handleResponse<ConfiguracionGlobal>(response);
  },
};

// ==================== COOPERATIVAS DETALLE (SuperAdmin) ====================

export interface CooperativaDetalle {
  id: number;
  nombre: string;
  ruc: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  estadisticas: {
    totalBuses: number;
    busesActivos: number;
    totalUsuarios: number;
    usuariosActivos: number;
    viajesHoy: number;
    ventasHoy: number;
    reservasPendientes: number;
  };
  buses: Array<{
    id: number;
    placa: string;
    modelo: string;
    capacidad: number;
    activo: boolean;
  }>;
  usuarios: Array<{
    id: number;
    nombres: string;
    apellidos: string;
    email: string;
    rol: string;
    activo: boolean;
    cedula?: string;
    telefono?: string;
  }>;
}

export const cooperativaDetalleApi = {
  get: async (id: number, token: string): Promise<CooperativaDetalle> => {
    const response = await fetch(`${API_URL}/admin/cooperativas/${id}`, fetchConfig(token));
    return handleResponse<CooperativaDetalle>(response);
  },
};

// ==================== FRECUENCIAS DE VIAJE (SuperAdmin) ====================

export interface ParadaFrecuencia {
  id?: number;
  orden: number;
  nombreParada: string;
  direccion?: string;
  tiempoLlegada?: string; // "HH:mm"
  tiempoEsperaMinutos?: number;
  precioDesdeOrigen?: number;
  observaciones?: string;
  permiteAbordaje?: boolean;
  permiteDescenso?: boolean;
}

export interface FrecuenciaViaje {
  id: number;
  busId: number;
  busPlaca: string;
  rutaId: number;
  rutaNombre: string;
  rutaOrigen: string;
  rutaDestino: string;
  horaSalida: string; // "HH:mm"
  horaLlegadaEstimada?: string; // "HH:mm"
  diasOperacion: string; // CSV: "LUNES,MARTES,MIERCOLES..."
  precioBase?: number;
  asientosDisponibles?: number;
  observaciones?: string;
  activo: boolean;
  paradas: ParadaFrecuencia[];
  // Nuevos campos de tipo y rotación
  tipoFrecuencia?: 'INTERPROVINCIAL' | 'INTRAPROVINCIAL';
  tiempoMinimoEsperaMinutos?: number;
  requiereBusEnTerminal?: boolean;
  terminalOrigenId?: number;
  terminalOrigenNombre?: string;
  terminalOrigenCanton?: string;
  terminalDestinoId?: number;
  terminalDestinoNombre?: string;
  terminalDestinoCanton?: string;
  estado?: string;
}

export interface CreateFrecuenciaRequest {
  busId: number;
  rutaId: number;
  horaSalida: string; // "HH:mm"
  horaLlegadaEstimada?: string; // "HH:mm"
  diasOperacion: string;
  precioBase?: number;
  asientosDisponibles?: number;
  observaciones?: string;
  paradas?: ParadaFrecuencia[];
}

export interface UpdateFrecuenciaRequest {
  horaSalida?: string;
  horaLlegadaEstimada?: string;
  diasOperacion?: string;
  precioBase?: number;
  asientosDisponibles?: number;
  observaciones?: string;
  paradas?: ParadaFrecuencia[];
}

export const frecuenciasAdminApi = {
  getByBus: async (busId: number, token: string): Promise<FrecuenciaViaje[]> => {
    const response = await fetch(`${API_URL}/admin/frecuencias/bus/${busId}`, fetchConfig(token));
    return handleResponse<FrecuenciaViaje[]>(response);
  },

  getByCooperativa: async (cooperativaId: number, token: string): Promise<FrecuenciaViaje[]> => {
    const response = await fetch(`${API_URL}/admin/frecuencias/cooperativa/${cooperativaId}`, fetchConfig(token));
    return handleResponse<FrecuenciaViaje[]>(response);
  },

  getById: async (id: number, token: string): Promise<FrecuenciaViaje> => {
    const response = await fetch(`${API_URL}/admin/frecuencias/${id}`, fetchConfig(token));
    return handleResponse<FrecuenciaViaje>(response);
  },

  create: async (data: CreateFrecuenciaRequest, token: string): Promise<FrecuenciaViaje> => {
    const response = await fetch(`${API_URL}/admin/frecuencias`, fetchConfig(token, 'POST', data));
    return handleResponse<FrecuenciaViaje>(response);
  },

  update: async (id: number, data: UpdateFrecuenciaRequest, token: string): Promise<FrecuenciaViaje> => {
    const response = await fetch(`${API_URL}/admin/frecuencias/${id}`, fetchConfig(token, 'PUT', data));
    return handleResponse<FrecuenciaViaje>(response);
  },

  delete: async (id: number, token: string): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/frecuencias/${id}`, fetchConfig(token, 'DELETE'));
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al eliminar frecuencia' }));
      throw new Error(error.message);
    }
  },

  /**
   * Elimina TODAS las frecuencias de una cooperativa
   */
  deleteAllByCooperativa: async (cooperativaId: number, token: string): Promise<{ message: string; count: number }> => {
    const response = await fetch(
      `${API_URL}/admin/frecuencias/cooperativa/${cooperativaId}/all`, 
      fetchConfig(token, 'DELETE')
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al eliminar frecuencias' }));
      throw new Error(error.message);
    }
    return handleResponse<{ message: string; count: number }>(response);
  },
};

// ==================== UBICACIÓN (Provincias y Cantones) ====================
// Consumiendo API Externa Pública

export interface Canton {
  nombre: string;
  latitud: number;
  longitud: number;
  esCapital: boolean;
}

export interface Provincia {
  nombre: string;
  capital: string;
  latitud: number;
  longitud: number;
  cantones: Canton[];
}

// API Pública de Ecuador - Usando JSON estático desde GitHub
// Fuente: https://github.com/abucraft/ecuador-api (Datos oficiales INEC)
// Alternativa confiable con datos completos de provincias y cantones

const ECUADOR_DATA_URL = 'https://raw.githubusercontent.com/abucraft/ecuador-api/main/provincias.json';

export const ubicacionApi = {
  // Opción 1: GitHub Raw JSON (Recomendada - siempre disponible)
  getProvincias: async (): Promise<Provincia[]> => {
    try {
      console.log('🌐 Cargando provincias desde API externa...');
      
      // Intentar cargar desde GitHub
      const response = await fetch(ECUADOR_DATA_URL, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API respondió con status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log(`✅ ${data.length || 0} provincias cargadas desde API externa`);
      
      // Transformar al formato esperado
      const provincias = Array.isArray(data) ? data.map((prov: any) => ({
        nombre: prov.nombre || prov.name || '',
        capital: prov.capital || '',
        latitud: parseFloat(prov.lat || prov.latitude || 0),
        longitud: parseFloat(prov.lng || prov.longitude || prov.lon || 0),
        cantones: Array.isArray(prov.cantones || prov.cantons) 
          ? (prov.cantones || prov.cantons).map((canton: any) => ({
              nombre: canton.nombre || canton.name || '',
              latitud: parseFloat(canton.lat || canton.latitude || 0),
              longitud: parseFloat(canton.lng || canton.longitude || canton.lon || 0),
              esCapital: (canton.nombre || canton.name) === (prov.capital || ''),
            }))
          : [],
      })) : [];
      
      return provincias.length > 0 ? provincias : getFallbackProvincias();
      
    } catch (error) {
      console.error('❌ Error cargando provincias desde API externa:', error);
      console.log('📦 Usando datos locales de respaldo...');
      // Fallback a datos locales si la API externa falla
      return getFallbackProvincias();
    }
  },

  // Opción 2: GeoNames API (alternativa con datos globales)
  getProvinciasGeoNames: async (): Promise<Provincia[]> => {
    const GEONAMES_USER = 'demo'; // Usuario de prueba de GeoNames
    try {
      // Obtener provincias de Ecuador usando GeoNames
      const response = await fetch(
        `http://api.geonames.org/childrenJSON?geonameId=3658394&username=${GEONAMES_USER}`
      );
      
      if (!response.ok) throw new Error('GeoNames API error');
      
      const data = await response.json();
      
      // Transformar datos de GeoNames
      const provincias: Provincia[] = [];
      
      for (const geoname of data.geonames || []) {
        // Obtener cantones de cada provincia
        const cantonesResponse = await fetch(
          `http://api.geonames.org/childrenJSON?geonameId=${geoname.geonameId}&username=${GEONAMES_USER}`
        );
        const cantonesData = await cantonesResponse.json();
        
        provincias.push({
          nombre: geoname.name,
          capital: geoname.adminName1 || geoname.name,
          latitud: geoname.lat,
          longitud: geoname.lng,
          cantones: (cantonesData.geonames || []).map((canton: any) => ({
            nombre: canton.name,
            latitud: canton.lat,
            longitud: canton.lng,
            esCapital: canton.name === geoname.adminName1,
          })),
        });
      }
      
      return provincias;
    } catch (error) {
      console.error('Error con GeoNames API:', error);
      return getFallbackProvincias();
    }
  },

  getProvinciaPorNombre: async (nombre: string): Promise<Provincia | null> => {
    try {
      const response = await fetch(`${API_URL}/ubicaciones/provincias/${encodeURIComponent(nombre)}`);
      if (!response.ok) throw new Error('Provincia no encontrada');
      
      const prov = await response.json();
      
      return {
        nombre: prov.nombre,
        capital: prov.capital,
        latitud: prov.lat || 0,
        longitud: prov.lng || 0,
        cantones: (prov.cantones || []).map((canton: any) => ({
          nombre: canton.nombre,
          latitud: canton.lat || 0,
          longitud: canton.lng || 0,
          esCapital: canton.nombre === prov.capital,
        })),
      };
    } catch (error) {
      console.error('Error obteniendo provincia:', error);
      return null;
    }
  },
};

// Fallback con datos locales completos en caso de que la API externa falle
// Datos oficiales del INEC - 24 provincias del Ecuador con cantones principales
function getFallbackProvincias(): Provincia[] {
  console.log('📦 Cargando datos locales de respaldo (24 provincias completas)');
  
  return [
    {
      nombre: 'Azuay',
      capital: 'Cuenca',
      latitud: -2.9001,
      longitud: -79.0059,
      cantones: [
        { nombre: 'Cuenca', latitud: -2.9001, longitud: -79.0059, esCapital: true },
        { nombre: 'Girón', latitud: -3.1647, longitud: -79.1494, esCapital: false },
        { nombre: 'Gualaceo', latitud: -2.8925, longitud: -78.7794, esCapital: false },
        { nombre: 'Paute', latitud: -2.7769, longitud: -78.7572, esCapital: false },
        { nombre: 'Santa Isabel', latitud: -3.2667, longitud: -79.3167, esCapital: false },
      ],
    },
    {
      nombre: 'Bolívar',
      capital: 'Guaranda',
      latitud: -1.5897,
      longitud: -79.0059,
      cantones: [
        { nombre: 'Guaranda', latitud: -1.5897, longitud: -79.0059, esCapital: true },
        { nombre: 'Caluma', latitud: -1.6167, longitud: -79.2833, esCapital: false },
        { nombre: 'Chimbo', latitud: -1.6333, longitud: -79.0333, esCapital: false },
        { nombre: 'San Miguel', latitud: -1.7167, longitud: -79.0500, esCapital: false },
      ],
    },
    {
      nombre: 'Cañar',
      capital: 'Azogues',
      latitud: -2.7394,
      longitud: -78.8476,
      cantones: [
        { nombre: 'Azogues', latitud: -2.7394, longitud: -78.8476, esCapital: true },
        { nombre: 'Cañar', latitud: -2.5589, longitud: -78.9394, esCapital: false },
        { nombre: 'La Troncal', latitud: -2.4231, longitud: -79.3394, esCapital: false },
      ],
    },
    {
      nombre: 'Carchi',
      capital: 'Tulcán',
      latitud: 0.8110,
      longitud: -77.7178,
      cantones: [
        { nombre: 'Tulcán', latitud: 0.8110, longitud: -77.7178, esCapital: true },
        { nombre: 'Bolívar', latitud: 0.4833, longitud: -77.8667, esCapital: false },
        { nombre: 'Espejo', latitud: 0.6167, longitud: -77.8667, esCapital: false },
        { nombre: 'Mira', latitud: 0.5667, longitud: -77.7167, esCapital: false },
      ],
    },
    {
      nombre: 'Chimborazo',
      capital: 'Riobamba',
      latitud: -1.6635,
      longitud: -78.6547,
      cantones: [
        { nombre: 'Riobamba', latitud: -1.6635, longitud: -78.6547, esCapital: true },
        { nombre: 'Alausí', latitud: -2.2000, longitud: -78.8500, esCapital: false },
        { nombre: 'Guano', latitud: -1.6000, longitud: -78.6333, esCapital: false },
        { nombre: 'Pallatanga', latitud: -2.0000, longitud: -78.9667, esCapital: false },
      ],
    },
    {
      nombre: 'Cotopaxi',
      capital: 'Latacunga',
      latitud: -0.9346,
      longitud: -78.6156,
      cantones: [
        { nombre: 'Latacunga', latitud: -0.9346, longitud: -78.6156, esCapital: true },
        { nombre: 'La Maná', latitud: -0.9400, longitud: -79.2267, esCapital: false },
        { nombre: 'Pujilí', latitud: -0.9500, longitud: -78.7000, esCapital: false },
        { nombre: 'Salcedo', latitud: -1.0333, longitud: -78.5833, esCapital: false },
        { nombre: 'Saquisilí', latitud: -0.8333, longitud: -78.6667, esCapital: false },
      ],
    },
    {
      nombre: 'El Oro',
      capital: 'Machala',
      latitud: -3.2581,
      longitud: -79.9553,
      cantones: [
        { nombre: 'Machala', latitud: -3.2581, longitud: -79.9553, esCapital: true },
        { nombre: 'Arenillas', latitud: -3.5500, longitud: -80.0667, esCapital: false },
        { nombre: 'El Guabo', latitud: -3.2333, longitud: -79.8333, esCapital: false },
        { nombre: 'Huaquillas', latitud: -3.4764, longitud: -80.2308, esCapital: false },
        { nombre: 'Pasaje', latitud: -3.3263, longitud: -79.8070, esCapital: false },
        { nombre: 'Santa Rosa', latitud: -3.4489, longitud: -79.9597, esCapital: false },
      ],
    },
    {
      nombre: 'Esmeraldas',
      capital: 'Esmeraldas',
      latitud: 0.9682,
      longitud: -79.6519,
      cantones: [
        { nombre: 'Esmeraldas', latitud: 0.9682, longitud: -79.6519, esCapital: true },
        { nombre: 'Atacames', latitud: 0.8667, longitud: -79.8500, esCapital: false },
        { nombre: 'Muisne', latitud: 0.6000, longitud: -80.0167, esCapital: false },
        { nombre: 'Quinindé', latitud: 0.3167, longitud: -79.4667, esCapital: false },
        { nombre: 'San Lorenzo', latitud: 1.2833, longitud: -78.8333, esCapital: false },
      ],
    },
    {
      nombre: 'Galápagos',
      capital: 'Puerto Baquerizo Moreno',
      latitud: -0.7436,
      longitud: -90.3054,
      cantones: [
        { nombre: 'Puerto Baquerizo Moreno', latitud: -0.7436, longitud: -90.3054, esCapital: true },
        { nombre: 'Puerto Ayora', latitud: -0.7397, longitud: -90.3147, esCapital: false },
        { nombre: 'Puerto Villamil', latitud: -0.9500, longitud: -90.9667, esCapital: false },
      ],
    },
    {
      nombre: 'Guayas',
      capital: 'Guayaquil',
      latitud: -2.1709,
      longitud: -79.9224,
      cantones: [
        { nombre: 'Guayaquil', latitud: -2.1709, longitud: -79.9224, esCapital: true },
        { nombre: 'Daule', latitud: -1.8667, longitud: -79.9833, esCapital: false },
        { nombre: 'Durán', latitud: -2.1717, longitud: -79.8392, esCapital: false },
        { nombre: 'Milagro', latitud: -2.1344, longitud: -79.5944, esCapital: false },
        { nombre: 'Playas', latitud: -2.6333, longitud: -80.3833, esCapital: false },
        { nombre: 'Salinas', latitud: -2.2145, longitud: -80.9558, esCapital: false },
        { nombre: 'Samborondón', latitud: -1.9667, longitud: -79.7333, esCapital: false },
      ],
    },
    {
      nombre: 'Imbabura',
      capital: 'Ibarra',
      latitud: 0.3499,
      longitud: -78.1263,
      cantones: [
        { nombre: 'Ibarra', latitud: 0.3499, longitud: -78.1263, esCapital: true },
        { nombre: 'Antonio Ante', latitud: 0.3333, longitud: -78.1500, esCapital: false },
        { nombre: 'Cotacachi', latitud: 0.3000, longitud: -78.2667, esCapital: false },
        { nombre: 'Otavalo', latitud: 0.2333, longitud: -78.2667, esCapital: false },
        { nombre: 'Pimampiro', latitud: 0.3833, longitud: -77.9500, esCapital: false },
      ],
    },
    {
      nombre: 'Loja',
      capital: 'Loja',
      latitud: -3.9930,
      longitud: -79.2040,
      cantones: [
        { nombre: 'Loja', latitud: -3.9930, longitud: -79.2040, esCapital: true },
        { nombre: 'Catamayo', latitud: -3.9833, longitud: -79.3500, esCapital: false },
        { nombre: 'Cariamanga', latitud: -4.3333, longitud: -79.5500, esCapital: false },
        { nombre: 'Macará', latitud: -4.3833, longitud: -79.9500, esCapital: false },
        { nombre: 'Pindal', latitud: -3.8667, longitud: -79.9167, esCapital: false },
      ],
    },
    {
      nombre: 'Los Ríos',
      capital: 'Babahoyo',
      latitud: -1.8015,
      longitud: -79.5345,
      cantones: [
        { nombre: 'Babahoyo', latitud: -1.8015, longitud: -79.5345, esCapital: true },
        { nombre: 'Baba', latitud: -1.7167, longitud: -79.5333, esCapital: false },
        { nombre: 'Montalvo', latitud: -1.7833, longitud: -79.2833, esCapital: false },
        { nombre: 'Quevedo', latitud: -1.0275, longitud: -79.4631, esCapital: false },
        { nombre: 'Ventanas', latitud: -1.4500, longitud: -79.4667, esCapital: false },
        { nombre: 'Vinces', latitud: -1.5500, longitud: -79.7500, esCapital: false },
      ],
    },
    {
      nombre: 'Manabí',
      capital: 'Portoviejo',
      latitud: -1.0546,
      longitud: -80.4549,
      cantones: [
        { nombre: 'Portoviejo', latitud: -1.0546, longitud: -80.4549, esCapital: true },
        { nombre: 'Bahía de Caráquez', latitud: -0.5983, longitud: -80.4244, esCapital: false },
        { nombre: 'Chone', latitud: -0.6833, longitud: -80.1000, esCapital: false },
        { nombre: 'El Carmen', latitud: -0.2667, longitud: -79.4500, esCapital: false },
        { nombre: 'Jipijapa', latitud: -1.3483, longitud: -80.5789, esCapital: false },
        { nombre: 'Manta', latitud: -0.9500, longitud: -80.7333, esCapital: false },
        { nombre: 'Montecristi', latitud: -1.0500, longitud: -80.6667, esCapital: false },
      ],
    },
    {
      nombre: 'Morona Santiago',
      capital: 'Macas',
      latitud: -2.3088,
      longitud: -78.1157,
      cantones: [
        { nombre: 'Macas', latitud: -2.3088, longitud: -78.1157, esCapital: true },
        { nombre: 'Gualaquiza', latitud: -3.4000, longitud: -78.5667, esCapital: false },
        { nombre: 'Limón Indanza', latitud: -2.9667, longitud: -78.4167, esCapital: false },
        { nombre: 'Sucúa', latitud: -2.4500, longitud: -78.1667, esCapital: false },
      ],
    },
    {
      nombre: 'Napo',
      capital: 'Tena',
      latitud: -0.9950,
      longitud: -77.8167,
      cantones: [
        { nombre: 'Tena', latitud: -0.9950, longitud: -77.8167, esCapital: true },
        { nombre: 'Archidona', latitud: -0.9167, longitud: -77.8000, esCapital: false },
        { nombre: 'El Chaco', latitud: -0.3333, longitud: -77.8167, esCapital: false },
        { nombre: 'Quijos', latitud: -0.2667, longitud: -77.8667, esCapital: false },
      ],
    },
    {
      nombre: 'Orellana',
      capital: 'Francisco de Orellana',
      latitud: -0.4664,
      longitud: -76.9871,
      cantones: [
        { nombre: 'Francisco de Orellana (Coca)', latitud: -0.4664, longitud: -76.9871, esCapital: true },
        { nombre: 'La Joya de los Sachas', latitud: -0.3500, longitud: -76.6167, esCapital: false },
        { nombre: 'Loreto', latitud: -0.7000, longitud: -77.2833, esCapital: false },
      ],
    },
    {
      nombre: 'Pastaza',
      capital: 'Puyo',
      latitud: -1.4877,
      longitud: -78.0037,
      cantones: [
        { nombre: 'Puyo', latitud: -1.4877, longitud: -78.0037, esCapital: true },
        { nombre: 'Mera', latitud: -1.4667, longitud: -78.1167, esCapital: false },
        { nombre: 'Santa Clara', latitud: -1.2500, longitud: -77.8667, esCapital: false },
      ],
    },
    {
      nombre: 'Pichincha',
      capital: 'Quito',
      latitud: -0.1807,
      longitud: -78.4678,
      cantones: [
        { nombre: 'Quito', latitud: -0.1807, longitud: -78.4678, esCapital: true },
        { nombre: 'Cayambe', latitud: 0.0417, longitud: -78.1444, esCapital: false },
        { nombre: 'Machachi', latitud: -0.5100, longitud: -78.5667, esCapital: false },
        { nombre: 'Pedro Moncayo', latitud: 0.1167, longitud: -78.1167, esCapital: false },
        { nombre: 'Rumiñahui', latitud: -0.3667, longitud: -78.4500, esCapital: false },
        { nombre: 'San Miguel de los Bancos', latitud: -0.0167, longitud: -78.9000, esCapital: false },
      ],
    },
    {
      nombre: 'Santa Elena',
      capital: 'Santa Elena',
      latitud: -2.2267,
      longitud: -80.8590,
      cantones: [
        { nombre: 'Santa Elena', latitud: -2.2267, longitud: -80.8590, esCapital: true },
        { nombre: 'La Libertad', latitud: -2.2333, longitud: -80.9000, esCapital: false },
        { nombre: 'Salinas', latitud: -2.2145, longitud: -80.9558, esCapital: false },
      ],
    },
    {
      nombre: 'Santo Domingo de los Tsáchilas',
      capital: 'Santo Domingo',
      latitud: -0.2521,
      longitud: -79.1753,
      cantones: [
        { nombre: 'Santo Domingo', latitud: -0.2521, longitud: -79.1753, esCapital: true },
      ],
    },
    {
      nombre: 'Sucumbíos',
      capital: 'Nueva Loja',
      latitud: 0.0868,
      longitud: -76.8873,
      cantones: [
        { nombre: 'Nueva Loja (Lago Agrio)', latitud: 0.0868, longitud: -76.8873, esCapital: true },
        { nombre: 'Cascales', latitud: 0.1167, longitud: -77.2667, esCapital: false },
        { nombre: 'Cuyabeno', latitud: 0.0000, longitud: -75.9167, esCapital: false },
        { nombre: 'Shushufindi', latitud: 0.1833, longitud: -76.6500, esCapital: false },
      ],
    },
    {
      nombre: 'Tungurahua',
      capital: 'Ambato',
      latitud: -1.2543,
      longitud: -78.6226,
      cantones: [
        { nombre: 'Ambato', latitud: -1.2543, longitud: -78.6226, esCapital: true },
        { nombre: 'Baños de Agua Santa', latitud: -1.3967, longitud: -78.4231, esCapital: false },
        { nombre: 'Cevallos', latitud: -1.3500, longitud: -78.6167, esCapital: false },
        { nombre: 'Mocha', latitud: -1.4833, longitud: -78.6500, esCapital: false },
        { nombre: 'Patate', latitud: -1.3167, longitud: -78.5000, esCapital: false },
        { nombre: 'Pelileo', latitud: -1.3333, longitud: -78.5500, esCapital: false },
        { nombre: 'Píllaro', latitud: -1.1667, longitud: -78.5333, esCapital: false },
        { nombre: 'Quero', latitud: -1.3833, longitud: -78.6167, esCapital: false },
        { nombre: 'Tisaleo', latitud: -1.3333, longitud: -78.6500, esCapital: false },
      ],
    },
    {
      nombre: 'Zamora Chinchipe',
      capital: 'Zamora',
      latitud: -4.0672,
      longitud: -78.9507,
      cantones: [
        { nombre: 'Zamora', latitud: -4.0672, longitud: -78.9507, esCapital: true },
        { nombre: 'Chinchipe', latitud: -4.8833, longitud: -78.9667, esCapital: false },
        { nombre: 'Nangaritza', latitud: -4.2667, longitud: -78.6667, esCapital: false },
        { nombre: 'Yacuambi', latitud: -3.6167, longitud: -78.9000, esCapital: false },
      ],
    },
  ];
}

// ==================== TRACKING GPS ====================

export interface PosicionViaje {
  id: number;
  viajeId: number;
  latitud: number;
  longitud: number;
  velocidadKmh?: number;
  precision?: number;
  timestamp: string;
  provider?: string;
}

export interface ActualizarPosicionRequest {
  latitud: number;
  longitud: number;
  velocidadKmh?: number;
  precision?: number;
  timestamp: string;
  provider?: string;
}

export interface Camino {
  id: number;
  rutaId: number;
  rutaOrigen: string;
  rutaDestino: string;
  nombre: string;
  distanciaKm?: number;
  duracionMinutos?: number;
  tipo: 'RAPIDO' | 'NORMAL' | 'TURISTICO' | 'ECONOMICO';
  polyline?: string;
  activo: boolean;
  paradas?: ParadaCamino[];
}

export interface ParadaCamino {
  id: number;
  caminoId: number;
  nombre: string;
  direccion?: string;
  latitud: number;
  longitud: number;
  orden: number;
  tiempoEstimadoMinutos?: number;
  permiteAbordaje: boolean;
  permiteDescenso: boolean;
  precioDesdeOrigen?: number;
  activa: boolean;
}

export const trackingApi = {
  /**
   * Actualizar posición GPS del viaje (solo CHOFER)
   */
  actualizarPosicion: async (viajeId: number, data: ActualizarPosicionRequest, token: string): Promise<PosicionViaje> => {
    const response = await fetch(`${API_URL}/tracking/viajes/${viajeId}/posicion`, fetchConfig(token, 'POST', data));
    return handleResponse<PosicionViaje>(response);
  },

  /**
   * Obtener historial de posiciones del viaje
   */
  obtenerHistorial: async (viajeId: number, desde?: string, token?: string): Promise<PosicionViaje[]> => {
    const params = desde ? `?desde=${encodeURIComponent(desde)}` : '';
    const response = await fetch(`${API_URL}/tracking/viajes/${viajeId}/posiciones${params}`, fetchConfig(token, 'GET'));
    return handleResponse<PosicionViaje[]>(response);
  },

  /**
   * Obtener posición actual del viaje
   */
  obtenerPosicionActual: async (viajeId: number, token?: string): Promise<PosicionViaje | null> => {
    const response = await fetch(`${API_URL}/tracking/viajes/${viajeId}/posicion-actual`, fetchConfig(token, 'GET'));
    const result = await handleResponse<PosicionViaje | { mensaje: string }>(response);
    
    // Si devuelve un mensaje, significa que no hay posiciones
    if (result && 'mensaje' in result) {
      return null;
    }
    
    return result as PosicionViaje;
  },

  /**
   * Iniciar viaje manualmente (solo CHOFER)
   */
  iniciarViaje: async (viajeId: number, token: string): Promise<void> => {
    const response = await fetch(`${API_URL}/tracking/viajes/${viajeId}/iniciar`, fetchConfig(token, 'POST'));
    await handleResponse<void>(response);
  },

  /**
   * Finalizar viaje manualmente (solo CHOFER)
   */
  finalizarViaje: async (viajeId: number, token: string): Promise<void> => {
    const response = await fetch(`${API_URL}/tracking/viajes/${viajeId}/finalizar`, fetchConfig(token, 'POST'));
    await handleResponse<void>(response);
  },
};

export const caminoApi = {
  /**
   * Obtener caminos de una ruta
   */
  listarPorRuta: async (rutaId: number, token: string): Promise<Camino[]> => {
    const response = await fetch(`${API_URL}/admin/rutas/${rutaId}/caminos`, fetchConfig(token, 'GET'));
    return handleResponse<Camino[]>(response);
  },

  /**
   * Obtener detalles de un camino con sus paradas
   */
  obtenerConParadas: async (caminoId: number, token: string): Promise<Camino> => {
    const response = await fetch(`${API_URL}/admin/caminos/${caminoId}`, fetchConfig(token, 'GET'));
    return handleResponse<Camino>(response);
  },
};

// ==================== TERMINALES ====================

export interface Terminal {
  id: number;
  nombre: string;
  provincia: string;
  canton: string;
  tipologia: 'T1' | 'T2' | 'T3' | 'T4' | 'T5';
  descripcionTipologia: string;
  andenes: number;
  frecuenciasPorAnden: number;
  maxFrecuenciasDiarias: number;
  latitud?: number;
  longitud?: number;
  direccion?: string;
  telefono?: string;
  horarioApertura?: string;
  horarioCierre?: string;
  imagenUrl?: string;
  activo: boolean;
}

export interface TerminalStats {
  totalTerminales: number;
  terminalesT1: number;
  terminalesT2: number;
  terminalesT3: number;
  terminalesT4: number;
  terminalesT5: number;
  capacidadTotalFrecuencias: number;
}

export interface OcupacionHora {
  hora: string;
  frecuenciasAsignadas: number;
  maxFrecuencias: number;
  saturado: boolean;
}

export interface OcupacionDiaria {
  terminalId: number;
  terminalNombre: string;
  tipologia: string;
  fecha: string;
  totalFrecuenciasAsignadas: number;
  maxFrecuenciasDiarias: number;
  maxFrecuenciasPorHora: number;
  horasSaturadas: number;
  porcentajeOcupacion: number;
  ocupacionesPorHora: OcupacionHora[];
}

export const terminalApi = {
  /**
   * Listar todos los terminales activos
   */
  listarTodos: async (token: string): Promise<Terminal[]> => {
    const response = await fetch(`${API_URL}/terminales`, fetchConfig(token, 'GET'));
    return handleResponse<Terminal[]>(response);
  },

  /**
   * Obtener terminal por ID
   */
  obtenerPorId: async (id: number, token: string): Promise<Terminal> => {
    const response = await fetch(`${API_URL}/terminales/${id}`, fetchConfig(token, 'GET'));
    return handleResponse<Terminal>(response);
  },

  /**
   * Listar terminales por provincia
   */
  listarPorProvincia: async (provincia: string, token: string): Promise<Terminal[]> => {
    const response = await fetch(`${API_URL}/terminales/provincia/${provincia}`, fetchConfig(token, 'GET'));
    return handleResponse<Terminal[]>(response);
  },

  /**
   * Obtener estadísticas de terminales
   */
  obtenerEstadisticas: async (token: string): Promise<TerminalStats> => {
    const response = await fetch(`${API_URL}/terminales/estadisticas`, fetchConfig(token, 'GET'));
    return handleResponse<TerminalStats>(response);
  },

  /**
   * Listar provincias con terminales
   */
  listarProvincias: async (token: string): Promise<string[]> => {
    const response = await fetch(`${API_URL}/terminales/provincias`, fetchConfig(token, 'GET'));
    return handleResponse<string[]>(response);
  },

  /**
   * Obtener ocupación diaria de un terminal
   */
  obtenerOcupacion: async (terminalId: number, fecha: string, token: string): Promise<OcupacionDiaria> => {
    const response = await fetch(`${API_URL}/terminales/${terminalId}/ocupacion?fecha=${fecha}`, fetchConfig(token, 'GET'));
    return handleResponse<OcupacionDiaria>(response);
  },

  /**
   * Buscar terminales por texto
   */
  buscar: async (texto: string, token: string): Promise<Terminal[]> => {
    const response = await fetch(`${API_URL}/terminales/buscar?q=${encodeURIComponent(texto)}`, fetchConfig(token, 'GET'));
    return handleResponse<Terminal[]>(response);
  },
};

// ==================== ASIGNACIONES Y HORAS CHOFER ====================

export interface ValidacionChofer {
  choferId: number;
  choferNombre: string;
  fecha: string;
  horasTrabajadasHoy: number;
  minutosTrabajadasHoy: number;
  horasPropuestas: number;
  limiteHorasHoy: number;
  diasJornadaExtendidaSemana: number;
  puedeAsignarse: boolean;
  mensaje: string;
}

export interface ResumenDiaChofer {
  fecha: string;
  diaSemana: string;
  horasTrabajadas: number;
  minutosTrabajados: number;
  jornadaExtendida: boolean;
}

export interface ResumenHorasChofer {
  choferId: number;
  choferNombre: string;
  semanaInicio: string;
  semanaFin: string;
  totalHorasSemana: number;
  totalMinutosSemana: number;
  diasConJornadaExtendida: number;
  diasRestantesJornadaExtendida: number;
  diasSemana: ResumenDiaChofer[];
}

export const asignacionApi = {
  /**
   * Validar si un chofer puede ser asignado
   */
  validarChofer: async (choferId: number, fecha: string, duracionMinutos: number, token: string): Promise<ValidacionChofer> => {
    const response = await fetch(
      `${API_URL}/asignaciones/validar/chofer/${choferId}?fecha=${fecha}&duracionMinutos=${duracionMinutos}`, 
      fetchConfig(token, 'GET')
    );
    return handleResponse<ValidacionChofer>(response);
  },

  /**
   * Obtener resumen de horas semanales de un chofer
   */
  obtenerResumenHoras: async (choferId: number, fecha: string, token: string): Promise<ResumenHorasChofer> => {
    const response = await fetch(
      `${API_URL}/asignaciones/chofer/${choferId}/resumen-horas?fecha=${fecha}`, 
      fetchConfig(token, 'GET')
    );
    return handleResponse<ResumenHorasChofer>(response);
  },
};

// ==================== VIAJES ACTIVOS ====================

export interface ViajeActivo {
  id: number;
  viajeId: number;
  busPlaca: string;
  busId: number;
  cooperativaNombre: string;
  cooperativaId: number;
  rutaOrigen: string;
  rutaDestino: string;
  rutaNombre: string;
  choferNombre: string;
  choferApellido: string;
  choferId: number | null;
  fechaSalida: string;
  horaSalida: string;
  horaLlegadaEstimada: string;
  estado: string;
  numeroPasajeros: number;
  capacidadTotal: number;
  latitudActual?: number;
  longitudActual?: number;
  velocidadKmh?: number;
  ultimaActualizacion?: string;
  horaInicioReal?: string;
  horaFinReal?: string;
  porcentajeOcupacion?: number;
  choferNombreCompleto?: string;
  // Coordenadas de terminales para mostrar la ruta en el mapa
  terminalOrigenLatitud?: number;
  terminalOrigenLongitud?: number;
  terminalDestinoLatitud?: number;
  terminalDestinoLongitud?: number;
  terminalOrigenNombre?: string;
  terminalDestinoNombre?: string;
}

export const viajesActivosApi = {
  /**
   * Obtener todos los viajes activos del sistema (Super Admin)
   */
  obtenerViajesGlobal: async (token: string): Promise<ViajeActivo[]> => {
    const response = await fetch(`${API_URL}/viajes/activos`, fetchConfig(token, 'GET'));
    return handleResponse<ViajeActivo[]>(response);
  },

  /**
   * Obtener viajes activos de una cooperativa específica
   */
  obtenerViajesPorCooperativa: async (cooperativaId: number, token: string): Promise<ViajeActivo[]> => {
    const response = await fetch(`${API_URL}/viajes/activos/cooperativa/${cooperativaId}`, fetchConfig(token, 'GET'));
    return handleResponse<ViajeActivo[]>(response);
  },

  /**
   * Obtener viajes activos de un cliente (viajes de boletos comprados)
   */
  obtenerViajesPorCliente: async (email: string, token: string): Promise<ViajeActivo[]> => {
    const response = await fetch(`${API_URL}/viajes/activos/cliente?email=${encodeURIComponent(email)}`, fetchConfig(token, 'GET'));
    return handleResponse<ViajeActivo[]>(response);
  },

  /**
   * Obtener información detallada de un viaje específico
   */
  obtenerDetalleViaje: async (viajeId: number, token: string): Promise<ViajeActivo> => {
    const response = await fetch(`${API_URL}/viajes/${viajeId}/detalle`, fetchConfig(token, 'GET'));
    return handleResponse<ViajeActivo>(response);
  },
};

// ==================== ASIGNACIÓN DE TERMINALES ====================

// Tipos para Cooperativa-Terminal
export interface TerminalAsignadoCooperativa {
  terminalId: number;
  nombre: string;
  canton: string;
  provincia: string;
  tipologia: string;
  esSedePrincipal: boolean;
  numeroAndenesAsignados: number;
}

export interface AsignarTerminalCooperativaRequest {
  terminalId: number;
  esSedePrincipal?: boolean;
  numeroAndenesAsignados?: number;
  observaciones?: string;
}

// Tipos para Usuario-Terminal
export interface TerminalAsignadoUsuario {
  terminalId: number;
  nombre: string;
  canton: string;
  provincia: string;
  tipologia: string;
  cargo: string;
  turno?: string;
  cooperativaId?: number;
  cooperativaNombre?: string;
}

export interface AsignarTerminalUsuarioRequest {
  terminalId: number;
  cooperativaId?: number;
  cargo?: string;
  turno?: string; // MAÑANA, TARDE, NOCHE, COMPLETO
}

export interface AsignarTerminalesUsuarioRequest {
  terminalIds: number[];
  cooperativaId?: number;
  cargo?: string;
  turno?: string;
}

export interface OficinistaPorTerminal {
  usuarioId: number;
  nombres: string;
  apellidos: string;
  email: string;
  cargo: string;
  turno?: string;
  cooperativaId?: number;
  cooperativaNombre?: string;
}

// Tipos para configuración de cooperativa
export interface CooperativaConfigResponse {
  id: number;
  nombre: string;
  ruc: string;
  direccion: string;
  telefono: string;
  email: string;
  descripcion: string | null;
  logoUrl: string | null;
  colorPrimario: string;
  colorSecundario: string;
  facebook: string | null;
  twitter: string | null;
  instagram: string | null;
  linkedin: string | null;
  youtube: string | null;
}

export interface UpdateCooperativaConfigRequest {
  nombre?: string;
  descripcion?: string | null;
  colorPrimario?: string;
  colorSecundario?: string;
  facebook?: string | null;
  twitter?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  youtube?: string | null;
}

export interface UpdateLogoRequest {
  logoBase64: string;
  fileName: string;
}

// API para configuración de cooperativa
export const cooperativaConfigApi = {
  /**
   * Obtener la configuración de una cooperativa
   */
  getConfiguracion: async (cooperativaId: number, token: string): Promise<CooperativaConfigResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativas/${cooperativaId}/configuracion`,
      fetchConfig(token)
    );
    return handleResponse<CooperativaConfigResponse>(response);
  },

  /**
   * Actualizar la configuración de una cooperativa
   */
  updateConfiguracion: async (
    cooperativaId: number,
    request: UpdateCooperativaConfigRequest,
    token: string
  ): Promise<CooperativaConfigResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativas/${cooperativaId}/configuracion`,
      fetchConfig(token, 'PUT', request)
    );
    return handleResponse<CooperativaConfigResponse>(response);
  },

  /**
   * Subir un logo para la cooperativa (Base64)
   */
  uploadLogo: async (
    cooperativaId: number,
    request: UpdateLogoRequest,
    token: string
  ): Promise<CooperativaConfigResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativas/${cooperativaId}/configuracion/logo`,
      fetchConfig(token, 'POST', request)
    );
    return handleResponse<CooperativaConfigResponse>(response);
  },

  /**
   * Eliminar el logo de la cooperativa
   */
  deleteLogo: async (cooperativaId: number, token: string): Promise<CooperativaConfigResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativas/${cooperativaId}/configuracion/logo`,
      fetchConfig(token, 'DELETE')
    );
    return handleResponse<CooperativaConfigResponse>(response);
  },
};

// API para asignación de terminales a cooperativas
export const cooperativaTerminalesApi = {
  /**
   * Obtener todos los terminales asignados a una cooperativa
   */
  getTerminales: async (cooperativaId: number, token: string): Promise<TerminalAsignadoCooperativa[]> => {
    const response = await fetch(
      `${API_URL}/cooperativas/${cooperativaId}/terminales`,
      fetchConfig(token)
    );
    return handleResponse<TerminalAsignadoCooperativa[]>(response);
  },

  /**
   * Asignar un terminal a la cooperativa
   */
  asignarTerminal: async (
    cooperativaId: number,
    request: AsignarTerminalCooperativaRequest,
    token: string
  ): Promise<TerminalAsignadoCooperativa> => {
    const response = await fetch(
      `${API_URL}/cooperativas/${cooperativaId}/terminales`,
      fetchConfig(token, 'POST', request)
    );
    return handleResponse<TerminalAsignadoCooperativa>(response);
  },

  /**
   * Sincronizar todos los terminales de una cooperativa (reemplaza los existentes)
   */
  sincronizarTerminales: async (
    cooperativaId: number,
    terminalIds: number[],
    token: string
  ): Promise<TerminalAsignadoCooperativa[]> => {
    const response = await fetch(
      `${API_URL}/cooperativas/${cooperativaId}/terminales/sync`,
      fetchConfig(token, 'PUT', terminalIds)
    );
    return handleResponse<TerminalAsignadoCooperativa[]>(response);
  },

  /**
   * Desasignar un terminal de la cooperativa
   */
  desasignarTerminal: async (
    cooperativaId: number,
    terminalId: number,
    token: string
  ): Promise<void> => {
    await fetch(
      `${API_URL}/cooperativas/${cooperativaId}/terminales/${terminalId}`,
      fetchConfig(token, 'DELETE')
    );
  },
};

// API para asignación de terminales a usuarios (oficinistas)
export const usuarioTerminalesApi = {
  /**
   * Obtener todos los terminales asignados a un usuario
   */
  getTerminales: async (usuarioId: number, token: string): Promise<TerminalAsignadoUsuario[]> => {
    const response = await fetch(
      `${API_URL}/usuarios/${usuarioId}/terminales`,
      fetchConfig(token)
    );
    return handleResponse<TerminalAsignadoUsuario[]>(response);
  },

  /**
   * Asignar un terminal a un usuario
   */
  asignarTerminal: async (
    usuarioId: number,
    request: AsignarTerminalUsuarioRequest,
    token: string
  ): Promise<TerminalAsignadoUsuario> => {
    const response = await fetch(
      `${API_URL}/usuarios/${usuarioId}/terminales`,
      fetchConfig(token, 'POST', request)
    );
    return handleResponse<TerminalAsignadoUsuario>(response);
  },

  /**
   * Sincronizar todos los terminales de un usuario (reemplaza los existentes)
   */
  sincronizarTerminales: async (
    usuarioId: number,
    request: AsignarTerminalesUsuarioRequest,
    token: string
  ): Promise<TerminalAsignadoUsuario[]> => {
    const response = await fetch(
      `${API_URL}/usuarios/${usuarioId}/terminales/sync`,
      fetchConfig(token, 'PUT', request)
    );
    return handleResponse<TerminalAsignadoUsuario[]>(response);
  },

  /**
   * Desasignar un terminal de un usuario
   */
  desasignarTerminal: async (
    usuarioId: number,
    terminalId: number,
    token: string
  ): Promise<void> => {
    await fetch(
      `${API_URL}/usuarios/${usuarioId}/terminales/${terminalId}`,
      fetchConfig(token, 'DELETE')
    );
  },

  /**
   * Obtener oficinistas que trabajan en un terminal
   */
  getOficinistasByTerminal: async (terminalId: number, token: string): Promise<OficinistaPorTerminal[]> => {
    const response = await fetch(
      `${API_URL}/terminales/${terminalId}/oficinistas`,
      fetchConfig(token)
    );
    return handleResponse<OficinistaPorTerminal[]>(response);
  },

  /**
   * Obtener oficinistas de una cooperativa con sus terminales
   */
  getOficinistasByCooperativa: async (cooperativaId: number, token: string): Promise<TerminalAsignadoUsuario[]> => {
    const response = await fetch(
      `${API_URL}/cooperativas/${cooperativaId}/oficinistas`,
      fetchConfig(token)
    );
    return handleResponse<TerminalAsignadoUsuario[]>(response);
  },
};

// ==================== FRECUENCIAS CONFIGURACIÓN ====================

export interface FrecuenciaConfigResponse {
  id: number;
  cooperativaId: number;
  cooperativaNombre: string;
  precioBasePorKm: number;
  factorDieselPorKm: number;
  precioDiesel: number;
  margenGananciaPorcentaje: number;
  maxHorasDiariasChofer: number;
  maxHorasExcepcionales: number;
  maxDiasExcepcionalesSemana: number;
  tiempoDescansoEntreViajesMinutos: number;
  tiempoMinimoParadaBusMinutos: number;
  horasOperacionMaxBus: number;
  intervaloMinimoFrecuenciasMinutos: number;
  horaInicioOperacion: string;
  horaFinOperacion: string;
}

export interface UpdateFrecuenciaConfigRequest {
  precioBasePorKm?: number;
  factorDieselPorKm?: number;
  precioDiesel?: number;
  margenGananciaPorcentaje?: number;
  maxHorasDiariasChofer?: number;
  maxHorasExcepcionales?: number;
  maxDiasExcepcionalesSemana?: number;
  tiempoDescansoEntreViajesMinutos?: number;
  tiempoMinimoParadaBusMinutos?: number;
  horasOperacionMaxBus?: number;
  intervaloMinimoFrecuenciasMinutos?: number;
  horaInicioOperacion?: string;
  horaFinOperacion?: string;
}

export interface TerminalIntermedio {
  terminalId: number;
  terminalNombre: string;
  canton: string;
  provincia: string;
  ordenEnRuta: number;
  distanciaDesdeOrigen: number;
  tiempoDesdeOrigen: number;
}

export interface RutaDisponibleResponse {
  rutaId: number | null;
  rutaNombre: string;
  terminalOrigenId: number;
  terminalOrigenNombre: string;
  terminalOrigenCanton: string;
  terminalOrigenProvincia: string;
  terminalDestinoId: number;
  terminalDestinoNombre: string;
  terminalDestinoCanton: string;
  terminalDestinoProvincia: string;
  distanciaKm: number;
  duracionEstimadaMinutos: number;
  precioSugerido: number;
  terminalesIntermedios: TerminalIntermedio[];
}

export interface ChoferAsignadoBus {
  choferId: number;
  nombre: string;
  tipo: 'PRINCIPAL' | 'ALTERNO';
  horasTrabajadasHoy: number;
  horasDisponiblesHoy: number;
  disponible: boolean;
  diasExcepcionalesSemana?: number;
}

export interface BusDisponibilidadResponse {
  busId: number;
  placa: string;
  numeroInterno: string;
  capacidadAsientos: number;
  estado: string;
  horasOperadasHoy: number;
  horasDisponiblesHoy: number;
  frecuenciasHoy: number;
  disponible: boolean;
  motivoNoDisponible: string | null;
  choferesAsignados: ChoferAsignadoBus[];
}

export interface ChoferDisponibilidadResponse {
  choferId: number;
  nombre: string;
  cedula: string;
  telefono: string;
  horasTrabajadasHoy: number;
  horasDisponiblesHoy: number;
  puedeTrabajarHorasExcepcionales: boolean;
  diasExcepcionalesUsadosSemana: number;
  frecuenciasHoy: number;
  disponible: boolean;
  motivoNoDisponible: string | null;
  busAsignadoId: number | null;
  busAsignadoPlaca: string | null;
}

export interface ParadaFrecuenciaRequest {
  orden: number;
  terminalId: number;
  tiempoLlegada: string;
  tiempoEsperaMinutos: number;
  precioDesdeOrigen: number;
  permiteAbordaje: boolean;
  permiteDescenso: boolean;
}

export interface CrearFrecuenciaValidadaRequest {
  busId: number;
  choferId?: number;
  terminalOrigenId: number;
  terminalDestinoId: number;
  horaSalida: string;
  diasOperacion: string;
  precioBase: number;
  observaciones?: string;
  paradas?: ParadaFrecuenciaRequest[];
}

export interface ValidacionFrecuenciaResponse {
  valida: boolean;
  errores: string[];
  advertencias: string[];
  busDisponibilidad: BusDisponibilidadResponse | null;
  choferDisponibilidad: ChoferDisponibilidadResponse | null;
  precioSugerido: number;
  horaLlegadaEstimada: string;
  duracionEstimadaMinutos: number;
}

export const frecuenciaConfigApi = {
  /**
   * Obtener configuración de frecuencias de la cooperativa
   */
  getConfiguracion: async (cooperativaId: number, token: string): Promise<FrecuenciaConfigResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/frecuencias/config`,
      fetchConfig(token)
    );
    return handleResponse<FrecuenciaConfigResponse>(response);
  },

  /**
   * Actualizar configuración de frecuencias
   */
  updateConfiguracion: async (
    cooperativaId: number,
    data: UpdateFrecuenciaConfigRequest,
    token: string
  ): Promise<FrecuenciaConfigResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/frecuencias/config`,
      fetchConfig(token, 'PUT', data)
    );
    return handleResponse<FrecuenciaConfigResponse>(response);
  },

  /**
   * Obtener rutas disponibles basadas en terminales de la cooperativa
   */
  getRutasDisponibles: async (cooperativaId: number, token: string): Promise<RutaDisponibleResponse[]> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/frecuencias/rutas-disponibles`,
      fetchConfig(token)
    );
    return handleResponse<RutaDisponibleResponse[]>(response);
  },

  /**
   * Obtener disponibilidad de buses para una fecha
   */
  getBusesDisponibles: async (
    cooperativaId: number,
    fecha: string,
    token: string
  ): Promise<BusDisponibilidadResponse[]> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/frecuencias/buses/disponibilidad?fecha=${fecha}`,
      fetchConfig(token)
    );
    return handleResponse<BusDisponibilidadResponse[]>(response);
  },

  /**
   * Obtener disponibilidad de choferes para una fecha
   */
  getChoferesDisponibles: async (
    cooperativaId: number,
    fecha: string,
    token: string
  ): Promise<ChoferDisponibilidadResponse[]> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/frecuencias/choferes/disponibilidad?fecha=${fecha}`,
      fetchConfig(token)
    );
    return handleResponse<ChoferDisponibilidadResponse[]>(response);
  },

  /**
   * Validar si se puede crear una frecuencia con los datos proporcionados
   */
  validarFrecuencia: async (
    cooperativaId: number,
    fecha: string,
    data: CrearFrecuenciaValidadaRequest,
    token: string
  ): Promise<ValidacionFrecuenciaResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/frecuencias/validar?fecha=${fecha}`,
      fetchConfig(token, 'POST', data)
    );
    return handleResponse<ValidacionFrecuenciaResponse>(response);
  },
};

// ==================== GENERACIÓN AUTOMÁTICA DE FRECUENCIAS ====================

export interface TurnoFrecuencia {
  numeroDia: number;
  horaSalida: string | null;
  origen: string;
  destino: string;
  horaLlegada: string | null;
  esParada: boolean;
  subTurnos: SubTurno[];
}

export interface SubTurno {
  horaSalida: string | null;
  origen: string;
  destino: string;
}

export interface PlantillaRotacion {
  id: number;
  cooperativaId: number;
  nombre: string;
  descripcion: string;
  totalTurnos: number;
  totalBuses?: number;
  turnos: TurnoFrecuencia[];
  activa: boolean;
}

export interface ImportarCsvRequest {
  contenidoCsv: string;
  nombrePlantilla: string;
  descripcion: string;
}

export interface ImportarCsvResponse {
  exitoso: boolean;
  plantillaId: number | null;
  turnosImportados: number;
  errores: string[];
  advertencias: string[];
}

export interface GenerarFrecuenciasRequest {
  plantillaId: number;
  fechaInicio: string;
  fechaFin: string;
  busIds: number[];
  asignarChoferesAutomaticamente: boolean;
  sobreescribirExistentes: boolean;
}

export interface ViajeGenerado {
  origen: string;
  destino: string;
  horaSalida: string;
  horaLlegadaEstimada: string | null;
  choferId: number | null;
  choferNombre: string | null;
}

export interface AsignacionBusDia {
  fecha: string;
  busId: number;
  busPlaca: string;
  turnoAsignado: number;
  primerViaje: string;
  viajes: ViajeGenerado[];
  esParada: boolean;
}

export interface ConflictoDetectado {
  fecha: string;
  busId: number;
  busPlaca: string;
  descripcion: string;
  tipoConflicto: string;
}

export interface PreviewGeneracionResponse {
  fechaInicio: string;
  fechaFin: string;
  diasTotales: number;
  frecuenciasAGenerar: number;
  busesParticipantes: number;
  asignaciones: AsignacionBusDia[];
  advertencias: string[];
  conflictos: ConflictoDetectado[];
}

export interface FrecuenciaGeneradaInfo {
  frecuenciaId: number | null;
  fecha: string;
  origen: string;
  destino: string;
  horaSalida: string;
  busId: number;
  busPlaca: string;
  choferId: number | null;
  choferNombre: string | null;
}

export interface ResultadoGeneracionResponse {
  frecuenciasCreadas: number;
  frecuenciasOmitidas: number;
  errores: number;
  mensajes: string[];
  frecuenciasGeneradas: FrecuenciaGeneradaInfo[];
}

export const generacionFrecuenciasApi = {
  /**
   * Importar plantilla desde CSV
   */
  importarCsv: async (
    cooperativaId: number,
    data: ImportarCsvRequest,
    token: string
  ): Promise<ImportarCsvResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/generacion-frecuencias/importar-csv`,
      fetchConfig(token, 'POST', data)
    );
    return handleResponse<ImportarCsvResponse>(response);
  },

  /**
   * Listar plantillas de la cooperativa
   */
  getPlantillas: async (cooperativaId: number, token: string): Promise<PlantillaRotacion[]> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/generacion-frecuencias/plantillas`,
      fetchConfig(token)
    );
    return handleResponse<PlantillaRotacion[]>(response);
  },

  /**
   * Obtener detalle de una plantilla
   */
  getPlantilla: async (
    cooperativaId: number,
    plantillaId: number,
    token: string
  ): Promise<PlantillaRotacion> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/generacion-frecuencias/plantillas/${plantillaId}`,
      fetchConfig(token)
    );
    return handleResponse<PlantillaRotacion>(response);
  },

  /**
   * Eliminar plantilla
   */
  eliminarPlantilla: async (
    cooperativaId: number,
    plantillaId: number,
    token: string
  ): Promise<void> => {
    await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/generacion-frecuencias/plantillas/${plantillaId}`,
      fetchConfig(token, 'DELETE')
    );
  },

  /**
   * Vista previa de generación
   */
  previewGeneracion: async (
    cooperativaId: number,
    data: GenerarFrecuenciasRequest,
    token: string
  ): Promise<PreviewGeneracionResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/generacion-frecuencias/preview`,
      fetchConfig(token, 'POST', data)
    );
    return handleResponse<PreviewGeneracionResponse>(response);
  },

  /**
   * Generar frecuencias
   */
  generarFrecuencias: async (
    cooperativaId: number,
    data: GenerarFrecuenciasRequest,
    token: string
  ): Promise<ResultadoGeneracionResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/generacion-frecuencias/generar`,
      fetchConfig(token, 'POST', data)
    );
    return handleResponse<ResultadoGeneracionResponse>(response);
  },
};

// ==================== GENERACIÓN AUTOMÁTICA DE FRECUENCIAS ====================

export interface RutaDisponibleAuto {
  terminalOrigenId: number;
  terminalOrigenNombre: string;
  terminalDestinoId: number;
  terminalDestinoNombre: string;
  distanciaKm: number;
  duracionEstimadaMinutos: number;
  precioSugerido: number;
}

export interface ConfiguracionActual {
  maxHorasChofer: number;
  maxHorasExcepcionales: number;
  maxDiasExcepcionales: number;
  tiempoDescansoMinutos: number;
  intervaloMinimoFrecuencias: number;
  horaInicio: string;
  horaFin: string;
}

export interface EstadoGeneracion {
  busesTotales: number;
  busesDisponibles: number;
  choferesTotales: number;
  choferesDisponibles: number;
  rutasDisponibles: RutaDisponibleAuto[];
  configuracion: ConfiguracionActual;
}

export interface RutaSeleccionadaRequest {
  terminalOrigenId: number;
  terminalDestinoId: number;
  precioBase?: number;
  duracionMinutos?: number;
}

export interface GenerarAutomaticoRequest {
  terminalOrigenId?: number;           // Opcional - para una sola ruta
  terminalDestinoId?: number;          // Opcional - para una sola ruta
  rutasSeleccionadas?: RutaSeleccionadaRequest[]; // Lista de rutas específicas
  generarTodasLasRutas?: boolean;      // Si es true, genera para todas las rutas
  fechaInicio: string;
  fechaFin: string;
  diasOperacion: string[];
  horaInicio: string;
  horaFin: string;
  intervaloMinutos: number;
  precioBase: number;
  duracionViajeMinutos?: number;
  asignarChoferesAutomaticamente: boolean;
}

export interface FrecuenciaPrevisualizacion {
  fecha: string;
  diaSemana: string;
  horaSalida: string;
  horaLlegada: string;
  origen: string;
  destino: string;
  busId: number;
  busPlaca: string;
  choferId: number | null;
  choferNombre: string | null;
  precio: number;
  estado: string;
}

export interface PreviewAutomaticoResponse {
  totalFrecuencias: number;
  frecuenciasPorDia: number;
  diasOperacion: number;
  busesNecesarios: number;
  busesDisponibles: number;
  tieneCapacidadSuficiente: boolean;
  frecuencias: FrecuenciaPrevisualizacion[];
  advertencias: string[];
  errores: string[];
}

export interface FrecuenciaCreada {
  frecuenciaId: number;
  fecha: string;
  horaSalida: string;
  ruta: string;
  busPlaca: string;
  choferNombre: string | null;
  precio: number;
}

export interface ResultadoGeneracionAutomatica {
  frecuenciasCreadas: number;
  frecuenciasConAdvertencias: number;
  errores: number;
  frecuenciasGeneradas: FrecuenciaCreada[];
  mensajes: string[];
  advertencias: string[];
}

export const generacionAutomaticaApi = {
  /**
   * Obtener estado actual para generación
   */
  getEstado: async (cooperativaId: number, token: string): Promise<EstadoGeneracion> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/frecuencias/generar-automatico/estado`,
      fetchConfig(token)
    );
    return handleResponse<EstadoGeneracion>(response);
  },

  /**
   * Vista previa de generación
   */
  preview: async (
    cooperativaId: number,
    data: GenerarAutomaticoRequest,
    token: string
  ): Promise<PreviewAutomaticoResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/frecuencias/generar-automatico/preview`,
      fetchConfig(token, 'POST', data)
    );
    return handleResponse<PreviewAutomaticoResponse>(response);
  },

  /**
   * Generar frecuencias
   */
  generar: async (
    cooperativaId: number,
    data: GenerarAutomaticoRequest,
    token: string
  ): Promise<ResultadoGeneracionAutomatica> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/frecuencias/generar-automatico`,
      fetchConfig(token, 'POST', data)
    );
    return handleResponse<ResultadoGeneracionAutomatica>(response);
  },
};

// ==================== Generación Inteligente de Frecuencias ====================

export interface RutaCircuito {
  terminalOrigenId: number;
  terminalOrigenNombre: string;
  terminalDestinoId: number;
  terminalDestinoNombre: string;
  distanciaKm: number;
  duracionMinutos: number;
  tipoFrecuencia: 'INTERPROVINCIAL' | 'INTRAPROVINCIAL';
  maxParadasPermitidas: number;
  precioSugerido: number;
  provinciaOrigen?: string;
  provinciaDestino?: string;
  cantonOrigen?: string;
  cantonDestino?: string;
}

export interface ConfiguracionGeneracionInteligente {
  maxHorasChofer: number;
  maxHorasExcepcionales: number;
  descansoInterprovincialMin: number;
  descansoIntraprovincialMin: number;
  umbralInterprovincialKm: number;
  horaInicioOperacion: string;
  horaFinOperacion: string;
}

export interface EstadoGeneracionInteligente {
  busesDisponibles: number;
  choferesDisponibles: number;
  terminalesHabilitados: number;
  rutasCircuito: RutaCircuito[];
  configuracion: ConfiguracionGeneracionInteligente;
  capacidadEstimadaDiaria: number;
}

export interface RutaCircuitoRequest {
  terminalOrigenId: number;
  terminalOrigenNombre: string;
  terminalDestinoId: number;
  terminalDestinoNombre: string;
  distanciaKm?: number;
  duracionMinutos?: number;
  precioBase?: number;
  habilitarParadas?: boolean;
  maxParadas?: number;
  terminalesParadaIds?: number[];
}

export interface GenerarInteligenteRequest {
  fechaInicio: string;
  fechaFin: string;
  diasOperacion: string[];
  rutasCircuito: RutaCircuitoRequest[];
  permitirParadas?: boolean;
  maxParadasPersonalizado?: number;
}

export interface FrecuenciaPreviewInteligente {
  fecha: string;
  diaSemana: string;
  horaSalida: string;
  horaLlegada: string;
  terminalOrigenId: number;
  terminalOrigenNombre: string;
  terminalDestinoId: number;
  terminalDestinoNombre: string;
  busId: number;
  busPlaca: string;
  tipoFrecuencia: 'INTERPROVINCIAL' | 'INTRAPROVINCIAL';
  duracionMinutos: number;
  tiempoDescansoMinutos: number;
  paradasPermitidas: number;
  precio: number;
  esViajeDe: 'IDA' | 'VUELTA';
}

export interface PreviewGeneracionInteligente {
  totalFrecuencias: number;
  frecuenciasPorDia: number;
  diasOperacion: number;
  busesUtilizados: number;
  busesDisponibles: number;
  frecuencias: FrecuenciaPreviewInteligente[];
  frecuenciasPorRuta: Record<string, number>;
  frecuenciasPorBus: Record<string, number>;
  advertencias: string[];
  errores: string[];
  esViable: boolean;
}

export interface ResultadoGeneracionInteligente {
  exito: boolean;
  frecuenciasCreadas: number;
  mensajes: string[];
  advertencias: string[];
}

export const generacionInteligenteApi = {
  /**
   * Obtener estado para generación inteligente
   */
  getEstado: async (cooperativaId: number, token: string): Promise<EstadoGeneracionInteligente> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/frecuencias/generar-inteligente/estado`,
      fetchConfig(token)
    );
    return handleResponse<EstadoGeneracionInteligente>(response);
  },

  /**
   * Preview de generación inteligente
   */
  preview: async (
    cooperativaId: number,
    data: GenerarInteligenteRequest,
    token: string
  ): Promise<PreviewGeneracionInteligente> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/frecuencias/generar-inteligente/preview`,
      fetchConfig(token, 'POST', data)
    );
    return handleResponse<PreviewGeneracionInteligente>(response);
  },

  /**
   * Generar frecuencias inteligentemente
   */
  generar: async (
    cooperativaId: number,
    data: GenerarInteligenteRequest,
    token: string
  ): Promise<ResultadoGeneracionInteligente> => {
    const response = await fetch(
      `${API_URL}/cooperativa/${cooperativaId}/frecuencias/generar-inteligente`,
      fetchConfig(token, 'POST', data)
    );
    return handleResponse<ResultadoGeneracionInteligente>(response);
  },
};

// ==================== Tipos de Capacidad Operativa ====================

export interface AlertaCapacidad {
  tipo: 'INFO' | 'ADVERTENCIA' | 'CRITICO';
  codigo: string;
  mensaje: string;
  detalle: string;
  recomendacion: string;
}

export interface CapacidadDiariaResumen {
  fecha: string;
  diaSemana: string;
  frecuenciasProgramadas: number;
  horasRequeridas: number;
  horasDisponibles: number;
  porcentajeUso: number;
  estado: 'DISPONIBLE' | 'OPTIMO' | 'LIMITE' | 'DEFICIT';
}

export interface CapacidadOperativaResponse {
  fecha: string;
  totalBuses: number;
  busesActivos: number;
  busesInactivos: number;
  totalChoferes: number;
  horasBusDisponiblesDia: number;
  horasChoferDisponiblesDia: number;
  horasOperativasRealesDia: number;
  cuelloBotella: 'NINGUNO' | 'BUSES' | 'CHOFERES' | 'AMBOS';
  frecuenciasActuales: number;
  frecuenciasMaximasSugeridas: number;
  porcentajeCapacidadUsada: number;
  alertas: AlertaCapacidad[];
  sugerencias: string[];
  maxHorasDiariasChofer: number;
  maxHorasExcepcionalesChofer: number;
  maxDiasExcepcionalesSemana: number;
  descansoInterprovincialMinutos: number;
  descansoIntraprovincialMinutos: number;
}

export interface CapacidadPeriodoResponse {
  fechaInicio: string;
  fechaFin: string;
  diasPlanificados: number;
  capacidadDiaria: CapacidadDiariaResumen[];
  promedioUsoCapacidad: number;
  diasEnDeficit: number;
  diasEnLimite: number;
  alertasGenerales: AlertaCapacidad[];
}

export interface ValidacionFrecuenciaResponse {
  puedeAgregar: boolean;
  razon: string;
  horasActuales: number;
  horasConNuevaFrecuencia: number;
  horasMaximas: number;
  porcentajeUsoResultante: number;
  alertas: AlertaCapacidad[];
}

// ==================== API de Capacidad Operativa ====================

export const capacidadOperativaApi = {
  /**
   * Obtener capacidad operativa actual de una cooperativa
   */
  getCapacidad: async (
    cooperativaId: number,
    fecha?: string,
    token?: string
  ): Promise<CapacidadOperativaResponse> => {
    const params = new URLSearchParams();
    if (fecha) params.append('fecha', fecha);
    
    const url = `${API_URL}/cooperativa/${cooperativaId}/capacidad${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, fetchConfig(token));
    return handleResponse<CapacidadOperativaResponse>(response);
  },

  /**
   * Validar si se puede agregar una nueva frecuencia
   */
  validarFrecuencia: async (
    cooperativaId: number,
    duracionMinutos: number,
    fecha?: string,
    token?: string
  ): Promise<ValidacionFrecuenciaResponse> => {
    const params = new URLSearchParams();
    params.append('duracionMinutos', duracionMinutos.toString());
    if (fecha) params.append('fecha', fecha);
    
    const url = `${API_URL}/cooperativa/${cooperativaId}/capacidad/validar-frecuencia?${params.toString()}`;
    const response = await fetch(url, fetchConfig(token));
    return handleResponse<ValidacionFrecuenciaResponse>(response);
  },

  /**
   * Obtener capacidad operativa para un periodo (semanas)
   */
  getCapacidadPeriodo: async (
    cooperativaId: number,
    semanas?: number,
    fechaInicio?: string,
    token?: string
  ): Promise<CapacidadPeriodoResponse> => {
    const params = new URLSearchParams();
    if (semanas) params.append('semanas', semanas.toString());
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    
    const url = `${API_URL}/cooperativa/${cooperativaId}/capacidad/periodo${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, fetchConfig(token));
    return handleResponse<CapacidadPeriodoResponse>(response);
  },
};

// ==================== NOTIFICACIONES DE VIAJE ====================

export interface NotificacionViaje {
  id: number;
  viajeId: number;
  tipo: 'VIAJE_INICIADO' | 'VIAJE_FINALIZADO' | 'VIAJE_CANCELADO' | 'ALERTA_RETRASO';
  titulo: string;
  mensaje: string;
  detalleViaje?: string;
  leida: boolean;
  fechaCreacion: string;
  fechaLectura?: string;
}

export interface NotificacionCountResponse {
  noLeidas: number;
}

export interface MarcadoNotificacionResponse {
  notificacionesMarcadas: number;
  mensaje: string;
}

export const notificacionViajeApi = {
  /**
   * Obtener todas las notificaciones de una cooperativa
   */
  getNotificaciones: async (
    cooperativaId: number,
    soloNoLeidas: boolean = false,
    token?: string
  ): Promise<NotificacionViaje[]> => {
    const url = `${API_URL}/cooperativa/${cooperativaId}/notificaciones?soloNoLeidas=${soloNoLeidas}`;
    const response = await fetch(url, fetchConfig(token));
    return handleResponse<NotificacionViaje[]>(response);
  },

  /**
   * Obtener conteo de notificaciones no leídas
   */
  getCountNoLeidas: async (
    cooperativaId: number,
    token?: string
  ): Promise<NotificacionCountResponse> => {
    const url = `${API_URL}/cooperativa/${cooperativaId}/notificaciones/count`;
    const response = await fetch(url, fetchConfig(token));
    return handleResponse<NotificacionCountResponse>(response);
  },

  /**
   * Marcar una notificación como leída
   */
  marcarComoLeida: async (
    cooperativaId: number,
    notificacionId: number,
    token?: string
  ): Promise<void> => {
    const url = `${API_URL}/cooperativa/${cooperativaId}/notificaciones/${notificacionId}/leer`;
    const response = await fetch(url, {
      ...fetchConfig(token),
      method: 'PUT',
    });
    if (!response.ok) {
      throw new Error('Error al marcar notificación como leída');
    }
  },

  /**
   * Marcar todas las notificaciones como leídas
   */
  marcarTodasComoLeidas: async (
    cooperativaId: number,
    token?: string
  ): Promise<MarcadoNotificacionResponse> => {
    const url = `${API_URL}/cooperativa/${cooperativaId}/notificaciones/leer-todas`;
    const response = await fetch(url, {
      ...fetchConfig(token),
      method: 'PUT',
    });
    return handleResponse<MarcadoNotificacionResponse>(response);
  },
};
