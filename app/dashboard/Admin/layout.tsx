'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useConfig } from '@/app/context/ConfigContext';
import { getFullName } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard,
  Building2,
  Map,
  Settings,
  LogOut, 
  Menu,
  X,
  BarChart3,
  Shield,
  Users,
  Navigation
} from 'lucide-react';
import { useState } from 'react';
import ProtectedRoute from '@/app/components/ProtectedRoute';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const { config } = useConfig();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/dashboard/Admin',
      active: pathname === '/dashboard/Admin',
    },
    {
      icon: Navigation,
      label: 'Tracking Global',
      path: '/dashboard/Admin/tracking',
      active: pathname?.startsWith('/dashboard/Admin/tracking'),
    },
    {
      icon: Building2,
      label: 'Cooperativas',
      path: '/dashboard/Admin/cooperativas',
      active: pathname?.startsWith('/dashboard/Admin/cooperativas'),
    },
    {
      icon: Users,
      label: 'Clientes',
      path: '/dashboard/Admin/clientes',
      active: pathname?.startsWith('/dashboard/Admin/clientes'),
    },
    {
      icon: Map,
      label: 'Rutas',
      path: '/dashboard/Admin/rutas',
      active: pathname?.startsWith('/dashboard/Admin/rutas'),
    },
    {
      icon: BarChart3,
      label: 'Reportes',
      path: '/dashboard/Admin/reportes',
      active: pathname?.startsWith('/dashboard/Admin/reportes'),
    },
    {
      icon: Settings,
      label: 'Configuración',
      path: '/dashboard/Admin/configuracion',
      active: pathname?.startsWith('/dashboard/Admin/configuracion'),
    },
  ];

  // Estilos dinámicos basados en la configuración
  const headerStyle = {
    background: config?.colorPrimario 
      ? `linear-gradient(to right, ${config.colorPrimario}, ${config.colorSecundario || config.colorPrimario})`
      : undefined
  };

  const avatarStyle = {
    backgroundColor: config?.colorPrimario || undefined
  };

  const activeMenuStyle = {
    backgroundColor: config?.colorPrimario || undefined
  };

  const appName = config?.nombreAplicacion || 'AndinaBus';

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex lg:flex-col w-72 bg-white border-r border-gray-200 shadow-sm">
          {/* Logo y título */}
          <div 
            className="h-20 flex items-center border-b border-gray-200 px-4"
            style={headerStyle}
          >
            <div className="flex items-center gap-3">
              {/* Logo */}
              {config?.logoUrl ? (
                <div className="bg-white rounded-lg p-1.5 shadow-md shrink-0">
                  <img 
                    src={config.logoUrl} 
                    alt={appName} 
                    className="h-10 w-10 object-contain"
                  />
                </div>
              ) : (
                <div className="bg-white/20 rounded-lg p-2 shrink-0">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              )}
              {/* Nombre y rol */}
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-white truncate">{appName}</h1>
                <p className="text-xs text-white/80">Super Administrador</p>
              </div>
            </div>
          </div>

          {/* Info del usuario */}
          <div className="p-4 border-b border-gray-200 bg-linear-to-br from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={avatarStyle}
              >
                {user?.nombres?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {user ? getFullName(user) : 'Super Admin'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <p 
                  className="text-xs font-medium truncate mt-0.5"
                  style={{ color: config?.colorPrimario || '#2563eb' }}
                >
                  🛡️ Superadministrador
                </p>
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
                    if (!item.active && config?.colorPrimario) {
                      e.currentTarget.style.color = config.colorPrimario;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!item.active) {
                      e.currentTarget.style.color = '';
                    }
                  }}
                >
                  <Icon className="w-5 h-5 shrink-0" />
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
              <div 
                className="h-20 flex items-center justify-between px-4 border-b border-gray-200"
                style={headerStyle}
              >
                <div className="flex items-center gap-3">
                  {/* Logo */}
                  {config?.logoUrl ? (
                    <div className="bg-white rounded-md p-1 shadow shrink-0">
                      <img src={config.logoUrl} alt={appName} className="h-8 w-8 object-contain" />
                    </div>
                  ) : (
                    <div className="bg-white/20 rounded-md p-1.5 shrink-0">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                  )}
                  {/* Nombre y rol */}
                  <div className="min-w-0">
                    <h1 className="text-base font-bold text-white truncate">{appName}</h1>
                    <p className="text-xs text-white/80">Super Administrador</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Info del usuario */}
              <div className="p-4 border-b border-gray-200 bg-linear-to-br from-gray-50 to-white">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={avatarStyle}
                  >
                    {user?.nombres?.charAt(0) || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {user ? getFullName(user) : 'Super Admin'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    <p 
                      className="text-xs font-medium truncate mt-0.5"
                      style={{ color: config?.colorPrimario || '#2563eb' }}
                    >
                      🛡️ Superadministrador
                    </p>
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
                      style={item.active ? activeMenuStyle : undefined}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
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
              {config?.logoUrl ? (
                <img src={config.logoUrl} alt={appName} className="h-8 w-auto object-contain" />
              ) : config?.logoSmallUrl ? (
                <img src={config.logoSmallUrl} alt="Logo" className="w-6 h-6 object-contain" />
              ) : (
                <>
                  <Shield className="w-5 h-5" style={{ color: config?.colorPrimario || '#2563eb' }} />
                  <h1 className="text-lg font-bold text-gray-800">{appName}</h1>
                </>
              )}
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
