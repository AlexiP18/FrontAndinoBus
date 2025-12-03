'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useConfig } from '@/app/context/ConfigContext';
import { superAdminApi, type ClienteInfo, getToken } from '@/lib/api';
import { 
  ArrowLeft,
  Grid3x3,
  Table,
  User,
  Mail,
  Calendar,
  Search,
  X
} from 'lucide-react';

type ViewMode = 'table' | 'cards';

export default function ClientesPage() {
  const router = useRouter();
  const { config } = useConfig();
  const [clientes, setClientes] = useState<ClienteInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  
  // Colores dinámicos
  const primaryColor = config?.colorPrimario || '#2563eb';
  
  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Clientes filtrados
  const clientesFiltrados = clientes.filter(cliente => {
    // Filtro por búsqueda
    const busqueda = searchTerm.toLowerCase();
    const coincideBusqueda = !searchTerm || 
      cliente.nombres.toLowerCase().includes(busqueda) ||
      cliente.apellidos.toLowerCase().includes(busqueda) ||
      cliente.email.toLowerCase().includes(busqueda);

    // Filtro por fecha
    const fechaRegistro = new Date(cliente.createdAt);
    const cumpleFechaInicio = !fechaInicio || fechaRegistro >= new Date(fechaInicio);
    const cumpleFechaFin = !fechaFin || fechaRegistro <= new Date(fechaFin + 'T23:59:59');

    return coincideBusqueda && cumpleFechaInicio && cumpleFechaFin;
  });

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFechaInicio('');
    setFechaFin('');
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      const data = await superAdminApi.getAllClientes(token);
      setClientes(data);
    } catch (err: unknown) {
      console.error('Error al cargar clientes:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivo = async (clienteId: number, estadoActual: boolean, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    const nuevoEstado = !estadoActual;
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    
    if (!confirm(`¿Estás seguro de que deseas ${accion} este cliente?`)) return;

    try {
      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      await superAdminApi.toggleClienteEstado(clienteId, nuevoEstado, token);
      await loadClientes();
    } catch (err: any) {
      setError(err.message || 'Error al cambiar el estado del cliente');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto p-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Cargando clientes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white rounded-lg transition-colors"
                title="Volver"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <h1 className="text-4xl font-bold text-gray-900">Gestión de Clientes</h1>
            </div>
            <p className="text-gray-600 ml-16">Administra todos los clientes registrados en el sistema</p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-md">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'cards'
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={viewMode === 'cards' ? { backgroundColor: primaryColor } : undefined}
              title="Vista de cards"
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={viewMode === 'table' ? { backgroundColor: primaryColor } : undefined}
              title="Vista de tabla"
            >
              <Table className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filtros de búsqueda */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Input de búsqueda */}
            <div className="flex-1 min-w-[250px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar cliente</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>

            {/* Fecha inicio */}
            <div className="min-w-[180px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha desde</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            {/* Fecha fin */}
            <div className="min-w-[180px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha hasta</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            {/* Botón limpiar filtros */}
            {(searchTerm || fechaInicio || fechaFin) && (
              <button
                onClick={limpiarFiltros}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Limpiar filtros"
              >
                <X className="w-4 h-4" />
                Limpiar
              </button>
            )}
          </div>

          {/* Contador de resultados */}
          <div className="mt-3 text-sm text-gray-600">
            Mostrando <span className="font-semibold text-blue-600">{clientesFiltrados.length}</span> de <span className="font-semibold">{clientes.length}</span> clientes
          </div>
        </div>

        {/* Content */}
        {clientesFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {clientes.length === 0 ? 'No hay clientes' : 'No se encontraron resultados'}
            </h3>
            <p className="text-gray-600 text-sm">
              {clientes.length === 0 
                ? 'Aún no hay clientes registrados en el sistema'
                : 'Intenta con otros términos de búsqueda o ajusta los filtros'}
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          /* Cards View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clientesFiltrados.map((cliente) => (
              <div
                key={cliente.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200"
              >
                <div className="p-6">
                  {/* Header con icono y estado */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      {/* Indicador de estado */}
                      <div
                        className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-4 border-white ${
                          cliente.activo ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                        title={cliente.activo ? 'Activo' : 'Inactivo'}
                      />
                    </div>
                  </div>

                  {/* Información */}
                  <div className="space-y-3 mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                      {cliente.nombres} {cliente.apellidos}
                    </h3>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="truncate">{cliente.email}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>Registro: {new Date(cliente.createdAt).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                      onClick={(e) => handleToggleActivo(cliente.id, cliente.activo, e)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        cliente.activo
                          ? 'bg-green-600 focus:ring-green-500'
                          : 'bg-gray-300 focus:ring-gray-400'
                      }`}
                      title={cliente.activo ? 'Desactivar cliente' : 'Activar cliente'}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          cliente.activo ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <th className="sticky left-0 px-6 py-4 text-left text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 z-10">
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Fecha de Registro
                    </th>
                    <th className="sticky right-0 px-6 py-4 text-center text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 z-10">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clientesFiltrados.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-blue-50 transition-colors">
                      <td className="sticky left-0 bg-white px-6 py-4 z-10">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div
                              className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                                cliente.activo ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                            />
                          </div>
                          <div className="font-semibold text-gray-900">
                            {cliente.nombres} {cliente.apellidos}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{cliente.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>
                            {new Date(cliente.createdAt).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="sticky right-0 bg-white px-6 py-4 z-10">
                        <div className="flex justify-center">
                          <button
                            onClick={(e) => handleToggleActivo(cliente.id, cliente.activo, e)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                              cliente.activo
                                ? 'bg-green-600 focus:ring-green-500'
                                : 'bg-gray-300 focus:ring-gray-400'
                            }`}
                            title={cliente.activo ? 'Desactivar cliente' : 'Activar cliente'}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                cliente.activo ? 'translate-x-6' : 'translate-x-1'
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
          </div>
        )}
      </div>
    </div>
  );
}
