'use client';

import { useState } from 'react';
import { MapPin, Navigation, Clock, ChevronRight } from 'lucide-react';
import MapaTrackingViaje from './MapaTrackingViaje';

interface ViajeTrackingCardProps {
  viajeId: number;
  origen: string;
  destino: string;
  fechaViaje: string;
  horaSalida: string;
  placa: string;
  token?: string;
}

/**
 * Tarjeta compacta de viaje con botón para ver tracking
 * Usado en el dashboard del cliente para ver el tracking de su boleto
 */
export default function ViajeTrackingCard({
  viajeId,
  origen,
  destino,
  fechaViaje,
  horaSalida,
  placa,
  token,
}: ViajeTrackingCardProps) {
  const [mostrarMapa, setMostrarMapa] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">{origen} → {destino}</h3>
            <p className="text-sm text-blue-100 mt-1">Viaje #{viajeId}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Bus</p>
            <p className="text-lg font-bold">{placa}</p>
          </div>
        </div>
      </div>

      {/* Información del viaje */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500">Fecha</p>
              <p className="font-semibold text-gray-900">
                {new Date(fechaViaje).toLocaleDateString('es-ES', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-xs text-gray-500">Hora de Salida</p>
              <p className="font-semibold text-gray-900">{horaSalida}</p>
            </div>
          </div>
        </div>

        {/* Botón de tracking */}
        <button
          onClick={() => setMostrarMapa(!mostrarMapa)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
        >
          {mostrarMapa ? (
            <>
              <MapPin className="w-5 h-5" />
              Ocultar Mapa
            </>
          ) : (
            <>
              <Navigation className="w-5 h-5" />
              Ver Ubicación en Tiempo Real
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* Mapa de tracking (se muestra al hacer clic) */}
      {mostrarMapa && (
        <div className="border-t border-gray-200">
          <MapaTrackingViaje
            viajeId={viajeId}
            token={token}
            autoRefresh={true}
            refreshInterval={10000}
            showHistorial={false}
          />
        </div>
      )}
    </div>
  );
}
