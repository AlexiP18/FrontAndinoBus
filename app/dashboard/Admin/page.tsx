'use client';

import ProtectedRoute from '@/app/components/ProtectedRoute';
import { useAuth } from '@/app/context/AuthContext';
import { getFullName, getRoleName } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-8">
          {/* Header con info del usuario */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">🛡️ Super Administrador</h1>
                <p className="text-blue-100">Bienvenido, {user ? getFullName(user) : 'Administrador'}</p>
                <p className="text-sm text-blue-200 mt-1">{user?.email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-200">Rol</p>
                <p className="text-lg font-semibold">{user ? getRoleName(user) : 'Super Admin'}</p>
                <button
                  onClick={handleLogout}
                  className="mt-4 bg-white text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
                >
                  🚪 Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
          
          {/* Sección en construcción */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>🚧</span>
              <span>Panel en Desarrollo</span>
            </h2>
            <p className="text-gray-600">
              El dashboard de super administrador está en desarrollo. Próximamente tendrás acceso a:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-gray-700">
              <li>Gestión de todas las cooperativas del sistema</li>
              <li>Administración de usuarios (todos los roles)</li>
              <li>Visualización de rutas y frecuencias globales</li>
              <li>Reportes de ventas por cooperativa</li>
              <li>Estadísticas globales del sistema</li>
              <li>Gestión de buses de todas las cooperativas</li>
              <li>Análisis de pasajeros por período</li>
              <li>Configuración del sistema</li>
            </ul>
          </div>
          
          {/* Cards de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">📊 Cooperativas</h3>
              <p className="text-3xl font-bold text-blue-600">0</p>
              <p className="text-sm text-blue-700 mt-1">Próximamente</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-2">👥 Usuarios Totales</h3>
              <p className="text-3xl font-bold text-green-600">0</p>
              <p className="text-sm text-green-700 mt-1">Próximamente</p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="font-semibold text-purple-900 mb-2">💰 Ventas del Mes</h3>
              <p className="text-3xl font-bold text-purple-600">$0</p>
              <p className="text-sm text-purple-700 mt-1">Próximamente</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
