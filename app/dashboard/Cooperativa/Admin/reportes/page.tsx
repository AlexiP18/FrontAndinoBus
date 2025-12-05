'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useCooperativaConfig } from '@/app/context/CooperativaConfigContext';
import {
  cooperativaApi,
  ResumenCooperativaResponse,
  ReporteVentasResponse,
  ReporteViajesResponse,
  ReporteOcupacionResponse,
  ReporteRutasResponse
} from '@/lib/api';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Users,
  Bus,
  MapPin,
  FileText,
  Filter,
  ChevronDown,
  Activity,
  Clock,
  Ticket,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

type ReportType = 'ventas' | 'viajes' | 'ocupacion' | 'rutas';
type TimePeriod = 'hoy' | 'semana' | 'mes' | 'año' | 'personalizado';

export default function ReportesPage() {
  const { user, token } = useAuth();
  const { styles } = useCooperativaConfig();
  const [selectedReport, setSelectedReport] = useState<ReportType>('ventas');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('mes');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para los datos de reportes
  const [resumen, setResumen] = useState<ResumenCooperativaResponse | null>(null);
  const [reporteVentas, setReporteVentas] = useState<ReporteVentasResponse | null>(null);
  const [reporteViajes, setReporteViajes] = useState<ReporteViajesResponse | null>(null);
  const [reporteOcupacion, setReporteOcupacion] = useState<ReporteOcupacionResponse | null>(null);
  const [reporteRutas, setReporteRutas] = useState<ReporteRutasResponse | null>(null);

  const reportTypes = [
    { id: 'ventas', label: 'Ventas', icon: DollarSign, color: 'green' },
    { id: 'viajes', label: 'Viajes', icon: Bus, color: 'blue' },
    { id: 'ocupacion', label: 'Ocupación', icon: Activity, color: 'purple' },
    { id: 'rutas', label: 'Rutas', icon: MapPin, color: 'orange' }
  ];

  const timePeriods = [
    { id: 'hoy', label: 'Hoy' },
    { id: 'semana', label: 'Esta Semana' },
    { id: 'mes', label: 'Este Mes' },
    { id: 'año', label: 'Este Año' },
    { id: 'personalizado', label: 'Personalizado' }
  ];

  // Calcular fechas según el periodo seleccionado
  const calcularFechas = useCallback((periodo: TimePeriod): { inicio: string; fin: string } => {
    const hoy = new Date();
    let inicio = new Date();
    const fin = new Date();

    switch (periodo) {
      case 'hoy':
        inicio = new Date(hoy);
        break;
      case 'semana':
        inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() - hoy.getDay());
        break;
      case 'mes':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
      case 'año':
        inicio = new Date(hoy.getFullYear(), 0, 1);
        break;
      case 'personalizado':
        if (dateFrom && dateTo) {
          return { inicio: dateFrom, fin: dateTo };
        }
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
    }

    return {
      inicio: inicio.toISOString().split('T')[0],
      fin: fin.toISOString().split('T')[0]
    };
  }, [dateFrom, dateTo]);

  // Cargar datos del reporte
  const cargarReporte = useCallback(async () => {
    if (!user?.cooperativaId || !token) return;

    setLoading(true);
    setError(null);

    try {
      const { inicio, fin } = calcularFechas(timePeriod);
      const cooperativaId = user.cooperativaId;

      // Cargar resumen siempre
      const resumenData = await cooperativaApi.getResumenReportes(cooperativaId, inicio, fin, token);
      setResumen(resumenData);

      // Cargar reporte específico según selección
      switch (selectedReport) {
        case 'ventas':
          const ventasData = await cooperativaApi.getReporteVentas(cooperativaId, inicio, fin, token);
          setReporteVentas(ventasData);
          break;
        case 'viajes':
          const viajesData = await cooperativaApi.getReporteViajes(cooperativaId, inicio, fin, token);
          setReporteViajes(viajesData);
          break;
        case 'ocupacion':
          const ocupacionData = await cooperativaApi.getReporteOcupacion(cooperativaId, inicio, fin, token);
          setReporteOcupacion(ocupacionData);
          break;
        case 'rutas':
          const rutasData = await cooperativaApi.getReporteRutas(cooperativaId, inicio, fin, token);
          setReporteRutas(rutasData);
          break;
      }
    } catch (err) {
      console.error('Error cargando reporte:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  }, [user?.cooperativaId, token, timePeriod, selectedReport, calcularFechas]);

  useEffect(() => {
    cargarReporte();
  }, [cargarReporte]);

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      const { inicio, fin } = calcularFechas(timePeriod);
      let csvContent = '';
      let filename = '';

      switch (selectedReport) {
        case 'ventas':
          if (reporteVentas) {
            csvContent = 'Fecha,Día,Monto,Transacciones\n';
            reporteVentas.ventasPorDia.forEach(dia => {
              csvContent += `${dia.fecha},${dia.diaSemana},${dia.monto},${dia.transacciones}\n`;
            });
            filename = `reporte_ventas_${inicio}_${fin}.csv`;
          }
          break;
        case 'viajes':
          if (reporteViajes) {
            csvContent = 'Fecha,Día,Total,Completados,Cancelados\n';
            reporteViajes.viajesPorDia.forEach(dia => {
              csvContent += `${dia.fecha},${dia.diaSemana},${dia.total},${dia.completados},${dia.cancelados}\n`;
            });
            filename = `reporte_viajes_${inicio}_${fin}.csv`;
          }
          break;
        case 'ocupacion':
          if (reporteOcupacion) {
            csvContent = 'Fecha,Día,Porcentaje,Asientos Vendidos,Asientos Totales\n';
            reporteOcupacion.ocupacionPorDia.forEach(dia => {
              csvContent += `${dia.fecha},${dia.diaSemana},${dia.porcentaje}%,${dia.asientosVendidos},${dia.asientosTotales}\n`;
            });
            filename = `reporte_ocupacion_${inicio}_${fin}.csv`;
          }
          break;
        case 'rutas':
          if (reporteRutas) {
            csvContent = 'Ruta,Frecuencias,Viajes,Ingresos,Ocupación\n';
            reporteRutas.rutas.forEach(ruta => {
              csvContent += `${ruta.terminalOrigen} - ${ruta.terminalDestino},${ruta.frecuenciasActivas},${ruta.viajesRealizados},$${ruta.ingresosTotales.toFixed(2)},${ruta.ocupacionPromedio.toFixed(1)}%\n`;
            });
            filename = `reporte_rutas_${inicio}_${fin}.csv`;
          }
          break;
      }

      if (csvContent && filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
      }
    } catch (err) {
      console.error('Error descargando reporte:', err);
    } finally {
      setDownloading(false);
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      green: 'bg-green-100 text-green-800 border-green-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[color] || colors.green;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(value);
  };

  if (loading && !resumen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="shadow-lg coop-bg-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Reportes y Estadísticas</h1>
              <p className="text-white/80 text-sm mt-1">
                Análisis detallado del rendimiento de {user?.cooperativaNombre || 'la cooperativa'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
            <button onClick={cargarReporte} className="ml-auto text-red-600 hover:text-red-800">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros y Controles */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Tipo de Reporte</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {reportTypes.map((type) => {
                  const Icon = type.icon;
                  const isActive = selectedReport === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedReport(type.id as ReportType)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        isActive
                          ? `${getColorClasses(type.color)} border-current font-semibold shadow-md`
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-xs">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Periodo</label>
              <div className="flex flex-wrap gap-2">
                {timePeriods.map((period) => (
                  <button
                    key={period.id}
                    onClick={() => setTimePeriod(period.id as TimePeriod)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      timePeriod === period.id
                        ? 'text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={timePeriod === period.id ? { backgroundColor: styles.primary } : undefined}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <Filter className="w-4 h-4" />
                Filtros
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={cargarReporte}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleDownloadReport}
                disabled={downloading || loading}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50 shadow-md coop-btn-primary"
              >
                {downloading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Download className="w-4 h-4" />
                )}
                CSV
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Desde</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setTimePeriod('personalizado'); }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Hasta</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setTimePeriod('personalizado'); }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tarjetas de Resumen */}
        {resumen && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold text-green-600">
                  <ArrowUpRight className="w-4 h-4" />
                  {resumen.ventasCambio?.toFixed(1) || 0}%
                </span>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Ventas Totales</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(resumen.ventasTotales || 0)}</p>
              <p className="text-xs text-gray-500 mt-2">{resumen.totalTransacciones || 0} transacciones</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Bus className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Total Viajes</h3>
              <p className="text-2xl font-bold text-gray-900">{resumen.totalViajes || 0}</p>
              <p className="text-xs text-gray-500 mt-2">{resumen.viajesCompletados || 0} completados</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Ocupación Promedio</h3>
              <p className="text-2xl font-bold text-gray-900">{resumen.ocupacionPromedio?.toFixed(1) || 0}%</p>
              <p className="text-xs text-gray-500 mt-2">{resumen.asientosTotalesVendidos || 0} asientos vendidos</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Rutas Activas</h3>
              <p className="text-2xl font-bold text-gray-900">{resumen.rutasActivas || 0}</p>
              <p className="text-xs text-gray-500 mt-2">{resumen.totalBuses || 0} buses / {resumen.totalChoferes || 0} choferes</p>
            </div>
          </div>
        )}

        {/* Reporte de Ventas */}
        {selectedReport === 'ventas' && reporteVentas && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Evolución de Ventas</h3>
              <div className="h-64 flex items-end justify-between gap-1 overflow-x-auto pb-2">
                {reporteVentas.ventasPorDia.slice(-14).map((dia, index) => {
                  const maxMonto = Math.max(...reporteVentas.ventasPorDia.map(d => d.monto));
                  const height = maxMonto > 0 ? (dia.monto / maxMonto) * 100 : 0;
                  return (
                    <div key={index} className="flex-1 min-w-[40px] flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg hover:from-green-700 hover:to-green-500 transition-all cursor-pointer"
                        style={{ height: `${Math.max(height, 5)}%` }}
                        title={`${dia.diaSemana}: ${formatCurrency(dia.monto)}`}
                      />
                      <span className="text-xs text-gray-500 truncate w-full text-center">
                        {new Date(dia.fecha).getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Top Rutas por Ventas</h3>
              <div className="space-y-3">
                {reporteVentas.topRutas.map((ruta, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{ruta.nombreRuta}</p>
                      <p className="text-xs text-gray-500">{ruta.boletos} boletos vendidos</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{formatCurrency(ruta.ventas)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reporte de Viajes */}
        {selectedReport === 'viajes' && reporteViajes && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {reporteViajes.viajesPorEstado.map((estado, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-600 capitalize">{estado.estado.toLowerCase().replace('_', ' ')}</h4>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{estado.cantidad}</p>
                  <p className="text-xs text-gray-500">{estado.porcentaje.toFixed(1)}% del total</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Viajes por Bus</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Placa</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Completados</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Horas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporteViajes.viajesPorBus.map((bus, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{bus.placa}</td>
                        <td className="py-3 px-4 text-center text-gray-900">{bus.totalViajes}</td>
                        <td className="py-3 px-4 text-center text-green-600">{bus.viajesCompletados}</td>
                        <td className="py-3 px-4 text-center text-gray-900">{bus.horasTrabajadas.toFixed(1)}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Reporte de Ocupación */}
        {selectedReport === 'ocupacion' && reporteOcupacion && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-600">Asientos Totales</h4>
                <p className="text-3xl font-bold text-gray-900 mt-2">{reporteOcupacion.asientosTotales.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-600">Asientos Vendidos</h4>
                <p className="text-3xl font-bold text-green-600 mt-2">{reporteOcupacion.asientosVendidos.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-600">Asientos Disponibles</h4>
                <p className="text-3xl font-bold text-orange-600 mt-2">{reporteOcupacion.asientosDisponibles.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Ocupación por Hora del Día</h3>
              <div className="h-48 flex items-end justify-between gap-1">
                {reporteOcupacion.ocupacionPorHora.map((hora, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className={`w-full rounded-t-lg transition-all cursor-pointer ${
                        hora.ocupacionPromedio > 85 ? 'bg-green-500' :
                        hora.ocupacionPromedio > 70 ? 'bg-blue-500' : 'bg-gray-400'
                      }`}
                      style={{ height: `${hora.ocupacionPromedio}%` }}
                      title={`${hora.hora}:00 - ${hora.ocupacionPromedio.toFixed(1)}%`}
                    />
                    <span className="text-xs text-gray-500">{hora.hora}h</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Ocupación por Ruta</h3>
              <div className="space-y-3">
                {reporteOcupacion.ocupacionPorRuta.map((ruta, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-900">{ruta.nombreRuta}</span>
                      <span className="font-bold text-purple-600">{ruta.ocupacionPromedio.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${Math.min(ruta.ocupacionPromedio, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reporte de Rutas */}
        {selectedReport === 'rutas' && reporteRutas && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-600">Total Rutas</h4>
                <p className="text-3xl font-bold text-gray-900 mt-2">{reporteRutas.totalRutas}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-600">Rutas Activas</h4>
                <p className="text-3xl font-bold text-green-600 mt-2">{reporteRutas.rutasActivas}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-600">Frecuencias Activas</h4>
                <p className="text-3xl font-bold text-blue-600 mt-2">{reporteRutas.frecuenciasActivas}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Detalle por Ruta</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Ruta</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Distancia</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Precio</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Frecuencias</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Viajes</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Ingresos</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Ocupación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporteRutas.rutas.map((ruta, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{ruta.terminalOrigen}</p>
                          <p className="text-xs text-gray-500">→ {ruta.terminalDestino}</p>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-900">{ruta.distanciaKm?.toFixed(0) || '-'} km</td>
                        <td className="py-3 px-4 text-center text-gray-900">{formatCurrency(ruta.precioBase || 0)}</td>
                        <td className="py-3 px-4 text-center text-gray-900">{ruta.frecuenciasActivas}</td>
                        <td className="py-3 px-4 text-center text-gray-900">{ruta.viajesRealizados}</td>
                        <td className="py-3 px-4 text-center text-green-600 font-semibold">{formatCurrency(ruta.ingresosTotales)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            ruta.ocupacionPromedio > 80 ? 'bg-green-100 text-green-800' :
                            ruta.ocupacionPromedio > 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {ruta.ocupacionPromedio.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
