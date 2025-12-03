'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Building2,
  Bus,
  Users,
  Route,
  Calendar,
  DollarSign,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  Ticket,
  PieChart,
  Activity,
  FileText,
  RefreshCw,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { getToken, superAdminApi, cooperativasApi } from '@/lib/api';
import { useConfig } from '@/app/context/ConfigContext';

// Tipos para los reportes
interface ReporteGeneral {
  cooperativas: {
    total: number;
    activas: number;
    inactivas: number;
    crecimientoMensual: number;
  };
  buses: {
    total: number;
    activos: number;
    enMantenimiento: number;
    inactivos: number;
  };
  usuarios: {
    clientes: number;
    personalCooperativas: number;
    nuevosEsteMes: number;
    crecimientoMensual: number;
  };
  ventas: {
    hoy: number;
    semana: number;
    mes: number;
    crecimientoMensual: number;
  };
  viajes: {
    hoy: number;
    semana: number;
    mes: number;
    completados: number;
    cancelados: number;
  };
  rutas: {
    total: number;
    activas: number;
    aprobadas: number;
    pendientes: number;
  };
  reservas: {
    pendientes: number;
    confirmadas: number;
    canceladas: number;
    tasaConversion: number;
  };
}

interface CooperativaReporte {
  id: number;
  nombre: string;
  ruc: string;
  buses: number;
  personal: number;
  ventasMes: number;
  viajesMes: number;
  activo: boolean;
}

interface RutaReporte {
  id: number;
  nombre: string;
  origen: string;
  destino: string;
  viajesMes: number;
  ocupacionPromedio: number;
  activo: boolean;
  aprobadaAnt: boolean;
}

type TabReporte = 'general' | 'cooperativas' | 'rutas' | 'ventas' | 'viajes';
type PeriodoFiltro = 'hoy' | 'semana' | 'mes' | 'trimestre' | 'anio';

export default function ReportesAdminPage() {
  const router = useRouter();
  const { config } = useConfig();
  const primaryColor = config?.colorPrimario || '#1E40AF';
  const secondaryColor = config?.colorSecundario || '#3B82F6';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabReporte>('general');
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes');
  
  // Estados de datos
  const [reporteGeneral, setReporteGeneral] = useState<ReporteGeneral | null>(null);
  const [cooperativasReporte, setCooperativasReporte] = useState<CooperativaReporte[]>([]);
  const [rutasReporte, setRutasReporte] = useState<RutaReporte[]>([]);
  
  // Datos simulados para demostración
  useEffect(() => {
    loadReportData();
  }, [periodo]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      // Cargar datos reales del sistema
      const [statsData, cooperativasData] = await Promise.all([
        superAdminApi.getStats(token),
        superAdminApi.getAllCooperativas(token),
      ]);

      // Construir reporte general con datos reales + simulados para demo
      const reporteGeneralData: ReporteGeneral = {
        cooperativas: {
          total: statsData.totalCooperativas,
          activas: statsData.cooperativasActivas,
          inactivas: statsData.totalCooperativas - statsData.cooperativasActivas,
          crecimientoMensual: 12.5, // Simulado
        },
        buses: {
          total: statsData.totalBuses,
          activos: statsData.busesActivos,
          enMantenimiento: Math.floor(statsData.totalBuses * 0.1), // Simulado
          inactivos: statsData.totalBuses - statsData.busesActivos,
        },
        usuarios: {
          clientes: statsData.totalUsuarios,
          personalCooperativas: statsData.totalUsuarios * 0.15, // Simulado
          nuevosEsteMes: Math.floor(statsData.totalUsuarios * 0.08),
          crecimientoMensual: 8.3,
        },
        ventas: {
          hoy: statsData.ventasTotalesHoy,
          semana: statsData.ventasTotalesHoy * 5.2,
          mes: statsData.ventasTotalesHoy * 22,
          crecimientoMensual: 15.7,
        },
        viajes: {
          hoy: statsData.viajesHoy,
          semana: statsData.viajesHoy * 6,
          mes: statsData.viajesHoy * 25,
          completados: Math.floor(statsData.viajesHoy * 25 * 0.92),
          cancelados: Math.floor(statsData.viajesHoy * 25 * 0.03),
        },
        rutas: {
          total: 45, // Simulado
          activas: 38,
          aprobadas: 42,
          pendientes: 3,
        },
        reservas: {
          pendientes: statsData.reservasPendientes,
          confirmadas: statsData.reservasPendientes * 4,
          canceladas: Math.floor(statsData.reservasPendientes * 0.15),
          tasaConversion: 78.5,
        },
      };

      setReporteGeneral(reporteGeneralData);

      // Construir datos de cooperativas para reporte
      const cooperativasReporteData: CooperativaReporte[] = cooperativasData.map(coop => ({
        id: coop.id,
        nombre: coop.nombre,
        ruc: coop.ruc,
        buses: coop.cantidadBuses,
        personal: coop.cantidadPersonal,
        ventasMes: Math.floor(Math.random() * 50000) + 10000, // Simulado
        viajesMes: Math.floor(Math.random() * 200) + 50, // Simulado
        activo: coop.activo,
      }));

      setCooperativasReporte(cooperativasReporteData);

      // Datos simulados de rutas para demo
      const rutasReporteData: RutaReporte[] = [
        { id: 1, nombre: 'Quito - Guayaquil', origen: 'Quito', destino: 'Guayaquil', viajesMes: 180, ocupacionPromedio: 85, activo: true, aprobadaAnt: true },
        { id: 2, nombre: 'Quito - Cuenca', origen: 'Quito', destino: 'Cuenca', viajesMes: 120, ocupacionPromedio: 78, activo: true, aprobadaAnt: true },
        { id: 3, nombre: 'Guayaquil - Machala', origen: 'Guayaquil', destino: 'Machala', viajesMes: 90, ocupacionPromedio: 72, activo: true, aprobadaAnt: true },
        { id: 4, nombre: 'Quito - Esmeraldas', origen: 'Quito', destino: 'Esmeraldas', viajesMes: 75, ocupacionPromedio: 68, activo: true, aprobadaAnt: true },
        { id: 5, nombre: 'Cuenca - Loja', origen: 'Cuenca', destino: 'Loja', viajesMes: 60, ocupacionPromedio: 65, activo: true, aprobadaAnt: true },
        { id: 6, nombre: 'Ambato - Riobamba', origen: 'Ambato', destino: 'Riobamba', viajesMes: 55, ocupacionPromedio: 70, activo: true, aprobadaAnt: false },
        { id: 7, nombre: 'Manta - Portoviejo', origen: 'Manta', destino: 'Portoviejo', viajesMes: 45, ocupacionPromedio: 62, activo: false, aprobadaAnt: true },
      ];

      setRutasReporte(rutasReporteData);

    } catch (err) {
      console.error('Error cargando reportes:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-EC').format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Componente de tarjeta de estadística
  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendValue,
    color,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: typeof Building2;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    color: string;
  }) => (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : 
             trend === 'down' ? <TrendingDown className="w-4 h-4" /> : null}
            {trendValue}
          </div>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );

  // Renderizado de pestañas
  const renderTabContent = () => {
    if (!reporteGeneral) return null;

    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-8">
            {/* Resumen Principal */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Resumen Ejecutivo
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Cooperativas Activas"
                  value={reporteGeneral.cooperativas.activas}
                  subtitle={`${reporteGeneral.cooperativas.total} total`}
                  icon={Building2}
                  trend="up"
                  trendValue={formatPercent(reporteGeneral.cooperativas.crecimientoMensual)}
                  color="bg-blue-600"
                />
                <StatCard
                  title="Flota de Buses"
                  value={reporteGeneral.buses.total}
                  subtitle={`${reporteGeneral.buses.activos} en servicio`}
                  icon={Bus}
                  trend="neutral"
                  trendValue={`${reporteGeneral.buses.enMantenimiento} en mant.`}
                  color="bg-green-600"
                />
                <StatCard
                  title="Usuarios Registrados"
                  value={formatNumber(reporteGeneral.usuarios.clientes)}
                  subtitle={`+${reporteGeneral.usuarios.nuevosEsteMes} este mes`}
                  icon={Users}
                  trend="up"
                  trendValue={formatPercent(reporteGeneral.usuarios.crecimientoMensual)}
                  color="bg-purple-600"
                />
                <StatCard
                  title="Ventas del Mes"
                  value={formatCurrency(reporteGeneral.ventas.mes)}
                  subtitle={`Hoy: ${formatCurrency(reporteGeneral.ventas.hoy)}`}
                  icon={DollarSign}
                  trend="up"
                  trendValue={formatPercent(reporteGeneral.ventas.crecimientoMensual)}
                  color="bg-orange-600"
                />
              </div>
            </div>

            {/* Métricas de Operación */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Route className="w-5 h-5 text-green-600" />
                Métricas de Operación
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Viajes</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Hoy</span>
                      <span className="font-bold text-gray-900">{reporteGeneral.viajes.hoy}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Esta semana</span>
                      <span className="font-bold text-gray-900">{reporteGeneral.viajes.semana}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Este mes</span>
                      <span className="font-bold text-gray-900">{reporteGeneral.viajes.mes}</span>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Completados
                        </span>
                        <span className="font-medium">{reporteGeneral.viajes.completados}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-red-600 flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Cancelados
                        </span>
                        <span className="font-medium">{reporteGeneral.viajes.cancelados}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Route className="w-5 h-5 text-teal-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Rutas ANT</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total registradas</span>
                      <span className="font-bold text-gray-900">{reporteGeneral.rutas.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Activas</span>
                      <span className="font-bold text-green-600">{reporteGeneral.rutas.activas}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Aprobadas ANT</span>
                      <span className="font-bold text-blue-600">{reporteGeneral.rutas.aprobadas}</span>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-yellow-600 flex items-center gap-1">
                          <Clock className="w-4 h-4" /> Pendientes aprobación
                        </span>
                        <span className="font-medium">{reporteGeneral.rutas.pendientes}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Ticket className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Reservas</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pendientes</span>
                      <span className="font-bold text-yellow-600">{reporteGeneral.reservas.pendientes}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Confirmadas (mes)</span>
                      <span className="font-bold text-green-600">{reporteGeneral.reservas.confirmadas}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Canceladas</span>
                      <span className="font-bold text-red-600">{reporteGeneral.reservas.canceladas}</span>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tasa de conversión</span>
                        <span className="font-bold text-blue-600">{reporteGeneral.reservas.tasaConversion}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico de distribución (simulado con barras CSS) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-600" />
                  Distribución de Buses por Estado
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">En servicio</span>
                      <span className="font-medium">{reporteGeneral.buses.activos} ({Math.round((reporteGeneral.buses.activos / reporteGeneral.buses.total) * 100)}%)</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${(reporteGeneral.buses.activos / reporteGeneral.buses.total) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">En mantenimiento</span>
                      <span className="font-medium">{reporteGeneral.buses.enMantenimiento} ({Math.round((reporteGeneral.buses.enMantenimiento / reporteGeneral.buses.total) * 100)}%)</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 rounded-full"
                        style={{ width: `${(reporteGeneral.buses.enMantenimiento / reporteGeneral.buses.total) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Inactivos</span>
                      <span className="font-medium">{reporteGeneral.buses.inactivos} ({Math.round((reporteGeneral.buses.inactivos / reporteGeneral.buses.total) * 100)}%)</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${(reporteGeneral.buses.inactivos / reporteGeneral.buses.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Tendencia de Ventas (Últimos 7 días)
                </h3>
                <div className="flex items-end justify-between h-32 gap-2">
                  {[65, 78, 52, 88, 73, 95, 82].map((value, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-linear-to-t from-green-500 to-green-400 rounded-t"
                        style={{ height: `${value}%` }}
                      />
                      <span className="text-xs text-gray-500">
                        {['L', 'M', 'X', 'J', 'V', 'S', 'D'][index]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'cooperativas':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Reporte de Cooperativas
              </h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                <Download className="w-4 h-4" />
                Exportar Excel
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase px-6 py-4">Cooperativa</th>
                      <th className="text-center text-xs font-semibold text-gray-600 uppercase px-4 py-4">RUC</th>
                      <th className="text-center text-xs font-semibold text-gray-600 uppercase px-4 py-4">Buses</th>
                      <th className="text-center text-xs font-semibold text-gray-600 uppercase px-4 py-4">Personal</th>
                      <th className="text-right text-xs font-semibold text-gray-600 uppercase px-4 py-4">Ventas (Mes)</th>
                      <th className="text-center text-xs font-semibold text-gray-600 uppercase px-4 py-4">Viajes (Mes)</th>
                      <th className="text-center text-xs font-semibold text-gray-600 uppercase px-4 py-4">Estado</th>
                      <th className="text-center text-xs font-semibold text-gray-600 uppercase px-4 py-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cooperativasReporte.map((coop) => (
                      <tr key={coop.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{coop.nombre}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center text-sm text-gray-600">{coop.ruc}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                            <Bus className="w-3 h-3" />
                            {coop.buses}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                            <Users className="w-3 h-3" />
                            {coop.personal}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-gray-900">
                          {formatCurrency(coop.ventasMes)}
                        </td>
                        <td className="px-4 py-4 text-center font-medium text-gray-700">
                          {coop.viajesMes}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            coop.activo 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {coop.activo ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button 
                            onClick={() => router.push(`/dashboard/Admin/cooperativas/${coop.id}`)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {cooperativasReporte.length === 0 && (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay cooperativas registradas</p>
                </div>
              )}
            </div>

            {/* Resumen de cooperativas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                <p className="text-sm opacity-90">Total Cooperativas</p>
                <p className="text-2xl font-bold">{cooperativasReporte.length}</p>
              </div>
              <div className="bg-linear-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                <p className="text-sm opacity-90">Total Buses</p>
                <p className="text-2xl font-bold">{cooperativasReporte.reduce((sum, c) => sum + c.buses, 0)}</p>
              </div>
              <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                <p className="text-sm opacity-90">Total Personal</p>
                <p className="text-2xl font-bold">{cooperativasReporte.reduce((sum, c) => sum + c.personal, 0)}</p>
              </div>
              <div className="bg-linear-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                <p className="text-sm opacity-90">Ventas Totales</p>
                <p className="text-2xl font-bold">{formatCurrency(cooperativasReporte.reduce((sum, c) => sum + c.ventasMes, 0))}</p>
              </div>
            </div>
          </div>
        );

      case 'rutas':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Route className="w-5 h-5 text-green-600" />
                Reporte de Rutas
              </h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                <Download className="w-4 h-4" />
                Exportar Excel
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase px-6 py-4">Ruta</th>
                      <th className="text-center text-xs font-semibold text-gray-600 uppercase px-4 py-4">Origen</th>
                      <th className="text-center text-xs font-semibold text-gray-600 uppercase px-4 py-4">Destino</th>
                      <th className="text-center text-xs font-semibold text-gray-600 uppercase px-4 py-4">Viajes/Mes</th>
                      <th className="text-center text-xs font-semibold text-gray-600 uppercase px-4 py-4">Ocupación</th>
                      <th className="text-center text-xs font-semibold text-gray-600 uppercase px-4 py-4">ANT</th>
                      <th className="text-center text-xs font-semibold text-gray-600 uppercase px-4 py-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rutasReporte.map((ruta) => (
                      <tr key={ruta.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Route className="w-5 h-5 text-green-600" />
                            </div>
                            <p className="font-semibold text-gray-900">{ruta.nombre}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="w-3 h-3" />
                            {ruta.origen}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="w-3 h-3" />
                            {ruta.destino}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center font-medium text-gray-900">{ruta.viajesMes}</td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  ruta.ocupacionPromedio >= 80 ? 'bg-green-500' :
                                  ruta.ocupacionPromedio >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${ruta.ocupacionPromedio}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{ruta.ocupacionPromedio}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {ruta.aprobadaAnt ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-600 mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            ruta.activo 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {ruta.activo ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top rutas por ocupación */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Top Rutas por Ocupación</h3>
              <div className="space-y-3">
                {rutasReporte
                  .sort((a, b) => b.ocupacionPromedio - a.ocupacionPromedio)
                  .slice(0, 5)
                  .map((ruta, index) => (
                    <div key={ruta.id} className="flex items-center gap-4">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-orange-400 text-orange-900' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{ruta.nombre}</p>
                        <p className="text-xs text-gray-500">{ruta.viajesMes} viajes/mes</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{ruta.ocupacionPromedio}%</p>
                        <p className="text-xs text-gray-500">ocupación</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        );

      case 'ventas':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Reporte de Ventas
              </h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                <Download className="w-4 h-4" />
                Exportar Excel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="Ventas Hoy"
                value={formatCurrency(reporteGeneral.ventas.hoy)}
                icon={DollarSign}
                color="bg-green-600"
              />
              <StatCard
                title="Ventas Semana"
                value={formatCurrency(reporteGeneral.ventas.semana)}
                icon={DollarSign}
                color="bg-blue-600"
              />
              <StatCard
                title="Ventas Mes"
                value={formatCurrency(reporteGeneral.ventas.mes)}
                trend="up"
                trendValue={formatPercent(reporteGeneral.ventas.crecimientoMensual)}
                icon={DollarSign}
                color="bg-purple-600"
              />
              <StatCard
                title="Ticket Promedio"
                value={formatCurrency(reporteGeneral.ventas.mes / (reporteGeneral.reservas.confirmadas || 1))}
                icon={Ticket}
                color="bg-orange-600"
              />
            </div>

            {/* Ventas por cooperativa */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Ventas por Cooperativa</h3>
              <div className="space-y-4">
                {cooperativasReporte
                  .sort((a, b) => b.ventasMes - a.ventasMes)
                  .map((coop) => {
                    const maxVentas = Math.max(...cooperativasReporte.map(c => c.ventasMes));
                    const porcentaje = (coop.ventasMes / maxVentas) * 100;
                    return (
                      <div key={coop.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-900">{coop.nombre}</span>
                          <span className="font-bold text-gray-900">{formatCurrency(coop.ventasMes)}</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-linear-to-r from-green-400 to-green-600 rounded-full transition-all"
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Métodos de pago (simulado) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Métodos de Pago</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Efectivo</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '45%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Tarjeta</span>
                      <span className="font-medium">35%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '35%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Transferencia</span>
                      <span className="font-medium">15%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: '15%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">PayPal</span>
                      <span className="font-medium">5%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: '5%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Canales de Venta</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Web / App</span>
                      <span className="font-medium">60%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '60%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Ventanilla</span>
                      <span className="font-medium">35%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: '35%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Agencias</span>
                      <span className="font-medium">5%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-pink-500 rounded-full" style={{ width: '5%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'viajes':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Reporte de Viajes
              </h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                <Download className="w-4 h-4" />
                Exportar Excel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="Viajes Hoy"
                value={reporteGeneral.viajes.hoy}
                subtitle="Programados"
                icon={Calendar}
                color="bg-indigo-600"
              />
              <StatCard
                title="Completados (Mes)"
                value={reporteGeneral.viajes.completados}
                subtitle={`${Math.round((reporteGeneral.viajes.completados / reporteGeneral.viajes.mes) * 100)}% del total`}
                icon={CheckCircle2}
                color="bg-green-600"
              />
              <StatCard
                title="Cancelados (Mes)"
                value={reporteGeneral.viajes.cancelados}
                subtitle={`${Math.round((reporteGeneral.viajes.cancelados / reporteGeneral.viajes.mes) * 100)}% del total`}
                icon={XCircle}
                color="bg-red-600"
              />
              <StatCard
                title="Tasa de Éxito"
                value={`${Math.round((reporteGeneral.viajes.completados / (reporteGeneral.viajes.completados + reporteGeneral.viajes.cancelados)) * 100)}%`}
                icon={Activity}
                color="bg-blue-600"
              />
            </div>

            {/* Viajes por cooperativa */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Viajes por Cooperativa (Este Mes)</h3>
              <div className="space-y-4">
                {cooperativasReporte
                  .sort((a, b) => b.viajesMes - a.viajesMes)
                  .map((coop) => {
                    const maxViajes = Math.max(...cooperativasReporte.map(c => c.viajesMes));
                    const porcentaje = (coop.viajesMes / maxViajes) * 100;
                    return (
                      <div key={coop.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-900">{coop.nombre}</span>
                          <span className="font-bold text-gray-900">{coop.viajesMes} viajes</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-linear-to-r from-indigo-400 to-indigo-600 rounded-full transition-all"
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Distribución por día de la semana */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Distribución de Viajes por Día</h3>
              <div className="flex items-end justify-between h-40 gap-2">
                {[
                  { dia: 'Lun', valor: 85 },
                  { dia: 'Mar', valor: 72 },
                  { dia: 'Mié', valor: 68 },
                  { dia: 'Jue', valor: 75 },
                  { dia: 'Vie', valor: 95 },
                  { dia: 'Sáb', valor: 100 },
                  { dia: 'Dom', valor: 88 },
                ].map((item) => (
                  <div key={item.dia} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-medium text-gray-700">{item.valor}%</span>
                    <div 
                      className={`w-full rounded-t transition-all ${
                        item.valor === 100 ? 'bg-linear-to-t from-indigo-600 to-indigo-500' :
                        item.valor >= 90 ? 'bg-linear-to-t from-indigo-500 to-indigo-400' :
                        item.valor >= 80 ? 'bg-linear-to-t from-blue-500 to-blue-400' :
                        'bg-linear-to-t from-blue-400 to-blue-300'
                      }`}
                      style={{ height: `${item.valor}%` }}
                    />
                    <span className="text-xs text-gray-600 font-medium">{item.dia}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto mb-4"
            style={{ borderColor: primaryColor }}
          ></div>
          <p className="text-gray-600 font-medium">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header 
        className="shadow-lg"
        style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <BarChart3 className="w-8 h-8" />
                Centro de Reportes
              </h1>
              <p className="text-white/80 mt-2">
                Análisis y estadísticas del sistema AndinaBus
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadReportData}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </button>
              <div className="relative">
                <select
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value as PeriodoFiltro)}
                  className="appearance-none bg-white/20 text-white px-4 py-2 pr-10 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-medium"
                >
                  <option value="hoy" className="text-gray-900">Hoy</option>
                  <option value="semana" className="text-gray-900">Esta Semana</option>
                  <option value="mes" className="text-gray-900">Este Mes</option>
                  <option value="trimestre" className="text-gray-900">Trimestre</option>
                  <option value="anio" className="text-gray-900">Este Año</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs de navegación */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-2">
            {[
              { id: 'general', label: 'Resumen General', icon: Activity },
              { id: 'cooperativas', label: 'Cooperativas', icon: Building2 },
              { id: 'rutas', label: 'Rutas', icon: Route },
              { id: 'ventas', label: 'Ventas', icon: DollarSign },
              { id: 'viajes', label: 'Viajes', icon: Calendar },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabReporte)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                style={activeTab === tab.id ? { backgroundColor: primaryColor } : {}}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {renderTabContent()}
      </main>

      {/* Footer con info */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-500">
            <p>
              <FileText className="w-4 h-4 inline mr-1" />
              Datos actualizados al {new Date().toLocaleDateString('es-EC', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p>
              AndinaBus Platform - Panel de Administración
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
