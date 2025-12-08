'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { 
  viajesApi, 
  ViajeDisponible,
  ViajeDetalle,
  getToken, 
  cooperativaConfigApi, 
  CooperativaConfigResponse 
} from '@/lib/api';
import { 
  History, 
  Calendar,
  Bus, 
  MapPin, 
  Users, 
  Clock, 
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Eye,
  X,
  Navigation,
  User
} from 'lucide-react';
import MapaTrackingViaje from '@/app/components/MapaTrackingViaje';

export default function ViajesPasadosPage() {
  const { user } = useAuth();
  const [viajes, setViajes] = useState<ViajeDisponible[]>([]);
  const [viajeSeleccionado, setViajeSeleccionado] = useState<ViajeDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<CooperativaConfigResponse | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(() => {
    // Por defecto, mostrar ayer
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    return ayer.toISOString().split('T')[0];
  });
  const [showModal, setShowModal] = useState(false);

  // Cargar configuración y viajes
  useEffect(() => {
    if (user?.cooperativaId) {
      loadConfig();
    }
  }, [user?.cooperativaId]);

  // Cargar viajes cuando cambie la fecha
  useEffect(() => {
    if (user?.cooperativaId && fechaSeleccionada) {
      loadViajes();
    }
  }, [user?.cooperativaId, fechaSeleccionada]);

  const loadConfig = async () => {
    try {
      const token = getToken();
      if (!token || !user?.cooperativaId) return;

      const configuracion = await cooperativaConfigApi.getConfiguracion(user.cooperativaId, token);
      setConfig(configuracion);
    } catch (err) {
      console.error('Error loading config:', err);
    }
  };

  const loadViajes = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token || !user?.cooperativaId) return;

      const data = await viajesApi.getByCooperativaAndFecha(user.cooperativaId, fechaSeleccionada, token);
      // Filtrar solo viajes completados o finalizados
      const viajesPasados = data.filter(v => 
        v.estado === 'COMPLETADO' || 
        v.estado === 'FINALIZADO' ||
        v.estado === 'CANCELADO'
      );
      setViajes(viajesPasados);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar viajes');
    } finally {
      setLoading(false);
    }
  };

  const loadViajeDetalle = async (viajeId: number) => {
    setLoadingDetalle(true);
    try {
      const token = getToken();
      if (!token || !user?.cooperativaId) return;

      const detalle = await viajesApi.getById(user.cooperativaId, viajeId, token);
      setViajeSeleccionado(detalle);
      setShowModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar detalle del viaje');
    } finally {
      setLoadingDetalle(false);
    }
  };

  const cambiarFecha = (dias: number) => {
    const fecha = new Date(fechaSeleccionada);
    fecha.setDate(fecha.getDate() + dias);
    
    // No permitir fechas futuras a hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fecha > hoy) return;
    
    setFechaSeleccionada(fecha.toISOString().split('T')[0]);
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'COMPLETADO':
      case 'FINALIZADO':
        return 'bg-green-100 text-green-700';
      case 'CANCELADO':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getOcupacion = (viaje: ViajeDisponible) => {
    const ocupados = viaje.capacidadTotal - viaje.asientosDisponibles;
    return Math.round((ocupados / viaje.capacidadTotal) * 100);
  };

  const primaryColor = config?.colorPrimario || '#7c3aed';

  if (loading && viajes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: primaryColor }}
          ></div>
          <p className="text-gray-600">Cargando viajes pasados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <History className="w-8 h-8" style={{ color: primaryColor }} />
            Historial de Viajes
          </h1>
          <p className="text-gray-500 mt-1">
            Visualiza viajes completados con información de pasajeros y recorrido
          </p>
        </div>
      </div>

      {/* Selector de fecha */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => cambiarFecha(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Día anterior"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-800 capitalize">
                {formatFecha(fechaSeleccionada)}
              </p>
              <input
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="text-sm text-gray-500 border-0 bg-transparent text-center cursor-pointer hover:text-gray-700"
              />
            </div>
          </div>

          <button
            onClick={() => cambiarFecha(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={fechaSeleccionada >= new Date().toISOString().split('T')[0]}
            title="Día siguiente"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Lista de viajes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div 
          className="p-4 border-b border-gray-200"
          style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)` }}
        >
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Bus className="w-5 h-5" style={{ color: primaryColor }} />
            Viajes del Día
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-700">
              {viajes.length} viajes
            </span>
          </h2>
        </div>

        {viajes.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No hay viajes para esta fecha</p>
            <p className="text-sm">Selecciona otra fecha para ver el historial de viajes</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {viajes.map(viaje => {
              const ocupacion = getOcupacion(viaje);
              const pasajeros = viaje.capacidadTotal - viaje.asientosDisponibles;
              
              return (
                <div
                  key={viaje.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span 
                          className="text-lg font-bold"
                          style={{ color: primaryColor }}
                        >
                          🚌 {viaje.busPlaca}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(viaje.estado)}`}>
                          {viaje.estado}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{viaje.origen}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <span>{viaje.destino}</span>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Salida: {viaje.horaSalida}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {pasajeros} / {viaje.capacidadTotal} pasajeros
                        </span>
                        <span className="flex items-center gap-1">
                          <div 
                            className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden"
                          >
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${ocupacion}%`,
                                backgroundColor: ocupacion > 80 ? '#ef4444' : ocupacion > 50 ? '#f59e0b' : '#22c55e'
                              }}
                            />
                          </div>
                          {ocupacion}% ocupación
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => loadViajeDetalle(viaje.id)}
                      disabled={loadingDetalle}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors hover:bg-gray-100"
                      style={{ borderColor: primaryColor, color: primaryColor }}
                    >
                      <Eye className="w-4 h-4" />
                      Ver Detalles
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de detalle del viaje */}
      {showModal && viajeSeleccionado && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header del modal */}
            <div 
              className="p-6 flex items-center justify-between"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
            >
              <div className="text-white">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <Bus className="w-6 h-6" />
                  Viaje #{viajeSeleccionado.id}
                </h2>
                <p className="text-white/80 mt-1">
                  {viajeSeleccionado.origen} → {viajeSeleccionado.destino}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setViajeSeleccionado(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Información del viaje */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Navigation className="w-5 h-5" style={{ color: primaryColor }} />
                  Información del Viaje
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Bus</p>
                    <p className="font-semibold text-gray-800">{viajeSeleccionado.busPlaca}</p>
                    <p className="text-xs text-gray-500">{viajeSeleccionado.busMarca}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Fecha</p>
                    <p className="font-semibold text-gray-800">{viajeSeleccionado.fecha}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Hora Salida</p>
                    <p className="font-semibold text-gray-800">{viajeSeleccionado.horaSalida}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Pasajeros</p>
                    <p className="font-semibold text-gray-800">
                      {viajeSeleccionado.capacidadTotal - viajeSeleccionado.asientosDisponibles} / {viajeSeleccionado.capacidadTotal}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mapa del recorrido */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
                  Recorrido del Viaje
                </h3>
                <div className="h-64 rounded-xl overflow-hidden border border-gray-200">
                  <MapaTrackingViaje
                    viajeId={viajeSeleccionado.id}
                    token={getToken() || undefined}
                    autoRefresh={false}
                    showHistorial={true}
                    showRoute={true}
                    className="h-full"
                  />
                </div>
              </div>

              {/* Lista de asientos/pasajeros */}
              <div className="p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" style={{ color: primaryColor }} />
                  Asientos ({viajeSeleccionado.capacidadTotal - viajeSeleccionado.asientosDisponibles} ocupados)
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {viajeSeleccionado.asientos.map(asiento => {
                    const ocupado = asiento.estado !== 'DISPONIBLE';
                    return (
                      <div
                        key={asiento.id}
                        className={`p-2 rounded-lg text-center text-sm border ${
                          ocupado 
                            ? 'bg-blue-100 border-blue-300 text-blue-800' 
                            : 'bg-gray-50 border-gray-200 text-gray-400'
                        }`}
                        title={`Asiento ${asiento.numeroAsiento} - ${asiento.estado}`}
                      >
                        <User className={`w-4 h-4 mx-auto mb-1 ${ocupado ? 'text-blue-600' : 'text-gray-300'}`} />
                        <span className="font-medium">{asiento.numeroAsiento}</span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
                    <span>Ocupado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-50 border border-gray-200"></div>
                    <span>Libre</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setViajeSeleccionado(null);
                  }}
                  className="px-6 py-2 rounded-lg text-white transition-colors"
                  style={{ backgroundColor: primaryColor }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
