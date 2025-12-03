'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { 
  asientoLayoutApi, 
  busApi,
  BusLayoutResponse, 
  AsientoResponse, 
  BusDetailResponse,
  GenerateLayoutRequest,
  getToken 
} from '@/lib/api';
import { ArrowLeft, Grid3x3, RefreshCw, Trash2, Info, User, Crown, Accessibility, X } from 'lucide-react';

export default function AsientosConfigPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const busId = parseInt(params.busId as string);

  const [bus, setBus] = useState<BusDetailResponse | null>(null);
  const [layout, setLayout] = useState<BusLayoutResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsientos, setSelectedAsientos] = useState<Set<number>>(new Set());
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [filas, setFilas] = useState(10);
  const [columnas, setColumnas] = useState(4);
  const [incluirFilaTrasera, setIncluirFilaTrasera] = useState(false);
  const [pisoActivo, setPisoActivo] = useState<1 | 2>(1); // Estado para controlar qué piso se muestra

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busId]);

  const loadData = async () => {
    if (!user?.cooperativaId) return;

    try {
      setLoading(true);
      const token = getToken();
      if (!token) throw new Error('No hay token');

      // Cargar información del bus
      const busData = await busApi.getById(user.cooperativaId, busId, token);
      setBus(busData);

      // Cargar layout de asientos
      const layoutData = await asientoLayoutApi.getLayout(busId, token);
      setLayout(layoutData);
      setError(null);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLayout = async () => {
    if (!user?.cooperativaId) return;

    try {
      const token = getToken();
      if (!token) throw new Error('No hay token');

      // Verificar si ya existe layout para el piso actual
      const asientosPisoActual = layout?.asientos.filter(a => a.piso === pisoActivo) || [];
      
      const request: GenerateLayoutRequest = {
        filas,
        columnas,
        sobrescribir: asientosPisoActual.length > 0,
        incluirFilaTrasera,
        piso: pisoActivo, // Enviar el piso activo
      };

      console.log('Generando layout con:', request);
      const response = await asientoLayoutApi.generateLayout(busId, request, token);
      
      const capacidadPiso = bus?.tieneDosNiveles 
        ? (pisoActivo === 1 ? bus.capacidadPiso1 : bus.capacidadPiso2) 
        : bus?.capacidadAsientos;
      const capacidadPisoNum = capacidadPiso ?? 0;
      const asientosExcedentes = response.asientosCreados - capacidadPisoNum;
      
      // Mostrar advertencia si hay asientos excedentes
      if (asientosExcedentes > 0) {
        alert(
          `⚠️ ACCIÓN REQUERIDA - Layout generado para Piso ${pisoActivo}\n\n` +
          `📊 Resumen:\n` +
          `• Asientos generados: ${response.asientosCreados}\n` +
          `• Capacidad del piso: ${capacidadPiso}\n` +
          `• Asientos excedentes: ${asientosExcedentes}\n\n` +
          `❗ IMPORTANTE:\n` +
          `El grid genera ${asientosExcedentes} asiento${asientosExcedentes > 1 ? 's' : ''} más de los necesarios.\n\n` +
          `🔧 DEBES HACER:\n` +
          `1. Selecciona ${asientosExcedentes} asiento${asientosExcedentes > 1 ? 's' : ''} haciendo clic en ellos\n` +
          `2. Usa el botón "Deshabilitar Seleccionados" para deshabilitarlos\n\n` +
          `Los asientos deshabilitados NO se pueden usar en reservas.\n` +
          `Puedes elegir cuáles deshabilitar según tu preferencia.`
        );
      } else {
        alert(`✅ Layout generado exitosamente para Piso ${pisoActivo}\n\n${response.asientosCreados} asientos creados`);
      }
      
      setShowGenerateModal(false);
      loadData();
    } catch (error) {
      console.error('Error al generar layout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`❌ Error al generar layout\n\n${errorMessage}`);
    }
  };

  const handleAsientoClick = (asiento: AsientoResponse) => {
    const newSelected = new Set(selectedAsientos);
    if (newSelected.has(asiento.id)) {
      newSelected.delete(asiento.id);
    } else {
      newSelected.add(asiento.id);
    }
    setSelectedAsientos(newSelected);
  };

  const handleCambiarTipo = async (tipo: 'NORMAL' | 'VIP' | 'ACONDICIONADO') => {
    if (selectedAsientos.size === 0) {
      alert('⚠️ Selecciona al menos un asiento');
      return;
    }

    try {
      const token = getToken();
      if (!token) throw new Error('No hay token');

      const asientosToUpdate = Array.from(selectedAsientos).map(id => ({
        id,
        tipoAsiento: tipo,
      }));

      await asientoLayoutApi.bulkUpdate(busId, { asientos: asientosToUpdate }, token);
      alert(`✅ ${selectedAsientos.size} asientos cambiados a ${tipo}`);
      setSelectedAsientos(new Set());
      loadData();
    } catch (err) {
      console.error('Error al cambiar tipo:', err);
      alert('❌ Error: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const handleToggleHabilitar = async () => {
    if (selectedAsientos.size === 0) {
      alert('⚠️ Selecciona al menos un asiento');
      return;
    }

    try {
      const token = getToken();
      if (!token) throw new Error('No hay token');

      // Determinar si habilitar o deshabilitar
      const primerAsiento = layout?.asientos.find(a => selectedAsientos.has(a.id));
      const nuevoEstado = !primerAsiento?.habilitado;

      const asientosToUpdate = Array.from(selectedAsientos).map(id => ({
        id,
        habilitado: nuevoEstado,
      }));

      await asientoLayoutApi.bulkUpdate(busId, { asientos: asientosToUpdate }, token);
      alert(`✅ ${selectedAsientos.size} asientos ${nuevoEstado ? 'habilitados' : 'deshabilitados'}`);
      setSelectedAsientos(new Set());
      loadData();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      alert('❌ Error: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const handleEliminarLayout = async () => {
    if (!confirm('¿Estás seguro de eliminar todo el layout de asientos? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const token = getToken();
      if (!token) throw new Error('No hay token');

      await asientoLayoutApi.deleteLayout(busId, token);
      alert('✅ Layout eliminado exitosamente');
      loadData();
    } catch (err) {
      console.error('Error al eliminar layout:', err);
      alert('❌ Error: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const getAsientoColor = (asiento: AsientoResponse, selected: boolean) => {
    if (selected) return 'bg-blue-500 border-blue-700 text-white';
    if (!asiento.habilitado) return 'bg-gray-300 border-gray-400 text-gray-600 line-through';
    
    switch (asiento.tipoAsiento) {
      case 'VIP':
        return 'bg-yellow-400 border-yellow-600 text-gray-800';
      case 'ACONDICIONADO':
        return 'bg-purple-400 border-purple-600 text-white';
      default:
        return 'bg-green-400 border-green-600 text-gray-800';
    }
  };

  const renderGrid = () => {
    if (!layout || layout.asientos.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Grid3x3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-4">No hay layout configurado</p>
          <p className="text-gray-500 text-sm mb-6">Genera un layout automático para comenzar</p>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Grid3x3 className="w-5 h-5 inline mr-2" />
            Generar Layout
          </button>
        </div>
      );
    }

    // Filtrar asientos por piso si el bus tiene dos niveles
    let asientosParaMostrar = layout.asientos;
    if (bus?.tieneDosNiveles) {
      // Filtrar por el campo 'piso' del asiento
      asientosParaMostrar = layout.asientos.filter(a => a.piso === pisoActivo);
    }

    // Detectar si hay fila trasera: 5 asientos consecutivos en la última fila (columnas 0-4)
    const maxFila = asientosParaMostrar.length > 0 ? Math.max(...asientosParaMostrar.map(a => a.fila)) : 0;
    const asientosUltimaFila = asientosParaMostrar.filter(a => a.fila === maxFila);
    const tieneFilaTrasera = asientosUltimaFila.length === 5 && 
      asientosUltimaFila.every(a => a.columna >= 0 && a.columna <= 4);
    
    const asientosFilaTrasera = tieneFilaTrasera ? asientosUltimaFila : [];
    
    // Calcular filas del grid principal
    // Si hay fila trasera: solo renderizar filas que NO sean la última
    // Si no hay fila trasera: renderizar todas las filas
    const filasParaGrid = tieneFilaTrasera 
      ? asientosParaMostrar.filter(a => a.fila !== maxFila)
      : asientosParaMostrar;
    const maxFilaNormal = filasParaGrid.length > 0 
      ? Math.max(...filasParaGrid.map(a => a.fila)) 
      : 0;
    const maxColumnaNormal = filasParaGrid.length > 0 
      ? Math.max(...filasParaGrid.map(a => a.columna)) 
      : 0;
    
    // Crear matriz para el grid principal (solo filas normales)
    const filasGrid = maxFilaNormal + 1;
    const columnasGrid = maxColumnaNormal + 1;
    const grid: (AsientoResponse | null)[][] = Array(filasGrid)
      .fill(null)
      .map(() => Array(columnasGrid).fill(null));

    // Llenar el grid solo con asientos del grid principal (excluye fila trasera si existe)
    filasParaGrid.forEach(asiento => {
      grid[asiento.fila][asiento.columna] = asiento;
    });

    return (
      <div className="flex flex-col items-center">
        {/* Cabina del conductor */}
        <div className="w-full max-w-3xl mb-6">
          <div className="bg-gray-800 text-white rounded-t-3xl p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                🚗
              </div>
              <span className="font-semibold">Cabina del Conductor</span>
            </div>
          </div>
        </div>

        {/* Grid de asientos con pasillo */}
        <div className="w-full max-w-3xl bg-white rounded-lg p-6 shadow-inner">
          <div className="space-y-3">
            {grid.map((fila, filaIdx) => (
              <div key={`fila-${filaIdx}`} className="flex items-center gap-3 justify-center">
                {/* Número de fila */}
                <div className="w-8 text-center text-sm font-semibold text-gray-500">
                  {filaIdx + 1}
                </div>

                {/* Asientos lado izquierdo */}
                <div className="flex gap-2">
                  {fila.slice(0, Math.floor(layout.maxColumnas / 2)).map((asiento, colIdx) => {
                    if (!asiento) {
                      return (
                        <div
                          key={`empty-${filaIdx}-${colIdx}`}
                          className="w-16 h-16 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50"
                        />
                      );
                    }

                    const isSelected = selectedAsientos.has(asiento.id);
                    const colorClass = getAsientoColor(asiento, isSelected);

                    return (
                      <button
                        key={asiento.id}
                        onClick={() => handleAsientoClick(asiento)}
                        className={`w-16 h-16 border-2 rounded-lg font-bold text-xs transition-all hover:scale-110 hover:shadow-lg flex flex-col items-center justify-center ${colorClass}`}
                        title={`Asiento ${asiento.numeroAsiento} - ${asiento.tipoAsiento} - ${asiento.habilitado ? 'Habilitado' : 'Deshabilitado'}`}
                      >
                        <span className="text-base">{asiento.numeroAsiento}</span>
                        <span className="text-[10px] mt-0.5">{asiento.tipoAsiento[0]}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Pasillo central */}
                <div className="w-12 border-l-2 border-r-2 border-dashed border-gray-300 h-16 flex items-center justify-center">
                  <span className="text-gray-400 text-xs rotate-90 whitespace-nowrap">PASILLO</span>
                </div>

                {/* Asientos lado derecho */}
                <div className="flex gap-2">
                  {fila.slice(Math.floor(layout.maxColumnas / 2)).map((asiento, colIdx) => {
                    if (!asiento) {
                      return (
                        <div
                          key={`empty-${filaIdx}-${colIdx + Math.floor(layout.maxColumnas / 2)}`}
                          className="w-16 h-16 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50"
                        />
                      );
                    }

                    const isSelected = selectedAsientos.has(asiento.id);
                    const colorClass = getAsientoColor(asiento, isSelected);

                    return (
                      <button
                        key={asiento.id}
                        onClick={() => handleAsientoClick(asiento)}
                        className={`w-16 h-16 border-2 rounded-lg font-bold text-xs transition-all hover:scale-110 hover:shadow-lg flex flex-col items-center justify-center ${colorClass}`}
                        title={`Asiento ${asiento.numeroAsiento} - ${asiento.tipoAsiento} - ${asiento.habilitado ? 'Habilitado' : 'Deshabilitado'}`}
                      >
                        <span className="text-base">{asiento.numeroAsiento}</span>
                        <span className="text-[10px] mt-0.5">{asiento.tipoAsiento[0]}</span>
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

        {/* Fila trasera continua (5 asientos) */}
        {tieneFilaTrasera && (
          <div className="w-full max-w-3xl mt-4">
            <div className="bg-white rounded-lg p-4 shadow-inner">
              <div className="text-center mb-2">
                <span className="text-xs font-semibold text-gray-600 uppercase">Fila Trasera Continua</span>
              </div>
              <div className="flex items-center gap-3 justify-center">
                {/* 2 asientos izquierda (col 0-1) */}
                <div className="flex gap-2">
                  {[0, 1].map(colIdx => {
                    const asiento = asientosFilaTrasera.find(a => a.columna === colIdx);
                    if (!asiento) return null;

                    const isSelected = selectedAsientos.has(asiento.id);
                    const colorClass = getAsientoColor(asiento, isSelected);

                    return (
                      <button
                        key={asiento.id}
                        onClick={() => handleAsientoClick(asiento)}
                        className={`w-16 h-16 border-2 rounded-lg font-bold text-xs transition-all hover:scale-110 hover:shadow-lg flex flex-col items-center justify-center ${colorClass}`}
                        title={`Asiento ${asiento.numeroAsiento} - ${asiento.tipoAsiento} - ${asiento.habilitado ? 'Habilitado' : 'Deshabilitado'}`}
                      >
                        <span className="text-base">{asiento.numeroAsiento}</span>
                        <span className="text-[10px] mt-0.5">{asiento.tipoAsiento[0]}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Asiento central (col 2) - ocupa el espacio del pasillo */}
                <div className="flex gap-2">
                  {(() => {
                    const asiento = asientosFilaTrasera.find(a => a.columna === 2);
                    if (!asiento) return null;

                    const isSelected = selectedAsientos.has(asiento.id);
                    const colorClass = getAsientoColor(asiento, isSelected);

                    return (
                      <button
                        key={asiento.id}
                        onClick={() => handleAsientoClick(asiento)}
                        className={`w-16 h-16 border-2 rounded-lg font-bold text-xs transition-all hover:scale-110 hover:shadow-lg flex flex-col items-center justify-center ${colorClass}`}
                        title={`Asiento ${asiento.numeroAsiento} - ${asiento.tipoAsiento} - ${asiento.habilitado ? 'Habilitado' : 'Deshabilitado'}`}
                      >
                        <span className="text-base">{asiento.numeroAsiento}</span>
                        <span className="text-[10px] mt-0.5">{asiento.tipoAsiento[0]}</span>
                      </button>
                    );
                  })()}
                </div>

                {/* 2 asientos derecha (col 3-4) */}
                <div className="flex gap-2">
                  {[3, 4].map(colIdx => {
                    const asiento = asientosFilaTrasera.find(a => a.columna === colIdx);
                    if (!asiento) return null;

                    const isSelected = selectedAsientos.has(asiento.id);
                    const colorClass = getAsientoColor(asiento, isSelected);

                    return (
                      <button
                        key={asiento.id}
                        onClick={() => handleAsientoClick(asiento)}
                        className={`w-16 h-16 border-2 rounded-lg font-bold text-xs transition-all hover:scale-110 hover:shadow-lg flex flex-col items-center justify-center ${colorClass}`}
                        title={`Asiento ${asiento.numeroAsiento} - ${asiento.tipoAsiento} - ${asiento.habilitado ? 'Habilitado' : 'Deshabilitado'}`}
                      >
                        <span className="text-base">{asiento.numeroAsiento}</span>
                        <span className="text-[10px] mt-0.5">{asiento.tipoAsiento[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Parte trasera del bus */}
        <div className="w-full max-w-3xl mt-6">
          <div className="bg-gray-200 rounded-b-3xl p-3 text-center">
            <span className="text-gray-600 text-sm font-semibold">Parte Trasera</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['ADMIN']}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando configuración de asientos...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !bus) {
    return (
      <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['ADMIN']}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-600 mt-1">{error || 'Bus no encontrado'}</p>
              <button
                onClick={() => router.back()}
                className="mt-4 text-red-600 hover:text-red-800 font-semibold"
              >
                ← Volver
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Volver
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">🪑 Configuración de Asientos</h1>
                  <p className="text-gray-600 mt-1">
                    Bus: <span className="font-semibold">{bus?.placa}</span> - Capacidad: {bus?.capacidadAsientos} asientos
                    {bus?.tieneDosNiveles && (
                      <span className="ml-2 text-blue-600 font-semibold">
                        🚌 (Piso 1: {bus.capacidadPiso1} | Piso 2: {bus.capacidadPiso2})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Selector de Piso (solo visible si el bus tiene dos niveles) */}
            {bus?.tieneDosNiveles && (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Seleccionar Piso:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPisoActivo(1)}
                      className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                        pisoActivo === 1
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🏢 Piso 1 ({bus.capacidadPiso1} asientos)
                    </button>
                    <button
                      onClick={() => setPisoActivo(2)}
                      className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                        pisoActivo === 2
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🏙️ Piso 2 ({bus.capacidadPiso2} asientos)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Información y estadísticas */}
          {layout && layout.asientos.length > 0 && (() => {
            // Filtrar asientos por piso si tiene dos niveles
            let asientosPiso = layout.asientos;
            if (bus?.tieneDosNiveles) {
              asientosPiso = layout.asientos.filter(a => a.piso === pisoActivo);
            }

            const habilitadosPiso = asientosPiso.filter(a => a.habilitado).length;
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                  <p className="text-gray-600 text-sm">
                    {bus?.tieneDosNiveles ? `Asientos Piso ${pisoActivo}` : 'Total Asientos'}
                  </p>
                  <p className="text-2xl font-bold text-gray-800">{asientosPiso.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <p className="text-gray-600 text-sm">Habilitados</p>
                  <p className="text-2xl font-bold text-green-600">{habilitadosPiso}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <p className="text-gray-600 text-sm">Dimensiones</p>
                  <p className="text-2xl font-bold text-blue-600">{layout.maxFilas} x {layout.maxColumnas}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <p className="text-gray-600 text-sm">Seleccionados</p>
                  <p className="text-2xl font-bold text-purple-600">{selectedAsientos.size}</p>
                </div>
              </div>
            );
          })()}

          {/* Layout con Grid de asientos y controles laterales */}
          <div className="flex gap-6 items-start">
            {/* Panel de controles lateral */}
            <div className="flex-shrink-0 w-64">
              <div className="bg-white rounded-lg shadow p-4 sticky top-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Grid3x3 className="w-5 h-5" />
                  Controles
                </h3>
                
                <div className="space-y-3">
                  {/* Botón Generar/Regenerar Layout */}
                  <button
                    onClick={() => setShowGenerateModal(true)}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
                  >
                    <Grid3x3 className="w-5 h-5" />
                    {layout && layout.asientos.length > 0 ? 'Regenerar Layout' : 'Generar Layout'}
                  </button>

                  {layout && layout.asientos.length > 0 && (
                    <>
                      {/* Separador */}
                      <div className="border-t border-gray-200 my-3"></div>
                      
                      <p className="text-xs text-gray-600 font-semibold uppercase mb-2">Tipo de Asiento</p>
                      
                      {/* Botón Normal */}
                      <button
                        onClick={() => handleCambiarTipo('NORMAL')}
                        disabled={selectedAsientos.size === 0}
                        className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                        title="Cambiar asientos seleccionados a Normal"
                      >
                        <User className="w-5 h-5" />
                        Normal
                      </button>
                      
                      {/* Botón VIP */}
                      <button
                        onClick={() => handleCambiarTipo('VIP')}
                        disabled={selectedAsientos.size === 0}
                        className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                        title="Cambiar asientos seleccionados a VIP"
                      >
                        <Crown className="w-5 h-5" />
                        VIP
                      </button>
                      
                      {/* Botón Acondicionado */}
                      <button
                        onClick={() => handleCambiarTipo('ACONDICIONADO')}
                        disabled={selectedAsientos.size === 0}
                        className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                        title="Cambiar asientos seleccionados a Acondicionado"
                      >
                        <Accessibility className="w-5 h-5" />
                        Acondicionado
                      </button>

                      {/* Separador */}
                      <div className="border-t border-gray-200 my-3"></div>
                      
                      <p className="text-xs text-gray-600 font-semibold uppercase mb-2">Acciones</p>
                      
                      {/* Botón Habilitar/Deshabilitar */}
                      <button
                        onClick={handleToggleHabilitar}
                        disabled={selectedAsientos.size === 0}
                        className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                        title="Habilitar o deshabilitar asientos seleccionados"
                      >
                        <RefreshCw className="w-5 h-5" />
                        Habilitar/Deshabilitar
                      </button>
                      
                      {/* Botón Limpiar Selección */}
                      <button
                        onClick={() => setSelectedAsientos(new Set())}
                        disabled={selectedAsientos.size === 0}
                        className="w-full flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                        title="Deseleccionar todos los asientos"
                      >
                        <X className="w-5 h-5" />
                        Limpiar Selección
                      </button>

                      {/* Separador */}
                      <div className="border-t border-gray-200 my-3"></div>
                      
                      {/* Botón Eliminar Layout */}
                      <button
                        onClick={handleEliminarLayout}
                        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
                        title="Eliminar todo el layout de asientos"
                      >
                        <Trash2 className="w-5 h-5" />
                        Eliminar Layout
                      </button>
                    </>
                  )}
                </div>

                {/* Leyenda */}
                {layout && layout.asientos.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-4 h-4 text-blue-600" />
                      <p className="font-semibold text-gray-800 text-sm">Leyenda</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-green-400 border-2 border-green-600 rounded"></div>
                        <span className="text-gray-700">Normal</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-yellow-400 border-2 border-yellow-600 rounded"></div>
                        <span className="text-gray-700">VIP</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-purple-400 border-2 border-purple-600 rounded"></div>
                        <span className="text-gray-700">Acondicionado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-gray-300 border-2 border-gray-400 rounded"></div>
                        <span className="text-gray-700">Deshabilitado</span>
                      </div>
                    </div>
                    <p className="text-blue-700 mt-3 text-xs">
                      💡 Haz clic en los asientos para seleccionarlos
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Grid de asientos */}
            <div className="flex-1 bg-white rounded-lg shadow p-6">
              {renderGrid()}
            </div>
          </div>

          {/* Modal para generar layout */}
          {showGenerateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {(() => {
                    const asientosPisoActual = layout?.asientos.filter(a => a.piso === pisoActivo) || [];
                    return asientosPisoActual.length > 0 ? 'Regenerar Layout' : 'Generar Layout Automático';
                  })()}
                  {bus?.tieneDosNiveles && (
                    <span className="text-blue-600 font-semibold ml-2">- Piso {pisoActivo}</span>
                  )}
                </h2>
                
                {(() => {
                  const asientosPisoActual = layout?.asientos.filter(a => a.piso === pisoActivo) || [];
                  return asientosPisoActual.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                      <p className="text-yellow-800 text-sm">
                        ⚠️ Advertencia: Esto eliminará el layout actual del Piso {pisoActivo} y creará uno nuevo
                        {bus?.tieneDosNiveles && (
                          <span className="block mt-1 text-xs">
                            (El layout de los otros pisos NO se verá afectado)
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })()}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Número de Filas
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={filas}
                      onChange={(e) => setFilas(parseInt(e.target.value) || 1)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Número de Columnas
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={columnas}
                      onChange={(e) => setColumnas(parseInt(e.target.value) || 1)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={incluirFilaTrasera}
                        onChange={(e) => setIncluirFilaTrasera(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">Incluir Fila Trasera</p>
                        <p className="text-xs text-gray-600">La última fila tendrá 5 asientos continuos (incluyendo el pasillo)</p>
                      </div>
                    </label>
                  </div>

                  <div className="bg-gray-50 rounded p-3">
                    {(() => {
                      const capacidadPiso = bus?.tieneDosNiveles 
                        ? (pisoActivo === 1 ? bus.capacidadPiso1 : bus.capacidadPiso2) 
                        : bus?.capacidadAsientos;
                      const capacidadPisoNum = capacidadPiso ?? 0;
                      const totalAsientos = incluirFilaTrasera ? (filas - 1) * columnas + 5 : filas * columnas;
                      
                      return (
                        <>
                          {incluirFilaTrasera ? (
                            <>
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold">Filas normales:</span> {filas - 1} × {columnas} = {(filas - 1) * columnas} asientos
                              </p>
                              <p className="text-sm text-gray-700 mt-1">
                                <span className="font-semibold">Fila trasera:</span> 5 asientos continuos
                              </p>
                              <p className="text-sm text-gray-700 mt-1">
                                <span className="font-semibold">Layout máximo:</span> {totalAsientos} asientos
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold">Grid:</span> {filas} × {columnas}
                              </p>
                              <p className="text-sm text-gray-700 mt-1">
                                <span className="font-semibold">Layout máximo:</span> {totalAsientos} asientos
                              </p>
                            </>
                          )}
                          <p className="text-sm text-gray-700 mt-1">
                            <span className="font-semibold">Capacidad del {bus?.tieneDosNiveles ? `Piso ${pisoActivo}` : 'bus'}:</span>{' '}
                            {capacidadPisoNum} asientos
                          </p>
                          <p className="text-sm text-blue-600 mt-2">
                            {totalAsientos >= capacidadPisoNum 
                              ? `✓ Se crearán exactamente ${capacidadPisoNum} asientos`
                              : `⚠ Faltan ${capacidadPisoNum - totalAsientos} posiciones en el grid`
                            }
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowGenerateModal(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleGenerateLayout}
                    disabled={(() => {
                      const capacidadPiso = bus?.tieneDosNiveles 
                        ? (pisoActivo === 1 ? bus.capacidadPiso1 : bus.capacidadPiso2) 
                        : bus?.capacidadAsientos;
                      const capacidadPisoNum = capacidadPiso ?? 0;
                      const totalAsientos = incluirFilaTrasera ? (filas - 1) * columnas + 5 : filas * columnas;
                      return totalAsientos < capacidadPisoNum;
                    })()}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
