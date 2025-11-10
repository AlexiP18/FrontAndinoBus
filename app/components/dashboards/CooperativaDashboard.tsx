'use client';

import { useState } from 'react';
import { 
  Bus, 
  Users, 
  Route, 
  TrendingUp, 
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  MapPin
} from 'lucide-react';

export default function CooperativaDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');

  // Datos de ejemplo - esto vendrá del backend
  const stats = {
    totalBuses: 24,
    busesActivos: 18,
    conductores: 45,
    rutasActivas: 12,
  };

  const menuItems = [
    { id: 'overview', label: 'Resumen', icon: BarChart3 },
    { id: 'buses', label: 'Gestión de Buses', icon: Bus },
    { id: 'drivers', label: 'Conductores', icon: Users },
    { id: 'routes', label: 'Rutas', icon: Route },
    { id: 'schedule', label: 'Horarios', icon: Calendar },
    { id: 'reports', label: 'Reportes', icon: TrendingUp },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${
        isSidebarOpen ? 'w-64' : 'w-20'
      } bg-blue-900 text-white transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-blue-800">
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-blue-900 font-bold">AB</span>
              </div>
              <div>
                <h2 className="font-bold text-sm">AndinaBus</h2>
                <p className="text-xs text-blue-300">Cooperativa</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-blue-800 rounded-lg"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeSection === item.id
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-100 hover:bg-blue-800/50'
                }`}
              >
                <Icon size={20} />
                {isSidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-blue-800">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-blue-100 hover:bg-blue-800/50 rounded-lg transition-colors">
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-sm font-medium">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {menuItems.find(item => item.id === activeSection)?.label}
              </h1>
              <p className="text-sm text-gray-500">Cooperativa TransAndes</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">Juan Pérez</p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">JP</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Bus className="text-blue-600" size={24} />
                    </div>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                      +2 este mes
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800">{stats.totalBuses}</h3>
                  <p className="text-sm text-gray-500 mt-1">Total de Buses</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Bus className="text-green-600" size={24} />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800">{stats.busesActivos}</h3>
                  <p className="text-sm text-gray-500 mt-1">Buses Activos</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Users className="text-purple-600" size={24} />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800">{stats.conductores}</h3>
                  <p className="text-sm text-gray-500 mt-1">Conductores</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Route className="text-orange-600" size={24} />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800">{stats.rutasActivas}</h3>
                  <p className="text-sm text-gray-500 mt-1">Rutas Activas</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Actividad Reciente</h3>
                <div className="space-y-4">
                  {[
                    { action: 'Nuevo bus agregado', detail: 'Bus #025 - Mercedes Benz', time: 'Hace 2 horas' },
                    { action: 'Ruta actualizada', detail: 'Quito - Guayaquil', time: 'Hace 5 horas' },
                    { action: 'Conductor asignado', detail: 'Carlos Mendoza a Bus #018', time: 'Hace 1 día' },
                  ].map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MapPin className="text-blue-600" size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.detail}</p>
                      </div>
                      <span className="text-xs text-gray-400">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'buses' && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">Gestión de Buses</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <Bus size={18} />
                  Agregar Bus
                </button>
              </div>
              <div className="text-center py-12 text-gray-500">
                <Bus size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Aquí irá la tabla de gestión de buses</p>
              </div>
            </div>
          )}

          {/* Otras secciones similares */}
        </div>
      </main>
    </div>
  );
}