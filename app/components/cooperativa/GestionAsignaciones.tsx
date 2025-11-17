'use client';

import { useState, useEffect } from 'react';
import { Calendar, Bus, Route, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cooperativaApi, AsignacionBusFrecuenciaDto, getToken } from '@/lib/api';
import NuevaAsignacionModal from './NuevaAsignacionModal';

interface GestionAsignacionesProps {
  cooperativaId: number;
}

export default function GestionAsignaciones({ cooperativaId }: GestionAsignacionesProps) {
  const [asignaciones, setAsignaciones] = useState<AsignacionBusFrecuenciaDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    cargarAsignaciones();
  }, [cooperativaId]);

  const cargarAsignaciones = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      const data = await cooperativaApi.obtenerAsignaciones(cooperativaId, token);
      setAsignaciones(data);
    } catch (error) {
      console.error('Error cargando asignaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const finalizarAsignacion = async (asignacionId: number) => {
    if (!confirm('¿Está seguro de finalizar esta asignación?')) return;

    try {
      const token = getToken();
      if (!token) return;

      await cooperativaApi.finalizarAsignacion(asignacionId, token);
      await cargarAsignaciones();
    } catch (error) {
      console.error('Error finalizando asignación:', error);
      alert('Error al finalizar la asignación');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estilos = {
      ACTIVA: 'bg-green-100 text-green-800',
      SUSPENDIDA: 'bg-yellow-100 text-yellow-800',
      FINALIZADA: 'bg-gray-100 text-gray-800',
    };
    return estilos[estado as keyof typeof estilos] || 'bg-gray-100 text-gray-800';
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Asignaciones Bus-Frecuencia</h2>
          <p className="text-sm text-gray-500 mt-1">
            {asignaciones.length} {asignaciones.length === 1 ? 'asignación' : 'asignaciones'} registradas
          </p>
        </div>
        <button 
          onClick={() => setMostrarFormulario(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Calendar size={20} />
          Nueva Asignación
        </button>
      </div>

      {/* Información */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Sobre las asignaciones:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Un bus solo puede tener una asignación ACTIVA a la vez</li>
              <li>Al asignar un bus, su estado cambia a EN_SERVICIO</li>
              <li>Al finalizar, el bus vuelve a estado DISPONIBLE</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Lista de Asignaciones */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando asignaciones...</p>
        </div>
      ) : asignaciones.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100 text-center">
          <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 mb-2">No hay asignaciones registradas</p>
          <p className="text-sm text-gray-500">Comienza asignando buses a frecuencias</p>
        </div>
      ) : (
        <div className="space-y-4">
          {asignaciones.map((asignacion) => (
            <div 
              key={asignacion.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoBadge(asignacion.estado)}`}>
                      {asignacion.estado}
                    </span>
                    <span className="text-sm text-gray-500">
                      ID: {asignacion.id}
                    </span>
                  </div>
                </div>
                {asignacion.estado === 'ACTIVA' && (
                  <button
                    onClick={() => finalizarAsignacion(asignacion.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                  >
                    <XCircle size={16} />
                    Finalizar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información del Bus */}
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Bus className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Bus Asignado</p>
                    <p className="font-bold text-gray-800 text-lg">{asignacion.bus.placa}</p>
                    {asignacion.bus.numeroInterno && (
                      <p className="text-sm text-gray-600">#{asignacion.bus.numeroInterno}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {asignacion.bus.capacidadAsientos} asientos • {asignacion.bus.estado}
                    </p>
                  </div>
                </div>

                {/* Información de Fechas */}
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Calendar className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Período de Asignación</p>
                    <p className="font-medium text-gray-800">
                      Inicio: {formatearFecha(asignacion.fechaInicio)}
                    </p>
                    {asignacion.fechaFin && (
                      <p className="font-medium text-gray-800">
                        Fin: {formatearFecha(asignacion.fechaFin)}
                      </p>
                    )}
                    {!asignacion.fechaFin && (
                      <p className="text-sm text-blue-600">Sin fecha de finalización</p>
                    )}
                  </div>
                </div>
              </div>

              {asignacion.observaciones && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Observaciones:</span> {asignacion.observaciones}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Nueva Asignación */}
      <NuevaAsignacionModal
        isOpen={mostrarFormulario}
        onClose={() => setMostrarFormulario(false)}
        cooperativaId={cooperativaId}
        onSuccess={cargarAsignaciones}
      />
    </div>
  );
}
