'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, MapPin, Filter, Bus, Clock, RefreshCw, AlertCircle, Navigation, Loader2 } from 'lucide-react';
import { rutasApi, type BuscarRutasParams, type RutaItem } from '@/lib/api';
import { TIPOS_VIAJE } from '@/lib/constants';
import { getUserLocation, type LocationInfo } from '@/lib/geolocation';

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
  
  // Estado para filtro de día seleccionado (se inicializa en useEffect)
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>('');
  
  // Estados para geolocalización
  const [ubicacionUsuario, setUbicacionUsuario] = useState<LocationInfo | null>(null);
  const [loadingUbicacion, setLoadingUbicacion] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ubicacionError, setUbicacionError] = useState<string | null>(null);

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

  // Generar opciones de días de la semana (Lunes a Domingo)
  const opcionesDias = useMemo(() => {
    const hoy = new Date();
    const diaActualSemana = hoy.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    const fechaHoy = hoy.toISOString().split('T')[0];
    
    const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dias: { key: string; label: string; fecha: string; esHoy: boolean }[] = [];
    
    // Crear array ordenado empezando por Lunes (1) hasta Domingo (0)
    const ordenDias = [1, 2, 3, 4, 5, 6, 0]; // Lunes a Domingo
    
    ordenDias.forEach((numeroDia) => {
      // Calcular cuántos días faltan para ese día de la semana
      let diasHasta = numeroDia - diaActualSemana;
      if (diasHasta < 0) diasHasta += 7; // Si ya pasó esta semana, ir a la siguiente
      
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + diasHasta);
      const fechaStr = fecha.toISOString().split('T')[0];
      
      dias.push({
        key: nombresDias[numeroDia].toLowerCase(),
        label: nombresDias[numeroDia],
        fecha: fechaStr,
        esHoy: fechaStr === fechaHoy
      });
    });
    
    return dias;
  }, []);

  // Inicializar con el día actual
  useEffect(() => {
    const hoy = new Date();
    const nombresDias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    setDiaSeleccionado(nombresDias[hoy.getDay()]);
  }, []);

  // Filtrar rutas por día seleccionado y hora (solo para hoy)
  // Nota: El backend devuelve las frecuencias sin filtrar por día de la semana,
  // así que mostramos todas las rutas disponibles para cualquier día seleccionado.
  // Solo aplicamos el filtro de hora para el día de hoy.
  const rutasFiltradas = useMemo(() => {
    const diaEncontrado = opcionesDias.find(d => d.key === diaSeleccionado);
    if (!diaEncontrado) return rutas;
    
    const ahora = new Date();
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes(); // minutos desde medianoche
    const esHoy = diaEncontrado.esHoy;
    
    // Para el día de hoy, filtrar por hora (solo mostrar frecuencias futuras)
    // Para otros días, mostrar todas las frecuencias
    return rutas
      .filter(ruta => {
        // Si es hoy, filtrar por hora
        if (esHoy && ruta.horaSalida) {
          const [horas, minutos] = ruta.horaSalida.split(':').map(Number);
          const horaRuta = horas * 60 + minutos;
          // Agregar 5 minutos de margen (mostrar rutas que salen en los próximos minutos)
          if (horaRuta < horaActual - 5) return false;
        }
        return true;
      })
      .map(ruta => ({
        ...ruta,
        // Asignar la fecha del día seleccionado
        fecha: diaEncontrado.fecha
      }));
  }, [rutas, diaSeleccionado, opcionesDias]);

  // Cargar todas las rutas al inicio
  useEffect(() => {
    cargarTodasLasRutas();
  }, []);

  /**
   * Normaliza un string para comparación (quita acentos, minúsculas, espacios extra)
   */
  const normalizarTexto = (texto: string): string => {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/\s+/g, ' ')
      .trim();
  };

  /**
   * Busca el origen más cercano/coincidente de los disponibles
   */
  const buscarOrigenCoincidente = (ciudadDetectada: string, provincia?: string | null): string | null => {
    const ciudadNorm = normalizarTexto(ciudadDetectada);
    const provinciaNorm = provincia ? normalizarTexto(provincia) : '';
    
    // 1. Buscar coincidencia exacta
    const coincidenciaExacta = origenesDisponibles.find(
      origen => normalizarTexto(origen) === ciudadNorm
    );
    if (coincidenciaExacta) return coincidenciaExacta;
    
    // 2. Buscar si el origen contiene la ciudad detectada
    const origenConCiudad = origenesDisponibles.find(
      origen => normalizarTexto(origen).includes(ciudadNorm)
    );
    if (origenConCiudad) return origenConCiudad;
    
    // 3. Buscar si la ciudad detectada contiene algún origen
    const ciudadConOrigen = origenesDisponibles.find(
      origen => ciudadNorm.includes(normalizarTexto(origen))
    );
    if (ciudadConOrigen) return ciudadConOrigen;
    
    // 4. Buscar por provincia si está disponible
    if (provinciaNorm) {
      const origenEnProvincia = origenesDisponibles.find(
        origen => normalizarTexto(origen).includes(provinciaNorm) || 
                 provinciaNorm.includes(normalizarTexto(origen))
      );
      if (origenEnProvincia) return origenEnProvincia;
    }
    
    // 5. Buscar coincidencia parcial (al menos 4 caracteres comunes)
    const coincidenciaParcial = origenesDisponibles.find(origen => {
      const origenNorm = normalizarTexto(origen);
      // Verificar si comparten al menos 4 caracteres consecutivos
      for (let i = 0; i <= ciudadNorm.length - 4; i++) {
        const substring = ciudadNorm.substring(i, i + 4);
        if (origenNorm.includes(substring)) return true;
      }
      return false;
    });
    if (coincidenciaParcial) return coincidenciaParcial;
    
    return null;
  };

  // Función para obtener ubicación del usuario (solo cuando el usuario lo solicita)
  const obtenerUbicacion = async () => {
    if (loadingUbicacion) return;
    
    setLoadingUbicacion(true);
    setUbicacionError(null);
    
    try {
      const locationInfo = await getUserLocation();
      setUbicacionUsuario(locationInfo);
      console.log('Ubicación detectada:', locationInfo);
      console.log('Orígenes disponibles:', origenesDisponibles);
      
      // Si hay ciudades detectadas y rutas disponibles, actualizar el filtro de origen
      if ((locationInfo.city || locationInfo.province) && origenesDisponibles.length > 0) {
        // Buscar coincidencia inteligente
        const origenCoincidente = buscarOrigenCoincidente(
          locationInfo.city || locationInfo.province || '', 
          locationInfo.province
        );
        
        if (origenCoincidente) {
          setFiltros(prev => ({ ...prev, origen: origenCoincidente }));
          console.log(`Origen auto-seleccionado: ${origenCoincidente}`);
        } else {
          // No hay coincidencia - mostrar mensaje informativo
          setUbicacionError(`no_rutas:${locationInfo.displayName}`);
        }
      } else if (origenesDisponibles.length === 0) {
        setUbicacionError('No hay rutas disponibles en el sistema.');
      }
    } catch (error: unknown) {
      let errorMsg = 'Error al obtener ubicación';
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const errObj = error as { message?: string; code?: number };
        errorMsg = errObj.message || `Error de geolocalización`;
      }
      console.warn('No se pudo obtener ubicación:', errorMsg);
      setUbicacionError(errorMsg);
    } finally {
      setLoadingUbicacion(false);
    }
  };

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
    // Al limpiar filtros, también resetear ubicación detectada y volver al día actual
    setUbicacionUsuario(null);
    setUbicacionError(null);
    const hoy = new Date();
    const nombresDias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    setDiaSeleccionado(nombresDias[hoy.getDay()]);
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
              {loadingUbicacion && (
                <span className="ml-2 text-blue-500 text-xs">
                  <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                  Detectando...
                </span>
              )}
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
            {/* Indicador de ubicación */}
            <div className="mt-1 text-xs">
              {loadingUbicacion ? (
                <span className="flex items-center gap-1 text-blue-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Detectando tu ubicación...
                </span>
              ) : ubicacionUsuario && filtros.origen ? (
                <span className="flex items-center gap-1 text-green-600">
                  <Navigation className="w-3 h-3" />
                  Origen detectado: {ubicacionUsuario.displayName}
                </span>
              ) : ubicacionError?.startsWith('no_rutas:') ? (
                <div className="text-amber-600">
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>
                      Tu ubicación es <strong>{ubicacionError.replace('no_rutas:', '')}</strong>
                    </span>
                  </div>
                  <p className="mt-0.5 text-gray-600">
                    No existen frecuencias desde tu ubicación actual. Por favor, selecciona el origen manualmente.
                  </p>
                </div>
              ) : !ubicacionUsuario && !loadingUbicacion && !ubicacionError ? (
                <button 
                  onClick={obtenerUbicacion}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <Navigation className="w-3 h-3" />
                  Usar mi ubicación actual
                </button>
              ) : ubicacionError ? (
                <div className="text-amber-600">
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>No se pudo detectar tu ubicación</span>
                  </div>
                  <button 
                    onClick={obtenerUbicacion}
                    className="text-blue-600 hover:underline mt-0.5"
                  >
                    Reintentar
                  </button>
                </div>
              ) : null}
            </div>
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
        {/* Filtros por día */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Selecciona el día
          </h4>
          <div className="flex flex-wrap gap-2">
            {opcionesDias.map((dia) => {
              const rutasDelDia = rutas.filter(r => r.fecha === dia.fecha);
              const cantidadRutas = dia.esHoy 
                ? rutasDelDia.filter(r => {
                    if (!r.horaSalida) return true;
                    const ahora = new Date();
                    const horaActual = ahora.getHours() * 60 + ahora.getMinutes();
                    const [horas, minutos] = r.horaSalida.split(':').map(Number);
                    return (horas * 60 + minutos) >= horaActual - 5;
                  }).length
                : rutasDelDia.length;
              
              return (
                <button
                  key={dia.key}
                  onClick={() => setDiaSeleccionado(dia.key)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                    diaSeleccionado === dia.key
                      ? 'bg-blue-600 text-white shadow-md'
                      : dia.esHoy 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200 ring-2 ring-green-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{dia.label}</span>
                  {dia.esHoy && diaSeleccionado !== dia.key && (
                    <span className="text-xs">(Hoy)</span>
                  )}
                  {cantidadRutas > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      diaSeleccionado === dia.key 
                        ? 'bg-blue-500 text-white' 
                        : dia.esHoy
                          ? 'bg-green-200 text-green-700'
                          : 'bg-gray-200 text-gray-600'
                    }`}>
                      {cantidadRutas}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {opcionesDias.find(d => d.key === diaSeleccionado)?.esHoy && (
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Solo se muestran frecuencias a partir de la hora actual
            </p>
          )}
        </div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            Frecuencias Disponibles {rutasFiltradas.length > 0 && `(${rutasFiltradas.length})`}
          </h3>
        </div>

        {loading && (
          <div className="flex flex-col justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Cargando frecuencias...</p>
          </div>
        )}

        {!loading && rutasFiltradas.length === 0 && !error && (
          <div className="text-center py-12">
            <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-900 font-medium">No hay frecuencias disponibles</p>
            <p className="text-gray-600 text-sm mt-2">
              {opcionesDias.find(d => d.key === diaSeleccionado)?.esHoy 
                ? 'No hay más frecuencias disponibles para hoy. Prueba seleccionando otro día.'
                : (filtros.origen || filtros.destino || filtros.fecha) 
                  ? 'Intenta con otros filtros o limpia la búsqueda'
                  : 'No hay frecuencias registradas para este día.'}
            </p>
          </div>
        )}

        {!loading && rutasFiltradas.length > 0 && (
          <div className="space-y-4">
            {rutasFiltradas.map((ruta) => (
              <div
                key={`${ruta.frecuenciaId}-${ruta.fecha}`}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => onSelectRuta && onSelectRuta(ruta)}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  {/* Información de la Ruta */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <div className="bg-blue-100 px-3 py-1 rounded-full">
                        <span className="text-blue-800 font-semibold text-sm">{ruta.cooperativa}</span>
                      </div>
                      {ruta.busPlaca && (
                        <div className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                          <Bus className="w-3.5 h-3.5 text-gray-600" />
                          <span className="text-gray-700 font-medium text-sm">{ruta.busPlaca}</span>
                        </div>
                      )}
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
