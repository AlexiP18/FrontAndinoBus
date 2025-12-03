'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { cooperativaDetalleApi, getToken, type CooperativaDetalle } from '@/lib/api';
import { 
  ArrowLeft,
  Building2,
  Bus,
  Users,
  DollarSign,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  TrendingUp,
  Activity,
  Shield,
  Info,
  Grid3x3,
  Table,
  User,
  CreditCard,
  FileText
} from 'lucide-react';

type TabType = 'general' | 'buses' | 'usuarios';

export default function CooperativaDetallePage() {
  const router = useRouter();
  const params = useParams();
  const cooperativaId = params.cooperativaId as string;

  const [cooperativa, setCooperativa] = useState<CooperativaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [busesViewMode, setBusesViewMode] = useState<'cards' | 'table'>('cards');
  const [usuariosViewMode, setUsuariosViewMode] = useState<'cards' | 'table'>('cards');

  useEffect(() => {
    loadCooperativaDetalle();
  }, [cooperativaId]);

  const loadCooperativaDetalle = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      const data = await cooperativaDetalleApi.get(Number(cooperativaId), token);
      setCooperativa(data);
    } catch (err) {
      console.error('Error al cargar detalle de cooperativa:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando información de la cooperativa...</p>
        </div>
      </div>
    );
  }

  if (error || !cooperativa) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error al cargar datos</h3>
              <p className="text-red-800 text-sm mb-4">{error || 'No se encontró la cooperativa'}</p>
              <button
                onClick={() => router.push('/dashboard/Admin/cooperativas')}
                className="bg-white text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a Cooperativas
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-linear-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push('/dashboard/Admin/cooperativas')}
            className="text-white hover:text-blue-100 mb-4 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Volver a Cooperativas</span>
          </button>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{cooperativa.nombre}</h1>
                <div className="flex flex-wrap items-center gap-4 text-blue-100 text-sm">
                  <span className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    RUC: {cooperativa.ruc}
                  </span>
                  {cooperativa.telefono && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {cooperativa.telefono}
                    </span>
                  )}
                  {cooperativa.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {cooperativa.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
                  cooperativa.activo
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}
              >
                {cooperativa.activo ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Activa
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Inactiva
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Buses */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bus className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                Flota
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Buses Totales</h3>
            <p className="text-3xl font-bold text-gray-900">{cooperativa.estadisticas.totalBuses}</p>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Activity className="w-3 h-3 text-green-600" />
              {cooperativa.estadisticas.busesActivos} en servicio
            </p>
          </div>

          {/* Personal */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                Equipo
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Personal Total</h3>
            <p className="text-3xl font-bold text-gray-900">{cooperativa.estadisticas.totalUsuarios}</p>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              {cooperativa.estadisticas.usuariosActivos} activos
            </p>
          </div>

          {/* Ventas Hoy */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                Hoy
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Ventas del Día</h3>
            <p className="text-3xl font-bold text-gray-900">
              ${cooperativa.estadisticas.ventasHoy.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {cooperativa.estadisticas.viajesHoy} viajes realizados
            </p>
          </div>

          {/* Reservas Pendientes */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                Pendientes
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Reservas</h3>
            <p className="text-3xl font-bold text-gray-900">{cooperativa.estadisticas.reservasPendientes}</p>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Esperando confirmación
            </p>
          </div>
        </div>

        {/* Información de Contacto */}
        {(cooperativa.direccion || cooperativa.telefono || cooperativa.email) && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Información de Contacto
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {cooperativa.direccion && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Dirección</p>
                    <p className="text-sm font-medium text-gray-900">{cooperativa.direccion}</p>
                  </div>
                </div>
              )}
              {cooperativa.telefono && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Teléfono</p>
                    <p className="text-sm font-medium text-gray-900">{cooperativa.telefono}</p>
                  </div>
                </div>
              )}
              {cooperativa.email && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="text-sm font-medium text-gray-900">{cooperativa.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('general')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'general'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Activity className="w-4 h-4" />
                Resumen General
              </button>
              <button
                onClick={() => setActiveTab('buses')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'buses'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Bus className="w-4 h-4" />
                Buses ({cooperativa.buses.length})
              </button>
              <button
                onClick={() => setActiveTab('usuarios')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'usuarios'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4" />
                Personal ({cooperativa.usuarios.length})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Tab: General */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen de la Cooperativa</h2>
                  <p className="text-gray-600 mb-6">
                    Vista general de las estadísticas y el rendimiento de {cooperativa.nombre}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-linear-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Bus className="w-5 h-5 text-blue-600" />
                      <p className="text-sm font-medium text-blue-900">Buses Totales</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{cooperativa.estadisticas.totalBuses}</p>
                  </div>

                  <div className="bg-linear-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      <p className="text-sm font-medium text-purple-900">Personal Total</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-600">{cooperativa.estadisticas.totalUsuarios}</p>
                  </div>

                  <div className="bg-linear-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <p className="text-sm font-medium text-green-900">Viajes Hoy</p>
                    </div>
                    <p className="text-3xl font-bold text-green-600">{cooperativa.estadisticas.viajesHoy}</p>
                  </div>

                  <div className="bg-linear-to-br from-orange-50 to-orange-100 p-5 rounded-xl border border-orange-200">
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign className="w-5 h-5 text-orange-600" />
                      <p className="text-sm font-medium text-orange-900">Ventas Hoy</p>
                    </div>
                    <p className="text-3xl font-bold text-orange-600">
                      ${cooperativa.estadisticas.ventasHoy.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-600" />
                      Estado de la Flota
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Buses Activos</span>
                        <span className="text-sm font-bold text-green-600">
                          {cooperativa.estadisticas.busesActivos}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Buses Inactivos</span>
                        <span className="text-sm font-bold text-gray-600">
                          {cooperativa.estadisticas.totalBuses - cooperativa.estadisticas.busesActivos}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      Estado del Personal
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Personal Activo</span>
                        <span className="text-sm font-bold text-green-600">
                          {cooperativa.estadisticas.usuariosActivos}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Personal Inactivo</span>
                        <span className="text-sm font-bold text-gray-600">
                          {cooperativa.estadisticas.totalUsuarios - cooperativa.estadisticas.usuariosActivos}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Buses */}
            {activeTab === 'buses' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Buses de la Cooperativa</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Gestiona todos los buses registrados en la cooperativa
                    </p>
                  </div>
                  
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-md border border-gray-200">
                    <button
                      onClick={() => setBusesViewMode('cards')}
                      className={`p-2 rounded-lg transition-all ${
                        busesViewMode === 'cards'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title="Vista de cards"
                    >
                      <Grid3x3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setBusesViewMode('table')}
                      className={`p-2 rounded-lg transition-all ${
                        busesViewMode === 'table'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title="Vista de tabla"
                    >
                      <Table className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {cooperativa.buses.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                    <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay buses registrados</h3>
                    <p className="text-gray-600 text-sm">
                      Aún no se han agregado buses a esta cooperativa
                    </p>
                  </div>
                ) : busesViewMode === 'cards' ? (
                  /* Cards View */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cooperativa.buses.map((bus) => (
                      <div
                        key={bus.id}
                        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
                      >
                        {/* Foto del Bus */}
                        <div className="mb-4">
                          <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Bus className="w-16 h-16 text-gray-400" />
                          </div>
                        </div>

                        {/* Info del Bus */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">{bus.placa}</h3>
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                bus.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {bus.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>

                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Modelo:</span> {bus.modelo}
                          </div>

                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Capacidad:</span> {bus.capacidad} asientos
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/Admin/cooperativas/${cooperativaId}/buses/${bus.id}/frecuencias`
                              )
                            }
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver frecuencias"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          
                          <button
                            disabled
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors opacity-50 cursor-not-allowed ${
                              bus.activo ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                            title="Solo lectura"
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                bus.activo ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Table View */
                  <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 relative">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="sticky left-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                            Bus
                          </th>
                          <th className="sticky left-28 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                            Placa
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Modelo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Capacidad
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="sticky right-0 z-10 bg-gray-50 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {cooperativa.buses.map((bus) => (
                          <tr key={bus.id} className="hover:bg-gray-50">
                            <td className="sticky left-0 z-10 bg-white px-6 py-4 whitespace-nowrap border-r border-gray-200">
                              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                <Bus className="w-8 h-8 text-gray-400" />
                              </div>
                            </td>
                            <td className="sticky left-28 z-10 bg-white px-6 py-4 whitespace-nowrap border-r border-gray-200">
                              <div className="text-sm font-medium text-gray-900">{bus.placa}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{bus.modelo}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{bus.capacidad} asientos</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  bus.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {bus.activo ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="sticky right-0 z-10 bg-white px-6 py-4 whitespace-nowrap border-l border-gray-200">
                              <div className="flex items-center justify-center gap-3">
                                <button
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/Admin/cooperativas/${cooperativaId}/buses/${bus.id}/frecuencias`
                                    )
                                  }
                                  className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Ver frecuencias"
                                >
                                  <Eye className="w-5 h-5" />
                                </button>
                                <button
                                  disabled
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors opacity-50 cursor-not-allowed ${
                                    bus.activo ? 'bg-green-600' : 'bg-gray-300'
                                  }`}
                                  title="Solo lectura"
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      bus.activo ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Usuarios */}
            {activeTab === 'usuarios' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Personal de la Cooperativa</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Lista completa del personal registrado
                    </p>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-md border border-gray-200">
                    <button
                      onClick={() => setUsuariosViewMode('cards')}
                      className={`p-2 rounded-lg transition-all ${
                        usuariosViewMode === 'cards'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title="Vista de cards"
                    >
                      <Grid3x3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setUsuariosViewMode('table')}
                      className={`p-2 rounded-lg transition-all ${
                        usuariosViewMode === 'table'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title="Vista de tabla"
                    >
                      <Table className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {cooperativa.usuarios.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay personal registrado</h3>
                    <p className="text-gray-600 text-sm">
                      Aún no se ha agregado personal a esta cooperativa
                    </p>
                  </div>
                ) : usuariosViewMode === 'cards' ? (
                  /* Cards View */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cooperativa.usuarios.map((usuario) => (
                      <div
                        key={usuario.id}
                        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
                      >
                        {/* Photo and Name */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-500">
                              <User className="w-8 h-8 text-green-600" />
                            </div>
                            <div
                              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                                usuario.activo ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                              title={usuario.activo ? 'Activo' : 'Inactivo'}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {usuario.nombres} {usuario.apellidos}
                            </h3>
                            <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {usuario.rol}
                            </span>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span className="truncate">{usuario.email}</span>
                          </div>
                          {usuario.cedula && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <CreditCard className="w-4 h-4 text-gray-500" />
                              <span>{usuario.cedula}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end pt-4 border-t border-gray-200">
                          <button
                            disabled
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors opacity-50 cursor-not-allowed ${
                              usuario.activo ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                            title="Solo lectura"
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                usuario.activo ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Table View */
                  <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                            Usuario
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cédula
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rol
                          </th>
                          <th className="sticky right-0 bg-gray-50 z-10 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {cooperativa.usuarios.map((usuario) => (
                          <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                            <td className="sticky left-0 bg-white z-10 px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-500">
                                    <User className="w-5 h-5 text-green-600" />
                                  </div>
                                  <div
                                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                      usuario.activo ? 'bg-green-500' : 'bg-gray-400'
                                    }`}
                                  />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {usuario.nombres} {usuario.apellidos}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{usuario.cedula || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{usuario.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {usuario.rol}
                              </span>
                            </td>
                            <td className="sticky right-0 bg-white z-10 px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center">
                                <button
                                  disabled
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors opacity-50 cursor-not-allowed ${
                                    usuario.activo ? 'bg-green-600' : 'bg-gray-300'
                                  }`}
                                  title="Solo lectura"
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      usuario.activo ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
