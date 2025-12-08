'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useCooperativaConfig } from '@/app/context/CooperativaConfigContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { cooperativaApi, notificacionViajeApi, reservasApi, AdminStats, NotificacionViaje, ReservaCooperativaDto, getToken } from '@/lib/api';
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
  Building2,
  PlayCircle,
  StopCircle,
  XCircle,
  RefreshCw,
  Ticket,
  CreditCard
} from 'lucide-react';

// Tipo para notificaciones de compra de boleto
interface NotificacionCompra {
  id: string;
  reservaId: number;
  clienteEmail: string;
  asientos: number;
  monto: number;
  origen?: string;
  destino?: string;
  busPlaca?: string;
  timestamp: Date;
  leida: boolean;
}

export default function CooperativaAdminDashboardPage() {
  const { user } = useAuth();
  const { styles } = useCooperativaConfig();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificaciones, setNotificaciones] = useState<NotificacionViaje[]>([]);
  const [loadingNotificaciones, setLoadingNotificaciones] = useState(true);
  const [notificacionesCompra, setNotificacionesCompra] = useState<NotificacionCompra[]>([]);
  const reservasAnterioresRef = useRef<Set<number>>(new Set());
  const primeraConsultaRef = useRef(true);

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

  // Cargar reservas y detectar nuevas compras
  useEffect(() => {
    const fetchReservas = async () => {
      if (!user?.cooperativaId) return;

      try {
        const token = getToken();
        if (!token) return;

        // Obtener todas las reservas de la cooperativa (sin filtro de estado para detectar todas)
        const reservas = await reservasApi.obtenerPorCooperativa(user.cooperativaId, undefined, token);
        
        // Filtrar solo las que son PAGADO o PENDIENTE (compras activas)
        const reservasActivas = reservas.filter(r => r.estado === 'PAGADO' || r.estado === 'PENDIENTE');
        console.log('Reservas activas encontradas:', reservasActivas.length, reservasActivas);
        
        // En la primera consulta, mostrar todas las reservas activas como notificaciones
        if (primeraConsultaRef.current) {
          const notificacionesIniciales: NotificacionCompra[] = reservasActivas.map(reserva => ({
            id: `compra-${reserva.id}-${Date.now()}`,
            reservaId: reserva.id,
            clienteEmail: reserva.clienteEmail,
            asientos: reserva.asientos,
            monto: reserva.monto,
            origen: reserva.origen,
            destino: reserva.destino,
            busPlaca: reserva.busPlaca,
            timestamp: new Date(),
            leida: false
          }));
          
          if (notificacionesIniciales.length > 0) {
            setNotificacionesCompra(notificacionesIniciales.slice(0, 30));
          }
          
          // Guardar las reservas actuales para futuras comparaciones
          reservasActivas.forEach(r => reservasAnterioresRef.current.add(r.id));
          primeraConsultaRef.current = false;
        } else {
          // En consultas posteriores, detectar solo las nuevas
          const nuevasNotificaciones: NotificacionCompra[] = [];
          reservasActivas.forEach(reserva => {
            if (!reservasAnterioresRef.current.has(reserva.id)) {
              console.log('Nueva reserva detectada:', reserva);
              nuevasNotificaciones.push({
                id: `compra-${reserva.id}-${Date.now()}`,
                reservaId: reserva.id,
                clienteEmail: reserva.clienteEmail,
                asientos: reserva.asientos,
                monto: reserva.monto,
                origen: reserva.origen,
                destino: reserva.destino,
                busPlaca: reserva.busPlaca,
                timestamp: new Date(),
                leida: false
              });
              reservasAnterioresRef.current.add(reserva.id);
            }
          });

          if (nuevasNotificaciones.length > 0) {
            setNotificacionesCompra(prev => [...nuevasNotificaciones, ...prev].slice(0, 30));
            
            // Reproducir sonido de notificación solo para nuevas compras
            try {
              const audio = new Audio('/notification.mp3');
              audio.volume = 0.5;
              audio.play().catch(() => {});
            } catch {}
          }
        }
      } catch (err) {
        console.error('Error al cargar reservas:', err);
      }
    };

    fetchReservas();
    
    // Actualizar reservas cada 20 segundos
    const interval = setInterval(fetchReservas, 20000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const fetchNotificaciones = async () => {
      if (!user?.cooperativaId) {
        setLoadingNotificaciones(false);
        return;
      }

      try {
        const token = getToken();
        if (!token) {
          setLoadingNotificaciones(false);
          return;
        }

        const data = await notificacionViajeApi.getNotificaciones(user.cooperativaId, false, token);
        setNotificaciones(data);
      } catch (err) {
        console.error('Error al cargar notificaciones:', err);
      } finally {
        setLoadingNotificaciones(false);
      }
    };

    fetchNotificaciones();
    
    // Actualizar notificaciones cada 30 segundos
    const interval = setInterval(fetchNotificaciones, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Marcar notificación de compra como leída
  const marcarCompraLeida = (id: string) => {
    setNotificacionesCompra(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
  };

  // Marcar todas las notificaciones de compra como leídas
  const marcarTodasComprasLeidas = () => {
    setNotificacionesCompra(prev => prev.map(n => ({ ...n, leida: true })));
  };

  // Contar notificaciones de compra sin leer
  const comprasSinLeer = notificacionesCompra.filter(n => !n.leida).length;

  // Función para refrescar notificaciones manualmente
  const refrescarNotificaciones = async () => {
    if (!user?.cooperativaId) return;
    
    setLoadingNotificaciones(true);
    try {
      const token = getToken();
      if (token) {
        const data = await notificacionViajeApi.getNotificaciones(user.cooperativaId, false, token);
        setNotificaciones(data);
      }
    } catch (err) {
      console.error('Error al refrescar notificaciones:', err);
    } finally {
      setLoadingNotificaciones(false);
    }
  };

  // Helper para obtener el icono según el tipo de notificación
  const getNotificacionIcon = (tipo: string) => {
    switch (tipo) {
      case 'VIAJE_INICIADO':
        return PlayCircle;
      case 'VIAJE_FINALIZADO':
        return CheckCircle;
      case 'VIAJE_CANCELADO':
        return XCircle;
      case 'ALERTA_RETRASO':
        return AlertCircle;
      default:
        return Bell;
    }
  };

  // Helper para obtener las clases de color según el tipo
  const getNotificacionColorClasses = (tipo: string) => {
    switch (tipo) {
      case 'VIAJE_INICIADO':
        return 'bg-green-50 border-green-200 text-green-600';
      case 'VIAJE_FINALIZADO':
        return 'bg-blue-50 border-blue-200 text-blue-600';
      case 'VIAJE_CANCELADO':
        return 'bg-red-50 border-red-200 text-red-600';
      case 'ALERTA_RETRASO':
        return 'bg-yellow-50 border-yellow-200 text-yellow-600';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  // Helper para formatear tiempo relativo
  const formatearTiempoRelativo = (fecha: string) => {
    const ahora = new Date();
    const fechaNotif = new Date(fecha);
    const diffMs = ahora.getTime() - fechaNotif.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHoras < 24) return `Hace ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    return `Hace ${diffDias} día${diffDias > 1 ? 's' : ''}`;
  };

  // Helper para formatear tiempo de compra (desde Date)
  const formatearTiempoCompra = (fecha: Date): string => {
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();
    const segundos = Math.floor(diferencia / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    
    if (segundos < 60) return 'Ahora mismo';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    return fecha.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificaciones
              {(notificaciones.filter(n => !n.leida).length + comprasSinLeer) > 0 && (
                <span 
                  className="text-xs px-2 py-0.5 rounded-full text-white animate-pulse"
                  style={{ backgroundColor: styles.primary }}
                >
                  {notificaciones.filter(n => !n.leida).length + comprasSinLeer}
                </span>
              )}
            </h2>
            <button
              onClick={refrescarNotificaciones}
              disabled={loadingNotificaciones}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="Refrescar notificaciones"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${loadingNotificaciones ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4 max-h-[500px] overflow-y-auto">
            
            {/* Sección de compras de boletos */}
            {notificacionesCompra.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Ticket className="w-4 h-4" style={{ color: styles.primary }} />
                    Compras Recientes
                    {comprasSinLeer > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                        {comprasSinLeer} nueva{comprasSinLeer > 1 ? 's' : ''}
                      </span>
                    )}
                  </h3>
                  {comprasSinLeer > 0 && (
                    <button
                      onClick={marcarTodasComprasLeidas}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      Marcar leídas
                    </button>
                  )}
                </div>
                
                {notificacionesCompra.slice(0, 5).map((compra) => (
                  <div 
                    key={compra.id}
                    onClick={() => marcarCompraLeida(compra.id)}
                    className={`rounded-lg p-3 border-2 cursor-pointer transition-all hover:shadow-md ${
                      compra.leida 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-green-50 border-green-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`shrink-0 p-1.5 rounded-full ${compra.leida ? 'bg-gray-200' : 'bg-green-200'}`}>
                        <CreditCard className={`w-4 h-4 ${compra.leida ? 'text-gray-500' : 'text-green-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`text-sm font-semibold ${compra.leida ? 'text-gray-700' : 'text-green-800'}`}>
                            🎫 Nueva venta de boleto
                          </p>
                          {!compra.leida && (
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs text-gray-600 truncate">
                            <span className="font-medium">Cliente:</span> {compra.clienteEmail}
                          </p>
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Ruta:</span> {compra.origen} → {compra.destino}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-600">
                              <span className="font-medium">Asientos:</span>{' '}
                              <span 
                                className="px-1.5 py-0.5 rounded text-white text-xs font-bold"
                                style={{ backgroundColor: styles.primary }}
                              >
                                {compra.asientos}
                              </span>
                            </span>
                            <span className="text-xs text-gray-600">
                              <span className="font-medium">Monto:</span>{' '}
                              <span className="font-bold text-green-700">${compra.monto.toFixed(2)}</span>
                            </span>
                          </div>
                          {compra.busPlaca && (
                            <p className="text-xs text-gray-500">
                              Bus: {compra.busPlaca}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs font-medium mt-1 block ${compra.leida ? 'text-gray-400' : 'text-green-600'}`}>
                          {formatearTiempoCompra(compra.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {notificacionesCompra.length > 5 && (
                  <p className="text-xs text-center text-gray-400">
                    +{notificacionesCompra.length - 5} compras más
                  </p>
                )}

                <div className="border-t border-gray-200 my-2"></div>
              </>
            )}

            {/* Sección de notificaciones de viajes */}
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: styles.primary }} />
              Actividad de Viajes
            </h3>
            
            {loadingNotificaciones ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: styles.primary }}></div>
                <p className="mt-2 text-sm text-gray-500">Cargando notificaciones...</p>
              </div>
            ) : notificaciones.length === 0 && notificacionesCompra.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No hay notificaciones</p>
                <p className="text-xs text-gray-400 mt-1">Las notificaciones aparecerán aquí</p>
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="text-center py-4 text-gray-400">
                <p className="text-xs">No hay actividad de viajes reciente</p>
              </div>
            ) : (
              notificaciones.slice(0, 5).map((notif) => {
                const Icon = getNotificacionIcon(notif.tipo);
                const colorClasses = getNotificacionColorClasses(notif.tipo);

                return (
                  <div 
                    key={notif.id} 
                    className={`border-2 rounded-lg p-3 ${colorClasses} ${!notif.leida ? 'shadow-md' : 'opacity-75'}`}
                    style={!notif.leida ? { borderColor: styles.primary } : {}}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-gray-900 mb-0.5">
                            {notif.titulo}
                          </p>
                          {!notif.leida && (
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{notif.mensaje}</p>
                        {notif.detalleViaje && (
                          <p className="text-xs text-gray-500 mb-1 italic">{notif.detalleViaje}</p>
                        )}
                        <p className="text-xs text-gray-500">{formatearTiempoRelativo(notif.fechaCreacion)}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {notificaciones.length > 5 && (
            <button 
              className="w-full mt-4 text-center text-sm font-medium transition-colors"
              style={{ color: styles.primary }}
              onMouseEnter={(e) => e.currentTarget.style.color = styles.primaryDark}
              onMouseLeave={(e) => e.currentTarget.style.color = styles.primary}
            >
              Ver todas las notificaciones ({notificaciones.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
