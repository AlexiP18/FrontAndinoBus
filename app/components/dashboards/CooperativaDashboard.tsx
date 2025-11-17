'use client';

import { useState, useEffect } from 'react';
import { 
  Bus, 
  Route, 
  TrendingUp, 
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle,
  Wrench,
  PauseCircle,
  MapPin
} from 'lucide-react';
import { cooperativaApi, getToken, ResumenDisponibilidadDto } from '@/lib/api';
import GestionBuses from '../cooperativa/GestionBuses';
import GestionAsignaciones from '../cooperativa/GestionAsignaciones';

export default function CooperativaDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [resumen, setResumen] = useState<ResumenDisponibilidadDto | null>(null);
  const [cooperativaId] = useState(1); // TODO: Obtener del contexto de usuario
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarResumen();
  }, []);

  const cargarResumen = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      const fechaHoy = new Date().toISOString().split('T')[0];
      const data = await cooperativaApi.obtenerResumenDisponibilidad(cooperativaId, fechaHoy, token);
      setResumen(data);
    } catch (error) {
      console.error('Error cargando resumen:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Panel de Control', icon: BarChart3 },
    { id: 'buses', label: 'Gestión de Buses', icon: Bus },
    { id: 'frecuencias', label: 'Frecuencias y Rutas', icon: Route },
    { id: 'asignaciones', label: 'Asignaciones', icon: Calendar },
    { id: 'dias-parada', label: 'Días de Parada', icon: PauseCircle },
    { id: 'reportes', label: 'Reportes', icon: TrendingUp },
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
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Cargando resumen...</p>
                </div>
              ) : resumen ? (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {/* Total Buses */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Bus className="text-blue-600" size={24} />
                        </div>
                      </div>
                      <h3 className="text-3xl font-bold text-gray-800">{resumen.totalBuses}</h3>
                      <p className="text-sm text-gray-500 mt-1">Total de Buses</p>
                    </div>

                    {/* Buses Disponibles */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <CheckCircle className="text-green-600" size={24} />
                        </div>
                      </div>
                      <h3 className="text-3xl font-bold text-gray-800">{resumen.busesDisponibles}</h3>
                      <p className="text-sm text-gray-500 mt-1">Disponibles</p>
                    </div>

                    {/* Buses En Servicio */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <Route className="text-purple-600" size={24} />
                        </div>
                      </div>
                      <h3 className="text-3xl font-bold text-gray-800">{resumen.busesEnServicio}</h3>
                      <p className="text-sm text-gray-500 mt-1">En Servicio</p>
                    </div>

                    {/* Buses en Mantenimiento */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-100 rounded-lg">
                          <Wrench className="text-orange-600" size={24} />
                        </div>
                      </div>
                      <h3 className="text-3xl font-bold text-gray-800">{resumen.busesMantenimiento}</h3>
                      <p className="text-sm text-gray-500 mt-1">Mantenimiento</p>
                    </div>

                    {/* Buses en Parada */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-100 rounded-lg">
                          <PauseCircle className="text-red-600" size={24} />
                        </div>
                      </div>
                      <h3 className="text-3xl font-bold text-gray-800">{resumen.busesParada}</h3>
                      <p className="text-sm text-gray-500 mt-1">En Parada</p>
                    </div>
                  </div>

                  {/* Alerta de Exceso de Buses */}
                  {resumen.excesoBuses > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                      <div className="flex items-start gap-4">
                        <AlertCircle className="text-yellow-600 shrink-0" size={24} />
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-yellow-800 mb-2">
                            Exceso de Buses Detectado
                          </h3>
                          <p className="text-sm text-yellow-700 mb-3">
                            Hay <span className="font-bold">{resumen.excesoBuses}</span> buses sin asignación a frecuencias activas.
                            Se recomienda programar días de parada o asignarlos a nuevas frecuencias.
                          </p>
                          <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium">
                            Gestionar Días de Parada
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No se pudo cargar el resumen
                </div>
              )}

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
            <GestionBuses cooperativaId={cooperativaId} />
          )}

          {activeSection === 'asignaciones' && (
            <GestionAsignaciones cooperativaId={cooperativaId} />
          )}

          {activeSection === 'frecuencias' && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">Gestión de Frecuencias</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <Route size={18} />
                  Nueva Frecuencia
                </button>
              </div>
              <div className="text-center py-12 text-gray-500">
                <Route size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Gestión de frecuencias y paradas intermedias</p>
              </div>
            </div>
          )}

          {activeSection === 'dias-parada' && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">Días de Parada</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <PauseCircle size={18} />
                  Registrar Día de Parada
                </button>
              </div>
              <div className="text-center py-12 text-gray-500">
                <PauseCircle size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Calendario de días de parada para buses</p>
              </div>
            </div>
          )}

          {activeSection === 'reportes' && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Reportes y Estadísticas</h3>
              <div className="text-center py-12 text-gray-500">
                <TrendingUp size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Reportes de desempeño y estadísticas</p>
              </div>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Configuración</h3>
              <div className="text-center py-12 text-gray-500">
                <Settings size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Configuración de la cooperativa</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}