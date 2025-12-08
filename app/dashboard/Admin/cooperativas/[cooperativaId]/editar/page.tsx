'use client';

import { useState, useRef, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { cooperativasApi, cooperativaConfigApi, getToken } from '@/lib/api';
import Image from 'next/image';
import {
  ArrowLeft,
  Building2,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Upload,
  X,
  FileText
} from 'lucide-react';

interface FormData {
  nombre: string;
  ruc: string;
  logoUrl: string;
}

interface PendingLogoFile {
  base64: string;
  fileName: string;
}

// Función para resolver URLs de recursos
const resolveResourceUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) {
    // Obtener la URL base sin /api
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api';
    const backendUrl = apiUrl.replace(/\/api$/, '');
    return `${backendUrl}${url}`;
  }
  return url;
};

export default function EditarCooperativaPage({ params }: { params: Promise<{ cooperativaId: string }> }) {
  const resolvedParams = use(params);
  const cooperativaId = parseInt(resolvedParams.cooperativaId);
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [pendingLogoFile, setPendingLogoFile] = useState<PendingLogoFile | null>(null);
  const [originalLogoUrl, setOriginalLogoUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    ruc: '',
    logoUrl: '',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    loadCooperativa();
  }, [cooperativaId]);

  const loadCooperativa = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      // Usar cooperativasApi.obtener para obtener los datos de la cooperativa
      const detalle = await cooperativasApi.obtener(cooperativaId, token);
      
      setFormData({
        nombre: detalle.nombre,
        ruc: detalle.ruc,
        logoUrl: '',
      });

      // Configurar el logo si existe y es una URL válida
      if (detalle.logoUrl) {
        const resolvedLogo = resolveResourceUrl(detalle.logoUrl);
        // Validar que sea una URL de imagen válida (no URLs de Google Images u otras páginas)
        if (resolvedLogo && !resolvedLogo.includes('google.com/imgres')) {
          setLogoPreview(resolvedLogo);
          setOriginalLogoUrl(resolvedLogo);
          setLogoError(false);
        }
      }

      // Intentar obtener el logo desde la configuración si no existe en detalle
      if (!detalle.logoUrl) {
        try {
          const config = await cooperativaConfigApi.getConfiguracion(cooperativaId, token);
          if (config.logoUrl) {
            const configLogo = resolveResourceUrl(config.logoUrl);
            if (configLogo && !configLogo.includes('google.com/imgres')) {
              setLogoPreview(configLogo);
              setOriginalLogoUrl(configLogo);
              setLogoError(false);
            }
          }
        } catch (e) {
          console.log('No se pudo cargar configuración de logo');
        }
      }

    } catch (err) {
      console.error('Error al cargar cooperativa:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar la cooperativa');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.ruc.trim()) {
      newErrors.ruc = 'El RUC es requerido';
    } else if (!/^\d{13}$/.test(formData.ruc)) {
      newErrors.ruc = 'El RUC debe tener 13 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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
      setLogoError(false); // Reset error state when selecting new file
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        console.log('Logo cargado:', { fileName: file.name, size: file.size, base64Length: base64.length });
        setLogoPreview(base64);
        setPendingLogoFile({ base64, fileName: file.name });
        setFormData(prev => ({ ...prev, logoUrl: '' }));
      };
      reader.onerror = () => {
        setError('Error al leer el archivo');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = async () => {
    // Si hay archivo pendiente, solo limpiar el preview
    if (pendingLogoFile) {
      setLogoPreview(originalLogoUrl);
      setPendingLogoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Si hay un logo guardado, eliminarlo
    if (originalLogoUrl) {
      try {
        const token = getToken();
        if (token) {
          await cooperativaConfigApi.deleteLogo(cooperativaId, token);
          setOriginalLogoUrl(null);
          setLogoPreview(null);
        }
      } catch (err) {
        console.error('Error al eliminar logo:', err);
        setError('Error al eliminar el logo');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      // 1. Actualizar datos de la cooperativa
      await cooperativasApi.actualizar(cooperativaId, {
        nombre: formData.nombre.trim(),
        ruc: formData.ruc.trim(),
      }, token);

      // 2. Si hay un logo pendiente, subirlo
      if (pendingLogoFile) {
        try {
          console.log('Subiendo logo:', { cooperativaId, fileName: pendingLogoFile.fileName });
          const logoResult = await cooperativaConfigApi.uploadLogo(
            cooperativaId,
            {
              logoBase64: pendingLogoFile.base64,
              fileName: pendingLogoFile.fileName,
            },
            token
          );
          console.log('Logo subido exitosamente:', logoResult);
        } catch (logoError) {
          console.error('Error al subir logo:', logoError);
          setError('La cooperativa se actualizó pero hubo un error al subir el logo');
          setSaving(false);
          return;
        }
      }

      setSuccess(true);
      
      setTimeout(() => {
        router.push('/dashboard/Admin/cooperativas');
      }, 2000);

    } catch (err) {
      console.error('Error al actualizar cooperativa:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar la cooperativa');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando cooperativa...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Cooperativa Actualizada!</h2>
          <p className="text-gray-600 mb-4">
            Los cambios se han guardado exitosamente.
          </p>
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
                <h1 className="text-2xl font-bold text-white">Editar Cooperativa</h1>
                <p className="text-blue-100 text-sm">Modifica los datos de la cooperativa</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
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
            </div>
          </div>

          {/* Logo */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-purple-200">
              <h2 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Logo
              </h2>
            </div>
            <div className="p-6">
              {logoPreview && !logoError ? (
                <div className="mb-4">
                  <div className="relative inline-block">
                    <div className="w-32 h-32 rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                      <Image
                        src={logoPreview}
                        alt="Preview del logo"
                        width={128}
                        height={128}
                        className="object-contain w-full h-full"
                        unoptimized
                        onError={() => {
                          console.error('Error cargando imagen:', logoPreview?.substring(0, 100));
                          // Marcar error pero no limpiar para permitir subir nuevo
                          setLogoError(true);
                        }}
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
                  {pendingLogoFile && (
                    <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Nuevo logo pendiente de guardar
                    </p>
                  )}
                  {!pendingLogoFile && originalLogoUrl && (
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Logo actual cargado
                    </p>
                  )}
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

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,.jfif,.jpg,.jpeg,.png,.gif,.webp"
                onChange={handleLogoChange}
                className="hidden"
              />

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

              <p className="text-xs text-gray-500">
                Formatos permitidos: JPG, PNG, GIF, WEBP, JFIF. Tamaño máximo: 2MB
              </p>
            </div>
          </div>

          {/* Botones */}
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
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
