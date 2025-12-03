'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useCooperativaConfig } from '@/app/context/CooperativaConfigContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cooperativaApi, AdminStats, getToken } from '@/lib/api';
import { 
  Bus, 
  Users, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Bell,
  Building2
} from 'lucide-react';

export default function CooperativaAdminDashboardPage() {
  const { user } = useAuth();
  const { styles } = useCooperativaConfig();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
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

        const data = await cooperativaApi.getAdminStats(user.cooperativaId, token);
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

  // Notificaciones simuladas (puedes reemplazar con datos reales del backend)
  const notificaciones = [
    {
      id: 1,
      tipo: 'info',
      titulo: 'Nuevo viaje programado',
      mensaje: 'Bus #15 programado para ruta Quito-Guayaquil a las 14:30',
      tiempo: 'Hace 5 min',
      icono: Calendar,
    },
    {
      id: 2,
      tipo: 'success',
      titulo: 'Mantenimiento completado',
      mensaje: 'Bus #08 ha completado su mantenimiento preventivo',
      tiempo: 'Hace 1 hora',
      icono: CheckCircle,
    },
    {
      id: 3,
      tipo: 'warning',
      titulo: 'Combustible bajo',
      mensaje: 'Bus #22 requiere reabastecimiento antes del próximo viaje',
      tiempo: 'Hace 2 horas',
      icono: AlertCircle,
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Dashboard Principal
        </h1>
        <p className="text-gray-600">
          Bienvenido de nuevo, {user?.nombres || 'Administrador'}
        </p>
      </div>

      {/* Cards de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: styles.primary }}></div>
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
            {/* Card: Buses Activos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Buses Activos</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.busesActivos}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    <span className="font-medium" style={{ color: styles.primary }}>En operación</span>
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bus className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Card: Personal */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Personal Activo</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalPersonal}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {stats.choferes} Choferes • {stats.oficinistas} Oficinistas
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Card: Ventas Hoy */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Ventas Hoy</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ${stats.ventasHoy.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    <span className="font-medium" style={{ color: styles.primary }}>↑ 12%</span> vs ayer
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Card: Viajes Hoy */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Viajes Hoy</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.viajesHoy}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    <span className="text-blue-600 font-medium">En curso</span>
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-orange-600" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/dashboard/Cooperativa/Admin/buses')}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-all group"
              style={{ '--hover-border': styles.primary } as React.CSSProperties}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = styles.primary}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors"
                style={{ backgroundColor: styles.primaryLighter }}
              >
                <Bus className="w-6 h-6" style={{ color: styles.primary }} />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Gestión de Buses</h3>
              <p className="text-sm text-gray-600">Administrar flota y layouts de asientos</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/Cooperativa/Admin/personal')}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-all group"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = styles.primary}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors"
                style={{ backgroundColor: styles.primaryLighter }}
              >
                <Users className="w-6 h-6" style={{ color: styles.primary }} />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Personal</h3>
              <p className="text-sm text-gray-600">Oficinistas, choferes y roles</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/Cooperativa/Admin/frecuencias')}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-all group"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = styles.primary}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors"
                style={{ backgroundColor: styles.primaryLighter }}
              >
                <Clock className="w-6 h-6" style={{ color: styles.primary }} />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Frecuencias</h3>
              <p className="text-sm text-gray-600">Horarios y rutas programadas</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/Cooperativa/Admin/reportes')}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-all group"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = styles.primary}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors"
                style={{ backgroundColor: styles.primaryLighter }}
              >
                <TrendingUp className="w-6 h-6" style={{ color: styles.primary }} />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Reportes</h3>
              <p className="text-sm text-gray-600">Estadísticas y análisis de ventas</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/Cooperativa/Admin/terminales')}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-all group"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = styles.primary}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors"
                style={{ backgroundColor: styles.primaryLighter }}
              >
                <Building2 className="w-6 h-6" style={{ color: styles.primary }} />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Terminales</h3>
              <p className="text-sm text-gray-600">Gestionar terminales donde opera la cooperativa</p>
            </button>
          </div>
        </div>

        {/* Panel de Notificaciones */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
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
                    <div className="flex-shrink-0">
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
            className="w-full mt-4 text-center text-sm font-medium transition-colors"
            style={{ color: styles.primary }}
            onMouseEnter={(e) => e.currentTarget.style.color = styles.primaryDark}
            onMouseLeave={(e) => e.currentTarget.style.color = styles.primary}
          >
            Ver todas las notificaciones
          </button>
        </div>
      </div>
    </div>
  );
}
