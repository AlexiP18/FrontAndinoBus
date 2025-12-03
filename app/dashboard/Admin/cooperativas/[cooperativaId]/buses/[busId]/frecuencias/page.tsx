'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { 
  frecuenciasAdminApi, 
  rutasAdminApi, 
  getToken,
  type FrecuenciaViaje,
  type CreateFrecuenciaRequest,
  type ParadaFrecuencia,
  type RutaResponse
} from '@/lib/api';

const DIAS_SEMANA = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

export default function FrecuenciasBusPage() {
  const router = useRouter();
  const params = useParams();
  const busId = params?.busId as string;
  const cooperativaId = params?.cooperativaId as string;

  const [frecuencias, setFrecuencias] = useState<FrecuenciaViaje[]>([]);
  const [rutas, setRutas] = useState<RutaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFrecuencia, setEditingFrecuencia] = useState<FrecuenciaViaje | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Log de parámetros para debugging
  useEffect(() => {
    console.log('=== FrecuenciasBusPage Mounted ===');
    console.log('busId:', busId);
    console.log('cooperativaId:', cooperativaId);
  }, []);

  const [formData, setFormData] = useState<CreateFrecuenciaRequest>({
    busId: Number(busId),
    rutaId: 0,
    horaSalida: '06:00',
    horaLlegadaEstimada: '14:00',
    diasOperacion: DIAS_SEMANA.join(','),
    precioBase: 0,
    asientosDisponibles: 40,
    observaciones: '',
    paradas: [],
  });

  const [nuevaParada, setNuevaParada] = useState<ParadaFrecuencia>({
    orden: 1,
    nombreParada: '',
    direccion: '',
    tiempoLlegada: '06:00',
    tiempoEsperaMinutos: 5,
    precioDesdeOrigen: 0,
    observaciones: '',
    permiteAbordaje: true,
    permiteDescenso: true,
  });

  useEffect(() => {
    loadData();
  }, [busId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getToken();
      if (!token) {
        console.error('No se encontró token');
        router.push('/login');
        return;
      }

      console.log('Cargando frecuencias para bus:', busId);
      
      // Cargar frecuencias del bus
      const frecuenciasData = await frecuenciasAdminApi.getByBus(Number(busId), token);
      console.log('Frecuencias cargadas:', frecuenciasData);
      setFrecuencias(frecuenciasData);

      // Cargar rutas disponibles
      console.log('Cargando rutas activas...');
      const rutasData = await rutasAdminApi.getAll('activas', undefined, token);
      console.log('Rutas cargadas:', rutasData);
      setRutas(rutasData);
      
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
      setLoading(false);
    }
  };

  const handleOpenModal = (frecuencia?: FrecuenciaViaje) => {
    if (frecuencia) {
      setEditingFrecuencia(frecuencia);
      setFormData({
        busId: Number(busId),
        rutaId: frecuencia.rutaId,
        horaSalida: frecuencia.horaSalida,
        horaLlegadaEstimada: frecuencia.horaLlegadaEstimada || '',
        diasOperacion: frecuencia.diasOperacion,
        precioBase: frecuencia.precioBase || 0,
        asientosDisponibles: frecuencia.asientosDisponibles || 40,
        observaciones: frecuencia.observaciones || '',
        paradas: frecuencia.paradas || [],
      });
    } else {
      setEditingFrecuencia(null);
      setFormData({
        busId: Number(busId),
        rutaId: rutas[0]?.id || 0,
        horaSalida: '06:00',
        horaLlegadaEstimada: '14:00',
        diasOperacion: DIAS_SEMANA.join(','),
        precioBase: 0,
        asientosDisponibles: 40,
        observaciones: '',
        paradas: [],
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getToken();
      if (!token) return;

      if (editingFrecuencia) {
        await frecuenciasAdminApi.update(editingFrecuencia.id, formData, token);
      } else {
        await frecuenciasAdminApi.create(formData, token);
      }

      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Error al guardar frecuencia:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta frecuencia?')) return;

    try {
      const token = getToken();
      if (!token) return;

      await frecuenciasAdminApi.delete(id, token);
      loadData();
    } catch (err) {
      console.error('Error al eliminar frecuencia:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const handleAddParada = () => {
    const paradas = formData.paradas || [];
    const maxOrden = paradas.length > 0 ? Math.max(...paradas.map(p => p.orden)) : 0;
    
    const paradaToAdd = { ...nuevaParada, orden: maxOrden + 1 };
    setFormData({ ...formData, paradas: [...paradas, paradaToAdd] });
    
    // Reset nueva parada
    setNuevaParada({
      orden: maxOrden + 2,
      nombreParada: '',
      direccion: '',
      tiempoLlegada: nuevaParada.tiempoLlegada,
      tiempoEsperaMinutos: 5,
      precioDesdeOrigen: 0,
      observaciones: '',
      permiteAbordaje: true,
      permiteDescenso: true,
    });
  };

  const handleRemoveParada = (orden: number) => {
    const paradas = (formData.paradas || []).filter(p => p.orden !== orden);
    setFormData({ ...formData, paradas });
  };

  const toggleDia = (dia: string) => {
    const dias = formData.diasOperacion.split(',').filter(d => d);
    const index = dias.indexOf(dia);
    
    if (index > -1) {
      dias.splice(index, 1);
    } else {
      dias.push(dia);
    }
    
    setFormData({ ...formData, diasOperacion: dias.join(',') });
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando frecuencias del bus {busId}...</p>
            <p className="mt-2 text-xs text-gray-500">Cooperativa: {cooperativaId}</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => router.push(`/dashboard/Admin/cooperativas/${cooperativaId}`)}
                  className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
                >
                  ← Volver a Cooperativa
                </button>
                <h1 className="text-2xl font-bold text-gray-900">🚌 Frecuencias de Viaje - Bus #{busId}</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Gestiona las frecuencias y paradas para este bus
                </p>
                <div className="mt-2 text-xs bg-gray-100 p-2 rounded">
                  <p><strong>Debug:</strong> CooperativaId: {cooperativaId}, BusId: {busId}</p>
                  <p>Frecuencias cargadas: {frecuencias.length}</p>
                  <p>Rutas disponibles: {rutas.length}</p>
                </div>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                disabled={rutas.length === 0}
              >
                ➕ Nueva Frecuencia
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-semibold">⚠️ Error:</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <button 
                onClick={loadData}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
              >
                🔄 Reintentar
              </button>
            </div>
          )}

          {/* Lista de Frecuencias */}
          <div className="space-y-4">
            {frecuencias.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No hay frecuencias registradas para este bus</p>
                <button
                  onClick={() => handleOpenModal()}
                  className="mt-4 text-blue-600 hover:text-blue-800"
                >
                  Crear primera frecuencia
                </button>
              </div>
            ) : (
              frecuencias.map((frecuencia) => (
                <div key={frecuencia.id} className="bg-white rounded-lg shadow p-6">
                  {/* Cabecera */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{frecuencia.rutaNombre}</h3>
                      <p className="text-sm text-gray-600">{frecuencia.rutaOrigen} → {frecuencia.rutaDestino}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(frecuencia)}
                        className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(frecuencia.id)}
                        className="text-red-600 hover:text-red-800 px-3 py-1 rounded"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>

                  {/* Información */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 bg-gray-50 p-4 rounded">
                    <div>
                      <p className="text-xs text-gray-500">Salida</p>
                      <p className="font-semibold">{frecuencia.horaSalida}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Llegada Estimada</p>
                      <p className="font-semibold">{frecuencia.horaLlegadaEstimada || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Precio Base</p>
                      <p className="font-semibold">${frecuencia.precioBase?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Asientos</p>
                      <p className="font-semibold">{frecuencia.asientosDisponibles || 40}</p>
                    </div>
                  </div>

                  {/* Días de operación */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Días de Operación:</p>
                    <div className="flex flex-wrap gap-2">
                      {frecuencia.diasOperacion.split(',').map(dia => (
                        <span key={dia} className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          {dia}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Paradas */}
                  {frecuencia.paradas && frecuencia.paradas.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">📍 Paradas ({frecuencia.paradas.length}):</p>
                      <div className="space-y-2">
                        {frecuencia.paradas.map((parada) => (
                          <div key={parada.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                              {parada.orden}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{parada.nombreParada}</p>
                              {parada.direccion && <p className="text-xs text-gray-600">{parada.direccion}</p>}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">{parada.tiempoLlegada || 'N/A'}</p>
                              <p className="text-xs text-gray-500">${parada.precioDesdeOrigen?.toFixed(2) || '0.00'}</p>
                            </div>
                            <div className="flex gap-1">
                              {parada.permiteAbordaje && <span className="text-green-600 text-xs">🟢 Subir</span>}
                              {parada.permiteDescenso && <span className="text-blue-600 text-xs">🔵 Bajar</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  {/* Modal Header */}
                  <div className="bg-blue-600 text-white p-6 rounded-t-lg">
                    <h2 className="text-xl font-bold">
                      {editingFrecuencia ? '✏️ Editar Frecuencia' : '➕ Nueva Frecuencia'}
                    </h2>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Sección 1: Información Básica */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Información Básica</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ruta *</label>
                          <select
                            value={formData.rutaId}
                            onChange={(e) => setFormData({ ...formData, rutaId: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                            disabled={!!editingFrecuencia}
                          >
                            <option value={0}>Seleccione una ruta</option>
                            {rutas.map(ruta => (
                              <option key={ruta.id} value={ruta.id}>
                                {ruta.nombre} ({ruta.origen} → {ruta.destino})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hora Salida *</label>
                            <input
                              type="time"
                              value={formData.horaSalida}
                              onChange={(e) => setFormData({ ...formData, horaSalida: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hora Llegada</label>
                            <input
                              type="time"
                              value={formData.horaLlegadaEstimada}
                              onChange={(e) => setFormData({ ...formData, horaLlegadaEstimada: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Precio Base ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.precioBase}
                              onChange={(e) => setFormData({ ...formData, precioBase: Number(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Asientos Disponibles</label>
                            <input
                              type="number"
                              value={formData.asientosDisponibles}
                              onChange={(e) => setFormData({ ...formData, asientosDisponibles: Number(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                          <textarea
                            value={formData.observaciones}
                            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sección 2: Días de Operación */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Días de Operación</h3>
                      <div className="flex flex-wrap gap-2">
                        {DIAS_SEMANA.map(dia => {
                          const isSelected = formData.diasOperacion.split(',').includes(dia);
                          return (
                            <button
                              key={dia}
                              type="button"
                              onClick={() => toggleDia(dia)}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {dia.substring(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sección 3: Paradas */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">📍 Paradas del Trayecto</h3>
                      
                      {/* Lista de paradas agregadas */}
                      {formData.paradas && formData.paradas.length > 0 && (
                        <div className="mb-4 space-y-2">
                          {formData.paradas.map((parada) => (
                            <div key={parada.orden} className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
                              <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                {parada.orden}
                              </span>
                              <div className="flex-1">
                                <p className="font-medium">{parada.nombreParada}</p>
                                <p className="text-xs text-gray-600">
                                  {parada.tiempoLlegada} | ${parada.precioDesdeOrigen?.toFixed(2)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveParada(parada.orden)}
                                className="text-red-600 hover:text-red-800"
                              >
                                🗑️
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Formulario para agregar parada */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-3">Agregar nueva parada:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <input
                              type="text"
                              placeholder="Nombre de la parada *"
                              value={nuevaParada.nombreParada}
                              onChange={(e) => setNuevaParada({ ...nuevaParada, nombreParada: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Dirección"
                              value={nuevaParada.direccion}
                              onChange={(e) => setNuevaParada({ ...nuevaParada, direccion: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <input
                              type="time"
                              value={nuevaParada.tiempoLlegada}
                              onChange={(e) => setNuevaParada({ ...nuevaParada, tiempoLlegada: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Precio desde origen"
                              value={nuevaParada.precioDesdeOrigen}
                              onChange={(e) => setNuevaParada({ ...nuevaParada, precioDesdeOrigen: Number(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={nuevaParada.permiteAbordaje}
                                  onChange={(e) => setNuevaParada({ ...nuevaParada, permiteAbordaje: e.target.checked })}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm">Permite Abordaje</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={nuevaParada.permiteDescenso}
                                  onChange={(e) => setNuevaParada({ ...nuevaParada, permiteDescenso: e.target.checked })}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm">Permite Descenso</span>
                              </label>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddParada}
                          disabled={!nuevaParada.nombreParada}
                          className="mt-3 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                        >
                          ➕ Agregar Parada
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                      {editingFrecuencia ? 'Actualizar' : 'Crear'} Frecuencia
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
