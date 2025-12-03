'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useCooperativaConfig } from '@/app/context/CooperativaConfigContext';
import { getFullName } from '@/lib/auth';
import { resolveResourceUrl } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Bus, 
  Users, 
  Clock, 
  BarChart3, 
  LogOut, 
  UserCircle,
  Menu,
  X,
  Home,
  Settings,
  Building2
} from 'lucide-react';
import { useState } from 'react';
import ProtectedRoute from '@/app/components/ProtectedRoute';

export default function CooperativaAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const { cooperativaConfig } = useCooperativaConfig();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Colores dinámicos de la cooperativa
  const primaryColor = cooperativaConfig?.colorPrimario || '#16a34a';
  const secondaryColor = cooperativaConfig?.colorSecundario || '#15803d';
  const coopName = cooperativaConfig?.nombre || user?.cooperativaNombre || 'Cooperativa';
  const coopLogo = resolveResourceUrl(cooperativaConfig?.logoUrl);

  // Estilos dinámicos
  const headerStyle = {
    background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
  };

  const avatarStyle = {
    backgroundColor: primaryColor
  };

  const activeMenuStyle = {
    backgroundColor: primaryColor,
    color: '#ffffff'
  };

  const menuItems = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/dashboard/Cooperativa/Admin',
      active: pathname === '/dashboard/Cooperativa/Admin',
    },
    {
      icon: Bus,
      label: 'Gestión de Buses',
      path: '/dashboard/Cooperativa/Admin/buses',
      active: pathname?.startsWith('/dashboard/Cooperativa/Admin/buses'),
    },
    {
      icon: Users,
      label: 'Personal',
      path: '/dashboard/Cooperativa/Admin/personal',
      active: pathname?.startsWith('/dashboard/Cooperativa/Admin/personal'),
    },
    {
      icon: Clock,
      label: 'Frecuencias',
      path: '/dashboard/Cooperativa/Admin/frecuencias',
      active: pathname?.startsWith('/dashboard/Cooperativa/Admin/frecuencias'),
    },
    {
      icon: Building2,
      label: 'Terminales',
      path: '/dashboard/Cooperativa/Admin/terminales',
      active: pathname?.startsWith('/dashboard/Cooperativa/Admin/terminales'),
    },
    {
      icon: BarChart3,
      label: 'Reportes',
      path: '/dashboard/Cooperativa/Admin/reportes',
      active: pathname?.startsWith('/dashboard/Cooperativa/Admin/reportes'),
    },
    {
      icon: Settings,
      label: 'Configuración',
      path: '/dashboard/Cooperativa/Admin/configuracion',
      active: pathname?.startsWith('/dashboard/Cooperativa/Admin/configuracion'),
    },
  ];

  return (
    <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['ADMIN']}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex lg:flex-col w-72 bg-white border-r border-gray-200 shadow-sm">
          {/* Logo y nombre cooperativa */}
          <div 
            className="h-20 flex items-center border-b border-gray-200 px-4"
            style={headerStyle}
          >
            <div className="flex items-center gap-3">
              {/* Logo */}
              {coopLogo ? (
                <div className="bg-white rounded-lg p-1.5 shadow-md shrink-0">
                  <img 
                    src={coopLogo} 
                    alt={coopName} 
                    className="h-10 w-10 object-contain"
                  />
                </div>
              ) : (
                <div className="bg-white/20 rounded-lg p-2 shrink-0">
                  <Bus className="w-8 h-8 text-white" />
                </div>
              )}
              {/* Nombre y rol */}
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-white truncate">{coopName}</h1>
                <p className="text-xs text-white/80">Admin Cooperativa</p>
              </div>
            </div>
          </div>

          {/* Info del usuario */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={avatarStyle}
              >
                {user?.nombres?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {user ? getFullName(user) : 'Administrador'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                {user?.cooperativaNombre && (
                  <p 
                    className="text-xs font-medium truncate mt-0.5"
                    style={{ color: primaryColor }}
                  >
                    🚌 {user.cooperativaNombre}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Menú de navegación */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    item.active
                      ? 'text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={item.active ? activeMenuStyle : undefined}
                  onMouseEnter={(e) => {
                    if (!item.active) {
                      e.currentTarget.style.color = primaryColor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!item.active) {
                      e.currentTarget.style.color = '';
                    }
                  }}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Botón de cerrar sesión */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium text-sm">Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* Sidebar Mobile (Overlay) */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}>
            <aside className="w-72 h-full bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
              {/* Header con botón cerrar */}
              <div className="h-20 flex items-center justify-between px-4 border-b border-gray-200" style={headerStyle}>
                <div className="flex items-center gap-3">
                  {/* Logo */}
                  {coopLogo ? (
                    <img 
                      src={coopLogo} 
                      alt={`Logo ${coopName}`}
                      className="w-10 h-10 object-contain rounded-lg bg-white p-1"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                      <Bus className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-lg font-bold text-white">{coopName}</h1>
                    <p className="text-xs text-white/80">Admin Cooperativa</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Info del usuario */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-gray-50 to-white">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {user?.nombres?.charAt(0) || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {user ? getFullName(user) : 'Administrador'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    {user?.cooperativaNombre && (
                      <p className="text-xs font-medium truncate mt-0.5" style={{ color: primaryColor }}>
                        🚌 {user.cooperativaNombre}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Menú de navegación */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        router.push(item.path);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        item.active
                          ? 'text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      style={item.active ? { backgroundColor: primaryColor, color: '#ffffff' } : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium text-sm">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Botón de cerrar sesión */}
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium text-sm">Cerrar Sesión</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header mobile */}
          <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-700 hover:bg-gray-100 p-2 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              {coopLogo ? (
                <img 
                  src={coopLogo} 
                  alt={`Logo ${coopName}`}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <Bus className="w-6 h-6" style={{ color: primaryColor }} />
              )}
              <h1 className="text-lg font-bold text-gray-800">{coopName}</h1>
            </div>
            <div className="w-10"></div>
          </header>

          {/* Área de contenido con scroll */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
