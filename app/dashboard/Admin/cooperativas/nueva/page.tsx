'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cooperativasApi, cooperativaConfigApi, personalApi, getToken } from '@/lib/api';
import Image from 'next/image';
import {
  ArrowLeft,
  Building2,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  Upload,
  X,
  User,
  Info
} from 'lucide-react';

interface FormData {
  nombre: string;
  ruc: string;
  direccion: string;
  telefono: string;
  email: string;
  logoUrl: string;
}

interface AdminFormData {
  nombres: string;
  apellidos: string;
  email: string;
  cedula: string;
  telefono: string;
}

interface PendingLogoFile {
  base64: string;
  fileName: string;
}

// Función para validar cédula ecuatoriana
const validarCedulaEcuatoriana = (cedula: string): boolean => {
  if (!/^\d{10}$/.test(cedula)) return false;
  
  const provincia = parseInt(cedula.substring(0, 2));
  if (provincia < 1 || provincia > 24) return false;
  
  const tercerDigito = parseInt(cedula[2]);
  if (tercerDigito > 5) return false;
  
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  
  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula[i]) * coeficientes[i];
    if (valor > 9) valor -= 9;
    suma += valor;
  }
  
  const digitoVerificador = suma % 10 === 0 ? 0 : 10 - (suma % 10);
  return digitoVerificador === parseInt(cedula[9]);
};

export default function NuevaCooperativaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [pendingLogoFile, setPendingLogoFile] = useState<PendingLogoFile | null>(null);

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    ruc: '',
    direccion: '',
    telefono: '',
    email: '',
    logoUrl: '',
  });

  const [adminData, setAdminData] = useState<AdminFormData>({
    nombres: '',
    apellidos: '',
    email: '',
    cedula: '',
    telefono: '',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [adminErrors, setAdminErrors] = useState<Partial<AdminFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    const newAdminErrors: Partial<AdminFormData> = {};

    // Validación de datos de la cooperativa
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.ruc.trim()) {
      newErrors.ruc = 'El RUC es requerido';
    } else if (!/^\d{13}$/.test(formData.ruc)) {
      newErrors.ruc = 'El RUC debe tener 13 dígitos';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.telefono && !/^[\d\s\-+()]+$/.test(formData.telefono)) {
      newErrors.telefono = 'Teléfono inválido';
    }

    // Validación de datos del administrador
    if (!adminData.nombres.trim()) {
      newAdminErrors.nombres = 'Los nombres son requeridos';
    } else if (adminData.nombres.trim().length < 2) {
      newAdminErrors.nombres = 'Los nombres deben tener al menos 2 caracteres';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(adminData.nombres.trim())) {
      newAdminErrors.nombres = 'Los nombres solo pueden contener letras';
    }

    if (!adminData.apellidos.trim()) {
      newAdminErrors.apellidos = 'Los apellidos son requeridos';
    } else if (adminData.apellidos.trim().length < 2) {
      newAdminErrors.apellidos = 'Los apellidos deben tener al menos 2 caracteres';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(adminData.apellidos.trim())) {
      newAdminErrors.apellidos = 'Los apellidos solo pueden contener letras';
    }

    if (!adminData.email.trim()) {
      newAdminErrors.email = 'El email es requerido';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(adminData.email.trim())) {
      newAdminErrors.email = 'Ingrese un email válido (ejemplo: usuario@dominio.com)';
    }

    if (!adminData.cedula.trim()) {
      newAdminErrors.cedula = 'La cédula es requerida';
    } else if (!/^\d{10}$/.test(adminData.cedula)) {
      newAdminErrors.cedula = 'La cédula debe tener exactamente 10 dígitos numéricos';
    } else if (!validarCedulaEcuatoriana(adminData.cedula)) {
      newAdminErrors.cedula = 'La cédula ingresada no es válida';
    }

    if (adminData.telefono) {
      const telefonoLimpio = adminData.telefono.replace(/[\s\-()]/g, '');
      if (!/^\+?\d{9,15}$/.test(telefonoLimpio)) {
        newAdminErrors.telefono = 'Ingrese un teléfono válido (9-15 dígitos)';
      }
    }

    setErrors(newErrors);
    setAdminErrors(newAdminErrors);
    return Object.keys(newErrors).length === 0 && Object.keys(newAdminErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo al modificarlo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleAdminInputChange = (field: keyof AdminFormData, value: string) => {
    setAdminData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo al modificarlo
    if (adminErrors[field]) {
      setAdminErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño
      if (file.size > 2 * 1024 * 1024) {
        setError('El logo no debe superar los 2MB');
        return;
      }

      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/jfif'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const isValidExtension = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'jfif'].includes(fileExtension || '');
      
      if (!validTypes.includes(file.type) && !isValidExtension) {
        setError('Formato de imagen no válido. Use JPG, PNG, GIF, WEBP o JFIF');
        return;
      }

      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        console.log('Logo cargado:', { fileName: file.name, size: file.size, base64Length: base64.length });
        setLogoPreview(base64);
        setPendingLogoFile({ base64, fileName: file.name });
        // Limpiar cualquier URL manual si se sube archivo
        setFormData(prev => ({ ...prev, logoUrl: '' }));
      };
      reader.onerror = () => {
        setError('Error al leer el archivo');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setPendingLogoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      // 1. Crear la cooperativa primero
      const nuevaCooperativa = await cooperativasApi.crear({
        nombre: formData.nombre.trim(),
        ruc: formData.ruc.trim(),
        logoUrl: formData.logoUrl.trim() || undefined,
        activo: true,
      }, token);

      // 2. Si hay un logo pendiente (archivo), subirlo
      if (pendingLogoFile && nuevaCooperativa.id) {
        try {
          await cooperativaConfigApi.uploadLogo(
            nuevaCooperativa.id,
            {
              logoBase64: pendingLogoFile.base64,
              fileName: pendingLogoFile.fileName,
            },
            token
          );
        } catch (logoError) {
          console.error('Error al subir logo:', logoError);
          // No falla la creación, solo muestra advertencia
          console.warn('La cooperativa se creó pero el logo no se pudo subir');
        }
      }

      // 3. Crear el administrador de la cooperativa
      try {
        await personalApi.create(
          nuevaCooperativa.id,
          {
            nombres: adminData.nombres.trim(),
            apellidos: adminData.apellidos.trim(),
            email: adminData.email.trim(),
            password: adminData.cedula.trim(), // La contraseña inicial es la cédula
            cedula: adminData.cedula.trim(),
            telefono: adminData.telefono.trim() || undefined,
            rolCooperativa: 'ADMIN',
          },
          token
        );
      } catch (adminError) {
        console.error('Error al crear administrador:', adminError);
        // Si falla la creación del admin, mostrar error pero la cooperativa ya existe
        setError('La cooperativa se creó pero hubo un error al crear el administrador. Puede crearlo manualmente desde la gestión de personal.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push('/dashboard/Admin/cooperativas');
      }, 2000);

    } catch (err) {
      console.error('Error al crear cooperativa:', err);
      setError(err instanceof Error ? err.message : 'Error al crear la cooperativa');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Cooperativa Creada!</h2>
          <p className="text-gray-600 mb-4">
            La cooperativa <strong>{formData.nombre}</strong> ha sido registrada exitosamente.
          </p>
          <div className="bg-blue-50 rounded-lg p-4 mb-4 text-left">
            <p className="text-sm font-medium text-blue-800 mb-2">Administrador creado:</p>
            <p className="text-sm text-blue-700">{adminData.nombres} {adminData.apellidos}</p>
            <p className="text-sm text-blue-600">{adminData.email}</p>
            <div className="mt-2 pt-2 border-t border-blue-200">
              <p className="text-xs text-blue-700"><strong>Contraseña inicial:</strong> {adminData.cedula}</p>
              <p className="text-xs text-blue-600 mt-1">Se recomienda cambiarla en el primer inicio de sesión</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">Redirigiendo al listado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/Admin/cooperativas')}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Nueva Cooperativa</h1>
                <p className="text-blue-100 text-sm">Registra una nueva cooperativa en el sistema</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Error al crear cooperativa</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
              <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Información Básica
              </h2>
            </div>
            <div className="p-6 space-y-5">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de la Cooperativa *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 ${
                    errors.nombre ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Cooperativa de Transporte AndinaBus"
                />
                {errors.nombre && (
                  <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
                )}
              </div>

              {/* RUC */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  RUC *
                </label>
                <input
                  type="text"
                  value={formData.ruc}
                  onChange={(e) => handleInputChange('ruc', e.target.value.replace(/\D/g, '').slice(0, 13))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 ${
                    errors.ruc ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="1234567890001"
                  maxLength={13}
                />
                {errors.ruc && (
                  <p className="mt-1 text-sm text-red-600">{errors.ruc}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.ruc.length}/13 dígitos
                </p>
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => handleInputChange('direccion', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                  placeholder="Ej: Av. Principal 123, Quito"
                />
              </div>

              {/* Teléfono y Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 ${
                      errors.telefono ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="02 123 4567"
                  />
                  {errors.telefono && (
                    <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="contacto@cooperativa.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Logo (Opcional) */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-purple-200">
              <h2 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Logo (Opcional)
              </h2>
            </div>
            <div className="p-6">
              {/* Preview del logo */}
              {logoPreview ? (
                <div className="mb-4">
                  <div className="relative inline-block">
                    <div className="w-32 h-32 rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                      <Image
                        src={logoPreview}
                        alt="Preview del logo"
                        width={128}
                        height={128}
                        className="object-contain w-full h-full"
                        unoptimized={logoPreview.startsWith('data:')}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Logo seleccionado
                  </p>
                </div>
              ) : (
                <div className="mb-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500 text-center px-2">Clic para subir</span>
                  </div>
                </div>
              )}

              {/* Input de archivo oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,.jfif,.jpg,.jpeg,.png,.gif,.webp"
                onChange={handleLogoChange}
                className="hidden"
              />

              {/* Botón para seleccionar archivo */}
              {!logoPreview && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-4 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium text-sm flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Seleccionar imagen
                </button>
              )}

              <p className="text-xs text-gray-500 mb-4">
                Formatos permitidos: JPG, PNG, GIF, WEBP, JFIF. Tamaño máximo: 2MB
              </p>

              {/* Separador */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">o usar URL externa</span>
                </div>
              </div>

              {/* URL manual (alternativa) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL del Logo (alternativa)
                </label>
                <input
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => {
                    handleInputChange('logoUrl', e.target.value);
                    // Si escribe URL, limpiar el archivo pendiente
                    if (e.target.value) {
                      setLogoPreview(null);
                      setPendingLogoFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }
                  }}
                  disabled={!!pendingLogoFile}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="https://ejemplo.com/logo.png"
                />
                {pendingLogoFile && (
                  <p className="mt-1 text-xs text-gray-500">
                    URL deshabilitada porque hay una imagen seleccionada
                  </p>
                )}
              </div>

              <p className="mt-4 text-xs text-gray-500">
                💡 Puedes modificar el logo después desde la configuración de la cooperativa
              </p>
            </div>
          </div>

          {/* Administrador de la Cooperativa */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-green-200">
              <h2 className="text-lg font-bold text-green-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                Administrador de la Cooperativa *
              </h2>
              <p className="text-sm text-green-700 mt-1">
                Se creará un usuario administrador para gestionar esta cooperativa
              </p>
            </div>
            <div className="p-6 space-y-5">
              {/* Nombres y Apellidos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    value={adminData.nombres}
                    onChange={(e) => handleAdminInputChange('nombres', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 ${
                      adminErrors.nombres ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Juan Carlos"
                  />
                  {adminErrors.nombres && (
                    <p className="mt-1 text-sm text-red-600">{adminErrors.nombres}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    value={adminData.apellidos}
                    onChange={(e) => handleAdminInputChange('apellidos', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 ${
                      adminErrors.apellidos ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Pérez García"
                  />
                  {adminErrors.apellidos && (
                    <p className="mt-1 text-sm text-red-600">{adminErrors.apellidos}</p>
                  )}
                </div>
              </div>

              {/* Email del Admin */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email del Administrador *
                </label>
                <input
                  type="email"
                  value={adminData.email}
                  onChange={(e) => handleAdminInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 ${
                    adminErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="admin@cooperativa.com"
                />
                {adminErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{adminErrors.email}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Este email se usará para iniciar sesión
                </p>
              </div>

              {/* Cédula y Teléfono del Admin */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cédula *
                  </label>
                  <input
                    type="text"
                    value={adminData.cedula}
                    onChange={(e) => handleAdminInputChange('cedula', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 ${
                      adminErrors.cedula ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="1234567890"
                    maxLength={10}
                  />
                  {adminErrors.cedula && (
                    <p className="mt-1 text-sm text-red-600">{adminErrors.cedula}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {adminData.cedula.length}/10 dígitos - Se usará como contraseña inicial
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={adminData.telefono}
                    onChange={(e) => {
                      // Permitir solo números, espacios, guiones, paréntesis y +
                      const valor = e.target.value.replace(/[^\d\s\-+()]/g, '');
                      handleAdminInputChange('telefono', valor);
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 ${
                      adminErrors.telefono ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="0987654321"
                  />
                  {adminErrors.telefono && (
                    <p className="mt-1 text-sm text-red-600">{adminErrors.telefono}</p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Información de acceso</p>
                  <p className="text-sm text-blue-700 mt-1">
                    La <strong>contraseña inicial</strong> del administrador será su <strong>número de cédula</strong>. 
                    Se recomienda que el administrador la cambie en su primer inicio de sesión.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard/Admin/cooperativas')}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Crear Cooperativa
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
