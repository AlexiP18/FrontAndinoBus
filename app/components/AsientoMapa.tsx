'use client';

import { useState, useEffect } from 'react';
import { Check, X, Bus, Crown, Armchair, Accessibility, Minus } from 'lucide-react';
import { reservasApi, AsientoDisponibilidadDto } from '@/lib/api';

interface AsientoMapaProps {
  viajeId?: number;
  frecuenciaId?: number;
  fecha?: string;
  totalAsientos?: number;
  asientosOcupados?: string[];
  onAsientosChange?: (asientos: string[]) => void;
  onViajeIdChange?: (viajeId: number) => void; // Callback para pasar el viajeId real
  maxSeleccion?: number;
}

type EstadoAsiento = 'disponible' | 'ocupado' | 'seleccionado' | 'deshabilitado';

export default function AsientoMapa({
  viajeId,
  frecuenciaId,
  fecha,
  totalAsientos = 40,
  asientosOcupados = [],
  onAsientosChange,
  onViajeIdChange,
  maxSeleccion = 5,
}: AsientoMapaProps) {
  const [asientosSeleccionados, setAsientosSeleccionados] = useState<string[]>([]);
  const [asientosBackend, setAsientosBackend] = useState<AsientoDisponibilidadDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [pisoActivo, setPisoActivo] = useState<number>(1);

  useEffect(() => {
    const cargarDisponibilidad = async () => {
      try {
        let asientos: AsientoDisponibilidadDto[];
        if (frecuenciaId && fecha) {
          // Usar endpoint por frecuencia+fecha - ahora devuelve {viajeId, asientos}
          const response = await reservasApi.obtenerAsientosDisponiblesPorFrecuencia(frecuenciaId, fecha);
          asientos = response.asientos;
          // Notificar el viajeId real al componente padre
          if (onViajeIdChange && response.viajeId) {
            onViajeIdChange(response.viajeId);
          }
        } else if (viajeId) {
          // Usar endpoint por viajeId
          asientos = await reservasApi.obtenerAsientosDisponibles(viajeId);
        } else {
          throw new Error('Se requiere viajeId o (frecuenciaId + fecha)');
        }

        console.log('📊 Asientos del backend:', asientos);
        setAsientosBackend(asientos);
      } catch (error) {
        console.error('Error cargando disponibilidad:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDisponibilidad();
  }, [viajeId, frecuenciaId, fecha, onViajeIdChange]);

  // Detectar si hay dos pisos
  const pisosDisponibles = [...new Set(asientosBackend.map(a => a.piso || 1))].sort();
  const tieneDosNiveles = pisosDisponibles.length > 1;

  // Filtrar asientos por piso activo
  const asientosPisoActual = asientosBackend.filter(a => (a.piso || 1) === pisoActivo);

  // Organizar asientos del piso actual por fila y columna
  const asientosOrdenados = [...asientosPisoActual].sort((a, b) => {
    if (a.fila !== b.fila) return (a.fila || 0) - (b.fila || 0);
    return (a.columna || 0) - (b.columna || 0);
  });

  // Detectar si hay fila trasera (5 asientos en la última fila con columnas 0-4)
  const maxFila = asientosOrdenados.length > 0 
    ? Math.max(...asientosOrdenados.map(a => a.fila || 0)) 
    : 0;
  
  const asientosUltimaFila = asientosOrdenados.filter(a => a.fila === maxFila);
  const tieneFilaTrasera = asientosUltimaFila.length === 5 && 
    asientosUltimaFila.every(a => (a.columna ?? -1) >= 0 && (a.columna ?? -1) <= 4);

  // Separar asientos normales de fila trasera
  const asientosGrid = tieneFilaTrasera 
    ? asientosOrdenados.filter(a => a.fila !== maxFila)
    : asientosOrdenados;
  
  const asientosTraseros = tieneFilaTrasera 
    ? asientosUltimaFila.sort((a, b) => (a.columna || 0) - (b.columna || 0))
    : [];

  const getEstadoAsiento = (numeroAsiento: string): EstadoAsiento => {
    if (asientosSeleccionados.includes(numeroAsiento)) return 'seleccionado';
    const asiento = asientosBackend.find(a => a.numeroAsiento === numeroAsiento);
    if (asiento) {
      // Asiento deshabilitado
      if (asiento.estado === 'DESHABILITADO') {
        return 'deshabilitado';
      }
      // Asientos ocupados, reservados, vendidos o bloqueados
      if (asiento.estado === 'OCUPADO' || asiento.estado === 'RESERVADO' || 
          asiento.estado === 'VENDIDO' || asiento.estado === 'BLOQUEADO') {
        return 'ocupado';
      }
    }
    return 'disponible';
  };

  const getTipoAsiento = (numeroAsiento: string): string => {
    const asiento = asientosBackend.find(a => a.numeroAsiento === numeroAsiento);
    return asiento?.tipoAsiento || 'NORMAL';
  };

  const handleAsientoClick = (asiento: string) => {
    const estado = getEstadoAsiento(asiento);
    
    // No permitir click en asientos ocupados o deshabilitados
    if (estado === 'ocupado' || estado === 'deshabilitado') return;

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

  // Estilos según estado y tipo de asiento
  const getAsientoStyle = (estado: EstadoAsiento, tipoAsiento: string) => {
    const baseStyle = 'w-12 h-12 rounded-lg font-semibold text-sm transition-all flex items-center justify-center';
    
    // Si está deshabilitado, mostrar en gris oscuro (no disponible)
    if (estado === 'deshabilitado') {
      return `${baseStyle} bg-gray-300 text-gray-500 border-2 border-gray-400 cursor-not-allowed opacity-50`;
    }
    
    // Si está ocupado, mostrar en rojo
    if (estado === 'ocupado') {
      return `${baseStyle} bg-red-100 text-red-600 border-2 border-red-300 cursor-not-allowed`;
    }
    
    // Si está seleccionado
    if (estado === 'seleccionado') {
      return `${baseStyle} bg-blue-600 text-white border-2 border-blue-700 shadow-lg scale-105 cursor-pointer`;
    }
    
    // Disponible - variar según tipo
    switch (tipoAsiento) {
      case 'VIP':
        return `${baseStyle} bg-amber-100 text-amber-800 border-2 border-amber-400 hover:bg-amber-200 hover:border-amber-500 cursor-pointer`;
      case 'ACONDICIONADO':
        return `${baseStyle} bg-purple-100 text-purple-800 border-2 border-purple-400 hover:bg-purple-200 hover:border-purple-500 cursor-pointer`;
      default: // NORMAL
        return `${baseStyle} bg-green-100 text-green-800 border-2 border-green-300 hover:bg-green-200 hover:border-green-400 cursor-pointer`;
    }
  };

  // Icono según tipo de asiento
  const getAsientoIcon = (tipoAsiento: string) => {
    switch (tipoAsiento) {
      case 'VIP':
        return <Crown className="w-4 h-4" />;
      case 'ACONDICIONADO':
        return <Accessibility className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Contar asientos seleccionados por piso
  const getAsientosSeleccionadosPorPiso = (piso: number) => {
    return asientosSeleccionados.filter(num => {
      const asiento = asientosBackend.find(a => a.numeroAsiento === num);
      return (asiento?.piso || 1) === piso;
    }).length;
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
      {/* Selector de pisos si el bus tiene dos niveles */}
      {tieneDosNiveles && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Bus className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-gray-800">Bus de dos pisos</span>
          </div>
          <div className="flex gap-2">
            {pisosDisponibles.map(piso => {
              const asientosPiso = asientosBackend.filter(a => (a.piso || 1) === piso);
              const disponiblesPiso = asientosPiso.filter(a => a.estado === 'DISPONIBLE').length;
              const seleccionadosPiso = getAsientosSeleccionadosPorPiso(piso);
              
              return (
                <button
                  key={piso}
                  onClick={() => setPisoActivo(piso)}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                    pisoActivo === piso
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold">Piso {piso}</div>
                    <div className="text-xs opacity-80">
                      {disponiblesPiso} disponibles
                      {seleccionadosPiso > 0 && (
                        <span className="ml-1 bg-white/20 px-1 rounded">
                          ({seleccionadosPiso} selec.)
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="font-bold text-gray-800 mb-3">
          Selecciona tus asientos {tieneDosNiveles && `- Piso ${pisoActivo}`}
        </h3>
        <div className="flex flex-wrap gap-3 text-sm">
          {/* Tipos de asientos */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-100 border-2 border-green-300 rounded flex items-center justify-center">
              <Armchair className="w-3 h-3 text-green-700" />
            </div>
            <span className="text-black">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-100 border-2 border-amber-400 rounded flex items-center justify-center">
              <Crown className="w-3 h-3 text-amber-700" />
            </div>
            <span className="text-black">VIP</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-100 border-2 border-purple-400 rounded flex items-center justify-center">
              <Accessibility className="w-3 h-3 text-purple-700" />
            </div>
            <span className="text-black">Accesible</span>
          </div>
          {/* Estados */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 border-2 border-blue-700 rounded flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
            <span className="text-black">Seleccionado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-100 border-2 border-red-300 rounded flex items-center justify-center">
              <X className="w-3 h-3 text-red-600" />
            </div>
            <span className="text-black">Ocupado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-300 border-2 border-gray-400 rounded opacity-50"></div>
            <span className="text-black">No disponible</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Asientos seleccionados: <span className="font-bold text-blue-600">{asientosSeleccionados.length}</span> / {maxSeleccion}
          {tieneDosNiveles && (
            <span className="ml-2 text-xs text-gray-500">
              (Piso 1: {getAsientosSeleccionadosPorPiso(1)}, Piso 2: {getAsientosSeleccionadosPorPiso(2)})
            </span>
          )}
        </p>
      </div>

      {/* Mapa de Asientos */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Indicador de frente del bus */}
        <div className="mb-6 text-center">
          <div className="inline-block bg-gray-800 text-white px-6 py-2 rounded-t-full">
            <span className="text-sm font-semibold">🚍 CONDUCTOR {tieneDosNiveles && `- PISO ${pisoActivo}`}</span>
          </div>
        </div>

        {/* Grid de asientos normales (4 columnas: 2 izq, pasillo, 2 der) */}
        <div className="space-y-3 mb-6">
          {asientosGrid.length > 0 && (() => {
            const filas = [...new Set(asientosGrid.map(a => a.fila))].sort((a, b) => (a || 0) - (b || 0));
            
            return filas.map(numFila => {
              const asientosFila = asientosGrid.filter(a => a.fila === numFila);
              const izquierda = asientosFila.filter(a => a.columna === 0 || a.columna === 1).sort((a, b) => (a.columna || 0) - (b.columna || 0));
              const derecha = asientosFila.filter(a => a.columna === 2 || a.columna === 3).sort((a, b) => (a.columna || 0) - (b.columna || 0));

              return (
                <div key={numFila} className="flex justify-center items-center gap-3">
                  {/* Número de fila */}
                  <span className="w-8 text-center text-gray-500 font-medium text-sm">
                    {numFila}
                  </span>

                  {/* Asientos izquierda */}
                  <div className="flex gap-2">
                    {izquierda.map(asiento => {
                      const estado = getEstadoAsiento(asiento.numeroAsiento);
                      const tipo = getTipoAsiento(asiento.numeroAsiento);
                      return (
                        <button
                          key={asiento.numeroAsiento}
                          onClick={() => handleAsientoClick(asiento.numeroAsiento)}
                          disabled={estado === 'ocupado' || estado === 'deshabilitado'}
                          className={getAsientoStyle(estado, tipo)}
                          title={`Asiento ${asiento.numeroAsiento} - ${tipo} - ${estado}`}
                        >
                          {estado === 'seleccionado' && <Check className="w-5 h-5" />}
                          {estado === 'ocupado' && <X className="w-5 h-5" />}
                          {estado === 'deshabilitado' && <Minus className="w-5 h-5" />}
                          {estado === 'disponible' && (
                            <div className="flex flex-col items-center">
                              {getAsientoIcon(tipo)}
                              <span className="text-xs">{asiento.numeroAsiento}</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Pasillo */}
                  <div className="w-12"></div>

                  {/* Asientos derecha */}
                  <div className="flex gap-2">
                    {derecha.map(asiento => {
                      const estado = getEstadoAsiento(asiento.numeroAsiento);
                      const tipo = getTipoAsiento(asiento.numeroAsiento);
                      return (
                        <button
                          key={asiento.numeroAsiento}
                          onClick={() => handleAsientoClick(asiento.numeroAsiento)}
                          disabled={estado === 'ocupado' || estado === 'deshabilitado'}
                          className={getAsientoStyle(estado, tipo)}
                          title={`Asiento ${asiento.numeroAsiento} - ${tipo} - ${estado}`}
                        >
                          {estado === 'seleccionado' && <Check className="w-5 h-5" />}
                          {estado === 'ocupado' && <X className="w-5 h-5" />}
                          {estado === 'deshabilitado' && <Minus className="w-5 h-5" />}
                          {estado === 'disponible' && (
                            <div className="flex flex-col items-center">
                              {getAsientoIcon(tipo)}
                              <span className="text-xs">{asiento.numeroAsiento}</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* Fila trasera (5 asientos: 2-1-2) */}
        {tieneFilaTrasera && asientosTraseros.length === 5 && (
          <div className="border-t-2 border-gray-200 pt-4">
            <p className="text-center text-xs text-gray-500 font-semibold mb-3">FILA TRASERA</p>
            <div className="flex justify-center items-center gap-3">
              {/* 2 asientos izquierda (col 0-1) */}
              <div className="flex gap-2">
                {asientosTraseros.slice(0, 2).map(asiento => {
                  const estado = getEstadoAsiento(asiento.numeroAsiento);
                  const tipo = getTipoAsiento(asiento.numeroAsiento);
                  return (
                    <button
                      key={asiento.numeroAsiento}
                      onClick={() => handleAsientoClick(asiento.numeroAsiento)}
                      disabled={estado === 'ocupado' || estado === 'deshabilitado'}
                      className={getAsientoStyle(estado, tipo)}
                      title={`Asiento ${asiento.numeroAsiento} - ${tipo} - ${estado}`}
                    >
                      {estado === 'seleccionado' && <Check className="w-5 h-5" />}
                      {estado === 'ocupado' && <X className="w-5 h-5" />}
                      {estado === 'deshabilitado' && <Minus className="w-5 h-5" />}
                      {estado === 'disponible' && (
                        <div className="flex flex-col items-center">
                          {getAsientoIcon(tipo)}
                          <span className="text-xs">{asiento.numeroAsiento}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 1 asiento centro (col 2) */}
              <div className="flex gap-2">
                {(() => {
                  const asiento = asientosTraseros[2];
                  const estado = getEstadoAsiento(asiento.numeroAsiento);
                  const tipo = getTipoAsiento(asiento.numeroAsiento);
                  return (
                    <button
                      key={asiento.numeroAsiento}
                      onClick={() => handleAsientoClick(asiento.numeroAsiento)}
                      disabled={estado === 'ocupado' || estado === 'deshabilitado'}
                      className={getAsientoStyle(estado, tipo)}
                      title={`Asiento ${asiento.numeroAsiento} - ${tipo} - ${estado}`}
                    >
                      {estado === 'seleccionado' && <Check className="w-5 h-5" />}
                      {estado === 'ocupado' && <X className="w-5 h-5" />}
                      {estado === 'deshabilitado' && <Minus className="w-5 h-5" />}
                      {estado === 'disponible' && (
                        <div className="flex flex-col items-center">
                          {getAsientoIcon(tipo)}
                          <span className="text-xs">{asiento.numeroAsiento}</span>
                        </div>
                      )}
                    </button>
                  );
                })()}
              </div>

              {/* 2 asientos derecha (col 3-4) */}
              <div className="flex gap-2">
                {asientosTraseros.slice(3, 5).map(asiento => {
                  const estado = getEstadoAsiento(asiento.numeroAsiento);
                  const tipo = getTipoAsiento(asiento.numeroAsiento);
                  return (
                    <button
                      key={asiento.numeroAsiento}
                      onClick={() => handleAsientoClick(asiento.numeroAsiento)}
                      disabled={estado === 'ocupado' || estado === 'deshabilitado'}
                      className={getAsientoStyle(estado, tipo)}
                      title={`Asiento ${asiento.numeroAsiento} - ${tipo} - ${estado}`}
                    >
                      {estado === 'seleccionado' && <Check className="w-5 h-5" />}
                      {estado === 'ocupado' && <X className="w-5 h-5" />}
                      {estado === 'deshabilitado' && <Minus className="w-5 h-5" />}
                      {estado === 'disponible' && (
                        <div className="flex flex-col items-center">
                          {getAsientoIcon(tipo)}
                          <span className="text-xs">{asiento.numeroAsiento}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

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
            {asientosSeleccionados.map(asiento => {
              const tipo = getTipoAsiento(asiento);
              const asientoInfo = asientosBackend.find(a => a.numeroAsiento === asiento);
              const piso = asientoInfo?.piso || 1;
              
              return (
                <span
                  key={asiento}
                  className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                    tipo === 'VIP' 
                      ? 'bg-amber-500 text-white' 
                      : tipo === 'ACONDICIONADO'
                        ? 'bg-purple-500 text-white'
                        : 'bg-blue-600 text-white'
                  }`}
                >
                  {tipo === 'VIP' && <Crown className="w-3 h-3" />}
                  {tipo === 'ACONDICIONADO' && <Accessibility className="w-3 h-3" />}
                  #{asiento}
                  {tieneDosNiveles && <span className="text-xs opacity-75">(P{piso})</span>}
                  <button
                    onClick={() => handleAsientoClick(asiento)}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
