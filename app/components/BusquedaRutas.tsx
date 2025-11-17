'use client';

import { useState } from 'react';
import { Search, Calendar, MapPin, Filter, Bus, Clock } from 'lucide-react';
import { rutasApi, type BuscarRutasParams, type RutaItem } from '@/lib/api';
import { CIUDADES_ECUADOR, TIPOS_ASIENTO, TIPOS_VIAJE } from '@/lib/constants';

interface BusquedaRutasProps {
  onSelectRuta?: (ruta: RutaItem) => void;
}

export default function BusquedaRutas({ onSelectRuta }: BusquedaRutasProps) {
  const [filtros, setFiltros] = useState<BuscarRutasParams>({
    origen: '',
    destino: '',
    fecha: new Date().toISOString().split('T')[0],
    cooperativa: '',
    tipoAsiento: '',
    tipoViaje: '',
    page: 0,
    size: 20,
  });

  const [rutas, setRutas] = useState<RutaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [totalResultados, setTotalResultados] = useState(0);

  const handleSearch = async () => {
    if (!filtros.origen || !filtros.destino || !filtros.fecha) {
      setError('Por favor completa origen, destino y fecha');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await rutasApi.buscar(filtros);
      setRutas(response.items);
      setTotalResultados(response.total);
    } catch (err) {
      console.error('Error buscando rutas:', err);
      setError(err instanceof Error ? err.message : 'Error al buscar rutas. Intenta nuevamente.');
      setRutas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof BuscarRutasParams, value: string) => {
    setFiltros(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* Formulario de Búsqueda Principal */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Bus className="w-7 h-7 text-blue-600" />
          Buscar Rutas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Origen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Origen
            </label>
            <select
              value={filtros.origen}
              onChange={(e) => handleInputChange('origen', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            >
              <option value="">Seleccionar ciudad</option>
              {CIUDADES_ECUADOR.map(ciudad => (
                <option key={ciudad} value={ciudad}>{ciudad}</option>
              ))}
            </select>
          </div>

          {/* Destino */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Destino
            </label>
            <select
              value={filtros.destino}
              onChange={(e) => handleInputChange('destino', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            >
              <option value="">Seleccionar ciudad</option>
              {CIUDADES_ECUADOR.map(ciudad => (
                <option key={ciudad} value={ciudad}>{ciudad}</option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha
            </label>
            <input
              type="date"
              value={filtros.fecha}
              onChange={(e) => handleInputChange('fecha', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            />
          </div>

          {/* Botón Buscar */}
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>

        {/* Botón Filtros Avanzados */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? 'Ocultar' : 'Mostrar'} filtros avanzados
        </button>

        {/* Filtros Avanzados */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
            {/* Cooperativa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cooperativa
              </label>
              <input
                type="text"
                value={filtros.cooperativa}
                onChange={(e) => handleInputChange('cooperativa', e.target.value)}
                placeholder="Ej: Amazonas, Santa..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Tipo de Asiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Asiento
              </label>
              <select
                value={filtros.tipoAsiento}
                onChange={(e) => handleInputChange('tipoAsiento', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Todos</option>
                <option value={TIPOS_ASIENTO.NORMAL}>{TIPOS_ASIENTO.NORMAL}</option>
                <option value={TIPOS_ASIENTO.VIP}>{TIPOS_ASIENTO.VIP}</option>
                <option value={TIPOS_ASIENTO.SEMI_CAMA}>{TIPOS_ASIENTO.SEMI_CAMA}</option>
                <option value={TIPOS_ASIENTO.CAMA}>{TIPOS_ASIENTO.CAMA}</option>
              </select>
            </div>

            {/* Tipo de Viaje */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Viaje
              </label>
              <select
                value={filtros.tipoViaje}
                onChange={(e) => handleInputChange('tipoViaje', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Todos</option>
                <option value={TIPOS_VIAJE.DIRECTO}>Directo</option>
                <option value={TIPOS_VIAJE.CON_PARADAS}>Con paradas</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Mensajes de Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Resultados */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">
            Rutas Disponibles {totalResultados > 0 && `(${totalResultados})`}
          </h3>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!loading && rutas.length === 0 && !error && (
          <div className="text-center py-12">
            <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay rutas disponibles para tu búsqueda</p>
            <p className="text-gray-400 text-sm mt-2">Intenta con otras ciudades o fechas</p>
          </div>
        )}

        {!loading && rutas.length > 0 && (
          <div className="space-y-4">
            {rutas.map((ruta) => (
              <div
                key={ruta.frecuenciaId}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => onSelectRuta && onSelectRuta(ruta)}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  {/* Información de la Ruta */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-blue-100 px-3 py-1 rounded-full">
                        <span className="text-blue-800 font-semibold text-sm">{ruta.cooperativa}</span>
                      </div>
                      {ruta.tipoViaje === 'directo' && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                          Directo
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-lg font-bold text-gray-800 mb-2">
                      <span>{ruta.origen}</span>
                      <span className="text-blue-600">→</span>
                      <span>{ruta.destino}</span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Salida: {ruta.horaSalida}
                      </span>
                      <span>Duración: {ruta.duracionEstimada}</span>
                    </div>

                    {/* Asientos Disponibles */}
                    <div className="flex gap-2 mt-2">
                      {Object.entries(ruta.asientosPorTipo).map(([tipo, cantidad]) => (
                        <span key={tipo} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {tipo}: {cantidad} asientos
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Botón Seleccionar */}
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectRuta) onSelectRuta(ruta);
                      }}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                      Seleccionar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
