'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, Wallet, DollarSign } from 'lucide-react';
import { pagosApi, type PagoConfirmacionRequest } from '@/lib/api';
import { PayPalScriptProvider, PayPalButtons, FUNDING } from '@paypal/react-paypal-js';

interface MetodoPagoProps {
  reservaId: number;
  monto: number;
  onPagoCompletado: () => void;
}

export default function MetodoPago({ reservaId, monto, onPagoCompletado }: MetodoPagoProps) {
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<'efectivo' | 'paypal'>('efectivo');
  const [referencia, setReferencia] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Client ID de PayPal (usa variable de entorno o un valor por defecto para sandbox)
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb'; // 'sb' es para sandbox de prueba

  const handleConfirmarPago = async (paypalOrderId?: string) => {
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
        referencia: paypalOrderId || referencia || undefined,
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

        {/* PayPal */}
        <button
          onClick={() => setMetodoSeleccionado('paypal')}
          className={`p-4 rounded-lg border-2 transition-all ${
            metodoSeleccionado === 'paypal'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-blue-400'
          }`}
        >
          <svg className="w-8 h-8 mx-auto mb-2" viewBox="0 0 24 24" fill="none">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.773.773 0 0 1 .763-.642h6.547c2.17 0 3.907.551 5.017 1.595.585.55.987 1.2 1.196 1.932.224.785.227 1.712.009 2.756-.127.598-.324 1.154-.586 1.66-.265.513-.599.97-.995 1.367-.52.52-1.126.93-1.807 1.223-.675.29-1.44.503-2.278.634a14.71 14.71 0 0 1-2.298.169h-.552c-.422 0-.825.16-1.13.45a1.69 1.69 0 0 0-.514 1.078l-.043.253-.69 4.371-.033.18c-.017.108-.048.18-.094.219-.046.04-.107.062-.182.062z" fill="#253B80"/>
            <path d="M19.347 8.086c-.013.09-.03.182-.047.275-.712 3.642-3.15 4.9-6.265 4.9h-1.585a.771.771 0 0 0-.763.65l-.81 5.138-.229 1.454a.405.405 0 0 0 .4.47h2.816a.677.677 0 0 0 .67-.57l.027-.143.53-3.365.034-.186a.677.677 0 0 1 .67-.57h.422c2.732 0 4.87-1.11 5.495-4.32.261-1.343.126-2.463-.566-3.252-.21-.24-.469-.434-.769-.59z" fill="#179BD7"/>
            <path d="M18.293 7.653a5.93 5.93 0 0 0-.733-.162 9.283 9.283 0 0 0-1.476-.108h-4.47a.673.673 0 0 0-.666.57l-.952 6.022-.028.176a.771.771 0 0 1 .763-.65h1.585c3.115 0 5.553-1.258 6.265-4.9.021-.108.038-.213.051-.316a3.886 3.886 0 0 0-.339-.632z" fill="#222D65"/>
          </svg>
          <p className="font-semibold text-gray-800">PayPal</p>
          <p className="text-xs text-gray-500 mt-1">Pago seguro online</p>
        </button>
      </div>

      {/* Formulario de pago en efectivo */}
      {metodoSeleccionado === 'efectivo' && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Instrucciones:</strong>
            </p>
            <p className="text-sm text-gray-600">
              Tu reserva quedará confirmada. Debes pagar en efectivo en cualquiera de nuestras oficinas antes de abordar el bus.
            </p>
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
            />
          </div>

          {/* Botón confirmar pago */}
          <button
            onClick={() => handleConfirmarPago()}
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
                Confirmar Pago en Efectivo
              </>
            )}
          </button>
        </div>
      )}

      {/* PayPal */}
      {metodoSeleccionado === 'paypal' && !success && (
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Pago seguro con PayPal:</strong>
            </p>
            <p className="text-sm text-gray-600">
              Serás redirigido a PayPal para completar tu pago de forma segura. Puedes pagar con tu cuenta PayPal o con tarjeta de débito/crédito.
            </p>
          </div>

          <PayPalScriptProvider options={{ 
            clientId: paypalClientId,
            currency: "USD",
            intent: "capture"
          }}>
            <PayPalButtons
              fundingSource={FUNDING.PAYPAL}
              style={{ 
                layout: "vertical",
                color: "blue",
                shape: "rect",
                label: "pay",
                height: 45
              }}
              disabled={loading || success}
              createOrder={(data, actions) => {
                return actions.order.create({
                  intent: "CAPTURE",
                  purchase_units: [
                    {
                      description: `Boleto de bus - Reserva #${reservaId}`,
                      amount: {
                        currency_code: "USD",
                        value: monto.toFixed(2),
                      },
                    },
                  ],
                });
              }}
              onApprove={async (data, actions) => {
                if (actions.order) {
                  const details = await actions.order.capture();
                  console.log('Pago completado:', details);
                  // Enviar confirmación al backend con el ID de la orden de PayPal
                  handleConfirmarPago(details.id);
                }
              }}
              onError={(err) => {
                console.error('Error PayPal:', err);
                setError('Hubo un error al procesar el pago con PayPal. Intenta nuevamente.');
              }}
              onCancel={() => {
                setError('El pago fue cancelado. Puedes intentar nuevamente.');
              }}
            />
          </PayPalScriptProvider>
        </div>
      )}

      {/* Mensajes */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800 text-sm">¡Pago completado exitosamente! Redirigiendo...</p>
        </div>
      )}
    </div>
  );
}
