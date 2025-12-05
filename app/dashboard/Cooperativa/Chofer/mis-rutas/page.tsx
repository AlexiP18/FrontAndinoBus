'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { useAuth } from '@/app/context/AuthContext';
import { useCooperativaConfig } from '@/app/context/CooperativaConfigContext';
import { viajeChoferApi, RutaChofer } from '@/lib/api';
import { 
  MapPin, 
  Clock, 
  Calendar, 
  TrendingUp, 
  ArrowLeft,
  AlertCircle,
  Route as RouteIcon
} from 'lucide-react';

function MisRutasChoferPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cooperativaConfig } = useCooperativaConfig();
  const [rutas, setRutas] = useState<RutaChofer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Colores dinámicos de la cooperativa
  const primaryColor = cooperativaConfig?.colorPrimario || '#ea580c';
  const secondaryColor = cooperativaConfig?.colorSecundario || '#c2410c';

  useEffect(() => {
    if (user?.userId) {
      loadRutas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadRutas = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token || !user?.userId) {
        setError('No se encontró el token de autenticación');
        return;
      }

      const data = await viajeChoferApi.getMisRutas(user.userId, token);
      setRutas(data);
    } catch (err) {
      console.error('Error al cargar rutas:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar las rutas');
    } finally {
      setLoading(false);
    }
  };

  const getDiasOperacionText = (dias?: string): string => {
    if (!dias) return 'No especificado';
    
    const diasMap: Record<string, string> = {
      'L': 'Lunes',
      'M': 'Martes',
      'X': 'Miércoles',
      'J': 'Jueves',
      'V': 'Viernes',
      'S': 'Sábado',
      'D': 'Domingo'
    };

    if (dias === 'L-V') return 'Lunes a Viernes';
    if (dias === 'L-D') return 'Todos los días';
    if (dias === 'S-D') return 'Fines de semana';

    const diasArray = dias.split(',').map(d => diasMap[d.trim()] || d);
    return diasArray.join(', ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-orange-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
              style={{ borderColor: primaryColor }}
            ></div>
            <p className="mt-4 text-gray-600">Cargando rutas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-orange-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800">Error al cargar rutas</h3>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalRutas = rutas.length;
  const rutasActivas = rutas.filter(r => r.activa).length;
  const totalViajesRealizados = rutas.reduce((sum, r) => sum + r.totalViajesRealizados, 0);
  const rutaMasFrecuente = rutas.length > 0
    ? rutas.reduce((prev, current) => (prev.totalViajesRealizados > current.totalViajesRealizados) ? prev : current)
    : null;

  return (
    <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['CHOFER']}>
      <div className="min-h-screen bg-linear-to-br from-orange-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 font-medium transition-colors"
              style={{ color: primaryColor }}
              onMouseEnter={(e) => e.currentTarget.style.color = secondaryColor}
              onMouseLeave={(e) => e.currentTarget.style.color = primaryColor}
            >
              <ArrowLeft className="w-5 h-5" />
              Volver
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">🛣️ Mis Rutas</h1>
              <p className="text-gray-600 mt-1">Rutas asignadas a tu cooperativa</p>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center gap-3">
                <RouteIcon className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-gray-600 text-sm">Total Rutas</p>
                  <p className="text-2xl font-bold text-gray-800">{totalRutas}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-gray-600 text-sm">Rutas Activas</p>
                  <p className="text-2xl font-bold text-gray-800">{rutasActivas}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8" style={{ color: primaryColor }} />
                <div>
                  <p className="text-gray-600 text-sm">Viajes Realizados</p>
                  <p className="text-2xl font-bold text-gray-800">{totalViajesRealizados}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-gray-600 text-sm">Ruta Principal</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {rutaMasFrecuente ? `${rutaMasFrecuente.origen}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Rutas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <RouteIcon className="w-6 h-6" style={{ color: primaryColor }} />
              Listado de Rutas
            </h2>

            {rutas.length === 0 ? (
              <div className="text-center py-12">
                <RouteIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No hay rutas asignadas a tu cooperativa</p>
                <p className="text-gray-400 text-sm mt-2">Las rutas aparecerán aquí cuando se configuren en el sistema</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rutas.map((ruta) => (
                  <div
                    key={ruta.id}
                    className={`border rounded-lg p-5 transition-all hover:shadow-md ${
                      ruta.activa 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-gray-50 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      {/* Información de la ruta */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <MapPin className="w-6 h-6 shrink-0" style={{ color: primaryColor }} />
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">
                              {ruta.origen} → {ruta.destino}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                ruta.activa 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-200 text-gray-700'
                              }`}>
                                {ruta.activa ? '✓ Activa' : '✗ Inactiva'}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                {ruta.totalViajesRealizados} viajes realizados
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Detalles adicionales */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-9">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="text-xs text-gray-500">Hora de Salida</p>
                              <p className="text-sm font-semibold">{ruta.horaSalida}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="w-4 h-4 text-green-600" />
                            <div>
                              <p className="text-xs text-gray-500">Días de Operación</p>
                              <p className="text-sm font-semibold">{getDiasOperacionText(ruta.diasOperacion)}</p>
                            </div>
                          </div>

                          {ruta.duracionEstimadaMin && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <Clock className="w-4 h-4 text-purple-600" />
                              <div>
                                <p className="text-xs text-gray-500">Duración Estimada</p>
                                <p className="text-sm font-semibold">{ruta.duracionEstimadaMin} minutos</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Badge de experiencia */}
                      {ruta.totalViajesRealizados > 0 && (
                        <div 
                          className="text-center bg-white rounded-lg px-4 py-2 shadow-sm border"
                          style={{ borderColor: `${primaryColor}40` }}
                        >
                          <p className="text-2xl font-bold" style={{ color: primaryColor }}>{ruta.totalViajesRealizados}</p>
                          <p className="text-xs text-gray-600">viajes</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Información adicional */}
          {rutas.length > 0 && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Información sobre las rutas</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Las rutas mostradas son las asignadas a tu cooperativa</li>
                    <li>El contador de viajes realizados muestra tu experiencia en cada ruta</li>
                    <li>Las rutas inactivas pueden ser reactivadas por el administrador de la cooperativa</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default MisRutasChoferPage;
