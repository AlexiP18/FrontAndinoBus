'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cooperativaApi, BusDto, FrecuenciaDto } from '@/lib/api';

interface NuevaAsignacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cooperativaId: number;
  onSuccess: () => void;
}

export default function NuevaAsignacionModal({
  isOpen,
  onClose,
  cooperativaId,
  onSuccess
}: NuevaAsignacionModalProps) {
  const [busesDisponibles, setBusesDisponibles] = useState<BusDto[]>([]);
  const [frecuencias, setFrecuencias] = useState<FrecuenciaDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    busId: '',
    frecuenciaId: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: '',
    observaciones: ''
  });

  useEffect(() => {
    if (isOpen) {
      cargarDatos();
    }
  }, [isOpen]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay sesión activa');
        return;
      }

      // Cargar buses disponibles para hoy
      const buses = await cooperativaApi.obtenerBusesDisponibles(
        cooperativaId,
        new Date().toISOString().split('T')[0],
        token
      );
      setBusesDisponibles(buses);

      // Cargar frecuencias activas
      const freqs = await cooperativaApi.obtenerFrecuencias(cooperativaId, token);
      setFrecuencias(freqs.filter(f => f.activa));
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.busId || !formData.frecuenciaId) {
      setError('Bus y frecuencia son obligatorios');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay sesión activa');
        return;
      }

      await cooperativaApi.asignarBus({
        busId: parseInt(formData.busId),
        frecuenciaId: parseInt(formData.frecuenciaId),
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin || undefined,
        observaciones: formData.observaciones || undefined
      }, token);

      // Reset form
      setFormData({
        busId: '',
        frecuenciaId: '',
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaFin: '',
        observaciones: ''
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear asignación');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Nueva Asignación Bus-Frecuencia</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {loading && !error && (
            <div className="mb-4 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-2">Cargando...</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Bus Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bus <span className="text-red-500">*</span>
              </label>
              <select
                name="busId"
                value={formData.busId}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccione un bus</option>
                {busesDisponibles.map(bus => (
                  <option key={bus.id} value={bus.id}>
                    {bus.placa} - {bus.numeroInterno || 'Sin número'} ({bus.chasisMarca || 'Sin marca'})
                  </option>
                ))}
              </select>
              {busesDisponibles.length === 0 && !loading && (
                <p className="mt-1 text-sm text-yellow-600">
                  No hay buses disponibles. Verifique que no estén asignados o en día de parada.
                </p>
              )}
            </div>

            {/* Frecuencia Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frecuencia <span className="text-red-500">*</span>
              </label>
              <select
                name="frecuenciaId"
                value={formData.frecuenciaId}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccione una frecuencia</option>
                {frecuencias.map(freq => (
                  <option key={freq.id} value={freq.id}>
                    {freq.ruta?.origen || 'N/A'} → {freq.ruta?.destino || 'N/A'} | {freq.horaSalida} | {freq.diasSemana}
                  </option>
                ))}
              </select>
              {frecuencias.length === 0 && !loading && (
                <p className="mt-1 text-sm text-yellow-600">
                  No hay frecuencias activas disponibles.
                </p>
              )}
            </div>

            {/* Fecha Inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="fechaInicio"
                value={formData.fechaInicio}
                onChange={handleChange}
                required
                disabled={loading}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Fecha Fin (Opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Fin (opcional)
              </label>
              <input
                type="date"
                name="fechaFin"
                value={formData.fechaFin}
                onChange={handleChange}
                disabled={loading}
                min={formData.fechaInicio}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Dejar vacío para asignación indefinida (hasta finalización manual)
              </p>
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                disabled={loading}
                rows={3}
                placeholder="Notas adicionales sobre esta asignación..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || busesDisponibles.length === 0 || frecuencias.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Crear Asignación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
