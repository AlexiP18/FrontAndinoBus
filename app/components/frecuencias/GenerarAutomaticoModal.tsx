'use client';

import { useState, useEffect } from 'react';
import {
  Wand2,
  Calendar,
  Bus,
  Users,
  Clock,
  DollarSign,
  MapPin,
  AlertTriangle,
  CheckCircle,
  X,
  Play,
  Eye,
  ChevronDown,
  ChevronUp,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  generacionAutomaticaApi,
  frecuenciasAdminApi,
  getToken,
  type EstadoGeneracion,
  type RutaDisponibleAuto,
  type GenerarAutomaticoRequest,
  type PreviewAutomaticoResponse,
  type ResultadoGeneracionAutomatica,
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

export default function GenerarAutomaticoModal({
  cooperativaId,
  isOpen,
  onClose,
  onGenerated,
}: Props) {
  const [paso, setPaso] = useState<Paso>('configurar');
  const [loading, setLoading] = useState(false);
  const [loadingEliminar, setLoadingEliminar] = useState(false);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // Estado de generación
  const [estado, setEstado] = useState<EstadoGeneracion | null>(null);
  const [modoRutas, setModoRutas] = useState<'todas' | 'seleccionadas'>('todas');
  const [rutasSeleccionadas, setRutasSeleccionadas] = useState<Set<string>>(new Set());

  // Formulario
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>(
    DIAS_SEMANA.map((d) => d.key)
  );
  const [horaInicio, setHoraInicio] = useState('05:00');
  const [horaFin, setHoraFin] = useState('21:00');
  const [intervaloMinutos, setIntervaloMinutos] = useState(60);
  const [duracionViaje, setDuracionViaje] = useState(120);
  const [precioBase, setPrecioBase] = useState(5.0);
  const [asignarChoferes, setAsignarChoferes] = useState(true);

  // Preview y resultado
  const [preview, setPreview] = useState<PreviewAutomaticoResponse | null>(null);
  const [resultado, setResultado] = useState<ResultadoGeneracionAutomatica | null>(null);
  const [showPreviewList, setShowPreviewList] = useState(false);

  useEffect(() => {
    if (isOpen) {
      cargarEstado();
    }
  }, [isOpen, cooperativaId]);

  const toggleRutaSeleccionada = (rutaKey: string) => {
    setRutasSeleccionadas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rutaKey)) {
        newSet.delete(rutaKey);
      } else {
        newSet.add(rutaKey);
      }
      return newSet;
    });
  };

  const seleccionarTodasRutas = () => {
    if (estado?.rutasDisponibles) {
      const allKeys = estado.rutasDisponibles.map(r => `${r.terminalOrigenId}-${r.terminalDestinoId}`);
      setRutasSeleccionadas(new Set(allKeys));
    }
  };

  const deseleccionarTodasRutas = () => {
    setRutasSeleccionadas(new Set());
  };

  const cargarEstado = async () => {
    try {
      setLoading(true);
      setError('');
      const token = getToken();
      const estadoData = await generacionAutomaticaApi.getEstado(cooperativaId, token || '');
      setEstado(estadoData);

      // Por defecto, modo "todas las rutas"
      setModoRutas('todas');

      // Aplicar configuración de la cooperativa
      if (estadoData.configuracion) {
        setHoraInicio(estadoData.configuracion.horaInicio || '05:00');
        setHoraFin(estadoData.configuracion.horaFin || '21:00');
        setIntervaloMinutos(estadoData.configuracion.intervaloMinimoFrecuencias || 60);
      }
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

  const buildRequest = (): GenerarAutomaticoRequest => {
    const baseRequest: GenerarAutomaticoRequest = {
      fechaInicio,
      fechaFin,
      diasOperacion: diasSeleccionados,
      horaInicio,
      horaFin,
      intervaloMinutos,
      precioBase,
      asignarChoferesAutomaticamente: asignarChoferes,
    };

    if (modoRutas === 'todas') {
      return {
        ...baseRequest,
        generarTodasLasRutas: true,
      };
    } else {
      // Rutas seleccionadas específicas
      const rutasArray = Array.from(rutasSeleccionadas).map(key => {
        const [origenId, destinoId] = key.split('-').map(Number);
        const ruta = estado?.rutasDisponibles?.find(
          r => r.terminalOrigenId === origenId && r.terminalDestinoId === destinoId
        );
        return {
          terminalOrigenId: origenId,
          terminalDestinoId: destinoId,
          precioBase: ruta?.precioSugerido || precioBase,
          duracionMinutos: ruta?.duracionEstimadaMinutos,
        };
      });
      return {
        ...baseRequest,
        rutasSeleccionadas: rutasArray,
      };
    }
  };

  const handlePreview = async () => {
    if (modoRutas === 'seleccionadas' && rutasSeleccionadas.size === 0) {
      setError('Selecciona al menos una ruta');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = getToken();
      const request = buildRequest();

      const previewData = await generacionAutomaticaApi.preview(cooperativaId, request, token || '');
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

      const resultadoData = await generacionAutomaticaApi.generar(cooperativaId, request, token || '');
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
      
      // Recargar estado
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <div className="flex items-center gap-3">
            <Wand2 className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Generar Frecuencias Automáticamente</h2>
              <p className="text-sm text-green-100">
                {paso === 'configurar' && 'Configura los parámetros de generación'}
                {paso === 'preview' && 'Revisa las frecuencias a crear'}
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

          {loading && paso === 'configurar' && !estado && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              <span className="ml-3 text-gray-600">Cargando configuración...</span>
            </div>
          )}

          {/* Paso 1: Configurar */}
          {paso === 'configurar' && estado && (
            <div className="space-y-6">
              {/* Estado actual */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 mb-1">
                    <Bus className="w-4 h-4" />
                    <span className="text-sm font-medium">Buses</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {estado.busesDisponibles}/{estado.busesTotales}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-purple-700 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">Choferes</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {estado.choferesDisponibles}/{estado.choferesTotales}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">Rutas</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {estado.rutasDisponibles?.length || 0}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-700 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Max Horas</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-900">
                    {estado.configuracion?.maxHorasChofer}h
                  </p>
                </div>
              </div>

              {/* Terminales habilitados de la cooperativa */}
              {estado.rutasDisponibles && estado.rutasDisponibles.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                  <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Terminales habilitados para esta cooperativa:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(new Set([
                      ...estado.rutasDisponibles.map(r => r.terminalOrigenNombre),
                      ...estado.rutasDisponibles.map(r => r.terminalDestinoNombre)
                    ])).sort().map((terminal) => (
                      <span 
                        key={terminal} 
                        className="text-xs bg-white border border-gray-300 px-2 py-1 rounded-full text-gray-700"
                      >
                        {terminal}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Alerta si no hay terminales asignados */}
              {(!estado.rutasDisponibles || estado.rutasDisponibles.length === 0) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">No hay terminales asignados</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Para generar frecuencias, primero debe asignar terminales a esta cooperativa 
                        desde <strong>Administración → Terminales</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Selección de modo de rutas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Rutas a generar
                </label>
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="modoRutas"
                      checked={modoRutas === 'todas'}
                      onChange={() => setModoRutas('todas')}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="text-sm font-medium">Todas las rutas ({estado.rutasDisponibles?.length || 0})</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="modoRutas"
                      checked={modoRutas === 'seleccionadas'}
                      onChange={() => setModoRutas('seleccionadas')}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="text-sm font-medium">Seleccionar rutas específicas</span>
                  </label>
                </div>

                {modoRutas === 'seleccionadas' && (
                  <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b">
                      <span className="text-xs text-gray-500">
                        {rutasSeleccionadas.size} de {estado.rutasDisponibles?.length || 0} seleccionadas
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={seleccionarTodasRutas}
                          className="text-xs text-green-600 hover:text-green-800"
                        >
                          Seleccionar todas
                        </button>
                        <button
                          type="button"
                          onClick={deseleccionarTodasRutas}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {estado.rutasDisponibles?.map((ruta) => {
                        const rutaKey = `${ruta.terminalOrigenId}-${ruta.terminalDestinoId}`;
                        const esInterprovincial = ruta.distanciaKm > 100; // Umbral por defecto
                        return (
                          <label
                            key={rutaKey}
                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={rutasSeleccionadas.has(rutaKey)}
                              onChange={() => toggleRutaSeleccionada(rutaKey)}
                              className="w-4 h-4 text-green-600 rounded"
                            />
                            <span className="text-sm flex items-center gap-2">
                              {ruta.terminalOrigenNombre} → {ruta.terminalDestinoNombre}
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                esInterprovincial 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {esInterprovincial ? 'Interprov.' : 'Intraprov.'}
                              </span>
                            </span>
                            <span className="text-xs text-gray-500 ml-auto">
                              {ruta.distanciaKm} km · ~{ruta.duracionEstimadaMinutos} min
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {modoRutas === 'todas' && estado.rutasDisponibles && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-700 mb-2">
                      ✓ Se generarán frecuencias para las <strong>{estado.rutasDisponibles.length}</strong> rutas disponibles:
                    </p>
                    <div className="flex gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-purple-200 rounded-full"></span>
                        <strong>{estado.rutasDisponibles.filter(r => r.distanciaKm > 100).length}</strong> Interprovinciales (&gt;100km)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-blue-200 rounded-full"></span>
                        <strong>{estado.rutasDisponibles.filter(r => r.distanciaKm <= 100).length}</strong> Intraprovinciales (≤100km)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    min={fechaInicio}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Días de operación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Días de Operación
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map((dia) => (
                    <button
                      key={dia.key}
                      type="button"
                      onClick={() => toggleDia(dia.key)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        diasSeleccionados.includes(dia.key)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {dia.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Horarios e intervalo */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Hora Inicio
                  </label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intervalo (min)
                  </label>
                  <select
                    value={intervaloMinutos}
                    onChange={(e) => setIntervaloMinutos(Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value={30}>30 min</option>
                    <option value={60}>1 hora</option>
                    <option value={90}>1.5 horas</option>
                    <option value={120}>2 horas</option>
                    <option value={180}>3 horas</option>
                  </select>
                </div>
              </div>

              {/* Duración y precio */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Duración Viaje (min)
                  </label>
                  <input
                    type="number"
                    value={duracionViaje}
                    onChange={(e) => setDuracionViaje(Number(e.target.value))}
                    min={30}
                    max={600}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Precio Base ($)
                  </label>
                  <input
                    type="number"
                    value={precioBase}
                    onChange={(e) => setPrecioBase(Number(e.target.value))}
                    min={0.5}
                    step={0.5}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Opción de choferes */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="asignarChoferes"
                  checked={asignarChoferes}
                  onChange={(e) => setAsignarChoferes(e.target.checked)}
                  className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                />
                <label htmlFor="asignarChoferes" className="text-gray-700">
                  <span className="font-medium">Asignar choferes automáticamente</span>
                  <p className="text-sm text-gray-500">
                    Respeta límite de {estado.configuracion?.maxHorasChofer}h diarias (máx {estado.configuracion?.maxHorasExcepcionales}h excepcionales)
                  </p>
                </label>
              </div>

              {/* Información de reglas de negocio */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">📋 Reglas de negocio aplicadas:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Interprovincial</strong> (&gt;100km): Descanso mínimo de 2 horas entre viajes</li>
                  <li>• <strong>Intraprovincial</strong> (≤100km): Descanso mínimo de 45 minutos entre viajes</li>
                  <li>• Los buses se rotan automáticamente entre frecuencias</li>
                  <li>• Las frecuencias requieren que el bus esté en la terminal de origen</li>
                </ul>
              </div>
            </div>
          )}

          {/* Paso 2: Preview */}
          {paso === 'preview' && preview && (
            <div className="space-y-6">
              {/* Resumen */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-700">{preview.totalFrecuencias}</p>
                  <p className="text-sm text-green-600">Total frecuencias</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-700">{preview.frecuenciasPorDia}</p>
                  <p className="text-sm text-blue-600">Por día</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-purple-700">{preview.diasOperacion}</p>
                  <p className="text-sm text-purple-600">Días operación</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-orange-700">{preview.busesNecesarios}</p>
                  <p className="text-sm text-orange-600">Buses necesarios</p>
                </div>
              </div>

              {/* Advertencias */}
              {preview.advertencias?.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    Advertencias ({preview.advertencias.length})
                  </h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {preview.advertencias.slice(0, 5).map((adv, i) => (
                      <li key={i}>• {adv}</li>
                    ))}
                    {preview.advertencias.length > 5 && (
                      <li className="text-yellow-600">...y {preview.advertencias.length - 5} más</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Lista de frecuencias */}
              <div>
                <button
                  onClick={() => setShowPreviewList(!showPreviewList)}
                  className="flex items-center gap-2 text-gray-700 font-medium mb-3"
                >
                  {showPreviewList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Ver detalle de frecuencias ({preview.frecuencias?.length})
                </button>
                
                {showPreviewList && (
                  <div className="max-h-64 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Fecha</th>
                          <th className="p-2 text-left">Hora</th>
                          <th className="p-2 text-left">Ruta</th>
                          <th className="p-2 text-left">Bus</th>
                          <th className="p-2 text-left">Chofer</th>
                          <th className="p-2 text-left">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.frecuencias?.map((f, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{f.fecha} ({f.diaSemana})</td>
                            <td className="p-2">{f.horaSalida}</td>
                            <td className="p-2 text-xs">
                              {f.origen} → {f.destino}
                            </td>
                            <td className="p-2">{f.busPlaca}</td>
                            <td className="p-2">{f.choferNombre || '-'}</td>
                            <td className="p-2">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  f.estado === 'OK'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {f.estado}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paso 3: Resultado */}
          {paso === 'resultado' && resultado && (
            <div className="space-y-6">
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  ¡Generación Completada!
                </h3>
                <p className="text-gray-600 mt-2">
                  Se crearon {resultado.frecuenciasCreadas} frecuencias exitosamente
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-700">{resultado.frecuenciasCreadas}</p>
                  <p className="text-sm text-green-600">Creadas</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-yellow-700">{resultado.frecuenciasConAdvertencias}</p>
                  <p className="text-sm text-yellow-600">Con advertencias</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-red-700">{resultado.errores}</p>
                  <p className="text-sm text-red-600">Errores</p>
                </div>
              </div>

              {resultado.mensajes?.map((msg, i) => (
                <p key={i} className="text-gray-600 text-center">{msg}</p>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between">
          {paso === 'configurar' && (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCerrar}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEliminarTodas}
                  disabled={loadingEliminar}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                  title="Eliminar todas las frecuencias de esta cooperativa"
                >
                  {loadingEliminar ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Eliminar Todas
                </button>
              </div>
              <button
                onClick={handlePreview}
                disabled={loading || (modoRutas === 'seleccionadas' && rutasSeleccionadas.size === 0)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                Vista Previa
              </button>
            </>
          )}

          {paso === 'preview' && (
            <>
              <button
                onClick={() => setPaso('configurar')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ← Volver
              </button>
              <button
                onClick={handleGenerar}
                disabled={loading || !preview?.tieneCapacidadSuficiente}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Generar {preview?.totalFrecuencias} Frecuencias
              </button>
            </>
          )}

          {paso === 'resultado' && (
            <button
              onClick={handleCerrar}
              className="ml-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
