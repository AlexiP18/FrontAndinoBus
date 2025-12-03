'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCooperativaConfig } from '@/app/context/CooperativaConfigContext';
import {
  Calendar,
  Clock,
  MapPin,
  Bus,
  User,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
} from 'lucide-react';
import {
  frecuenciaConfigApi,
  getToken,
  type RutaDisponibleResponse,
  type BusDisponibilidadResponse,
  type ChoferDisponibilidadResponse,
  type CrearFrecuenciaValidadaRequest,
  type ValidacionFrecuenciaResponse,
} from '@/lib/api';

interface Props {
  cooperativaId: number;
  onCrear?: (data: CrearFrecuenciaValidadaRequest) => void;
  onCancelar?: () => void;
}

const DIAS_SEMANA = [
  { value: 'LUNES', label: 'Lun' },
  { value: 'MARTES', label: 'Mar' },
  { value: 'MIERCOLES', label: 'Mié' },
  { value: 'JUEVES', label: 'Jue' },
  { value: 'VIERNES', label: 'Vie' },
  { value: 'SABADO', label: 'Sáb' },
  { value: 'DOMINGO', label: 'Dom' },
];

export default function CrearFrecuenciaModal({ cooperativaId, onCrear, onCancelar }: Props) {
  const { styles } = useCooperativaConfig();
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Datos cargados
  const [rutasDisponibles, setRutasDisponibles] = useState<RutaDisponibleResponse[]>([]);
  const [busesDisponibles, setBusesDisponibles] = useState<BusDisponibilidadResponse[]>([]);
  const [choferesDisponibles, setChoferesDisponibles] = useState<ChoferDisponibilidadResponse[]>([]);
  const [validacion, setValidacion] = useState<ValidacionFrecuenciaResponse | null>(null);

  // Selecciones del formulario
  const [rutaSeleccionada, setRutaSeleccionada] = useState<RutaDisponibleResponse | null>(null);
  const [busSeleccionado, setBusSeleccionado] = useState<BusDisponibilidadResponse | null>(null);
  const [choferSeleccionado, setChoferSeleccionado] = useState<ChoferDisponibilidadResponse | null>(null);
  const [horaSalida, setHoraSalida] = useState('08:00');
  const [diasOperacion, setDiasOperacion] = useState<string[]>(['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']);
  const [fechaOperacion, setFechaOperacion] = useState(new Date().toISOString().split('T')[0]);
  const [precioBase, setPrecioBase] = useState(0);
  const [observaciones, setObservaciones] = useState('');

  // Cargar rutas disponibles al montar
  useEffect(() => {
    cargarRutas();
  }, [cooperativaId]);

  // Cuando se selecciona una ruta, actualizar precio sugerido
  useEffect(() => {
    if (rutaSeleccionada) {
      setPrecioBase(rutaSeleccionada.precioSugerido);
    }
  }, [rutaSeleccionada]);

  // Cargar disponibilidad cuando cambia la fecha
  useEffect(() => {
    if (fechaOperacion && paso >= 2) {
      cargarDisponibilidad();
    }
  }, [fechaOperacion, paso]);

  const cargarRutas = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const rutas = await frecuenciaConfigApi.getRutasDisponibles(cooperativaId, token || '');
      setRutasDisponibles(rutas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar rutas');
    } finally {
      setLoading(false);
    }
  };

  const cargarDisponibilidad = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const [buses, choferes] = await Promise.all([
        frecuenciaConfigApi.getBusesDisponibles(cooperativaId, fechaOperacion, token || ''),
        frecuenciaConfigApi.getChoferesDisponibles(cooperativaId, fechaOperacion, token || ''),
      ]);
      setBusesDisponibles(buses);
      setChoferesDisponibles(choferes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar disponibilidad');
    } finally {
      setLoading(false);
    }
  };

  const validarFrecuencia = useCallback(async () => {
    if (!rutaSeleccionada || !busSeleccionado) return;

    try {
      setLoading(true);
      const token = getToken();
      const request: CrearFrecuenciaValidadaRequest = {
        busId: busSeleccionado.busId,
        choferId: choferSeleccionado?.choferId,
        terminalOrigenId: rutaSeleccionada.terminalOrigenId,
        terminalDestinoId: rutaSeleccionada.terminalDestinoId,
        horaSalida,
        diasOperacion: diasOperacion.join(','),
        precioBase,
        observaciones,
      };
      const result = await frecuenciaConfigApi.validarFrecuencia(
        cooperativaId,
        fechaOperacion,
        request,
        token || ''
      );
      setValidacion(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al validar frecuencia');
    } finally {
      setLoading(false);
    }
  }, [rutaSeleccionada, busSeleccionado, choferSeleccionado, horaSalida, diasOperacion, precioBase, observaciones, fechaOperacion, cooperativaId]);

  const handleSubmit = () => {
    if (!rutaSeleccionada || !busSeleccionado || !validacion?.valida) return;

    const request: CrearFrecuenciaValidadaRequest = {
      busId: busSeleccionado.busId,
      choferId: choferSeleccionado?.choferId,
      terminalOrigenId: rutaSeleccionada.terminalOrigenId,
      terminalDestinoId: rutaSeleccionada.terminalDestinoId,
      horaSalida,
      diasOperacion: diasOperacion.join(','),
      precioBase,
      observaciones,
    };

    onCrear?.(request);
  };

  const toggleDia = (dia: string) => {
    setDiasOperacion(prev =>
      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
    );
  };

  // Componente de paso 1: Selección de ruta
  const renderPaso1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MapPin className="w-5 h-5" style={{ color: styles.primary }} />
        Seleccionar Ruta
      </h3>
      <p className="text-sm text-gray-500">
        Solo se muestran rutas entre terminales asignados a su cooperativa
      </p>

      {rutasDisponibles.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="w-5 h-5" />
            <span>No hay terminales asignados a esta cooperativa</span>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 max-h-96 overflow-y-auto">
          {rutasDisponibles.map((ruta, idx) => (
            <button
              key={idx}
              onClick={() => setRutaSeleccionada(ruta)}
              className="p-4 border rounded-lg text-left transition"
              style={
                rutaSeleccionada === ruta
                  ? { borderColor: styles.primary, backgroundColor: styles.primaryLighter }
                  : { borderColor: '#e5e7eb' }
              }
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{ruta.rutaNombre}</p>
                  <p className="text-sm text-gray-500">
                    {ruta.terminalOrigenProvincia} → {ruta.terminalDestinoProvincia}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold" style={{ color: styles.primary }}>${ruta.precioSugerido.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">
                    {ruta.distanciaKm.toFixed(1)} km • {ruta.duracionEstimadaMinutos} min
                  </p>
                </div>
              </div>
              {ruta.terminalesIntermedios.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  {ruta.terminalesIntermedios.length} paradas intermedias disponibles
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Componente de paso 2: Selección de bus y chofer
  const renderPaso2 = () => (
    <div className="space-y-6">
      {/* Fecha de operación */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Fecha de operación (para verificar disponibilidad)
        </label>
        <input
          type="date"
          value={fechaOperacion}
          onChange={(e) => setFechaOperacion(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg coop-input-focus outline-none"
        />
      </div>

      {/* Selección de bus */}
      <div>
        <h4 className="text-md font-semibold flex items-center gap-2 mb-3">
          <Bus className="w-5 h-5" style={{ color: styles.primary }} />
          Seleccionar Bus
        </h4>
        <div className="grid gap-2 max-h-48 overflow-y-auto">
          {busesDisponibles.map((bus) => (
            <button
              key={bus.busId}
              onClick={() => bus.disponible && setBusSeleccionado(bus)}
              disabled={!bus.disponible}
              className="p-3 border rounded-lg text-left transition flex justify-between items-center"
              style={
                busSeleccionado?.busId === bus.busId
                  ? { borderColor: styles.primary, backgroundColor: styles.primaryLighter }
                  : bus.disponible
                  ? { borderColor: '#e5e7eb' }
                  : { borderColor: '#e5e7eb', backgroundColor: '#f3f4f6', opacity: 0.6 }
              }
            >
              <div>
                <p className="font-medium">{bus.placa}</p>
                <p className="text-xs text-gray-500">
                  #{bus.numeroInterno} • {bus.capacidadAsientos} asientos
                </p>
              </div>
              <div className="text-right">
                {bus.disponible ? (
                  <span className="text-xs" style={{ color: styles.primary }}>
                    {bus.horasDisponiblesHoy.toFixed(1)}h disponibles
                  </span>
                ) : (
                  <span className="text-xs text-red-600">{bus.motivoNoDisponible}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selección de chofer */}
      <div>
        <h4 className="text-md font-semibold flex items-center gap-2 mb-3">
          <User className="w-5 h-5" style={{ color: styles.primary }} />
          Seleccionar Chofer (opcional)
        </h4>
        
        {/* Mostrar choferes del bus seleccionado primero */}
        {busSeleccionado && busSeleccionado.choferesAsignados.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-2">Choferes asignados a este bus:</p>
            <div className="flex flex-wrap gap-2">
              {busSeleccionado.choferesAsignados.map((chofer) => (
                <button
                  key={chofer.choferId}
                  onClick={() => {
                    const choferCompleto = choferesDisponibles.find(c => c.choferId === chofer.choferId);
                    if (choferCompleto) setChoferSeleccionado(choferCompleto);
                  }}
                  disabled={!chofer.disponible}
                  className="px-3 py-2 text-sm rounded-lg transition flex items-center gap-2"
                  style={
                    choferSeleccionado?.choferId === chofer.choferId
                      ? { backgroundColor: styles.primary, color: 'white' }
                      : chofer.disponible
                      ? { backgroundColor: '#f3f4f6', color: '#1f2937' }
                      : { backgroundColor: '#f3f4f6', color: '#9ca3af', cursor: 'not-allowed' }
                  }
                >
                  <span className={chofer.tipo === 'PRINCIPAL' ? 'text-yellow-500' : ''}>
                    {chofer.tipo === 'PRINCIPAL' ? '★' : ''}
                  </span>
                  {chofer.nombre}
                  <span className="text-xs opacity-70">
                    ({chofer.horasDisponiblesHoy.toFixed(1)}h)
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-2 max-h-32 overflow-y-auto">
          {choferesDisponibles
            .filter(c => !busSeleccionado?.choferesAsignados.some(bc => bc.choferId === c.choferId))
            .map((chofer) => (
              <button
                key={chofer.choferId}
                onClick={() => chofer.disponible && setChoferSeleccionado(chofer)}
                disabled={!chofer.disponible}
                className="p-2 border rounded text-left text-sm transition"
                style={
                  choferSeleccionado?.choferId === chofer.choferId
                    ? { borderColor: styles.primary, backgroundColor: styles.primaryLighter }
                    : chofer.disponible
                    ? { borderColor: '#e5e7eb' }
                    : { borderColor: '#e5e7eb', backgroundColor: '#f3f4f6', opacity: 0.6 }
                }
              >
                <div className="flex justify-between">
                  <span>{chofer.nombre}</span>
                  {chofer.disponible ? (
                    <span className="text-xs" style={{ color: styles.primary }}>
                      {chofer.horasDisponiblesHoy.toFixed(1)}h
                    </span>
                  ) : (
                    <span className="text-xs text-red-600">{chofer.motivoNoDisponible}</span>
                  )}
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );

  // Componente de paso 3: Configuración de horarios
  const renderPaso3 = () => (
    <div className="space-y-6">
      {/* Hora de salida */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Hora de Salida
        </label>
        <input
          type="time"
          value={horaSalida}
          onChange={(e) => setHoraSalida(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg coop-input-focus outline-none"
        />
      </div>

      {/* Días de operación */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Días de Operación
        </label>
        <div className="flex flex-wrap gap-2">
          {DIAS_SEMANA.map((dia) => (
            <button
              key={dia.value}
              onClick={() => toggleDia(dia.value)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition"
              style={
                diasOperacion.includes(dia.value)
                  ? { backgroundColor: styles.primary, color: 'white' }
                  : { backgroundColor: '#f3f4f6', color: '#374151' }
              }
            >
              {dia.label}
            </button>
          ))}
        </div>
      </div>

      {/* Precio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Precio Base
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            type="number"
            value={precioBase}
            onChange={(e) => setPrecioBase(parseFloat(e.target.value) || 0)}
            step="0.25"
            min="0"
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg coop-input-focus outline-none"
          />
        </div>
        {rutaSeleccionada && (
          <p className="text-xs text-gray-500 mt-1">
            Precio sugerido: ${rutaSeleccionada.precioSugerido.toFixed(2)}
          </p>
        )}
      </div>

      {/* Observaciones */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Observaciones (opcional)
        </label>
        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg coop-input-focus outline-none resize-none"
          placeholder="Notas adicionales..."
        />
      </div>
    </div>
  );

  // Componente de paso 4: Validación y confirmación
  const renderPaso4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Resumen de la Frecuencia</h3>

      {/* Resumen */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Ruta:</span>
          <span className="font-medium">{rutaSeleccionada?.rutaNombre}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Bus:</span>
          <span className="font-medium">{busSeleccionado?.placa}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Chofer:</span>
          <span className="font-medium">{choferSeleccionado?.nombre || 'No asignado'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Hora salida:</span>
          <span className="font-medium">{horaSalida}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Hora llegada estimada:</span>
          <span className="font-medium">{validacion?.horaLlegadaEstimada}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Duración:</span>
          <span className="font-medium">{validacion?.duracionEstimadaMinutos} min</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Días:</span>
          <span className="font-medium">{diasOperacion.map(d => d.substring(0, 3)).join(', ')}</span>
        </div>
        <div className="flex justify-between text-lg">
          <span className="text-gray-600">Precio:</span>
          <span className="font-bold" style={{ color: styles.primary }}>${precioBase.toFixed(2)}</span>
        </div>
      </div>

      {/* Resultado de validación */}
      {validacion && (
        <div className="space-y-3">
          {validacion.valida ? (
            <div 
              className="flex items-center gap-2 p-3 rounded-lg"
              style={{ backgroundColor: styles.primaryLighter, color: styles.primary }}
            >
              <CheckCircle className="w-5 h-5" />
              <span>La frecuencia es válida y puede ser creada</span>
            </div>
          ) : (
            <div className="bg-red-50 p-3 rounded-lg space-y-2">
              {validacion.errores.map((error, idx) => (
                <div key={idx} className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              ))}
            </div>
          )}

          {validacion.advertencias.length > 0 && (
            <div className="bg-yellow-50 p-3 rounded-lg space-y-2">
              {validacion.advertencias.map((adv, idx) => (
                <div key={idx} className="flex items-center gap-2 text-yellow-700">
                  <Info className="w-4 h-4" />
                  <span className="text-sm">{adv}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const canContinue = () => {
    switch (paso) {
      case 1:
        return rutaSeleccionada !== null;
      case 2:
        return busSeleccionado !== null;
      case 3:
        return horaSalida !== '' && diasOperacion.length > 0 && precioBase > 0;
      case 4:
        return validacion?.valida === true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (paso === 3) {
      await validarFrecuencia();
    }
    setPaso(p => Math.min(p + 1, 4));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div 
          className="p-4 border-b flex justify-between items-center text-white"
          style={{ background: `linear-gradient(to right, ${styles.primary}, ${styles.secondary})` }}
        >
          <div>
            <h2 className="text-xl font-bold">Nueva Frecuencia</h2>
            <p className="text-sm opacity-80">Paso {paso} de 4</p>
          </div>
          <button
            onClick={onCancelar}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${(paso / 4) * 100}%`, backgroundColor: styles.primary }}
          />
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

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: styles.primary }}></div>
            </div>
          ) : (
            <>
              {paso === 1 && renderPaso1()}
              {paso === 2 && renderPaso2()}
              {paso === 3 && renderPaso3()}
              {paso === 4 && renderPaso4()}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between">
          <button
            onClick={() => paso === 1 ? onCancelar?.() : setPaso(p => p - 1)}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            {paso === 1 ? 'Cancelar' : 'Anterior'}
          </button>

          {paso < 4 ? (
            <button
              onClick={handleNext}
              disabled={!canContinue() || loading}
              className="px-6 py-2 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: !canContinue() || loading ? styles.primaryLight : styles.primary }}
              onMouseEnter={(e) => { if (canContinue() && !loading) e.currentTarget.style.backgroundColor = styles.primaryDark; }}
              onMouseLeave={(e) => { if (canContinue() && !loading) e.currentTarget.style.backgroundColor = styles.primary; }}
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canContinue() || loading}
              className="px-6 py-2 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ backgroundColor: !canContinue() || loading ? styles.primaryLight : styles.primary }}
              onMouseEnter={(e) => { if (canContinue() && !loading) e.currentTarget.style.backgroundColor = styles.primaryDark; }}
              onMouseLeave={(e) => { if (canContinue() && !loading) e.currentTarget.style.backgroundColor = styles.primary; }}
            >
              <CheckCircle className="w-5 h-5" />
              Crear Frecuencia
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
