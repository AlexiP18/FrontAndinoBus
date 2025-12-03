'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, X, Clock, DollarSign, User, Bus, AlertCircle } from 'lucide-react';
import {
  frecuenciaConfigApi,
  getToken,
  type FrecuenciaConfigResponse,
  type UpdateFrecuenciaConfigRequest,
} from '@/lib/api';

interface Props {
  cooperativaId: number;
  isOpen?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean; // Cuando es true, se renderiza sin el overlay del modal
}

export default function ConfiguracionFrecuenciasModal({ cooperativaId, isOpen = true, onClose, isEmbedded = false }: Props) {
  const [config, setConfig] = useState<FrecuenciaConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState<UpdateFrecuenciaConfigRequest>({});

  useEffect(() => {
    cargarConfiguracion();
  }, [cooperativaId]);

  const cargarConfiguracion = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const data = await frecuenciaConfigApi.getConfiguracion(cooperativaId, token || '');
      setConfig(data);
      setFormData({
        precioBasePorKm: data.precioBasePorKm,
        factorDieselPorKm: data.factorDieselPorKm,
        precioDiesel: data.precioDiesel,
        margenGananciaPorcentaje: data.margenGananciaPorcentaje,
        maxHorasDiariasChofer: data.maxHorasDiariasChofer,
        maxHorasExcepcionales: data.maxHorasExcepcionales,
        maxDiasExcepcionalesSemana: data.maxDiasExcepcionalesSemana,
        tiempoDescansoEntreViajesMinutos: data.tiempoDescansoEntreViajesMinutos,
        tiempoMinimoParadaBusMinutos: data.tiempoMinimoParadaBusMinutos,
        horasOperacionMaxBus: data.horasOperacionMaxBus,
        intervaloMinimoFrecuenciasMinutos: data.intervaloMinimoFrecuenciasMinutos,
        horaInicioOperacion: data.horaInicioOperacion,
        horaFinOperacion: data.horaFinOperacion,
      });
    } catch (err) {
      // Si no existe configuración, mostrar valores por defecto
      if (err instanceof Error && err.message.includes('404')) {
        setError('No existe configuración para esta cooperativa. Se usarán valores por defecto.');
      } else {
        setError(err instanceof Error ? err.message : 'Error al cargar configuración');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      const token = getToken();
      const updated = await frecuenciaConfigApi.updateConfiguracion(cooperativaId, formData, token || '');
      setConfig(updated);
      setSuccess('Configuración guardada correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UpdateFrecuenciaConfigRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    if (isEmbedded) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      );
    }
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Contenido del formulario
  const formContent = (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <Save className="w-5 h-5 text-green-600" />
          <span className="text-green-800 text-sm">{success}</span>
        </div>
      )}

      {/* Sección: Precios */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-green-600" />
          Configuración de Precios
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Precio base por km ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.precioBasePorKm || 0}
              onChange={(e) => handleChange('precioBasePorKm', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">Costo operativo por kilómetro</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Precio del diesel ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.precioDiesel || 0}
              onChange={(e) => handleChange('precioDiesel', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">Precio actual por galón</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Factor diesel por km (L)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.factorDieselPorKm || 0}
              onChange={(e) => handleChange('factorDieselPorKm', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">Consumo promedio de diesel por km</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Margen de ganancia (%)
            </label>
            <input
              type="number"
              step="1"
              value={formData.margenGananciaPorcentaje || 0}
              onChange={(e) => handleChange('margenGananciaPorcentaje', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">Porcentaje sobre el costo total</p>
          </div>
        </div>
      </section>

      {/* Sección: Choferes */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-blue-600" />
          Configuración de Choferes
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Horas máximas diarias
            </label>
            <input
              type="number"
              value={formData.maxHorasDiariasChofer || 8}
              onChange={(e) => handleChange('maxHorasDiariasChofer', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">Jornada laboral normal</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Horas excepcionales máximas
            </label>
            <input
              type="number"
              value={formData.maxHorasExcepcionales || 10}
              onChange={(e) => handleChange('maxHorasExcepcionales', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">Máximo con horas extras</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Días excepcionales por semana
            </label>
            <input
              type="number"
              value={formData.maxDiasExcepcionalesSemana || 2}
              onChange={(e) => handleChange('maxDiasExcepcionalesSemana', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">Máximo de días con extras por semana</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Descanso entre viajes (min)
            </label>
            <input
              type="number"
              value={formData.tiempoDescansoEntreViajesMinutos || 30}
              onChange={(e) => handleChange('tiempoDescansoEntreViajesMinutos', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">Tiempo mínimo de descanso</p>
          </div>
        </div>
      </section>

      {/* Sección: Buses */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Bus className="w-5 h-5 text-purple-600" />
          Configuración de Buses
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Tiempo mínimo en parada (min)
            </label>
            <input
              type="number"
              value={formData.tiempoMinimoParadaBusMinutos || 15}
              onChange={(e) => handleChange('tiempoMinimoParadaBusMinutos', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Horas operación máx. por día
            </label>
            <input
              type="number"
              value={formData.horasOperacionMaxBus || 24}
              onChange={(e) => handleChange('horasOperacionMaxBus', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900"
            />
          </div>
        </div>
      </section>

      {/* Sección: Horarios */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-orange-600" />
          Horarios de Operación
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Hora inicio operación
            </label>
            <input
              type="time"
              value={formData.horaInicioOperacion || '05:00'}
              onChange={(e) => handleChange('horaInicioOperacion', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Hora fin operación
            </label>
            <input
              type="time"
              value={formData.horaFinOperacion || '23:00'}
              onChange={(e) => handleChange('horaFinOperacion', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Intervalo mínimo (min)
            </label>
            <input
              type="number"
              value={formData.intervaloMinimoFrecuenciasMinutos || 30}
              onChange={(e) => handleChange('intervaloMinimoFrecuenciasMinutos', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">Entre frecuencias</p>
          </div>
        </div>
      </section>

      {/* Botón Guardar */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:bg-purple-300 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );

  // Si es embebido, renderizar sin el overlay del modal
  if (isEmbedded) {
    return formContent;
  }

  // Si no está abierto, no renderizar nada
  if (!isOpen) return null;

  // Renderizar como modal
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-gray-700 to-gray-800 text-white">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Configuración de Frecuencias</h2>
              <p className="text-sm text-gray-300">{config?.cooperativaNombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {formContent}
        </div>
      </div>
    </div>
  );
}
