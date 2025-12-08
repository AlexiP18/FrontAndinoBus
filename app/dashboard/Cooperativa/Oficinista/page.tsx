'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cooperativaApi, OficinistaStats, getToken, cooperativaConfigApi, CooperativaConfigResponse } from '@/lib/api';
import { 
  Ticket, 
  Calendar,
  DollarSign,
  Bus,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Bell,
  History
} from 'lucide-react';

export default function OficinistaDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<OficinistaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<CooperativaConfigResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.cooperativaId) {
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

        const [statsData, configData] = await Promise.all([
          cooperativaApi.getOficinistaStats(user.cooperativaId, token),
          cooperativaConfigApi.getConfiguracion(user.cooperativaId, token).catch(() => null)
        ]);
        
        setStats(statsData);
        setConfig(configData);
        setError(null);
      } catch (err) {
        console.error('Error al cargar estadísticas:', err);
        setError('No se pudieron cargar las estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Colores institucionales
  const primaryColor = config?.colorPrimario || '#7c3aed';

  // Notificaciones simuladas
  const notificaciones = [
    {
      id: 1,
      tipo: 'info',
      titulo: 'Nuevo viaje disponible',
      mensaje: 'Bus #15 listo para ventas - Quito-Guayaquil 14:30',
      tiempo: 'Hace 10 min',
      icono: Bus,
    },
    {
      id: 2,
      tipo: 'success',
      titulo: 'Reserva confirmada',
      mensaje: 'Cliente Juan Pérez confirmó reserva #2045',
      tiempo: 'Hace 25 min',
      icono: CheckCircle,
    },
    {
      id: 3,
      tipo: 'warning',
      titulo: 'Reserva por expirar',
      mensaje: 'Reserva #2039 expira en 15 minutos',
      tiempo: 'Hace 45 min',
      icono: Clock,
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Dashboard de Ventas
        </h1>
        <p className="text-gray-600">
          Gestiona las ventas y reservas de tu turno
        </p>
      </div>

      {/* Cards de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
              style={{ borderColor: primaryColor }}
            ></div>
            <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
          </div>
        ) : error ? (
          <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </p>
          </div>
        ) : stats ? (
          <>
            {/* Card: Boletos Vendidos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Boletos Vendidos</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.boletosVendidosHoy}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    <span className="text-blue-600 font-medium">Hoy</span>
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Card: Recaudado */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Recaudado Hoy</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ${stats.recaudadoHoy.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    <span className="text-green-600 font-medium">↑ Efectivo + Tarjeta</span>
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Card: Reservas Pendientes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Reservas Pendientes</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.reservasPendientes}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    <span className="text-orange-600 font-medium">Por confirmar</span>
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Card: Viajes Programados */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Viajes Programados</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.viajesProgramados}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    <span className="text-purple-600 font-medium">Para hoy</span>
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Bus className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Sección de Acciones Rápidas y Notificaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Acciones Rápidas */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/dashboard/Cooperativa/Oficinista/vender-boleto')}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-all group"
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = primaryColor + '80')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <Ticket className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Vender Boleto</h3>
              <p className="text-sm text-gray-600">Venta presencial con selección de asientos</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/Cooperativa/Oficinista/reservas')}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-all group"
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = primaryColor + '80')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
            >
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Gestionar Reservas</h3>
              <p className="text-sm text-gray-600">Confirmar, modificar o cancelar reservas</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/Cooperativa/Oficinista/buses-viaje')}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-all group"
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = primaryColor + '80')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <Bus className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Buses en Viaje</h3>
              <p className="text-sm text-gray-600">Monitoreo en tiempo real</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/Cooperativa/Oficinista/viajes-pasados')}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-all group"
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = primaryColor + '80')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors"
                style={{ backgroundColor: primaryColor + '20' }}
              >
                <History className="w-6 h-6" style={{ color: primaryColor }} />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Viajes Pasados</h3>
              <p className="text-sm text-gray-600">Historial con mapas y pasajeros</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/Cooperativa/Oficinista/mis-ventas')}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-all group"
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = primaryColor + '80')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Mis Ventas</h3>
              <p className="text-sm text-gray-600">Historial y estadísticas</p>
            </button>
          </div>
        </div>

        {/* Panel de Notificaciones */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" style={{ color: primaryColor }} />
            Notificaciones
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4 max-h-96 overflow-y-auto">
            {notificaciones.map((notif) => {
              const Icon = notif.icono;
              const colorClasses = {
                info: 'bg-blue-50 border-blue-200 text-blue-600',
                success: 'bg-green-50 border-green-200 text-green-600',
                warning: 'bg-yellow-50 border-yellow-200 text-yellow-600',
              }[notif.tipo];

              return (
                <div key={notif.id} className={`border rounded-lg p-3 ${colorClasses}`}>
                  <div className="flex items-start gap-3">
                    <div className="shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 mb-0.5">
                        {notif.titulo}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">{notif.mensaje}</p>
                      <p className="text-xs text-gray-500">{notif.tiempo}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button 
            className="w-full mt-4 text-center text-sm font-medium hover:underline"
            style={{ color: primaryColor }}
          >
            Ver todas las notificaciones
          </button>
        </div>
      </div>
    </div>
  );
}
