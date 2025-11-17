'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cooperativaApi, BusDto } from '@/lib/api';

interface RegistrarDiaParadaModalProps {
  isOpen: boolean;
  onClose: () => void;
  cooperativaId: number;
  onSuccess: () => void;
  busPreseleccionado?: BusDto | null;
}

export default function RegistrarDiaParadaModal({
  isOpen,
  onClose,
  cooperativaId,
  onSuccess,
  busPreseleccionado = null
}: RegistrarDiaParadaModalProps) {
  const [buses, setBuses] = useState<BusDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    busId: '',
    fecha: new Date().toISOString().split('T')[0],
    motivo: 'MANTENIMIENTO',
    observaciones: ''
  });

  useEffect(() => {
    if (isOpen) {
      cargarBuses();
      
      // Si hay un bus preseleccionado, establecerlo en el form
      if (busPreseleccionado) {
        setFormData(prev => ({ ...prev, busId: busPreseleccionado.id.toString() }));
      }
    }
  }, [isOpen, busPreseleccionado]);

  const cargarBuses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay sesión activa');
        return;
      }

      const data = await cooperativaApi.obtenerBuses(cooperativaId, token);
      // Filtrar solo buses activos
      setBuses(data.filter(b => b.activo));
    } catch (err: any) {
      setError(err.message || 'Error al cargar buses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.busId || !formData.fecha || !formData.motivo) {
      setError('Bus, fecha y motivo son obligatorios');
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

      await cooperativaApi.registrarDiaParada({
        busId: parseInt(formData.busId),
        fecha: formData.fecha,
        motivo: formData.motivo as 'MANTENIMIENTO' | 'EXCESO_CAPACIDAD' | 'OTRO',
        observaciones: formData.observaciones || undefined
      }, token);

      // Reset form
      setFormData({
        busId: busPreseleccionado ? busPreseleccionado.id.toString() : '',
        fecha: new Date().toISOString().split('T')[0],
        motivo: 'MANTENIMIENTO',
        observaciones: ''
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar día de parada');
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
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Registrar Día de Parada</h2>
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
                disabled={loading || !!busPreseleccionado}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Seleccione un bus</option>
                {buses.map(bus => (
                  <option key={bus.id} value={bus.id}>
                    {bus.placa} - {bus.numeroInterno || 'Sin número'} ({bus.estado})
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                required
                disabled={loading}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Fecha en la que el bus no estará disponible
              </p>
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo <span className="text-red-500">*</span>
              </label>
              <select
                name="motivo"
                value={formData.motivo}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="MANTENIMIENTO">Mantenimiento</option>
                <option value="EXCESO_CAPACIDAD">Exceso de Capacidad</option>
                <option value="OTRO">Otro</option>
              </select>
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                <p><strong>Mantenimiento:</strong> Reparación o revisión técnica programada</p>
                <p><strong>Exceso de Capacidad:</strong> Más buses que frecuencias disponibles</p>
                <p><strong>Otro:</strong> Razones no especificadas</p>
              </div>
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
                placeholder="Detalles adicionales sobre el día de parada..."
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
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Registrar Parada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
