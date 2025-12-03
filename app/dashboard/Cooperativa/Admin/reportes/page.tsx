'use client';

import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useCooperativaConfig } from '@/app/context/CooperativaConfigContext';
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
  Eye
} from 'lucide-react';

type ReportType = 'ventas' | 'viajes' | 'ocupacion' | 'usuarios' | 'rutas';
type TimePeriod = 'hoy' | 'semana' | 'mes' | 'año' | 'personalizado';

interface ReportData {
  ventas: {
    total: number;
    cambio: number;
    transacciones: number;
    promedio: number;
  };
  viajes: {
    total: number;
    completados: number;
    cancelados: number;
    pendientes: number;
  };
  ocupacion: {
    promedio: number;
    masAlta: number;
    masBaja: number;
    total: number;
  };
  usuarios: {
    nuevos: number;
    activos: number;
    total: number;
    cambio: number;
  };
}

export default function ReportesPage() {
  const { user } = useAuth();
  const { styles } = useCooperativaConfig();
  const [selectedReport, setSelectedReport] = useState<ReportType>('ventas');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('mes');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);

  // Datos de ejemplo - TODO: Reemplazar con datos reales de la API
  const reportData: ReportData = {
    ventas: {
      total: 45280.50,
      cambio: 12.5,
      transacciones: 324,
      promedio: 139.88
    },
    viajes: {
      total: 156,
      completados: 142,
      cancelados: 8,
      pendientes: 6
    },
    ocupacion: {
      promedio: 78.5,
      masAlta: 95.2,
      masBaja: 45.8,
      total: 4890
    },
    usuarios: {
      nuevos: 48,
      activos: 892,
      total: 1245,
      cambio: 8.3
    }
  };

  const reportTypes = [
    { id: 'ventas', label: 'Ventas', icon: DollarSign, color: 'green' },
    { id: 'viajes', label: 'Viajes', icon: Bus, color: 'blue' },
    { id: 'ocupacion', label: 'Ocupación', icon: Activity, color: 'purple' },
    { id: 'usuarios', label: 'Usuarios', icon: Users, color: 'orange' },
    { id: 'rutas', label: 'Rutas', icon: MapPin, color: 'red' }
  ];

  const timePeriods = [
    { id: 'hoy', label: 'Hoy' },
    { id: 'semana', label: 'Esta Semana' },
    { id: 'mes', label: 'Este Mes' },
    { id: 'año', label: 'Este Año' },
    { id: 'personalizado', label: 'Personalizado' }
  ];

  const handleDownloadReport = async () => {
    setLoading(true);
    try {
      // TODO: Implementar descarga de reporte
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Descargando reporte...', { selectedReport, timePeriod, dateFrom, dateTo });
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color: string) => {
    const colors = {
      green: 'bg-green-100 text-green-800 border-green-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      red: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[color as keyof typeof colors] || colors.green;
  };

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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros y Controles */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Tipo de Reporte */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Tipo de Reporte
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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

          {/* Periodo de Tiempo y Filtros */}
          <div className="mt-6 flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Periodo
              </label>
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

            {/* Botones de Acción */}
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
                onClick={handleDownloadReport}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50 shadow-md coop-btn-primary"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Descargando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Descargar
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Filtros Avanzados */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha Desde
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha Hasta
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contenido del Reporte según tipo */}
        {selectedReport === 'ventas' && (
          <div className="space-y-6">
            {/* Resumen de Ventas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="flex items-center gap-1 text-sm font-semibold text-green-600">
                    <ArrowUpRight className="w-4 h-4" />
                    {reportData.ventas.cambio}%
                  </span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Ventas Totales</h3>
                <p className="text-3xl font-bold text-gray-900">${reportData.ventas.total.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">En el periodo seleccionado</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Ticket className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Transacciones</h3>
                <p className="text-3xl font-bold text-gray-900">{reportData.ventas.transacciones}</p>
                <p className="text-xs text-gray-500 mt-2">Total de boletos vendidos</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Ticket Promedio</h3>
                <p className="text-3xl font-bold text-gray-900">${reportData.ventas.promedio.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">Valor promedio por boleto</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Ventas Diarias</h3>
                <p className="text-3xl font-bold text-gray-900">${(reportData.ventas.total / 30).toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">Promedio por día</p>
              </div>
            </div>

            {/* Gráfico de Ventas */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Evolución de Ventas</h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {[65, 78, 82, 70, 88, 92, 85, 95, 89, 91, 87, 93, 88, 96].map((value, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg hover:from-green-700 hover:to-green-500 transition-all cursor-pointer"
                      style={{ height: `${value}%` }}
                      title={`Día ${index + 1}: $${(value * 50).toFixed(2)}`}
                    />
                    <span className="text-xs text-gray-500">{index + 1}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <span className="text-sm text-gray-600">Ventas</span>
                </div>
              </div>
            </div>

            {/* Top Rutas por Ventas */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Top Rutas por Ventas</h3>
              <div className="space-y-3">
                {[
                  { nombre: 'Quito - Guayaquil', ventas: 12500, tickets: 125 },
                  { nombre: 'Quito - Cuenca', ventas: 9800, tickets: 98 },
                  { nombre: 'Guayaquil - Cuenca', ventas: 8200, tickets: 82 },
                  { nombre: 'Quito - Ambato', ventas: 7100, tickets: 71 },
                  { nombre: 'Cuenca - Loja', ventas: 6200, tickets: 62 }
                ].map((ruta, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{ruta.nombre}</p>
                      <p className="text-xs text-gray-500">{ruta.tickets} boletos vendidos</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">${ruta.ventas.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'viajes' && (
          <div className="space-y-6">
            {/* Resumen de Viajes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Bus className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Total de Viajes</h3>
                <p className="text-3xl font-bold text-gray-900">{reportData.viajes.total}</p>
                <p className="text-xs text-gray-500 mt-2">En el periodo seleccionado</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Completados</h3>
                <p className="text-3xl font-bold text-gray-900">{reportData.viajes.completados}</p>
                <p className="text-xs text-gray-500 mt-2">{((reportData.viajes.completados / reportData.viajes.total) * 100).toFixed(1)}% del total</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Cancelados</h3>
                <p className="text-3xl font-bold text-gray-900">{reportData.viajes.cancelados}</p>
                <p className="text-xs text-gray-500 mt-2">{((reportData.viajes.cancelados / reportData.viajes.total) * 100).toFixed(1)}% del total</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Pendientes</h3>
                <p className="text-3xl font-bold text-gray-900">{reportData.viajes.pendientes}</p>
                <p className="text-xs text-gray-500 mt-2">Por realizar</p>
              </div>
            </div>

            {/* Lista de Viajes Recientes */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Viajes Recientes</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ruta</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bus</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ocupación</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[
                      { ruta: 'Quito - Guayaquil', bus: 'ABC-123', fecha: '2024-11-24 08:00', ocupacion: 85, estado: 'Completado' },
                      { ruta: 'Quito - Cuenca', bus: 'DEF-456', fecha: '2024-11-24 09:30', ocupacion: 92, estado: 'Completado' },
                      { ruta: 'Guayaquil - Cuenca', bus: 'GHI-789', fecha: '2024-11-24 10:00', ocupacion: 78, estado: 'En Ruta' },
                      { ruta: 'Quito - Ambato', bus: 'JKL-012', fecha: '2024-11-24 11:00', ocupacion: 65, estado: 'Pendiente' },
                      { ruta: 'Cuenca - Loja', bus: 'MNO-345', fecha: '2024-11-24 12:00', ocupacion: 0, estado: 'Cancelado' }
                    ].map((viaje, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{viaje.ruta}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{viaje.bus}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{viaje.fecha}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm font-semibold text-gray-900">{viaje.ocupacion}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              viaje.estado === 'Completado'
                                ? 'bg-green-100 text-green-800'
                                : viaje.estado === 'En Ruta'
                                ? 'bg-blue-100 text-blue-800'
                                : viaje.estado === 'Pendiente'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {viaje.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button className="text-green-600 hover:text-green-800 font-medium text-sm">
                            <Eye className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'ocupacion' && (
          <div className="space-y-6">
            {/* Resumen de Ocupación */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Ocupación Promedio</h3>
                <p className="text-3xl font-bold text-gray-900">{reportData.ocupacion.promedio}%</p>
                <p className="text-xs text-gray-500 mt-2">En todos los viajes</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Ocupación Más Alta</h3>
                <p className="text-3xl font-bold text-gray-900">{reportData.ocupacion.masAlta}%</p>
                <p className="text-xs text-gray-500 mt-2">Registro máximo</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <ArrowDownRight className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Ocupación Más Baja</h3>
                <p className="text-3xl font-bold text-gray-900">{reportData.ocupacion.masBaja}%</p>
                <p className="text-xs text-gray-500 mt-2">Registro mínimo</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Pasajeros Total</h3>
                <p className="text-3xl font-bold text-gray-900">{reportData.ocupacion.total}</p>
                <p className="text-xs text-gray-500 mt-2">En el periodo</p>
              </div>
            </div>

            {/* Mensaje informativo */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Activity className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Análisis de Ocupación</h3>
                  <p className="text-sm text-blue-800">
                    La ocupación promedio de {reportData.ocupacion.promedio}% indica un buen rendimiento. 
                    Los horarios con mayor ocupación pueden considerarse para aumentar frecuencias, 
                    mientras que los de menor ocupación pueden optimizarse.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'usuarios' && (
          <div className="space-y-6">
            {/* Resumen de Usuarios */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="flex items-center gap-1 text-sm font-semibold text-blue-600">
                    <ArrowUpRight className="w-4 h-4" />
                    {reportData.usuarios.cambio}%
                  </span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Usuarios Totales</h3>
                <p className="text-3xl font-bold text-gray-900">{reportData.usuarios.total}</p>
                <p className="text-xs text-gray-500 mt-2">Registrados en el sistema</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Usuarios Activos</h3>
                <p className="text-3xl font-bold text-gray-900">{reportData.usuarios.activos}</p>
                <p className="text-xs text-gray-500 mt-2">{((reportData.usuarios.activos / reportData.usuarios.total) * 100).toFixed(1)}% del total</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Nuevos Usuarios</h3>
                <p className="text-3xl font-bold text-gray-900">{reportData.usuarios.nuevos}</p>
                <p className="text-xs text-gray-500 mt-2">En el periodo seleccionado</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Ticket className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Compras Promedio</h3>
                <p className="text-3xl font-bold text-gray-900">2.8</p>
                <p className="text-xs text-gray-500 mt-2">Boletos por usuario</p>
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'rutas' && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Reporte de Rutas</h3>
            <p className="text-gray-600">
              Análisis detallado del rendimiento por ruta próximamente disponible
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
