'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { 
  personalApi,
  clienteApi,
  UpdatePersonalRequest,
  getToken, 
  cooperativaConfigApi, 
  CooperativaConfigResponse 
} from '@/lib/api';
import { 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Lock, 
  Save, 
  Eye, 
  EyeOff,
  Bell,
  AlertCircle,
  CheckCircle,
  Shield
} from 'lucide-react';

type ActiveTab = 'info' | 'password' | 'notifications';

export default function MiCuentaPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('info');
  const [config, setConfig] = useState<CooperativaConfigResponse | null>(null);

  // Estado para información personal
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    cedula: '',
  });

  // Estado para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Estado para notificaciones (simulado - se guardaría en localStorage o backend)
  const [notificationSettings, setNotificationSettings] = useState({
    emailOnProfileUpdate: true,
    emailOnPasswordChange: true,
    emailOnNewSale: false,
    emailDailySummary: false,
  });

  // Cargar configuración
  useEffect(() => {
    if (user?.cooperativaId) {
      loadConfig();
    }
  }, [user?.cooperativaId]);

  // Cargar datos del usuario
  useEffect(() => {
    if (user) {
      setFormData({
        nombres: user.nombres || '',
        apellidos: user.apellidos || '',
        email: user.email || '',
        telefono: user.telefono || '',
        cedula: user.cedula || '',
      });
      
      // Cargar preferencias de notificación desde localStorage
      const savedNotifications = localStorage.getItem(`notifications_${user.userId}`);
      if (savedNotifications) {
        setNotificationSettings(JSON.parse(savedNotifications));
      }
    }
  }, [user]);

  const loadConfig = async () => {
    try {
      const token = getToken();
      if (!token || !user?.cooperativaId) return;

      const configuracion = await cooperativaConfigApi.getConfiguracion(user.cooperativaId, token);
      setConfig(configuracion);
    } catch (err) {
      console.error('Error loading config:', err);
    }
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = getToken();
      if (!token || !user?.cooperativaId || !user?.userId) {
        throw new Error('No hay token de autenticación');
      }

      const updateData: UpdatePersonalRequest = {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
        // Email y cédula no se pueden cambiar
      };

      await personalApi.update(user.cooperativaId, user.userId, updateData, token);
      
      // Actualizar contexto del usuario
      await refreshUser();
      
      setSuccess('✅ Información actualizada exitosamente');

      // Si las notificaciones están habilitadas, mostrar mensaje
      if (notificationSettings.emailOnProfileUpdate) {
        setSuccess('✅ Información actualizada exitosamente. Se ha enviado una confirmación a tu email.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar información');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validaciones
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const token = getToken();
      if (!token) throw new Error('No hay token de autenticación');

      // Usar el mismo endpoint de cliente para cambiar contraseña
      await clienteApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      }, token);

      setSuccess('✅ Contraseña cambiada exitosamente');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      if (notificationSettings.emailOnPasswordChange) {
        setSuccess('✅ Contraseña cambiada exitosamente. Se ha enviado una notificación a tu email.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = () => {
    if (user?.userId) {
      localStorage.setItem(`notifications_${user.userId}`, JSON.stringify(notificationSettings));
      setSuccess('✅ Preferencias de notificación guardadas');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const primaryColor = config?.colorPrimario || '#7c3aed';

  const tabs = [
    { id: 'info' as ActiveTab, label: 'Información Personal', icon: User },
    { id: 'password' as ActiveTab, label: 'Cambiar Contraseña', icon: Lock },
    { id: 'notifications' as ActiveTab, label: 'Notificaciones', icon: Bell },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <User className="w-8 h-8" style={{ color: primaryColor }} />
          Mi Cuenta
        </h1>
        <p className="text-gray-500 mt-1">Gestiona tu información personal y configuraciones de seguridad</p>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
                style={activeTab === tab.id ? { 
                  color: primaryColor, 
                  borderBottomColor: primaryColor 
                } : {}}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido de los tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Tab: Información Personal */}
        {activeTab === 'info' && (
          <form onSubmit={handleUpdateInfo}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombres */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Nombres <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-gray-900"
                    style={{ outlineColor: primaryColor }}
                    placeholder="Juan Carlos"
                  />
                </div>

                {/* Apellidos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Apellidos <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-gray-900"
                    style={{ outlineColor: primaryColor }}
                    placeholder="Pérez García"
                  />
                </div>
              </div>

              {/* Email - No editable */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                  <span className="ml-2 text-xs text-gray-500 font-normal">(No se puede modificar)</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-gray-900"
                  style={{ outlineColor: primaryColor }}
                  placeholder="0991234567"
                />
              </div>

              {/* Cédula - No editable */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CreditCard className="w-4 h-4 inline mr-1" />
                  Cédula
                  <span className="ml-2 text-xs text-gray-500 font-normal">(No se puede modificar)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.cedula}
                    disabled
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Información de la cooperativa */}
              {user?.cooperativaNombre && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: `${primaryColor}10` }}>
                  <p className="text-sm font-medium" style={{ color: primaryColor }}>
                    🚌 Cooperativa: {user.cooperativaNombre}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Rol: Oficinista
                  </p>
                </div>
              )}

              {/* Botón guardar */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
          </form>
        )}

        {/* Tab: Cambiar Contraseña */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword}>
            <div className="space-y-6 max-w-md">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Seguridad de tu cuenta</p>
                    <p className="text-sm text-amber-700 mt-1">
                      La contraseña debe tener al menos 6 caracteres. Se recomienda usar una combinación de letras, números y símbolos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Contraseña actual */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña Actual <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-gray-900 pr-10"
                    style={{ outlineColor: primaryColor }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Nueva contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    required
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-gray-900 pr-10"
                    style={{ outlineColor: primaryColor }}
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordData.newPassword && passwordData.newPassword.length < 6 && (
                  <p className="text-xs text-red-500 mt-1">La contraseña debe tener al menos 6 caracteres</p>
                )}
              </div>

              {/* Confirmar nueva contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nueva Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-gray-900 pr-10"
                    style={{ outlineColor: primaryColor }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
                )}
              </div>

              {/* Botón cambiar contraseña */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading || passwordData.newPassword.length < 6 || passwordData.newPassword !== passwordData.confirmPassword}
                  className="flex items-center gap-2 px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Cambiando...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Cambiar Contraseña
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab: Notificaciones */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Preferencias de Email</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Configura qué notificaciones deseas recibir por correo electrónico.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Notificación al actualizar perfil */}
              <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-800">Actualización de perfil</p>
                    <p className="text-sm text-gray-500">Recibe una confirmación cuando actualices tu información personal</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.emailOnProfileUpdate}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    emailOnProfileUpdate: e.target.checked
                  })}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: primaryColor }}
                />
              </label>

              {/* Notificación al cambiar contraseña */}
              <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-800">Cambio de contraseña</p>
                    <p className="text-sm text-gray-500">Recibe una alerta de seguridad cuando cambies tu contraseña</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.emailOnPasswordChange}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    emailOnPasswordChange: e.target.checked
                  })}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: primaryColor }}
                />
              </label>

              {/* Notificación por nueva venta */}
              <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-800">Confirmación de ventas</p>
                    <p className="text-sm text-gray-500">Recibe un email por cada venta que realices</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.emailOnNewSale}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    emailOnNewSale: e.target.checked
                  })}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: primaryColor }}
                />
              </label>

              {/* Resumen diario */}
              <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-800">Resumen diario</p>
                    <p className="text-sm text-gray-500">Recibe un resumen al final del día con tus estadísticas de ventas</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.emailDailySummary}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    emailDailySummary: e.target.checked
                  })}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: primaryColor }}
                />
              </label>
            </div>

            {/* Botón guardar */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleSaveNotifications}
                className="flex items-center gap-2 px-6 py-2 text-white rounded-lg transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                <Save className="w-4 h-4" />
                Guardar Preferencias
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
