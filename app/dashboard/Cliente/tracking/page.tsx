'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { reservasApi, getToken, type ReservaDetalleResponse } from '@/lib/api';
import PanelTrackingCliente from '@/app/components/PanelTrackingCliente';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import DashboardNavbar from '@/app/components/layout/DashboardNavbar';
import { ArrowLeft, Navigation } from 'lucide-react';

interface BoletoConViaje {
  boletoId: number;
  viajeId: number;
  numeroBoleto: string;
  numeroAsiento: number;
  fechaCompra: string;
  precioTotal: number;
  estado: string;
  viaje: {
    busPlaca: string;
    rutaOrigen: string;
    rutaDestino: string;
    fechaSalida: string;
    horaSalida: string;
    horaLlegadaEstimada: string;
    estadoViaje: string;
    // Coordenadas de terminales para mostrar la ruta
    terminalOrigenLatitud?: number;
    terminalOrigenLongitud?: number;
    terminalDestinoLatitud?: number;
    terminalDestinoLongitud?: number;
    terminalOrigenNombre?: string;
    terminalDestinoNombre?: string;
  };
}

export default function TrackingClientePage() {
  return (
    <ProtectedRoute allowedRoles={['CLIENTE']}>
      <TrackingClienteContent />
    </ProtectedRoute>
  );
}

function TrackingClienteContent() {
  const router = useRouter();
  const [boletos, setBoletos] = useState<BoletoConViaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const authToken = getToken();
    if (authToken) {
      setToken(authToken);
      cargarBoletos(authToken);
    } else {
      setError('No estás autenticado');
      setLoading(false);
    }
  }, []);

  const cargarBoletos = async (authToken: string) => {
    setLoading(true);
    setError('');

    try {
      // Obtener email del usuario
      const userDataStr = localStorage.getItem('user');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const clienteEmail = userData?.email;

      if (!clienteEmail) {
        setError('No se pudo obtener el email del usuario');
        return;
      }

      // Importar el API de viajes activos
      const { viajesActivosApi } = await import('@/lib/api');

      // Obtener viajes activos del cliente desde el backend
      const viajesActivos = await viajesActivosApi.obtenerViajesPorCliente(clienteEmail, authToken);
      
      // Mapear a formato BoletoConViaje
      const boletosConViaje: BoletoConViaje[] = viajesActivos.map(viaje => ({
        boletoId: viaje.id,
        viajeId: viaje.viajeId,
        numeroBoleto: `BOL-${viaje.id}`,
        numeroAsiento: 1, // TODO: Obtener del boleto real
        fechaCompra: viaje.fechaSalida,
        precioTotal: 0, // TODO: Obtener del boleto real
        estado: 'PAGADO',
        viaje: {
          busPlaca: viaje.busPlaca,
          rutaOrigen: viaje.rutaOrigen,
          rutaDestino: viaje.rutaDestino,
          fechaSalida: viaje.fechaSalida,
          horaSalida: viaje.horaSalida,
          horaLlegadaEstimada: viaje.horaLlegadaEstimada,
          estadoViaje: viaje.estado,
          // Coordenadas de terminales
          terminalOrigenLatitud: viaje.terminalOrigenLatitud,
          terminalOrigenLongitud: viaje.terminalOrigenLongitud,
          terminalDestinoLatitud: viaje.terminalDestinoLatitud,
          terminalDestinoLongitud: viaje.terminalDestinoLongitud,
          terminalOrigenNombre: viaje.terminalOrigenNombre,
          terminalDestinoNombre: viaje.terminalDestinoNombre,
        }
      }));

      setBoletos(boletosConViaje);
    } catch (err) {
      console.error('Error cargando boletos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar boletos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar title="Tracking de Viajes">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Volver</span>
        </button>
      </DashboardNavbar>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Cargando tus viajes...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Navigation className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error al cargar</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => cargarBoletos(token)}
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <PanelTrackingCliente boletos={boletos} token={token} />
        )}
      </div>
    </div>
  );
}
