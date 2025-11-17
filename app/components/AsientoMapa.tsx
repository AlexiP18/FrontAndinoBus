'use client';

import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { reservasApi } from '@/lib/api';

interface AsientoMapaProps {
  viajeId: number;
  totalAsientos?: number;
  asientosOcupados?: string[];
  onAsientosChange?: (asientos: string[]) => void;
  maxSeleccion?: number;
}

type EstadoAsiento = 'disponible' | 'ocupado' | 'seleccionado';

export default function AsientoMapa({
  viajeId,
  totalAsientos = 40,
  asientosOcupados = [],
  onAsientosChange,
  maxSeleccion = 5,
}: AsientoMapaProps) {
  const [asientosSeleccionados, setAsientosSeleccionados] = useState<string[]>([]);
  const [asientosOcupadosBackend, setAsientosOcupadosBackend] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDisponibilidad = async () => {
      try {
        const asientos = await reservasApi.obtenerAsientosDisponibles(viajeId);
        const ocupados = asientos
          .filter(a => a.estado === 'OCUPADO' || a.estado === 'RESERVADO' || a.estado === 'VENDIDO')
          .map(a => a.numeroAsiento);
        setAsientosOcupadosBackend(ocupados);
      } catch (error) {
        console.error('Error cargando disponibilidad:', error);
        // Usar asientosOcupados prop como fallback
      } finally {
        setLoading(false);
      }
    };

    cargarDisponibilidad();
  }, [viajeId]);

  // Combinar asientos ocupados del backend y del prop
  const todosAsientosOcupados = [...new Set([...asientosOcupadosBackend, ...asientosOcupados])];
  
  // Generar distribución de asientos (2-2 layout típico de buses)
  const filas = Math.ceil(totalAsientos / 4);
  const asientos: string[] = [];
  
  for (let fila = 1; fila <= filas; fila++) {
    // Lado izquierdo
    asientos.push(`${fila}A`);
    asientos.push(`${fila}B`);
    // Lado derecho
    asientos.push(`${fila}C`);
    asientos.push(`${fila}D`);
  }

  const getEstadoAsiento = (asiento: string): EstadoAsiento => {
    if (asientosSeleccionados.includes(asiento)) return 'seleccionado';
    if (todosAsientosOcupados.includes(asiento)) return 'ocupado';
    return 'disponible';
  };

  const handleAsientoClick = (asiento: string) => {
    const estado = getEstadoAsiento(asiento);
    
    if (estado === 'ocupado') return;

    let nuevosAsientos: string[];
    
    if (estado === 'seleccionado') {
      // Deseleccionar
      nuevosAsientos = asientosSeleccionados.filter(a => a !== asiento);
    } else {
      // Seleccionar (si no se ha alcanzado el máximo)
      if (asientosSeleccionados.length >= maxSeleccion) {
        alert(`Máximo ${maxSeleccion} asientos por compra`);
        return;
      }
      nuevosAsientos = [...asientosSeleccionados, asiento];
    }

    setAsientosSeleccionados(nuevosAsientos);
    onAsientosChange && onAsientosChange(nuevosAsientos);
  };

  const getAsientoStyle = (estado: EstadoAsiento) => {
    const baseStyle = 'w-12 h-12 rounded-lg font-semibold text-sm transition-all cursor-pointer flex items-center justify-center';
    
    switch (estado) {
      case 'disponible':
        return `${baseStyle} bg-green-100 text-green-800 border-2 border-green-300 hover:bg-green-200 hover:border-green-400`;
      case 'ocupado':
        return `${baseStyle} bg-gray-200 text-gray-500 border-2 border-gray-300 cursor-not-allowed`;
      case 'seleccionado':
        return `${baseStyle} bg-blue-600 text-white border-2 border-blue-700 shadow-lg scale-105`;
      default:
        return baseStyle;
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando disponibilidad de asientos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Leyenda */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="font-bold text-gray-800 mb-3">Selecciona tus asientos</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-100 border-2 border-green-300 rounded"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 border-2 border-blue-700 rounded"></div>
            <span>Seleccionado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-200 border-2 border-gray-300 rounded"></div>
            <span>Ocupado</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Asientos seleccionados: <span className="font-bold text-blue-600">{asientosSeleccionados.length}</span> / {maxSeleccion}
        </p>
      </div>

      {/* Mapa de Asientos */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Indicador de frente del bus */}
        <div className="mb-6 text-center">
          <div className="inline-block bg-gray-800 text-white px-6 py-2 rounded-t-full">
            <span className="text-sm font-semibold">🚍 CONDUCTOR</span>
          </div>
        </div>

        {/* Grid de asientos */}
        <div className="space-y-3">
          {Array.from({ length: filas }, (_, i) => {
            const fila = i + 1;
            const asientosFila = [
              `${fila}A`,
              `${fila}B`,
              'pasillo',
              `${fila}C`,
              `${fila}D`,
            ];

            return (
              <div key={fila} className="flex justify-center items-center gap-2">
                {/* Número de fila */}
                <span className="w-6 text-center text-gray-500 font-medium text-sm">
                  {fila}
                </span>

                {/* Asientos de la fila */}
                {asientosFila.map((asiento, idx) => {
                  if (asiento === 'pasillo') {
                    return <div key="pasillo" className="w-8"></div>;
                  }

                  const estado = getEstadoAsiento(asiento);

                  return (
                    <button
                      key={asiento}
                      onClick={() => handleAsientoClick(asiento)}
                      disabled={estado === 'ocupado'}
                      className={getAsientoStyle(estado)}
                      title={`Asiento ${asiento} - ${estado}`}
                    >
                      {estado === 'seleccionado' && <Check className="w-5 h-5" />}
                      {estado === 'ocupado' && <X className="w-5 h-5" />}
                      {estado === 'disponible' && asiento}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Parte trasera del bus */}
        <div className="mt-6 text-center">
          <div className="inline-block bg-gray-200 text-gray-600 px-6 py-1 rounded-b-lg">
            <span className="text-xs font-semibold">PARTE TRASERA</span>
          </div>
        </div>
      </div>

      {/* Resumen de selección */}
      {asientosSeleccionados.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-bold text-blue-900 mb-2">Asientos seleccionados:</h4>
          <div className="flex flex-wrap gap-2">
            {asientosSeleccionados.map(asiento => (
              <span
                key={asiento}
                className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
              >
                {asiento}
                <button
                  onClick={() => handleAsientoClick(asiento)}
                  className="ml-1 hover:bg-blue-700 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
