'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { useAuth } from '@/app/context/AuthContext';
import { 
  frecuenciasAdminApi, 
  rutasAdminApi,
  getToken,
  type FrecuenciaViaje,
  type RutaResponse
} from '@/lib/api';
import { Calendar, MapPin, Clock, DollarSign, Users, Bus, ArrowLeft } from 'lucide-react';

export default function VenderBoletoPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [frecuencias, setFrecuencias] = useState<FrecuenciaViaje[]>([]);
  const [rutas, setRutas] = useState<RutaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [fechaViaje, setFechaViaje] = useState<string>(new Date().toISOString().split('T')[0]);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<number | null>(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>('');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    // Calcular el día de la semana cuando cambia la fecha
    if (fechaViaje) {
      const fecha = new Date(fechaViaje + 'T00:00:00');
      const dias = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
      setDiaSeleccionado(dias[fecha.getDay()]);
    }
  }, [fechaViaje]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token || !user?.cooperativaId) {
        router.push('/login');
        return;
      }

      // Cargar frecuencias de la cooperativa
      const frecuenciasData = await frecuenciasAdminApi.getByCooperativa(user.cooperativaId, token);
      setFrecuencias(frecuenciasData);

      // Cargar rutas disponibles
      const rutasData = await rutasAdminApi.getAll('activas', undefined, token);
      setRutas(rutasData);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const frecuenciasFiltradas = frecuencias.filter(f => {
    // Filtrar por ruta si está seleccionada
    if (rutaSeleccionada && f.rutaId !== rutaSeleccionada) {
      return false;
    }

    // Filtrar por día de la semana
    if (diaSeleccionado && !f.diasOperacion.split(',').includes(diaSeleccionado)) {
      return false;
    }

    return true;
  });

  const handleSeleccionarFrecuencia = (frecuencia: FrecuenciaViaje) => {
    // Guardar datos en sessionStorage y navegar a selección de asientos
    sessionStorage.setItem('ventaPresencial', JSON.stringify({
      frecuenciaId: frecuencia.id,
      fecha: fechaViaje,
      busId: frecuencia.busId,
      busPlaca: frecuencia.busPlaca,
      rutaNombre: frecuencia.rutaNombre,
      origen: frecuencia.rutaOrigen,
      destino: frecuencia.rutaDestino,
      horaSalida: frecuencia.horaSalida,
      precioBase: frecuencia.precioBase,
      asientosDisponibles: frecuencia.asientosDisponibles
    }));
    
    // Navegar a página de selección de asientos
    router.push('/dashboard/Cooperativa/Oficinista/seleccionar-asiento');
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['OFICINISTA']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando frecuencias...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['OFICINISTA']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <button
              onClick={() => router.push('/dashboard/Cooperativa/Oficinista')}
              className="text-purple-600 hover:text-purple-800 mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver al Dashboard
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  🎫 Venta de Boletos
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {user?.cooperativaNombre} - Selecciona una frecuencia para vender
                </p>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Filtros de Búsqueda</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Fecha de viaje */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Fecha del Viaje
                </label>
                <input
                  type="date"
                  value={fechaViaje}
                  onChange={(e) => setFechaViaje(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
                {diaSeleccionado && (
                  <p className="text-xs text-gray-500 mt-1">Día: {diaSeleccionado}</p>
                )}
              </div>

              {/* Ruta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Ruta
                </label>
                <select
                  value={rutaSeleccionada || ''}
                  onChange={(e) => setRutaSeleccionada(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                >
                  <option value="">Todas las rutas</option>
                  {rutas.map(ruta => (
                    <option key={ruta.id} value={ruta.id}>
                      {ruta.nombre} ({ruta.origen} → {ruta.destino})
                    </option>
                  ))}
                </select>
              </div>

              {/* Información */}
              <div className="flex items-end">
                <div className="w-full bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-sm text-purple-800">
                    <strong>{frecuenciasFiltradas.length}</strong> frecuencias disponibles
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">⚠️ {error}</p>
            </div>
          )}

          {/* Lista de Frecuencias Disponibles */}
          <div className="space-y-4">
            {frecuenciasFiltradas.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Bus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No hay frecuencias disponibles para esta fecha</p>
                <p className="text-gray-400 text-sm mt-2">
                  Intenta seleccionar otra fecha o ruta
                </p>
              </div>
            ) : (
              frecuenciasFiltradas.map((frecuencia) => (
                <div key={frecuencia.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      {/* Información del viaje */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded font-medium text-sm">
                            {frecuencia.busPlaca}
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {frecuencia.rutaNombre}
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          {/* Origen */}
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-500">Origen</p>
                              <p className="font-medium text-gray-900 break-words">{frecuencia.rutaOrigen}</p>
                            </div>
                          </div>

                          {/* Destino */}
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-500">Destino</p>
                              <p className="font-medium text-gray-900 break-words">{frecuencia.rutaDestino}</p>
                            </div>
                          </div>

                          {/* Hora de Salida */}
                          <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-500">Hora Salida</p>
                              <p className="font-medium text-gray-900">{frecuencia.horaSalida}</p>
                            </div>
                          </div>

                          {/* Asientos Disponibles */}
                          <div className="flex items-start gap-2">
                            <Users className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-500">Asientos</p>
                              <p className="font-medium text-gray-900">{frecuencia.asientosDisponibles || 40}</p>
                            </div>
                          </div>
                        </div>

                        {/* Días de operación */}
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-2">Días de Operación:</p>
                          <div className="flex flex-wrap gap-2">
                            {frecuencia.diasOperacion.split(',').map(dia => (
                              <span 
                                key={dia} 
                                className={`px-3 py-1 rounded text-xs font-medium ${
                                  dia === diaSeleccionado 
                                    ? 'bg-purple-600 text-white' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {dia.substring(0, 3)}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Paradas (si existen) */}
                        {frecuencia.paradas && frecuencia.paradas.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <details className="cursor-pointer">
                              <summary className="text-sm font-medium text-gray-700">
                                📍 {frecuencia.paradas.length} paradas intermedias
                              </summary>
                              <div className="mt-2 space-y-1">
                                {frecuencia.paradas.map((parada) => (
                                  <div key={parada.id} className="text-xs text-gray-600 pl-4">
                                    {parada.orden}. {parada.nombreParada} - {parada.tiempoLlegada}
                                  </div>
                                ))}
                              </div>
                            </details>
                          </div>
                        )}
                      </div>

                      {/* Precio y Acción */}
                      <div className="ml-6 text-right flex flex-col items-end justify-between h-full">
                        <div className="mb-4">
                          <div className="flex items-center gap-1 text-gray-500 mb-1">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-xs">Precio Base</span>
                          </div>
                          <p className="text-3xl font-bold text-purple-600">
                            ${frecuencia.precioBase?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => handleSeleccionarFrecuencia(frecuencia)}
                          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold flex items-center gap-2"
                        >
                          <Bus className="w-5 h-5" />
                          Seleccionar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Nota informativa */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 text-xl">ℹ️</div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Instrucciones</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Selecciona una frecuencia disponible para el día deseado</li>
                  <li>• Solo se muestran frecuencias que operan en el día seleccionado</li>
                  <li>• La selección de asientos está en desarrollo</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
