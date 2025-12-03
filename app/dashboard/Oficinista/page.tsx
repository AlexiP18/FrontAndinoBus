'use client';

import { useState } from 'react';
import { Ticket, Users, DollarSign, Search } from 'lucide-react';
import BusquedaRutas from '../../components/BusquedaRutas';
import AsientoMapa from '../../components/AsientoMapa';
import MetodoPago from '../../components/MetodoPago';
import { RutaItem, ventasApi, getToken } from '@/lib/api';
import { TIPO_PASAJERO, DESCUENTOS } from '@/lib/constants';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardNavbar from '../../components/layout/DashboardNavbar';

export default function OficinistaPage() {
  return (
    <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['OFICINISTA']}>
      <OficinistaPageContent />
    </ProtectedRoute>
  );
}

function OficinistaPageContent() {
  const [vista, setVista] = useState<'inicio' | 'venta'>('inicio');
  const [paso, setPaso] = useState(1); // 1: asientos, 2: datos, 3: pago
  const [rutaSeleccionada, setRutaSeleccionada] = useState<RutaItem | null>(null);
  const [asientosSeleccionados, setAsientosSeleccionados] = useState<string[]>([]);
  const [reservaId, setReservaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [datosPasajeros, setDatosPasajeros] = useState<Array<{
    nombre: string;
    cedula: string;
    email: string;
    tipoPasajero: string;
  }>>([]);

  const handleSelectRuta = (ruta: RutaItem) => {
    setRutaSeleccionada(ruta);
    setVista('venta');
    setPaso(1);
    setAsientosSeleccionados([]);
    setDatosPasajeros([]);
    setReservaId(null);
    setError('');
  };

  const handleAsientosChange = (asientos: string[]) => {
    setAsientosSeleccionados(asientos);
    // Inicializar datos de pasajeros
    if (asientos.length > 0) {
      setDatosPasajeros(
        asientos.map(() => ({
          nombre: '',
          cedula: '',
          email: '',
          tipoPasajero: TIPO_PASAJERO.REGULAR,
        }))
      );
    }
  };

  const handleContinuarDatos = async () => {
    if (!rutaSeleccionada) return;

    // Validar datos
    const erroresValidacion = validarDatosPasajeros();
    if (erroresValidacion.length > 0) {
      setError(erroresValidacion.join(', '));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = getToken();
      const payload = {
        frecuenciaId: rutaSeleccionada.frecuenciaId,
        asientos: asientosSeleccionados,
        pasajeros: datosPasajeros,
      };

      const response = await ventasApi.crearReserva(payload, token || undefined);
      setReservaId(response.id);
      setPaso(3);
    } catch (err: any) {
      console.error('Error creando reserva:', err);
      setError(err.message || 'Error al crear la reserva');
    } finally {
      setLoading(false);
    }
  };

  const validarDatosPasajeros = (): string[] => {
    const errores: string[] = [];

    datosPasajeros.forEach((pasajero, index) => {
      if (!pasajero.nombre.trim()) {
        errores.push(`Nombre del pasajero ${index + 1} es requerido`);
      }
      if (!pasajero.cedula.trim()) {
        errores.push(`Cédula del pasajero ${index + 1} es requerida`);
      } else if (!/^\d{10}$/.test(pasajero.cedula)) {
        errores.push(`Cédula del pasajero ${index + 1} debe tener 10 dígitos`);
      }
      if (pasajero.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pasajero.email)) {
        errores.push(`Email del pasajero ${index + 1} no es válido`);
      }
    });

    return errores;
  };

  const calcularPrecioTotal = () => {
    if (!rutaSeleccionada) return 0;

    let total = 0;
    datosPasajeros.forEach((pasajero) => {
      let precio = rutaSeleccionada.precio ?? rutaSeleccionada.precioBase ?? 0;

      // Aplicar descuentos
      if (pasajero.tipoPasajero === TIPO_PASAJERO.MENOR_EDAD) {
        precio *= (1 - DESCUENTOS.MENOR_EDAD / 100);
      } else if (pasajero.tipoPasajero === TIPO_PASAJERO.TERCERA_EDAD) {
        precio *= (1 - DESCUENTOS.TERCERA_EDAD / 100);
      } else if (pasajero.tipoPasajero === TIPO_PASAJERO.DISCAPACITADO) {
        precio *= (1 - DESCUENTOS.DISCAPACITADO / 100);
      }

      total += precio;
    });

    return total;
  };

  const handlePagoCompletado = () => {
    setVista('inicio');
    setPaso(1);
    setRutaSeleccionada(null);
    setAsientosSeleccionados([]);
    setDatosPasajeros([]);
    setReservaId(null);
    alert('¡Venta completada con éxito!');
  };

  if (vista === 'inicio') {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar title="Panel de Oficinista" />
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Ticket className="w-7 h-7 text-blue-600" />
              Venta de Boletos
            </h1>
            <p className="text-gray-600 mt-2">Venta de boletos en oficina</p>
          </div>

        {/* Cards de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Ventas Hoy</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">0</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Ticket className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pasajeros</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">0</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Recaudación</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">$0</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

          {/* Búsqueda de Rutas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Search className="w-6 h-6 text-blue-600" />
              Buscar Rutas Disponibles
            </h2>
            <BusquedaRutas onSelectRuta={handleSelectRuta} />
          </div>
        </div>
      </div>
    );
  }

  // Vista de Venta
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar title="Panel de Oficinista" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => setVista('inicio')}
            className="text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            Volver a búsqueda
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Venta de Boleto</h1>
          {rutaSeleccionada && (
            <p className="text-gray-600 mt-1">
              {rutaSeleccionada.origen} → {rutaSeleccionada.destino} | {rutaSeleccionada.cooperativa}
            </p>
          )}
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div className={`flex-1 text-center ${paso >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
              paso >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              1
            </div>
            <p className="mt-2 text-sm font-medium">Seleccionar Asientos</p>
          </div>

          <div className={`flex-1 text-center ${paso >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
              paso >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              2
            </div>
            <p className="mt-2 text-sm font-medium">Datos de Pasajeros</p>
          </div>

          <div className={`flex-1 text-center ${paso >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
              paso >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              3
            </div>
            <p className="mt-2 text-sm font-medium">Pago</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Paso 1: Selección de Asientos */}
      {paso === 1 && rutaSeleccionada && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Selecciona los asientos</h2>
          <AsientoMapa
            frecuenciaId={rutaSeleccionada.frecuenciaId}
            fecha={rutaSeleccionada.fecha}
            onAsientosChange={handleAsientosChange}
          />
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setPaso(2)}
              disabled={asientosSeleccionados.length === 0}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-400"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Paso 2: Datos de Pasajeros */}
      {paso === 2 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Datos de los pasajeros</h2>

          <div className="space-y-6">
            {datosPasajeros.map((pasajero, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Pasajero {index + 1} - Asiento {asientosSeleccionados[index]}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={pasajero.nombre}
                      onChange={(e) => {
                        const nuevos = [...datosPasajeros];
                        nuevos[index].nombre = e.target.value;
                        setDatosPasajeros(nuevos);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Juan Pérez"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cédula *
                    </label>
                    <input
                      type="text"
                      value={pasajero.cedula}
                      onChange={(e) => {
                        const nuevos = [...datosPasajeros];
                        nuevos[index].cedula = e.target.value;
                        setDatosPasajeros(nuevos);
                      }}
                      maxLength={10}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="1234567890"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={pasajero.email}
                      onChange={(e) => {
                        const nuevos = [...datosPasajeros];
                        nuevos[index].email = e.target.value;
                        setDatosPasajeros(nuevos);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Pasajero *
                    </label>
                    <select
                      value={pasajero.tipoPasajero}
                      onChange={(e) => {
                        const nuevos = [...datosPasajeros];
                        nuevos[index].tipoPasajero = e.target.value;
                        setDatosPasajeros(nuevos);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value={TIPO_PASAJERO.REGULAR}>Regular</option>
                      <option value={TIPO_PASAJERO.MENOR_EDAD}>Menor de edad (-15%)</option>
                      <option value={TIPO_PASAJERO.TERCERA_EDAD}>Tercera edad (-20%)</option>
                      <option value={TIPO_PASAJERO.DISCAPACITADO}>Discapacitado (-25%)</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen de Precio */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800">Total a Pagar:</span>
              <span className="text-2xl font-bold text-blue-600">${calcularPrecioTotal().toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setPaso(1)}
              className="text-gray-600 hover:text-gray-800 px-6 py-2 rounded-lg border border-gray-300 font-semibold"
            >
              Atrás
            </button>
            <button
              onClick={handleContinuarDatos}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-400"
            >
              {loading ? 'Procesando...' : 'Continuar al Pago'}
            </button>
          </div>
        </div>
      )}

      {/* Paso 3: Pago */}
      {paso === 3 && reservaId && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Procesar Pago</h2>
          <MetodoPago
            reservaId={reservaId}
            monto={calcularPrecioTotal()}
            onPagoCompletado={handlePagoCompletado}
          />
        </div>
      )}
      </div>
    </div>
  );
}