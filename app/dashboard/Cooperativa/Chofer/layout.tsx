'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useCooperativaConfig } from '@/app/context/CooperativaConfigContext';
import { getFullName } from '@/lib/auth';
import { resolveResourceUrl } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Bus, 
  Map, 
  Calendar,
  Star,
  LogOut, 
  Menu,
  X,
  Home,
  Clock
} from 'lucide-react';
import { useState } from 'react';
import ProtectedRoute from '@/app/components/ProtectedRoute';

export default function CooperativaChoferLayout({
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
  const primaryColor = cooperativaConfig?.colorPrimario || '#ea580c';
  const secondaryColor = cooperativaConfig?.colorSecundario || '#c2410c';
  const coopName = cooperativaConfig?.nombre || user?.cooperativaNombre || 'Cooperativa';
  const coopLogo = resolveResourceUrl(cooperativaConfig?.logoUrl);

  // Estilos dinámicos
  const headerStyle = {
    background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
  };

  const avatarStyle = {
    backgroundColor: primaryColor
  };

  const menuItems = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/dashboard/Cooperativa/Chofer',
      active: pathname === '/dashboard/Cooperativa/Chofer',
    },
    {
      icon: Bus,
      label: 'Mi Viaje del Día',
      path: '/dashboard/Cooperativa/Chofer/mi-viaje',
      active: pathname?.startsWith('/dashboard/Cooperativa/Chofer/mi-viaje'),
    },
    {
      icon: Map,
      label: 'Mis Rutas',
      path: '/dashboard/Cooperativa/Chofer/mis-rutas',
      active: pathname?.startsWith('/dashboard/Cooperativa/Chofer/mis-rutas'),
    },
    {
      icon: Calendar,
      label: 'Historial de Viajes',
      path: '/dashboard/Cooperativa/Chofer/historial',
      active: pathname?.startsWith('/dashboard/Cooperativa/Chofer/historial'),
    },
    {
      icon: Star,
      label: 'Mis Calificaciones',
      path: '/dashboard/Cooperativa/Chofer/calificaciones',
      active: pathname?.startsWith('/dashboard/Cooperativa/Chofer/calificaciones'),
    },
    {
      icon: Clock,
      label: 'Mis Horas',
      path: '/dashboard/Cooperativa/Chofer/mis-horas',
      active: pathname?.startsWith('/dashboard/Cooperativa/Chofer/mis-horas'),
    },
  ];

  return (
    <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['CHOFER']}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex lg:flex-col w-72 bg-white border-r border-gray-200 shadow-sm">
          {/* Logo y nombre cooperativa */}
          <div 
            className="h-20 flex items-center justify-center border-b border-gray-200"
            style={headerStyle}
          >
            <div className="flex items-center gap-3">
              {coopLogo ? (
                <img 
                  src={coopLogo} 
                  alt={coopName} 
                  className="w-10 h-10 rounded-full object-cover bg-white"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <Bus className="w-6 h-6 text-white" />
                </div>
              )}
              <div className="text-center">
                <h1 className="text-lg font-bold text-white truncate max-w-[160px]">{coopName}</h1>
                <p className="text-xs text-white text-opacity-80 mt-0.5">Panel Chofer</p>
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
                {user?.nombres?.charAt(0) || 'C'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {user ? getFullName(user) : 'Chofer'}
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
                {user?.cedula && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    Lic: {user.cedula}
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
                      ? 'shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={item.active ? { backgroundColor: primaryColor, color: '#ffffff' } : undefined}
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
                  {coopLogo ? (
                    <img 
                      src={coopLogo} 
                      alt={coopName} 
                      className="w-8 h-8 rounded-full object-cover bg-white"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                      <Bus className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-lg font-bold text-white truncate max-w-[140px]">{coopName}</h1>
                    <p className="text-xs text-white text-opacity-80">Chofer</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg"
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
                    {user?.nombres?.charAt(0) || 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {user ? getFullName(user) : 'Chofer'}
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
                    {user?.cedula && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        Lic: {user.cedula}
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
                          ? 'shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      style={item.active ? { backgroundColor: primaryColor, color: '#ffffff' } : undefined}
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
          <header 
            className="lg:hidden h-16 flex items-center justify-between px-4 shadow-sm"
            style={headerStyle}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-white">{coopName}</h1>
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
