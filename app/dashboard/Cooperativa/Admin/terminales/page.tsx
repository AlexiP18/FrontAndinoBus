'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useCooperativaConfig } from '@/app/context/CooperativaConfigContext';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { 
  cooperativaTerminalesApi, 
  getToken, 
  type TerminalAsignadoCooperativa,
  type Terminal 
} from '@/lib/api';
import { Building2, MapPin, Check, X, Save, Search, ChevronDown, ChevronUp } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export default function TerminalesCooperativaPage() {
  const { user } = useAuth();
  const { styles } = useCooperativaConfig();
  const [terminalesAsignados, setTerminalesAsignados] = useState<TerminalAsignadoCooperativa[]>([]);
  const [todosTerminales, setTodosTerminales] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados para selección
  const [selectedTerminalIds, setSelectedTerminalIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvincia, setSelectedProvincia] = useState<string>('all');
  const [selectedCanton, setSelectedCanton] = useState<string>('all');
  const [expandedProvincias, setExpandedProvincias] = useState<Set<string>>(new Set());
  const [activeProvinciaTab, setActiveProvinciaTab] = useState<string>('');

  // Cargar datos iniciales
  useEffect(() => {
    if (user?.cooperativaId) {
      loadData();
    }
  }, [user?.cooperativaId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      
      // Cargar terminales asignados a la cooperativa
      const asignados = await cooperativaTerminalesApi.getTerminales(user!.cooperativaId!, token || '');
      setTerminalesAsignados(asignados);
      setSelectedTerminalIds(new Set(asignados.map(t => t.terminalId)));
      
      // Cargar todos los terminales disponibles
      const response = await fetch(`${API_BASE}/terminales`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Error al cargar terminales');
      const todos = await response.json();
      setTodosTerminales(todos);
      
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Agrupar terminales por provincia y cantón
  const terminalesAgrupados = useMemo(() => {
    const grupos: Record<string, Record<string, Terminal[]>> = {};
    
    todosTerminales.forEach(terminal => {
      if (!grupos[terminal.provincia]) {
        grupos[terminal.provincia] = {};
      }
      if (!grupos[terminal.provincia][terminal.canton]) {
        grupos[terminal.provincia][terminal.canton] = [];
      }
      grupos[terminal.provincia][terminal.canton].push(terminal);
    });
    
    // Ordenar
    const ordenado: Record<string, Record<string, Terminal[]>> = {};
    Object.keys(grupos).sort().forEach(provincia => {
      ordenado[provincia] = {};
      Object.keys(grupos[provincia]).sort().forEach(canton => {
        ordenado[provincia][canton] = grupos[provincia][canton].sort((a, b) => 
          a.nombre.localeCompare(b.nombre)
        );
      });
    });
    
    return ordenado;
  }, [todosTerminales]);

  // Lista de provincias únicas
  const provincias = useMemo(() => 
    Object.keys(terminalesAgrupados).sort(), 
    [terminalesAgrupados]
  );

  // Cantones filtrados por provincia seleccionada
  const cantonesFiltrados = useMemo(() => {
    if (selectedProvincia === 'all') return [];
    return Object.keys(terminalesAgrupados[selectedProvincia] || {}).sort();
  }, [terminalesAgrupados, selectedProvincia]);

  // Terminales filtrados
  const terminalesFiltrados = useMemo(() => {
    let filtered = todosTerminales;
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.nombre.toLowerCase().includes(search) ||
        t.canton.toLowerCase().includes(search) ||
        t.provincia.toLowerCase().includes(search)
      );
    }
    
    if (selectedProvincia !== 'all') {
      filtered = filtered.filter(t => t.provincia === selectedProvincia);
    }
    
    if (selectedCanton !== 'all') {
      filtered = filtered.filter(t => t.canton === selectedCanton);
    }
    
    return filtered;
  }, [todosTerminales, searchTerm, selectedProvincia, selectedCanton]);

  // Terminales actualmente seleccionados (para mostrar arriba)
  const terminalesSeleccionados = useMemo(() => {
    return todosTerminales
      .filter(t => selectedTerminalIds.has(t.id))
      .sort((a, b) => a.provincia.localeCompare(b.provincia) || a.canton.localeCompare(b.canton));
  }, [todosTerminales, selectedTerminalIds]);

  // Terminales seleccionados agrupados por provincia y cantón
  const terminalesSeleccionadosAgrupados = useMemo(() => {
    const grupos: Record<string, Record<string, typeof todosTerminales>> = {};
    
    terminalesSeleccionados.forEach(terminal => {
      if (!grupos[terminal.provincia]) {
        grupos[terminal.provincia] = {};
      }
      if (!grupos[terminal.provincia][terminal.canton]) {
        grupos[terminal.provincia][terminal.canton] = [];
      }
      grupos[terminal.provincia][terminal.canton].push(terminal);
    });
    
    return grupos;
  }, [terminalesSeleccionados]);

  // Toggle selección de terminal
  const toggleTerminal = (terminalId: number) => {
    const newSelected = new Set(selectedTerminalIds);
    if (newSelected.has(terminalId)) {
      newSelected.delete(terminalId);
    } else {
      newSelected.add(terminalId);
    }
    setSelectedTerminalIds(newSelected);
  };

  // Seleccionar/deseleccionar todos los de un cantón
  const toggleCanton = (canton: string, provincia: string) => {
    const terminalesCanton = terminalesAgrupados[provincia]?.[canton] || [];
    const todosSeleccionados = terminalesCanton.every(t => selectedTerminalIds.has(t.id));
    
    const newSelected = new Set(selectedTerminalIds);
    terminalesCanton.forEach(t => {
      if (todosSeleccionados) {
        newSelected.delete(t.id);
      } else {
        newSelected.add(t.id);
      }
    });
    setSelectedTerminalIds(newSelected);
  };

  // Seleccionar/deseleccionar toda una provincia
  const toggleProvincia = (provincia: string) => {
    const terminalesProvincia = Object.values(terminalesAgrupados[provincia] || {}).flat();
    const todosSeleccionados = terminalesProvincia.every(t => selectedTerminalIds.has(t.id));
    
    const newSelected = new Set(selectedTerminalIds);
    terminalesProvincia.forEach(t => {
      if (todosSeleccionados) {
        newSelected.delete(t.id);
      } else {
        newSelected.add(t.id);
      }
    });
    setSelectedTerminalIds(newSelected);
  };

  // Expandir/colapsar provincia
  const toggleExpandProvincia = (provincia: string) => {
    const newExpanded = new Set(expandedProvincias);
    if (newExpanded.has(provincia)) {
      newExpanded.delete(provincia);
    } else {
      newExpanded.add(provincia);
    }
    setExpandedProvincias(newExpanded);
  };

  // Guardar cambios
  const handleSave = async () => {
    if (!user?.cooperativaId) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const token = getToken();
      
      await cooperativaTerminalesApi.sincronizarTerminales(
        user.cooperativaId,
        Array.from(selectedTerminalIds),
        token || ''
      );
      
      setSuccess('Terminales actualizados correctamente');
      await loadData();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error al guardar:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  // Contar seleccionados por provincia
  const contarSeleccionadosProvincia = (provincia: string) => {
    const terminalesProvincia = Object.values(terminalesAgrupados[provincia] || {}).flat();
    return terminalesProvincia.filter(t => selectedTerminalIds.has(t.id)).length;
  };

  // Contar seleccionados por cantón
  const contarSeleccionadosCanton = (provincia: string, canton: string) => {
    const terminalesCanton = terminalesAgrupados[provincia]?.[canton] || [];
    return terminalesCanton.filter(t => selectedTerminalIds.has(t.id)).length;
  };

  const getTipologiaColor = (tipologia: string) => {
    const colors: Record<string, string> = {
      'T1': 'bg-gray-100 text-gray-700',
      'T2': 'bg-blue-100 text-blue-700',
      'T3': 'bg-green-100 text-green-700',
      'T4': 'bg-yellow-100 text-yellow-700',
      'T5': 'bg-purple-100 text-purple-700',
    };
    return colors[tipologia] || 'bg-gray-100 text-gray-700';
  };

  return (
    <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['ADMIN']}>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-green-600" />
            Terminales de la Cooperativa
          </h1>
          <p className="text-gray-600">
            Selecciona los terminales donde opera tu cooperativa
          </p>
        </div>

        {/* Alertas */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Resumen de selección */}
        <div className="mb-6 bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <div>
            <span className="text-lg font-semibold text-gray-800">
              {selectedTerminalIds.size} terminales seleccionados
            </span>
            <span className="text-gray-500 ml-2">
              de {todosTerminales.length} disponibles
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors coop-btn-primary"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

        {/* Filtros */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-4">
            {/* Búsqueda */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar terminal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-gray-900 coop-input-focus"
                />
              </div>
            </div>
            
            {/* Filtro provincia */}
            <div className="min-w-[180px]">
              <select
                value={selectedProvincia}
                onChange={(e) => {
                  setSelectedProvincia(e.target.value);
                  setSelectedCanton('all');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
              >
                <option value="all">Todas las provincias</option>
                {provincias.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>
            
            {/* Filtro cantón */}
            {selectedProvincia !== 'all' && (
              <div className="min-w-[180px]">
                <select
                  value={selectedCanton}
                  onChange={(e) => setSelectedCanton(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                >
                  <option value="all">Todos los cantones</option>
                  {cantonesFiltrados.map(canton => (
                    <option key={canton} value={canton}>{canton}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Terminales Seleccionados - Tabs Horizontales por Provincia */}
        {terminalesSeleccionados.length > 0 && (() => {
          const provinciasSeleccionadas = Object.keys(terminalesSeleccionadosAgrupados).sort();
          const provinciaActiva = activeProvinciaTab && provinciasSeleccionadas.includes(activeProvinciaTab) 
            ? activeProvinciaTab 
            : provinciasSeleccionadas[0];
          
          return (
            <div className="mb-6 bg-white rounded-xl overflow-hidden shadow-sm" style={{ borderColor: styles.primaryLight, borderWidth: '1px' }}>
              {/* Header */}
              <div className="px-4 py-3 coop-bg-primary">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Terminales Seleccionados ({terminalesSeleccionados.length})
                </h3>
              </div>
              
              {/* Tabs de Provincias */}
              <div className="border-b border-gray-200 bg-gray-50">
                <div className="flex overflow-x-auto scrollbar-thin">
                  {provinciasSeleccionadas.map(provincia => {
                    const cantones = terminalesSeleccionadosAgrupados[provincia];
                    const totalProvincia = Object.values(cantones).flat().length;
                    const isActive = provincia === provinciaActiva;
                    
                    return (
                      <button
                        key={provincia}
                        onClick={() => setActiveProvinciaTab(provincia)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                          isActive
                            ? 'bg-white'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                        style={isActive ? { borderColor: styles.primary, color: styles.primary } : undefined}
                      >
                        <MapPin className="w-4 h-4" style={isActive ? { color: styles.primary } : { color: '#9ca3af' }} />
                        {provincia}
                        <span 
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            isActive ? '' : 'bg-gray-200 text-gray-600'
                          }`}
                          style={isActive ? { backgroundColor: styles.primaryLighter, color: styles.primary } : undefined}
                        >
                          {totalProvincia}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Contenido del Tab Activo */}
              {provinciaActiva && terminalesSeleccionadosAgrupados[provinciaActiva] && (
                <div className="p-4">
                  <div className="space-y-3">
                    {Object.keys(terminalesSeleccionadosAgrupados[provinciaActiva]).sort().map(canton => {
                      const terminalesCanton = terminalesSeleccionadosAgrupados[provinciaActiva][canton];
                      
                      return (
                        <div key={canton} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          {/* Header de Cantón */}
                          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-300">
                            <Building2 className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-gray-800">{canton}</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              {terminalesCanton.length} terminal{terminalesCanton.length !== 1 ? 'es' : ''}
                            </span>
                          </div>
                          
                          {/* Terminales del Cantón */}
                          <div className="flex flex-wrap gap-2">
                            {terminalesCanton.map(terminal => (
                              <div
                                key={terminal.id}
                                className="flex items-center gap-2 bg-white border border-green-300 rounded-lg px-3 py-2 text-sm shadow-sm hover:shadow transition-shadow"
                              >
                                <Building2 className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-gray-800">{terminal.nombre}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${getTipologiaColor(terminal.tipologia)}`}>
                                  {terminal.tipologia}
                                </span>
                                <button
                                  onClick={() => toggleTerminal(terminal.id)}
                                  className="ml-1 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                  title="Quitar terminal"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando terminales...</p>
          </div>
        )}

        {/* Lista de terminales agrupados por provincia */}
        {!loading && (
          <div className="space-y-4">
            {provincias.map(provincia => {
              const cantones = Object.keys(terminalesAgrupados[provincia] || {}).sort();
              const totalProvincia = Object.values(terminalesAgrupados[provincia] || {}).flat().length;
              const seleccionadosProvincia = contarSeleccionadosProvincia(provincia);
              const isExpanded = expandedProvincias.has(provincia);
              
              // Si hay filtro de provincia y no coincide, no mostrar
              if (selectedProvincia !== 'all' && provincia !== selectedProvincia) return null;
              
              return (
                <div key={provincia} className="bg-white rounded-lg shadow overflow-hidden">
                  {/* Cabecera de provincia */}
                  <div 
                    className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleExpandProvincia(provincia)}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleProvincia(provincia);
                        }}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                          seleccionadosProvincia === totalProvincia
                            ? 'bg-green-600 border-green-600 text-white'
                            : seleccionadosProvincia > 0
                              ? 'bg-green-200 border-green-400'
                              : 'border-gray-300 hover:border-green-500'
                        }`}
                      >
                        {seleccionadosProvincia === totalProvincia && <Check className="w-4 h-4" />}
                      </button>
                      <MapPin className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-gray-800">{provincia}</span>
                      <span className="text-sm text-gray-500">
                        ({seleccionadosProvincia}/{totalProvincia} seleccionados)
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  
                  {/* Contenido expandible */}
                  {isExpanded && (
                    <div className="p-4 space-y-4">
                      {cantones.map(canton => {
                        const terminalesCanton = terminalesAgrupados[provincia][canton];
                        const totalCanton = terminalesCanton.length;
                        const seleccionadosCanton = contarSeleccionadosCanton(provincia, canton);
                        
                        // Si hay filtro de cantón y no coincide, no mostrar
                        if (selectedCanton !== 'all' && canton !== selectedCanton) return null;
                        
                        return (
                          <div key={canton} className="border border-gray-200 rounded-lg p-3">
                            {/* Cabecera de cantón */}
                            <div className="flex items-center gap-3 mb-3">
                              <button
                                onClick={() => toggleCanton(canton, provincia)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                  seleccionadosCanton === totalCanton
                                    ? 'bg-green-600 border-green-600 text-white'
                                    : seleccionadosCanton > 0
                                      ? 'bg-green-200 border-green-400'
                                      : 'border-gray-300 hover:border-green-500'
                                }`}
                              >
                                {seleccionadosCanton === totalCanton && <Check className="w-3 h-3" />}
                              </button>
                              <span className="font-medium text-gray-700">{canton}</span>
                              <span className="text-xs text-gray-500">
                                ({seleccionadosCanton}/{totalCanton})
                              </span>
                            </div>
                            
                            {/* Lista de terminales */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-8">
                              {terminalesCanton.map(terminal => {
                                const isSelected = selectedTerminalIds.has(terminal.id);
                                
                                return (
                                  <div
                                    key={terminal.id}
                                    onClick={() => toggleTerminal(terminal.id)}
                                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                      isSelected
                                        ? 'bg-green-50 border border-green-300'
                                        : 'bg-gray-50 border border-gray-200 hover:border-green-300'
                                    }`}
                                  >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                      isSelected
                                        ? 'bg-green-600 border-green-600 text-white'
                                        : 'border-gray-300'
                                    }`}>
                                      {isSelected && <Check className="w-3 h-3" />}
                                    </div>
                                    <Building2 className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-700 flex-1 truncate">
                                      {terminal.nombre}
                                    </span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${getTipologiaColor(terminal.tipologia)}`}>
                                      {terminal.tipologia}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
