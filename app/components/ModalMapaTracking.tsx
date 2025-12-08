'use client';

import { X } from 'lucide-react';
import MapaTrackingViaje from './MapaTrackingViaje';

interface TerminalCoords {
  lat: number;
  lng: number;
  nombre?: string;
}

interface ModalMapaTrackingProps {
  viajeId: number;
  token: string;
  onClose: () => void;
  titulo?: string;
  terminalOrigen?: TerminalCoords;
  terminalDestino?: TerminalCoords;
}

/**
 * Modal que muestra el mapa de tracking de un viaje
 */
export default function ModalMapaTracking({
  viajeId,
  token,
  onClose,
  titulo = 'Tracking de Viaje',
  terminalOrigen,
  terminalDestino,
}: ModalMapaTrackingProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
          <h2 className="text-2xl font-bold">{titulo}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mapa */}
        <div className="flex-1 overflow-y-auto p-6">
          <MapaTrackingViaje
            viajeId={viajeId}
            token={token}
            showHistorial={true}
            showRoute={!!(terminalOrigen && terminalDestino)}
            autoRefresh={true}
            refreshInterval={10000}
            className="h-[600px]"
            terminalOrigen={terminalOrigen}
            terminalDestino={terminalDestino}
          />
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
