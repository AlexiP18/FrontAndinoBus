'use client';

import { useState, useEffect } from 'react';
import { Bus, User, Clock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import {
  frecuenciaConfigApi,
  getToken,
  type BusDisponibilidadResponse,
  type ChoferDisponibilidadResponse,
} from '@/lib/api';

interface Props {
  cooperativaId: number;
  fecha?: string;
}

export default function DisponibilidadPanel({ cooperativaId, fecha: propFecha }: Props) {
  const [fecha, setFecha] = useState(propFecha || new Date().toISOString().split('T')[0]);
  const [buses, setBuses] = useState<BusDisponibilidadResponse[]>([]);
  const [choferes, setChoferes] = useState<ChoferDisponibilidadResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'buses' | 'choferes'>('buses');

  useEffect(() => {
    cargarDisponibilidad();
  }, [cooperativaId, fecha]);

  const cargarDisponibilidad = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const [busesData, choferesData] = await Promise.all([
        frecuenciaConfigApi.getBusesDisponibles(cooperativaId, fecha, token || ''),
        frecuenciaConfigApi.getChoferesDisponibles(cooperativaId, fecha, token || ''),
      ]);
      setBuses(busesData);
      setChoferes(choferesData);
    } catch (err) {
      console.error('Error cargando disponibilidad:', err);
    } finally {
      setLoading(false);
    }
  };

  const busesDisponibles = buses.filter(b => b.disponible).length;
  const choferesDisponibles = choferes.filter(c => c.disponible).length;

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Disponibilidad del Día</h3>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
          />
          <button
            onClick={cargarDisponibilidad}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 divide-x border-b">
        <button
          onClick={() => setActiveTab('buses')}
          className={`p-4 text-center transition ${
            activeTab === 'buses' ? 'bg-purple-50' : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Bus className={`w-5 h-5 ${activeTab === 'buses' ? 'text-purple-600' : 'text-gray-400'}`} />
            <span className="font-semibold text-lg text-gray-900">{busesDisponibles}/{buses.length}</span>
          </div>
          <p className="text-xs text-gray-500">Buses disponibles</p>
        </button>
        <button
          onClick={() => setActiveTab('choferes')}
          className={`p-4 text-center transition ${
            activeTab === 'choferes' ? 'bg-purple-50' : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <User className={`w-5 h-5 ${activeTab === 'choferes' ? 'text-purple-600' : 'text-gray-400'}`} />
            <span className="font-semibold text-lg text-gray-900">{choferesDisponibles}/{choferes.length}</span>
          </div>
          <p className="text-xs text-gray-500">Choferes disponibles</p>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : activeTab === 'buses' ? (
          <div className="space-y-2">
            {buses.map((bus) => (
              <div
                key={bus.busId}
                className={`p-3 rounded-lg border ${
                  bus.disponible
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{bus.placa}</span>
                      <span className="text-xs text-gray-500">#{bus.numeroInterno}</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {bus.capacidadAsientos} asientos • {bus.frecuenciasHoy} viajes hoy
                    </p>
                  </div>
                  <div className="text-right">
                    {bus.disponible ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {bus.horasDisponiblesHoy.toFixed(1)}h
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs">{bus.motivoNoDisponible}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Choferes asignados */}
                {bus.choferesAsignados.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Choferes:</p>
                    <div className="flex flex-wrap gap-1">
                      {bus.choferesAsignados.map((chofer) => (
                        <span
                          key={chofer.choferId}
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            chofer.disponible
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {chofer.tipo === 'PRINCIPAL' && '★ '}
                          {chofer.nombre.split(' ')[0]}
                          ({chofer.horasDisponiblesHoy.toFixed(1)}h)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {buses.length === 0 && (
              <p className="text-center text-gray-500 py-4">No hay buses registrados</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {choferes.map((chofer) => (
              <div
                key={chofer.choferId}
                className={`p-3 rounded-lg border ${
                  chofer.disponible
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-900">{chofer.nombre}</p>
                    <p className="text-xs text-gray-600">
                      CI: {chofer.cedula} • {chofer.frecuenciasHoy} viajes hoy
                    </p>
                    {chofer.busAsignadoPlaca && (
                      <p className="text-xs text-purple-600 mt-1">
                        Bus: {chofer.busAsignadoPlaca}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {chofer.disponible ? (
                      <div>
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {chofer.horasDisponiblesHoy.toFixed(1)}h
                          </span>
                        </div>
                        {chofer.puedeTrabajarHorasExcepcionales && (
                          <p className="text-xs text-yellow-600">
                            Puede hacer extras ({2 - chofer.diasExcepcionalesUsadosSemana} días disponibles)
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs">{chofer.motivoNoDisponible}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Barra de progreso de horas */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Horas trabajadas</span>
                    <span>{chofer.horasTrabajadasHoy.toFixed(1)}h / 8h</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        chofer.horasTrabajadasHoy > 8
                          ? 'bg-yellow-500'
                          : chofer.horasTrabajadasHoy > 6
                          ? 'bg-orange-400'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, (chofer.horasTrabajadasHoy / 10) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {choferes.length === 0 && (
              <p className="text-center text-gray-500 py-4">No hay choferes registrados</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
