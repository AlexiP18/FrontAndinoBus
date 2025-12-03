'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import DashboardNavbar from '@/app/components/layout/DashboardNavbar';
import SeleccionAsientos from '@/app/components/SeleccionAsientos';
import MetodoPago from '@/app/components/MetodoPago';
import { reservasApi, boletosApi, type ReservaResponse, type BoletoResponse } from '@/lib/api';
import { ArrowLeft, CheckCircle, Download, Printer } from 'lucide-react';

export default function ReservaPage() {
  return (
    <ProtectedRoute>
      <ReservaPageContent />
    </ProtectedRoute>
  );
}

function ReservaPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<'asientos' | 'pago' | 'confirmacion'>('asientos');
  const [viajeId, setViajeId] = useState<number | null>(null);
  const [asientosSeleccionados, setAsientosSeleccionados] = useState<string[]>([]);
  const [reserva, setReserva] = useState<ReservaResponse | null>(null);
  const [boleto, setBoleto] = useState<BoletoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Por ahora usaremos un viajeId de prueba
  useEffect(() => {
    // TODO: Obtener viajeId de los parámetros de búsqueda o route params
    setViajeId(1); // Viaje de prueba
  }, []);

  const handleCrearReserva = async () => {
    if (asientosSeleccionados.length === 0) {
      setError('Por favor selecciona al menos un asiento');
      return;
    }

    if (!viajeId) {
      setError('No se ha seleccionado un viaje');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No estás autenticado');
      }

      const response = await reservasApi.crear({
        viajeId,
        asientos: asientosSeleccionados,
        tipoAsiento: 'NORMAL',
      }, token);

      setReserva(response);
      setStep('pago');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear la reserva';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePagoCompletado = async () => {
    if (!reserva) return;

    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No estás autenticado');

      const boletoResponse = await boletosApi.generar(reserva.id, token);
      setBoleto(boletoResponse);
      setStep('confirmacion');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al generar el boleto';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarBoleto = () => {
    if (!boleto) return;
    
    const qrUrl = boleto.qr || boleto.qrUrl;
    if (!qrUrl) {
      alert('No hay código QR disponible para descargar');
      return;
    }
    
    // Crear un elemento temporal para descargar el QR
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `boleto-${boleto.codigo}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImprimirBoleto = () => {
    window.print();
  };

  const calcularTotal = () => {
    const precioPorAsiento = 25.00;
    return asientosSeleccionados.length * precioPorAsiento;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar title="Reservas" />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Nueva Reserva</h1>
            <p className="text-gray-600">Usuario: {user?.nombres || user?.email}</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            {/* Step 1 */}
            <div className={`flex items-center gap-2 ${step === 'asientos' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step === 'asientos' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="font-semibold">Selección de Asientos</span>
            </div>

            <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>

            {/* Step 2 */}
            <div className={`flex items-center gap-2 ${step === 'pago' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step === 'pago' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="font-semibold">Método de Pago</span>
            </div>

            <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>

            {/* Step 3 */}
            <div className={`flex items-center gap-2 ${step === 'confirmacion' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step === 'confirmacion' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="font-semibold">Confirmación</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Step: Selección de Asientos */}
        {step === 'asientos' && viajeId && (
          <div className="space-y-6">
            <SeleccionAsientos
              viajeId={viajeId}
              onSeleccionChange={setAsientosSeleccionados}
            />

            {asientosSeleccionados.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Resumen</h3>
                  <div className="text-right">
                    <p className="text-gray-600">Total</p>
                    <p className="text-3xl font-bold text-blue-600">${calcularTotal().toFixed(2)}</p>
                  </div>
                </div>

                <button
                  onClick={handleCrearReserva}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-400"
                >
                  {loading ? 'Creando reserva...' : 'Continuar al Pago'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step: Método de Pago */}
        {step === 'pago' && reserva && (
          <MetodoPago
            reservaId={reserva.id}
            monto={calcularTotal()}
            onPagoCompletado={handlePagoCompletado}
          />
        )}

        {/* Step: Confirmación y Boleto */}
        {step === 'confirmacion' && boleto && (
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 mb-2">¡Reserva Confirmada!</h2>
              <p className="text-gray-600">Tu boleto ha sido generado exitosamente</p>
            </div>

            <div className="border-2 border-gray-200 rounded-lg p-6 mb-6">
              <div className="text-center mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={boleto.qr}
                  alt="Código QR"
                  className="w-48 h-48 mx-auto"
                />
              </div>

              <div className="space-y-3 text-center">
                <div>
                  <p className="text-sm text-gray-600">Código de Boleto</p>
                  <p className="text-2xl font-bold text-gray-800">{boleto.codigo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Asientos</p>
                  <p className="text-lg font-semibold text-gray-800">{asientosSeleccionados.join(', ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Pagado</p>
                  <p className="text-lg font-semibold text-green-600">${calcularTotal().toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleDescargarBoleto}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                <Download className="w-5 h-5" />
                Descargar
              </button>
              <button
                onClick={handleImprimirBoleto}
                className="flex items-center justify-center gap-2 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                <Printer className="w-5 h-5" />
                Imprimir
              </button>
            </div>

            <button
              onClick={() => router.push('/dashboard/Cliente')}
              className="w-full mt-4 bg-gray-100 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Volver al Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
