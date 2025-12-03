'use client';

import { useAuth } from '@/app/context/AuthContext';
import { getFullName } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cooperativaApi, ChoferStats, getToken } from '@/lib/api';
import { 
  Bus, 
  Map, 
  Calendar, 
  Star, 
  TrendingUp, 
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  Activity,
  ArrowRight,
  Bell
} from 'lucide-react';

export default function ChoferDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<ChoferStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.userId) {
        setLoading(false);
        return;
      }

      try {
        const token = getToken();
        if (!token) {
          setError('No se encontró token de autenticación');
          setLoading(false);
          return;
        }

        const data = await cooperativaApi.getChoferStats(user.userId, token);
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar estadísticas:', err);
        setError('No se pudieron cargar las estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando datos del chofer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-linear-to-r from-orange-600 to-orange-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Panel del Chofer
              </h1>
              <p className="text-orange-100 mt-2 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Bienvenido, {user ? getFullName(user) : 'Chofer'}
              </p>
            </div>
            {user?.cooperativaNombre && (
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-6 py-3 border border-white border-opacity-30">
                <p className="text-orange-100 text-xs uppercase tracking-wide">Cooperativa</p>
                <p className="text-white font-bold text-lg">
                  {user.cooperativaNombre}
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Principal - Contenido */}
          <div className="lg:col-span-2 space-y-6">
            {/* Viaje Actual Card */}
            {stats?.viajeActual ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-linear-to-r from-orange-500 to-orange-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Bus className="w-6 h-6" />
                    Viaje Actual
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Map className="w-4 h-4" />
                        Ruta
                      </p>
                      <p className="font-semibold text-gray-900 text-lg">
                        {stats.viajeActual.origen} → {stats.viajeActual.destino}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Hora de Salida
                      </p>
                      <p className="font-semibold text-gray-900 text-lg">
                        {stats.viajeActual.horaSalida}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Pasajeros
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 text-lg">
                          {stats.viajeActual.pasajerosConfirmados}/40
                        </p>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div 
                            className="bg-orange-500 h-2 rounded-full transition-all"
                            style={{ width: `${(stats.viajeActual.pasajerosConfirmados / 40) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Bus className="w-4 h-4" />
                        Bus Asignado
                      </p>
                      <p className="font-semibold text-gray-900 text-lg">
                        {stats.viajeActual.busPlaca}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                        stats.viajeActual.estado === 'en-curso'
                          ? 'bg-green-100 text-green-800'
                          : stats.viajeActual.estado === 'pendiente'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {stats.viajeActual.estado === 'en-curso' && (
                        <>
                          <Activity className="w-4 h-4" />
                          En Curso
                        </>
                      )}
                      {stats.viajeActual.estado === 'pendiente' && (
                        <>
                          <Clock className="w-4 h-4" />
                          Pendiente
                        </>
                      )}
                      {stats.viajeActual.estado === 'finalizado' && (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Finalizado
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay viaje asignado
                </h3>
                <p className="text-gray-600 text-sm">
                  Actualmente no tienes un viaje programado para hoy
                </p>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Viajes del Mes */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Este mes
                  </span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Viajes Realizados</h3>
                <p className="text-3xl font-bold text-gray-900">{stats?.viajesDelMes ?? 0}</p>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +12% vs mes anterior
                </p>
              </div>

              {/* Pasajeros Transportados */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                    Total
                  </span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Pasajeros</h3>
                <p className="text-3xl font-bold text-gray-900">{stats?.pasajerosTransportados ?? 0}</p>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Promedio: {stats?.pasajerosTransportados && stats?.viajesDelMes 
                    ? Math.round(stats.pasajerosTransportados / stats.viajesDelMes) 
                    : 0}/viaje
                </p>
              </div>

              {/* Calificación */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-600 fill-yellow-600" />
                  </div>
                  <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                    Promedio
                  </span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Calificación</h3>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.calificacion ? stats.calificacion.toFixed(1) : '0.0'}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.floor(stats?.calificacion ?? 0)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => router.push('/dashboard/Cooperativa/Chofer/mi-viaje')}
                className="bg-white hover:bg-orange-50 p-6 rounded-xl shadow-md border-2 border-transparent hover:border-orange-300 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-linear-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Bus className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900 text-sm">Mi Viaje del Día</h3>
                      <p className="text-xs text-gray-600">Ver detalles actuales</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                </div>
              </button>

              <button
                onClick={() => router.push('/dashboard/Cooperativa/Chofer/mis-rutas')}
                className="bg-white hover:bg-orange-50 p-6 rounded-xl shadow-md border-2 border-transparent hover:border-orange-300 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Map className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900 text-sm">Mis Rutas</h3>
                      <p className="text-xs text-gray-600">Ver todas las rutas</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </button>

              <button
                onClick={() => router.push('/dashboard/Cooperativa/Chofer/historial')}
                className="bg-white hover:bg-orange-50 p-6 rounded-xl shadow-md border-2 border-transparent hover:border-orange-300 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-linear-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900 text-sm">Historial de Viajes</h3>
                      <p className="text-xs text-gray-600">Revisar viajes pasados</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                </div>
              </button>

              <button
                onClick={() => router.push('/dashboard/Cooperativa/Chofer/calificaciones')}
                className="bg-white hover:bg-orange-50 p-6 rounded-xl shadow-md border-2 border-transparent hover:border-orange-300 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-linear-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900 text-sm">Mis Calificaciones</h3>
                      <p className="text-xs text-gray-600">Ver opiniones</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-yellow-600 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            </div>
          </div>

          {/* Columna Lateral - Notificaciones */}
          <div className="lg:col-span-1 space-y-6">
            {/* Notificaciones */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-600" />
                  Notificaciones
                </h2>
              </div>
              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {/* Notificación 1 */}
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Viaje programado para hoy
                      </p>
                      <p className="text-xs text-gray-600 mb-2">
                        Tu viaje a {stats?.viajeActual?.destino ?? 'Guayaquil'} está programado para las{' '}
                        {stats?.viajeActual?.horaSalida ?? '08:00 AM'}
                      </p>
                      <span className="text-xs text-orange-600 font-medium">Hace 2 horas</span>
                    </div>
                  </div>
                </div>

                {/* Notificación 2 */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Revisión de bus completada
                      </p>
                      <p className="text-xs text-gray-600 mb-2">
                        El bus {stats?.viajeActual?.busPlaca ?? 'A-123'} pasó la revisión técnica
                      </p>
                      <span className="text-xs text-blue-600 font-medium">Ayer</span>
                    </div>
                  </div>
                </div>

                {/* Notificación 3 */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Excelente calificación
                      </p>
                      <p className="text-xs text-gray-600 mb-2">
                        Recibiste una calificación de 5 estrellas en tu último viaje
                      </p>
                      <span className="text-xs text-green-600 font-medium">Hace 3 días</span>
                    </div>
                  </div>
                </div>

                {/* Notificación 4 */}
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Recordatorio de mantenimiento
                      </p>
                      <p className="text-xs text-gray-600 mb-2">
                        El próximo mantenimiento está programado para el 15 de diciembre
                      </p>
                      <span className="text-xs text-yellow-600 font-medium">Hace 1 semana</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips Rápidos */}
            <div className="bg-linear-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-600" />
                Consejo del día
              </h3>
              <p className="text-sm text-gray-700">
                Mantén una velocidad constante y evita frenadas bruscas para garantizar 
                la comodidad de tus pasajeros y mejorar tu calificación.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
