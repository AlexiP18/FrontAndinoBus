'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { viajesApi, getToken, ViajeDetalle, ventasPresencialesApi } from '@/lib/api';

interface Asiento {
  id: number;
  numeroAsiento: string;
  ocupado: boolean;
  reservaId?: number;
}

interface FormularioPasajero {
  nombres: string;
  apellidos: string;
  cedula: string;
  telefono: string;
  email: string;
}

export default function SeleccionarAsientosPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const viajeId = params.viajeId as string;

  const [viaje, setViaje] = useState<ViajeDetalle | null>(null);
  const [asientos, setAsientos] = useState<Asiento[]>([]);
  const [asientosSeleccionados, setAsientosSeleccionados] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  
  const [formulario, setFormulario] = useState<FormularioPasajero>({
    nombres: '',
    apellidos: '',
    cedula: '',
    telefono: '',
    email: ''
  });

  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TARJETA'>('EFECTIVO');

  useEffect(() => {
    loadDatosViaje();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viajeId]);

  const loadDatosViaje = async () => {
    if (!user?.cooperativaId) {
      setError('No se encontró cooperativa');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        setLoading(false);
        return;
      }

      // Llamar al endpoint real
      const viajeData = await viajesApi.getById(
        user.cooperativaId,
        parseInt(viajeId),
        token
      );

      // Convertir asientos del backend al formato del componente
      const asientosData: Asiento[] = viajeData.asientos.map(a => ({
        id: a.id,
        numeroAsiento: a.numeroAsiento,
        ocupado: a.estado !== 'DISPONIBLE',
        reservaId: a.reservaId
      }));

      setViaje(viajeData);
      setAsientos(asientosData);
    } catch (err) {
      console.error('Error al cargar datos del viaje:', err);
      setError('Error al cargar la información del viaje');
    } finally {
      setLoading(false);
    }
  };

  const toggleAsiento = (numeroAsiento: string) => {
    const asiento = asientos.find(a => a.numeroAsiento === numeroAsiento);
    if (!asiento || asiento.ocupado) return;

    setAsientosSeleccionados(prev => {
      if (prev.includes(numeroAsiento)) {
        return prev.filter(n => n !== numeroAsiento);
      } else {
        return [...prev, numeroAsiento];
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormulario(prev => ({ ...prev, [name]: value }));
  };

  const calcularTotal = () => {
    if (!viaje) return 0;
    return asientosSeleccionados.length * viaje.precioBase;
  };

  const validarFormulario = (): boolean => {
    if (asientosSeleccionados.length === 0) {
      setError('Debe seleccionar al menos un asiento');
      return false;
    }

    if (!formulario.nombres.trim() || !formulario.apellidos.trim()) {
      setError('Nombres y apellidos son obligatorios');
      return false;
    }

    if (!formulario.cedula.trim()) {
      setError('La cédula es obligatoria');
      return false;
    }

    if (formulario.cedula.length !== 10) {
      setError('La cédula debe tener 10 dígitos');
      return false;
    }

    return true;
  };

  const handleConfirmarVenta = async () => {
    if (!validarFormulario() || !viaje) return;

    try {
      setProcesando(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        setProcesando(false);
        return;
      }

      // Obtener IDs de los asientos seleccionados
      const asientoIds = asientosSeleccionados
        .map(numeroAsiento => {
          const asiento = asientos.find(a => a.numeroAsiento === numeroAsiento);
          return asiento?.id;
        })
        .filter((id): id is number => id !== undefined);

      if (asientoIds.length === 0) {
        setError('No se pudieron identificar los asientos seleccionados');
        setProcesando(false);
        return;
      }

      // Llamar al endpoint de venta presencial
      const resultado = await ventasPresencialesApi.create({
        viajeId: parseInt(viajeId),
        asientoIds,
        clienteNombres: formulario.nombres,
        clienteApellidos: formulario.apellidos,
        clienteCedula: formulario.cedula,
        telefono: formulario.telefono || undefined,
        email: formulario.email || undefined,
        metodoPago,
        totalPagado: calcularTotal()
      }, token);

      alert(`¡Venta realizada exitosamente!\n\nReserva ID: ${resultado.reservaId}\nAsientos: ${resultado.asientos.join(', ')}\nTotal: $${resultado.totalPagado.toFixed(2)}`);
      router.push('/dashboard/Cooperativa/Oficinista/vender-boleto');
    } catch (err) {
      console.error('Error al confirmar venta:', err);
      setError('Error al procesar la venta. Por favor intente nuevamente.');
    } finally {
      setProcesando(false);
    }
  };

  const renderAsientos = () => {
    if (!viaje) return null;

    const filas = Math.ceil(viaje.capacidadTotal / 4);
    const asientosPorFila = 4;

    return (
      <div className="bg-gray-100 p-6 rounded-lg">
        {/* Indicador de conductor */}
        <div className="flex justify-end mb-4">
          <div className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-semibold">
            🚗 Conductor
          </div>
        </div>

        {/* Mapa de asientos */}
        <div className="space-y-3">
          {Array.from({ length: filas }).map((_, filaIndex) => {
            const inicioFila = filaIndex * asientosPorFila;
            const asientosFila = asientos.slice(inicioFila, inicioFila + asientosPorFila);

            return (
              <div key={filaIndex} className="flex justify-center gap-2">
                {/* Lado izquierdo (2 asientos) */}
                <div className="flex gap-2">
                  {asientosFila.slice(0, 2).map(asiento => (
                    <button
                      key={asiento.id}
                      onClick={() => toggleAsiento(asiento.numeroAsiento)}
                      disabled={asiento.ocupado}
                      className={`
                        w-12 h-12 rounded-md flex items-center justify-center text-sm font-semibold
                        transition-all duration-200 transform hover:scale-105
                        ${asiento.ocupado 
                          ? 'bg-red-400 text-white cursor-not-allowed opacity-50' 
                          : asientosSeleccionados.includes(asiento.numeroAsiento)
                          ? 'bg-green-500 text-white shadow-lg scale-105'
                          : 'bg-white text-gray-700 hover:bg-blue-100 border-2 border-gray-300'
                        }
                      `}
                    >
                      {asiento.numeroAsiento}
                    </button>
                  ))}
                </div>

                {/* Pasillo */}
                <div className="w-8"></div>

                {/* Lado derecho (2 asientos) */}
                <div className="flex gap-2">
                  {asientosFila.slice(2, 4).map(asiento => (
                    <button
                      key={asiento.id}
                      onClick={() => toggleAsiento(asiento.numeroAsiento)}
                      disabled={asiento.ocupado}
                      className={`
                        w-12 h-12 rounded-md flex items-center justify-center text-sm font-semibold
                        transition-all duration-200 transform hover:scale-105
                        ${asiento.ocupado 
                          ? 'bg-red-400 text-white cursor-not-allowed opacity-50' 
                          : asientosSeleccionados.includes(asiento.numeroAsiento)
                          ? 'bg-green-500 text-white shadow-lg scale-105'
                          : 'bg-white text-gray-700 hover:bg-blue-100 border-2 border-gray-300'
                        }
                      `}
                    >
                      {asiento.numeroAsiento}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-gray-300">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white border-2 border-gray-300 rounded"></div>
            <span className="text-sm text-gray-700">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-700">Seleccionado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-400 rounded opacity-50"></div>
            <span className="text-sm text-gray-700">Ocupado</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando información del viaje...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!viaje) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-600">No se encontró el viaje</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-purple-600 hover:text-purple-800 font-medium mb-4 flex items-center gap-2"
          >
            ← Volver a lista de viajes
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Vender Boleto</h1>
          <p className="text-gray-600 mt-2">
            Seleccione los asientos y complete los datos del pasajero
          </p>
        </div>

        {/* Información del viaje */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Información del Viaje</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Ruta</p>
              <p className="font-semibold text-gray-800">
                {viaje.origen} → {viaje.destino}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fecha</p>
              <p className="font-semibold text-gray-800">{viaje.fecha}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Hora de Salida</p>
              <p className="font-semibold text-gray-800">{viaje.horaSalida}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bus</p>
              <p className="font-semibold text-gray-800">{viaje.busPlaca}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda: Mapa de asientos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Seleccione los Asientos
              </h2>
              {renderAsientos()}
            </div>
          </div>

          {/* Columna derecha: Formulario y resumen */}
          <div className="space-y-6">
            {/* Resumen de selección */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumen</h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Asientos seleccionados</p>
                  <p className="font-semibold text-gray-800">
                    {asientosSeleccionados.length > 0 
                      ? asientosSeleccionados.sort().join(', ')
                      : 'Ninguno'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Precio por asiento</p>
                  <p className="font-semibold text-gray-800">${viaje.precioBase.toFixed(2)}</p>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">Total a pagar</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${calcularTotal().toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Formulario de pasajero */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Datos del Pasajero
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    name="nombres"
                    value={formulario.nombres}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    name="apellidos"
                    value={formulario.apellidos}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cédula *
                  </label>
                  <input
                    type="text"
                    name="cedula"
                    value={formulario.cedula}
                    onChange={handleInputChange}
                    maxLength={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formulario.telefono}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formulario.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pago *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="metodoPago"
                        value="EFECTIVO"
                        checked={metodoPago === 'EFECTIVO'}
                        onChange={() => setMetodoPago('EFECTIVO')}
                        className="mr-2"
                      />
                      💵 Efectivo
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="metodoPago"
                        value="TARJETA"
                        checked={metodoPago === 'TARJETA'}
                        onChange={() => setMetodoPago('TARJETA')}
                        className="mr-2"
                      />
                      💳 Tarjeta
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleConfirmarVenta}
                  disabled={procesando || asientosSeleccionados.length === 0}
                  className={`
                    w-full py-3 rounded-lg font-semibold text-white transition-colors
                    ${procesando || asientosSeleccionados.length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700'
                    }
                  `}
                >
                  {procesando ? 'Procesando...' : 'Confirmar Venta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
