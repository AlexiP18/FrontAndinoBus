'use client';

import { useAuth } from '@/app/context/AuthContext';
import { getFullName } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Ticket, 
  Calendar, 
  Bus,
  LogOut, 
  Menu,
  X,
  Home,
  History,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { cooperativaConfigApi, CooperativaConfigResponse, getToken, resolveResourceUrl } from '@/lib/api';

export default function CooperativaOficinistaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Persistir estado de colapso en localStorage
  useEffect(() => {
    const saved = localStorage.getItem('oficinistaSidebarCollapsed');
    if (saved !== null) {
      setSidebarCollapsed(saved === 'true');
    }
  }, []);

  const toggleSidebarCollapse = () => {
    const newValue = !sidebarCollapsed;
    setSidebarCollapsed(newValue);
    localStorage.setItem('oficinistaSidebarCollapsed', String(newValue));
  };
  const [config, setConfig] = useState<CooperativaConfigResponse | null>(null);

  // Cargar configuración de la cooperativa
  useEffect(() => {
    const loadConfig = async () => {
      if (user?.cooperativaId) {
        try {
          const token = getToken();
          if (token) {
            const configuracion = await cooperativaConfigApi.getConfiguracion(user.cooperativaId, token);
            setConfig(configuracion);
          }
        } catch (error) {
          console.error('Error loading cooperativa config:', error);
        }
      }
    };
    loadConfig();
  }, [user?.cooperativaId]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Colores institucionales o default
  const primaryColor = config?.colorPrimario || '#7c3aed';
  const secondaryColor = config?.colorSecundario || '#6366f1';
  const cooperativaName = config?.nombre || user?.cooperativaNombre || 'AndinaBus';
  const logoUrl = config?.logoUrl;

  const menuItems = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/dashboard/Cooperativa/Oficinista',
      active: pathname === '/dashboard/Cooperativa/Oficinista',
    },
    {
      icon: Ticket,
      label: 'Vender Boleto',
      path: '/dashboard/Cooperativa/Oficinista/vender-boleto',
      active: pathname?.startsWith('/dashboard/Cooperativa/Oficinista/vender-boleto'),
    },
    {
      icon: Calendar,
      label: 'Reservas',
      path: '/dashboard/Cooperativa/Oficinista/reservas',
      active: pathname?.startsWith('/dashboard/Cooperativa/Oficinista/reservas'),
    },
    {
      icon: Bus,
      label: 'Buses en Viaje',
      path: '/dashboard/Cooperativa/Oficinista/buses-viaje',
      active: pathname?.startsWith('/dashboard/Cooperativa/Oficinista/buses-viaje'),
    },
    {
      icon: History,
      label: 'Viajes Pasados',
      path: '/dashboard/Cooperativa/Oficinista/viajes-pasados',
      active: pathname?.startsWith('/dashboard/Cooperativa/Oficinista/viajes-pasados'),
    },
    {
      icon: User,
      label: 'Mi Cuenta',
      path: '/dashboard/Cooperativa/Oficinista/mi-cuenta',
      active: pathname?.startsWith('/dashboard/Cooperativa/Oficinista/mi-cuenta'),
    },
  ];

  return (
    <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['OFICINISTA']}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar Desktop */}
        <aside className={`hidden lg:flex lg:flex-col bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-72'
        }`}>
          {/* Logo y nombre cooperativa */}
          <div 
            className="h-20 flex items-center border-b border-gray-200 px-4 relative"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
          >
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={cooperativaName}
                  className={`rounded-full object-cover border-2 border-white/30 shrink-0 ${
                    sidebarCollapsed ? 'w-10 h-10' : 'w-10 h-10'
                  }`}
                />
              ) : (
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {cooperativaName.charAt(0)}
                </div>
              )}
              {!sidebarCollapsed && (
                <div className="text-left min-w-0">
                  <h1 className="text-lg font-bold text-white truncate">{cooperativaName}</h1>
                  <p className="text-xs text-white/70 mt-0.5">Oficinista</p>
                </div>
              )}
            </div>
            
            {/* Botón de colapsar */}
            <button
              onClick={toggleSidebarCollapse}
              className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-50 transition-colors z-10"
              title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>

          {/* Info del usuario */}
          <div className={`border-b border-gray-200 bg-linear-to-br from-gray-50 to-white ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
              {/* Foto del usuario o inicial */}
              {user?.fotoUrl && (
                <img 
                  src={resolveResourceUrl(user.fotoUrl) || ''}
                  alt={user.nombres || 'Usuario'}
                  className={`rounded-full object-cover ${
                    sidebarCollapsed ? 'w-10 h-10' : 'w-12 h-12'
                  }`}
                  onError={(e) => {
                    // Si la imagen falla, mostrar inicial
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              )}
              <div 
                className={`rounded-full flex items-center justify-center text-white font-bold ${
                  sidebarCollapsed ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-lg'
                } ${user?.fotoUrl ? 'hidden' : ''}`}
                style={{ backgroundColor: primaryColor }}
                title={sidebarCollapsed ? (user ? getFullName(user) : 'Oficinista') : undefined}
              >
                {user?.nombres?.charAt(0) || 'O'}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {user ? getFullName(user) : 'Oficinista'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  {user?.cooperativaNombre && (
                    <p className="text-xs font-medium truncate mt-0.5 flex items-center gap-1" style={{ color: primaryColor }}>
                      <Bus className="w-3 h-3" /> {user.cooperativaNombre}
                    </p>
                  )}
                  {user?.cedula && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      Cód: {user.cedula}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Menú de navegación */}
          <nav className={`flex-1 overflow-y-auto space-y-1 ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center rounded-lg transition-all ${
                    sidebarCollapsed 
                      ? 'justify-center px-2 py-3' 
                      : 'gap-3 px-4 py-3'
                  } ${
                    item.active
                      ? 'shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={item.active ? { backgroundColor: primaryColor, color: '#ffffff' } : {}}
                  onMouseEnter={(e) => {
                    if (!item.active) {
                      e.currentTarget.style.color = primaryColor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!item.active) {
                      e.currentTarget.style.color = '#374151';
                    }
                  }}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="font-medium text-sm">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Botón de cerrar sesión */}
          <div className={`border-t border-gray-200 ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center rounded-lg text-red-600 hover:bg-red-50 transition-all ${
                sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'
              }`}
              title={sidebarCollapsed ? 'Cerrar Sesión' : undefined}
            >
              <LogOut className="w-5 h-5" />
              {!sidebarCollapsed && (
                <span className="font-medium text-sm">Cerrar Sesión</span>
              )}
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
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt={cooperativaName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {cooperativaName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h1 className="text-lg font-bold text-white">{cooperativaName}</h1>
                    <p className="text-xs text-white/70">Oficinista</p>
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
                    style={{ backgroundColor: primaryColor }}
                  >
                    {user?.nombres?.charAt(0) || 'O'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {user ? getFullName(user) : 'Oficinista'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    {user?.cooperativaNombre && (
                      <p className="text-xs font-medium truncate mt-0.5 flex items-center gap-1" style={{ color: primaryColor }}>
                        <Bus className="w-3 h-3" /> {user.cooperativaNombre}
                      </p>
                    )}
                    {user?.cedula && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        Cód: {user.cedula}
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
                      style={item.active ? { backgroundColor: primaryColor, color: '#ffffff' } : {}}
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
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={cooperativaName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : null}
              <h1 className="text-lg font-bold text-gray-800">{cooperativaName}</h1>
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
