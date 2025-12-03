'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useCooperativaConfig } from '@/app/context/CooperativaConfigContext';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { personalApi, PersonalDetailResponse, CreatePersonalRequest, UpdatePersonalRequest, getToken } from '@/lib/api';
import { Edit, Trash2, Grid3x3, Table, User, Upload, Mail, CreditCard, Phone, FileText, X, Building2 } from 'lucide-react';
import AsignarTerminalesModal from '@/app/components/AsignarTerminalesModal';

type ViewMode = 'table' | 'cards';

export default function PersonalManagementPage() {
  const { user } = useAuth();
  const { styles } = useCooperativaConfig();
  const router = useRouter();
  const [personal, setPersonal] = useState<PersonalDetailResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showTerminalesModal, setShowTerminalesModal] = useState(false);
  const [selectedOficinista, setSelectedOficinista] = useState<PersonalDetailResponse | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<PersonalDetailResponse | null>(null);
  const [editingPersonal, setEditingPersonal] = useState<PersonalDetailResponse | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<CreatePersonalRequest>({
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    cedula: '',
    telefono: '',
    rolCooperativa: 'OFICINISTA',
    // Campos adicionales para chofer
    numeroLicencia: '',
    tipoLicencia: '',
    fechaVencimientoLicencia: '',
  });

  useEffect(() => {
    loadPersonal();
  }, [user]);

  const loadPersonal = async () => {
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

      const data = await personalApi.list(user.cooperativaId, token);
      setPersonal(data);
      setError(null);
    } catch (err) {
      console.error('Error al cargar personal:', err);
      setError('No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (person?: PersonalDetailResponse) => {
    if (person) {
      setEditingPersonal(person);
      setFormData({
        nombres: person.nombres,
        apellidos: person.apellidos,
        email: person.email,
        password: '', // No se envía en edición
        cedula: person.cedula,
        telefono: person.telefono || '',
        rolCooperativa: person.rolCooperativa,
        numeroLicencia: person.numeroLicencia || '',
        tipoLicencia: person.tipoLicencia || '',
        fechaVencimientoLicencia: person.fechaVencimientoLicencia || '',
      });
      // Si hay foto, establecer preview
      if (person.fotoUrl) {
        const fullUrl = person.fotoUrl.startsWith('http') ? person.fotoUrl : `http://localhost:8081${person.fotoUrl}`;
        setPhotoPreview(fullUrl);
      }
    } else {
      setEditingPersonal(null);
      setFormData({
        nombres: '',
        apellidos: '',
        email: '',
        password: '',
        cedula: '',
        telefono: '',
        rolCooperativa: 'OFICINISTA',
        numeroLicencia: '',
        tipoLicencia: '',
        fechaVencimientoLicencia: '',
      });
      setPhotoPreview(null);
      setPhotoFile(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPersonal(null);
    setPhotoPreview(null);
    setPhotoFile(null);
    setFormData({
      nombres: '',
      apellidos: '',
      email: '',
      password: '',
      cedula: '',
      telefono: '',
      rolCooperativa: 'OFICINISTA',
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        setError('Por favor seleccione un archivo de imagen válido');
        return;
      }
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no debe superar los 5MB');
        return;
      }
      
      setPhotoFile(file);
      
      // Crear preview
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

      let createdOrUpdatedPersonal;

      if (editingPersonal) {
        const updateData: UpdatePersonalRequest = {
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          email: formData.email,
          cedula: formData.cedula,
          telefono: formData.telefono,
          rolCooperativa: formData.rolCooperativa,
        };
        createdOrUpdatedPersonal = await personalApi.update(user.cooperativaId, editingPersonal.id, updateData, token);
      } else {
        createdOrUpdatedPersonal = await personalApi.create(user.cooperativaId, formData, token);
      }

      // Si hay una foto nueva, subirla
      if (photoFile && createdOrUpdatedPersonal) {
        await uploadPersonalPhoto(createdOrUpdatedPersonal.id, photoFile, token);
      }

      await loadPersonal();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el usuario');
    }
  };

  const uploadPersonalPhoto = async (personalId: number, file: File, token: string) => {
    const formData = new FormData();
    formData.append('foto', file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api'}/cooperativa/${user?.cooperativaId}/personal/${personalId}/foto`,
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
      // No lanzamos el error para que el usuario se cree/actualice aunque falle la foto
      setError('Usuario guardado, pero hubo un problema al subir la foto');
    }
  };

  const handleToggleActivo = async (personalId: number, estadoActual: boolean, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    if (!user?.cooperativaId) return;
    
    const nuevoEstado = !estadoActual;
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    
    if (!confirm(`¿Está seguro de que desea ${accion} este usuario?`)) return;

    try {
      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      await personalApi.delete(user.cooperativaId, personalId, token);
      await loadPersonal();
    } catch (err: any) {
      setError(err.message || 'Error al cambiar el estado del usuario');
    }
  };

  const getRolBadgeColor = (rol: string) => {
    switch (rol) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'OFICINISTA':
        return 'bg-blue-100 text-blue-800';
      case 'CHOFER':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRolName = (rol: string) => {
    switch (rol) {
      case 'ADMIN':
        return 'Administrador';
      case 'OFICINISTA':
        return 'Oficinista';
      case 'CHOFER':
        return 'Chofer';
      default:
        return rol;
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
              <h1 className="text-3xl font-bold text-gray-800">👥 Gestión de Personal</h1>
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
                + Nuevo Usuario
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
              <p className="text-gray-600">Cargando personal...</p>
            </div>
          )}

          {/* Cards View */}
          {!loading && personal.length > 0 && viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personal.map((person) => (
                <div
                  key={person.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
                >
                  {/* Photo and Name */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      {person.fotoUrl ? (
                        <img
                          src={person.fotoUrl.startsWith('http') ? person.fotoUrl : `http://localhost:8081${person.fotoUrl}`}
                          alt={`${person.nombres} ${person.apellidos}`}
                          className="w-16 h-16 rounded-full object-cover border-2"
                          style={{ borderColor: styles.primary }}
                        />
                      ) : (
                        <div 
                          className="w-16 h-16 rounded-full flex items-center justify-center border-2"
                          style={{ backgroundColor: styles.primaryLighter, borderColor: styles.primary }}
                        >
                          <User className="w-8 h-8" style={{ color: styles.primary }} />
                        </div>
                      )}
                      <div
                        className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white"
                        style={{ backgroundColor: person.activo ? styles.primary : '#9ca3af' }}
                        title={person.activo ? 'Activo' : 'Inactivo'}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {person.nombres} {person.apellidos}
                      </h3>
                      <span
                        className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getRolBadgeColor(
                          person.rolCooperativa
                        )}`}
                      >
                        {getRolName(person.rolCooperativa)}
                      </span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="truncate">{person.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CreditCard className="w-4 h-4 text-gray-500" />
                      <span>{person.cedula}</span>
                    </div>
                    {person.telefono && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{person.telefono}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenModal(person)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: styles.primary }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = styles.primaryLighter; e.currentTarget.style.color = styles.primaryDark; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = styles.primary; }}
                        title="Editar usuario"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      {person.rolCooperativa === 'CHOFER' && person.numeroLicencia && (
                        <button
                          onClick={() => {
                            setSelectedDriver(person);
                            setShowLicenseModal(true);
                          }}
                          className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Ver información de licencia"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                      )}
                      {person.rolCooperativa === 'OFICINISTA' && (
                        <button
                          onClick={() => {
                            setSelectedOficinista(person);
                            setShowTerminalesModal(true);
                          }}
                          className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Asignar terminales"
                        >
                          <Building2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    
                    <button
                      onClick={(e) => handleToggleActivo(person.id, person.activo, e)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        person.activo
                          ? 'focus:ring-opacity-50'
                          : 'bg-gray-300 focus:ring-gray-400'
                      }`}
                      style={person.activo ? { backgroundColor: styles.primary } : undefined}
                      title={person.activo ? 'Desactivar usuario' : 'Activar usuario'}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          person.activo ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {!loading && personal.length > 0 && viewMode === 'table' && (
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
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {personal.map((person) => (
                    <tr key={person.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10">
                        <div className="flex items-center gap-3">
                          {person.fotoUrl ? (
                            <img
                              src={person.fotoUrl.startsWith('http') ? person.fotoUrl : `http://localhost:8081${person.fotoUrl}`}
                              alt={`${person.nombres} ${person.apellidos}`}
                              className="w-10 h-10 rounded-full object-cover border-2"
                              style={{ borderColor: styles.primary }}
                            />
                          ) : (
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center border-2"
                              style={{ backgroundColor: styles.primaryLighter, borderColor: styles.primary }}
                            >
                              <User className="w-5 h-5" style={{ color: styles.primary }} />
                            </div>
                          )}
                          <div className="text-sm font-medium text-gray-900">
                            {person.nombres} {person.apellidos}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{person.cedula}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{person.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{person.telefono || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRolBadgeColor(
                            person.rolCooperativa
                          )}`}
                        >
                          {getRolName(person.rolCooperativa)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap sticky right-0 bg-white z-10">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleOpenModal(person)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: styles.primary }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = styles.primaryLighter; e.currentTarget.style.color = styles.primaryDark; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = styles.primary; }}
                            title="Editar usuario"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          {person.rolCooperativa === 'CHOFER' && person.numeroLicencia && (
                            <button
                              onClick={() => {
                                setSelectedDriver(person);
                                setShowLicenseModal(true);
                              }}
                              className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Ver información de licencia"
                            >
                              <FileText className="w-5 h-5" />
                            </button>
                          )}
                          {person.rolCooperativa === 'OFICINISTA' && (
                            <button
                              onClick={() => {
                                setSelectedOficinista(person);
                                setShowTerminalesModal(true);
                              }}
                              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Asignar terminales"
                            >
                              <Building2 className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleToggleActivo(person.id, person.activo, e)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                              person.activo
                                ? 'focus:ring-opacity-50'
                                : 'bg-gray-300 focus:ring-gray-400'
                            }`}
                            style={person.activo ? { backgroundColor: styles.primary } : undefined}
                            title={person.activo ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                person.activo ? 'translate-x-6' : 'translate-x-1'
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
          {!loading && personal.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No hay personal registrado</h3>
              <p className="text-gray-600 mb-6">Comienza agregando tu primer usuario</p>
              <button
                onClick={() => handleOpenModal()}
                className="text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                style={{ backgroundColor: styles.primary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.primaryDark}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.primary}
              >
                + Agregar Primer Usuario
              </button>
            </div>
          )}
        </div>

        {/* License Modal */}
        {showLicenseModal && selectedDriver && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Información de Licencia</h3>
                    <p className="text-sm text-gray-600">{selectedDriver.nombres} {selectedDriver.apellidos}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowLicenseModal(false);
                    setSelectedDriver(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium text-gray-600">Número de Licencia:</span>
                      <span className="text-sm font-semibold text-gray-900">{selectedDriver.numeroLicencia}</span>
                    </div>
                    
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium text-gray-600">Tipo de Licencia:</span>
                      <span className="text-sm font-semibold text-gray-900">{selectedDriver.tipoLicencia}</span>
                    </div>
                    
                    {selectedDriver.fechaVencimientoLicencia && (
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium text-gray-600">Fecha de Vencimiento:</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {new Date(selectedDriver.fechaVencimientoLicencia).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowLicenseModal(false);
                      setSelectedDriver(null);
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {editingPersonal ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h2>

                <form onSubmit={handleSubmit}>
                  {/* Photo Upload Section */}
                  <div className="mb-6 flex flex-col items-center">
                    <div className="relative mb-4">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Vista previa"
                          className="w-32 h-32 rounded-full object-cover border-4"
                          style={{ borderColor: styles.primary }}
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                          <User className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                      <label
                        htmlFor="photo-upload"
                        className="absolute bottom-0 right-0 text-white p-2 rounded-full cursor-pointer transition-colors shadow-lg"
                        style={{ backgroundColor: styles.primary }}
                        title="Cambiar foto"
                      >
                        <Upload className="w-5 h-5" />
                        <input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Sube una foto de perfil (opcional)<br />
                      Formatos: JPG, PNG, GIF - Máximo 5MB
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombres <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nombres}
                        onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg coop-input-focus text-gray-900"
                        placeholder="Juan Carlos"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apellidos <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.apellidos}
                        onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg coop-input-focus text-gray-900"
                        placeholder="Pérez García"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg coop-input-focus text-gray-900"
                        placeholder="usuario@cooperativa.com"
                      />
                    </div>

                    {!editingPersonal && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contraseña <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          required={!editingPersonal}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg coop-input-focus text-gray-900"
                          placeholder="••••••••"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cédula <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.cedula}
                        onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg coop-input-focus text-gray-900"
                        placeholder="1234567890"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="text"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg coop-input-focus text-gray-900"
                        placeholder="0987654321"
                      />
                    </div>

                    <div className={!editingPersonal ? 'md:col-span-2' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rol <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.rolCooperativa}
                        onChange={(e) => setFormData({ ...formData, rolCooperativa: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg coop-input-focus text-gray-900"
                      >
                        <option value="OFICINISTA">Oficinista</option>
                        <option value="CHOFER">Chofer</option>
                        <option value="ADMIN">Administrador</option>
                      </select>
                    </div>

                    {/* Campos adicionales para CHOFER */}
                    {formData.rolCooperativa === 'CHOFER' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número de Licencia <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required={formData.rolCooperativa === 'CHOFER'}
                            value={formData.numeroLicencia}
                            onChange={(e) => setFormData({ ...formData, numeroLicencia: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg coop-input-focus text-gray-900"
                            placeholder="L-1234567890"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Licencia <span className="text-red-500">*</span>
                          </label>
                          <select
                            required={formData.rolCooperativa === 'CHOFER'}
                            value={formData.tipoLicencia}
                            onChange={(e) => setFormData({ ...formData, tipoLicencia: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg coop-input-focus text-gray-900"
                          >
                            <option value="">Seleccionar tipo</option>
                            <option value="C">Tipo C - Vehículos pesados</option>
                            <option value="D">Tipo D - Transporte público</option>
                            <option value="E">Tipo E - Transporte comercial</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha de Vencimiento <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            required={formData.rolCooperativa === 'CHOFER'}
                            value={formData.fechaVencimientoLicencia}
                            onChange={(e) => setFormData({ ...formData, fechaVencimientoLicencia: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg coop-input-focus text-gray-900"
                          />
                        </div>
                      </>
                    )}
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
                      {editingPersonal ? 'Guardar Cambios' : 'Crear Usuario'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Asignar Terminales */}
        {showTerminalesModal && selectedOficinista && user?.cooperativaId && (
          <AsignarTerminalesModal
            isOpen={showTerminalesModal}
            onClose={() => {
              setShowTerminalesModal(false);
              setSelectedOficinista(null);
            }}
            usuarioId={selectedOficinista.id}
            usuarioNombre={`${selectedOficinista.nombres} ${selectedOficinista.apellidos}`}
            cooperativaId={user.cooperativaId}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
