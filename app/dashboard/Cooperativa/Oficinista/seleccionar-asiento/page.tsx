'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { useAuth } from '@/app/context/AuthContext';
import SeleccionAsientos from '@/app/components/SeleccionAsientos';
import { 
  ventasPresencialesApi,
  boletosApi,
  getToken,
  cooperativaConfigApi,
  CooperativaConfigResponse
} from '@/lib/api';
import { 
  ArrowLeft, 
  User, 
  DollarSign, 
  Calendar,
  Clock,
  MapPin,
  Bus,
  Ticket,
  ClipboardList,
  Armchair,
  AlertTriangle,
  CheckCircle,
  Download,
  QrCode,
  Printer
} from 'lucide-react';

interface DatosVenta {
  frecuenciaId: number;
  fecha: string;
  busId: number;
  busPlaca: string;
  rutaNombre: string;
  origen: string;
  destino: string;
  horaSalida: string;
  precioBase: number;
  asientosDisponibles: number;
}

interface DatosCliente {
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
}

export default function SeleccionarAsientoPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [datosVenta, setDatosVenta] = useState<DatosVenta | null>(null);
  const [asientosSeleccionados, setAsientosSeleccionados] = useState<string[]>([]);
  const [datosCliente, setDatosCliente] = useState<DatosCliente>({
    cedula: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    email: ''
  });
  const [metodoPago] = useState<'EFECTIVO'>('EFECTIVO');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<CooperativaConfigResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paso, setPaso] = useState<1 | 2 | 3 | 4>(1); // 1: Asientos, 2: Datos, 3: Confirmar, 4: Boleto
  const [boletoQR, setBoletoQR] = useState<string | null>(null);
  const [codigoBoleto, setCodigoBoleto] = useState<string | null>(null);
  const [reservaId, setReservaId] = useState<number | null>(null);

  useEffect(() => {
    // Recuperar datos de sessionStorage
    const datosGuardados = sessionStorage.getItem('ventaPresencial');
    if (datosGuardados) {
      setDatosVenta(JSON.parse(datosGuardados));
    } else {
      // Si no hay datos, volver a la página anterior
      router.push('/dashboard/Cooperativa/Oficinista/vender-boleto');
    }
  }, [router]);

  // Cargar configuración de cooperativa
  useEffect(() => {
    const loadConfig = async () => {
      if (!user?.cooperativaId) return;
      try {
        const token = getToken();
        if (token) {
          const configuracion = await cooperativaConfigApi.getConfiguracion(user.cooperativaId, token);
          setConfig(configuracion);
        }
      } catch (err) {
        console.error('Error al cargar configuración:', err);
      }
    };
    loadConfig();
  }, [user?.cooperativaId]);

  // Colores de la cooperativa
  const primaryColor = config?.colorPrimario || '#7c3aed';
  const secondaryColor = config?.colorSecundario || '#a855f7';

  const handleAsientosChange = (asientos: string[]) => {
    setAsientosSeleccionados(asientos);
  };

  const calcularTotal = () => {
    if (!datosVenta) return 0;
    return datosVenta.precioBase * asientosSeleccionados.length;
  };

  const handleContinuarPaso2 = () => {
    if (asientosSeleccionados.length === 0) {
      setError('Debes seleccionar al menos un asiento');
      return;
    }
    setError(null);
    setPaso(2);
  };

  const handleContinuarPaso3 = () => {
    // Validar datos del cliente
    if (!datosCliente.cedula || !datosCliente.nombres || !datosCliente.apellidos) {
      setError('Debes completar los datos obligatorios del cliente');
      return;
    }

    // Validar cédula ecuatoriana (10 dígitos)
    if (!/^\d{10}$/.test(datosCliente.cedula)) {
      setError('La cédula debe tener 10 dígitos');
      return;
    }

    setError(null);
    setPaso(3);
  };

  const handleConfirmarVenta = async () => {
    if (!datosVenta || !user?.cooperativaId) return;

    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      // Crear la venta presencial
      const ventaData = {
        cooperativaId: user.cooperativaId,
        frecuenciaId: datosVenta.frecuenciaId,
        fecha: datosVenta.fecha,
        asientos: asientosSeleccionados,
        clienteCedula: datosCliente.cedula,
        clienteNombres: datosCliente.nombres,
        clienteApellidos: datosCliente.apellidos,
        clienteTelefono: datosCliente.telefono || undefined,
        clienteEmail: datosCliente.email || undefined,
        metodoPago: metodoPago,
        precioTotal: calcularTotal()
      };

      const ventaResponse = await ventasPresencialesApi.create(ventaData, token);
      setReservaId(ventaResponse.reservaId);

      // Generar boleto con QR
      const boleto = await boletosApi.generar(ventaResponse.reservaId, token);
      setBoletoQR(boleto.codigoQR);
      setCodigoBoleto(boleto.codigoBoleto);

      // Limpiar sessionStorage
      sessionStorage.removeItem('ventaPresencial');

      // Ir al paso 4 (mostrar boleto)
      setPaso(4);
    } catch (err) {
      console.error('Error al realizar venta:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar la venta');
    } finally {
      setLoading(false);
    }
  };

  if (!datosVenta) {
    return (
      <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['OFICINISTA']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
              style={{ borderColor: primaryColor }}
            ></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['OFICINISTA']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            {paso < 4 ? (
              <button
                onClick={() => {
                  if (paso > 1) {
                    setPaso((paso - 1) as 1 | 2 | 3);
                  } else {
                    router.push('/dashboard/Cooperativa/Oficinista/vender-boleto');
                  }
                }}
                className="mb-4 flex items-center gap-2 hover:opacity-80"
                style={{ color: primaryColor }}
              >
                <ArrowLeft className="w-5 h-5" />
                Volver
              </button>
            ) : (
              <button
                onClick={() => router.push('/dashboard/Cooperativa/Oficinista')}
                className="mb-4 flex items-center gap-2 hover:opacity-80"
                style={{ color: primaryColor }}
              >
                <ArrowLeft className="w-5 h-5" />
                Volver al Dashboard
              </button>
            )}
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Ticket className="w-7 h-7" style={{ color: primaryColor }} />
                  Venta de Boleto - Paso {paso} de 4
                </h1>
                <p className="text-sm text-gray-600 mt-1">{user?.cooperativaNombre}</p>
              </div>
            </div>

            {/* Indicador de pasos */}
            <div className="flex items-center gap-2 mt-4">
              <div 
                className="flex-1 h-2 rounded" 
                style={{ backgroundColor: paso >= 1 ? primaryColor : '#e5e7eb' }}
              ></div>
              <div 
                className="flex-1 h-2 rounded" 
                style={{ backgroundColor: paso >= 2 ? primaryColor : '#e5e7eb' }}
              ></div>
              <div 
                className="flex-1 h-2 rounded" 
                style={{ backgroundColor: paso >= 3 ? primaryColor : '#e5e7eb' }}
              ></div>
              <div 
                className="flex-1 h-2 rounded" 
                style={{ backgroundColor: paso >= 4 ? '#22c55e' : '#e5e7eb' }}
              ></div>
            </div>
          </div>

          {/* Información del viaje */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5" style={{ color: primaryColor }} />
              Información del Viaje
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
                <div>
                  <p className="text-xs font-bold text-gray-700">Ruta</p>
                  <p className="font-medium text-gray-900">{datosVenta.rutaNombre}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
                <div>
                  <p className="text-xs font-bold text-gray-700">Fecha</p>
                  <p className="font-medium text-gray-900">{datosVenta.fecha}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" style={{ color: primaryColor }} />
                <div>
                  <p className="text-xs font-bold text-gray-700">Hora</p>
                  <p className="font-medium text-gray-900">{datosVenta.horaSalida}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Bus className="w-5 h-5" style={{ color: primaryColor }} />
                <div>
                  <p className="text-xs font-bold text-gray-700">Bus</p>
                  <p className="font-medium text-gray-900">{datosVenta.busPlaca}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className={`grid grid-cols-1 ${paso < 4 ? 'lg:grid-cols-3' : ''} gap-6`}>
            {/* Contenido principal según el paso */}
            <div className={paso < 4 ? 'lg:col-span-2' : 'max-w-3xl mx-auto w-full'}>
              {/* Paso 1: Selección de asientos */}
              {paso === 1 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Armchair className="w-5 h-5" style={{ color: primaryColor }} />
                    Selecciona los Asientos
                  </h2>
                  <SeleccionAsientos
                    frecuenciaId={datosVenta.frecuenciaId}
                    fecha={datosVenta.fecha}
                    onSeleccionChange={handleAsientosChange}
                    maxAsientos={10}
                  />
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleContinuarPaso2}
                      disabled={asientosSeleccionados.length === 0}
                      className="text-white px-6 py-3 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold hover:opacity-90"
                      style={{ backgroundColor: asientosSeleccionados.length === 0 ? undefined : primaryColor }}
                    >
                      Continuar →
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 2: Datos del cliente */}
              {paso === 2 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Datos del Cliente
                  </h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cédula <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={datosCliente.cedula}
                          onChange={(e) => setDatosCliente({ ...datosCliente, cedula: e.target.value })}
                          placeholder="1234567890"
                          maxLength={10}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          value={datosCliente.telefono}
                          onChange={(e) => setDatosCliente({ ...datosCliente, telefono: e.target.value })}
                          placeholder="0987654321"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombres <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={datosCliente.nombres}
                          onChange={(e) => setDatosCliente({ ...datosCliente, nombres: e.target.value })}
                          placeholder="Juan Carlos"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Apellidos <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={datosCliente.apellidos}
                          onChange={(e) => setDatosCliente({ ...datosCliente, apellidos: e.target.value })}
                          placeholder="Pérez García"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={datosCliente.email}
                        onChange={(e) => setDatosCliente({ ...datosCliente, email: e.target.value })}
                        placeholder="cliente@ejemplo.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Método de Pago
                      </label>
                      <div 
                        className="flex items-center gap-3 px-4 py-3 border-2 rounded-lg"
                        style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}10` }}
                      >
                        <DollarSign className="w-5 h-5" style={{ color: primaryColor }} />
                        <span className="font-medium" style={{ color: primaryColor }}>Efectivo (Pago en ventanilla)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={() => setPaso(1)}
                      className="font-medium hover:opacity-80"
                      style={{ color: primaryColor }}
                    >
                      ← Volver
                    </button>
                    <button
                      onClick={handleContinuarPaso3}
                      className="text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Continuar →
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 3: Confirmación */}
              {paso === 3 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Confirmar Venta
                  </h2>
                  
                  <div className="space-y-6">
                    {/* Resumen del cliente */}
                    <div 
                      className="rounded-lg p-4"
                      style={{ backgroundColor: `${primaryColor}10`, border: `1px solid ${primaryColor}30` }}
                    >
                      <h3 className="font-bold mb-3 text-base flex items-center gap-2" style={{ color: primaryColor }}>
                        <User className="w-4 h-4" />
                        Cliente
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-bold text-gray-700">Cédula:</span>
                          <span className="ml-2 font-medium text-gray-900">{datosCliente.cedula}</span>
                        </div>
                        <div>
                          <span className="font-bold text-gray-700">Teléfono:</span>
                          <span className="ml-2 font-medium text-gray-900">{datosCliente.telefono || 'N/A'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="font-bold text-gray-700">Nombre completo:</span>
                          <span className="ml-2 font-medium text-gray-900">{datosCliente.nombres} {datosCliente.apellidos}</span>
                        </div>
                        {datosCliente.email && (
                          <div className="col-span-2">
                            <span className="font-bold text-gray-700">Email:</span>
                            <span className="ml-2 font-medium text-gray-900">{datosCliente.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Resumen del viaje */}
                    <div 
                      className="rounded-lg p-4"
                      style={{ backgroundColor: `${primaryColor}10`, border: `1px solid ${primaryColor}30` }}
                    >
                      <h3 className="font-bold mb-3 text-base flex items-center gap-2" style={{ color: primaryColor }}>
                        <Bus className="w-4 h-4" />
                        Detalles del Viaje
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-bold text-gray-700">Ruta:</span>
                          <span className="font-medium text-gray-900">{datosVenta.origen} → {datosVenta.destino}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold text-gray-700">Fecha:</span>
                          <span className="font-medium text-gray-900">{datosVenta.fecha}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold text-gray-700">Hora de salida:</span>
                          <span className="font-medium text-gray-900">{datosVenta.horaSalida}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold text-gray-700">Bus:</span>
                          <span className="font-medium text-gray-900">{datosVenta.busPlaca}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold text-gray-700">Asientos:</span>
                          <span className="font-medium text-gray-900">{asientosSeleccionados.join(', ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold text-gray-700">Método de pago:</span>
                          <span className="font-medium text-gray-900">Efectivo</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={() => setPaso(2)}
                      className="font-medium hover:opacity-80"
                      style={{ color: primaryColor }}
                      disabled={loading}
                    >
                      ← Volver
                    </button>
                    <button
                      onClick={handleConfirmarVenta}
                      disabled={loading}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Ticket className="w-5 h-5" />
                          Confirmar Venta
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 4: Boleto Generado */}
              {paso === 4 && boletoQR && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">¡Venta Exitosa!</h2>
                    <p className="text-gray-600 mt-2">El boleto ha sido generado correctamente</p>
                  </div>

                  {/* Código del boleto */}
                  <div 
                    className="rounded-lg p-4 mb-6"
                    style={{ backgroundColor: `${primaryColor}10`, border: `1px solid ${primaryColor}30` }}
                  >
                    <p className="text-sm font-bold mb-1" style={{ color: primaryColor }}>Código del Boleto:</p>
                    <p className="text-2xl font-mono font-bold text-gray-900">{codigoBoleto}</p>
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-center mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-md border">
                      <img 
                        src={boletoQR} 
                        alt="Código QR del boleto" 
                        className="w-64 h-64"
                      />
                    </div>
                  </div>

                  {/* Información del boleto */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" />
                      Detalles del Boleto
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-bold text-gray-700">Cliente:</span>
                        <span className="ml-2 text-gray-900">{datosCliente.nombres} {datosCliente.apellidos}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-700">Cédula:</span>
                        <span className="ml-2 text-gray-900">{datosCliente.cedula}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-700">Ruta:</span>
                        <span className="ml-2 text-gray-900">{datosVenta.origen} → {datosVenta.destino}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-700">Fecha:</span>
                        <span className="ml-2 text-gray-900">{datosVenta.fecha}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-700">Hora:</span>
                        <span className="ml-2 text-gray-900">{datosVenta.horaSalida}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-700">Bus:</span>
                        <span className="ml-2 text-gray-900">{datosVenta.busPlaca}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-700">Asientos:</span>
                        <span className="ml-2 text-gray-900">{asientosSeleccionados.join(', ')}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-700">Total:</span>
                        <span className="ml-2 text-gray-900 font-bold">${calcularTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = boletoQR;
                        link.download = `boleto-${codigoBoleto}.png`;
                        link.click();
                      }}
                      className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 font-semibold flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Descargar QR
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 font-semibold flex items-center justify-center gap-2"
                    >
                      <Printer className="w-5 h-5" />
                      Imprimir
                    </button>
                  </div>

                  {/* Botón para nueva venta */}
                  <div className="mt-6 pt-6 border-t">
                    <button
                      onClick={() => router.push('/dashboard/Cooperativa/Oficinista/vender-boleto')}
                      className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
                    >
                      <Ticket className="w-5 h-5" />
                      Realizar Nueva Venta
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Resumen lateral - Solo mostrar en pasos 1-3 */}
            {paso < 4 && (
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow p-6 sticky top-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" style={{ color: primaryColor }} />
                    Resumen
                  </h2>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Asientos seleccionados:</span>
                      <span className="font-semibold">{asientosSeleccionados.length}</span>
                    </div>
                    
                    {asientosSeleccionados.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="text-xs text-gray-500 mb-2">Asientos:</p>
                        <div className="flex flex-wrap gap-2">
                          {asientosSeleccionados.map(asiento => (
                            <span 
                              key={asiento} 
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                            >
                              {asiento}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Precio por asiento:</span>
                        <span className="font-medium text-gray-900">${datosVenta.precioBase.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold" style={{ color: primaryColor }}>
                        <span>Total a pagar:</span>
                        <span>${calcularTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {paso >= 2 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-gray-500 mb-2">Método de pago:</p>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4" style={{ color: primaryColor }} />
                        <span className="font-medium text-gray-900">Efectivo</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
