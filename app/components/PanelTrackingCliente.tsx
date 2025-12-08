'use client';

import { useState } from 'react';
import { Ticket, MapPin, Clock, Bus, ChevronDown, ChevronUp, Route } from 'lucide-react';
import MapaTrackingViaje from './MapaTrackingViaje';

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

interface PanelTrackingClienteProps {
  boletos: BoletoConViaje[];
  token: string;
}

/**
 * Panel de tracking para Cliente
 * Muestra solo los viajes de los boletos que ha comprado
 */
export default function PanelTrackingCliente({ boletos, token }: PanelTrackingClienteProps) {
  const [expandedBoleto, setExpandedBoleto] = useState<number | null>(null);

  const boletosActivos = boletos.filter(
    (b) => b.viaje.estadoViaje === 'EN_CURSO' || b.viaje.estadoViaje === 'PROGRAMADO'
  );

  const boletosCompletados = boletos.filter(
    (b) => b.viaje.estadoViaje === 'FINALIZADO' || b.viaje.estadoViaje === 'CANCELADO'
  );

  const toggleBoleto = (boletoId: number) => {
    setExpandedBoleto(expandedBoleto === boletoId ? null : boletoId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Ticket className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Mis Viajes</h2>
        </div>
        <p className="text-blue-100">
          {boletosActivos.length} viaje{boletosActivos.length !== 1 ? 's' : ''} activo
          {boletosActivos.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Viajes Activos */}
      {boletosActivos.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Viajes Activos</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {boletosActivos.map((boleto) => (
              <BoletoTrackingItem
                key={boleto.boletoId}
                boleto={boleto}
                token={token}
                isExpanded={expandedBoleto === boleto.boletoId}
                onToggle={() => toggleBoleto(boleto.boletoId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Viajes Completados */}
      {boletosCompletados.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Viajes Completados</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {boletosCompletados.map((boleto) => (
              <BoletoTrackingItem
                key={boleto.boletoId}
                boleto={boleto}
                token={token}
                isExpanded={expandedBoleto === boleto.boletoId}
                onToggle={() => toggleBoleto(boleto.boletoId)}
                isCompleted
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {boletos.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No tienes boletos</h3>
          <p className="text-gray-600 text-sm mb-6">
            Cuando compres un boleto, podrás ver el tracking de tu viaje aquí
          </p>
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            Buscar Rutas
          </button>
        </div>
      )}
    </div>
  );
}

interface BoletoTrackingItemProps {
  boleto: BoletoConViaje;
  token: string;
  isExpanded: boolean;
  onToggle: () => void;
  isCompleted?: boolean;
}

function BoletoTrackingItem({
  boleto,
  token,
  isExpanded,
  onToggle,
  isCompleted = false,
}: BoletoTrackingItemProps) {
  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'EN_CURSO':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
            En Ruta
          </span>
        );
      case 'PROGRAMADO':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
            Programado
          </span>
        );
      case 'FINALIZADO':
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
            Finalizado
          </span>
        );
      case 'CANCELADO':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
            Cancelado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {/* Header del boleto */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4 flex-1">
          {/* Icono del bus */}
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Bus className="w-6 h-6 text-white" />
          </div>

          {/* Información del viaje */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-bold text-gray-900">
                {boleto.viaje.busPlaca}
              </h3>
              {getEstadoBadge(boleto.viaje.estadoViaje)}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="truncate">
                  {boleto.viaje.rutaOrigen} → {boleto.viaje.rutaDestino}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>
                  {new Date(boleto.viaje.fechaSalida).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                  })}{' '}
                  • {boleto.viaje.horaSalida}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Ticket className="w-4 h-4" />
                <span>Asiento {boleto.numeroAsiento}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botón expandir */}
        {!isCompleted && (
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>
        )}
      </div>

      {/* Mapa expandido */}
      {isExpanded && !isCompleted && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          {/* Leyenda de la ruta */}
          {boleto.viaje.terminalOrigenLatitud && boleto.viaje.terminalDestinoLatitud && (
            <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-600">Origen: {boleto.viaje.terminalOrigenNombre || boleto.viaje.rutaOrigen}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-600">Destino: {boleto.viaje.terminalDestinoNombre || boleto.viaje.rutaDestino}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-gray-600">Bus actual</span>
              </div>
            </div>
          )}

          <MapaTrackingViaje
            viajeId={boleto.viajeId}
            token={token}
            showHistorial={false}
            autoRefresh={true}
            refreshInterval={10000}
            className="h-[400px]"
            showRoute={!!(boleto.viaje.terminalOrigenLatitud && boleto.viaje.terminalDestinoLatitud)}
            terminalOrigen={
              boleto.viaje.terminalOrigenLatitud && boleto.viaje.terminalOrigenLongitud
                ? {
                    lat: boleto.viaje.terminalOrigenLatitud,
                    lng: boleto.viaje.terminalOrigenLongitud,
                    nombre: boleto.viaje.terminalOrigenNombre,
                  }
                : undefined
            }
            terminalDestino={
              boleto.viaje.terminalDestinoLatitud && boleto.viaje.terminalDestinoLongitud
                ? {
                    lat: boleto.viaje.terminalDestinoLatitud,
                    lng: boleto.viaje.terminalDestinoLongitud,
                    nombre: boleto.viaje.terminalDestinoNombre,
                  }
                : undefined
            }
          />

          {/* Información adicional */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-500 mb-1">Número de Boleto</p>
              <p className="text-sm font-semibold text-gray-900">
                {boleto.numeroBoleto}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Hora Salida</p>
              <p className="text-sm font-semibold text-gray-900">
                {boleto.viaje.horaSalida}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Hora Llegada Est.</p>
              <p className="text-sm font-semibold text-gray-900">
                {boleto.viaje.horaLlegadaEstimada}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
