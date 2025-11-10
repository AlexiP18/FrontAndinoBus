'use client';

import { useState } from 'react';

import { 
  Ticket, 
  Search,
  MapPin,
  Calendar,
  Clock,
  User,
  CreditCard,
  History,
  Settings,
  LogOut,
  ArrowRight,
  Download
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ClienteDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('search');
const [origen, setOrigen] = useState('');
      const [destino, setDestino] = useState('');
      const [mostrarTabla, setMostrarTabla] = useState(false);
  // Datos de ejemplo
  const upcomingTrips = [
    {
      id: '1',
      origen: 'Quito',
      destino: 'Guayaquil',
      fecha: '2025-11-10',
      hora: '08:00 AM',
      asiento: 'A12',
      precio: 25.00,
      estado: 'Confirmado'
    },
  ];

  const pastTrips = [
    {
      id: '2',
      origen: 'Guayaquil',
      destino: 'Quito',
      fecha: '2025-10-15',
      hora: '02:00 PM',
      asiento: 'B8',
      precio: 25.00,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">AB</span>
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-800">AndinaBus</h1>
                <p className="text-xs text-gray-500">Tu viaje, nuestra prioridad</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                <Settings size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">Alex Ponluisa</p>
                  <p className="text-xs text-gray-500">cliente@email.com</p>
                </div>
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">CR</span>
                </div>
              </div>
              <button className="p-2 text-gray-600 hover:text-red-600 transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'search'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Search size={20} />
                Buscar Boletos
              </div>
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'tickets'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Ticket size={20} />
                Mis Boletos
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'history'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <History size={20} />
                Historial
              </div>
            </button>
          </div>
        </div>

      {/* Search Tab */}
{activeTab === 'search' && (
  <div className="space-y-6">
    {/* Search Form */}
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">¿A dónde viajas hoy?</h2>

      {/* Estados */}
      {/* 👇 Añade estos estados arriba en tu componente */}
      {/*  */}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Origen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} className="inline mr-2" />
              Origen
            </label>
            <select
              value={origen}
              onChange={(e) => setOrigen(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Seleccionar origen</option>
              <option>Quito</option>
              <option>Guayaquil</option>
              <option>Cuenca</option>
              <option>Ambato</option>
              <option>Manta</option>
            </select>
          </div>

          {/* Destino */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} className="inline mr-2" />
              Destino
            </label>
            <select
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Seleccionar destino</option>
              <option>Quito</option>
              <option>Guayaquil</option>
              <option>Cuenca</option>
              <option>Ambato</option>
              <option>Manta</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => {
            if (origen && destino && origen !== destino) setMostrarTabla(true);
            else alert('Selecciona un origen y destino válidos');
          }}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          <Search size={20} />
          Buscar Boletos
        </button>
      </div>
    </div>

    {/* Tabla de resultados */}
    {mostrarTabla && (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 animate-fadeIn">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Rutas disponibles de {origen} a {destino}
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Precio</th>
                <th className="px-4 py-3 text-left">Cooperativa</th>
                <th className="px-4 py-3 text-left">Bus Nº</th>
                <th className="px-4 py-3 text-left">Tipo de viaje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
  {[
    { fecha: '2025-11-10', precio: 25, coop: 'Coop. Andina', bus: 'A123', tipo: 'Directo' },
    { fecha: '2025-11-11', precio: 20, coop: 'Coop. Amazonas', bus: 'B456', tipo: 'Con paradas' },
    { fecha: '2025-11-12', precio: 23, coop: 'Coop. Rutas del Sol', bus: 'C789', tipo: 'Directo' },
  ].map((ruta, i) => (
    <tr key={i} className="hover:bg-blue-50 transition-colors">
      <td className="px-4 py-3">{ruta.fecha}</td>
      <td className="px-4 py-3">${ruta.precio.toFixed(2)}</td>
      <td className="px-4 py-3">{ruta.coop}</td>
      <td className="px-4 py-3">{ruta.bus}</td>
      <td className="px-4 py-3">{ruta.tipo}</td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => router.push(`/dashboard/Cliente/asientos?bus=${ruta.bus}&precio=${ruta.precio}`)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Seleccionar viaje
        </button>
      </td>
    </tr>
  ))}
</tbody>

          </table>
        </div>
      </div>
    )}
  </div>
)}


        {/* My Tickets Tab */}
        {activeTab === 'tickets' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Próximos Viajes</h2>
            
            {upcomingTrips.length > 0 ? (
              <div className="space-y-4">
                {upcomingTrips.map((trip) => (
                  <div key={trip.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-800">{trip.origen}</p>
                            <p className="text-sm text-gray-500">{trip.hora}</p>
                          </div>
                          <ArrowRight size={24} className="text-blue-600" />
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-800">{trip.destino}</p>
                            <p className="text-sm text-gray-500">~8 horas</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            {new Date(trip.fecha).toLocaleDateString('es-EC', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </div>
                          <div className="flex items-center gap-2">
                            <Ticket size={16} />
                            Asiento {trip.asiento}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-2">
                          {trip.estado}
                        </span>
                        <p className="text-2xl font-bold text-gray-800">${trip.precio.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                        <Download size={18} />
                        Descargar Boleto
                      </button>
                      <button className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Ticket size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No tienes boletos próximos</p>
                <button 
                  onClick={() => setActiveTab('search')}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Comprar Boleto
                </button>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Historial de Viajes</h2>
            
            <div className="space-y-4">
              {pastTrips.map((trip) => (
                <div key={trip.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 opacity-75">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-800">{trip.origen}</p>
                      </div>
                      <ArrowRight size={20} className="text-gray-400" />
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-800">{trip.destino}</p>
                      </div>
                      <div className="ml-6 text-sm text-gray-600">
                        <p>{new Date(trip.fecha).toLocaleDateString('es-EC')}</p>
                        <p>{trip.hora}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-800">${trip.precio.toFixed(2)}</p>
                      <span className="text-xs text-gray-500">Completado</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}