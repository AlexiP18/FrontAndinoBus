'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getToken } from '@/lib/api';
import {
  Building2,
  ArrowLeft,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Activity,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Bus
} from 'lucide-react';

interface Terminal {
  id: number;
  nombre: string;
  provincia: string;
  canton: string;
  tipologia: string;
  andenes: number;
  maxFrecuenciasDiarias: number;
}

interface OcupacionHora {
  hora: string;
  frecuenciasAsignadas: number;
  maxFrecuencias: number;
  saturado: boolean;
}

interface OcupacionDiaria {
  terminalId: number;
  terminalNombre: string;
  tipologia: string;
  fecha: string;
  totalFrecuenciasAsignadas: number;
  maxFrecuenciasDiarias: number;
  maxFrecuenciasPorHora: number;
  horasSaturadas: number;
  porcentajeOcupacion: number;
  ocupacionesPorHora: OcupacionHora[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function OcupacionTerminalPage() {
  const router = useRouter();
  const params = useParams();
  const terminalId = params.id as string;

  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [ocupacion, setOcupacion] = useState<OcupacionDiaria | null>(null);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (terminalId) {
      cargarDatos();
    }
  }, [terminalId, fecha]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const [terminalRes, ocupacionRes] = await Promise.all([
        fetch(`${API_BASE}/api/terminales/${terminalId}`, { headers }),
        fetch(`${API_BASE}/api/terminales/${terminalId}/ocupacion?fecha=${fecha}`, { headers })
      ]);

      if (!terminalRes.ok) throw new Error('Error al cargar terminal');

      const terminalData = await terminalRes.json();
      setTerminal(terminalData);

      if (ocupacionRes.ok) {
        const ocupacionData = await ocupacionRes.json();
        setOcupacion(ocupacionData);
      } else {
        // Si no hay datos de ocupación, crear estructura vacía
        setOcupacion(generarOcupacionVacia(terminalData));
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const generarOcupacionVacia = (term: Terminal): OcupacionDiaria => {
    const horas: OcupacionHora[] = [];
    for (let h = 5; h <= 23; h++) {
      for (let m = 0; m < 60; m += 15) {
        horas.push({
          hora: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
          frecuenciasAsignadas: 0,
          maxFrecuencias: term.andenes,
          saturado: false
        });
      }
    }
    return {
      terminalId: term.id,
      terminalNombre: term.nombre,
      tipologia: term.tipologia,
      fecha,
      totalFrecuenciasAsignadas: 0,
      maxFrecuenciasDiarias: term.maxFrecuenciasDiarias,
      maxFrecuenciasPorHora: term.andenes,
      horasSaturadas: 0,
      porcentajeOcupacion: 0,
      ocupacionesPorHora: horas
    };
  };

  const cambiarFecha = (dias: number) => {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    setFecha(nuevaFecha.toISOString().split('T')[0]);
  };

  const getOcupacionColor = (porcentaje: number) => {
    if (porcentaje === 0) return 'bg-gray-100';
    if (porcentaje < 30) return 'bg-green-200';
    if (porcentaje < 60) return 'bg-yellow-200';
    if (porcentaje < 90) return 'bg-orange-200';
    return 'bg-red-300';
  };

  const getOcupacionTextColor = (porcentaje: number) => {
    if (porcentaje === 0) return 'text-gray-400';
    if (porcentaje < 30) return 'text-green-700';
    if (porcentaje < 60) return 'text-yellow-700';
    if (porcentaje < 90) return 'text-orange-700';
    return 'text-red-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !terminal) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error || 'Terminal no encontrado'}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
      </div>
    );
  }

  // Agrupar horas por hora para mostrar en grid
  const horasPorHora: { [key: number]: OcupacionHora[] } = {};
  if (ocupacion) {
    ocupacion.ocupacionesPorHora.forEach(o => {
      const hora = parseInt(o.hora.split(':')[0]);
      if (!horasPorHora[hora]) horasPorHora[hora] = [];
      horasPorHora[hora].push(o);
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard/Admin/terminales')}
          className="mb-4 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a terminales
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{terminal.nombre}</h1>
                <p className="text-gray-500">{terminal.canton}, {terminal.provincia}</p>
              </div>
            </div>
          </div>

          {/* Selector de fecha */}
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm p-2">
            <button
              onClick={() => cambiarFecha(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2 px-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="border-0 focus:ring-0 text-gray-800 font-medium"
              />
            </div>
            <button
              onClick={() => cambiarFecha(1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {ocupacion && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bus className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-gray-500">Andenes</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">{terminal.andenes}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-green-600" />
              <p className="text-sm text-gray-500">Frecuencias Hoy</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">{ocupacion.totalFrecuenciasAsignadas}</p>
            <p className="text-xs text-gray-400">de {ocupacion.maxFrecuenciasDiarias} máx</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <p className="text-sm text-gray-500">Ocupación</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">{ocupacion.porcentajeOcupacion.toFixed(1)}%</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <p className="text-sm text-gray-500">Max/Hora</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">{ocupacion.maxFrecuenciasPorHora}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-gray-500">Horas Saturadas</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">{ocupacion.horasSaturadas}</p>
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Leyenda de Ocupación</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gray-100"></div>
            <span className="text-sm text-gray-600">Vacío (0%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-green-200"></div>
            <span className="text-sm text-gray-600">Bajo (&lt;30%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-yellow-200"></div>
            <span className="text-sm text-gray-600">Moderado (30-60%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-orange-200"></div>
            <span className="text-sm text-gray-600">Alto (60-90%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-red-300"></div>
            <span className="text-sm text-gray-600">Saturado (&gt;90%)</span>
          </div>
        </div>
      </div>

      {/* Grid de Ocupación por Hora */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Ocupación por Hora</h3>
        
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header con minutos */}
            <div className="grid grid-cols-5 gap-1 mb-2 pl-16">
              <div className="text-xs text-gray-500 text-center">:00</div>
              <div className="text-xs text-gray-500 text-center">:15</div>
              <div className="text-xs text-gray-500 text-center">:30</div>
              <div className="text-xs text-gray-500 text-center">:45</div>
              <div className="text-xs text-gray-500 text-center">Resumen</div>
            </div>

            {/* Filas por hora */}
            {Object.entries(horasPorHora)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([hora, slots]) => {
                const totalHora = slots.reduce((sum, s) => sum + s.frecuenciasAsignadas, 0);
                const maxHora = slots.length * (ocupacion?.maxFrecuenciasPorHora || 1);
                const porcentajeHora = (totalHora / maxHora) * 100;

                return (
                  <div key={hora} className="grid grid-cols-5 gap-1 mb-1 items-center">
                    <div className="w-14 text-right pr-2 text-sm font-medium text-gray-600">
                      {hora.padStart(2, '0')}:00
                    </div>
                    {slots.map((slot, idx) => {
                      const porcentaje = ocupacion?.maxFrecuenciasPorHora 
                        ? (slot.frecuenciasAsignadas / ocupacion.maxFrecuenciasPorHora) * 100 
                        : 0;
                      return (
                        <div
                          key={idx}
                          className={`h-10 rounded ${getOcupacionColor(porcentaje)} flex items-center justify-center transition-all hover:scale-105 cursor-pointer`}
                          title={`${slot.hora} - ${slot.frecuenciasAsignadas}/${slot.maxFrecuencias} frecuencias`}
                        >
                          <span className={`text-xs font-medium ${getOcupacionTextColor(porcentaje)}`}>
                            {slot.frecuenciasAsignadas > 0 ? slot.frecuenciasAsignadas : '-'}
                          </span>
                        </div>
                      );
                    })}
                    <div className={`h-10 rounded ${getOcupacionColor(porcentajeHora)} flex items-center justify-center`}>
                      <span className={`text-xs font-medium ${getOcupacionTextColor(porcentajeHora)}`}>
                        {totalHora}/{maxHora}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Estadísticas adicionales */}
      {ocupacion && (
        <div className="mt-6 bg-blue-50 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Resumen del Día</h3>
          <div className="grid md:grid-cols-3 gap-4 text-blue-800">
            <div>
              <p className="text-sm text-blue-600">Capacidad Utilizada</p>
              <p className="text-lg font-semibold">
                {ocupacion.totalFrecuenciasAsignadas} de {ocupacion.maxFrecuenciasDiarias} frecuencias
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-600">Horas con Disponibilidad</p>
              <p className="text-lg font-semibold">
                {ocupacion.ocupacionesPorHora.filter(o => !o.saturado).length} de {ocupacion.ocupacionesPorHora.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-600">Estado General</p>
              <p className="text-lg font-semibold">
                {ocupacion.porcentajeOcupacion < 50 
                  ? '✅ Disponibilidad Alta'
                  : ocupacion.porcentajeOcupacion < 80 
                    ? '⚠️ Ocupación Moderada'
                    : '🔴 Alta Demanda'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
