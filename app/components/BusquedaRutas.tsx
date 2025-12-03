'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, MapPin, Filter, Bus, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { rutasApi, type BuscarRutasParams, type RutaItem } from '@/lib/api';
import { TIPOS_VIAJE } from '@/lib/constants';

interface BusquedaRutasProps {
  onSelectRuta?: (ruta: RutaItem) => void;
}

export default function BusquedaRutas({ onSelectRuta }: BusquedaRutasProps) {
  const [filtros, setFiltros] = useState<BuscarRutasParams>({
    origen: '',
    destino: '',
    fecha: '',
    cooperativa: '',
    tipoViaje: '',
    page: 0,
    size: 200,
  });

  const [rutas, setRutas] = useState<RutaItem[]>([]);
  const [todasLasRutas, setTodasLasRutas] = useState<RutaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [totalResultados, setTotalResultados] = useState(0);

  // Extraer orígenes y destinos únicos de las rutas disponibles
  const { origenesDisponibles, destinosDisponibles, cooperativasDisponibles } = useMemo(() => {
    const origenes = [...new Set(todasLasRutas.map(r => r.origen).filter(Boolean))].sort();
    const destinos = [...new Set(todasLasRutas.map(r => r.destino).filter(Boolean))].sort();
    const cooperativas = [...new Set(todasLasRutas.map(r => r.cooperativa).filter(Boolean))].sort();
    return {
      origenesDisponibles: origenes,
      destinosDisponibles: destinos,
      cooperativasDisponibles: cooperativas
    };
  }, [todasLasRutas]);

  // Cargar todas las rutas al inicio
  useEffect(() => {
    cargarTodasLasRutas();
  }, []);

  const cargarTodasLasRutas = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('Cargando frecuencias desde el backend...');
      // Buscar sin filtros para obtener todas las rutas
      const response = await rutasApi.buscar({
        origen: '',
        destino: '',
        fecha: '',
        page: 0,
        size: 200,
      });
      
      console.log('Respuesta del backend:', response);
      
      if (!response.items || response.items.length === 0) {
        console.log('No se encontraron frecuencias disponibles');
        setRutas([]);
        setTodasLasRutas([]);
        setTotalResultados(0);
        return;
      }

      // Ordenar por fecha y hora
      const rutasOrdenadas = response.items.sort((a, b) => {
        // Si tienen fecha, ordenar por fecha primero
        if (a.fecha && b.fecha) {
          const fechaCompare = a.fecha.localeCompare(b.fecha);
          if (fechaCompare !== 0) return fechaCompare;
        }
        // Luego ordenar por hora
        return (a.horaSalida || '').localeCompare(b.horaSalida || '');
      });
      
      console.log(`Se cargaron ${rutasOrdenadas.length} frecuencias`);
      setRutas(rutasOrdenadas);
      setTodasLasRutas(rutasOrdenadas);
      setTotalResultados(response.total);
    } catch (err) {
      console.error('Error cargando rutas:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar rutas.';
      setError(`No se pudieron cargar las frecuencias. ${errorMessage}. Asegúrate de que el servidor esté activo.`);
      setRutas([]);
      setTodasLasRutas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await rutasApi.buscar(filtros);
      
      // Ordenar resultados por fecha y hora
      const rutasOrdenadas = response.items.sort((a, b) => {
        if (a.fecha && b.fecha) {
          const fechaCompare = a.fecha.localeCompare(b.fecha);
          if (fechaCompare !== 0) return fechaCompare;
        }
        return (a.horaSalida || '').localeCompare(b.horaSalida || '');
      });
      
      setRutas(rutasOrdenadas);
      setTotalResultados(response.total);
    } catch (err) {
      console.error('Error buscando rutas:', err);
      setError(err instanceof Error ? err.message : 'Error al buscar rutas. Intenta nuevamente.');
      setRutas([]);
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      origen: '',
      destino: '',
      fecha: '',
      cooperativa: '',
      tipoViaje: '',
      page: 0,
      size: 200,
    });
    setRutas(todasLasRutas);
    setTotalResultados(todasLasRutas.length);
  };

  const handleInputChange = (field: keyof BuscarRutasParams, value: string) => {
    setFiltros(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* Formulario de Búsqueda Principal */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bus className="w-7 h-7 text-blue-600" />
            Buscar Rutas
          </h2>
          <button
            onClick={cargarTodasLasRutas}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Actualizar rutas"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Origen */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Origen
            </label>
            <select
              value={filtros.origen}
              onChange={(e) => handleInputChange('origen', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-gray-900"
            >
              <option value="">Todos los orígenes</option>
              {origenesDisponibles.map(origen => (
                <option key={origen} value={origen}>{origen}</option>
              ))}
            </select>
          </div>

          {/* Destino */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Destino
            </label>
            <select
              value={filtros.destino}
              onChange={(e) => handleInputChange('destino', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-gray-900"
            >
              <option value="">Todos los destinos</option>
              {destinosDisponibles.map(destino => (
                <option key={destino} value={destino}>{destino}</option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha
            </label>
            <input
              type="date"
              value={filtros.fecha}
              onChange={(e) => handleInputChange('fecha', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-gray-900"
              placeholder="Todas las fechas"
            />
          </div>

          {/* Botones Buscar y Limpiar */}
          <div className="flex items-end gap-2">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              {loading ? 'Buscando...' : 'Filtrar'}
            </button>
            <button
              onClick={limpiarFiltros}
              disabled={loading}
              className="px-4 py-2.5 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition duration-200 disabled:bg-gray-50"
              title="Limpiar filtros"
            >
              Limpiar
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
            {/* Cooperativa */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Cooperativa
              </label>
              <select
                value={filtros.cooperativa}
                onChange={(e) => handleInputChange('cooperativa', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-gray-900"
              >
                <option value="">Todas las cooperativas</option>
                {cooperativasDisponibles.map(coop => (
                  <option key={coop} value={coop}>{coop}</option>
                ))}
              </select>
            </div>

            {/* Tipo de Viaje */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Tipo de Viaje
              </label>
              <select
                value={filtros.tipoViaje}
                onChange={(e) => handleInputChange('tipoViaje', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-gray-900"
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error al cargar frecuencias</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button 
              onClick={cargarTodasLasRutas}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Intentar nuevamente
            </button>
          </div>
        </div>
      )}

      {/* Resultados */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            Frecuencias Disponibles {totalResultados > 0 && `(${totalResultados})`}
          </h3>
        </div>

        {loading && (
          <div className="flex flex-col justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Cargando frecuencias...</p>
          </div>
        )}

        {!loading && rutas.length === 0 && !error && (
          <div className="text-center py-12">
            <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-900 font-medium">No hay frecuencias disponibles</p>
            <p className="text-gray-600 text-sm mt-2">
              {(filtros.origen || filtros.destino || filtros.fecha) 
                ? 'Intenta con otros filtros o limpia la búsqueda'
                : 'No hay frecuencias registradas en el sistema. Las cooperativas deben generar frecuencias primero.'}
            </p>
          </div>
        )}

        {!loading && rutas.length > 0 && (
          <div className="space-y-4">
            {rutas.map((ruta) => (
              <div
                key={`${ruta.frecuenciaId}-${ruta.fecha}`}
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

                    <div className="flex items-center gap-4 text-lg font-bold text-gray-900 mb-2">
                      <span>{ruta.origen}</span>
                      <span className="text-blue-600">→</span>
                      <span>{ruta.destino}</span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-700">
                      {ruta.fecha && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(ruta.fecha).toLocaleDateString('es-EC', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {ruta.horaSalida}
                      </span>
                      {ruta.duracionEstimada && (
                        <span>Duración: {ruta.duracionEstimada}</span>
                      )}
                    </div>

                    {/* Asientos Disponibles */}
                    <div className="flex gap-2 mt-2">
                      {Object.entries(ruta.asientosPorTipo).map(([tipo, cantidad]) => (
                        <span key={tipo} className="text-xs bg-gray-100 text-gray-900 px-2 py-1 rounded">
                          {tipo}: {cantidad} asientos
                        </span>
                      ))}
                    </div>

                    {/* Precio si está disponible */}
                    {(ruta.precio || ruta.precioBase) && (
                      <div className="mt-2">
                        <span className="text-lg font-bold text-green-600">
                          ${(ruta.precio || ruta.precioBase)?.toFixed(2)}
                        </span>
                      </div>
                    )}
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
