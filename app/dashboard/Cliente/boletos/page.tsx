'use client';

import { useState, useEffect } from 'react';
import { Ticket, Calendar, MapPin, Clock, Download, Eye, QrCode } from 'lucide-react';
import { reservasApi, boletosApi, getToken, type ReservaDetalleResponse } from '@/lib/api';
import Link from 'next/link';

interface BoletoHistorial {
  id: number;
  codigo?: string;
  viajeId: number;
  fecha?: string;
  origen?: string;
  destino?: string;
  cooperativa?: string;
  horaSalida?: string;
  asientos: string[];
  monto: number;
  estado: 'PENDIENTE' | 'PAGADO' | 'CANCELADO' | 'EXPIRADO';
  cliente: string;
  qrCode?: string;
}

export default function HistorialPage() {
  const [boletos, setBoletos] = useState<BoletoHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');

  useEffect(() => {
    cargarHistorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarHistorial = async () => {
    setLoading(true);
    setError('');

    try {
      const token = getToken();
      if (!token) {
        setError('No estás autenticado');
        return;
      }

      // Obtener email del usuario
      const userDataStr = localStorage.getItem('user');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const clienteEmail = userData?.email;

      if (!clienteEmail) {
        setError('No se pudo obtener el email del usuario');
        return;
      }

      // Llamar al endpoint real
      const reservas: ReservaDetalleResponse[] = await reservasApi.misReservas(token);
      
      // Cargar QR para las reservas pagadas
      const boletosConQR = await Promise.all(
        reservas.map(async (reserva) => {
          let qrCode = undefined;
          if (reserva.estado === 'PAGADO') {
            try {
              const boleto = await boletosApi.generar(reserva.id, token);
              qrCode = boleto.codigoQR;
            } catch (err) {
              console.error(`Error cargando QR para reserva ${reserva.id}:`, err);
            }
          }
          
          return {
            id: reserva.id,
            viajeId: reserva.viajeId,
            asientos: reserva.asientos,
            monto: reserva.monto,
            estado: reserva.estado as 'PENDIENTE' | 'PAGADO' | 'CANCELADO' | 'EXPIRADO',
            cliente: reserva.cliente,
            qrCode,
          } as BoletoHistorial;
        })
      );
      
      setBoletos(boletosConQR);
    } catch (err) {
      console.error('Error cargando historial:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  const boletosFiltrados = filtroEstado === 'TODOS' 
    ? boletos 
    : boletos.filter(b => b.estado === filtroEstado);

  const getEstadoBadge = (estado: string) => {
    const estilos = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      PAGADO: 'bg-green-100 text-green-800',
      CANCELADO: 'bg-red-100 text-red-800',
      EXPIRADO: 'bg-gray-100 text-gray-800',
    };
    return estilos[estado as keyof typeof estilos] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Ticket className="w-7 h-7 text-blue-600" />
          Mis Boletos
        </h1>
        <p className="text-gray-600 mt-2">Historial de compras y reservas</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {['TODOS', 'PENDIENTE', 'PAGADO', 'CANCELADO', 'EXPIRADO'].map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filtroEstado === estado
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {estado}
            </button>
          ))}
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Contenido */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : boletosFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium mb-2">
            {filtroEstado === 'TODOS' ? 'No tienes boletos' : `No tienes boletos ${filtroEstado.toLowerCase()}`}
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Comienza buscando una ruta y reserva tu viaje
          </p>
          <Link
            href="/dashboard/Cliente"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            <MapPin className="w-5 h-5" />
            Buscar Rutas
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {boletosFiltrados.map((boleto) => (
            <div
              key={boleto.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 hover:border-blue-300 transition overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">
                        Reserva #{boleto.id}
                      </h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getEstadoBadge(boleto.estado)}`}>
                        {boleto.estado}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Viaje ID: {boleto.viajeId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">${boleto.monto.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Cliente: {boleto.cliente}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-t border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Asientos</p>
                      <p className="text-sm font-medium text-gray-800">{boleto.asientos.join(', ')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Estado</p>
                      <p className="text-sm font-medium text-gray-800">{boleto.estado}</p>
                    </div>
                  </div>
                </div>

                {/* Mostrar QR si está pagado */}
                {boleto.estado === 'PAGADO' && boleto.qrCode && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-4">
                      <img 
                        src={boleto.qrCode} 
                        alt="Código QR" 
                        className="w-24 h-24 border-2 border-blue-300 rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900 mb-1">
                          ✓ Boleto Confirmado
                        </p>
                        <p className="text-xs text-blue-700">
                          Presenta este código QR al abordar el bus
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  {boleto.estado === 'PAGADO' && boleto.qrCode && (
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = boleto.qrCode!;
                        link.download = `boleto-${boleto.id}.png`;
                        link.click();
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                      <Download className="w-4 h-4" />
                      Descargar QR
                    </button>
                  )}
                  {boleto.estado === 'PENDIENTE' && (
                    <Link
                      href={`/dashboard/Cliente/compra?reservaId=${boleto.id}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition"
                    >
                      <QrCode className="w-4 h-4" />
                      Completar Pago
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
