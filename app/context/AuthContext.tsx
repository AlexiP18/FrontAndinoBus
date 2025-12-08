'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, type AuthResponse, type MeResponse } from '@/lib/api';

interface AuthContextType {
  user: MeResponse | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, tipoUsuario?: 'CLIENTE' | 'COOPERATIVA' | 'ADMIN') => Promise<void>;
  register: (email: string, password: string, nombres?: string, apellidos?: string) => Promise<{ requiresConfirmation: boolean; message: string; email?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Marcar como montado en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cargar token y usuario al iniciar (solo en el cliente)
  useEffect(() => {
    if (!mounted) return;

    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const userData = await authApi.me(storedToken);
          setUser(userData);
        } catch (error) {
          console.error('Token inválido:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [mounted]);

  const login = async (email: string, password: string, tipoUsuario?: 'CLIENTE' | 'COOPERATIVA' | 'ADMIN') => {
    let response: AuthResponse | null = null;
    let lastError: Error | null = null;

    // Si se especifica tipo de usuario, intentar solo ese endpoint
    if (tipoUsuario) {
      switch (tipoUsuario) {
        case 'ADMIN':
          response = await authApi.loginAdmin({ email, password });
          break;
        case 'COOPERATIVA':
          response = await authApi.loginCooperativa({ email, password });
          break;
        case 'CLIENTE':
          response = await authApi.loginCliente({ email, password });
          break;
      }
    } else {
      // Auto-detectar: intentar en orden Cliente -> Cooperativa -> Admin
      const loginAttempts = [
        { tipo: 'CLIENTE', fn: () => authApi.loginCliente({ email, password }) },
        { tipo: 'COOPERATIVA', fn: () => authApi.loginCooperativa({ email, password }) },
        { tipo: 'ADMIN', fn: () => authApi.loginAdmin({ email, password }) },
      ];

      for (const attempt of loginAttempts) {
        try {
          response = await attempt.fn();
          console.log(`✅ Login exitoso como ${attempt.tipo}`);
          break; // Salir del loop si el login es exitoso
        } catch (error: any) {
          console.log(`❌ Intento fallido como ${attempt.tipo}`);
          lastError = error;
          // Continuar con el siguiente intento
        }
      }

      // Si ningún intento funcionó, lanzar el último error
      if (!response) {
        throw lastError || new Error('Credenciales incorrectas');
      }
    }
    
    // Guardar token
    localStorage.setItem('token', response.token);

    // Guardar datos del usuario
    const userData: MeResponse = {
      userId: response.userId,
      email: response.email,
      rol: response.rol as 'CLIENTE' | 'COOPERATIVA' | 'ADMIN',
      nombres: response.nombres,
      apellidos: response.apellidos,
      // Campos adicionales para COOPERATIVA
      rolCooperativa: response.rolCooperativa as 'ADMIN' | 'OFICINISTA' | 'CHOFER' | undefined,
      cooperativaId: response.cooperativaId,
      cooperativaNombre: response.cooperativaNombre,
      cedula: response.cedula,
      telefono: response.telefono,
    };
    
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Actualizar estado
    setToken(response.token);
    setUser(userData);

    // Redirigir según el rol
    let dashboardPath = '/dashboard/Cliente';
    
    if (response.rol === 'ADMIN') {
      dashboardPath = '/dashboard/Admin';
    } else if (response.rol === 'COOPERATIVA') {
      const rolCoop = response.rolCooperativa?.toUpperCase();
      
      switch (rolCoop) {
        case 'ADMIN':
          dashboardPath = '/dashboard/Cooperativa/Admin';
          break;
        case 'OFICINISTA':
          dashboardPath = '/dashboard/Cooperativa/Oficinista';
          break;
        case 'CHOFER':
          dashboardPath = '/dashboard/Cooperativa/Chofer';
          break;
        default:
          dashboardPath = '/dashboard/Cooperativa/Admin';
      }
    } else if (response.rol === 'CLIENTE') {
      dashboardPath = '/dashboard/Cliente';
    }

    // Forzar recarga de la página para asegurar que el estado se propague
    window.location.href = dashboardPath;
  };

  interface RegisterResult {
    requiresConfirmation: boolean;
    message: string;
    email?: string;
  }

  const register = async (email: string, password: string, nombres?: string, apellidos?: string): Promise<RegisterResult> => {
    const response: AuthResponse = await authApi.register({ email, password, nombres, apellidos });
    
    // Si requiere confirmación de email, no guardar token ni redirigir
    if (response.requiresConfirmation) {
      return {
        requiresConfirmation: true,
        message: response.message || 'Por favor revisa tu correo para confirmar tu cuenta.',
        email: response.email
      };
    }
    
    // Comportamiento original si no requiere confirmación (para compatibilidad)
    if (response.token) {
      localStorage.setItem('token', response.token);
      setToken(response.token);

      const userData: MeResponse = {
        userId: response.userId,
        email: response.email,
        rol: response.rol as 'CLIENTE' | 'COOPERATIVA' | 'ADMIN',
        nombres: response.nombres,
        apellidos: response.apellidos,
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      router.push('/dashboard/Cliente');
    }
    
    return {
      requiresConfirmation: false,
      message: 'Registro exitoso'
    };
  };

  const logout = async () => {
    try {
      if (token) {
        await authApi.logout(token);
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      router.push('/login');
    }
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const userData = await authApi.me(token);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        console.error('Error al refrescar usuario:', error);
        await logout();
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
