'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useCooperativaConfig } from '@/app/context/CooperativaConfigContext';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { viajeChoferApi, ViajeChofer, getToken } from '@/lib/api';
import {
  MapPin,
  Clock,
  Calendar,
  Bus,
  Users,
  CheckCircle,
  XCircle,
  PlayCircle,
  StopCircle,
  ArrowLeft,
  AlertCircle,
  User,
  Ticket
} from 'lucide-react';

export default function MiViajeChoferPage() {
  const { user } = useAuth();
  const { cooperativaConfig } = useCooperativaConfig();
  const router = useRouter();
  const [viaje, setViaje] = useState<ViajeChofer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [mostrarModalFinalizar, setMostrarModalFinalizar] = useState(false);
  const [pasajeroVerificados, setPasajeroVerificados] = useState<Set<number>>(new Set());

  // Colores dinámicos de la cooperativa
  const primaryColor = cooperativaConfig?.colorPrimario || '#ea580c';
  const secondaryColor = cooperativaConfig?.colorSecundario || '#c2410c';

  useEffect(() => {
    loadViaje();
  }, [user]);

  const loadViaje = async () => {
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

      const hoy = new Date().toISOString().split('T')[0];
      const viajeData = await viajeChoferApi.getViajeDelDia(user.userId, hoy, token);
      
      setViaje(viajeData);
    } catch (err) {
      console.error('Error al cargar viaje:', err);
      setError('Error al cargar la información del viaje');
    } finally {
      setLoading(false);
    }
  };

  const handleIniciarViaje = async () => {
    if (!viaje) return;

    try {
      setProcesando(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      const resultado = await viajeChoferApi.iniciar(viaje.id, token);
      alert(`${resultado.mensaje}\nEstado: ${resultado.estado}`);
      
      // Recargar datos
      await loadViaje();
    } catch (err: any) {
      console.error('Error al iniciar viaje:', err);
      setError(err.message || 'Error al iniciar el viaje');
    } finally {
      setProcesando(false);
    }
  };

  const handleFinalizarViaje = async () => {
    if (!viaje) return;

    try {
      setProcesando(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      const resultado = await viajeChoferApi.finalizar(viaje.id, observaciones, token);
      alert(`✅ ${resultado.mensaje}`);
      
      setMostrarModalFinalizar(false);
      setObservaciones('');
      
      await loadViaje();
    } catch (err: any) {
      console.error('Error al finalizar viaje:', err);
      setError(err.message || 'Error al finalizar el viaje');
      alert('❌ Error al finalizar el viaje');
    } finally {
      setProcesando(false);
    }
  };

  const toggleVerificarPasajero = (reservaId: number) => {
    const newSet = new Set(pasajeroVerificados);
    if (newSet.has(reservaId)) {
      newSet.delete(reservaId);
    } else {
      newSet.add(reservaId);
    }
    setPasajeroVerificados(newSet);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado.toUpperCase()) {
      case 'PROGRAMADO': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'EN_RUTA': return 'bg-green-100 text-green-800 border-green-300';
      case 'COMPLETADO': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getEstadoNombre = (estado: string) => {
    switch (estado.toUpperCase()) {
      case 'PROGRAMADO': return 'Programado';
      case 'EN_RUTA': return 'En Ruta';
      case 'COMPLETADO': return 'Completado';
      default: return estado;
    }
  };

  return (
    <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['CHOFER']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
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
            <h1 className="text-3xl font-bold text-gray-800">
              🚌 Mi Viaje del Día
            </h1>
            <div className="w-20" /> {/* Spacer para centrar el título */}
          </div>

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div 
                className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
                style={{ borderColor: primaryColor }}
              ></div>
              <p className="text-gray-600">Cargando información del viaje...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* No hay viaje */}
          {!loading && !viaje && !error && (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No tienes viajes asignados hoy
              </h3>
              <p className="text-gray-500 mb-6">
                No hay viajes programados para ti en esta fecha.
              </p>
              <button
                onClick={() => router.push('/dashboard/Cooperativa/Chofer')}
                className="text-white px-6 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: primaryColor }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = secondaryColor}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
              >
                Volver al Dashboard
              </button>
            </div>
          )}

          {/* Información del viaje */}
          {!loading && viaje && (
            <div className="space-y-6">
              {/* Card principal del viaje */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Header del viaje */}
                <div className="bg-linear-to-r from-orange-600 to-orange-800 text-white p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">Viaje #{viaje.id}</h2>
                      <p className="text-orange-100">
                        {viaje.origen} → {viaje.destino}
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg border-2 ${getEstadoColor(viaje.estado)} font-semibold`}>
                      {getEstadoNombre(viaje.estado)}
                    </div>
                  </div>

                  {/* Información básica en grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      <div>
                        <p className="text-xs text-orange-200">Fecha</p>
                        <p className="font-semibold">{new Date(viaje.fecha).toLocaleDateString('es-EC')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      <div>
                        <p className="text-xs text-orange-200">Salida</p>
                        <p className="font-semibold">{viaje.horaSalidaProgramada}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bus className="w-5 h-5" />
                      <div>
                        <p className="text-xs text-orange-200">Bus</p>
                        <p className="font-semibold">{viaje.busPlaca}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      <div>
                        <p className="text-xs text-orange-200">Pasajeros</p>
                        <p className="font-semibold">{viaje.totalPasajeros} / {viaje.capacidadTotal}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalles adicionales */}
                <div className="p-6 bg-gray-50 border-b">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Marca del Bus</p>
                      <p className="font-semibold text-gray-800">{viaje.busMarca}</p>
                    </div>
                    {viaje.horaSalidaReal && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Hora Salida Real</p>
                        <p className="font-semibold text-gray-800">{viaje.horaSalidaReal}</p>
                      </div>
                    )}
                    {viaje.horaLlegadaEstimada && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Llegada Estimada</p>
                        <p className="font-semibold text-gray-800">{viaje.horaLlegadaEstimada}</p>
                      </div>
                    )}
                    {viaje.horaLlegadaReal && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Hora Llegada Real</p>
                        <p className="font-semibold text-gray-800">{viaje.horaLlegadaReal}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="p-6 bg-white border-t flex gap-4">
                  {viaje.estado === 'PROGRAMADO' && (
                    <button
                      onClick={handleIniciarViaje}
                      disabled={procesando}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PlayCircle className="w-5 h-5" />
                      {procesando ? 'Iniciando...' : 'Iniciar Viaje'}
                    </button>
                  )}
                  {viaje.estado === 'EN_RUTA' && (
                    <button
                      onClick={() => setMostrarModalFinalizar(true)}
                      disabled={procesando}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <StopCircle className="w-5 h-5" />
                      Finalizar Viaje
                    </button>
                  )}
                </div>
              </div>

              {/* Lista de pasajeros */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Users className="w-6 h-6" style={{ color: primaryColor }} />
                    Lista de Pasajeros ({viaje.totalPasajeros})
                  </h3>
                  <div className="text-sm text-gray-600">
                    Verificados: <span className="font-semibold" style={{ color: primaryColor }}>{pasajeroVerificados.size}</span> / {viaje.totalPasajeros}
                  </div>
                </div>

                {viaje.pasajeros.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>No hay pasajeros registrados para este viaje</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {viaje.pasajeros.map((pasajero, index) => (
                      <div
                        key={pasajero.reservaId}
                        className={`border rounded-lg p-4 transition-all ${
                          pasajeroVerificados.has(pasajero.reservaId)
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-orange-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="bg-orange-100 text-orange-800 rounded-full w-10 h-10 flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="w-4 h-4 text-gray-600" />
                                <p className="font-semibold text-gray-800">{pasajero.clienteEmail}</p>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Ticket className="w-4 h-4" />
                                  Asientos: {pasajero.asientos.join(', ')}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  pasajero.estado === 'PAGADO'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {pasajero.estado === 'PAGADO' ? '✓ Pagado' : '⏳ Pendiente'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleVerificarPasajero(pasajero.reservaId)}
                            className={`ml-4 px-4 py-2 rounded-lg font-semibold transition-colors ${
                              pasajeroVerificados.has(pasajero.reservaId)
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {pasajeroVerificados.has(pasajero.reservaId) ? (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                Verificado
                              </span>
                            ) : (
                              'Verificar'
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal Finalizar Viaje */}
          {mostrarModalFinalizar && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="bg-red-600 text-white p-4 rounded-t-lg">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <StopCircle className="w-6 h-6" />
                    Finalizar Viaje
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 mb-4">
                    ¿Está seguro que desea finalizar el viaje? Esta acción no se puede deshacer.
                  </p>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observaciones (opcional)
                    </label>
                    <textarea
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      rows={4}
                      placeholder="Ingrese cualquier observación sobre el viaje..."
                    />
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex gap-3">
                  <button
                    onClick={() => {
                      setMostrarModalFinalizar(false);
                      setObservaciones('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                    disabled={procesando}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleFinalizarViaje}
                    disabled={procesando}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {procesando ? 'Finalizando...' : 'Finalizar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
