'use client';

import ProtectedRoute from '@/app/components/ProtectedRoute';
import { useAuth } from '@/app/context/AuthContext';
import { getFullName, getRoleName } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function CooperativaAdminDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['ADMIN']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-8">
          {/* Header con info del usuario */}
          <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg shadow-lg p-6 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">🏢 Admin Cooperativa</h1>
                <p className="text-green-100">Bienvenido, {user ? getFullName(user) : 'Administrador'}</p>
                <p className="text-sm text-green-200 mt-1">{user?.email}</p>
                {user?.cooperativaNombre && (
                  <p className="text-sm text-green-200 mt-1">🚌 {user.cooperativaNombre}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-green-200">Rol</p>
                <p className="text-lg font-semibold">{user ? getRoleName(user) : 'Admin Cooperativa'}</p>
                <button
                  onClick={handleLogout}
                  className="mt-4 bg-white text-green-700 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors font-medium text-sm"
                >
                  🚪 Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
          
          {/* Acciones rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <button className="bg-white hover:bg-gray-50 rounded-lg shadow p-6 text-left transition-colors">
              <div className="text-3xl mb-2">🚌</div>
              <h3 className="font-semibold text-gray-800">Gestión de Buses</h3>
              <p className="text-sm text-gray-600 mt-1">Administrar flota</p>
            </button>
            
            <button className="bg-white hover:bg-gray-50 rounded-lg shadow p-6 text-left transition-colors">
              <div className="text-3xl mb-2">👥</div>
              <h3 className="font-semibold text-gray-800">Personal</h3>
              <p className="text-sm text-gray-600 mt-1">Oficinistas y choferes</p>
            </button>
            
            <button className="bg-white hover:bg-gray-50 rounded-lg shadow p-6 text-left transition-colors">
              <div className="text-3xl mb-2">🗺️</div>
              <h3 className="font-semibold text-gray-800">Rutas</h3>
              <p className="text-sm text-gray-600 mt-1">Configurar rutas</p>
            </button>
            
            <button className="bg-white hover:bg-gray-50 rounded-lg shadow p-6 text-left transition-colors">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-semibold text-gray-800">Reportes</h3>
              <p className="text-sm text-gray-600 mt-1">Estadísticas y ventas</p>
            </button>
          </div>
          
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">🚌 Buses Activos</h3>
              <p className="text-3xl font-bold text-blue-600">0</p>
              <p className="text-sm text-blue-700 mt-1">Próximamente</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-2">👥 Personal</h3>
              <p className="text-3xl font-bold text-green-600">0</p>
              <p className="text-sm text-green-700 mt-1">Próximamente</p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="font-semibold text-purple-900 mb-2">💰 Ventas Hoy</h3>
              <p className="text-3xl font-bold text-purple-600">$0</p>
              <p className="text-sm text-purple-700 mt-1">Próximamente</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
