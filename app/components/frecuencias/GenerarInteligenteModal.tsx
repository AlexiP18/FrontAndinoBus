'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCooperativaConfig } from '@/app/context/CooperativaConfigContext';
import {
  Wand2,
  Calendar,
  Bus,
  Users,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  X,
  Play,
  Eye,
  Loader2,
  Trash2,
  ArrowRight,
  ArrowLeftRight,
  Route,
  Timer,
  Info,
  Filter,
  RotateCcw,
} from 'lucide-react';
import {
  generacionInteligenteApi,
  frecuenciasAdminApi,
  getToken,
  type EstadoGeneracionInteligente,
  type RutaCircuito,
  type RutaCircuitoRequest,
  type GenerarInteligenteRequest,
  type PreviewGeneracionInteligente,
  type ResultadoGeneracionInteligente,
  type FrecuenciaPreviewInteligente,
} from '@/lib/api';

interface Props {
  cooperativaId: number;
  isOpen: boolean;
  onClose: () => void;
  onGenerated?: () => void;
}

const DIAS_SEMANA = [
  { key: 'LUNES', label: 'Lun' },
  { key: 'MARTES', label: 'Mar' },
  { key: 'MIERCOLES', label: 'Mié' },
  { key: 'JUEVES', label: 'Jue' },
  { key: 'VIERNES', label: 'Vie' },
  { key: 'SABADO', label: 'Sáb' },
  { key: 'DOMINGO', label: 'Dom' },
];

type Paso = 'configurar' | 'preview' | 'resultado';

export default function GenerarInteligenteModal({ cooperativaId, isOpen, onClose, onGenerated }: Props) {
  const { styles } = useCooperativaConfig();
  const [paso, setPaso] = useState<Paso>('configurar');
  const [loading, setLoading] = useState(false);
  const [loadingEliminar, setLoadingEliminar] = useState(false);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // Estado del backend
  const [estado, setEstado] = useState<EstadoGeneracionInteligente | null>(null);

  // Formulario
  const [fechaInicio, setFechaInicio] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  });
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([
    'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'
  ]);
  const [rutasSeleccionadas, setRutasSeleccionadas] = useState<Set<string>>(new Set());
  const [permitirParadas, setPermitirParadas] = useState(true);
  const [maxParadasPersonalizado, setMaxParadasPersonalizado] = useState<number | undefined>(undefined);

  // Filtros de circuitos
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'INTERPROVINCIAL' | 'INTRAPROVINCIAL'>('TODOS');
  const [filtroOrigen, setFiltroOrigen] = useState<string>('');
  const [filtroDestino, setFiltroDestino] = useState<string>('');

  // Preview y resultado
  const [preview, setPreview] = useState<PreviewGeneracionInteligente | null>(null);
  const [resultado, setResultado] = useState<ResultadoGeneracionInteligente | null>(null);

  useEffect(() => {
    if (isOpen) {
      cargarEstado();
    }
  }, [isOpen, cooperativaId]);

  // Agrupar rutas por circuito (A↔B cuenta como 1 circuito) - ordenado alfabéticamente
  const circuitosDisponibles = useMemo(() => {
    if (!estado?.rutasCircuito) return [];
    
    const circuitos: Map<string, { ida: RutaCircuito; vuelta?: RutaCircuito }> = new Map();
    
    for (const ruta of estado.rutasCircuito) {
      const keyNormal = `${ruta.terminalOrigenId}-${ruta.terminalDestinoId}`;
      const keyInverso = `${ruta.terminalDestinoId}-${ruta.terminalOrigenId}`;
      
      if (circuitos.has(keyInverso)) {
        // Ya existe la ruta inversa, agregar como vuelta
        circuitos.get(keyInverso)!.vuelta = ruta;
      } else if (!circuitos.has(keyNormal)) {
        // Nueva ruta
        circuitos.set(keyNormal, { ida: ruta });
      }
    }
    
    // Ordenar alfabéticamente por nombre del terminal de origen
    return Array.from(circuitos.values()).sort((a, b) => {
      const nombreA = a.ida.terminalOrigenNombre?.toLowerCase() || '';
      const nombreB = b.ida.terminalOrigenNombre?.toLowerCase() || '';
      if (nombreA !== nombreB) return nombreA.localeCompare(nombreB);
      // Si tienen el mismo origen, ordenar por destino
      const destinoA = a.ida.terminalDestinoNombre?.toLowerCase() || '';
      const destinoB = b.ida.terminalDestinoNombre?.toLowerCase() || '';
      return destinoA.localeCompare(destinoB);
    });
  }, [estado?.rutasCircuito]);

  // Obtener lista única de terminales para los filtros
  const terminalesUnicos = useMemo(() => {
    if (!circuitosDisponibles.length) return { origenes: [], destinos: [] };
    
    const origenes = new Set<string>();
    const destinos = new Set<string>();
    
    for (const circuito of circuitosDisponibles) {
      if (circuito.ida.terminalOrigenNombre) {
        origenes.add(circuito.ida.terminalOrigenNombre);
      }
      if (circuito.ida.terminalDestinoNombre) {
        destinos.add(circuito.ida.terminalDestinoNombre);
      }
    }
    
    return {
      origenes: Array.from(origenes).sort((a, b) => a.localeCompare(b)),
      destinos: Array.from(destinos).sort((a, b) => a.localeCompare(b)),
    };
  }, [circuitosDisponibles]);

  // Filtrar circuitos según los filtros seleccionados
  const circuitosFiltrados = useMemo(() => {
    return circuitosDisponibles.filter((circuito) => {
      // Filtro por tipo
      if (filtroTipo !== 'TODOS') {
        if (circuito.ida.tipoFrecuencia !== filtroTipo) return false;
      }
      
      // Filtro por origen
      if (filtroOrigen && circuito.ida.terminalOrigenNombre !== filtroOrigen) {
        return false;
      }
      
      // Filtro por destino
      if (filtroDestino && circuito.ida.terminalDestinoNombre !== filtroDestino) {
        return false;
      }
      
      return true;
    });
  }, [circuitosDisponibles, filtroTipo, filtroOrigen, filtroDestino]);

  const cargarEstado = async () => {
    try {
      setLoading(true);
      setError('');
      const token = getToken();
      const estadoData = await generacionInteligenteApi.getEstado(cooperativaId, token || '');
      setEstado(estadoData);
    } catch (err) {
      console.error('Error cargando estado:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const toggleDia = (dia: string) => {
    setDiasSeleccionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  const toggleCircuito = (ida: RutaCircuito) => {
    const key = `${ida.terminalOrigenId}-${ida.terminalDestinoId}`;
    setRutasSeleccionadas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const seleccionarTodos = () => {
    // Seleccionar solo los circuitos filtrados actualmente
    const allKeys = circuitosFiltrados.map(c => 
      `${c.ida.terminalOrigenId}-${c.ida.terminalDestinoId}`
    );
    setRutasSeleccionadas(prev => {
      const newSet = new Set(prev);
      allKeys.forEach(key => newSet.add(key));
      return newSet;
    });
  };

  const limpiarSeleccion = () => {
    // Limpiar solo los circuitos filtrados actualmente
    const filteredKeys = new Set(
      circuitosFiltrados.map(c => `${c.ida.terminalOrigenId}-${c.ida.terminalDestinoId}`)
    );
    setRutasSeleccionadas(prev => {
      const newSet = new Set(prev);
      filteredKeys.forEach(key => newSet.delete(key));
      return newSet;
    });
  };

  const limpiarTodo = () => {
    setRutasSeleccionadas(new Set());
  };

  const buildRequest = (): GenerarInteligenteRequest => {
    const rutasCircuito: RutaCircuitoRequest[] = [];
    
    for (const key of rutasSeleccionadas) {
      const circuito = circuitosDisponibles.find(c => 
        `${c.ida.terminalOrigenId}-${c.ida.terminalDestinoId}` === key
      );
      
      if (circuito) {
        // Solo agregamos la ruta de ida, el backend genera automáticamente la vuelta
        rutasCircuito.push({
          terminalOrigenId: circuito.ida.terminalOrigenId,
          terminalOrigenNombre: circuito.ida.terminalOrigenNombre,
          terminalDestinoId: circuito.ida.terminalDestinoId,
          terminalDestinoNombre: circuito.ida.terminalDestinoNombre,
          distanciaKm: circuito.ida.distanciaKm,
          duracionMinutos: circuito.ida.duracionMinutos,
          precioBase: circuito.ida.precioSugerido,
          habilitarParadas: permitirParadas && circuito.ida.tipoFrecuencia === 'INTERPROVINCIAL',
          maxParadas: maxParadasPersonalizado || circuito.ida.maxParadasPermitidas,
        });
      }
    }

    return {
      fechaInicio,
      fechaFin,
      diasOperacion: diasSeleccionados,
      rutasCircuito,
      permitirParadas,
      maxParadasPersonalizado,
    };
  };

  const handlePreview = async () => {
    if (rutasSeleccionadas.size === 0) {
      setError('Debe seleccionar al menos un circuito');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = getToken();
      const request = buildRequest();
      
      const previewData = await generacionInteligenteApi.preview(cooperativaId, request, token || '');
      setPreview(previewData);
      setPaso('preview');
    } catch (err) {
      console.error('Error en preview:', err);
      setError(err instanceof Error ? err.message : 'Error al generar preview');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerar = async () => {
    try {
      setLoading(true);
      setError('');
      const token = getToken();
      const request = buildRequest();

      const resultadoData = await generacionInteligenteApi.generar(cooperativaId, request, token || '');
      setResultado(resultadoData);
      setPaso('resultado');
      onGenerated?.();
    } catch (err) {
      console.error('Error generando:', err);
      setError(err instanceof Error ? err.message : 'Error al generar frecuencias');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarTodas = async () => {
    const confirmar = window.confirm(
      '⚠️ ¿Estás seguro de ELIMINAR TODAS las frecuencias de esta cooperativa?\n\n' +
      'Esta acción desactivará TODAS las frecuencias generadas.\n' +
      'Esta acción no se puede deshacer.'
    );

    if (!confirmar) return;

    try {
      setLoadingEliminar(true);
      setError('');
      setMensajeExito('');
      const token = getToken();

      const resultado = await frecuenciasAdminApi.deleteAllByCooperativa(cooperativaId, token || '');
      setMensajeExito(`✅ Se eliminaron ${resultado.count} frecuencias correctamente`);
      
      await cargarEstado();
      onGenerated?.();
    } catch (err) {
      console.error('Error eliminando frecuencias:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar frecuencias');
    } finally {
      setLoadingEliminar(false);
    }
  };

  const handleCerrar = () => {
    setPaso('configurar');
    setPreview(null);
    setResultado(null);
    setError('');
    setMensajeExito('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div 
          className="p-4 border-b flex justify-between items-center text-white"
          style={{ background: `linear-gradient(135deg, ${styles.primary} 0%, ${styles.primaryDark} 100%)` }}
        >
          <div className="flex items-center gap-3">
            <Wand2 className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Generar Frecuencias</h2>
              <p className="text-sm opacity-80">
                {paso === 'configurar' && 'Selecciona los circuitos y configura la generación'}
                {paso === 'preview' && 'Revisa las frecuencias calculadas'}
                {paso === 'resultado' && 'Resultados de la generación'}
              </p>
            </div>
          </div>
          <button onClick={handleCerrar} className="p-2 hover:bg-white/20 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          )}

          {mensajeExito && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {mensajeExito}
            </div>
          )}

          {loading && !estado && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: styles.primary }} />
            </div>
          )}

          {/* PASO 1: CONFIGURAR */}
          {paso === 'configurar' && estado && (
            <div className="space-y-6">
              {/* Info Panel */}
              <div 
                className="rounded-lg p-4 border bg-transparent"
                style={{ borderColor: styles.primary }}
              >
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: styles.primary }} />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1 text-gray-900">¿Cómo funciona la generación inteligente?</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Los buses operan en <strong>circuitos de ida y vuelta</strong></li>
                      <li>Se respetan tiempos de descanso: {estado.configuracion.descansoIntraprovincialMin}min (intraprov) / {estado.configuracion.descansoInterprovincialMin}min (interprov)</li>
                      <li>Choferes trabajan máximo {estado.configuracion.maxHorasChofer}h diarias</li>
                      <li>Paradas intermedias solo en viajes interprovinciales (&gt;{estado.configuracion.umbralInterprovincialKm}km)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <Bus className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-blue-900">{estado.busesDisponibles}</p>
                  <p className="text-xs text-blue-600">Buses</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <Users className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-purple-900">{estado.choferesDisponibles}</p>
                  <p className="text-xs text-purple-600">Choferes</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <MapPin className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-900">{estado.terminalesHabilitados}</p>
                  <p className="text-xs text-green-600">Terminales</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg text-center">
                  <Route className="w-6 h-6 text-amber-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-amber-900">{circuitosDisponibles.length}</p>
                  <p className="text-xs text-amber-600">Circuitos</p>
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Fecha fin
                  </label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 bg-white"
                  />
                </div>
              </div>

              {/* Días de la semana */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Días de operación
                </label>
                <div className="flex gap-2 flex-wrap">
                  {DIAS_SEMANA.map((dia) => (
                    <button
                      key={dia.key}
                      type="button"
                      onClick={() => toggleDia(dia.key)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        diasSeleccionados.includes(dia.key)
                          ? 'text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      style={diasSeleccionados.includes(dia.key) ? { backgroundColor: styles.primary } : {}}
                    >
                      {dia.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selección de Circuitos */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-900">
                    <ArrowLeftRight className="w-4 h-4 inline mr-1" />
                    Circuitos de ida y vuelta
                  </label>
                  <div className="flex gap-2">
                    <button 
                      onClick={seleccionarTodos} 
                      className="text-xs hover:opacity-80"
                      style={{ color: styles.primary }}
                    >
                      Seleccionar filtrados
                    </button>
                    <button onClick={limpiarSeleccion} className="text-xs text-orange-600 hover:text-orange-800">
                      Limpiar filtrados
                    </button>
                    <button onClick={limpiarTodo} className="text-xs text-red-600 hover:text-red-800">
                      Limpiar todo
                    </button>
                  </div>
                </div>

                {/* Filtros de circuitos */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">Filtros</span>
                    {(filtroTipo !== 'TODOS' || filtroOrigen || filtroDestino) && (
                      <button
                        onClick={() => {
                          setFiltroTipo('TODOS');
                          setFiltroOrigen('');
                          setFiltroDestino('');
                        }}
                        className="ml-auto text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Filtro por tipo */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Tipo</label>
                      <select
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value as 'TODOS' | 'INTERPROVINCIAL' | 'INTRAPROVINCIAL')}
                        className="w-full border border-gray-300 rounded-md p-1.5 text-sm bg-white text-gray-900"
                      >
                        <option value="TODOS">Todos</option>
                        <option value="INTERPROVINCIAL">Interprovincial</option>
                        <option value="INTRAPROVINCIAL">Intraprovincial</option>
                      </select>
                    </div>
                    {/* Filtro por origen */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Terminal Origen</label>
                      <select
                        value={filtroOrigen}
                        onChange={(e) => setFiltroOrigen(e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-1.5 text-sm bg-white text-gray-900"
                      >
                        <option value="">Todos los orígenes</option>
                        {terminalesUnicos.origenes.map((terminal) => (
                          <option key={terminal} value={terminal}>{terminal}</option>
                        ))}
                      </select>
                    </div>
                    {/* Filtro por destino */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Terminal Destino</label>
                      <select
                        value={filtroDestino}
                        onChange={(e) => setFiltroDestino(e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-1.5 text-sm bg-white text-gray-900"
                      >
                        <option value="">Todos los destinos</option>
                        {terminalesUnicos.destinos.map((terminal) => (
                          <option key={terminal} value={terminal}>{terminal}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {/* Indicador de filtros activos */}
                  {(filtroTipo !== 'TODOS' || filtroOrigen || filtroDestino) && (
                    <div className="mt-2 text-xs text-gray-500">
                      Mostrando {circuitosFiltrados.length} de {circuitosDisponibles.length} circuitos
                    </div>
                  )}
                </div>
                
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {circuitosFiltrados.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {circuitosDisponibles.length === 0 
                        ? 'No hay circuitos disponibles. Asigne terminales a la cooperativa.'
                        : 'No hay circuitos que coincidan con los filtros seleccionados.'}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {circuitosFiltrados.map((circuito) => {
                        const key = `${circuito.ida.terminalOrigenId}-${circuito.ida.terminalDestinoId}`;
                        const seleccionado = rutasSeleccionadas.has(key);
                        const esInterprov = circuito.ida.tipoFrecuencia === 'INTERPROVINCIAL';
                        
                        return (
                          <label
                            key={key}
                            className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 ${
                              seleccionado ? 'bg-indigo-50' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={seleccionado}
                              onChange={() => toggleCircuito(circuito.ida)}
                              className="w-4 h-4 rounded coop-checkbox"
                              style={{ accentColor: styles.primary }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {circuito.ida.terminalOrigenNombre}
                                </span>
                                <ArrowLeftRight className="w-4 h-4 text-gray-400" />
                                <span className="font-medium text-gray-900">
                                  {circuito.ida.terminalDestinoNombre}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  esInterprov 
                                    ? 'bg-purple-100 text-purple-700' 
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {esInterprov ? 'Interprov.' : 'Intraprov.'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1 flex gap-4">
                                <span>{circuito.ida.distanciaKm} km</span>
                                <span>~{circuito.ida.duracionMinutos} min</span>
                                <span>${circuito.ida.precioSugerido}</span>
                                {esInterprov && (
                                  <span className="text-purple-600">
                                    Máx {circuito.ida.maxParadasPermitidas} paradas
                                  </span>
                                )}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {rutasSeleccionadas.size} de {circuitosDisponibles.length} circuitos seleccionados
                </p>
              </div>

              {/* Opciones de Paradas */}
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permitirParadas}
                    onChange={(e) => setPermitirParadas(e.target.checked)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: styles.primary }}
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Permitir paradas intermedias (solo viajes interprovinciales)
                  </span>
                </label>
                
                {permitirParadas && (
                  <div className="mt-3 ml-6">
                    <label className="block text-xs text-gray-900 mb-1">
                      Máximo de paradas personalizado (opcional)
                    </label>
                    <select
                      value={maxParadasPersonalizado || ''}
                      onChange={(e) => setMaxParadasPersonalizado(e.target.value ? Number(e.target.value) : undefined)}
                      className="border border-gray-300 rounded p-1 text-sm bg-white text-gray-900"
                    >
                      <option value="">Usar regla automática</option>
                      <option value="1">1 parada</option>
                      <option value="2">2 paradas</option>
                      <option value="3">3 paradas</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Regla automática: 1-3h = 1 parada, 4-6h = 2 paradas, &gt;8h = 3 paradas
                    </p>
                  </div>
                )}
              </div>

              {/* Capacidad estimada */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <Timer className="w-4 h-4 inline mr-1" />
                  <strong>Capacidad estimada:</strong> ~{estado.capacidadEstimadaDiaria} viajes/día 
                  con {estado.busesDisponibles} buses
                </p>
              </div>

              {/* Botón eliminar todas */}
              <div className="border-t pt-4">
                <button
                  onClick={handleEliminarTodas}
                  disabled={loadingEliminar}
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  {loadingEliminar ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Eliminar todas las frecuencias existentes
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: PREVIEW */}
          {paso === 'preview' && preview && (
            <div className="space-y-6">
              {/* Nota explicativa */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">¿Cómo funciona?</p>
                  <p>Se crearán <strong>{preview.frecuenciasPorDia} frecuencias únicas</strong> (horarios de salida) que operarán durante <strong>{preview.diasOperacion} días</strong> de la semana, generando un total de <strong>{preview.totalFrecuencias} viajes programados</strong>.</p>
                </div>
              </div>

              {/* Resumen */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-indigo-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-indigo-900">{preview.totalFrecuencias}</p>
                  <p className="text-sm text-indigo-600">Viajes totales</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-900">{preview.frecuenciasPorDia}</p>
                  <p className="text-sm text-green-600">Frecuencias únicas</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-900">{preview.diasOperacion}</p>
                  <p className="text-sm text-blue-600">Días operación</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-purple-900">{preview.busesUtilizados}/{preview.busesDisponibles}</p>
                  <p className="text-sm text-purple-600">Buses usados</p>
                </div>
              </div>

              {/* Advertencias y errores */}
              {preview.errores.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="font-medium text-red-800 mb-2">Errores:</p>
                  <ul className="list-disc list-inside text-sm text-red-700">
                    {preview.errores.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}

              {preview.advertencias.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="font-medium text-amber-800 mb-2">Advertencias:</p>
                  <ul className="list-disc list-inside text-sm text-amber-700">
                    {preview.advertencias.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}

              {/* Frecuencias por ruta */}
              {Object.keys(preview.frecuenciasPorRuta).length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Viajes por ruta:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(preview.frecuenciasPorRuta).map(([ruta, count]) => (
                      <div key={ruta} className="bg-gray-50 p-2 rounded flex justify-between">
                        <span className="text-sm text-gray-900">{ruta}</span>
                        <span className="font-medium" style={{ color: styles.primary }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Frecuencias por bus */}
              {Object.keys(preview.frecuenciasPorBus).length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Viajes por bus:</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(preview.frecuenciasPorBus).map(([bus, count]) => (
                      <div key={bus} className="bg-blue-50 px-3 py-1 rounded-full text-sm text-gray-900">
                        <Bus className="w-3 h-3 inline mr-1" />
                        {bus}: <strong>{count}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabla de preview */}
              {preview.frecuencias.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Vista previa de viajes (mostrando 20 de {preview.totalFrecuencias} viajes):
                  </h4>
                  <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="p-2 text-left text-gray-900">Fecha</th>
                          <th className="p-2 text-left text-gray-900">Hora</th>
                          <th className="p-2 text-left text-gray-900">Ruta</th>
                          <th className="p-2 text-left text-gray-900">Bus</th>
                          <th className="p-2 text-left text-gray-900">Tipo</th>
                          <th className="p-2 text-left text-gray-900">Sentido</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {preview.frecuencias.slice(0, 20).map((f, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="p-2 text-gray-900">{f.fecha}</td>
                            <td className="p-2 text-gray-900">{f.horaSalida}</td>
                            <td className="p-2 text-gray-900">
                              {f.terminalOrigenNombre} → {f.terminalDestinoNombre}
                            </td>
                            <td className="p-2 text-gray-900">{f.busPlaca}</td>
                            <td className="p-2">
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                f.tipoFrecuencia === 'INTERPROVINCIAL'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {f.tipoFrecuencia === 'INTERPROVINCIAL' ? 'Inter' : 'Intra'}
                              </span>
                            </td>
                            <td className="p-2">
                              <span className={`text-xs ${
                                f.esViajeDe === 'IDA' ? 'text-green-600' : 'text-orange-600'
                              }`}>
                                {f.esViajeDe}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 3: RESULTADO */}
          {paso === 'resultado' && resultado && (
            <div className="text-center py-8">
              {resultado.exito ? (
                <>
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    ¡Frecuencias generadas exitosamente!
                  </h3>
                  <p className="text-lg text-gray-600 mb-4">
                    Se crearon <strong>{resultado.frecuenciasCreadas}</strong> frecuencias únicas
                  </p>
                  <p className="text-sm text-gray-500">
                    Estas frecuencias operarán todos los días seleccionados.
                  </p>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Error en la generación
                  </h3>
                </>
              )}

              {resultado.mensajes.length > 0 && (
                <div className="mt-4 text-left max-w-md mx-auto">
                  {resultado.mensajes.map((m, i) => (
                    <p key={i} className="text-sm text-gray-600">{m}</p>
                  ))}
                </div>
              )}

              {resultado.advertencias.length > 0 && (
                <div className="mt-4 bg-amber-50 p-3 rounded-lg text-left max-w-md mx-auto">
                  {resultado.advertencias.map((a, i) => (
                    <p key={i} className="text-sm text-amber-700">{a}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between">
          <button
            onClick={paso === 'configurar' ? handleCerrar : () => setPaso('configurar')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            {paso === 'configurar' ? 'Cancelar' : 'Volver'}
          </button>

          <div className="flex gap-2">
            {paso === 'configurar' && (
              <button
                onClick={handlePreview}
                disabled={loading || rutasSeleccionadas.size === 0}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg disabled:opacity-50 transition-colors"
                style={{ backgroundColor: styles.primary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.primaryDark}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.primary}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                Vista previa
              </button>
            )}

            {paso === 'preview' && preview?.esViable && (
              <button
                onClick={handleGenerar}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg disabled:opacity-50 transition-colors"
                style={{ backgroundColor: styles.primary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.primaryDark}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.primary}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Generar frecuencias
              </button>
            )}

            {paso === 'resultado' && (
              <button
                onClick={handleCerrar}
                className="px-4 py-2 text-white rounded-lg transition-colors"
                style={{ backgroundColor: styles.primary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.primaryDark}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.primary}
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
