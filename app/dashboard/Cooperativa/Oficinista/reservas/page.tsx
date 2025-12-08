'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { useAuth } from '@/app/context/AuthContext';
import { reservasApi, getToken, cooperativaConfigApi, CooperativaConfigResponse } from '@/lib/api';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Ticket,
  X,
  Info
} from 'lucide-react';

interface Reserva {
  id: number;
  viajeId: number;
  clienteEmail: string;
  asientos: number;
  estado: string;
  monto: number;
  expiresAt?: string;
  createdAt?: string;
  // Datos del viaje
  fecha?: string;
  horaSalida?: string;
  origen?: string;
  destino?: string;
  busPlaca?: string;
  rutaNombre?: string;
}

export default function ReservasPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'PENDIENTE' | 'PAGADO' | 'CANCELADO'>('TODOS');
  const [reservaSeleccionada, setReservaSeleccionada] = useState<Reserva | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [config, setConfig] = useState<CooperativaConfigResponse | null>(null);

  const primaryColor = config?.colorPrimario || '#7c3aed';

  useEffect(() => {
    loadReservas();
    // Cargar configuración de la cooperativa
    const loadConfig = async () => {
      if (!user?.cooperativaId) return;
      try {
        const token = getToken();
        if (token) {
          const configData = await cooperativaConfigApi.getConfiguracion(user.cooperativaId, token);
          setConfig(configData);
        }
      } catch (error) {
        console.error('Error cargando configuración:', error);
      }
    };
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.cooperativaId]);

  const loadReservas = async () => {
    if (!user?.cooperativaId) return;

    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      const reservasData = await reservasApi.obtenerPorCooperativa(
        user.cooperativaId, 
        undefined, 
        token
      );

      setReservas(reservasData);
    } catch (err) {
      console.error('Error cargando reservas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarReserva = async (reservaId: number) => {
    if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;

    try {
      const token = getToken();
      if (!token) throw new Error('No hay token');

      await reservasApi.cancelar(reservaId, token);
      alert('Reserva cancelada exitosamente');
      loadReservas();
    } catch (err) {
      console.error('Error cancelando reserva:', err);
      alert('Error al cancelar la reserva');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      PAGADO: 'bg-green-100 text-green-800',
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      CANCELADO: 'bg-red-100 text-red-800',
      EXPIRADO: 'bg-gray-100 text-gray-800'
    };
    return badges[estado as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'PAGADO':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'PENDIENTE':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'CANCELADO':
      case 'EXPIRADO':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const handleVerDetalles = (reserva: Reserva) => {
    setReservaSeleccionada(reserva);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setReservaSeleccionada(null);
  };

  const reservasFiltradas = filtroEstado === 'TODOS' 
    ? reservas 
    : reservas.filter(r => r.estado === filtroEstado);

  return (
    <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['OFICINISTA']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <button
              onClick={() => router.push('/dashboard/Cooperativa/Oficinista')}
              className="mb-4 flex items-center gap-2 transition-colors"
              style={{ color: primaryColor }}
            >
              <ArrowLeft className="w-5 h-5" />
              Volver al Dashboard
            </button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  📋 Gestión de Reservas
                </h1>
                <p className="text-sm text-gray-600 mt-1">{user?.cooperativaNombre}</p>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Ticket className="w-5 h-5" style={{ color: primaryColor }} />
                <span className="font-semibold text-gray-900">{reservasFiltradas.length} reservas</span>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFiltroEstado('TODOS')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filtroEstado === 'TODOS'
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={filtroEstado === 'TODOS' ? { backgroundColor: primaryColor } : {}}
              >
                Todos ({reservas.length})
              </button>
              <button
                onClick={() => setFiltroEstado('PENDIENTE')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filtroEstado === 'PENDIENTE'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pendientes ({reservas.filter(r => r.estado === 'PENDIENTE').length})
              </button>
              <button
                onClick={() => setFiltroEstado('PAGADO')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filtroEstado === 'PAGADO'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pagados ({reservas.filter(r => r.estado === 'PAGADO').length})
              </button>
              <button
                onClick={() => setFiltroEstado('CANCELADO')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filtroEstado === 'CANCELADO'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancelados ({reservas.filter(r => r.estado === 'CANCELADO').length})
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div 
                className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
                style={{ borderColor: primaryColor }}
              ></div>
              <p className="mt-4 text-gray-600">Cargando reservas...</p>
            </div>
          )}

          {/* Lista de reservas */}
          {!loading && (
            <div className="space-y-4">
              {reservasFiltradas.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-600">No hay reservas {filtroEstado !== 'TODOS' ? filtroEstado.toLowerCase() + 's' : ''}</p>
                </div>
              ) : (
                reservasFiltradas.map((reserva) => (
                  <div key={reserva.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Info principal */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          {getEstadoIcon(reserva.estado)}
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoBadge(reserva.estado)}`}>
                            {reserva.estado}
                          </span>
                          <span className="text-sm text-gray-500">#{reserva.id}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-gray-700">
                            <User className="w-4 h-4" />
                            <span className="text-sm">{reserva.clienteEmail}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{reserva.origen} → {reserva.destino}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">{reserva.fecha}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{reserva.horaSalida}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600">
                            <strong>Bus:</strong> {reserva.busPlaca}
                          </span>
                          <span className="text-gray-600">
                            <strong>Asientos:</strong> {reserva.asientos}
                          </span>
                          <span className="text-gray-700 font-semibold flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ${reserva.monto.toFixed(2)}
                          </span>
                        </div>

                        {reserva.expiresAt && reserva.estado === 'PENDIENTE' && (
                          <div className="text-xs text-yellow-700 bg-yellow-50 px-3 py-1 rounded inline-block">
                            ⏰ Expira: {new Date(reserva.expiresAt).toLocaleString()}
                          </div>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex flex-col gap-2">
                        {reserva.estado === 'PENDIENTE' && (
                          <>
                            <button
                              onClick={() => handleCancelarReserva(reserva.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleVerDetalles(reserva)}
                          className="px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Info className="w-4 h-4" />
                          Ver Detalles
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Modal de Detalles */}
          {mostrarModal && reservaSeleccionada && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header del Modal */}
                <div 
                  className="sticky top-0 text-white p-6 flex justify-between items-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Ticket className="w-6 h-6" />
                      Detalles de la Reserva
                    </h2>
                    <p className="text-white text-opacity-80 text-sm mt-1">ID: #{reservaSeleccionada.id}</p>
                  </div>
                  <button
                    onClick={cerrarModal}
                    className="p-2 hover:bg-black hover:bg-opacity-20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Contenido del Modal */}
                <div className="p-6 space-y-6">
                  {/* Estado */}
                  <div className="flex items-center gap-3 pb-4 border-b">
                    {getEstadoIcon(reservaSeleccionada.estado)}
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getEstadoBadge(reservaSeleccionada.estado)}`}>
                      {reservaSeleccionada.estado}
                    </span>
                  </div>

                  {/* Información del Cliente */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Información del Cliente
                    </h3>
                    <div className="space-y-2">
                      <p className="text-gray-700">
                        <span className="font-medium">Email:</span> {reservaSeleccionada.clienteEmail}
                      </p>
                    </div>
                  </div>

                  {/* Información del Viaje */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-green-600" />
                      Información del Viaje
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Viaje ID</p>
                        <p className="font-semibold text-gray-900">#{reservaSeleccionada.viajeId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Ruta</p>
                        <p className="font-semibold text-gray-900">{reservaSeleccionada.rutaNombre || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Origen</p>
                        <p className="font-semibold text-gray-900">{reservaSeleccionada.origen || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Destino</p>
                        <p className="font-semibold text-gray-900">{reservaSeleccionada.destino || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Fecha</p>
                        <p className="font-semibold text-gray-900 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {reservaSeleccionada.fecha || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Hora de Salida</p>
                        <p className="font-semibold text-gray-900 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {reservaSeleccionada.horaSalida || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Bus</p>
                        <p className="font-semibold text-gray-900">{reservaSeleccionada.busPlaca || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Asientos</p>
                        <p className="font-semibold text-gray-900">{reservaSeleccionada.asientos}</p>
                      </div>
                    </div>
                  </div>

                  {/* Información de Pago */}
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-yellow-600" />
                      Información de Pago
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Monto Total:</span>
                        <span className="text-2xl font-bold text-gray-900">
                          ${reservaSeleccionada.monto.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Información de Fechas */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-600" />
                      Fechas Importantes
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {reservaSeleccionada.createdAt && (
                        <div>
                          <p className="text-sm text-gray-600">Fecha de Creación</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(reservaSeleccionada.createdAt).toLocaleString('es-EC')}
                          </p>
                        </div>
                      )}
                      {reservaSeleccionada.expiresAt && reservaSeleccionada.estado === 'PENDIENTE' && (
                        <div>
                          <p className="text-sm text-gray-600">Fecha de Expiración</p>
                          <p className="font-semibold text-yellow-700">
                            {new Date(reservaSeleccionada.expiresAt).toLocaleString('es-EC')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer del Modal */}
                <div className="sticky bottom-0 bg-gray-50 p-6 flex justify-end gap-3 border-t">
                  {reservaSeleccionada.estado === 'PENDIENTE' && (
                    <button
                      onClick={() => {
                        cerrarModal();
                        handleCancelarReserva(reservaSeleccionada.id);
                      }}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Cancelar Reserva
                    </button>
                  )}
                  <button
                    onClick={cerrarModal}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    Cerrar
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
