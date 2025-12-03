'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { viajeChoferApi, CalificacionesChoferResponse, getToken } from '@/lib/api';
import {
  Star,
  ArrowLeft,
  AlertCircle,
  MessageCircle,
  TrendingUp,
  Award,
  Calendar,
  MapPin
} from 'lucide-react';

export default function CalificacionesChoferPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [calificaciones, setCalificaciones] = useState<CalificacionesChoferResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCalificaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadCalificaciones = async () => {
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

      const data = await viajeChoferApi.getCalificacionesChofer(user.userId, token);
      setCalificaciones(data);
    } catch (err) {
      console.error('Error al cargar calificaciones:', err);
      setError('Error al cargar las calificaciones');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-5 h-5 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      );
    }
    return stars;
  };

  const getCalificacionColor = (puntuacion: number) => {
    if (puntuacion >= 4.5) return 'text-green-600';
    if (puntuacion >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDistribucionEstrellas = () => {
    if (!calificaciones) return {};
    
    const distribucion: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    calificaciones.calificaciones.forEach(c => {
      distribucion[c.puntuacion] = (distribucion[c.puntuacion] || 0) + 1;
    });
    
    return distribucion;
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
              <Award className="w-8 h-8 text-orange-600" />
              Mis Calificaciones
            </h1>
            <p className="text-gray-600 mt-2">
              Revisa las valoraciones que los pasajeros han dejado sobre tus viajes
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando calificaciones...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!loading && calificaciones && (
            <>
              {/* Resumen de calificaciones */}
              <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Promedio general */}
                  <div className="text-center border-r-0 md:border-r border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Calificación Promedio</p>
                    <div className={`text-6xl font-bold mb-2 ${getCalificacionColor(calificaciones.promedioCalificacion)}`}>
                      {calificaciones.promedioCalificacion.toFixed(1)}
                    </div>
                    <div className="flex justify-center gap-1 mb-2">
                      {renderStars(Math.round(calificaciones.promedioCalificacion))}
                    </div>
                    <p className="text-sm text-gray-500">
                      Basado en {calificaciones.totalCalificaciones} valoraciones
                    </p>
                  </div>

                  {/* Distribución de estrellas */}
                  <div className="md:col-span-2 md:pl-8">
                    <p className="text-sm font-semibold text-gray-700 mb-4">Distribución de Calificaciones</p>
                    {Object.entries(getDistribucionEstrellas())
                      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
                      .map(([estrellas, cantidad]) => {
                        const porcentaje = calificaciones.totalCalificaciones > 0
                          ? (cantidad / calificaciones.totalCalificaciones) * 100
                          : 0;
                        
                        return (
                          <div key={estrellas} className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-medium text-gray-700 w-8">{estrellas} ★</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-yellow-400 h-full transition-all duration-300"
                                style={{ width: `${porcentaje}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 w-12 text-right">{cantidad}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Lista de calificaciones */}
              {calificaciones.calificaciones.length === 0 ? (
                <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                  <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Aún no tienes calificaciones
                  </h3>
                  <p className="text-gray-500">
                    Las valoraciones de los pasajeros aparecerán aquí después de completar viajes
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <MessageCircle className="w-6 h-6 text-orange-600" />
                    Comentarios de Pasajeros ({calificaciones.calificaciones.length})
                  </h2>

                  {calificaciones.calificaciones.map((calificacion) => (
                    <div key={calificacion.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {renderStars(calificacion.puntuacion)}
                            <span className="text-sm text-gray-500">
                              por {calificacion.clienteEmail}
                            </span>
                          </div>
                          {calificacion.origen && calificacion.destino && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <MapPin className="w-4 h-4" />
                              <span>{calificacion.origen} → {calificacion.destino}</span>
                              {calificacion.fechaViaje && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <Calendar className="w-4 h-4" />
                                  <span>{new Date(calificacion.fechaViaje).toLocaleDateString('es-EC')}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(calificacion.fechaCalificacion).toLocaleDateString('es-EC')}
                        </span>
                      </div>
                      
                      {calificacion.comentario && (
                        <div className="bg-gray-50 rounded-lg p-4 mt-3">
                          <p className="text-gray-700 italic">&ldquo;{calificacion.comentario}&rdquo;</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Estadísticas adicionales */}
              {calificaciones.totalCalificaciones > 0 && (
                <div className="mt-6 bg-gradient-to-r from-orange-600 to-orange-800 rounded-lg shadow-lg p-6 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-6 h-6" />
                    <h3 className="text-xl font-semibold">Tu Desempeño</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <p className="text-sm text-orange-100 mb-1">Calificaciones de 5★</p>
                      <p className="text-2xl font-bold">
                        {getDistribucionEstrellas()[5] || 0}
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <p className="text-sm text-orange-100 mb-1">Con comentarios</p>
                      <p className="text-2xl font-bold">
                        {calificaciones.calificaciones.filter(c => c.comentario).length}
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <p className="text-sm text-orange-100 mb-1">Satisfacción</p>
                      <p className="text-2xl font-bold">
                        {((calificaciones.promedioCalificacion / 5) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
