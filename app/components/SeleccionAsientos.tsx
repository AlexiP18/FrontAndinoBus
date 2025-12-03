'use client';

import { useState, useEffect } from 'react';
import { viajeAsientosApi, reservasApi, type AsientoDisponibilidadDto } from '@/lib/api';
import { Check, X, User, Crown, Accessibility } from 'lucide-react';

interface SeleccionAsientosProps {
  viajeId?: number;
  frecuenciaId?: number;
  fecha?: string;
  onSeleccionChange: (asientos: string[]) => void;
  maxAsientos?: number;
}

export default function SeleccionAsientos({ 
  viajeId,
  frecuenciaId,
  fecha,
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
  }, [viajeId, frecuenciaId, fecha]);

  useEffect(() => {
    onSeleccionChange(asientosSeleccionados);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asientosSeleccionados]);

  const cargarAsientos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let data: AsientoDisponibilidadDto[];
      
      if (frecuenciaId && fecha) {
        // Modo frecuencia: usado por Oficinista - ahora devuelve {viajeId, asientos}
        const response = await reservasApi.obtenerAsientosDisponiblesPorFrecuencia(frecuenciaId, fecha, token || undefined);
        data = response.asientos;
      } else if (viajeId) {
        // Modo viaje: usado por Cliente
        data = await viajeAsientosApi.obtenerAsientos(viajeId, token || undefined);
      } else {
        throw new Error('Se requiere viajeId o (frecuenciaId + fecha)');
      }
      
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
    if (asientosSeleccionados.includes(asiento.numeroAsiento)) {
      return 'bg-blue-600 text-white border-blue-700';
    }
    
    if (asiento.estado === 'RESERVADO') {
      return 'bg-orange-100 text-orange-800 border-orange-300';
    }
    
    if (asiento.estado === 'VENDIDO') {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    
    if (asiento.estado === 'BLOQUEADO') {
      return 'bg-gray-200 text-gray-600 border-gray-300';
    }
    
    // DISPONIBLE
    if (asiento.tipoAsiento === 'VIP') {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    } else if (asiento.tipoAsiento === 'ACONDICIONADO') {
      return 'bg-purple-100 text-purple-800 border-purple-300';

    } else {
      return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  const getIcono = (asiento: AsientoDisponibilidadDto) => {
    if (asientosSeleccionados.includes(asiento.numeroAsiento)) {
      return <Check className="w-4 h-4 mb-1" />;
    }
    if (asiento.estado !== 'DISPONIBLE') {
      return <X className="w-4 h-4 mb-1" />;
    }
    // Para asientos disponibles no seleccionados, no mostrar icono
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Organizar asientos en grid (4 columnas: 2 izquierda, 2 derecha)
  const organizarEnGrid = () => {
    // Detectar fila trasera: 5 asientos en la última fila (columnas 0-4)
    const maxFila = asientos.length > 0 ? Math.max(...asientos.map(a => parseInt(a.numeroAsiento))) : 0;
    const asientosOrdenados = [...asientos].sort((a, b) => parseInt(a.numeroAsiento) - parseInt(b.numeroAsiento));
    
    // Verificar si los últimos 5 asientos forman una fila continua
    const ultimos5 = asientosOrdenados.slice(-5);
    const tieneFilaTrasera = asientosOrdenados.length >= 5 && 
      (asientosOrdenados.length - 5) % 4 === 0; // Los anteriores deben ser múltiplos de 4
    
    const asientosSinTraseros = tieneFilaTrasera ? asientosOrdenados.slice(0, -5) : asientosOrdenados;
    const asientosTraseros = tieneFilaTrasera ? ultimos5 : [];
    
    const filas: AsientoDisponibilidadDto[][] = [];
    const asientosPorFila = 4; // 2 izquierda + 2 derecha
    
    for (let i = 0; i < asientosSinTraseros.length; i += asientosPorFila) {
      filas.push(asientosSinTraseros.slice(i, i + asientosPorFila));
    }
    
    return { filas, asientosTraseros };
  };

  const { filas, asientosTraseros } = organizarEnGrid();

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Selecciona los Asientos</h2>
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
          <div className="w-10 h-10 bg-green-100 border-2 border-green-300 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-green-800" />
          </div>
          <span className="text-gray-700">Normal Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-yellow-100 border-2 border-yellow-300 rounded-lg flex items-center justify-center">
            <Crown className="w-5 h-5 text-yellow-800" />
          </div>
          <span className="text-gray-700">VIP Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-purple-100 border-2 border-purple-300 rounded-lg flex items-center justify-center">
            <Accessibility className="w-5 h-5 text-purple-800" />
          </div>
          <span className="text-gray-700">Acondicionado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 border-2 border-blue-700 rounded-lg flex items-center justify-center">
            <Check className="w-5 h-5 text-white" />
          </div>
          <span className="text-gray-700">Seleccionado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-red-100 border-2 border-red-300 rounded-lg flex items-center justify-center">
            <X className="w-5 h-5 text-red-800" />
          </div>
          <span className="text-gray-700">Ocupado</span>
        </div>
      </div>

      {/* Visualización del bus */}
      <div className="flex flex-col items-center gap-4">
        {/* Parte frontal del bus */}
        <div className="w-full max-w-3xl">
          <div className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-t-3xl shadow-xl p-4">
            <div className="flex items-center justify-center gap-3 text-white">
              <div className="text-3xl">
                🚗
              </div>
              <span className="font-semibold">Cabina del Conductor</span>
            </div>
          </div>
        </div>

        {/* Grid de asientos con pasillo */}
        <div className="w-full max-w-3xl bg-white rounded-lg p-6 shadow-inner border-2 border-gray-200">
          <div className="space-y-3">
            {filas.map((fila, filaIdx) => (
              <div key={`fila-${filaIdx}`} className="flex items-center gap-3 justify-center">
                {/* Número de fila */}
                <div className="w-8 text-center text-sm font-semibold text-gray-500">
                  {filaIdx + 1}
                </div>

                {/* Asientos lado izquierdo (2 asientos) */}
                <div className="flex gap-2">
                  {fila.slice(0, 2).map((asiento) => {
                    const isSelected = asientosSeleccionados.includes(asiento.numeroAsiento);
                    const colorClass = getAsientoColor(asiento);

                    return (
                      <button
                        key={asiento.numeroAsiento}
                        onClick={() => toggleAsiento(asiento.numeroAsiento, asiento.estado)}
                        disabled={asiento.estado !== 'DISPONIBLE'}
                        className={`w-16 h-16 border-2 rounded-lg font-bold text-xs transition-all ${
                          asiento.estado === 'DISPONIBLE' ? 'hover:scale-110 hover:shadow-lg cursor-pointer' : 'cursor-not-allowed'
                        } flex flex-col items-center justify-center ${colorClass}`}
                        title={`Asiento ${asiento.numeroAsiento} - ${asiento.tipoAsiento} - ${asiento.estado}`}
                      >
                        {getIcono(asiento)}
                        <span className="text-base font-bold">{asiento.numeroAsiento}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Pasillo central */}
                <div className="w-12 border-l-2 border-r-2 border-dashed border-gray-300 h-16 flex items-center justify-center">
                  <span className="text-gray-400 text-xs rotate-90 whitespace-nowrap">PASILLO</span>
                </div>

                {/* Asientos lado derecho (2 asientos) */}
                <div className="flex gap-2">
                  {fila.slice(2, 4).map((asiento) => {
                    const isSelected = asientosSeleccionados.includes(asiento.numeroAsiento);
                    const colorClass = getAsientoColor(asiento);

                    return (
                      <button
                        key={asiento.numeroAsiento}
                        onClick={() => toggleAsiento(asiento.numeroAsiento, asiento.estado)}
                        disabled={asiento.estado !== 'DISPONIBLE'}
                        className={`w-16 h-16 border-2 rounded-lg font-bold text-xs transition-all ${
                          asiento.estado === 'DISPONIBLE' ? 'hover:scale-110 hover:shadow-lg cursor-pointer' : 'cursor-not-allowed'
                        } flex flex-col items-center justify-center ${colorClass}`}
                        title={`Asiento ${asiento.numeroAsiento} - ${asiento.tipoAsiento} - ${asiento.estado}`}
                      >
                        {getIcono(asiento)}
                        <span className="text-base font-bold">{asiento.numeroAsiento}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Número de fila (derecha) */}
                <div className="w-8 text-center text-sm font-semibold text-gray-500">
                  {filaIdx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fila trasera continua (si existe) */}
        {asientosTraseros.length > 0 && (
          <div className="w-full max-w-3xl">
            <div className="bg-white rounded-lg p-4 shadow-inner border-2 border-gray-200">
              <div className="text-center mb-2">
                <span className="text-xs font-semibold text-gray-600 uppercase">Fila Trasera Continua</span>
              </div>
              <div className="flex items-center gap-3 justify-center">
                {/* 2 asientos izquierda */}
                <div className="flex gap-2">
                  {asientosTraseros.slice(0, 2).map((asiento) => {
                    const colorClass = getAsientoColor(asiento);

                    return (
                      <button
                        key={asiento.numeroAsiento}
                        onClick={() => toggleAsiento(asiento.numeroAsiento, asiento.estado)}
                        disabled={asiento.estado !== 'DISPONIBLE'}
                        className={`w-16 h-16 border-2 rounded-lg font-bold text-xs transition-all ${
                          asiento.estado === 'DISPONIBLE' ? 'hover:scale-110 hover:shadow-lg cursor-pointer' : 'cursor-not-allowed'
                        } flex flex-col items-center justify-center ${colorClass}`}
                        title={`Asiento ${asiento.numeroAsiento} - ${asiento.tipoAsiento} - ${asiento.estado}`}
                      >
                        {getIcono(asiento)}
                        <span className="text-base font-bold">{asiento.numeroAsiento}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Asiento central (ocupa el espacio del pasillo) */}
                {asientosTraseros.length >= 3 && (
                  <div className="flex gap-2">
                    {(() => {
                      const asiento = asientosTraseros[2];
                      const colorClass = getAsientoColor(asiento);

                      return (
                        <button
                          key={asiento.numeroAsiento}
                          onClick={() => toggleAsiento(asiento.numeroAsiento, asiento.estado)}
                          disabled={asiento.estado !== 'DISPONIBLE'}
                          className={`w-16 h-16 border-2 rounded-lg font-bold text-xs transition-all ${
                            asiento.estado === 'DISPONIBLE' ? 'hover:scale-110 hover:shadow-lg cursor-pointer' : 'cursor-not-allowed'
                          } flex flex-col items-center justify-center ${colorClass}`}
                          title={`Asiento ${asiento.numeroAsiento} - ${asiento.tipoAsiento} - ${asiento.estado}`}
                        >
                          {getIcono(asiento)}
                          <span className="text-base font-bold">{asiento.numeroAsiento}</span>
                        </button>
                      );
                    })()}
                  </div>
                )}

                {/* 2 asientos derecha */}
                <div className="flex gap-2">
                  {asientosTraseros.slice(3, 5).map((asiento) => {
                    const colorClass = getAsientoColor(asiento);

                    return (
                      <button
                        key={asiento.numeroAsiento}
                        onClick={() => toggleAsiento(asiento.numeroAsiento, asiento.estado)}
                        disabled={asiento.estado !== 'DISPONIBLE'}
                        className={`w-16 h-16 border-2 rounded-lg font-bold text-xs transition-all ${
                          asiento.estado === 'DISPONIBLE' ? 'hover:scale-110 hover:shadow-lg cursor-pointer' : 'cursor-not-allowed'
                        } flex flex-col items-center justify-center ${colorClass}`}
                        title={`Asiento ${asiento.numeroAsiento} - ${asiento.tipoAsiento} - ${asiento.estado}`}
                      >
                        {getIcono(asiento)}
                        <span className="text-base font-bold">{asiento.numeroAsiento}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Parte trasera del bus */}
        <div className="w-full max-w-3xl">
          <div className="bg-gray-200 rounded-b-3xl p-3 text-center">
            <span className="text-gray-600 text-sm font-semibold">Parte Trasera</span>
          </div>
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
