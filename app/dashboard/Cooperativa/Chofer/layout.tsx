'use client';

import { useAuth } from '@/app/context/AuthContext';
import { getFullName } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Bus, 
  Map, 
  Calendar,
  Star,
  LogOut, 
  Menu,
  X,
  Home
} from 'lucide-react';
import { useState } from 'react';
import ProtectedRoute from '@/app/components/ProtectedRoute';

export default function CooperativaChoferLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
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
  ];

  return (
    <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['CHOFER']}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex lg:flex-col w-72 bg-white border-r border-gray-200 shadow-sm">
          {/* Logo y nombre cooperativa */}
          <div className="h-20 flex items-center justify-center border-b border-gray-200 bg-linear-to-r from-orange-600 to-orange-700">
            <div className="text-center">
              <h1 className="text-xl font-bold text-white">AndinaBus</h1>
              <p className="text-xs text-orange-100 mt-0.5">Chofer</p>
            </div>
          </div>

          {/* Info del usuario */}
          <div className="p-4 border-b border-gray-200 bg-linear-to-br from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {user?.nombres?.charAt(0) || 'C'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {user ? getFullName(user) : 'Chofer'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                {user?.cooperativaNombre && (
                  <p className="text-xs text-orange-600 font-medium truncate mt-0.5">
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
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-orange-600'
                  }`}
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
              <div className="h-20 flex items-center justify-between px-4 border-b border-gray-200 bg-linear-to-r from-orange-600 to-orange-700">
                <div>
                  <h1 className="text-xl font-bold text-white">AndinaBus</h1>
                  <p className="text-xs text-orange-100">Chofer</p>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-white hover:bg-orange-700 p-2 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Info del usuario */}
              <div className="p-4 border-b border-gray-200 bg-linear-to-br from-gray-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {user?.nombres?.charAt(0) || 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {user ? getFullName(user) : 'Chofer'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    {user?.cooperativaNombre && (
                      <p className="text-xs text-orange-600 font-medium truncate mt-0.5">
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
                          ? 'bg-orange-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-orange-600'
                      }`}
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
            <h1 className="text-lg font-bold text-gray-800">AndinaBus Chofer</h1>
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
