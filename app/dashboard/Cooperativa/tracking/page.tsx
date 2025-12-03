'use client';

import { useState, useEffect } from 'react';
import { getToken } from '@/lib/api';
import PanelTrackingCooperativa from '@/app/components/PanelTrackingCooperativa';
import ModalMapaTracking from '@/app/components/ModalMapaTracking';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { Activity } from 'lucide-react';

interface ViajeCooperativa {
  id: number;
  busPlaca: string;
  rutaOrigen: string;
  rutaDestino: string;
  choferNombre: string;
  horaSalida: string;
  estado: string;
  numeroPasajeros: number;
  capacidadTotal: number;
}

export default function TrackingCooperativaPage() {
  return (
    <ProtectedRoute allowedRoles={['COOPERATIVA']}>
      <TrackingCooperativaContent />
    </ProtectedRoute>
  );
}

function TrackingCooperativaContent() {
  const [viajes, setViajes] = useState<ViajeCooperativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [viajeSeleccionado, setViajeSeleccionado] = useState<number | null>(null);
  const [cooperativaId, setCooperativaId] = useState<number | null>(null);

  useEffect(() => {
    const authToken = getToken();
    if (authToken) {
      setToken(authToken);
      
      // Obtener ID de cooperativa del usuario
      const userDataStr = localStorage.getItem('user');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const coopId = userData?.cooperativaId;
      
      if (coopId) {
        setCooperativaId(coopId);
        cargarViajesCooperativa(coopId, authToken);
      } else {
        setError('No se pudo obtener el ID de la cooperativa');
        setLoading(false);
      }
    } else {
      setError('No estás autenticado');
      setLoading(false);
    }
  }, []);

  const cargarViajesCooperativa = async (coopId: number, authToken: string) => {
    setLoading(true);
    setError('');

    try {
      // Importar el API de viajes activos
      const { viajesActivosApi } = await import('@/lib/api');

      // Obtener viajes activos de la cooperativa desde el backend
      const viajesActivos = await viajesActivosApi.obtenerViajesPorCooperativa(coopId, authToken);
      
      // Mapear al formato esperado por el componente
      const viajesFormateados: ViajeCooperativa[] = viajesActivos.map(viaje => ({
        id: viaje.viajeId,
        busPlaca: viaje.busPlaca,
        rutaOrigen: viaje.rutaOrigen,
        rutaDestino: viaje.rutaDestino,
        choferNombre: viaje.choferNombreCompleto || `${viaje.choferNombre} ${viaje.choferApellido}`,
        horaSalida: viaje.horaSalida,
        estado: viaje.estado,
        numeroPasajeros: viaje.numeroPasajeros,
        capacidadTotal: viaje.capacidadTotal,
      }));

      setViajes(viajesFormateados);
    } catch (err) {
      console.error('Error cargando viajes:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar viajes de la cooperativa');
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalles = (viajeId: number) => {
    setViajeSeleccionado(viajeId);
  };

  const handleCerrarModal = () => {
    setViajeSeleccionado(null);
  };

  const handleRefrescar = () => {
    if (cooperativaId && token) {
      cargarViajesCooperativa(cooperativaId, token);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tracking GPS - Mis Buses
          </h1>
          <p className="text-gray-600">
            Monitorea en tiempo real todos los viajes activos de tu cooperativa
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Cargando viajes de la cooperativa...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error al cargar</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={handleRefrescar}
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <PanelTrackingCooperativa
            viajesActivos={viajes}
            token={token}
            onVerDetalles={handleVerDetalles}
          />
        )}
      </div>

      {/* Modal de detalles */}
      {viajeSeleccionado && (
        <ModalMapaTracking
          viajeId={viajeSeleccionado}
          token={token}
          onClose={handleCerrarModal}
          titulo={`Tracking - Viaje #${viajeSeleccionado}`}
        />
      )}
    </div>
  );
}
