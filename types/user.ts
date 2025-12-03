// Rol principal del usuario (en el JWT)
export type RolPrincipal = 'CLIENTE' | 'COOPERATIVA' | 'ADMIN';

// Sub-rol dentro del entorno COOPERATIVA
export type RolCooperativa = 'ADMIN' | 'OFICINISTA' | 'CHOFER';

// Tipo legacy para compatibilidad
export type UserRole = RolPrincipal | RolCooperativa;

export interface User {
  userId: number;
  email: string;
  rol: RolPrincipal; // Rol principal (CLIENTE, COOPERATIVA, ADMIN)
  
  // Datos personales
  nombres?: string;
  apellidos?: string;
  cedula?: string;
  telefono?: string;
  fotoUrl?: string;
  
  // Solo para rol COOPERATIVA
  rolCooperativa?: RolCooperativa; // ADMIN, OFICINISTA, CHOFER
  cooperativaId?: number;
  cooperativaNombre?: string;
  
  // Campos legacy para compatibilidad
  id?: string; // Alias de userId
  nombre?: string; // Alias de nombres
  apellido?: string; // Alias de apellidos
  role?: UserRole; // Alias de rol
}

export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  rol: RolPrincipal;
  nombres?: string;
  apellidos?: string;
  fotoUrl?: string;
  
  // Solo para COOPERATIVA
  rolCooperativa?: string;
  cooperativaId?: number;
  cooperativaNombre?: string;
  cedula?: string;
  telefono?: string;
}

// Permisos por rol principal
export const ROLE_PERMISSIONS = {
  CLIENTE: {
    canBuyTickets: true,
    canViewOwnTickets: true,
    canManageProfile: true,
    canSearchRoutes: true,
  },
  COOPERATIVA: {
    // Permisos varían según rolCooperativa (ADMIN, OFICINISTA, CHOFER)
  },
  ADMIN: {
    canManageEverything: true,
    canManageCooperativas: true,
    canManageAllUsers: true,
    canViewGlobalReports: true,
  },
};

// Permisos específicos para usuarios COOPERATIVA según su sub-rol
export const COOPERATIVA_PERMISSIONS = {
  ADMIN: {
    canManageBuses: true,
    canManageFrequencies: true,
    canManagePersonal: true,
    canViewReports: true,
    canConfigureCooperativa: true,
    canManageDrivers: true,
    canManageOficinistas: true,
  },
  OFICINISTA: {
    canSellTickets: true,
    canViewSchedules: true,
    canManageReservations: true,
    canViewSalesReports: true,
  },
  CLIENTE: {
    canBuyTickets: true,
    canViewTickets: true,
    canCancelReservations: true,
    canViewHistory: true,
  },
};

// Rutas de dashboard por rol
export const DASHBOARD_ROUTES = {
  COOPERATIVA: '/dashboard/Cooperativa',
  OFICINISTA: '/dashboard/Oficinista',
  CLIENTE: '/dashboard/Cliente',
};