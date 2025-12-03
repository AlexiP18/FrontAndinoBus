'use client';

import { useState } from 'react';
import {
  Bus,
  MapPin,
  Navigation,
  Activity,
  Filter,
  Search,
  Building2,
} from 'lucide-react';
import { useViajeTracking } from '@/hooks/useViajeTracking';

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
}

interface PanelTrackingSuperAdminProps {
  viajes: ViajeConCooperativa[];
  token: string;
  onVerDetalles: (viajeId: number) => void;
}

type FiltroEstado = 'TODOS' | 'EN_CURSO' | 'PROGRAMADO' | 'EN_TERMINAL';

/**
 * Panel de tracking para Super Admin
 * Muestra todos los viajes del sistema con filtros avanzados
 */
export default function PanelTrackingSuperAdmin({
  viajes,
  token,
  onVerDetalles,
}: PanelTrackingSuperAdminProps) {
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [cooperativaSeleccionada, setCooperativaSeleccionada] = useState<string>('TODAS');

  // Obtener lista única de cooperativas
  const cooperativas = Array.from(new Set(viajes.map((v) => v.cooperativaNombre))).sort();

  // Aplicar filtros
  const viajesFiltrados = viajes.filter((viaje) => {
    // Filtro por estado
    if (filtroEstado !== 'TODOS' && viaje.estado !== filtroEstado) {
      return false;
    }

    // Filtro por cooperativa
    if (
      cooperativaSeleccionada !== 'TODAS' &&
      viaje.cooperativaNombre !== cooperativaSeleccionada
    ) {
      return false;
    }

    // Filtro por búsqueda (placa, chofer, ruta)
    if (busqueda) {
      const searchLower = busqueda.toLowerCase();
      return (
        viaje.busPlaca.toLowerCase().includes(searchLower) ||
        viaje.choferNombre.toLowerCase().includes(searchLower) ||
        viaje.rutaOrigen.toLowerCase().includes(searchLower) ||
        viaje.rutaDestino.toLowerCase().includes(searchLower) ||
        viaje.cooperativaNombre.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Estadísticas
  const stats = {
    total: viajes.length,
    enCurso: viajes.filter((v) => v.estado === 'EN_CURSO').length,
    programados: viajes.filter((v) => v.estado === 'PROGRAMADO').length,
    enTerminal: viajes.filter((v) => v.estado === 'EN_TERMINAL').length,
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Monitoreo Global de Flota</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-purple-200 text-sm mb-1">Total Viajes</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-green-200 text-sm mb-1">En Ruta</p>
            <p className="text-3xl font-bold">{stats.enCurso}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-blue-200 text-sm mb-1">Programados</p>
            <p className="text-3xl font-bold">{stats.programados}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-yellow-200 text-sm mb-1">En Terminal</p>
            <p className="text-3xl font-bold">{stats.enTerminal}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Búsqueda */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por placa, chofer, ruta..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>

          {/* Filtro por estado */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="EN_CURSO">En Ruta</option>
              <option value="PROGRAMADO">Programados</option>
              <option value="EN_TERMINAL">En Terminal</option>
            </select>
          </div>

          {/* Filtro por cooperativa */}
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-400" />
            <select
              value={cooperativaSeleccionada}
              onChange={(e) => setCooperativaSeleccionada(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            >
              <option value="TODAS">Todas las cooperativas</option>
              {cooperativas.map((coop) => (
                <option key={coop} value={coop}>
                  {coop}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Resultados */}
        <div className="mt-4 text-sm text-gray-600">
          Mostrando <span className="font-semibold">{viajesFiltrados.length}</span> de{' '}
          <span className="font-semibold">{viajes.length}</span> viajes
        </div>
      </div>

      {/* Lista de viajes */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {viajesFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay viajes que coincidan
              </h3>
              <p className="text-gray-600 text-sm">
                Intenta ajustar los filtros de búsqueda
              </p>
            </div>
          ) : (
            viajesFiltrados.map((viaje) => (
              <ViajeGlobalItem
                key={viaje.id}
                viaje={viaje}
                token={token}
                onVerDetalles={() => onVerDetalles(viaje.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface ViajeGlobalItemProps {
  viaje: ViajeConCooperativa;
  token: string;
  onVerDetalles: () => void;
}

function ViajeGlobalItem({ viaje, token, onVerDetalles }: ViajeGlobalItemProps) {
  const { posicionActual, loading } = useViajeTracking({
    viajeId: viaje.id,
    token,
    autoRefresh: true,
    refreshInterval: 20000,
  });

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'EN_CURSO':
        return 'bg-green-500';
      case 'EN_TERMINAL':
        return 'bg-yellow-500';
      case 'PROGRAMADO':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const ocupacionPorcentaje = (viaje.numeroPasajeros / viaje.capacidadTotal) * 100;

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        {/* Información del viaje */}
        <div className="flex items-center gap-4 flex-1">
          {/* Bus y Estado */}
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <div
              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getEstadoColor(
                viaje.estado
              )}`}
            />
          </div>

          {/* Detalles */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-bold text-gray-900">{viaje.busPlaca}</h3>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">
                {viaje.cooperativaNombre}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-1">
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

            {/* Ocupación */}
            <div className="flex items-center gap-2">
              <div className="flex-1 max-w-xs bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    ocupacionPorcentaje >= 90
                      ? 'bg-red-500'
                      : ocupacionPorcentaje >= 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${ocupacionPorcentaje}%` }}
                />
              </div>
              <span className="text-xs text-gray-600">
                {viaje.numeroPasajeros}/{viaje.capacidadTotal} pasajeros
              </span>
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
          onClick={onVerDetalles}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
        >
          <Activity className="w-4 h-4" />
          Ver en Mapa
        </button>
      </div>

      {/* Loader */}
      {loading && !posicionActual && (
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
          <span>Cargando ubicación...</span>
        </div>
      )}
    </div>
  );
}
