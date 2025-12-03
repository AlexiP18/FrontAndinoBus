'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/api';
import {
  Building2,
  MapPin,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Bus,
  Clock,
  Filter
} from 'lucide-react';

interface Terminal {
  id: number;
  nombre: string;
  provincia: string;
  canton: string;
  tipologia: string;
  descripcionTipologia: string;
  andenes: number;
  frecuenciasPorAnden: number;
  maxFrecuenciasDiarias: number;
  latitud?: number;
  longitud?: number;
  direccion?: string;
  telefono?: string;
  horarioApertura?: string;
  horarioCierre?: string;
  activo: boolean;
}

interface TerminalStats {
  totalTerminales: number;
  terminalesT1: number;
  terminalesT2: number;
  terminalesT3: number;
  terminalesT4: number;
  terminalesT5: number;
  capacidadTotalFrecuencias: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function TerminalesPage() {
  const router = useRouter();
  const [terminales, setTerminales] = useState<Terminal[]>([]);
  const [stats, setStats] = useState<TerminalStats | null>(null);
  const [provincias, setProvincias] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipologia, setFiltroTipologia] = useState<string>('');
  const [filtroProvincia, setFiltroProvincia] = useState<string>('');
  const [ordenarPor, setOrdenarPor] = useState<'nombre' | 'provincia' | 'andenes' | 'tipologia'>('nombre');
  const [ordenAsc, setOrdenAsc] = useState(true);
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [terminalSeleccionado, setTerminalSeleccionado] = useState<Terminal | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const [terminalesRes, statsRes, provinciasRes] = await Promise.all([
        fetch(`${API_BASE}/api/terminales`, { headers }),
        fetch(`${API_BASE}/api/terminales/estadisticas`, { headers }),
        fetch(`${API_BASE}/api/terminales/provincias`, { headers })
      ]);

      if (!terminalesRes.ok) throw new Error('Error al cargar terminales');
      
      const [terminalesData, statsData, provinciasData] = await Promise.all([
        terminalesRes.json(),
        statsRes.ok ? statsRes.json() : null,
        provinciasRes.ok ? provinciasRes.json() : []
      ]);

      setTerminales(terminalesData);
      setStats(statsData);
      setProvincias(provinciasData);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const getTipologiaColor = (tipologia: string) => {
    const colors: Record<string, string> = {
      'T1': 'bg-gray-100 text-gray-700 border-gray-300',
      'T2': 'bg-blue-100 text-blue-700 border-blue-300',
      'T3': 'bg-green-100 text-green-700 border-green-300',
      'T4': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'T5': 'bg-purple-100 text-purple-700 border-purple-300'
    };
    return colors[tipologia] || 'bg-gray-100 text-gray-700';
  };

  const terminalesFiltrados = terminales
    .filter(t => {
      const matchBusqueda = t.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                           t.canton.toLowerCase().includes(busqueda.toLowerCase()) ||
                           t.provincia.toLowerCase().includes(busqueda.toLowerCase());
      const matchTipologia = !filtroTipologia || t.tipologia === filtroTipologia;
      const matchProvincia = !filtroProvincia || t.provincia === filtroProvincia;
      return matchBusqueda && matchTipologia && matchProvincia;
    })
    .sort((a, b) => {
      let comparacion = 0;
      switch (ordenarPor) {
        case 'nombre':
          comparacion = a.nombre.localeCompare(b.nombre);
          break;
        case 'provincia':
          comparacion = a.provincia.localeCompare(b.provincia);
          break;
        case 'andenes':
          comparacion = a.andenes - b.andenes;
          break;
        case 'tipologia':
          comparacion = a.tipologia.localeCompare(b.tipologia);
          break;
      }
      return ordenAsc ? comparacion : -comparacion;
    });

  const handleOrdenar = (campo: typeof ordenarPor) => {
    if (ordenarPor === campo) {
      setOrdenAsc(!ordenAsc);
    } else {
      setOrdenarPor(campo);
      setOrdenAsc(true);
    }
  };

  const verDetalle = (terminal: Terminal) => {
    setTerminalSeleccionado(terminal);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Terminales Terrestres</h1>
        </div>
        <p className="text-gray-600">Gestión de terminales y capacidad de frecuencias</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">Total Terminales</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalTerminales}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-gray-400">
            <p className="text-sm text-gray-500">T1 - Básico</p>
            <p className="text-2xl font-bold text-gray-700">{stats.terminalesT1}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-400">
            <p className="text-sm text-gray-500">T2 - Pequeño</p>
            <p className="text-2xl font-bold text-blue-700">{stats.terminalesT2}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-400">
            <p className="text-sm text-gray-500">T3 - Mediano</p>
            <p className="text-2xl font-bold text-green-700">{stats.terminalesT3}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-yellow-400">
            <p className="text-sm text-gray-500">T4 - Grande</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.terminalesT4}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-400">
            <p className="text-sm text-gray-500">T5 - Principal</p>
            <p className="text-2xl font-bold text-purple-700">{stats.terminalesT5}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-indigo-500">
            <p className="text-sm text-gray-500">Capacidad Total</p>
            <p className="text-2xl font-bold text-indigo-700">
              {stats.capacidadTotalFrecuencias.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">frec/día</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre, ciudad o provincia..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={filtroTipologia}
            onChange={(e) => setFiltroTipologia(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las tipologías</option>
            <option value="T1">T1 - Básico</option>
            <option value="T2">T2 - Pequeño</option>
            <option value="T3">T3 - Mediano</option>
            <option value="T4">T4 - Grande</option>
            <option value="T5">T5 - Principal</option>
          </select>

          <select
            value={filtroProvincia}
            onChange={(e) => setFiltroProvincia(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las provincias</option>
            {provincias.map(prov => (
              <option key={prov} value={prov}>{prov}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setBusqueda('');
              setFiltroTipologia('');
              setFiltroProvincia('');
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleOrdenar('nombre')}
                >
                  <div className="flex items-center gap-2">
                    Terminal
                    {ordenarPor === 'nombre' && (ordenAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleOrdenar('provincia')}
                >
                  <div className="flex items-center gap-2">
                    Ubicación
                    {ordenarPor === 'provincia' && (ordenAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleOrdenar('tipologia')}
                >
                  <div className="flex items-center gap-2">
                    Tipología
                    {ordenarPor === 'tipologia' && (ordenAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleOrdenar('andenes')}
                >
                  <div className="flex items-center gap-2">
                    Andenes
                    {ordenarPor === 'andenes' && (ordenAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Capacidad Diaria
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {terminalesFiltrados.map((terminal) => (
                <tr key={terminal.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{terminal.nombre}</p>
                        {terminal.direccion && (
                          <p className="text-sm text-gray-500 truncate max-w-[200px]">{terminal.direccion}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-900">{terminal.canton}</p>
                        <p className="text-sm text-gray-500">{terminal.provincia}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTipologiaColor(terminal.tipologia)}`}>
                      {terminal.tipologia}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{terminal.descripcionTipologia}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Bus className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 font-medium">{terminal.andenes}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-900 font-medium">
                        {terminal.maxFrecuenciasDiarias.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">frecuencias/día</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {terminal.activo ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <AlertCircle className="w-3 h-3" />
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => verDetalle(terminal)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/Admin/terminales/${terminal.id}/ocupacion`)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Ver ocupación"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {terminalesFiltrados.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron terminales con los filtros aplicados</p>
          </div>
        )}
      </div>

      {/* Modal de Detalle */}
      {showModal && terminalSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{terminalSeleccionado.nombre}</h2>
                    <p className="text-gray-500">{terminalSeleccionado.canton}, {terminalSeleccionado.provincia}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Información General */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Tipología</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTipologiaColor(terminalSeleccionado.tipologia)}`}>
                    {terminalSeleccionado.tipologia} - {terminalSeleccionado.descripcionTipologia}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Andenes</p>
                  <p className="text-2xl font-bold text-gray-900">{terminalSeleccionado.andenes}</p>
                </div>
              </div>

              {/* Capacidad */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Capacidad de Frecuencias</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-700">Por Andén (diario)</p>
                    <p className="text-xl font-bold text-blue-900">{terminalSeleccionado.frecuenciasPorAnden}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Total Diario</p>
                    <p className="text-xl font-bold text-blue-900">
                      {terminalSeleccionado.maxFrecuenciasDiarias.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Horario */}
              {(terminalSeleccionado.horarioApertura || terminalSeleccionado.horarioCierre) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Horario de Operación</h3>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      {terminalSeleccionado.horarioApertura || '05:00'} - {terminalSeleccionado.horarioCierre || '23:00'}
                    </span>
                  </div>
                </div>
              )}

              {/* Ubicación */}
              {terminalSeleccionado.latitud && terminalSeleccionado.longitud && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Coordenadas GPS</h3>
                  <p className="text-gray-600">
                    {terminalSeleccionado.latitud}, {terminalSeleccionado.longitud}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${terminalSeleccionado.latitud},${terminalSeleccionado.longitud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                  >
                    Ver en Google Maps →
                  </a>
                </div>
              )}

              {/* Contacto */}
              {terminalSeleccionado.telefono && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Contacto</h3>
                  <p className="text-gray-600">{terminalSeleccionado.telefono}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    router.push(`/dashboard/Admin/terminales/${terminalSeleccionado.id}/ocupacion`);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ver Ocupación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
