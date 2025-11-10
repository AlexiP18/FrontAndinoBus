export type UserRole = 'COOPERATIVA' | 'OFICINISTA' | 'CLIENTE';

export interface User {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  cedula?: string;
  role: UserRole;
  cooperativaId?: string; // Solo para usuarios de cooperativa
  cooperativaNombre?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Permisos por rol
export const ROLE_PERMISSIONS = {
  COOPERATIVA: {
    canManageBuses: true,
    canManageDrivers: true,
    canViewReports: true,
    canManageRoutes: true,
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
  COOPERATIVA: '/dashboard/cooperativa',
  OFICINISTA: '/dashboard/oficinista',
  CLIENTE: '/dashboard/cliente',
};