'use client';

import { useEffect, useState, useRef } from 'react';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { useConfig } from '@/app/context/ConfigContext';
import { configuracionApi, getToken, type ConfiguracionGlobal, type UpdateConfiguracionRequest } from '@/lib/api';
import { 
  Settings, 
  Palette, 
  Building2, 
  Image, 
  Globe, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Linkedin,
  Mail, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Clock, 
  FileText, 
  Shield, 
  Link2,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  X,
  Eye,
  ExternalLink,
  Monitor,
  Users
} from 'lucide-react';

export default function ConfiguracionPage() {
  const { refreshConfig } = useConfig();
  const [config, setConfig] = useState<ConfiguracionGlobal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('branding');
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoSmallInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<UpdateConfiguracionRequest>({
    nombreAplicacion: '',
    logoUrl: '',
    logoSmallUrl: '',
    faviconUrl: '',
    colorPrimario: '#1E40AF',
    colorSecundario: '#3B82F6',
    colorAcento: '#10B981',
    facebookUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    linkedinUrl: '',
    emailSoporte: '',
    telefonoSoporte: '',
    whatsappSoporte: '',
    direccionFisica: '',
    horarioAtencion: '',
    sitioWeb: '',
    terminosCondicionesUrl: '',
    politicaPrivacidadUrl: '',
    descripcion: '',
  });

  const tabs = [
    { id: 'branding', label: 'Información General', icon: Building2 },
    { id: 'colors', label: 'Colores', icon: Palette },
    { id: 'social', label: 'Redes Sociales', icon: Globe },
    { id: 'contact', label: 'Contacto', icon: Phone },
    { id: 'legal', label: 'Legal', icon: FileText },
  ];

  useEffect(() => {
    loadConfiguracion();
  }, []);

  const loadConfiguracion = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await configuracionApi.get();
      setConfig(data);
      setFormData({
        nombreAplicacion: data.nombreAplicacion || '',
        logoUrl: data.logoUrl || '',
        logoSmallUrl: data.logoSmallUrl || '',
        faviconUrl: data.faviconUrl || '',
        colorPrimario: data.colorPrimario || '#1E40AF',
        colorSecundario: data.colorSecundario || '#3B82F6',
        colorAcento: data.colorAcento || '#10B981',
        facebookUrl: data.facebookUrl || '',
        twitterUrl: data.twitterUrl || '',
        instagramUrl: data.instagramUrl || '',
        youtubeUrl: data.youtubeUrl || '',
        linkedinUrl: data.linkedinUrl || '',
        emailSoporte: data.emailSoporte || '',
        telefonoSoporte: data.telefonoSoporte || '',
        whatsappSoporte: data.whatsappSoporte || '',
        direccionFisica: data.direccionFisica || '',
        horarioAtencion: data.horarioAtencion || '',
        sitioWeb: data.sitioWeb || '',
        terminosCondicionesUrl: data.terminosCondicionesUrl || '',
        politicaPrivacidadUrl: data.politicaPrivacidadUrl || '',
        descripcion: data.descripcion || '',
      });
      if (data.logoUrl) {
        setPreviewLogo(data.logoUrl);
      }
    } catch (err: unknown) {
      console.error('Error al cargar configuración:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      await configuracionApi.update(formData, token);
      setSuccess('Configuración actualizada exitosamente');
      loadConfiguracion();
      
      // Refrescar los colores globalmente
      await refreshConfig();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      console.error('Error al guardar configuración:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'logoSmallUrl' | 'faviconUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFormData({ ...formData, [field]: base64 });
      if (field === 'logoUrl') {
        setPreviewLogo(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
            <p className="mt-4 text-gray-600">Cargando configuración...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6 max-w-6xl">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Settings className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Administra el branding, colores corporativos, redes sociales y contacto de la plataforma
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      <Monitor className="w-3 h-3" />
                      Portal Admin
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <Users className="w-3 h-3" />
                      Página Pública
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="/info"
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  Ver página pública
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium shadow-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Alertas */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-red-800">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {/* Tabs horizontales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Tab Header */}
            <div className="border-b border-gray-200">
              <nav className="flex" aria-label="Tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors
                        ${activeTab === tab.id
                          ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <form onSubmit={handleSubmit} className="p-6">
              {/* Tab: Información General / Branding */}
              {activeTab === 'branding' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Información General</h2>
                        <p className="text-sm text-gray-500">Configura el nombre, logo y descripción de la plataforma</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                        <Monitor className="w-3 h-3" /> Admin
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs">
                        <Users className="w-3 h-3" /> Público
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre de la Aplicación
                        </label>
                        <input
                          type="text"
                          value={formData.nombreAplicacion}
                          onChange={(e) => setFormData({ ...formData, nombreAplicacion: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                          placeholder="Ej: AndinoBus - Terminal Terrestre"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Descripción
                        </label>
                        <textarea
                          rows={4}
                          value={formData.descripcion}
                          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                          placeholder="Sistema de gestión y venta de boletos de transporte terrestre..."
                        />
                        <p className="text-xs text-gray-500 mt-1">Esta descripción se mostrará en la página informativa pública</p>
                      </div>
                    </div>

                    {/* Logos */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        Imágenes de marca
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        {/* Logo Principal */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Logo Principal</label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-blue-400 transition-colors aspect-square flex items-center justify-center">
                            {formData.logoUrl ? (
                              <div className="relative w-full h-full flex items-center justify-center">
                                <img 
                                  src={formData.logoUrl} 
                                  alt="Logo" 
                                  className="max-h-full max-w-full object-contain"
                                />
                                <button
                                  type="button"
                                  onClick={() => { setFormData({ ...formData, logoUrl: '' }); setPreviewLogo(null); }}
                                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div 
                                onClick={() => logoInputRef.current?.click()}
                                className="cursor-pointer"
                              >
                                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-500">Subir</p>
                              </div>
                            )}
                            <input
                              ref={logoInputRef}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'logoUrl')}
                              className="hidden"
                            />
                          </div>
                        </div>

                        {/* Logo Pequeño */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Logo Pequeño</label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-blue-400 transition-colors aspect-square flex items-center justify-center">
                            {formData.logoSmallUrl ? (
                              <div className="relative w-full h-full flex items-center justify-center">
                                <img 
                                  src={formData.logoSmallUrl} 
                                  alt="Logo pequeño" 
                                  className="max-h-full max-w-full object-contain"
                                />
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, logoSmallUrl: '' })}
                                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div 
                                onClick={() => logoSmallInputRef.current?.click()}
                                className="cursor-pointer"
                              >
                                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-500">Subir</p>
                              </div>
                            )}
                            <input
                              ref={logoSmallInputRef}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'logoSmallUrl')}
                              className="hidden"
                            />
                          </div>
                        </div>

                        {/* Favicon */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Favicon</label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-blue-400 transition-colors aspect-square flex items-center justify-center">
                            {formData.faviconUrl ? (
                              <div className="relative w-full h-full flex items-center justify-center">
                                <img 
                                  src={formData.faviconUrl} 
                                  alt="Favicon" 
                                  className="max-h-full max-w-full object-contain"
                                />
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, faviconUrl: '' })}
                                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div 
                                onClick={() => faviconInputRef.current?.click()}
                                className="cursor-pointer"
                              >
                                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-500">Subir</p>
                              </div>
                            )}
                            <input
                              ref={faviconInputRef}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'faviconUrl')}
                              className="hidden"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Colores Corporativos */}
              {activeTab === 'colors' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Palette className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Colores Corporativos</h2>
                        <p className="text-sm text-gray-500">Define los colores que representan tu marca</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                        <Monitor className="w-3 h-3" /> Admin
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs">
                        <Users className="w-3 h-3" /> Público
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Color Primario */}
                    <div className="bg-gray-50 rounded-xl p-5">
                      <label className="block text-sm font-medium text-gray-700 mb-4">Color Primario</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="color"
                          value={formData.colorPrimario || '#1E40AF'}
                          onChange={(e) => setFormData({ ...formData, colorPrimario: e.target.value })}
                          className="w-16 h-16 rounded-xl border-2 border-white shadow-lg cursor-pointer"
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={formData.colorPrimario}
                            onChange={(e) => setFormData({ ...formData, colorPrimario: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono text-sm"
                            placeholder="#1E40AF"
                          />
                          <p className="text-xs text-gray-500 mt-2">Usado en encabezados y botones principales</p>
                        </div>
                      </div>
                    </div>

                    {/* Color Secundario */}
                    <div className="bg-gray-50 rounded-xl p-5">
                      <label className="block text-sm font-medium text-gray-700 mb-4">Color Secundario</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="color"
                          value={formData.colorSecundario || '#3B82F6'}
                          onChange={(e) => setFormData({ ...formData, colorSecundario: e.target.value })}
                          className="w-16 h-16 rounded-xl border-2 border-white shadow-lg cursor-pointer"
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={formData.colorSecundario}
                            onChange={(e) => setFormData({ ...formData, colorSecundario: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono text-sm"
                            placeholder="#3B82F6"
                          />
                          <p className="text-xs text-gray-500 mt-2">Elementos secundarios y acentos</p>
                        </div>
                      </div>
                    </div>

                    {/* Color Acento */}
                    <div className="bg-gray-50 rounded-xl p-5">
                      <label className="block text-sm font-medium text-gray-700 mb-4">Color de Acento</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="color"
                          value={formData.colorAcento || '#10B981'}
                          onChange={(e) => setFormData({ ...formData, colorAcento: e.target.value })}
                          className="w-16 h-16 rounded-xl border-2 border-white shadow-lg cursor-pointer"
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={formData.colorAcento}
                            onChange={(e) => setFormData({ ...formData, colorAcento: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono text-sm"
                            placeholder="#10B981"
                          />
                          <p className="text-xs text-gray-500 mt-2">Éxito, confirmaciones y CTAs</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview de colores */}
                  <div className="mt-8 p-6 bg-gray-100 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">Vista previa</h3>
                    <div className="flex flex-wrap gap-4">
                      <button 
                        type="button"
                        className="px-6 py-3 rounded-lg text-white font-medium shadow-sm"
                        style={{ backgroundColor: formData.colorPrimario || '#1E40AF' }}
                      >
                        Botón Primario
                      </button>
                      <button 
                        type="button"
                        className="px-6 py-3 rounded-lg text-white font-medium shadow-sm"
                        style={{ backgroundColor: formData.colorSecundario || '#3B82F6' }}
                      >
                        Botón Secundario
                      </button>
                      <button 
                        type="button"
                        className="px-6 py-3 rounded-lg text-white font-medium shadow-sm"
                        style={{ backgroundColor: formData.colorAcento || '#10B981' }}
                      >
                        Botón Acento
                      </button>
                      <div 
                        className="px-6 py-3 rounded-lg border-2 font-medium"
                        style={{ 
                          borderColor: formData.colorPrimario || '#1E40AF',
                          color: formData.colorPrimario || '#1E40AF'
                        }}
                      >
                        Borde Primario
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Redes Sociales */}
              {activeTab === 'social' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-100 rounded-lg">
                        <Globe className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Redes Sociales</h2>
                        <p className="text-sm text-gray-500">Conecta tus perfiles de redes sociales</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs">
                      <Users className="w-3 h-3" /> Solo Público
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Facebook */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Facebook className="w-4 h-4 text-blue-600" />
                          Facebook
                        </div>
                      </label>
                      <input
                        type="url"
                        value={formData.facebookUrl}
                        onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="https://facebook.com/tu-pagina"
                      />
                    </div>

                    {/* Twitter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Twitter className="w-4 h-4 text-sky-500" />
                          Twitter / X
                        </div>
                      </label>
                      <input
                        type="url"
                        value={formData.twitterUrl}
                        onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="https://twitter.com/tu-cuenta"
                      />
                    </div>

                    {/* Instagram */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Instagram className="w-4 h-4 text-pink-600" />
                          Instagram
                        </div>
                      </label>
                      <input
                        type="url"
                        value={formData.instagramUrl}
                        onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="https://instagram.com/tu-cuenta"
                      />
                    </div>

                    {/* YouTube */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Youtube className="w-4 h-4 text-red-600" />
                          YouTube
                        </div>
                      </label>
                      <input
                        type="url"
                        value={formData.youtubeUrl}
                        onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="https://youtube.com/tu-canal"
                      />
                    </div>

                    {/* LinkedIn */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Linkedin className="w-4 h-4 text-blue-700" />
                          LinkedIn
                        </div>
                      </label>
                      <input
                        type="url"
                        value={formData.linkedinUrl}
                        onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="https://linkedin.com/company/tu-empresa"
                      />
                    </div>

                    {/* Sitio Web */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Link2 className="w-4 h-4 text-gray-600" />
                          Sitio Web
                        </div>
                      </label>
                      <input
                        type="url"
                        value={formData.sitioWeb}
                        onChange={(e) => setFormData({ ...formData, sitioWeb: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="https://www.tu-sitio.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Contacto / Soporte */}
              {activeTab === 'contact' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Contacto y Soporte</h2>
                        <p className="text-sm text-gray-500">Información de contacto para clientes</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs">
                      <Users className="w-3 h-3" /> Solo Público
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-red-500" />
                          Email de Soporte
                        </div>
                      </label>
                      <input
                        type="email"
                        value={formData.emailSoporte}
                        onChange={(e) => setFormData({ ...formData, emailSoporte: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="soporte@terminal.com"
                      />
                    </div>

                    {/* Teléfono */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-blue-500" />
                          Teléfono de Soporte
                        </div>
                      </label>
                      <input
                        type="tel"
                        value={formData.telefonoSoporte}
                        onChange={(e) => setFormData({ ...formData, telefonoSoporte: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="+593 99 123 4567"
                      />
                    </div>

                    {/* WhatsApp */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-green-500" />
                          WhatsApp
                        </div>
                      </label>
                      <input
                        type="tel"
                        value={formData.whatsappSoporte}
                        onChange={(e) => setFormData({ ...formData, whatsappSoporte: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="+593 99 123 4567"
                      />
                    </div>

                    {/* Horario */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-500" />
                          Horario de Atención
                        </div>
                      </label>
                      <input
                        type="text"
                        value={formData.horarioAtencion}
                        onChange={(e) => setFormData({ ...formData, horarioAtencion: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="Lunes a Viernes: 8:00 - 18:00"
                      />
                    </div>

                    {/* Dirección */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-500" />
                          Dirección Física
                        </div>
                      </label>
                      <textarea
                        rows={3}
                        value={formData.direccionFisica}
                        onChange={(e) => setFormData({ ...formData, direccionFisica: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="Av. Principal #123, Ciudad, País"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Información Legal */}
              {activeTab === 'legal' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <FileText className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Información Legal</h2>
                        <p className="text-sm text-gray-500">Enlaces a documentos legales y políticas</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs">
                      <Users className="w-3 h-3" /> Solo Público
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Términos y Condiciones */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          Términos y Condiciones
                        </div>
                      </label>
                      <input
                        type="url"
                        value={formData.terminosCondicionesUrl}
                        onChange={(e) => setFormData({ ...formData, terminosCondicionesUrl: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="https://tu-sitio.com/terminos"
                      />
                      <p className="text-xs text-gray-500 mt-1">URL de la página de términos y condiciones</p>
                    </div>

                    {/* Política de Privacidad */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-green-600" />
                          Política de Privacidad
                        </div>
                      </label>
                      <input
                        type="url"
                        value={formData.politicaPrivacidadUrl}
                        onChange={(e) => setFormData({ ...formData, politicaPrivacidadUrl: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="https://tu-sitio.com/privacidad"
                      />
                      <p className="text-xs text-gray-500 mt-1">URL de la página de política de privacidad</p>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800">Documentos legales importantes</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          Asegúrate de tener páginas válidas con tus términos y condiciones y política de privacidad. 
                          Estos documentos son requeridos para el cumplimiento legal y serán mostrados en la página pública.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Barra inferior con preview de colores y logo */}
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {previewLogo && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-500 uppercase">Logo:</span>
                    <img src={previewLogo} alt="Logo" className="h-8 object-contain" />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-500 uppercase">Colores:</span>
                  <div className="flex gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg border-2 border-white shadow-sm" 
                      style={{ backgroundColor: formData.colorPrimario || '#1E40AF' }}
                      title="Primario"
                    />
                    <div 
                      className="w-8 h-8 rounded-lg border-2 border-white shadow-sm" 
                      style={{ backgroundColor: formData.colorSecundario || '#3B82F6' }}
                      title="Secundario"
                    />
                    <div 
                      className="w-8 h-8 rounded-lg border-2 border-white shadow-sm" 
                      style={{ backgroundColor: formData.colorAcento || '#10B981' }}
                      title="Acento"
                    />
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium shadow-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
