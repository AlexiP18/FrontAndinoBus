'use client';

import ProtectedRoute from '@/app/components/ProtectedRoute';
import { useAuth } from '@/app/context/AuthContext';
import { getFullName, getRoleName } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function ChoferDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['CHOFER']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-8">
          {/* Header con info del usuario */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-800 rounded-lg shadow-lg p-6 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">🚗 Chofer</h1>
                <p className="text-orange-100">Bienvenido, {user ? getFullName(user) : 'Chofer'}</p>
                <p className="text-sm text-orange-200 mt-1">{user?.email}</p>
                {user?.cooperativaNombre && (
                  <p className="text-sm text-orange-200 mt-1">🚌 {user.cooperativaNombre}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-orange-200">Rol</p>
                <p className="text-lg font-semibold">{user ? getRoleName(user) : 'Chofer'}</p>
                <p className="text-sm text-orange-200 mt-1">Licencia: {user?.cedula || 'N/A'}</p>
                <button
                  onClick={handleLogout}
                  className="mt-4 bg-white text-orange-700 px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors font-medium text-sm"
                >
                  🚪 Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
          
          {/* Viaje actual */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-l-4 border-orange-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📍 Mi Viaje Actual</h2>
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🚌</div>
              <p className="text-gray-600 text-lg">No tienes viajes asignados hoy</p>
              <p className="text-sm text-gray-500 mt-2">Cuando se te asigne un viaje, aparecerá aquí</p>
            </div>
          </div>
          
          {/* Acciones rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button className="bg-white hover:bg-orange-50 rounded-lg shadow p-6 text-left transition-colors border-2 border-transparent hover:border-orange-300">
              <div className="text-3xl mb-2">📅</div>
              <h3 className="font-semibold text-gray-800">Mis Viajes</h3>
              <p className="text-sm text-gray-600 mt-1">Ver historial de viajes</p>
            </button>
            
            <button className="bg-white hover:bg-orange-50 rounded-lg shadow p-6 text-left transition-colors border-2 border-transparent hover:border-orange-300">
              <div className="text-3xl mb-2">👥</div>
              <h3 className="font-semibold text-gray-800">Pasajeros</h3>
              <p className="text-sm text-gray-600 mt-1">Lista de pasajeros del viaje</p>
            </button>
          </div>
          
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">🚌 Viajes del Mes</h3>
              <p className="text-3xl font-bold text-blue-600">0</p>
              <p className="text-sm text-blue-700 mt-1">Próximamente</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-2">👥 Pasajeros Transportados</h3>
              <p className="text-3xl font-bold text-green-600">0</p>
              <p className="text-sm text-green-700 mt-1">Próximamente</p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-semibold text-yellow-900 mb-2">⭐ Calificación</h3>
              <p className="text-3xl font-bold text-yellow-600">5.0</p>
              <p className="text-sm text-yellow-700 mt-1">Próximamente</p>
            </div>
          </div>
          
          {/* Sección en desarrollo */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>🚧</span>
              <span>Funcionalidades en Desarrollo</span>
            </h2>
            <p className="text-gray-600 mb-4">
              Próximamente estarán disponibles:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Información detallada de viaje asignado</li>
              <li>Lista completa de pasajeros con verificación de pago</li>
              <li>Notificación de hora de salida y llegada</li>
              <li>Historial de viajes realizados</li>
              <li>Sistema de calificaciones y comentarios</li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
