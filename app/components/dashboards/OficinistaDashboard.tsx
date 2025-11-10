'use client';

import { useState } from 'react';
import { 
  Ticket, 
  ShoppingCart, 
  Calendar,
  DollarSign,
  Search,
  Users,
  TrendingUp,
  Clock,
  LogOut,
  Menu,
  X,
  CheckCircle
} from 'lucide-react';

export default function OficinistaDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('sell');

  const stats = {
    ventasHoy: 45,
    totalHoy: 2850,
    reservasActivas: 12,
    clientesAtendidos: 38,
  };

  const menuItems = [
    { id: 'sell', label: 'Vender Boleto', icon: ShoppingCart },
    { id: 'reservations', label: 'Reservaciones', icon: Calendar },
    { id: 'schedules', label: 'Horarios', icon: Clock },
    { id: 'sales', label: 'Mis Ventas', icon: TrendingUp },
    { id: 'customers', label: 'Clientes', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${
        isSidebarOpen ? 'w-64' : 'w-20'
      } bg-gradient-to-b from-green-700 to-green-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b border-green-800">
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-green-900 font-bold">AB</span>
              </div>
              <div>
                <h2 className="font-bold text-sm">AndinaBus</h2>
                <p className="text-xs text-green-300">Punto de Venta</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-green-800 rounded-lg"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeSection === item.id
                    ? 'bg-green-800 text-white'
                    : 'text-green-100 hover:bg-green-800/50'
                }`}
              >
                <Icon size={20} />
                {isSidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-green-800">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-green-100 hover:bg-green-800/50 rounded-lg transition-colors">
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-sm font-medium">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {menuItems.find(item => item.id === activeSection)?.label}
              </h1>
              <p className="text-sm text-gray-500">Terminal Quitumbe</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">María González</p>
                <p className="text-xs text-gray-500">Oficinista</p>
              </div>
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">MG</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeSection === 'sell' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Ticket className="text-green-600" size={20} />
                    </div>
                    <span className="text-xs font-medium text-gray-500">Ventas Hoy</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">{stats.ventasHoy}</h3>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <DollarSign className="text-blue-600" size={20} />
                    </div>
                    <span className="text-xs font-medium text-gray-500">Total Hoy</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">${stats.totalHoy}</h3>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="text-purple-600" size={20} />
                    </div>
                    <span className="text-xs font-medium text-gray-500">Reservas</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">{stats.reservasActivas}</h3>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Users className="text-orange-600" size={20} />
                    </div>
                    <span className="text-xs font-medium text-gray-500">Clientes</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">{stats.clientesAtendidos}</h3>
                </div>
              </div>

              {/* Sell Ticket Form */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-6">Nueva Venta</h3>
                  
                  <div className="space-y-4">
                    {/* Route Selection */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Origen</label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none">
                          <option>Quito</option>
                          <option>Guayaquil</option>
                          <option>Cuenca</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Destino</label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none">
                          <option>Guayaquil</option>
                          <option>Quito</option>
                          <option>Manta</option>
                        </select>
                      </div>
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                        <input
                          type="date"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hora</label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none">
                          <option>08:00 AM</option>
                          <option>10:30 AM</option>
                          <option>02:00 PM</option>
                          <option>06:00 PM</option>
                        </select>
                      </div>
                    </div>

                    {/* Passenger Info */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cédula del Pasajero</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="1234567890"
                          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        />
                        <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-green-600">
                          <Search size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                        <input
                          type="text"
                          placeholder="Nombre del pasajero"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
                        <input
                          type="text"
                          placeholder="Apellido del pasajero"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </div>

                    <button className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                      <CheckCircle size={20} />
                      Buscar Asientos Disponibles
                    </button>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-6">Resumen</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Ruta</p>
                      <p className="font-semibold text-gray-800">Quito → Guayaquil</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Fecha y Hora</p>
                      <p className="font-semibold text-gray-800">06 Nov, 08:00 AM</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Asiento</p>
                      <p className="font-semibold text-gray-800">No seleccionado</p>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-semibold">$0.00</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-gray-800">
                        <span>Total</span>
                        <span>$0.00</span>
                      </div>
                    </div>

                    <button 
                      disabled
                      className="w-full bg-gray-300 text-gray-500 py-3 rounded-lg font-semibold cursor-not-allowed"
                    >
                      Procesar Venta
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Otras secciones */}
        </div>
      </main>
    </div>
  );
}