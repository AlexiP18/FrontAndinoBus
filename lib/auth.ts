/**
 * Utilidades de autenticación y navegación por roles
 */

import { User, RolPrincipal, RolCooperativa } from '@/types/user';

/**
 * Interfaz para la respuesta de autenticación del backend
 */
interface AuthResponse {
  userId: number;
  email: string;
  rol: RolPrincipal;
  nombres?: string;
  apellidos?: string;
  cedula?: string;
  telefono?: string;
  rolCooperativa?: RolCooperativa;
  cooperativaId?: number;
  cooperativaNombre?: string;
}

/**
 * Obtiene la ruta del dashboard según el rol del usuario
 */
export function getDashboardPath(user: User): string {
  // Super administrador
  if (user.rol === 'ADMIN') {
    return '/dashboard/Admin';
  }

  // Cliente
  if (user.rol === 'CLIENTE') {
    return '/dashboard/Cliente';
  }

  // Usuario de cooperativa (ADMIN, OFICINISTA, CHOFER)
  if (user.rol === 'COOPERATIVA') {
    switch (user.rolCooperativa) {
      case 'ADMIN':
        return '/dashboard/Cooperativa/Admin';
      case 'OFICINISTA':
        return '/dashboard/Cooperativa/Oficinista';
      case 'CHOFER':
        return '/dashboard/Cooperativa/Chofer';
      default:
        console.warn('rolCooperativa no definido, redirigiendo a login');
        return '/login';
    }
  }

  // Fallback
  return '/login';
}

/**
 * Convierte AuthResponse del backend a objeto User
 */
export function authResponseToUser(authResponse: AuthResponse): User {
  return {
    userId: authResponse.userId,
    email: authResponse.email,
    rol: authResponse.rol,
    nombres: authResponse.nombres,
    apellidos: authResponse.apellidos,
    cedula: authResponse.cedula,
    telefono: authResponse.telefono,
    rolCooperativa: authResponse.rolCooperativa as RolCooperativa,
    cooperativaId: authResponse.cooperativaId,
    cooperativaNombre: authResponse.cooperativaNombre,
    
    // Campos legacy para compatibilidad
    id: authResponse.userId?.toString(),
    nombre: authResponse.nombres,
    apellido: authResponse.apellidos,
    role: authResponse.rol,
  };
}

/**
 * Obtiene el usuario desde el token almacenado en localStorage
 */
export function getUserFromToken(): User | null {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    // Obtener datos del usuario desde localStorage
    const userDataStr = localStorage.getItem('user');
    if (userDataStr) {
      return JSON.parse(userDataStr) as User;
    }

    return null;
  } catch (error) {
    console.error('Error al decodificar token:', error);
    return null;
  }
}

/**
 * Guarda el token y los datos del usuario en localStorage
 */
export function saveAuthData(token: string, user: User): void {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Limpia los datos de autenticación
 */
export function clearAuthData(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export function hasRole(user: User | null, rol: RolPrincipal): boolean {
  return user?.rol === rol;
}

/**
 * Verifica si el usuario de cooperativa tiene un sub-rol específico
 */
export function hasCooperativaRole(user: User | null, rolCooperativa: RolCooperativa): boolean {
  return user?.rol === 'COOPERATIVA' && user?.rolCooperativa === rolCooperativa;
}

/**
 * Obtiene el nombre completo del usuario
 */
export function getFullName(user: User): string {
  if (!user.nombres && !user.apellidos) return user.email;
  if (!user.nombres) return user.apellidos || user.email;
  if (!user.apellidos) return user.nombres;
  return `${user.nombres} ${user.apellidos}`;
}

/**
 * Obtiene el nombre del rol en español
 */
export function getRoleName(user: User): string {
  if (user.rol === 'ADMIN') return 'Administrador del Sistema';
  if (user.rol === 'CLIENTE') return 'Cliente';
  
  if (user.rol === 'COOPERATIVA') {
    switch (user.rolCooperativa) {
      case 'ADMIN':
        return 'Administrador de Cooperativa';
      case 'OFICINISTA':
        return 'Oficinista';
      case 'CHOFER':
        return 'Chofer';
      default:
        return 'Usuario de Cooperativa';
    }
  }

  return 'Usuario';
}
