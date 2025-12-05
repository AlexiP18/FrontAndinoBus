'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useCooperativaConfig } from '@/app/context/CooperativaConfigContext';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { getToken } from '@/lib/api';
import {
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  User,
  Bus,
  ArrowLeft
} from 'lucide-react';

interface ResumenDia {
  fecha: string;
  diaSemana: string;
  horasTrabajadas: number;
  minutosTrabajados: number;
  jornadaExtendida: boolean;
}

interface ResumenHoras {
  choferId: number;
  choferNombre: string;
  semanaInicio: string;
  semanaFin: string;
  totalHorasSemana: number;
  totalMinutosSemana: number;
  diasConJornadaExtendida: number;
  diasRestantesJornadaExtendida: number;
  diasSemana: ResumenDia[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
// Normalize API_BASE to remove trailing /api if present (to avoid /api/api)
const getApiBase = () => {
  const base = API_BASE.replace(/\/api\/?$/, '');
  return base;
};

const DIAS_SEMANA: Record<string, string> = {
  'MONDAY': 'Lunes',
  'TUESDAY': 'Martes',
  'WEDNESDAY': 'Miércoles',
  'THURSDAY': 'Jueves',
  'FRIDAY': 'Viernes',
  'SATURDAY': 'Sábado',
  'SUNDAY': 'Domingo'
};

export default function MisHorasPage() {
  const { user } = useAuth();
  const { cooperativaConfig } = useCooperativaConfig();
  const router = useRouter();
  const [resumen, setResumen] = useState<ResumenHoras | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');

  // Colores dinámicos de la cooperativa
  const primaryColor = cooperativaConfig?.colorPrimario || '#ea580c';
  const secondaryColor = cooperativaConfig?.colorSecundario || '#c2410c';

  // Inicializar fecha en el cliente para evitar hydration mismatch
  useEffect(() => {
    setFechaSeleccionada(new Date().toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (user?.userId && fechaSeleccionada) {
      cargarResumen();
    }
  }, [user, fechaSeleccionada]);

  const cargarResumen = async () => {
    if (!user?.userId || !fechaSeleccionada) return;
    
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(
        `${getApiBase()}/api/asignaciones/chofer/${user.userId}/resumen-horas?fecha=${fechaSeleccionada}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Error al cargar resumen de horas');
      
      const data = await response.json();
      setResumen(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const cambiarSemana = (dias: number) => {
    const nuevaFecha = new Date(fechaSeleccionada);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    setFechaSeleccionada(nuevaFecha.toISOString().split('T')[0]);
  };

  const formatearHoras = (horas: number, minutos: number) => {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${h}h ${m}m`;
  };

  const getProgressColor = (horas: number, limite: number) => {
    const porcentaje = (horas / limite) * 100;
    if (porcentaje < 60) return 'bg-green-500';
    if (porcentaje < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading || !fechaSeleccionada) {
    return (
      <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['CHOFER']}>
        <div className="flex items-center justify-center min-h-screen">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2"
            style={{ borderColor: primaryColor }}
          ></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['CHOFER']}>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 font-medium mb-4 transition-colors"
            style={{ color: primaryColor }}
            onMouseEnter={(e) => e.currentTarget.style.color = secondaryColor}
            onMouseLeave={(e) => e.currentTarget.style.color = primaryColor}
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-8 h-8" style={{ color: primaryColor }} />
            <h1 className="text-3xl font-bold text-gray-800">Mis Horas de Trabajo</h1>
          </div>
          <p className="text-gray-600">Control de jornada laboral semanal</p>
      </div>

      {/* Selector de Semana */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          onClick={() => cambiarSemana(-7)}
          className="p-2 hover:bg-gray-200 rounded-lg"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        
        <div className="bg-white rounded-lg shadow-sm px-6 py-3 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-400" />
          {resumen && (
            <span className="font-medium text-gray-800">
              {new Date(resumen.semanaInicio).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}
              {' - '}
              {new Date(resumen.semanaFin).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>

        <button
          onClick={() => cambiarSemana(7)}
          className="p-2 hover:bg-gray-200 rounded-lg"
        >
          <ChevronRight className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {resumen && (
        <>
          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm text-gray-500">Total Semana</p>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {formatearHoras(resumen.totalHorasSemana, resumen.totalMinutosSemana)}
              </p>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressColor(resumen.totalHorasSemana, 48)} transition-all`}
                  style={{ width: `${Math.min((resumen.totalHorasSemana / 48) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">de 48h máximo semanal</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}20` }}>
                  <TrendingUp className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <p className="text-sm text-gray-500">Jornada Extendida</p>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {resumen.diasConJornadaExtendida} / 2 días
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {resumen.diasRestantesJornadaExtendida > 0 
                  ? `${resumen.diasRestantesJornadaExtendida} días disponibles`
                  : 'Límite alcanzado'}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-gray-500">Promedio Diario</p>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {(resumen.totalMinutosSemana / 7 / 60).toFixed(1)}h
              </p>
              <p className="text-sm text-gray-500 mt-1">por día trabajado</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-sm text-gray-500">Estado</p>
              </div>
              {resumen.diasConJornadaExtendida >= 2 ? (
                <div className="flex items-center gap-2" style={{ color: primaryColor }}>
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Límite Jornada</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Disponible</span>
                </div>
              )}
            </div>
          </div>

          {/* Detalle por Día */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-800">Detalle por Día</h3>
            </div>
            
            <div className="divide-y">
              {resumen.diasSemana.map((dia) => {
                const esHoy = new Date(dia.fecha).toDateString() === new Date().toDateString();
                const limiteHoras = dia.jornadaExtendida ? 10 : 8;
                
                return (
                  <div 
                    key={dia.fecha} 
                    className={`px-6 py-4 flex items-center justify-between ${esHoy ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: dia.horasTrabajadas > 0 ? `${primaryColor}20` : '#f3f4f6' }}
                      >
                        <span 
                          className="text-lg font-bold"
                          style={{ color: dia.horasTrabajadas > 0 ? primaryColor : '#9ca3af' }}
                        >
                          {new Date(dia.fecha).getDate()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {DIAS_SEMANA[dia.diaSemana] || dia.diaSemana}
                          {esHoy && <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">HOY</span>}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(dia.fecha).toLocaleDateString('es-EC', { day: 'numeric', month: 'long' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Barra de progreso */}
                      <div className="w-48">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">
                            {formatearHoras(dia.horasTrabajadas, dia.minutosTrabajados)}
                          </span>
                          <span className="text-gray-400">{limiteHoras}h máx</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${getProgressColor(dia.horasTrabajadas, limiteHoras)}`}
                            style={{ width: `${Math.min((dia.horasTrabajadas / limiteHoras) * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Badge de jornada */}
                      {dia.jornadaExtendida && (
                        <span 
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: `${primaryColor}20`, color: secondaryColor }}
                        >
                          Jornada Extendida
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Información adicional */}
          <div className="mt-6 bg-blue-50 rounded-xl p-6">
            <h4 className="font-semibold text-blue-900 mb-3">Información sobre Jornada Laboral</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600 shrink-0" />
                <p>Jornada normal: máximo <strong>8 horas</strong> por día</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600 shrink-0" />
                <p>Jornada extendida: hasta <strong>10 horas</strong> (máximo 2 días/semana)</p>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: primaryColor }} />
                <p>Al agotar jornadas extendidas, el límite diario será de 8 horas</p>
              </div>
              <div className="flex items-start gap-2">
                <Bus className="w-4 h-4 mt-0.5 text-blue-600 shrink-0" />
                <p>Las horas se calculan según la duración de cada viaje asignado</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
    </ProtectedRoute>
  );
}
