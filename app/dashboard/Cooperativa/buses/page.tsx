'use client';

import { useState, useEffect } from 'react';
import { Plus, Bus as BusIcon, ArrowLeft } from 'lucide-react';
import { busesApi, cooperativasApi, getToken, type BusResponse, type CooperativaResponse } from '@/lib/api';
import Link from 'next/link';

export default function BusesPage() {
  const [buses, setBuses] = useState<BusResponse[]>([]);
  const [cooperativas, setCooperativas] = useState<CooperativaResponse[]>([]);
  const [cooperativaSeleccionada, setCooperativaSeleccionada] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    numeroInterno: '',
    placa: '',
    chasisMarca: '',
    carroceriaMarca: '',
    fotoUrl: '',
    activo: true,
  });

  useEffect(() => {
    cargarCooperativas();
  }, []);

  useEffect(() => {
    if (cooperativaSeleccionada) {
      cargarBuses();
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

  const cargarBuses = async () => {
    if (!cooperativaSeleccionada) return;

    setLoading(true);
    setError('');

    try {
      const token = getToken();
      const response = await busesApi.listarPorCooperativa(cooperativaSeleccionada, 0, 50, token || undefined);
      setBuses(response.content);
    } catch (err) {
      console.error('Error cargando buses:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar buses');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      numeroInterno: '',
      placa: '',
      chasisMarca: '',
      carroceriaMarca: '',
      fotoUrl: '',
      activo: true,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      numeroInterno: '',
      placa: '',
      chasisMarca: '',
      carroceriaMarca: '',
      fotoUrl: '',
      activo: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cooperativaSeleccionada) return;

    setError('');

    try {
      const token = getToken();
      await busesApi.crear(cooperativaSeleccionada, formData, token || undefined);
      handleCloseModal();
      cargarBuses();
    } catch (err) {
      console.error('Error guardando bus:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar bus');
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
            <BusIcon className="w-7 h-7 text-blue-600" />
            Gestión de Buses
          </h1>
        </div>
        <button
          onClick={handleOpenModal}
          disabled={!cooperativaSeleccionada}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2 disabled:bg-blue-400"
        >
          <Plus className="w-5 h-5" />
          Nuevo Bus
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : buses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <BusIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay buses registrados para esta cooperativa</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Interno</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chasis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carrocería</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {buses.map((bus) => (
                <tr key={bus.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{bus.numeroInterno}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{bus.placa}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{bus.chasisMarca}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{bus.carroceriaMarca}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      bus.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {bus.activo ? 'Activo' : 'Inactivo'}
                    </span>
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
            <h2 className="text-xl font-bold text-gray-800 mb-4">Nuevo Bus</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número Interno *
                  </label>
                  <input
                    type="text"
                    value={formData.numeroInterno}
                    onChange={(e) => setFormData({ ...formData, numeroInterno: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Placa *
                  </label>
                  <input
                    type="text"
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                    placeholder="ABC-1234"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca del Chasis *
                  </label>
                  <input
                    type="text"
                    value={formData.chasisMarca}
                    onChange={(e) => setFormData({ ...formData, chasisMarca: e.target.value })}
                    placeholder="Volvo, Mercedes, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca de Carrocería *
                  </label>
                  <input
                    type="text"
                    value={formData.carroceriaMarca}
                    onChange={(e) => setFormData({ ...formData, carroceriaMarca: e.target.value })}
                    placeholder="Marcopolo, Hino, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de Foto
                </label>
                <input
                  type="url"
                  value={formData.fotoUrl}
                  onChange={(e) => setFormData({ ...formData, fotoUrl: e.target.value })}
                  placeholder="https://ejemplo.com/foto-bus.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700">Activo</label>
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
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
