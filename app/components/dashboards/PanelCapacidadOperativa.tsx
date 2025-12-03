"use client";

import { useState, useEffect } from "react";

// Tipos para la capacidad operativa
interface AlertaCapacidad {
  tipo: 'INFO' | 'ADVERTENCIA' | 'CRITICO';
  codigo: string;
  mensaje: string;
  detalle: string;
  recomendacion: string;
}

interface CapacidadDiariaResumen {
  fecha: string;
  diaSemana: string;
  frecuenciasProgramadas: number;
  horasRequeridas: number;
  horasDisponibles: number;
  porcentajeUso: number;
  estado: 'DISPONIBLE' | 'OPTIMO' | 'LIMITE' | 'DEFICIT';
}

interface CapacidadOperativa {
  fecha: string;
  totalBuses: number;
  busesActivos: number;
  busesInactivos: number;
  totalChoferes: number;
  horasBusDisponiblesDia: number;
  horasChoferDisponiblesDia: number;
  horasOperativasRealesDia: number;
  cuelloBotella: 'NINGUNO' | 'BUSES' | 'CHOFERES' | 'AMBOS';
  frecuenciasActuales: number;
  frecuenciasMaximasSugeridas: number;
  porcentajeCapacidadUsada: number;
  alertas: AlertaCapacidad[];
  sugerencias: string[];
  // Configuración
  maxHorasDiariasChofer: number;
  maxHorasExcepcionalesChofer: number;
  maxDiasExcepcionalesSemana: number;
  descansoInterprovincialMinutos: number;
  descansoIntraprovincialMinutos: number;
}

interface CapacidadPeriodoResponse {
  fechaInicio: string;
  fechaFin: string;
  diasPlanificados: number;
  capacidadDiaria: CapacidadDiariaResumen[];
  promedioUsoCapacidad: number;
  diasEnDeficit: number;
  diasEnLimite: number;
  alertasGenerales: AlertaCapacidad[];
}

interface PanelCapacidadOperativaProps {
  cooperativaId: number;
  apiBaseUrl?: string;
}

export default function PanelCapacidadOperativa({ 
  cooperativaId, 
  apiBaseUrl = "/api" 
}: PanelCapacidadOperativaProps) {
  const [capacidad, setCapacidad] = useState<CapacidadOperativa | null>(null);
  const [periodoCapacidad, setPeriodoCapacidad] = useState<CapacidadPeriodoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vistaActiva, setVistaActiva] = useState<'resumen' | 'periodo'>('resumen');
  const [semanas, setSemanas] = useState(1);

  // Obtener capacidad operativa actual
  const fetchCapacidad = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/cooperativa/${cooperativaId}/capacidad`);
      if (!response.ok) throw new Error('Error al obtener capacidad operativa');
      const data = await response.json();
      setCapacidad(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Obtener capacidad por periodo
  const fetchCapacidadPeriodo = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${apiBaseUrl}/cooperativa/${cooperativaId}/capacidad/periodo?semanas=${semanas}`
      );
      if (!response.ok) throw new Error('Error al obtener capacidad del periodo');
      const data = await response.json();
      setPeriodoCapacidad(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vistaActiva === 'resumen') {
      fetchCapacidad();
    } else {
      fetchCapacidadPeriodo();
    }
  }, [cooperativaId, vistaActiva, semanas]);

  // Obtener color según el estado
  const getColorEstado = (estado: string) => {
    switch (estado) {
      case 'DISPONIBLE': return 'bg-green-100 text-green-800';
      case 'OPTIMO': return 'bg-blue-100 text-blue-800';
      case 'LIMITE': return 'bg-yellow-100 text-yellow-800';
      case 'DEFICIT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener color para alertas
  const getColorAlerta = (tipo: string) => {
    switch (tipo) {
      case 'CRITICO': return 'bg-red-50 border-red-400 text-red-800';
      case 'ADVERTENCIA': return 'bg-yellow-50 border-yellow-400 text-yellow-800';
      case 'INFO': return 'bg-blue-50 border-blue-400 text-blue-800';
      default: return 'bg-gray-50 border-gray-400 text-gray-800';
    }
  };

  // Obtener ícono para tipo de alerta
  const getIconoAlerta = (tipo: string) => {
    switch (tipo) {
      case 'CRITICO': return '🚨';
      case 'ADVERTENCIA': return '⚠️';
      case 'INFO': return 'ℹ️';
      default: return '📋';
    }
  };

  // Obtener color para el porcentaje de capacidad
  const getColorPorcentaje = (porcentaje: number) => {
    if (porcentaje >= 100) return 'text-red-600';
    if (porcentaje >= 85) return 'text-yellow-600';
    if (porcentaje >= 50) return 'text-blue-600';
    return 'text-green-600';
  };

  // Obtener color para la barra de progreso
  const getColorBarra = (porcentaje: number) => {
    if (porcentaje >= 100) return 'bg-red-500';
    if (porcentaje >= 85) return 'bg-yellow-500';
    if (porcentaje >= 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <span className="text-red-500">❌</span>
          <span className="text-red-700">{error}</span>
        </div>
        <button 
          onClick={fetchCapacidad}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header con tabs */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          📊 Capacidad Operativa
        </h2>
        <div className="flex gap-4 mt-3">
          <button
            onClick={() => setVistaActiva('resumen')}
            className={`px-4 py-2 rounded-lg transition-all ${
              vistaActiva === 'resumen' 
                ? 'bg-white text-blue-700 font-semibold' 
                : 'bg-blue-500/50 hover:bg-blue-500/70'
            }`}
          >
            📋 Resumen Hoy
          </button>
          <button
            onClick={() => setVistaActiva('periodo')}
            className={`px-4 py-2 rounded-lg transition-all ${
              vistaActiva === 'periodo' 
                ? 'bg-white text-blue-700 font-semibold' 
                : 'bg-blue-500/50 hover:bg-blue-500/70'
            }`}
          >
            📆 Planificación Semanal
          </button>
        </div>
      </div>

      <div className="p-6">
        {vistaActiva === 'resumen' && capacidad && (
          <>
            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Buses */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">🚌 Buses</div>
                <div className="text-2xl font-bold text-gray-800">
                  {capacidad.busesActivos} / {capacidad.totalBuses}
                </div>
                <div className="text-xs text-gray-500">
                  {capacidad.busesInactivos} inactivos
                </div>
              </div>

              {/* Choferes */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">👨‍✈️ Choferes</div>
                <div className="text-2xl font-bold text-gray-800">
                  {capacidad.totalChoferes}
                </div>
                <div className="text-xs text-gray-500">
                  {capacidad.maxHorasDiariasChofer}h normales / {capacidad.maxHorasExcepcionalesChofer}h máximo
                </div>
              </div>

              {/* Frecuencias */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">📅 Frecuencias</div>
                <div className="text-2xl font-bold text-gray-800">
                  {capacidad.frecuenciasActuales} / {capacidad.frecuenciasMaximasSugeridas}
                </div>
                <div className="text-xs text-gray-500">
                  programadas / máximo sugerido
                </div>
              </div>

              {/* Capacidad */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">📈 Uso Capacidad</div>
                <div className={`text-2xl font-bold ${getColorPorcentaje(capacidad.porcentajeCapacidadUsada)}`}>
                  {capacidad.porcentajeCapacidadUsada.toFixed(1)}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${getColorBarra(capacidad.porcentajeCapacidadUsada)}`}
                    style={{ width: `${Math.min(capacidad.porcentajeCapacidadUsada, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Cuello de botella */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-700 mb-2">🔍 Cuello de Botella</h3>
              <div className="flex items-center gap-3">
                {capacidad.cuelloBotella === 'NINGUNO' && (
                  <span className="text-green-600 font-medium">
                    ✅ Sin restricciones - Recursos balanceados
                  </span>
                )}
                {capacidad.cuelloBotella === 'CHOFERES' && (
                  <span className="text-orange-600 font-medium">
                    👨‍✈️ Choferes limitan la operación ({capacidad.horasChoferDisponiblesDia}h disponibles vs {capacidad.horasBusDisponiblesDia}h de buses)
                  </span>
                )}
                {capacidad.cuelloBotella === 'BUSES' && (
                  <span className="text-orange-600 font-medium">
                    🚌 Buses limitan la operación ({capacidad.horasBusDisponiblesDia}h disponibles vs {capacidad.horasChoferDisponiblesDia}h de choferes)
                  </span>
                )}
                {capacidad.cuelloBotella === 'AMBOS' && (
                  <span className="text-red-600 font-medium">
                    ⚠️ Ambos recursos son limitantes
                  </span>
                )}
              </div>
            </div>

            {/* Alertas */}
            {capacidad.alertas.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">🔔 Alertas</h3>
                <div className="space-y-3">
                  {capacidad.alertas.map((alerta, index) => (
                    <div 
                      key={index}
                      className={`border-l-4 p-4 rounded-r-lg ${getColorAlerta(alerta.tipo)}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xl">{getIconoAlerta(alerta.tipo)}</span>
                        <div className="flex-1">
                          <div className="font-semibold">{alerta.mensaje}</div>
                          <div className="text-sm opacity-80 mt-1">{alerta.detalle}</div>
                          {alerta.recomendacion && (
                            <div className="text-sm mt-2 font-medium">
                              💡 {alerta.recomendacion}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sugerencias */}
            {capacidad.sugerencias.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">💡 Sugerencias</h3>
                <ul className="space-y-1">
                  {capacidad.sugerencias.map((sugerencia, index) => (
                    <li key={index} className="text-blue-700 text-sm flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      {sugerencia}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Configuración actual */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">⚙️ Configuración Actual</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Horas normales chofer:</span>
                  <span className="ml-2 font-medium">{capacidad.maxHorasDiariasChofer}h</span>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Horas excepcionales:</span>
                  <span className="ml-2 font-medium">{capacidad.maxHorasExcepcionalesChofer}h</span>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Descanso interprovincial:</span>
                  <span className="ml-2 font-medium">{capacidad.descansoInterprovincialMinutos} min</span>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Descanso intraprovincial:</span>
                  <span className="ml-2 font-medium">{capacidad.descansoIntraprovincialMinutos} min</span>
                </div>
              </div>
            </div>
          </>
        )}

        {vistaActiva === 'periodo' && (
          <>
            {/* Selector de semanas */}
            <div className="mb-6 flex items-center gap-4">
              <label className="text-gray-700 font-medium">Semanas de planificación:</label>
              <select
                value={semanas}
                onChange={(e) => setSemanas(Number(e.target.value))}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1 semana</option>
                <option value={2}>2 semanas</option>
                <option value={3}>3 semanas</option>
                <option value={4}>4 semanas</option>
              </select>
            </div>

            {periodoCapacidad && (
              <>
                {/* Resumen del periodo */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">📆 Días Planificados</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {periodoCapacidad.diasPlanificados}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">📊 Promedio Uso</div>
                    <div className={`text-2xl font-bold ${getColorPorcentaje(periodoCapacidad.promedioUsoCapacidad)}`}>
                      {periodoCapacidad.promedioUsoCapacidad.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-sm text-red-500 mb-1">🚨 Días en Déficit</div>
                    <div className="text-2xl font-bold text-red-600">
                      {periodoCapacidad.diasEnDeficit}
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-sm text-yellow-600 mb-1">⚠️ Días al Límite</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {periodoCapacidad.diasEnLimite}
                    </div>
                  </div>
                </div>

                {/* Alertas generales del periodo */}
                {periodoCapacidad.alertasGenerales.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-3">🔔 Alertas del Periodo</h3>
                    <div className="space-y-2">
                      {periodoCapacidad.alertasGenerales.map((alerta, index) => (
                        <div 
                          key={index}
                          className={`border-l-4 p-3 rounded-r-lg ${getColorAlerta(alerta.tipo)}`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{getIconoAlerta(alerta.tipo)}</span>
                            <span className="font-medium">{alerta.mensaje}</span>
                          </div>
                          {alerta.recomendacion && (
                            <div className="text-sm mt-1 ml-6">💡 {alerta.recomendacion}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tabla de capacidad diaria */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Día</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Frecuencias</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Horas Req.</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Horas Disp.</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">% Uso</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {periodoCapacidad.capacidadDiaria.map((dia, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{dia.fecha}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{dia.diaSemana}</td>
                          <td className="px-4 py-3 text-sm text-center font-medium">{dia.frecuenciasProgramadas}</td>
                          <td className="px-4 py-3 text-sm text-center">{dia.horasRequeridas}h</td>
                          <td className="px-4 py-3 text-sm text-center">{dia.horasDisponibles}h</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-medium ${getColorPorcentaje(dia.porcentajeUso)}`}>
                              {dia.porcentajeUso.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColorEstado(dia.estado)}`}>
                              {dia.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
