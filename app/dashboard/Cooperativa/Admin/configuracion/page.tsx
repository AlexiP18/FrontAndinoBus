'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useCooperativaConfig } from '@/app/context/CooperativaConfigContext';
import Link from 'next/link';
import {
  Building2,
  Image as ImageIcon,
  Palette,
  Globe,
  Save,
  Upload,
  X,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  AlertCircle,
  CheckCircle,
  Info,
  MapPin,
  ExternalLink,
  Check,
  Loader2
} from 'lucide-react';
import { cooperativaTerminalesApi, cooperativaConfigApi, getToken, resolveResourceUrl, type TerminalAsignadoCooperativa, type CooperativaConfigResponse, type UpdateCooperativaConfigRequest } from '@/lib/api';

interface CooperativaConfig {
  id: number;
  nombre: string;
  ruc: string;
  direccion: string;
  telefono: string;
  email: string;
  descripcion: string;
  logo: string | null;
  colorPrimario: string;
  colorSecundario: string;
  facebook: string;
  twitter: string;
  instagram: string;
  linkedin: string;
  youtube: string;
}

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const { refreshCooperativaConfig } = useCooperativaConfig();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [terminales, setTerminales] = useState<TerminalAsignadoCooperativa[]>([]);
  const [loadingTerminales, setLoadingTerminales] = useState(true);
  const [activeProvinciaTab, setActiveProvinciaTab] = useState<string>('');
  const [pendingLogoFile, setPendingLogoFile] = useState<{ base64: string; fileName: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState<CooperativaConfig>({
    id: user?.cooperativaId || 0,
    nombre: user?.cooperativaNombre || '',
    ruc: '',
    direccion: '',
    telefono: '',
    email: '',
    descripcion: '',
    logo: null,
    colorPrimario: '#16a34a',
    colorSecundario: '#15803d',
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    youtube: '',
  });

  // Agrupar terminales por provincia y cantón
  const terminalesAgrupados = useMemo(() => {
    const grupos: Record<string, Record<string, TerminalAsignadoCooperativa[]>> = {};
    
    terminales.forEach(terminal => {
      if (!grupos[terminal.provincia]) {
        grupos[terminal.provincia] = {};
      }
      if (!grupos[terminal.provincia][terminal.canton]) {
        grupos[terminal.provincia][terminal.canton] = [];
      }
      grupos[terminal.provincia][terminal.canton].push(terminal);
    });
    
    return grupos;
  }, [terminales]);

  // Lista de provincias
  const provinciasDisponibles = useMemo(() => 
    Object.keys(terminalesAgrupados).sort(), 
    [terminalesAgrupados]
  );

  // Color por tipología
  const getTipologiaColor = (tipologia: string) => {
    const colors: Record<string, string> = {
      'T1': 'bg-red-100 text-red-700',
      'T2': 'bg-blue-100 text-blue-700',
      'T3': 'bg-green-100 text-green-700',
      'T4': 'bg-yellow-100 text-yellow-700',
      'T5': 'bg-purple-100 text-purple-700',
    };
    return colors[tipologia] || 'bg-gray-100 text-gray-700';
  };

  useEffect(() => {
    loadConfiguracion();
    loadTerminales();
  }, [user?.cooperativaId]);

  const loadConfiguracion = async () => {
    if (!user?.cooperativaId) return;
    
    try {
      setLoading(true);
      const token = getToken();
      const data = await cooperativaConfigApi.getConfiguracion(user.cooperativaId, token || '');
      
      const resolvedLogoUrl = resolveResourceUrl(data.logoUrl);
      
      setConfig({
        id: data.id,
        nombre: data.nombre,
        ruc: data.ruc || '',
        direccion: data.direccion || '',
        telefono: data.telefono || '',
        email: data.email || '',
        descripcion: data.descripcion || '',
        logo: resolvedLogoUrl,
        colorPrimario: data.colorPrimario || '#16a34a',
        colorSecundario: data.colorSecundario || '#15803d',
        facebook: data.facebook || '',
        twitter: data.twitter || '',
        instagram: data.instagram || '',
        linkedin: data.linkedin || '',
        youtube: data.youtube || '',
      });
      
      if (resolvedLogoUrl) {
        setLogoPreview(resolvedLogoUrl);
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      setMessage({ type: 'error', text: 'Error al cargar la configuración' });
    } finally {
      setLoading(false);
    }
  };

  const loadTerminales = async () => {
    if (!user?.cooperativaId) return;
    
    try {
      setLoadingTerminales(true);
      const token = getToken();
      const data = await cooperativaTerminalesApi.getTerminales(user.cooperativaId, token || '');
      setTerminales(data);
    } catch (error) {
      console.error('Error al cargar terminales:', error);
    } finally {
      setLoadingTerminales(false);
    }
  };

  const handleInputChange = (field: keyof CooperativaConfig, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'El logo no debe superar los 2MB' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        setPendingLogoFile({ base64, fileName: file.name });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = async () => {
    if (!user?.cooperativaId) return;
    
    // Si hay un archivo pendiente, solo limpiar el preview
    if (pendingLogoFile) {
      setLogoPreview(config.logo);
      setPendingLogoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    // Si hay un logo guardado, eliminarlo del servidor
    if (config.logo) {
      try {
        setUploadingLogo(true);
        const token = getToken();
        const updatedConfig = await cooperativaConfigApi.deleteLogo(user.cooperativaId, token || '');
        
        setConfig(prev => ({
          ...prev,
          logo: null,
        }));
        setLogoPreview(null);
        
        // Refrescar el contexto para actualizar el sidebar
        await refreshCooperativaConfig();
        
        setMessage({ type: 'success', text: 'Logo eliminado exitosamente' });
      } catch (error) {
        console.error('Error al eliminar logo:', error);
        setMessage({ type: 'error', text: 'Error al eliminar el logo' });
      } finally {
        setUploadingLogo(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.cooperativaId) return;
    
    setSaving(true);
    setMessage(null);

    try {
      const token = getToken();
      
      // 1. Si hay un logo pendiente, subirlo primero
      if (pendingLogoFile) {
        try {
          await cooperativaConfigApi.uploadLogo(
            user.cooperativaId,
            {
              logoBase64: pendingLogoFile.base64,
              fileName: pendingLogoFile.fileName,
            },
            token || ''
          );
          setPendingLogoFile(null);
        } catch (logoError) {
          console.error('Error al subir logo:', logoError);
          setMessage({ type: 'error', text: 'Error al subir el logo' });
          setSaving(false);
          return;
        }
      }
      
      // 2. Actualizar la configuración
      const request: UpdateCooperativaConfigRequest = {
        nombre: config.nombre,
        descripcion: config.descripcion || null,
        colorPrimario: config.colorPrimario,
        colorSecundario: config.colorSecundario,
        facebook: config.facebook || null,
        twitter: config.twitter || null,
        instagram: config.instagram || null,
        linkedin: config.linkedin || null,
        youtube: config.youtube || null,
      };
      
      const updatedConfig = await cooperativaConfigApi.updateConfiguracion(
        user.cooperativaId,
        request,
        token || ''
      );
      
      const resolvedLogoUrl = resolveResourceUrl(updatedConfig.logoUrl);
      
      // Actualizar estado con los datos devueltos
      setConfig(prev => ({
        ...prev,
        nombre: updatedConfig.nombre || prev.nombre,
        descripcion: updatedConfig.descripcion || '',
        logo: resolvedLogoUrl,
        colorPrimario: updatedConfig.colorPrimario,
        colorSecundario: updatedConfig.colorSecundario,
        facebook: updatedConfig.facebook || '',
        twitter: updatedConfig.twitter || '',
        instagram: updatedConfig.instagram || '',
        linkedin: updatedConfig.linkedin || '',
        youtube: updatedConfig.youtube || '',
      }));
      
      if (resolvedLogoUrl) {
        setLogoPreview(resolvedLogoUrl);
      }
      
      // Refrescar el contexto para actualizar el sidebar
      await refreshCooperativaConfig();
      
      setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      setMessage({ type: 'error', text: 'Error al guardar la configuración' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="shadow-lg coop-bg-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Configuración de la Cooperativa</h1>
              <p className="text-white/80 text-sm mt-1">
                Personaliza la información y apariencia de tu cooperativa
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estado de carga inicial */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin mb-4 coop-text-primary" />
            <p className="text-gray-600 font-medium">Cargando configuración...</p>
          </div>
        ) : (
          <>
        {/* Mensajes de alerta */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <p
              className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {message.text}
            </p>
            <button
              onClick={() => setMessage(null)}
              className={`ml-auto ${
                message.type === 'success'
                  ? 'text-green-600 hover:text-green-800'
                  : 'text-red-600 hover:text-red-800'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información General */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-green-200">
              <h2 className="text-lg font-bold text-green-900 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Información General
              </h2>
            </div>
            <div className="p-6 space-y-5">
              {/* Nombre de la Cooperativa - Editable */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de la Cooperativa
                </label>
                <input
                  type="text"
                  value={config.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 coop-input-focus"
                  placeholder="Nombre de la cooperativa"
                />
              </div>

              {/* Datos de la empresa (solo lectura) */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Datos Registrados</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">RUC</label>
                    <p className="text-sm font-medium text-gray-900">{config.ruc || 'No registrado'}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Dirección</label>
                    <p className="text-sm font-medium text-gray-900">{config.direccion || 'No registrada'}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Teléfono</label>
                    <p className="text-sm font-medium text-gray-900">{config.telefono || 'No registrado'}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                    <p className="text-sm font-medium text-gray-900">{config.email || 'No registrado'}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3 italic">
                  * Para modificar estos datos, contacte al administrador del sistema
                </p>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={config.descripcion}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none text-gray-900"
                  placeholder="Describe brevemente tu cooperativa, sus servicios y características principales..."
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Esta descripción aparecerá en la página pública de tu cooperativa
                </p>
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-purple-200">
              <h2 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Logo de la Cooperativa
              </h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Preview del logo */}
                <div className="flex-shrink-0">
                  <div className="w-40 h-40 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center overflow-hidden">
                    {logoPreview || config.logo ? (
                      <div className="relative w-full h-full">
                        <img
                          src={logoPreview || config.logo || ''}
                          alt="Logo preview"
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          disabled={uploadingLogo}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50"
                        >
                          {uploadingLogo ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">Sin logo</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload */}
                <div className="flex-1">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Recomendaciones:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Formato: PNG, JPG o SVG</li>
                          <li>Tamaño máximo: 2MB</li>
                          <li>Dimensiones recomendadas: 400x400px</li>
                          <li>Fondo transparente (PNG) para mejor resultado</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 font-medium">
                        <span className="text-green-600">Haz clic para subir</span> o arrastra el archivo
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG o SVG (máx. 2MB)</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={handleLogoChange}
                    />
                  </label>
                  {pendingLogoFile && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Logo pendiente de guardar. Haz clic en &quot;Guardar Cambios&quot; para aplicar.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Colores Corporativos */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-50 to-pink-100 px-6 py-4 border-b border-pink-200">
              <h2 className="text-lg font-bold text-pink-900 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Colores Corporativos
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Color Primario */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Color Primario
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <input
                        type="color"
                        value={config.colorPrimario}
                        onChange={(e) => handleInputChange('colorPrimario', e.target.value)}
                        className="w-full h-14 border-2 border-gray-300 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={config.colorPrimario}
                        onChange={(e) => handleInputChange('colorPrimario', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm uppercase text-gray-900"
                        placeholder="#16a34a"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Color principal de la marca (botones, encabezados, etc.)
                  </p>
                </div>

                {/* Color Secundario */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Color Secundario
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <input
                        type="color"
                        value={config.colorSecundario}
                        onChange={(e) => handleInputChange('colorSecundario', e.target.value)}
                        className="w-full h-14 border-2 border-gray-300 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={config.colorSecundario}
                        onChange={(e) => handleInputChange('colorSecundario', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm uppercase text-gray-900"
                        placeholder="#15803d"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Color complementario para acentos y detalles
                  </p>
                </div>
              </div>

              {/* Vista previa de colores */}
              <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-4">Vista Previa:</p>
                <div className="flex flex-wrap gap-4">
                  <div
                    className="px-6 py-3 rounded-lg text-white font-semibold shadow-md"
                    style={{ backgroundColor: config.colorPrimario }}
                  >
                    Botón Primario
                  </div>
                  <div
                    className="px-6 py-3 rounded-lg text-white font-semibold shadow-md"
                    style={{ backgroundColor: config.colorSecundario }}
                  >
                    Botón Secundario
                  </div>
                  <div
                    className="px-6 py-3 rounded-lg font-semibold border-2"
                    style={{ borderColor: config.colorPrimario, color: config.colorPrimario }}
                  >
                    Botón Outline
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Redes Sociales */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
              <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Redes Sociales
              </h2>
            </div>
            <div className="p-6 space-y-5">
              {/* Facebook */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Facebook className="w-4 h-4 text-blue-600" />
                  Facebook
                </label>
                <input
                  type="url"
                  value={config.facebook}
                  onChange={(e) => handleInputChange('facebook', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900"
                  placeholder="https://facebook.com/tu-cooperativa"
                />
              </div>

              {/* Twitter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Twitter className="w-4 h-4 text-sky-500" />
                  Twitter / X
                </label>
                <input
                  type="url"
                  value={config.twitter}
                  onChange={(e) => handleInputChange('twitter', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900"
                  placeholder="https://twitter.com/tu-cooperativa"
                />
              </div>

              {/* Instagram */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-pink-600" />
                  Instagram
                </label>
                <input
                  type="url"
                  value={config.instagram}
                  onChange={(e) => handleInputChange('instagram', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900"
                  placeholder="https://instagram.com/tu-cooperativa"
                />
              </div>

              {/* LinkedIn */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-blue-700" />
                  LinkedIn
                </label>
                <input
                  type="url"
                  value={config.linkedin}
                  onChange={(e) => handleInputChange('linkedin', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900"
                  placeholder="https://linkedin.com/company/tu-cooperativa"
                />
              </div>

              {/* YouTube */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-red-600" />
                  YouTube
                </label>
                <input
                  type="url"
                  value={config.youtube}
                  onChange={(e) => handleInputChange('youtube', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900"
                  placeholder="https://youtube.com/@tu-cooperativa"
                />
              </div>
            </div>
          </div>

          {/* Terminales Asignadas - Con Tabs Horizontales */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 px-6 py-4 border-b border-amber-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Terminales Asignadas ({terminales.length})
                </h2>
                <Link
                  href="/dashboard/Cooperativa/Admin/terminales"
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-semibold"
                >
                  <Building2 className="w-4 h-4" />
                  Gestionar Terminales
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
            
            {loadingTerminales ? (
              <div className="p-6 text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                <p className="mt-3 text-gray-600 text-sm">Cargando terminales...</p>
              </div>
            ) : terminales.length === 0 ? (
              <div className="p-6 text-center py-8">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No hay terminales asignadas</p>
                <p className="text-gray-500 text-sm mt-1">
                  Asigna las terminales donde opera tu cooperativa
                </p>
                <Link
                  href="/dashboard/Cooperativa/Admin/terminales"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-semibold"
                >
                  <Building2 className="w-4 h-4" />
                  Asignar Terminales
                </Link>
              </div>
            ) : (() => {
              const provinciaActiva = activeProvinciaTab && provinciasDisponibles.includes(activeProvinciaTab) 
                ? activeProvinciaTab 
                : provinciasDisponibles[0];
              
              return (
                <>
                  {/* Tabs de Provincias */}
                  <div className="border-b border-gray-200 bg-gray-50">
                    <div className="flex overflow-x-auto">
                      {provinciasDisponibles.map(provincia => {
                        const cantones = terminalesAgrupados[provincia];
                        const totalProvincia = Object.values(cantones).flat().length;
                        const isActive = provincia === provinciaActiva;
                        
                        return (
                          <button
                            key={provincia}
                            type="button"
                            onClick={() => setActiveProvinciaTab(provincia)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                              isActive
                                ? 'border-amber-600 text-amber-700 bg-white'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <MapPin className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-gray-400'}`} />
                            {provincia}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              isActive ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {totalProvincia}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Contenido del Tab Activo */}
                  {provinciaActiva && terminalesAgrupados[provinciaActiva] && (
                    <div className="p-4">
                      <div className="space-y-4">
                        {Object.keys(terminalesAgrupados[provinciaActiva]).sort().map(canton => {
                          const terminalesCanton = terminalesAgrupados[provinciaActiva][canton];
                          
                          return (
                            <div key={canton} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              {/* Header de Cantón */}
                              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-300">
                                <Building2 className="w-4 h-4 text-amber-600" />
                                <span className="font-semibold text-gray-800">{canton}</span>
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                  {terminalesCanton.length} terminal{terminalesCanton.length !== 1 ? 'es' : ''}
                                </span>
                              </div>
                              
                              {/* Terminales del Cantón */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {terminalesCanton.map(terminal => (
                                  <div
                                    key={terminal.terminalId}
                                    className={`p-3 rounded-lg border-2 bg-white ${
                                      terminal.esSedePrincipal
                                        ? 'border-amber-400'
                                        : 'border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center gap-2">
                                        <Building2 className={`w-4 h-4 ${terminal.esSedePrincipal ? 'text-amber-600' : 'text-gray-500'}`} />
                                        <span className="font-medium text-gray-800 text-sm">{terminal.nombre}</span>
                                      </div>
                                      {terminal.esSedePrincipal && (
                                        <span className="px-1.5 py-0.5 bg-amber-200 text-amber-800 text-xs font-semibold rounded">
                                          Sede
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                                      <span className={`px-2 py-0.5 rounded ${getTipologiaColor(terminal.tipologia)}`}>
                                        {terminal.tipologia}
                                      </span>
                                      {terminal.numeroAndenesAsignados && terminal.numeroAndenesAsignados > 0 && (
                                        <span>{terminal.numeroAndenesAsignados} andenes</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md coop-btn-primary"
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
          </>
        )}
      </div>
    </div>
  );
}
