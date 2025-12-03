'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useConfig } from '@/app/context/ConfigContext';
import { getFullName } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { superAdminApi, type SuperAdminStats, type CooperativaInfo, getToken } from '@/lib/api';
import { 
  Building2,
  Bus,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Activity,
  ArrowRight,
  Bell,
  Eye
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { config } = useConfig();
  const router = useRouter();
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [cooperativas, setCooperativas] = useState<CooperativaInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Colores dinámicos
  const primaryColor = config?.colorPrimario || '#2563eb';
  const secondaryColor = config?.colorSecundario || '#3b82f6';
  const accentColor = config?.colorAcento || '#10b981';
  const appName = config?.nombreAplicacion || 'AndinaBus Platform';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      const [statsData, cooperativasData] = await Promise.all([
        superAdminApi.getStats(token),
        superAdminApi.getAllCooperativas(token),
      ]);

      setStats(statsData);
      setCooperativas(cooperativasData.slice(0, 5)); // Top 5 cooperativas
    } catch (err: unknown) {
      console.error('Error al cargar datos del dashboard:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto mb-4"
            style={{ borderColor: primaryColor }}
          ></div>
          <p className="text-gray-600 font-medium">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header 
        className="shadow-lg"
        style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              {/* Logo */}
              {config?.logoUrl && (
                <div className="bg-white rounded-xl p-2 shadow-lg">
                  <img 
                    src={config.logoUrl} 
                    alt={appName} 
                    className="h-14 w-auto object-contain"
                  />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Activity className="w-8 h-8" />
                  Panel de Control Global
                </h1>
                <p className="text-white/80 mt-2">
                  Bienvenido, {user ? getFullName(user) : 'Super Administrador'}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg px-6 py-3 shadow-lg">
              <p className="text-xs uppercase tracking-wide font-medium" style={{ color: primaryColor }}>Sistema</p>
              <p className="text-gray-900 font-bold text-lg">{appName}</p>
            </div>
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
          {/* Columna Principal - Estadísticas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards - Fila 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Cooperativas */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <Building2 className="w-6 h-6" style={{ color: primaryColor }} />
                  </div>
                  <span 
                    className="text-xs font-medium px-2 py-1 rounded"
                    style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
                  >
                    Total
                  </span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Cooperativas</h3>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalCooperativas ?? 0}</p>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" style={{ color: accentColor }} />
                  {stats?.cooperativasActivas ?? 0} activas
                </p>
              </div>

              {/* Buses */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    <Bus className="w-6 h-6" style={{ color: accentColor }} />
                  </div>
                  <span 
                    className="text-xs font-medium px-2 py-1 rounded"
                    style={{ backgroundColor: `${accentColor}10`, color: accentColor }}
                  >
                    Flota
                  </span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Buses</h3>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalBuses ?? 0}</p>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Activity className="w-3 h-3" style={{ color: accentColor }} />
                  {stats?.busesActivos ?? 0} en servicio
                </p>
              </div>

              {/* Usuarios */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                    Total
                  </span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Usuarios</h3>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalUsuarios ?? 0}</p>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {stats?.usuariosActivos ?? 0} activos
                </p>
              </div>
            </div>

            {/* Stats Cards - Fila 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Ventas Hoy */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    Hoy
                  </span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Ventas</h3>
                <p className="text-3xl font-bold text-gray-900">
                  ${stats?.ventasTotalesHoy ? stats.ventasTotalesHoy.toFixed(2) : '0.00'}
                </p>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Ingresos del día
                </p>
              </div>

              {/* Viajes Hoy */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                  </div>
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                    Hoy
                  </span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Viajes</h3>
                <p className="text-3xl font-bold text-gray-900">{stats?.viajesHoy ?? 0}</p>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Viajes programados
                </p>
              </div>

              {/* Reservas Pendientes */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                    Pendientes
                  </span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Reservas</h3>
                <p className="text-3xl font-bold text-gray-900">{stats?.reservasPendientes ?? 0}</p>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Esperando confirmación
                </p>
              </div>
            </div>

            {/* Cooperativas Destacadas */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5" style={{ color: primaryColor }} />
                  Cooperativas Principales
                </h2>
                <button
                  onClick={() => router.push('/dashboard/Admin/cooperativas')}
                  className="text-sm font-medium flex items-center gap-1 hover:opacity-80"
                  style={{ color: primaryColor }}
                >
                  Ver todas
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                {cooperativas.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No hay cooperativas registradas</p>
                ) : (
                  <div className="space-y-3">
                    {cooperativas.map((coop) => (
                      <div
                        key={coop.id}
                        onClick={() => router.push(`/dashboard/Admin/cooperativas/${coop.id}`)}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer transition-all group"
                        style={{ ['--hover-bg' as string]: `${primaryColor}10` }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}10`}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors"
                            style={{ backgroundColor: `${primaryColor}20` }}
                          >
                            <Building2 className="w-6 h-6" style={{ color: primaryColor }} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 group-hover:opacity-80 transition-colors">
                              {coop.nombre}
                            </h3>
                            <p className="text-xs text-gray-500">RUC: {coop.ruc}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 mr-4">
                          <div className="text-center">
                            <p className="text-lg font-bold" style={{ color: primaryColor }}>{coop.cantidadBuses}</p>
                            <p className="text-xs text-gray-500">Buses</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-purple-600">{coop.cantidadPersonal}</p>
                            <p className="text-xs text-gray-500">Personal</p>
                          </div>
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              coop.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {coop.activo ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                        <Eye className="w-5 h-5 text-gray-400 group-hover:opacity-80 transition-colors" style={{ ['--hover-color' as string]: primaryColor }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Accesos Rápidos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => router.push('/dashboard/Admin/cooperativas')}
                className="bg-white hover:shadow-lg p-6 rounded-xl shadow-md border-2 border-transparent transition-all group"
                onMouseEnter={(e) => e.currentTarget.style.borderColor = primaryColor}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                      style={{ background: `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor})` }}
                    >
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900 text-sm">Gestión de Cooperativas</h3>
                      <p className="text-xs text-gray-600">Administrar cooperativas</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-all" style={{ color: primaryColor }} />
                </div>
              </button>

              <button
                onClick={() => router.push('/dashboard/Admin/rutas')}
                className="bg-white hover:shadow-lg p-6 rounded-xl shadow-md border-2 border-transparent transition-all group"
                onMouseEnter={(e) => e.currentTarget.style.borderColor = accentColor}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                      style={{ background: `linear-gradient(to bottom right, ${accentColor}, ${accentColor}dd)` }}
                    >
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900 text-sm">Gestión de Rutas</h3>
                      <p className="text-xs text-gray-600">Administrar rutas ANT</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-all" style={{ color: accentColor }} />
                </div>
              </button>
            </div>
          </div>

          {/* Columna Lateral - Notificaciones y Actividad */}
          <div className="lg:col-span-1 space-y-6">
            {/* Notificaciones */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="w-5 h-5" style={{ color: primaryColor }} />
                  Notificaciones
                </h2>
              </div>
              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {/* Notificación 1 */}
                <div 
                  className="rounded-lg p-4 border"
                  style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}30` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: primaryColor }}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Nueva cooperativa registrada
                      </p>
                      <p className="text-xs text-gray-600 mb-2">
                        Se ha registrado una nueva cooperativa en el sistema
                      </p>
                      <span className="text-xs font-medium" style={{ color: primaryColor }}>Hace 2 horas</span>
                    </div>
                  </div>
                </div>

                {/* Notificación 2 */}
                <div 
                  className="rounded-lg p-4 border"
                  style={{ backgroundColor: `${accentColor}10`, borderColor: `${accentColor}30` }}
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: accentColor }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Sistema operando normalmente
                      </p>
                      <p className="text-xs text-gray-600 mb-2">
                        Todas las cooperativas están funcionando correctamente
                      </p>
                      <span className="text-xs font-medium" style={{ color: accentColor }}>Hace 5 horas</span>
                    </div>
                  </div>
                </div>

                {/* Notificación 3 */}
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Actualización programada
                      </p>
                      <p className="text-xs text-gray-600 mb-2">
                        Mantenimiento del sistema programado para el 15 de diciembre
                      </p>
                      <span className="text-xs text-yellow-600 font-medium">Hace 1 día</span>
                    </div>
                  </div>
                </div>

                {/* Notificación 4 */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-start gap-3">
                    <Activity className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Reporte mensual disponible
                      </p>
                      <p className="text-xs text-gray-600 mb-2">
                        El reporte de actividad de noviembre está listo para revisión
                      </p>
                      <span className="text-xs text-purple-600 font-medium">Hace 2 días</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas Rápidas */}
            <div 
              className="rounded-xl p-6 border"
              style={{ 
                background: `linear-gradient(to bottom right, ${primaryColor}10, ${primaryColor}20)`,
                borderColor: `${primaryColor}30`
              }}
            >
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5" style={{ color: primaryColor }} />
                Resumen del Sistema
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Uptime del sistema</span>
                  <span className="text-sm font-bold" style={{ color: primaryColor }}>99.9%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Solicitudes/minuto</span>
                  <span className="text-sm font-bold" style={{ color: primaryColor }}>~150</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Tiempo de respuesta</span>
                  <span className="text-sm font-bold" style={{ color: primaryColor }}>120ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
