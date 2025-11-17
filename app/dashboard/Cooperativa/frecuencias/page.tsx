'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ArrowLeft, Clock } from 'lucide-react';
import { frecuenciasApi, cooperativasApi, getToken, type FrecuenciaResponse, type CooperativaResponse, type FrecuenciaCreateRequest } from '@/lib/api';
import { CIUDADES_ECUADOR } from '@/lib/constants';
import Link from 'next/link';

const DIAS_SEMANA = [
  { value: 'LUNES', label: 'Lunes' },
  { value: 'MARTES', label: 'Martes' },
  { value: 'MIERCOLES', label: 'Miércoles' },
  { value: 'JUEVES', label: 'Jueves' },
  { value: 'VIERNES', label: 'Viernes' },
  { value: 'SABADO', label: 'Sábado' },
  { value: 'DOMINGO', label: 'Domingo' },
];

export default function FrecuenciasPage() {
  const [frecuencias, setFrecuencias] = useState<FrecuenciaResponse[]>([]);
  const [cooperativas, setCooperativas] = useState<CooperativaResponse[]>([]);
  const [cooperativaSeleccionada, setCooperativaSeleccionada] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    origen: '',
    destino: '',
    horaSalida: '',
    duracionEstimadaMin: '',
    diasOperacion: '',
    activa: true,
  });

  useEffect(() => {
    cargarCooperativas();
  }, []);

  useEffect(() => {
    if (cooperativaSeleccionada) {
      cargarFrecuencias();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cooperativaSeleccionada]);

  const cargarCooperativas = async () => {
    try {
      const token = getToken();
      const response = await cooperativasApi.listar('', 0, 100, token || undefined);
      setCooperativas(response.content);
      if (response.content.length > 0) {
        setCooperativaSeleccionada(response.content[0].id);
      }
    } catch (err) {
      console.error('Error cargando cooperativas:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar cooperativas');
    }
  };

  const cargarFrecuencias = async () => {
    if (!cooperativaSeleccionada) return;

    setLoading(true);
    setError('');

    try {
      const token = getToken();
      const response = await frecuenciasApi.listarPorCooperativa(cooperativaSeleccionada, '', 0, 50, token || undefined);
      setFrecuencias(response.content);
    } catch (err) {
      console.error('Error cargando frecuencias:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar frecuencias');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (frecuencia?: FrecuenciaResponse) => {
    if (frecuencia) {
      setEditingId(frecuencia.id);
      setFormData({
        origen: frecuencia.origen,
        destino: frecuencia.destino,
        horaSalida: frecuencia.horaSalida,
        duracionEstimadaMin: frecuencia.duracionEstimadaMin.toString(),
        diasOperacion: frecuencia.diasOperacion,
        activa: frecuencia.activa ?? true,
      });
    } else {
      setEditingId(null);
      setFormData({
        origen: '',
        destino: '',
        horaSalida: '',
        duracionEstimadaMin: '',
        diasOperacion: '',
        activa: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      origen: '',
      destino: '',
      horaSalida: '',
      duracionEstimadaMin: '',
      diasOperacion: '',
      activa: true,
    });
  };

  const toggleDia = (dia: string) => {
    const diasArray = formData.diasOperacion ? formData.diasOperacion.split(',') : [];
    const newDiasArray = diasArray.includes(dia)
      ? diasArray.filter((d) => d !== dia)
      : [...diasArray, dia];
    setFormData((prev) => ({
      ...prev,
      diasOperacion: newDiasArray.join(','),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cooperativaSeleccionada) return;

    if (!formData.diasOperacion || formData.diasOperacion.trim().length === 0) {
      setError('Debe seleccionar al menos un día de operación');
      return;
    }

    setError('');

    try {
      const token = getToken();
      const payload: FrecuenciaCreateRequest = {
        origen: formData.origen,
        destino: formData.destino,
        horaSalida: formData.horaSalida,
        duracionEstimadaMin: parseInt(formData.duracionEstimadaMin),
        diasOperacion: formData.diasOperacion,
        activa: formData.activa,
      };

      if (editingId) {
        await frecuenciasApi.actualizar(editingId, payload, token || undefined);
      } else {
        await frecuenciasApi.crear(cooperativaSeleccionada, payload, token || undefined);
      }

      handleCloseModal();
      cargarFrecuencias();
    } catch (err) {
      console.error('Error guardando frecuencia:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar frecuencia');
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta frecuencia?')) return;

    try {
      const token = getToken();
      await frecuenciasApi.eliminar(id, token || undefined);
      cargarFrecuencias();
    } catch (err) {
      console.error('Error eliminando frecuencia:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar frecuencia');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/Cooperativa"
            className="text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="w-7 h-7 text-purple-600" />
            Gestión de Frecuencias
          </h1>
        </div>
        <button
          onClick={() => handleOpenModal()}
          disabled={!cooperativaSeleccionada}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center gap-2 disabled:bg-purple-400"
        >
          <Plus className="w-5 h-5" />
          Nueva Frecuencia
        </button>
      </div>

      {/* Selector de Cooperativa */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cooperativa
        </label>
        <select
          value={cooperativaSeleccionada || ''}
          onChange={(e) => setCooperativaSeleccionada(Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
        >
          {cooperativas.map((coop) => (
            <option key={coop.id} value={coop.id}>
              {coop.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      ) : frecuencias.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay frecuencias registradas para esta cooperativa</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ruta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora Salida</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duración</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Días Operación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {frecuencias.map((frecuencia) => (
                <tr key={frecuencia.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {frecuencia.origen} → {frecuencia.destino}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{frecuencia.horaSalida}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{frecuencia.duracionEstimadaMin} min</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex flex-wrap gap-1">
                      {frecuencia.diasOperacion.split(',').map((dia: string) => (
                        <span key={dia} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {dia.substring(0, 3)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      frecuencia.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {frecuencia.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(frecuencia)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEliminar(frecuencia.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingId ? 'Editar Frecuencia' : 'Nueva Frecuencia'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Origen *
                  </label>
                  <select
                    value={formData.origen}
                    onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  >
                    <option value="">Seleccione ciudad</option>
                    {CIUDADES_ECUADOR.map((ciudad) => (
                      <option key={ciudad} value={ciudad}>
                        {ciudad}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destino *
                  </label>
                  <select
                    value={formData.destino}
                    onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  >
                    <option value="">Seleccione ciudad</option>
                    {CIUDADES_ECUADOR.map((ciudad) => (
                      <option key={ciudad} value={ciudad}>
                        {ciudad}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de Salida *
                  </label>
                  <input
                    type="time"
                    value={formData.horaSalida}
                    onChange={(e) => setFormData({ ...formData, horaSalida: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración Estimada (min) *
                  </label>
                  <input
                    type="number"
                    value={formData.duracionEstimadaMin}
                    onChange={(e) => setFormData({ ...formData, duracionEstimadaMin: e.target.value })}
                    min="1"
                    placeholder="120"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Días de Operación *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {DIAS_SEMANA.map((dia) => (
                    <button
                      key={dia.value}
                      type="button"
                      onClick={() => toggleDia(dia.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        formData.diasOperacion.split(',').includes(dia.value)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {dia.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.activa}
                  onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label className="text-sm text-gray-700">Activa</label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition"
                >
                  {editingId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
