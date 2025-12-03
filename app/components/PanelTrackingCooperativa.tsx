'use client';

import { useState, useEffect } from 'react';
import { Bus, MapPin, Navigation, Activity, RefreshCw } from 'lucide-react';
import { useViajeTracking } from '@/hooks/useViajeTracking';

interface ViajeActivo {
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

interface PanelTrackingCooperativaProps {
  viajesActivos: ViajeActivo[];
  token: string;
  onVerDetalles: (viajeId: number) => void;
}

/**
 * Panel de tracking para Admin de Cooperativa
 * Muestra todos los buses activos de la cooperativa en tiempo real
 */
export default function PanelTrackingCooperativa({
  viajesActivos,
  token,
  onVerDetalles,
}: PanelTrackingCooperativaProps) {
  const [viajeSeleccionado, setViajeSeleccionado] = useState<number | null>(null);
  const [refrescando, setRefrescando] = useState(false);

  const handleRefrescar = async () => {
    setRefrescando(true);
    // Aquí iría la lógica para refrescar la lista de viajes activos
    setTimeout(() => setRefrescando(false), 1000);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Bus className="w-8 h-8" />
              Tracking de Flota
            </h2>
            <p className="text-green-100 mt-1">
              {viajesActivos.length} buses en ruta
            </p>
          </div>
          <button
            onClick={handleRefrescar}
            disabled={refrescando}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
            title="Refrescar"
          >
            <RefreshCw className={`w-6 h-6 ${refrescando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Lista de viajes activos */}
      <div className="divide-y divide-gray-200">
        {viajesActivos.length === 0 ? (
          <div className="p-12 text-center">
            <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay viajes activos
            </h3>
            <p className="text-gray-600 text-sm">
              Los viajes en curso aparecerán aquí
            </p>
          </div>
        ) : (
          viajesActivos.map((viaje) => (
            <ViajeActivoItem
              key={viaje.id}
              viaje={viaje}
              token={token}
              isSelected={viajeSeleccionado === viaje.id}
              onSelect={() => setViajeSeleccionado(viaje.id)}
              onVerDetalles={() => onVerDetalles(viaje.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface ViajeActivoItemProps {
  viaje: ViajeActivo;
  token: string;
  isSelected: boolean;
  onSelect: () => void;
  onVerDetalles: () => void;
}

function ViajeActivoItem({
  viaje,
  token,
  isSelected,
  onSelect,
  onVerDetalles,
}: ViajeActivoItemProps) {
  const { posicionActual, loading } = useViajeTracking({
    viajeId: viaje.id,
    token,
    autoRefresh: true,
    refreshInterval: 15000,
  });

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'EN_CURSO':
      case 'EN_RUTA':
        return 'bg-green-500';
      case 'EN_TERMINAL':
        return 'bg-yellow-500';
      case 'PROGRAMADO':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'EN_CURSO':
      case 'EN_RUTA':
        return 'En Ruta';
      case 'EN_TERMINAL':
        return 'En Terminal';
      case 'PROGRAMADO':
        return 'Programado';
      default:
        return estado;
    }
  };

  return (
    <div
      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
        isSelected ? 'bg-blue-50' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        {/* Información del viaje */}
        <div className="flex items-center gap-4 flex-1">
          {/* Bus y Estado */}
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <div
              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getEstadoColor(
                viaje.estado
              )}`}
              title={getEstadoTexto(viaje.estado)}
            />
          </div>

          {/* Detalles */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900">{viaje.busPlaca}</h3>
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded-full text-white ${getEstadoColor(
                  viaje.estado
                )}`}
              >
                {getEstadoTexto(viaje.estado)}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="truncate">
                  {viaje.rutaOrigen} → {viaje.rutaDestino}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Navigation className="w-4 h-4" />
                <span>{viaje.choferNombre}</span>
              </div>
            </div>

            {/* Posición actual */}
            {posicionActual && (
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                <span>
                  📍 {posicionActual.latitud.toFixed(4)}, {posicionActual.longitud.toFixed(4)}
                </span>
                {posicionActual.velocidadKmh && (
                  <span className="font-semibold text-green-600">
                    {posicionActual.velocidadKmh.toFixed(0)} km/h
                  </span>
                )}
                <span>
                  Actualizado:{' '}
                  {new Date(posicionActual.timestamp).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Botón de detalles */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVerDetalles();
          }}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
        >
          <Activity className="w-4 h-4" />
          Ver en Mapa
        </button>
      </div>

      {/* Loader */}
      {loading && !posicionActual && (
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
          <span>Cargando ubicación...</span>
        </div>
      )}
    </div>
  );
}
