'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Wand2,
  Upload,
  Calendar,
  Bus,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  X,
  Play,
  Eye,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
} from 'lucide-react';
import {
  generacionFrecuenciasApi,
  busApi,
  getToken,
  type PlantillaRotacion,
  type ImportarCsvRequest,
  type GenerarFrecuenciasRequest,
  type PreviewGeneracionResponse,
  type ResultadoGeneracionResponse,
  type BusDetailResponse,
} from '@/lib/api';

interface Props {
  cooperativaId: number;
  isOpen: boolean;
  onClose: () => void;
  onGenerated?: () => void;
}

type Paso = 'plantillas' | 'importar' | 'configurar' | 'preview' | 'resultado';

export default function GenerarFrecuenciasModal({ cooperativaId, isOpen, onClose, onGenerated }: Props) {
  const [paso, setPaso] = useState<Paso>('plantillas');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Plantillas
  const [plantillas, setPlantillas] = useState<PlantillaRotacion[]>([]);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<PlantillaRotacion | null>(null);
  const [turnosExpandidos, setTurnosExpandidos] = useState<Set<number>>(new Set());

  // Importar CSV
  const [csvContent, setCsvContent] = useState('');
  const [nombrePlantilla, setNombrePlantilla] = useState('');
  const [descripcionPlantilla, setDescripcionPlantilla] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configurar generación
  const [buses, setBuses] = useState<BusDetailResponse[]>([]);
  const [busesSeleccionados, setBusesSeleccionados] = useState<number[]>([]);
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [asignarChoferes, setAsignarChoferes] = useState(true);

  // Preview y resultado
  const [preview, setPreview] = useState<PreviewGeneracionResponse | null>(null);
  const [resultado, setResultado] = useState<ResultadoGeneracionResponse | null>(null);

  useEffect(() => {
    cargarDatos();
  }, [cooperativaId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const [plantillasData, busesData] = await Promise.all([
        generacionFrecuenciasApi.getPlantillas(cooperativaId, token || ''),
        busApi.list(cooperativaId, token || ''),
      ]);
      setPlantillas(plantillasData);
      setBuses(busesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvContent(event.target?.result as string);
        setNombrePlantilla(file.name.replace(/\.[^/.]+$/, ''));
      };
      reader.readAsText(file);
    }
  };

  const handleImportarCsv = async () => {
    if (!csvContent || !nombrePlantilla) {
      setError('Debe seleccionar un archivo CSV y dar un nombre a la plantilla');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = getToken();
      const request: ImportarCsvRequest = {
        contenidoCsv: csvContent,
        nombrePlantilla,
        descripcion: descripcionPlantilla,
      };
      const response = await generacionFrecuenciasApi.importarCsv(cooperativaId, request, token || '');
      
      if (response.exitoso) {
        await cargarDatos();
        const nuevaPlantilla = plantillas.find(p => p.id === response.plantillaId);
        if (nuevaPlantilla) {
          setPlantillaSeleccionada(nuevaPlantilla);
        }
        setPaso('plantillas');
        setCsvContent('');
        setNombrePlantilla('');
        setDescripcionPlantilla('');
      } else {
        setError(response.errores.join(', '));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarPlantilla = async (plantillaId: number) => {
    if (!confirm('¿Está seguro de eliminar esta plantilla?')) return;

    try {
      const token = getToken();
      await generacionFrecuenciasApi.eliminarPlantilla(cooperativaId, plantillaId, token || '');
      await cargarDatos();
      if (plantillaSeleccionada?.id === plantillaId) {
        setPlantillaSeleccionada(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const handlePreview = async () => {
    if (!plantillaSeleccionada || busesSeleccionados.length === 0) {
      setError('Seleccione una plantilla y al menos un bus');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = getToken();
      const request: GenerarFrecuenciasRequest = {
        plantillaId: plantillaSeleccionada.id,
        fechaInicio,
        fechaFin,
        busIds: busesSeleccionados,
        asignarChoferesAutomaticamente: asignarChoferes,
        sobreescribirExistentes: false,
      };
      const previewData = await generacionFrecuenciasApi.previewGeneracion(
        cooperativaId,
        request,
        token || ''
      );
      setPreview(previewData);
      setPaso('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar preview');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerar = async () => {
    if (!plantillaSeleccionada) return;

    try {
      setLoading(true);
      setError('');
      const token = getToken();
      const request: GenerarFrecuenciasRequest = {
        plantillaId: plantillaSeleccionada.id,
        fechaInicio,
        fechaFin,
        busIds: busesSeleccionados,
        asignarChoferesAutomaticamente: asignarChoferes,
        sobreescribirExistentes: false,
      };
      const resultadoData = await generacionFrecuenciasApi.generarFrecuencias(
        cooperativaId,
        request,
        token || ''
      );
      setResultado(resultadoData);
      setPaso('resultado');
      onGenerated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar frecuencias');
    } finally {
      setLoading(false);
    }
  };

  const toggleBus = (busId: number) => {
    setBusesSeleccionados(prev =>
      prev.includes(busId) ? prev.filter(id => id !== busId) : [...prev, busId]
    );
  };

  const seleccionarTodosBuses = () => {
    if (busesSeleccionados.length === buses.length) {
      setBusesSeleccionados([]);
    } else {
      setBusesSeleccionados(buses.map(b => b.id));
    }
  };

  const toggleTurnoExpandido = (turnoNum: number) => {
    setTurnosExpandidos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(turnoNum)) {
        newSet.delete(turnoNum);
      } else {
        newSet.add(turnoNum);
      }
      return newSet;
    });
  };

  // Renderizado por paso
  const renderPlantillas = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Plantillas de Rotación</h3>
        <button
          onClick={() => setPaso('importar')}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Importar CSV
        </button>
      </div>

      {plantillas.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay plantillas creadas</p>
          <p className="text-sm text-gray-400 mt-1">
            Importe un archivo CSV con las horas de trabajo
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {plantillas.map(plantilla => (
            <div
              key={plantilla.id}
              className={`border rounded-lg p-4 cursor-pointer transition ${
                plantillaSeleccionada?.id === plantilla.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
              onClick={() => setPlantillaSeleccionada(plantilla)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{plantilla.nombre}</h4>
                  <p className="text-sm text-gray-500">{plantilla.descripcion}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {plantilla.totalTurnos} turnos en el ciclo
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEliminarPlantilla(plantilla.id);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Mostrar turnos si está seleccionada */}
              {plantillaSeleccionada?.id === plantilla.id && plantilla.turnos && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">Turnos del ciclo:</p>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {plantilla.turnos.slice(0, 10).map(turno => (
                      <div key={turno.numeroDia} className="text-xs bg-white p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                            DÍA {turno.numeroDia}
                          </span>
                          {turno.esParada ? (
                            <span className="text-yellow-600">PARADA</span>
                          ) : (
                            <>
                              <span className="text-gray-600">{turno.horaSalida}</span>
                              <span>{turno.origen} → {turno.destino}</span>
                            </>
                          )}
                        </div>
                        {turno.subTurnos && turno.subTurnos.length > 0 && (
                          <div className="ml-12 mt-1 text-gray-500">
                            + {turno.subTurnos.length} viajes adicionales
                          </div>
                        )}
                      </div>
                    ))}
                    {plantilla.turnos.length > 10 && (
                      <p className="text-xs text-gray-400 text-center">
                        ... y {plantilla.turnos.length - 10} turnos más
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {plantillaSeleccionada && (
        <button
          onClick={() => setPaso('configurar')}
          className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
        >
          Continuar con "{plantillaSeleccionada.nombre}"
        </button>
      )}
    </div>
  );

  const renderImportarCsv = () => (
    <div className="space-y-4">
      <button
        onClick={() => setPaso('plantillas')}
        className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
      >
        ← Volver
      </button>

      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Upload className="w-5 h-5 text-green-600" />
        Importar Plantilla desde CSV
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Archivo CSV
          </label>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition flex flex-col items-center gap-2 text-gray-500"
          >
            <FileSpreadsheet className="w-10 h-10" />
            {csvContent ? (
              <span className="text-green-600">Archivo cargado ✓</span>
            ) : (
              <span>Haga clic para seleccionar un archivo CSV</span>
            )}
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la plantilla *
          </label>
          <input
            type="text"
            value={nombrePlantilla}
            onChange={(e) => setNombrePlantilla(e.target.value)}
            placeholder="Ej: Horas de Trabajo RUTAS 1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción (opcional)
          </label>
          <textarea
            value={descripcionPlantilla}
            onChange={(e) => setDescripcionPlantilla(e.target.value)}
            rows={2}
            placeholder="Descripción de esta plantilla..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Formato esperado:</strong> El CSV debe tener columnas para DÍA, HORA DE SALIDA,
            ORIGEN, DESTINO y opcionalmente HORA DE LLEGADA. Los números de bus en las columnas de
            fechas definen la rotación.
          </p>
        </div>

        <button
          onClick={handleImportarCsv}
          disabled={!csvContent || !nombrePlantilla || loading}
          className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Importando...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Importar Plantilla
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderConfigurar = () => (
    <div className="space-y-4">
      <button
        onClick={() => setPaso('plantillas')}
        className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
      >
        ← Volver
      </button>

      <h3 className="text-lg font-semibold">Configurar Generación</h3>
      <p className="text-sm text-gray-500">
        Plantilla: <strong>{plantillaSeleccionada?.nombre}</strong>
      </p>

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="w-4 h-4 inline mr-1" />
            Fecha inicio
          </label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="w-4 h-4 inline mr-1" />
            Fecha fin
          </label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
          />
        </div>
      </div>

      {/* Selección de buses */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">
            <Bus className="w-4 h-4 inline mr-1" />
            Buses participantes ({busesSeleccionados.length}/{buses.length})
          </label>
          <button
            onClick={seleccionarTodosBuses}
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            {busesSeleccionados.length === buses.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
          {buses.map(bus => (
            <button
              key={bus.id}
              onClick={() => toggleBus(bus.id)}
              className={`p-2 text-sm rounded-lg transition border ${
                busesSeleccionados.includes(bus.id)
                  ? 'bg-purple-100 border-purple-500 text-purple-700'
                  : 'bg-white border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="font-medium">{bus.placa}</div>
              <div className="text-xs text-gray-500">#{bus.numeroInterno}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Opciones */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={asignarChoferes}
          onChange={(e) => setAsignarChoferes(e.target.checked)}
          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
        />
        <label className="text-sm text-gray-700">
          Asignar choferes automáticamente según disponibilidad
        </label>
      </div>

      <button
        onClick={handlePreview}
        disabled={busesSeleccionados.length === 0 || loading}
        className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Eye className="w-5 h-5" />
        Ver Vista Previa
      </button>
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-4">
      <button
        onClick={() => setPaso('configurar')}
        className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
      >
        ← Volver
      </button>

      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Eye className="w-5 h-5 text-purple-600" />
        Vista Previa de Generación
      </h3>

      {preview && (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-600">{preview.diasTotales}</p>
              <p className="text-xs text-gray-500">días</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{preview.frecuenciasAGenerar}</p>
              <p className="text-xs text-gray-500">frecuencias</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{preview.busesParticipantes}</p>
              <p className="text-xs text-gray-500">buses</p>
            </div>
          </div>

          {/* Advertencias */}
          {preview.advertencias.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              {preview.advertencias.map((adv, idx) => (
                <div key={idx} className="flex items-center gap-2 text-yellow-700 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  {adv}
                </div>
              ))}
            </div>
          )}

          {/* Conflictos */}
          {preview.conflictos.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="font-medium text-red-700 mb-2">
                {preview.conflictos.length} conflictos detectados:
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {preview.conflictos.map((conflicto, idx) => (
                  <div key={idx} className="text-sm text-red-600">
                    {conflicto.fecha}: {conflicto.busPlaca} - {conflicto.descripcion}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Asignaciones por día */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Asignaciones por día:</p>
            <div className="max-h-48 overflow-y-auto border rounded-lg">
              {/* Agrupar por fecha */}
              {Array.from(new Set(preview.asignaciones.map(a => a.fecha))).slice(0, 7).map(fecha => (
                <div key={fecha} className="border-b last:border-b-0">
                  <div className="bg-gray-50 px-3 py-2 font-medium text-sm">
                    {new Date(fecha).toLocaleDateString('es-EC', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                  <div className="p-2 space-y-1">
                    {preview.asignaciones
                      .filter(a => a.fecha === fecha)
                      .map((asig, idx) => (
                        <div
                          key={idx}
                          className={`text-xs p-1 rounded ${
                            asig.esParada ? 'bg-yellow-50 text-yellow-700' : 'bg-white'
                          }`}
                        >
                          <span className="font-mono bg-gray-100 px-1 rounded">{asig.busPlaca}</span>
                          <span className="ml-2">{asig.primerViaje}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerar}
            disabled={loading}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Generar {preview.frecuenciasAGenerar} Frecuencias
          </button>
        </>
      )}
    </div>
  );

  const renderResultado = () => (
    <div className="space-y-4">
      <div className="text-center py-4">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800">¡Generación Completada!</h3>
      </div>

      {resultado && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{resultado.frecuenciasCreadas}</p>
              <p className="text-sm text-gray-500">creadas</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">{resultado.frecuenciasOmitidas}</p>
              <p className="text-sm text-gray-500">omitidas (paradas)</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{resultado.errores}</p>
              <p className="text-sm text-gray-500">errores</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            {resultado.mensajes.map((msg, idx) => (
              <p key={idx} className="text-sm text-gray-700">{msg}</p>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Cerrar
          </button>
        </>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <Wand2 className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Generar Frecuencias Automáticamente</h2>
              <p className="text-sm text-purple-200">
                Basado en plantilla de rotación de buses
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 text-sm">{error}</span>
              <button onClick={() => setError('')} className="ml-auto text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {loading && paso !== 'importar' ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {paso === 'plantillas' && renderPlantillas()}
              {paso === 'importar' && renderImportarCsv()}
              {paso === 'configurar' && renderConfigurar()}
              {paso === 'preview' && renderPreview()}
              {paso === 'resultado' && renderResultado()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
