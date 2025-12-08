'use client';

import { useState, useEffect } from 'react';
import { getToken } from '@/lib/api';
import PanelTrackingSuperAdmin from '@/app/components/PanelTrackingSuperAdmin';
import ModalMapaTracking from '@/app/components/ModalMapaTracking';
import { Activity } from 'lucide-react';

interface TerminalCoords {
  lat: number;
  lng: number;
  nombre?: string;
}

interface ViajeConCooperativa {
  id: number;
  busPlaca: string;
  cooperativaNombre: string;
  rutaOrigen: string;
  rutaDestino: string;
  choferNombre: string;
  horaSalida: string;
  estado: string;
  numeroPasajeros: number;
  capacidadTotal: number;
  terminalOrigen?: TerminalCoords;
  terminalDestino?: TerminalCoords;
}

export default function TrackingGlobalPage() {
  const [viajes, setViajes] = useState<ViajeConCooperativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [viajeSeleccionado, setViajeSeleccionado] = useState<ViajeConCooperativa | null>(null);

  useEffect(() => {
    const authToken = getToken();
    if (authToken) {
      setToken(authToken);
      cargarViajesGlobal(authToken);
    } else {
      setError('No estás autenticado');
      setLoading(false);
    }
  }, []);

  const cargarViajesGlobal = async (authToken: string) => {
    setLoading(true);
    setError('');

    try {
      // Importar el API de viajes activos
      const { viajesActivosApi } = await import('@/lib/api');

      // Obtener todos los viajes activos del sistema desde el backend
      const viajesActivos = await viajesActivosApi.obtenerViajesGlobal(authToken);
      
      // Mapear al formato esperado por el componente
      const viajesFormateados: ViajeConCooperativa[] = viajesActivos.map(viaje => ({
        id: viaje.viajeId,
        busPlaca: viaje.busPlaca,
        cooperativaNombre: viaje.cooperativaNombre,
        rutaOrigen: viaje.rutaOrigen,
        rutaDestino: viaje.rutaDestino,
        choferNombre: viaje.choferNombreCompleto || `${viaje.choferNombre} ${viaje.choferApellido}`,
        horaSalida: viaje.horaSalida,
        estado: viaje.estado,
        numeroPasajeros: viaje.numeroPasajeros,
        capacidadTotal: viaje.capacidadTotal,
        terminalOrigen: viaje.terminalOrigenLatitud && viaje.terminalOrigenLongitud ? {
          lat: viaje.terminalOrigenLatitud,
          lng: viaje.terminalOrigenLongitud,
          nombre: viaje.terminalOrigenNombre || viaje.rutaOrigen,
        } : undefined,
        terminalDestino: viaje.terminalDestinoLatitud && viaje.terminalDestinoLongitud ? {
          lat: viaje.terminalDestinoLatitud,
          lng: viaje.terminalDestinoLongitud,
          nombre: viaje.terminalDestinoNombre || viaje.rutaDestino,
        } : undefined,
      }));

      setViajes(viajesFormateados);
    } catch (err) {
      console.error('Error cargando viajes:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar viajes');
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalles = (viajeId: number) => {
    const viaje = viajes.find(v => v.id === viajeId);
    if (viaje) {
      setViajeSeleccionado(viaje);
    }
  };

  const handleCerrarModal = () => {
    setViajeSeleccionado(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Cargando viajes del sistema...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error al cargar</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => cargarViajesGlobal(token)}
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <PanelTrackingSuperAdmin
            viajes={viajes}
            token={token}
            onVerDetalles={handleVerDetalles}
          />
        )}
      </div>

      {/* Modal de detalles */}
      {viajeSeleccionado && (
        <ModalMapaTracking
          viajeId={viajeSeleccionado.id}
          token={token}
          onClose={handleCerrarModal}
          titulo={`Tracking - Viaje #${viajeSeleccionado.id}`}
          terminalOrigen={viajeSeleccionado.terminalOrigen}
          terminalDestino={viajeSeleccionado.terminalDestino}
        />
      )}
    </div>
  );
}
