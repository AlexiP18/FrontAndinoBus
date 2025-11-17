/**
 * API Service - Centralized HTTP client for backend communication
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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
  return response.json();
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
}

export interface MeResponse {
  userId: number;
  email: string;
  rol: string; // CLIENTE | COOPERATIVA | ADMIN
  nombres?: string;
  apellidos?: string;
  
  // Campos adicionales para COOPERATIVA
  rolCooperativa?: string; // ADMIN | OFICINISTA | CHOFER
  cooperativaId?: number;
  cooperativaNombre?: string;
  cedula?: string;
  telefono?: string;
}

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
  viajeId: number;
  asientos: string[];
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

export interface ReservaCreateRequest {
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
}

export interface AsientoDisponibilidadDto {
  numeroAsiento: string; // "1A", "2B", etc.
  tipo?: string; // "NORMAL" | "VIP"
  estado: string; // "DISPONIBLE" | "RESERVADO" | "VENDIDO" | "BLOQUEADO"
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

  misReservas: async (token: string): Promise<ReservaDetalleResponse[]> => {
    const response = await fetch(`${API_URL}/reservas/mis-reservas`, fetchConfig(token));
    return handleResponse<ReservaDetalleResponse[]>(response);
  },

  cancelar: async (reservaId: number, token: string): Promise<void> => {
    await fetch(`${API_URL}/reservas/${reservaId}`, fetchConfig(token, 'DELETE'));
  },

  obtenerAsientosDisponibles: async (viajeId: number, token?: string): Promise<AsientoDisponibilidadDto[]> => {
    const response = await fetch(`${API_URL}/reservas/viaje/${viajeId}/asientos`, fetchConfig(token));
    return handleResponse<AsientoDisponibilidadDto[]>(response);
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

export const cooperativaApi = {
  // Buses
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

  // Asignaciones
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

  // Días de Parada
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

  // Resumen
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

  // Frecuencias
  obtenerFrecuencias: async (cooperativaId: number, token?: string): Promise<FrecuenciaDto[]> => {
    const response = await fetch(
      `${API_URL}/cooperativas/${cooperativaId}/frecuencias`,
      fetchConfig(token)
    );
    const pageResponse = await handleResponse<PageResponse<any>>(response);
    return pageResponse.content;
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
