'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { getDashboardPath } from '@/lib/auth';
import type { RolPrincipal, RolCooperativa } from '@/types/user';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: RolPrincipal[]; // Roles principales permitidos (CLIENTE, COOPERATIVA, ADMIN)
  allowedRolesCooperativa?: RolCooperativa[]; // Sub-roles de cooperativa permitidos (ADMIN, OFICINISTA, CHOFER)
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles,
  allowedRolesCooperativa 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (loading || hasRedirected.current) return;

    if (!user) {
      // No hay usuario autenticado, redirigir al login
      hasRedirected.current = true;
      router.push('/login');
      return;
    }

    // Validar rol principal
    if (allowedRoles && !allowedRoles.includes(user.rol)) {
      hasRedirected.current = true;
      router.push(getDashboardPath(user));
      return;
    }

    // Validar sub-rol de cooperativa si aplica
    if (user.rol === 'COOPERATIVA' && allowedRolesCooperativa) {
      if (!user.rolCooperativa || !allowedRolesCooperativa.includes(user.rolCooperativa)) {
        hasRedirected.current = true;
        router.push(getDashboardPath(user));
        return;
      }
    }
  }, [user, loading, router, allowedRoles, allowedRolesCooperativa]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // No mostrar nada si no hay usuario
  if (!user) {
    return null;
  }

  // Validar rol principal
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return null;
  }

  // Validar sub-rol de cooperativa
  if (user.rol === 'COOPERATIVA' && allowedRolesCooperativa) {
    if (!user.rolCooperativa || !allowedRolesCooperativa.includes(user.rolCooperativa)) {
      return null;
    }
  }

  return <>{children}</>;
}
