'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { useAuth } from '@/app/context/AuthContext';
import { useCooperativaConfig } from '@/app/context/CooperativaConfigContext';
import DisponibilidadPanel from '@/app/components/frecuencias/DisponibilidadPanel';
import ConfiguracionFrecuenciasModal from '@/app/components/frecuencias/ConfiguracionFrecuenciasModal';
import GenerarInteligenteModal from '@/app/components/frecuencias/GenerarInteligenteModal';
import ExportarFrecuenciasModal from '@/app/components/frecuencias/ExportarFrecuenciasModal';
import {
  Clock,
  ArrowLeft,
  BarChart3,
  Settings,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  List,
  AlertTriangle,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
} from 'lucide-react';
import { 
  frecuenciasAdminApi, 
  rutasAdminApi,
  busApi,
  cooperativaTerminalesApi,
  getToken,
  type FrecuenciaViaje,
  type CreateFrecuenciaRequest,
  type ParadaFrecuencia,
  type RutaResponse,
  type BusDetailResponse,
  type TerminalAsignadoCooperativa
} from '@/lib/api';

const DIAS_SEMANA = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

export default function FrecuenciasCooperativaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { styles, cooperativaConfig } = useCooperativaConfig();

  const [frecuencias, setFrecuencias] = useState<FrecuenciaViaje[]>([]);
  const [rutas, setRutas] = useState<RutaResponse[]>([]);
  const [buses, setBuses] = useState<BusDetailResponse[]>([]);
  const [terminalesCooperativa, setTerminalesCooperativa] = useState<TerminalAsignadoCooperativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showGenerarInteligenteModal, setShowGenerarInteligenteModal] = useState(false);
  const [showExportarModal, setShowExportarModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'frecuencias' | 'disponibilidad' | 'configuracion'>('frecuencias');
  const [editingFrecuencia, setEditingFrecuencia] = useState<FrecuenciaViaje | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterBusId, setFilterBusId] = useState<number | null>(null);
  
  // Filtros adicionales para la lista de frecuencias
  const [filterOrigen, setFilterOrigen] = useState<string>('');
  const [filterDestino, setFilterDestino] = useState<string>('');
  const [filterDia, setFilterDia] = useState<string>('');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filtros para el select de rutas en el modal
  const [filtroTipoRuta, setFiltroTipoRuta] = useState<'TODAS' | 'INTERPROVINCIAL' | 'INTRAPROVINCIAL'>('TODAS');
  const [filtroOrigenId, setFiltroOrigenId] = useState<number | null>(null);
  const [filtroDestinoId, setFiltroDestinoId] = useState<number | null>(null);

  const [formData, setFormData] = useState<CreateFrecuenciaRequest>({
    busId: 0,
    rutaId: 0,
    horaSalida: '06:00',
    horaLlegadaEstimada: '14:00',
    diasOperacion: DIAS_SEMANA.join(','),
    precioBase: 0,
    asientosDisponibles: 40,
    observaciones: '',
    paradas: [],
  });

  const [nuevaParada, setNuevaParada] = useState<ParadaFrecuencia>({
    orden: 1,
    nombreParada: '',
    direccion: '',
    tiempoLlegada: '06:00',
    tiempoEsperaMinutos: 5,
    precioDesdeOrigen: 0,
    observaciones: '',
    permiteAbordaje: true,
    permiteDescenso: true,
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token || !user?.cooperativaId) {
        router.push('/login');
        return;
      }

      // Cargar frecuencias de la cooperativa
      const frecuenciasData = await frecuenciasAdminApi.getByCooperativa(user.cooperativaId, token);
      setFrecuencias(frecuenciasData);

      // Cargar terminales asignados a la cooperativa
      const terminalesData = await cooperativaTerminalesApi.getTerminales(user.cooperativaId, token);
      setTerminalesCooperativa(terminalesData);

      // Obtener IDs de terminales de la cooperativa
      const terminalIds = terminalesData.map(t => t.terminalId);

      // Cargar rutas y filtrar solo las que tienen terminales asignados a la cooperativa
      const rutasData = await rutasAdminApi.getAll('activas', undefined, token);
      const rutasFiltradas = rutasData.filter(ruta => 
        (ruta.terminalOrigenId && terminalIds.includes(ruta.terminalOrigenId)) ||
        (ruta.terminalDestinoId && terminalIds.includes(ruta.terminalDestinoId))
      );
      setRutas(rutasFiltradas);

      // Cargar buses de la cooperativa
      const busesData = await busApi.list(user.cooperativaId, token);
      setBuses(busesData);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (frecuencia?: FrecuenciaViaje) => {
    // Resetear filtros al abrir el modal
    setFiltroTipoRuta('TODAS');
    setFiltroOrigenId(null);
    setFiltroDestinoId(null);

    if (frecuencia) {
      setEditingFrecuencia(frecuencia);
      setFormData({
        busId: frecuencia.busId,
        rutaId: frecuencia.rutaId,
        horaSalida: frecuencia.horaSalida,
        horaLlegadaEstimada: frecuencia.horaLlegadaEstimada || '',
        diasOperacion: frecuencia.diasOperacion,
        precioBase: frecuencia.precioBase || 0,
        asientosDisponibles: frecuencia.asientosDisponibles || 40,
        observaciones: frecuencia.observaciones || '',
        paradas: frecuencia.paradas || [],
      });
    } else {
      setEditingFrecuencia(null);
      setFormData({
        busId: 0,
        rutaId: 0,
        horaSalida: '06:00',
        horaLlegadaEstimada: '14:00',
        diasOperacion: DIAS_SEMANA.join(','),
        precioBase: 0,
        asientosDisponibles: 40,
        observaciones: '',
        paradas: [],
      });
    }
    setShowModal(true);
  };

  // Función para filtrar y ordenar rutas
  const rutasFiltradas = rutas
    .filter(ruta => {
      // Filtrar por tipo de ruta
      if (filtroTipoRuta !== 'TODAS' && ruta.tipoRuta !== filtroTipoRuta) {
        return false;
      }
      // Filtrar por origen
      if (filtroOrigenId && ruta.terminalOrigenId !== filtroOrigenId) {
        return false;
      }
      // Filtrar por destino
      if (filtroDestinoId && ruta.terminalDestinoId !== filtroDestinoId) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre)); // Ordenar alfabéticamente

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getToken();
      if (!token) return;

      if (editingFrecuencia) {
        await frecuenciasAdminApi.update(editingFrecuencia.id, formData, token);
      } else {
        await frecuenciasAdminApi.create(formData, token);
      }

      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Error al guardar frecuencia:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta frecuencia?')) return;

    try {
      const token = getToken();
      if (!token) return;

      await frecuenciasAdminApi.delete(id, token);
      loadData();
    } catch (err) {
      console.error('Error al eliminar frecuencia:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const handleAddParada = () => {
    const paradas = formData.paradas || [];
    const maxOrden = paradas.length > 0 ? Math.max(...paradas.map(p => p.orden)) : 0;
    
    const paradaToAdd = { ...nuevaParada, orden: maxOrden + 1 };
    setFormData({ ...formData, paradas: [...paradas, paradaToAdd] });
    
    setNuevaParada({
      orden: maxOrden + 2,
      nombreParada: '',
      direccion: '',
      tiempoLlegada: nuevaParada.tiempoLlegada,
      tiempoEsperaMinutos: 5,
      precioDesdeOrigen: 0,
      observaciones: '',
      permiteAbordaje: true,
      permiteDescenso: true,
    });
  };

  const handleRemoveParada = (orden: number) => {
    const paradas = (formData.paradas || []).filter(p => p.orden !== orden);
    setFormData({ ...formData, paradas });
  };

  const toggleDia = (dia: string) => {
    const dias = formData.diasOperacion.split(',').filter(d => d);
    const index = dias.indexOf(dia);
    
    if (index > -1) {
      dias.splice(index, 1);
    } else {
      dias.push(dia);
    }
    
    setFormData({ ...formData, diasOperacion: dias.join(',') });
  };

  // Obtener lista única de orígenes y destinos de las frecuencias
  const origenesUnicos = [...new Set(frecuencias.map(f => f.rutaOrigen).filter(Boolean))].sort();
  const destinosUnicos = [...new Set(frecuencias.map(f => f.rutaDestino).filter(Boolean))].sort();

  // Filtrar frecuencias
  const frecuenciasFiltradas = frecuencias.filter(f => {
    // Filtro por bus
    if (filterBusId && f.busId !== filterBusId) return false;
    // Filtro por origen
    if (filterOrigen && f.rutaOrigen !== filterOrigen) return false;
    // Filtro por destino
    if (filterDestino && f.rutaDestino !== filterDestino) return false;
    // Filtro por día de operación
    if (filterDia && !f.diasOperacion.includes(filterDia)) return false;
    return true;
  });

  // Paginación
  const totalPages = Math.ceil(frecuenciasFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const frecuenciasPaginadas = frecuenciasFiltradas.slice(startIndex, endIndex);

  // Resetear página cuando cambian los filtros
  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    setter(value);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['ADMIN']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando frecuencias...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['ADMIN']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => router.push('/dashboard/Cooperativa/Admin')}
                  className="hover:opacity-80 mb-2 flex items-center gap-1"
                  style={{ color: styles.primary }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al Dashboard
                </button>
                <div className="flex items-center gap-2">
                  <Clock className="w-6 h-6" style={{ color: styles.primary }} />
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Frecuencias</h1>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {user?.cooperativaNombre}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowExportarModal(true)}
                  className="border px-4 py-2 rounded-lg transition-colors flex items-center gap-2 hover:bg-gray-50"
                  style={{ borderColor: styles.primary, color: styles.primary }}
                  title="Exportar frecuencias"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
                <button
                  onClick={() => setShowGenerarInteligenteModal(true)}
                  className="text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  style={{ backgroundColor: styles.secondary || '#6366f1' }}
                  title="Generar frecuencias"
                >
                  <Sparkles className="w-4 h-4" />
                  Generar Frecuencias
                </button>
                <button
                  onClick={() => handleOpenModal()}
                  className="text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  style={{ backgroundColor: styles.primary }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.primaryDark}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.primary}
                >
                  <Plus className="w-4 h-4" />
                  Nueva Frecuencia
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-4 border-b">
              <button
                onClick={() => setActiveTab('frecuencias')}
                className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition-colors ${
                  activeTab === 'frecuencias'
                    ? 'text-gray-900 border-b-2 font-semibold'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                style={activeTab === 'frecuencias' ? { borderBottomColor: styles.primary } : {}}
              >
                <List className="w-4 h-4" />
                Frecuencias
              </button>
              <button
                onClick={() => setActiveTab('disponibilidad')}
                className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition-colors ${
                  activeTab === 'disponibilidad'
                    ? 'text-gray-900 border-b-2 font-semibold'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                style={activeTab === 'disponibilidad' ? { borderBottomColor: styles.primary } : {}}
              >
                <BarChart3 className="w-4 h-4" />
                Disponibilidad
              </button>
              <button
                onClick={() => setActiveTab('configuracion')}
                className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition-colors ${
                  activeTab === 'configuracion'
                    ? 'text-gray-900 border-b-2 font-semibold'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                style={activeTab === 'configuracion' ? { borderBottomColor: styles.primary } : {}}
              >
                <Settings className="w-4 h-4" />
                Configuración
              </button>
            </div>
          </div>

          {/* Panel de disponibilidad */}
          {activeTab === 'disponibilidad' && user?.cooperativaId && (
            <div className="mb-6">
              <DisponibilidadPanel cooperativaId={user.cooperativaId} />
            </div>
          )}

          {/* Panel de configuración */}
          {activeTab === 'configuracion' && user?.cooperativaId && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <ConfiguracionFrecuenciasModal
                cooperativaId={user.cooperativaId}
                isOpen={true}
                onClose={() => setActiveTab('frecuencias')}
                isEmbedded={true}
              />
            </div>
          )}

          {/* Contenido de Frecuencias */}
          {activeTab === 'frecuencias' && (
            <>
              {/* Filtros */}
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filtros</span>
                  {(filterBusId || filterOrigen || filterDestino || filterDia) && (
                    <button
                      onClick={() => {
                        setFilterBusId(null);
                        setFilterOrigen('');
                        setFilterDestino('');
                        setFilterDia('');
                        setCurrentPage(1);
                      }}
                      className="ml-auto text-xs text-gray-500 hover:text-gray-700"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Filtro por Bus */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Bus</label>
                    <select
                      value={filterBusId || ''}
                      onChange={(e) => handleFilterChange(setFilterBusId, e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 coop-input-focus"
                    >
                      <option value="">Todos los buses</option>
                      {buses.map(bus => (
                        <option key={bus.id} value={bus.id}>{bus.placa}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Filtro por Origen */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Origen</label>
                    <select
                      value={filterOrigen}
                      onChange={(e) => handleFilterChange(setFilterOrigen, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 coop-input-focus"
                    >
                      <option value="">Todos los orígenes</option>
                      {origenesUnicos.map(origen => (
                        <option key={origen} value={origen}>{origen}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Filtro por Destino */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Destino</label>
                    <select
                      value={filterDestino}
                      onChange={(e) => handleFilterChange(setFilterDestino, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 coop-input-focus"
                    >
                      <option value="">Todos los destinos</option>
                      {destinosUnicos.map(destino => (
                        <option key={destino} value={destino}>{destino}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Filtro por Día de Operación */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Día de Operación</label>
                    <select
                      value={filterDia}
                      onChange={(e) => handleFilterChange(setFilterDia, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 coop-input-focus"
                    >
                      <option value="">Todos los días</option>
                      {DIAS_SEMANA.map(dia => (
                        <option key={dia} value={dia}>{dia}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Indicador de resultados */}
                <div className="mt-3 text-xs text-gray-500">
                  Mostrando {frecuenciasPaginadas.length} de {frecuenciasFiltradas.length} frecuencias
                  {frecuenciasFiltradas.length !== frecuencias.length && ` (${frecuencias.length} totales)`}
                </div>
              </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Lista de Frecuencias */}
          <div className="space-y-4">
            {frecuenciasFiltradas.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No hay frecuencias que coincidan con los filtros</p>
                <button
                  onClick={() => {
                    setFilterBusId(null);
                    setFilterOrigen('');
                    setFilterDestino('');
                    setFilterDia('');
                  }}
                  className="mt-4 hover:opacity-80"
                  style={{ color: styles.primary }}
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              frecuenciasPaginadas.map((frecuencia) => (
                <div key={frecuencia.id} className="bg-white rounded-lg shadow p-6">
                  {/* Cabecera */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span 
                          className="px-3 py-1 rounded font-medium"
                          style={{ 
                            backgroundColor: styles.primaryLight || '#dbeafe', 
                            color: styles.primaryDark || '#1e40af' 
                          }}
                        >
                          {frecuencia.busPlaca}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900">{frecuencia.rutaNombre}</h3>
                        {frecuencia.tipoFrecuencia && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            frecuencia.tipoFrecuencia === 'INTERPROVINCIAL'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-cyan-100 text-cyan-700'
                          }`}>
                            {frecuencia.tipoFrecuencia === 'INTERPROVINCIAL' ? 'Interprovincial' : 'Intraprovincial'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {frecuencia.terminalOrigenNombre || frecuencia.rutaOrigen} → {frecuencia.terminalDestinoNombre || frecuencia.rutaDestino}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(frecuencia)}
                        className="hover:opacity-80 px-3 py-1 rounded flex items-center gap-1"
                        style={{ color: styles.primary }}
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(frecuencia.id)}
                        className="text-red-600 hover:text-red-800 px-3 py-1 rounded flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {/* Información */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 bg-gray-50 p-4 rounded">
                    <div>
                      <p className="text-xs text-gray-500 font-bold">Salida</p>
                      <p className="font-semibold text-gray-900">{frecuencia.horaSalida}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold">Llegada Estimada</p>
                      <p className="font-semibold text-gray-900">{frecuencia.horaLlegadaEstimada || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold">Precio Base</p>
                      <p className="font-semibold text-gray-900">${frecuencia.precioBase?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold">Asientos</p>
                      <p className="font-semibold text-gray-900">{frecuencia.asientosDisponibles || 40}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold">Descanso Mín.</p>
                      <p className="font-semibold text-gray-900">{frecuencia.tiempoMinimoEsperaMinutos || 30} min</p>
                    </div>
                  </div>

                  {/* Días de operación */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Días de Operación:</p>
                    <div className="flex flex-wrap gap-2">
                      {frecuencia.diasOperacion.split(',').map(dia => (
                        <span 
                          key={dia} 
                          className="px-3 py-1 rounded text-xs font-medium"
                          style={{ 
                            backgroundColor: styles.primaryLight || '#dcfce7', 
                            color: styles.primaryDark || '#166534' 
                          }}
                        >
                          {dia}
                        </span>
                      ))}
                    </div>
                  </div>

                  {frecuencia.paradas && frecuencia.paradas.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-2">Paradas ({frecuencia.paradas.length}):</p>
                      <div className="space-y-2">
                        {frecuencia.paradas.map((parada) => (
                          <div 
                            key={parada.id} 
                            className="flex items-center gap-4 p-3 bg-gray-50 rounded border-l-4"
                            style={{ borderLeftColor: styles.primary }}
                          >
                            <div 
                              className="w-8 h-8 text-white rounded-full flex items-center justify-center font-bold text-sm"
                              style={{ backgroundColor: styles.primary }}
                            >
                              {parada.orden}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{parada.nombreParada}</p>
                              {parada.direccion && <p className="text-xs text-gray-600">{parada.direccion}</p>}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">{parada.tiempoLlegada || 'N/A'}</p>
                              <p className="text-xs text-gray-500">${parada.precioDesdeOrigen?.toFixed(2) || '0.00'}</p>
                            </div>
                            <div className="flex gap-2">
                              {parada.permiteAbordaje && (
                                <span 
                                  className="text-xs px-2 py-0.5 rounded"
                                  style={{ 
                                    backgroundColor: styles.primaryLight || '#dcfce7', 
                                    color: styles.primaryDark || '#166534' 
                                  }}
                                >
                                  Subir
                                </span>
                              )}
                              {parada.permiteDescenso && (
                                <span className="text-blue-600 text-xs bg-blue-50 px-2 py-0.5 rounded">Bajar</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          {/* Footer de Paginación */}
          {frecuenciasFiltradas.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4 mt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Info de página */}
                <div className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages} ({frecuenciasFiltradas.length} frecuencias)
                </div>
                
                {/* Controles centrales */}
                <div className="flex items-center gap-2">
                  {/* Botón anterior */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  
                  {/* Números de página */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                          style={currentPage === pageNum ? { backgroundColor: styles.primary } : {}}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Botón siguiente */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                
                {/* Selector de items por página */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Mostrar:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 border border-gray-300 rounded-lg text-sm text-gray-900 coop-input-focus"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-gray-600">por página</span>
                </div>
              </div>
            </div>
          )}
            </>
          )}

          {/* Modal - Similar al de SuperAdmin pero adaptado */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <div 
                    className="text-white p-6 rounded-t-lg flex items-center gap-2"
                    style={{ background: `linear-gradient(135deg, ${styles.primary} 0%, ${styles.primaryDark} 100%)` }}
                  >
                    {editingFrecuencia ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    <h2 className="text-xl font-bold">
                      {editingFrecuencia ? 'Editar Frecuencia' : 'Nueva Frecuencia'}
                    </h2>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Formulario similar al de SuperAdmin */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">Bus *</label>
                          <select
                            value={formData.busId}
                            onChange={(e) => setFormData({ ...formData, busId: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 coop-input-focus"
                            required
                          >
                            <option value={0}>Seleccione un bus</option>
                            {buses.map(bus => (
                              <option key={bus.id} value={bus.id}>
                                {bus.placa} - {bus.chasisMarca || ''} {bus.carroceriaMarca || ''} ({bus.capacidadAsientos} asientos)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Sección de Ruta con filtros */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-900 mb-2">Ruta *</label>
                          
                          {/* Filtros de ruta */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de Ruta</label>
                              <select
                                value={filtroTipoRuta}
                                onChange={(e) => {
                                  setFiltroTipoRuta(e.target.value as 'TODAS' | 'INTERPROVINCIAL' | 'INTRAPROVINCIAL');
                                  setFormData({ ...formData, rutaId: 0 });
                                }}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900 coop-input-focus"
                              >
                                <option value="TODAS">Todas</option>
                                <option value="INTERPROVINCIAL">Interprovincial</option>
                                <option value="INTRAPROVINCIAL">Intraprovincial</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Terminal Origen</label>
                              <select
                                value={filtroOrigenId || ''}
                                onChange={(e) => {
                                  setFiltroOrigenId(e.target.value ? Number(e.target.value) : null);
                                  setFormData({ ...formData, rutaId: 0 });
                                }}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900 coop-input-focus"
                              >
                                <option value="">Todos</option>
                                {terminalesCooperativa
                                  .sort((a, b) => a.nombre.localeCompare(b.nombre))
                                  .map(terminal => (
                                    <option key={terminal.terminalId} value={terminal.terminalId}>
                                      {terminal.nombre} - {terminal.canton}
                                    </option>
                                  ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Terminal Destino</label>
                              <select
                                value={filtroDestinoId || ''}
                                onChange={(e) => {
                                  setFiltroDestinoId(e.target.value ? Number(e.target.value) : null);
                                  setFormData({ ...formData, rutaId: 0 });
                                }}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900 coop-input-focus"
                              >
                                <option value="">Todos</option>
                                {terminalesCooperativa
                                  .sort((a, b) => a.nombre.localeCompare(b.nombre))
                                  .map(terminal => (
                                    <option key={terminal.terminalId} value={terminal.terminalId}>
                                      {terminal.nombre} - {terminal.canton}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>

                          {/* Select de ruta filtrada */}
                          <select
                            value={formData.rutaId}
                            onChange={(e) => setFormData({ ...formData, rutaId: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 coop-input-focus"
                            required
                          >
                            <option value={0}>Seleccione una ruta ({rutasFiltradas.length} disponibles)</option>
                            {rutasFiltradas.map(ruta => (
                              <option key={ruta.id} value={ruta.id}>
                                {ruta.nombre} ({ruta.origen} → {ruta.destino}) {ruta.tipoRuta ? `[${ruta.tipoRuta}]` : ''}
                              </option>
                            ))}
                          </select>
                          {rutasFiltradas.length === 0 && rutas.length > 0 && (
                            <p className="text-xs text-amber-600 mt-1">
                              No hay rutas que coincidan con los filtros seleccionados
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1">Hora Salida *</label>
                            <input
                              type="time"
                              value={formData.horaSalida}
                              onChange={(e) => setFormData({ ...formData, horaSalida: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 coop-input-focus"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1">Hora Llegada</label>
                            <input
                              type="time"
                              value={formData.horaLlegadaEstimada}
                              onChange={(e) => setFormData({ ...formData, horaLlegadaEstimada: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 coop-input-focus"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1">Precio Base ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.precioBase}
                              onChange={(e) => setFormData({ ...formData, precioBase: Number(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 coop-input-focus"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1">Asientos Disponibles</label>
                            <input
                              type="number"
                              value={formData.asientosDisponibles}
                              onChange={(e) => setFormData({ ...formData, asientosDisponibles: Number(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 coop-input-focus"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Días de Operación */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Días de Operación</h3>
                      <div className="flex flex-wrap gap-2">
                        {DIAS_SEMANA.map(dia => {
                          const isSelected = formData.diasOperacion.split(',').includes(dia);
                          return (
                            <button
                              key={dia}
                              type="button"
                              onClick={() => toggleDia(dia)}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                isSelected
                                  ? 'text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                              style={isSelected ? { backgroundColor: styles.primary } : {}}
                            >
                              {dia.substring(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Paradas */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Paradas del Trayecto</h3>
                      
                      {formData.paradas && formData.paradas.length > 0 && (
                        <div className="mb-4 space-y-2">
                          {formData.paradas.map((parada) => (
                            <div key={parada.orden} className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
                              <span 
                                className="w-8 h-8 text-white rounded-full flex items-center justify-center font-bold text-sm"
                                style={{ backgroundColor: styles.primary }}
                              >
                                {parada.orden}
                              </span>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{parada.nombreParada}</p>
                                <p className="text-xs text-gray-600">
                                  {parada.tiempoLlegada} | ${parada.precioDesdeOrigen?.toFixed(2)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveParada(parada.orden)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-900 mb-3">Agregar nueva parada:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Nombre de la parada *"
                            value={nuevaParada.nombreParada}
                            onChange={(e) => setNuevaParada({ ...nuevaParada, nombreParada: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                          />
                          <input
                            type="text"
                            placeholder="Dirección"
                            value={nuevaParada.direccion}
                            onChange={(e) => setNuevaParada({ ...nuevaParada, direccion: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                          />
                          <input
                            type="time"
                            value={nuevaParada.tiempoLlegada}
                            onChange={(e) => setNuevaParada({ ...nuevaParada, tiempoLlegada: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Precio desde origen"
                            value={nuevaParada.precioDesdeOrigen}
                            onChange={(e) => setNuevaParada({ ...nuevaParada, precioDesdeOrigen: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                          />
                          <div className="md:col-span-2 flex gap-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={nuevaParada.permiteAbordaje}
                                onChange={(e) => setNuevaParada({ ...nuevaParada, permiteAbordaje: e.target.checked })}
                                className="w-4 h-4"
                              />
                              <span className="text-sm text-gray-900">Permite Abordaje</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={nuevaParada.permiteDescenso}
                                onChange={(e) => setNuevaParada({ ...nuevaParada, permiteDescenso: e.target.checked })}
                                className="w-4 h-4"
                              />
                              <span className="text-sm text-gray-900">Permite Descenso</span>
                            </label>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddParada}
                          disabled={!nuevaParada.nombreParada}
                          className="mt-3 w-full text-white px-4 py-2 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2 transition-colors"
                          style={{ 
                            backgroundColor: nuevaParada.nombreParada ? styles.primary : undefined 
                          }}
                          onMouseEnter={(e) => {
                            if (nuevaParada.nombreParada) {
                              e.currentTarget.style.backgroundColor = styles.primaryDark;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (nuevaParada.nombreParada) {
                              e.currentTarget.style.backgroundColor = styles.primary;
                            }
                          }}
                        >
                          <Plus className="w-4 h-4" />
                          Agregar Parada
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="text-white px-6 py-2 rounded-lg transition-colors"
                      style={{ backgroundColor: styles.primary }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.primaryDark}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.primary}
                    >
                      {editingFrecuencia ? 'Actualizar' : 'Crear'} Frecuencia
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal de generación inteligente */}
          {showGenerarInteligenteModal && user?.cooperativaId && (
            <GenerarInteligenteModal
              cooperativaId={user.cooperativaId}
              isOpen={showGenerarInteligenteModal}
              onClose={() => setShowGenerarInteligenteModal(false)}
              onGenerated={() => {
                setShowGenerarInteligenteModal(false);
                loadData();
              }}
            />
          )}

          {/* Modal de exportación */}
          <ExportarFrecuenciasModal
            isOpen={showExportarModal}
            onClose={() => setShowExportarModal(false)}
            frecuencias={frecuencias}
            buses={buses}
            cooperativaNombre={cooperativaConfig?.nombre || user?.cooperativaNombre || 'Cooperativa'}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
