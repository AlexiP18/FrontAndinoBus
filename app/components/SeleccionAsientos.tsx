'use client';

import { useState, useEffect } from 'react';
import { reservasApi, type AsientoDisponibilidadDto } from '@/lib/api';
import { Check, X, User } from 'lucide-react';

interface SeleccionAsientosProps {
  viajeId: number;
  onSeleccionChange: (asientos: string[]) => void;
  maxAsientos?: number;
}

export default function SeleccionAsientos({ 
  viajeId, 
  onSeleccionChange, 
  maxAsientos = 5 
}: SeleccionAsientosProps) {
  const [asientos, setAsientos] = useState<AsientoDisponibilidadDto[]>([]);
  const [asientosSeleccionados, setAsientosSeleccionados] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarAsientos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viajeId]);

  useEffect(() => {
    onSeleccionChange(asientosSeleccionados);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asientosSeleccionados]);

  const cargarAsientos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const data = await reservasApi.obtenerAsientosDisponibles(viajeId, token || undefined);
      setAsientos(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar asientos';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAsiento = (numero: string, estado: string) => {
    if (estado !== 'DISPONIBLE') return;

    if (asientosSeleccionados.includes(numero)) {
      setAsientosSeleccionados(prev => prev.filter(a => a !== numero));
    } else {
      if (asientosSeleccionados.length >= maxAsientos) {
        setError(`Máximo ${maxAsientos} asientos por reserva`);
        setTimeout(() => setError(''), 3000);
        return;
      }
      setAsientosSeleccionados(prev => [...prev, numero]);
    }
  };

  const getAsientoColor = (asiento: AsientoDisponibilidadDto) => {
    if (asientosSeleccionados.includes(asiento.numero)) {
      return 'bg-blue-600 text-white border-blue-700';
    }
    switch (asiento.estado) {
      case 'DISPONIBLE':
        return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 cursor-pointer';
      case 'RESERVADO':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 cursor-not-allowed';
      case 'VENDIDO':
        return 'bg-red-100 text-red-800 border-red-300 cursor-not-allowed';
      case 'BLOQUEADO':
        return 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getIcono = (asiento: AsientoDisponibilidadDto) => {
    if (asientosSeleccionados.includes(asiento.numero)) {
      return <Check className="w-5 h-5" />;
    }
    if (asiento.estado === 'DISPONIBLE') {
      return <User className="w-5 h-5" />;
    }
    return <X className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Selecciona tus Asientos</h2>
        <div className="text-sm text-gray-600">
          Seleccionados: <span className="font-semibold text-blue-600">{asientosSeleccionados.length}/{maxAsientos}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 border-2 border-green-300 rounded flex items-center justify-center">
            <User className="w-4 h-4 text-green-800" />
          </div>
          <span className="text-gray-700">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 border-2 border-blue-700 rounded flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
          <span className="text-gray-700">Seleccionado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-100 border-2 border-red-300 rounded flex items-center justify-center">
            <X className="w-4 h-4 text-red-800" />
          </div>
          <span className="text-gray-700">Ocupado</span>
        </div>
      </div>

      {/* Mapa de asientos - Simulación de bus */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        {/* Parte frontal del bus */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-800 text-white px-8 py-2 rounded-t-3xl font-semibold">
            CONDUCTOR
          </div>
        </div>

        {/* Grid de asientos - 4 columnas (2 a cada lado del pasillo) */}
        <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
          {asientos.map((asiento, index) => (
            <div
              key={asiento.numero}
              className={`
                ${getAsientoColor(asiento)}
                border-2 rounded-lg p-4 
                flex flex-col items-center justify-center
                transition-all duration-200
                ${asiento.estado === 'DISPONIBLE' ? 'hover:scale-105' : ''}
                ${(index + 1) % 4 === 2 ? 'mr-8' : ''} // Espacio para pasillo
              `}
              onClick={() => toggleAsiento(asiento.numero, asiento.estado)}
            >
              {getIcono(asiento)}
              <span className="mt-2 font-semibold text-sm">{asiento.numero}</span>
              {asiento.tipo === 'VIP' && (
                <span className="text-xs mt-1 px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded-full">
                  VIP
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Resumen de selección */}
      {asientosSeleccionados.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Asientos Seleccionados:</h3>
          <div className="flex flex-wrap gap-2">
            {asientosSeleccionados.map(asiento => (
              <span
                key={asiento}
                className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold"
              >
                {asiento}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
