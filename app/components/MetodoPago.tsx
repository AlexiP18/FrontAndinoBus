'use client';

import { useState } from 'react';
import { CreditCard, CheckCircle, AlertCircle, Wallet, DollarSign } from 'lucide-react';
import { pagosApi, type PagoConfirmacionRequest } from '@/lib/api';

interface MetodoPagoProps {
  reservaId: number;
  monto: number;
  onPagoCompletado: () => void;
}

export default function MetodoPago({ reservaId, monto, onPagoCompletado }: MetodoPagoProps) {
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<'efectivo' | 'tarjeta' | 'paypal'>('efectivo');
  const [referencia, setReferencia] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleConfirmarPago = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No estás autenticado');
      }

      const request: PagoConfirmacionRequest = {
        reservaId,
        metodoPago: metodoSeleccionado.toUpperCase(),
        referencia: referencia || undefined,
      };

      const response = await pagosApi.confirmar(request, token);

      if (response.estado === 'PAGADO') {
        setSuccess(true);
        setTimeout(() => {
          onPagoCompletado();
        }, 2000);
      } else {
        setError(response.mensaje || 'El pago fue rechazado');
      }

    } catch (err) {
      console.error('Error procesando pago:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar el pago. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Método de Pago</h2>

      {/* Resumen del monto */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-700 font-medium">Total a pagar:</span>
          <span className="text-2xl font-bold text-blue-600">${monto.toFixed(2)}</span>
        </div>
      </div>

      {/* Selección de método */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Efectivo */}
        <button
          onClick={() => setMetodoSeleccionado('efectivo')}
          className={`p-4 rounded-lg border-2 transition-all ${
            metodoSeleccionado === 'efectivo'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-blue-400'
          }`}
        >
          <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <p className="font-semibold text-gray-800">Efectivo</p>
          <p className="text-xs text-gray-500 mt-1">Pagar en oficina</p>
        </button>

        {/* Tarjeta */}
        <button
          onClick={() => setMetodoSeleccionado('tarjeta')}
          className={`p-4 rounded-lg border-2 transition-all ${
            metodoSeleccionado === 'tarjeta'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-blue-400'
          }`}
        >
          <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-600" />
          <p className="font-semibold text-gray-800">Tarjeta</p>
          <p className="text-xs text-gray-500 mt-1">Débito/Crédito</p>
        </button>

        {/* PayPal */}
        <button
          onClick={() => setMetodoSeleccionado('paypal')}
          className={`p-4 rounded-lg border-2 transition-all ${
            metodoSeleccionado === 'paypal'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Wallet className="w-8 h-8 mx-auto mb-2 text-blue-400" />
          <p className="font-semibold text-gray-800">PayPal</p>
          <p className="text-xs text-gray-500 mt-1">Próximamente</p>
        </button>
      </div>

      {/* Formulario de pago */}
      {(metodoSeleccionado === 'efectivo' || metodoSeleccionado === 'tarjeta') && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Instrucciones:</strong>
            </p>
            {metodoSeleccionado === 'efectivo' && (
              <p className="text-sm text-gray-600">
                Tu reserva quedará confirmada. Debes pagar en efectivo en cualquiera de nuestras oficinas antes de abordar el bus.
              </p>
            )}
            {metodoSeleccionado === 'tarjeta' && (
              <p className="text-sm text-gray-600">
                Tu pago será procesado de forma simulada. En producción, aquí se integraría una pasarela de pago real.
              </p>
            )}
          </div>

          {/* Referencia opcional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Referencia (Opcional)
            </label>
            <input
              type="text"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ej: TRX-123456"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Botón confirmar pago */}
          <button
            onClick={handleConfirmarPago}
            disabled={loading || success}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Procesando...
              </>
            ) : success ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Pago Confirmado
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Confirmar Pago
              </>
            )}
          </button>
        </div>
      )}

      {/* PayPal (próximamente) */}
      {metodoSeleccionado === 'paypal' && (
        <div className="text-center py-8">
          <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Integración con PayPal próximamente</p>
          <p className="text-sm text-gray-500">Por ahora, utiliza efectivo o tarjeta</p>
        </div>
      )}

      {/* Mensajes */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800 text-sm">Pago enviado exitosamente. Redirigiendo...</p>
        </div>
      )}
    </div>
  );
}
