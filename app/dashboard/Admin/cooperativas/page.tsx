'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useConfig } from '@/app/context/ConfigContext';
import { superAdminApi, type CooperativaInfo, getToken } from '@/lib/api';
import { 
  Building2,
  Bus,
  Users,
  Search,
  Eye,
  Grid3x3,
  List,
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

type ViewMode = 'cards' | 'table';
type FilterType = 'all' | 'active' | 'inactive';

export default function CooperativasPage() {
  const router = useRouter();
  const { config } = useConfig();
  const [cooperativas, setCooperativas] = useState<CooperativaInfo[]>([]);
  const [filteredCooperativas, setFilteredCooperativas] = useState<CooperativaInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Colores dinámicos
  const primaryColor = config?.colorPrimario || '#2563eb';
  const secondaryColor = config?.colorSecundario || '#3b82f6';
  const accentColor = config?.colorAcento || '#10b981';

  const filterCooperativas = useCallback(() => {
    let filtered = [...cooperativas];

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (coop) =>
          coop.nombre.toLowerCase().includes(term) ||
          coop.ruc.toLowerCase().includes(term)
      );
    }

    // Filtrar por estado
    if (filterType === 'active') {
      filtered = filtered.filter((coop) => coop.activo);
    } else if (filterType === 'inactive') {
      filtered = filtered.filter((coop) => !coop.activo);
    }

    setFilteredCooperativas(filtered);
  }, [cooperativas, searchTerm, filterType]);

  useEffect(() => {
    loadCooperativas();
  }, []);

  useEffect(() => {
    filterCooperativas();
  }, [cooperativas, searchTerm, filterType, filterCooperativas]);

  const loadCooperativas = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      const data = await superAdminApi.getAllCooperativas(token);
      setCooperativas(data);
    } catch (err: unknown) {
      console.error('Error al cargar cooperativas:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar cooperativas');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEstado = async (cooperativaId: number, nombre: string, estadoActual: boolean, event: React.MouseEvent) => {
    event.stopPropagation(); // Evitar que se dispare el onClick del card/row
    
    const nuevoEstado = !estadoActual;
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    
    if (!confirm(`¿Estás seguro de que deseas ${accion} la cooperativa "${nombre}"?`)) {
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        alert('No se encontró token de autenticación');
        return;
      }

      await superAdminApi.toggleCooperativaEstado(cooperativaId, nuevoEstado, token);
      alert(`✅ Cooperativa ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`);
      
      // Recargar lista
      await loadCooperativas();
    } catch (err: unknown) {
      console.error('Error al cambiar estado:', err);
      alert(`❌ Error: ${err instanceof Error ? err.message : 'No se pudo cambiar el estado'}`);
    }
  };

  const getStats = () => {
    return {
      total: cooperativas.length,
      active: cooperativas.filter((c) => c.activo).length,
      inactive: cooperativas.filter((c) => !c.activo).length,
      totalBuses: cooperativas.reduce((sum, c) => sum + c.cantidadBuses, 0),
      totalPersonal: cooperativas.reduce((sum, c) => sum + c.cantidadPersonal, 0),
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto mb-4"
            style={{ borderColor: primaryColor }}
          ></div>
          <p className="text-gray-600 font-medium">Cargando cooperativas...</p>
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
                <Building2 className="w-8 h-8" />
                Gestión de Cooperativas
              </h1>
              <p className="text-white/80 mt-2">
                Administra todas las cooperativas registradas en el sistema
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard/Admin/cooperativas/nueva')}
              className="bg-white px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 shadow-md"
              style={{ color: primaryColor }}
            >
              <Plus className="w-5 h-5" />
              Nueva Cooperativa
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Building2 className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                <CheckCircle className="w-5 h-5" style={{ color: accentColor }} />
              </div>
              <div>
                <p className="text-xs text-gray-600">Activas</p>
                <p className="text-2xl font-bold" style={{ color: accentColor }}>{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Inactivas</p>
                <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Bus className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Buses</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalBuses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Personal</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalPersonal}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre o RUC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    filterType === 'all'
                      ? 'bg-white text-blue-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilterType('active')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    filterType === 'active'
                      ? 'bg-white text-green-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Activas
                </button>
                <button
                  onClick={() => setFilterType('inactive')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    filterType === 'inactive'
                      ? 'bg-white text-gray-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Inactivas
                </button>
              </div>

              {/* View Mode */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'cards'
                      ? 'bg-white text-blue-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Vista de cards"
                >
                  <Grid3x3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'table'
                      ? 'bg-white text-blue-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Vista de tabla"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {filteredCooperativas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No se encontraron cooperativas
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              {searchTerm || filterType !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Aún no hay cooperativas registradas en el sistema'}
            </p>
            {!searchTerm && filterType === 'all' && (
              <button
                onClick={() => router.push('/dashboard/Admin/cooperativas/nueva')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Crear Primera Cooperativa
              </button>
            )}
          </div>
        ) : viewMode === 'cards' ? (
          /* Cards View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCooperativas.map((coop) => (
              <div
                key={coop.id}
                onClick={() => router.push(`/dashboard/Admin/cooperativas/${coop.id}`)}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-200 overflow-hidden group"
              >
                <div className="bg-linear-to-r from-blue-500 to-blue-600 p-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <button
                      onClick={(e) => handleToggleEstado(coop.id, coop.nombre, coop.activo, e)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 ${
                        coop.activo
                          ? 'bg-green-500'
                          : 'bg-gray-400'
                      }`}
                      title={coop.activo ? 'Desactivar cooperativa' : 'Activar cooperativa'}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          coop.activo ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {coop.nombre}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    <span className="font-medium">RUC:</span> {coop.ruc}
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Bus className="w-4 h-4 text-orange-600" />
                        <p className="text-2xl font-bold text-orange-600">{coop.cantidadBuses}</p>
                      </div>
                      <p className="text-xs text-gray-500">Buses</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-purple-600" />
                        <p className="text-2xl font-bold text-purple-600">{coop.cantidadPersonal}</p>
                      </div>
                      <p className="text-xs text-gray-500">Personal</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button className="w-full bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white">
                      <Eye className="w-4 h-4" />
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cooperativa
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      RUC
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Buses
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Personal
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCooperativas.map((coop) => (
                    <tr key={coop.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{coop.nombre}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{coop.ruc}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-semibold text-orange-600">{coop.cantidadBuses}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-semibold text-purple-600">{coop.cantidadPersonal}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={(e) => handleToggleEstado(coop.id, coop.nombre, coop.activo, e)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            coop.activo
                              ? 'bg-green-600 focus:ring-green-500'
                              : 'bg-gray-300 focus:ring-gray-400'
                          }`}
                          title={coop.activo ? 'Desactivar cooperativa' : 'Activar cooperativa'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              coop.activo ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => router.push(`/dashboard/Admin/cooperativas/${coop.id}`)}
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Ver Detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results count */}
        {filteredCooperativas.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Mostrando {filteredCooperativas.length} de {cooperativas.length} cooperativas
          </div>
        )}
      </div>
    </div>
  );
}
