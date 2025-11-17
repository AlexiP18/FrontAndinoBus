'use client';

import { useState, useEffect } from 'react';
import { Bus, Plus, Search, Filter, Edit, Trash2, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { cooperativaApi, BusDto, getToken } from '@/lib/api';
import RegistrarDiaParadaModal from './RegistrarDiaParadaModal';

interface GestionBusesProps {
  cooperativaId: number;
}

export default function GestionBuses({ cooperativaId }: GestionBusesProps) {
  const [buses, setBuses] = useState<BusDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModalParada, setMostrarModalParada] = useState(false);
  const [busSeleccionado, setBusSeleccionado] = useState<BusDto | null>(null);

  useEffect(() => {
    cargarBuses();
  }, [cooperativaId]);

  const cargarBuses = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      const data = await cooperativaApi.obtenerBuses(cooperativaId, token);
      setBuses(data);
    } catch (error) {
      console.error('Error cargando buses:', error);
    } finally {
      setLoading(false);
    }
  };

  const busesFiltrados = buses.filter(bus => {
    const coincideBusqueda = 
      bus.placa.toLowerCase().includes(busqueda.toLowerCase()) ||
      bus.numeroInterno?.toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideEstado = filtroEstado === 'TODOS' || bus.estado === filtroEstado;
    
    return coincideBusqueda && coincideEstado;
  });

  const getEstadoBadge = (estado: string) => {
    const estilos = {
      DISPONIBLE: 'bg-green-100 text-green-800',
      EN_SERVICIO: 'bg-blue-100 text-blue-800',
      MANTENIMIENTO: 'bg-orange-100 text-orange-800',
      PARADA: 'bg-red-100 text-red-800',
    };
    return estilos[estado as keyof typeof estilos] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header y Controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Buses</h2>
          <p className="text-sm text-gray-500 mt-1">
            {busesFiltrados.length} {busesFiltrados.length === 1 ? 'bus' : 'buses'} encontrados
          </p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={20} />
          Nuevo Bus
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por placa o número interno..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por Estado */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="DISPONIBLE">Disponible</option>
              <option value="EN_SERVICIO">En Servicio</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
              <option value="PARADA">Parada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Buses */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando buses...</p>
        </div>
      ) : busesFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100 text-center">
          <Bus className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No se encontraron buses</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {busesFiltrados.map((bus) => (
            <div key={bus.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Imagen del bus */}
              <div className="h-40 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                {bus.fotoUrl ? (
                  <img src={bus.fotoUrl} alt={bus.placa} className="w-full h-full object-cover" />
                ) : (
                  <Bus className="text-white" size={64} />
                )}
              </div>

              {/* Información */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{bus.placa}</h3>
                    {bus.numeroInterno && (
                      <p className="text-sm text-gray-500">#{bus.numeroInterno}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadge(bus.estado)}`}>
                    {bus.estado.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {bus.chasisMarca && (
                    <p><span className="font-medium">Chasis:</span> {bus.chasisMarca}</p>
                  )}
                  {bus.carroceriaMarca && (
                    <p><span className="font-medium">Carrocería:</span> {bus.carroceriaMarca}</p>
                  )}
                  <p><span className="font-medium">Capacidad:</span> {bus.capacidadAsientos} asientos</p>
                </div>

                {/* Acciones */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                      <Edit size={16} />
                      Editar
                    </button>
                    <button className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      setBusSeleccionado(bus);
                      setMostrarModalParada(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-sm font-medium"
                  >
                    <Calendar size={16} />
                    Registrar Día Parada
                  </button>
                </div>

                {/* Estado de activación */}
                <div className="mt-2 flex items-center justify-center gap-2 text-sm">
                  {bus.activo ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle size={16} />
                      <span>Activo</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600">
                      <XCircle size={16} />
                      <span>Inactivo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Registrar Día de Parada */}
      <RegistrarDiaParadaModal
        isOpen={mostrarModalParada}
        onClose={() => {
          setMostrarModalParada(false);
          setBusSeleccionado(null);
        }}
        cooperativaId={cooperativaId}
        busPreseleccionado={busSeleccionado}
        onSuccess={cargarBuses}
      />
    </div>
  );
}
