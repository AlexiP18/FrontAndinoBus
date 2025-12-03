'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { viajeChoferApi, ViajeHistorial, getToken } from '@/lib/api';
import {
  MapPin,
  Clock,
  Calendar,
  Bus,
  Users,
  ArrowLeft,
  AlertCircle,
  Star,
  TrendingUp,
  Filter
} from 'lucide-react';

export default function HistorialViajesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [historial, setHistorial] = useState<ViajeHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');

  useEffect(() => {
    loadHistorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadHistorial = async () => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        setLoading(false);
        return;
      }

      const data = await viajeChoferApi.getHistorial(user.userId, token);
      setHistorial(data);
    } catch (err) {
      console.error('Error al cargar historial:', err);
      setError('Error al cargar el historial de viajes');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltro = async () => {
    if (!user?.userId) return;
    if (!filtroFechaInicio || !filtroFechaFin) {
      alert('Por favor seleccione ambas fechas');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      const data = await viajeChoferApi.getHistorial(
        user.userId,
        token,
        filtroFechaInicio,
        filtroFechaFin
      );
      setHistorial(data);
    } catch (err) {
      console.error('Error al filtrar historial:', err);
      setError('Error al aplicar filtros');
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltroFechaInicio('');
    setFiltroFechaFin('');
    loadHistorial();
  };

  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-gray-400 text-sm">Sin calificaciones</span>;
    
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      );
    }
    return <div className="flex items-center gap-1">{stars}</div>;
  };

  return (
    <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['CHOFER']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver
            </button>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              Historial de Viajes
            </h1>
            <p className="text-gray-600 mt-2">
              Consulta todos tus viajes completados y sus calificaciones
            </p>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Filtrar por Fecha</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={filtroFechaInicio}
                  onChange={(e) => setFiltroFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={filtroFechaFin}
                  onChange={(e) => setFiltroFechaFin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={aplicarFiltro}
                  className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  Aplicar
                </button>
                <button
                  onClick={limpiarFiltros}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando historial...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* No hay viajes */}
          {!loading && historial.length === 0 && !error && (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No hay viajes en el historial
              </h3>
              <p className="text-gray-500">
                Los viajes completados aparecerán aquí.
              </p>
            </div>
          )}

          {/* Lista de viajes */}
          {!loading && historial.length > 0 && (
            <div className="space-y-4">
              {historial.map((viaje) => (
                <div key={viaje.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-800">
                            {viaje.origen} → {viaje.destino}
                          </h3>
                          {viaje.promedioCalificacion && (
                            <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="font-semibold text-yellow-700">
                                {viaje.promedioCalificacion.toFixed(1)}
                              </span>
                              <span className="text-xs text-yellow-600">
                                ({viaje.totalCalificaciones})
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">Viaje #{viaje.id}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Fecha</p>
                          <p className="font-semibold text-gray-800">
                            {new Date(viaje.fecha).toLocaleDateString('es-EC')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Salida</p>
                          <p className="font-semibold text-gray-800">
                            {viaje.horaSalidaReal || viaje.horaSalidaProgramada}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Bus className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Bus</p>
                          <p className="font-semibold text-gray-800">{viaje.busPlaca}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Pasajeros</p>
                          <p className="font-semibold text-gray-800">{viaje.totalPasajeros}</p>
                        </div>
                      </div>
                    </div>

                    {viaje.promedioCalificacion && (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Calificación:</span>
                            {renderStars(viaje.promedioCalificacion)}
                          </div>
                          <button
                            onClick={() => router.push(`/dashboard/Cooperativa/Chofer/viaje/${viaje.id}/calificaciones`)}
                            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                          >
                            Ver detalles →
                          </button>
                        </div>
                      </div>
                    )}

                    {viaje.observaciones && (
                      <div className="mt-4 bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Observaciones:</span> {viaje.observaciones}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Estadísticas */}
          {!loading && historial.length > 0 && (
            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Estadísticas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium mb-1">Total Viajes</p>
                  <p className="text-3xl font-bold text-blue-900">{historial.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium mb-1">Total Pasajeros</p>
                  <p className="text-3xl font-bold text-green-900">
                    {historial.reduce((sum, v) => sum + v.totalPasajeros, 0)}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-yellow-600 font-medium mb-1">Calificación Promedio</p>
                  <p className="text-3xl font-bold text-yellow-900">
                    {historial.filter(v => v.promedioCalificacion).length > 0
                      ? (historial.reduce((sum, v) => sum + (v.promedioCalificacion || 0), 0) / 
                         historial.filter(v => v.promedioCalificacion).length).toFixed(1)
                      : '0.0'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
