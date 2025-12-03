'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useCooperativaConfig } from '@/app/context/CooperativaConfigContext';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { busApi, BusDetailResponse, CreateBusRequest, UpdateBusRequest, getToken } from '@/lib/api';
import { Grid3x3, Table, Upload, Bus as BusIcon, Armchair, Edit, Trash2, Users } from 'lucide-react';
import AsignarChoferesModal from '@/app/components/AsignarChoferesModal';

type ViewMode = 'table' | 'cards';

export default function BusesManagementPage() {
  const { user } = useAuth();
  const { styles } = useCooperativaConfig();
  const router = useRouter();
  const [buses, setBuses] = useState<BusDetailResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showChoferesModal, setShowChoferesModal] = useState(false);
  const [selectedBus, setSelectedBus] = useState<BusDetailResponse | null>(null);
  const [editingBus, setEditingBus] = useState<BusDetailResponse | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<CreateBusRequest>({
    placa: '',
    numeroInterno: '',
    chasisMarca: '',
    carroceriaMarca: '',
    capacidadAsientos: 40,
    tieneDosNiveles: false,
    capacidadPiso1: 40,
    capacidadPiso2: 0,
    estado: 'DISPONIBLE',
  });

  useEffect(() => {
    loadBuses();
  }, [user]);

  const loadBuses = async () => {
    if (!user?.cooperativaId) {
      setLoading(false);
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        setLoading(false);
        return;
      }

      const data = await busApi.list(user.cooperativaId, token);
      setBuses(data);
      setError(null);
    } catch (err) {
      console.error('Error al cargar buses:', err);
      setError('No se pudieron cargar los buses');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (bus?: BusDetailResponse) => {
    if (bus) {
      setEditingBus(bus);
      setFormData({
        placa: bus.placa,
        numeroInterno: bus.numeroInterno || '',
        chasisMarca: bus.chasisMarca || '',
        carroceriaMarca: bus.carroceriaMarca || '',
        capacidadAsientos: bus.capacidadAsientos,
        tieneDosNiveles: bus.tieneDosNiveles || false,
        capacidadPiso1: bus.capacidadPiso1 || bus.capacidadAsientos,
        capacidadPiso2: bus.capacidadPiso2 || 0,
        estado: bus.estado,
      });
      if (bus.fotoUrl) {
        const fullUrl = bus.fotoUrl.startsWith('http') ? bus.fotoUrl : `http://localhost:8081${bus.fotoUrl}`;
        setPhotoPreview(fullUrl);
      }
    } else {
      setEditingBus(null);
      setFormData({
        placa: '',
        numeroInterno: '',
        chasisMarca: '',
        carroceriaMarca: '',
        capacidadAsientos: 40,
        tieneDosNiveles: false,
        capacidadPiso1: 40,
        capacidadPiso2: 0,
        estado: 'DISPONIBLE',
      });
      setPhotoPreview(null);
      setPhotoFile(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBus(null);
    setPhotoPreview(null);
    setPhotoFile(null);
    setFormData({
      placa: '',
      numeroInterno: '',
      chasisMarca: '',
      carroceriaMarca: '',
      capacidadAsientos: 40,
      tieneDosNiveles: false,
      capacidadPiso1: 40,
      capacidadPiso2: 0,
      estado: 'DISPONIBLE',
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Por favor seleccione un archivo de imagen válido');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no debe superar los 5MB');
        return;
      }
      
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.cooperativaId) return;

    try {
      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      let createdOrUpdatedBus;

      if (editingBus) {
        createdOrUpdatedBus = await busApi.update(user.cooperativaId, editingBus.id, formData as UpdateBusRequest, token);
      } else {
        createdOrUpdatedBus = await busApi.create(user.cooperativaId, formData, token);
      }

      // Si hay una foto nueva, subirla
      if (photoFile && createdOrUpdatedBus) {
        await uploadBusFoto(createdOrUpdatedBus.id, photoFile, token);
      }

      await loadBuses();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el bus');
    }
  };

  const uploadBusFoto = async (busId: number, file: File, token: string) => {
    const formData = new FormData();
    formData.append('foto', file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api'}/cooperativa/${user?.cooperativaId}/buses/${busId}/foto`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Error al subir la foto');
      }
    } catch (err) {
      console.error('Error subiendo foto:', err);
      setError('Bus guardado, pero hubo un problema al subir la foto');
    }
  };

  const handleToggleActivo = async (busId: number, estadoActual: boolean, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    if (!user?.cooperativaId) return;
    
    const nuevoEstado = !estadoActual;
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    
    if (!confirm(`¿Está seguro de que desea ${accion} este bus?`)) return;

    try {
      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      await busApi.toggleActivo(user.cooperativaId, busId, nuevoEstado, token);
      await loadBuses();
    } catch (err: any) {
      setError(err.message || 'Error al cambiar el estado del bus');
    }
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'DISPONIBLE':
        return 'bg-green-100 text-green-800';
      case 'EN_SERVICIO':
        return 'bg-blue-100 text-blue-800';
      case 'MANTENIMIENTO':
        return 'bg-yellow-100 text-yellow-800';
      case 'PARADA':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['ADMIN']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div>
              <button
                onClick={() => router.back()}
                className="mb-2 flex items-center gap-2 transition-colors"
                style={{ color: styles.primary }}
                onMouseEnter={(e) => e.currentTarget.style.color = styles.primaryDark}
                onMouseLeave={(e) => e.currentTarget.style.color = styles.primary}
              >
                ← Volver
              </button>
              <h1 className="text-3xl font-bold text-gray-800">🚌 Gestión de Buses</h1>
              <p className="text-gray-600 mt-1">{user?.cooperativaNombre}</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex gap-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-2 rounded-md flex items-center gap-2 transition-colors ${
                    viewMode === 'cards'
                      ? 'text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  style={viewMode === 'cards' ? { backgroundColor: styles.primary } : undefined}
                  title="Vista de tarjetas"
                >
                  <Grid3x3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Tarjetas</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded-md flex items-center gap-2 transition-colors ${
                    viewMode === 'table'
                      ? 'text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  style={viewMode === 'table' ? { backgroundColor: styles.primary } : undefined}
                  title="Vista de tabla"
                >
                  <Table className="w-4 h-4" />
                  <span className="hidden sm:inline">Tabla</span>
                </button>
              </div>

              <button
                onClick={() => handleOpenModal()}
                className="text-white px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap"
                style={{ backgroundColor: styles.primary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.primaryDark}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.primary}
              >
                + Nuevo Bus
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">⚠️ {error}</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <p className="text-gray-600">Cargando buses...</p>
            </div>
          )}

          {/* Cards View */}
          {!loading && buses.length > 0 && viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {buses.map((bus) => (
                <div
                  key={bus.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
                >
                  {/* Foto del Bus */}
                  <div className="mb-4">
                    {bus.fotoUrl ? (
                      <img
                        src={bus.fotoUrl.startsWith('http') ? bus.fotoUrl : `http://localhost:8081${bus.fotoUrl}`}
                        alt={`Bus ${bus.placa}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                        <BusIcon className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Info del Bus */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">{bus.placa}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadgeColor(
                          bus.estado
                        )}`}
                      >
                        {bus.estado}
                      </span>
                    </div>

                    {bus.numeroInterno && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">N° Interno:</span> {bus.numeroInterno}
                      </div>
                    )}

                    {(bus.chasisMarca || bus.carroceriaMarca) && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Modelo:</span>{' '}
                        {bus.chasisMarca || bus.carroceriaMarca}
                      </div>
                    )}

                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Capacidad:</span> {bus.capacidadAsientos} asientos
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">Estado:</span>
                      <span
                        className="px-2 py-0.5 text-xs font-semibold rounded-full"
                        style={bus.activo 
                          ? { backgroundColor: styles.primaryLighter, color: styles.primaryDark }
                          : { backgroundColor: '#f3f4f6', color: '#374151' }
                        }
                      >
                        {bus.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedBus(bus);
                          setShowChoferesModal(true);
                        }}
                        className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Asignar choferes"
                      >
                        <Users className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/Cooperativa/Admin/buses/asientos/${bus.id}`)}
                        className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Gestionar asientos"
                      >
                        <Armchair className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleOpenModal(bus)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: styles.primary }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = styles.primaryLighter; e.currentTarget.style.color = styles.primaryDark; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = styles.primary; }}
                        title="Editar bus"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <button
                      onClick={(e) => handleToggleActivo(bus.id, bus.activo, e)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        bus.activo
                          ? 'focus:ring-opacity-50'
                          : 'bg-gray-300 focus:ring-gray-400'
                      }`}
                      style={bus.activo ? { backgroundColor: styles.primary } : undefined}
                      title={bus.activo ? 'Desactivar bus' : 'Activar bus'}
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
          )}

          {/* Table View */}
          {!loading && buses.length > 0 && viewMode === 'table' && (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 relative">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="sticky left-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Bus
                    </th>
                    <th className="sticky left-[112px] z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Placa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nº Interno
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
                  {buses.map((bus) => (
                    <tr key={bus.id} className="hover:bg-gray-50">
                      <td className="sticky left-0 z-10 bg-white px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        {bus.fotoUrl ? (
                          <img
                            src={bus.fotoUrl.startsWith('http') ? bus.fotoUrl : `http://localhost:8081${bus.fotoUrl}`}
                            alt={`Bus ${bus.placa}`}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <BusIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="sticky left-[112px] z-10 bg-white px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        <div className="text-sm font-medium text-gray-900">{bus.placa}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{bus.numeroInterno || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {bus.chasisMarca || bus.carroceriaMarca || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{bus.capacidadAsientos} asientos</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoBadgeColor(
                            bus.estado
                          )}`}
                        >
                          {bus.estado}
                        </span>
                      </td>
                      <td className="sticky right-0 z-10 bg-white px-6 py-4 whitespace-nowrap border-l border-gray-200">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => {
                              setSelectedBus(bus);
                              setShowChoferesModal(true);
                            }}
                            className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Asignar choferes"
                          >
                            <Users className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/Cooperativa/Admin/buses/asientos/${bus.id}`)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Configurar asientos"
                          >
                            <Armchair className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(bus)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: styles.primary }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = styles.primaryLighter; e.currentTarget.style.color = styles.primaryDark; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = styles.primary; }}
                            title="Editar bus"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => handleToggleActivo(bus.id, bus.activo, e)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                              bus.activo
                                ? 'focus:ring-opacity-50'
                                : 'bg-gray-300 focus:ring-gray-400'
                            }`}
                            style={bus.activo ? { backgroundColor: styles.primary } : undefined}
                            title={bus.activo ? 'Desactivar bus' : 'Activar bus'}
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

          {/* Empty State */}
          {!loading && buses.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">🚌</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No hay buses registrados</h3>
              <p className="text-gray-600 mb-6">Comienza agregando tu primer bus</p>
              <button
                onClick={() => handleOpenModal()}
                className="text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                style={{ backgroundColor: styles.primary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.primaryDark}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.primary}
              >
                + Agregar Primer Bus
              </button>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {editingBus ? 'Editar Bus' : 'Nuevo Bus'}
                </h2>

                <form onSubmit={handleSubmit}>
                  {/* Photo Upload Section */}
                  <div className="mb-6 flex flex-col items-center">
                    <div className="relative mb-4">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Vista previa"
                          className="w-64 h-40 rounded-lg object-cover border-4"
                          style={{ borderColor: styles.primary }}
                        />
                      ) : (
                        <div className="w-64 h-40 rounded-lg bg-gray-200 flex flex-col items-center justify-center border-4 border-gray-300">
                          <BusIcon className="w-16 h-16 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">Sin foto</span>
                        </div>
                      )}
                      <label
                        htmlFor="bus-photo-upload"
                        className="absolute bottom-2 right-2 p-3 rounded-full cursor-pointer transition-colors shadow-lg"
                        style={{ backgroundColor: styles.primary }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.primaryDark}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.primary}
                      >
                        <Upload className="w-5 h-5 text-white" />
                        <input
                          id="bus-photo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Foto del bus (opcional) - Máximo 5MB
                      <br />
                      Formatos: JPG, PNG, GIF
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Placa <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.placa}
                        onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg coop-input-focus text-gray-900"
                        placeholder="ABC-123"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número Interno
                      </label>
                      <input
                        type="text"
                        value={formData.numeroInterno}
                        onChange={(e) => setFormData({ ...formData, numeroInterno: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg coop-input-focus text-gray-900"
                        placeholder="001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Marca Chasis
                      </label>
                      <input
                        type="text"
                        value={formData.chasisMarca}
                        onChange={(e) => setFormData({ ...formData, chasisMarca: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg coop-input-focus text-gray-900"
                        placeholder="Mercedes-Benz"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Marca Carrocería
                      </label>
                      <input
                        type="text"
                        value={formData.carroceriaMarca}
                        onChange={(e) => setFormData({ ...formData, carroceriaMarca: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg coop-input-focus text-gray-900"
                        placeholder="Carrocerías XYZ"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.tieneDosNiveles}
                          onChange={(e) => {
                            const tieneDosNiveles = e.target.checked;
                            const capacidadTotal = formData.capacidadAsientos ?? 0;
                            setFormData({
                              ...formData,
                              tieneDosNiveles,
                              capacidadPiso1: tieneDosNiveles ? Math.floor(capacidadTotal / 2) : capacidadTotal,
                              capacidadPiso2: tieneDosNiveles ? Math.ceil(capacidadTotal / 2) : 0,
                            });
                          }}
                          className="w-4 h-4 rounded coop-checkbox"
                          style={{ accentColor: styles.primary }}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          🚌 El bus tiene dos niveles (piso 1 y piso 2)
                        </span>
                      </label>
                    </div>

                    {!formData.tieneDosNiveles ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Capacidad de Asientos <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="80"
                          value={formData.capacidadAsientos}
                          onChange={(e) => {
                            const capacidad = parseInt(e.target.value) || 0;
                            setFormData({ 
                              ...formData, 
                              capacidadAsientos: capacidad,
                              capacidadPiso1: capacidad,
                              capacidadPiso2: 0,
                            });
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg coop-input-focus text-gray-900"
                        />
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Asientos Piso 1 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            max={(formData.capacidadAsientos ?? 1) - 1}
                            value={formData.capacidadPiso1}
                            onChange={(e) => {
                              const piso1 = parseInt(e.target.value) || 0;
                              setFormData({ 
                                ...formData, 
                                capacidadPiso1: piso1,
                                capacidadAsientos: piso1 + (formData.capacidadPiso2 || 0),
                              });
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg coop-input-focus text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Asientos Piso 2 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            max={(formData.capacidadAsientos ?? 1) - 1}
                            value={formData.capacidadPiso2}
                            onChange={(e) => {
                              const piso2 = parseInt(e.target.value) || 0;
                              setFormData({ 
                                ...formData, 
                                capacidadPiso2: piso2,
                                capacidadAsientos: (formData.capacidadPiso1 || 0) + piso2,
                              });
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg coop-input-focus text-gray-900"
                          />
                        </div>
                        <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            <strong>Capacidad Total:</strong> {formData.capacidadAsientos} asientos 
                            ({formData.capacidadPiso1} en piso 1 + {formData.capacidadPiso2} en piso 2)
                          </p>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg coop-input-focus text-gray-900"
                      >
                        <option value="DISPONIBLE">Disponible</option>
                        <option value="EN_SERVICIO">En Servicio</option>
                        <option value="MANTENIMIENTO">Mantenimiento</option>
                        <option value="PARADA">Parada</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-6">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 text-white rounded-lg font-semibold transition-colors"
                      style={{ backgroundColor: styles.primary }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.primaryDark}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.primary}
                    >
                      {editingBus ? 'Guardar Cambios' : 'Crear Bus'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Asignar Choferes */}
        {showChoferesModal && selectedBus && user?.cooperativaId && (
          <AsignarChoferesModal
            isOpen={showChoferesModal}
            onClose={() => {
              setShowChoferesModal(false);
              setSelectedBus(null);
            }}
            busId={selectedBus.id}
            busPlaca={selectedBus.placa}
            cooperativaId={user.cooperativaId}
            onSuccess={() => loadBuses()}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
