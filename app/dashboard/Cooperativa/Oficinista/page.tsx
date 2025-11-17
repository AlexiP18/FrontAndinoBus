'use client';

import ProtectedRoute from '@/app/components/ProtectedRoute';
import { useAuth } from '@/app/context/AuthContext';
import { getFullName, getRoleName } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function OficinistaDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['OFICINISTA']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-8">
          {/* Header con info del usuario */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg shadow-lg p-6 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">🏫 Oficinista</h1>
                <p className="text-purple-100">Bienvenido, {user ? getFullName(user) : 'Oficinista'}</p>
                <p className="text-sm text-purple-200 mt-1">{user?.email}</p>
                {user?.cooperativaNombre && (
                  <p className="text-sm text-purple-200 mt-1">🚌 {user.cooperativaNombre}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-purple-200">Rol</p>
                <p className="text-lg font-semibold">{user ? getRoleName(user) : 'Oficinista'}</p>
                <p className="text-sm text-purple-200 mt-1">Código: {user?.cedula || 'N/A'}</p>
                <button
                  onClick={handleLogout}
                  className="mt-4 bg-white text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors font-medium text-sm"
                >
                  🚪 Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
          
          {/* Acciones rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <button className="bg-white hover:bg-purple-50 rounded-lg shadow p-6 text-left transition-colors border-2 border-transparent hover:border-purple-300">
              <div className="text-3xl mb-2">🎫</div>
              <h3 className="font-semibold text-gray-800">Vender Boleto</h3>
              <p className="text-sm text-gray-600 mt-1">Venta presencial</p>
            </button>
            
            <button className="bg-white hover:bg-purple-50 rounded-lg shadow p-6 text-left transition-colors border-2 border-transparent hover:border-purple-300">
              <div className="text-3xl mb-2">📋</div>
              <h3 className="font-semibold text-gray-800">Reservas</h3>
              <p className="text-sm text-gray-600 mt-1">Gestionar reservas</p>
            </button>
            
            <button className="bg-white hover:bg-purple-50 rounded-lg shadow p-6 text-left transition-colors border-2 border-transparent hover:border-purple-300">
              <div className="text-3xl mb-2">🚌</div>
              <h3 className="font-semibold text-gray-800">Buses en Viaje</h3>
              <p className="text-sm text-gray-600 mt-1">Monitoreo en tiempo real</p>
            </button>
          </div>
          
          {/* Estadísticas del día */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">🎫 Boletos Vendidos Hoy</h3>
              <p className="text-3xl font-bold text-blue-600">0</p>
              <p className="text-sm text-blue-700 mt-1">Próximamente</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-2">💵 Recaudado Hoy</h3>
              <p className="text-3xl font-bold text-green-600">$0</p>
              <p className="text-sm text-green-700 mt-1">Próximamente</p>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h3 className="font-semibold text-orange-900 mb-2">⏰ Reservas Pendientes</h3>
              <p className="text-3xl font-bold text-orange-600">0</p>
              <p className="text-sm text-orange-700 mt-1">Próximamente</p>
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
              <li>Venta de boletos con selección de asientos</li>
              <li>Gestión de reservas y cancelaciones</li>
              <li>Visualización de pasajeros por bus</li>
              <li>Registro de pagos en efectivo y tarjeta</li>
              <li>Impresión de boletos</li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
