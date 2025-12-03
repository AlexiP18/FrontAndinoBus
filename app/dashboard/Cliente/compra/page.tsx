'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, CreditCard as IdCard, Users, Ticket, Download, CheckCircle } from 'lucide-react';
import AsientoMapa from '@/app/components/AsientoMapa';
import MetodoPago from '@/app/components/MetodoPago';
import { RutaItem, reservasApi, boletosApi, getToken } from '@/lib/api';
import { TIPO_PASAJERO, DESCUENTOS } from '@/lib/constants';

export default function CompraPage() {
  const router = useRouter();
  const [paso, setPaso] = useState(1); // 1: asientos, 2: datos, 3: pago, 4: confirmación
  const [rutaSeleccionada, setRutaSeleccionada] = useState<RutaItem | null>(null);
  const [asientosSeleccionados, setAsientosSeleccionados] = useState<string[]>([]);
  const [viajeIdReal, setViajeIdReal] = useState<number | null>(null); // ID real del viaje
  const [reservaId, setReservaId] = useState<number | null>(null);
  const [boletoQR, setBoletoQR] = useState<string | null>(null);
  const [codigoBoleto, setCodigoBoleto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [datosPasajeros, setDatosPasajeros] = useState<Array<{
    nombre: string;
    cedula: string;
    email: string;
    tipoPasajero: string;
  }>>([]);

  useEffect(() => {
    // Recuperar ruta desde sessionStorage (pasada desde búsqueda)
    const rutaGuardada = sessionStorage.getItem('rutaSeleccionada');
    if (rutaGuardada) {
      setRutaSeleccionada(JSON.parse(rutaGuardada));
    } else {
      router.push('/dashboard/Cliente');
    }
  }, [router]);

  useEffect(() => {
    // Inicializar array de pasajeros según asientos seleccionados
    if (asientosSeleccionados.length > 0) {
      setDatosPasajeros(
        asientosSeleccionados.map(() => ({
          nombre: '',
          cedula: '',
          email: '',
          tipoPasajero: TIPO_PASAJERO.REGULAR,
        }))
      );
    }
  }, [asientosSeleccionados]);

  const calcularPrecioTotal = () => {
    const precioBase = 10.0; // Precio base por asiento (esto debería venir del backend)
    let total = 0;

    datosPasajeros.forEach(pasajero => {
      let precio = precioBase;
      
      if (pasajero.tipoPasajero === TIPO_PASAJERO.MENOR_EDAD) {
        precio *= (1 - DESCUENTOS.MENOR_EDAD);
      } else if (pasajero.tipoPasajero === TIPO_PASAJERO.TERCERA_EDAD) {
        precio *= (1 - DESCUENTOS.TERCERA_EDAD);
      } else if (pasajero.tipoPasajero === TIPO_PASAJERO.DISCAPACITADO) {
        precio *= (1 - DESCUENTOS.DISCAPACITADO);
      }

      total += precio;
    });

    return total;
  };

  const handleContinuarAsientos = () => {
    if (asientosSeleccionados.length === 0) {
      setError('Selecciona al menos un asiento');
      return;
    }
    setPaso(2);
    setError('');
  };

  const validarDatosPasajeros = () => {
    for (let i = 0; i < datosPasajeros.length; i++) {
      const p = datosPasajeros[i];
      if (!p.nombre.trim() || !p.cedula.trim() || !p.email.trim()) {
        setError(`Completa todos los datos del pasajero ${i + 1}`);
        return false;
      }
      if (!/^\d{10}$/.test(p.cedula)) {
        setError(`La cédula del pasajero ${i + 1} debe tener 10 dígitos`);
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) {
        setError(`Email inválido del pasajero ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const handleContinuarDatos = async () => {
    if (!validarDatosPasajeros()) return;

    // Verificar que tenemos el viajeId real
    if (!viajeIdReal) {
      setError('Error: No se pudo obtener el ID del viaje. Por favor, vuelve a seleccionar los asientos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Obtener email del usuario desde localStorage o primer pasajero
      const userDataStr = localStorage.getItem('user');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const clienteEmail = userData?.email || datosPasajeros[0]?.email;

      // Crear reserva con el viajeId real (no frecuenciaId)
      const token = getToken();
      const response = await reservasApi.crear({
        viajeId: viajeIdReal,
        asientos: asientosSeleccionados,
        tipoAsiento: 'NORMAL',
        clienteEmail: clienteEmail,
      }, token || '');

      setReservaId(response.id);
      setPaso(3);
    } catch (err) {
      console.error('Error creando reserva:', err);
      setError(err instanceof Error ? err.message : 'Error al crear la reserva');
    } finally {
      setLoading(false);
    }
  };

  const handlePagoCompletado = async () => {
    if (!reservaId) return;

    setLoading(true);
    try {
      // Generar boleto con QR
      const token = getToken();
      if (!token) {
        throw new Error('No estás autenticado');
      }

      const boleto = await boletosApi.generar(reservaId, token);
      setBoletoQR(boleto.codigoQR);
      setCodigoBoleto(boleto.codigoBoleto);
      setPaso(4);
    } catch (err) {
      console.error('Error generando boleto:', err);
      setError(err instanceof Error ? err.message : 'Error al generar el boleto');
    } finally {
      setLoading(false);
    }
  };

  const actualizarDatosPasajero = (index: number, campo: string, valor: string) => {
    const nuevos = [...datosPasajeros];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setDatosPasajeros(nuevos);
  };

  if (!rutaSeleccionada) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => paso > 1 ? setPaso(paso - 1) : router.push('/dashboard/Cliente')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            {paso === 1 ? 'Volver a búsqueda' : 'Atrás'}
          </button>

          {/* Stepper */}
          <div className="mt-6 flex items-center justify-center gap-4">
            {[
              { num: 1, label: 'Asientos' },
              { num: 2, label: 'Datos' },
              { num: 3, label: 'Pago' },
              { num: 4, label: 'Boleto' },
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center">
                <div className={`flex items-center gap-2 ${paso >= step.num ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    paso >= step.num ? 'bg-blue-600 text-white' : 'bg-gray-200'
                  }`}>
                    {paso > step.num ? '✓' : step.num}
                  </div>
                  <span className="font-medium hidden sm:inline">{step.label}</span>
                </div>
                {idx < 3 && <div className={`w-12 h-1 mx-2 ${paso > step.num ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Info de ruta */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-semibold text-gray-800">{rutaSeleccionada.cooperativa}</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-800">{rutaSeleccionada.origen} → {rutaSeleccionada.destino}</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-800">{rutaSeleccionada.horaSalida}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Paso 1: Selección de asientos */}
        {paso === 1 && (
          <div>
            <AsientoMapa
              frecuenciaId={rutaSeleccionada.frecuenciaId}
              fecha={rutaSeleccionada.fecha}
              onAsientosChange={setAsientosSeleccionados}
              onViajeIdChange={setViajeIdReal}
              maxSeleccion={5}
            />
            {asientosSeleccionados.length > 0 && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleContinuarAsientos}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Continuar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Paso 2: Datos de pasajeros */}
        {paso === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Users className="w-7 h-7 text-blue-600" />
              Datos de Pasajeros
            </h2>

            <div className="space-y-6">
              {asientosSeleccionados.map((asiento, index) => (
                <div key={asiento} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-4">
                    Pasajero {index + 1} - Asiento {asiento}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        value={datosPasajeros[index]?.nombre || ''}
                        onChange={(e) => actualizarDatosPasajero(index, 'nombre', e.target.value)}
                        placeholder="Juan Pérez"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <IdCard className="w-4 h-4 inline mr-1" />
                        Cédula *
                      </label>
                      <input
                        type="text"
                        value={datosPasajeros[index]?.cedula || ''}
                        onChange={(e) => actualizarDatosPasajero(index, 'cedula', e.target.value)}
                        placeholder="1234567890"
                        maxLength={10}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email *
                      </label>
                      <input
                        type="email"
                        value={datosPasajeros[index]?.email || ''}
                        onChange={(e) => actualizarDatosPasajero(index, 'email', e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Ticket className="w-4 h-4 inline mr-1" />
                        Tipo de Pasajero
                      </label>
                      <select
                        value={datosPasajeros[index]?.tipoPasajero || TIPO_PASAJERO.REGULAR}
                        onChange={(e) => actualizarDatosPasajero(index, 'tipoPasajero', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                      >
                        <option value={TIPO_PASAJERO.REGULAR}>Regular</option>
                        <option value={TIPO_PASAJERO.MENOR_EDAD}>Menor de Edad (15% desc.)</option>
                        <option value={TIPO_PASAJERO.TERCERA_EDAD}>Tercera Edad (20% desc.)</option>
                        <option value={TIPO_PASAJERO.DISCAPACITADO}>Discapacitado (25% desc.)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Total a pagar:</span>
                <span className="text-2xl font-bold text-blue-600">${calcularPrecioTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleContinuarDatos}
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-400"
              >
                {loading ? 'Procesando...' : 'Continuar al Pago'}
              </button>
            </div>
          </div>
        )}

        {/* Paso 3: Pago */}
        {paso === 3 && reservaId && (
          <MetodoPago
            reservaId={reservaId}
            monto={calcularPrecioTotal()}
            onPagoCompletado={handlePagoCompletado}
          />
        )}

        {/* Paso 4: Confirmación y Boleto */}
        {paso === 4 && boletoQR && (
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 mb-2">¡Compra Exitosa!</h2>
              <p className="text-gray-600">Tu boleto ha sido generado correctamente</p>
            </div>

            {/* Código de Boleto */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Código de Boleto:</p>
              <p className="text-2xl font-bold text-blue-600">{codigoBoleto}</p>
            </div>

            {/* QR Code */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
              <p className="text-center text-sm text-gray-600 mb-4">Código QR del Boleto:</p>
              <div className="flex justify-center">
                <img 
                  src={boletoQR} 
                  alt="QR del Boleto" 
                  className="w-64 h-64 border-4 border-gray-300 rounded-lg"
                />
              </div>
              <p className="text-center text-xs text-gray-500 mt-4">
                Presenta este código QR al abordar el bus
              </p>
            </div>

            {/* Detalles del Viaje */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <h3 className="font-bold text-gray-800 mb-4">Detalles del Viaje:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ruta:</span>
                  <span className="font-semibold">{rutaSeleccionada?.origen} → {rutaSeleccionada?.destino}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hora:</span>
                  <span className="font-semibold">{rutaSeleccionada?.horaSalida}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Asientos:</span>
                  <span className="font-semibold">{asientosSeleccionados.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Pagado:</span>
                  <span className="font-bold text-lg text-green-600">${calcularPrecioTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = boletoQR;
                  link.download = `boleto-${codigoBoleto}.png`;
                  link.click();
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Descargar QR
              </button>
              <button
                onClick={() => router.push('/dashboard/Cliente/boletos')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Ver Mis Boletos
              </button>
              <button
                onClick={() => router.push('/dashboard/Cliente')}
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Buscar Otro Viaje
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
