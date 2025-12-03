'use client';

import { useEffect, useState, useMemo } from 'react';
import { useCooperativaConfig } from '@/app/context/CooperativaConfigContext';
import { 
  usuarioTerminalesApi, 
  getToken, 
  type TerminalAsignadoUsuario,
  type Terminal 
} from '@/lib/api';
import { Building2, MapPin, Check, X, Save, Search, ChevronDown, ChevronUp } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

interface AsignarTerminalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuarioId: number;
  usuarioNombre: string;
  cooperativaId: number;
}

export default function AsignarTerminalesModal({
  isOpen,
  onClose,
  usuarioId,
  usuarioNombre,
  cooperativaId,
}: AsignarTerminalesModalProps) {
  const { styles } = useCooperativaConfig();
  const [terminalesAsignados, setTerminalesAsignados] = useState<TerminalAsignadoUsuario[]>([]);
  const [todosTerminales, setTodosTerminales] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [selectedTerminalIds, setSelectedTerminalIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvincia, setSelectedProvincia] = useState<string>('all');
  const [selectedCanton, setSelectedCanton] = useState<string>('all');
  const [expandedProvincias, setExpandedProvincias] = useState<Set<string>>(new Set());
  const [turno, setTurno] = useState<string>('COMPLETO');
  const [cargo, setCargo] = useState<string>('Oficinista');

  useEffect(() => {
    if (isOpen && usuarioId) {
      loadData();
    }
  }, [isOpen, usuarioId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      
      // Cargar terminales asignados al usuario
      const asignados = await usuarioTerminalesApi.getTerminales(usuarioId, token || '');
      setTerminalesAsignados(asignados);
      setSelectedTerminalIds(new Set(asignados.map(t => t.terminalId)));
      
      // Si hay datos, usar el turno y cargo del primero
      if (asignados.length > 0) {
        setTurno(asignados[0].turno || 'COMPLETO');
        setCargo(asignados[0].cargo || 'Oficinista');
      }
      
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

  const provincias = useMemo(() => 
    Object.keys(terminalesAgrupados).sort(), 
    [terminalesAgrupados]
  );

  const cantonesFiltrados = useMemo(() => {
    if (selectedProvincia === 'all') return [];
    return Object.keys(terminalesAgrupados[selectedProvincia] || {}).sort();
  }, [terminalesAgrupados, selectedProvincia]);

  const toggleTerminal = (terminalId: number) => {
    const newSelected = new Set(selectedTerminalIds);
    if (newSelected.has(terminalId)) {
      newSelected.delete(terminalId);
    } else {
      newSelected.add(terminalId);
    }
    setSelectedTerminalIds(newSelected);
  };

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

  const toggleExpandProvincia = (provincia: string) => {
    const newExpanded = new Set(expandedProvincias);
    if (newExpanded.has(provincia)) {
      newExpanded.delete(provincia);
    } else {
      newExpanded.add(provincia);
    }
    setExpandedProvincias(newExpanded);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const token = getToken();
      
      await usuarioTerminalesApi.sincronizarTerminales(
        usuarioId,
        {
          terminalIds: Array.from(selectedTerminalIds),
          cooperativaId: cooperativaId,
          cargo: cargo,
          turno: turno,
        },
        token || ''
      );
      
      setSuccess('Terminales asignados correctamente');
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error al guardar:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const contarSeleccionadosProvincia = (provincia: string) => {
    const terminalesProvincia = Object.values(terminalesAgrupados[provincia] || {}).flat();
    return terminalesProvincia.filter(t => selectedTerminalIds.has(t.id)).length;
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Building2 className="w-6 h-6" style={{ color: styles.primary }} />
              Asignar Terminales
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Oficinista: <span className="font-semibold">{usuarioNombre}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Alertas */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div 
              className="mb-4 p-3 rounded-lg text-sm"
              style={{ backgroundColor: styles.primaryLighter, borderColor: styles.primaryLight, color: styles.primaryDark, border: '1px solid' }}
            >
              {success}
            </div>
          )}

          {/* Opciones de turno y cargo */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
              <select
                value={turno}
                onChange={(e) => setTurno(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg coop-input-focus text-gray-900"
              >
                <option value="COMPLETO">Completo</option>
                <option value="MAÑANA">Mañana</option>
                <option value="TARDE">Tarde</option>
                <option value="NOCHE">Noche</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg coop-input-focus text-gray-900"
                placeholder="Ej: Oficinista, Supervisor"
              />
            </div>
          </div>

          {/* Resumen y filtros */}
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-semibold" style={{ color: styles.primary }}>{selectedTerminalIds.size}</span> terminales seleccionados
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar terminal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm coop-input-focus text-gray-900"
                />
              </div>
            </div>
            <select
              value={selectedProvincia}
              onChange={(e) => {
                setSelectedProvincia(e.target.value);
                setSelectedCanton('all');
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm coop-input-focus text-gray-900"
            >
              <option value="all">Todas las provincias</option>
              {provincias.map(prov => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
            {selectedProvincia !== 'all' && (
              <select
                value={selectedCanton}
                onChange={(e) => setSelectedCanton(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm coop-input-focus text-gray-900"
              >
                <option value="all">Todos los cantones</option>
                {cantonesFiltrados.map(canton => (
                  <option key={canton} value={canton}>{canton}</option>
                ))}
              </select>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto" style={{ borderColor: styles.primary }}></div>
              <p className="mt-3 text-gray-600 text-sm">Cargando terminales...</p>
            </div>
          )}

          {/* Lista de terminales */}
          {!loading && (
            <div className="space-y-3">
              {provincias.map(provincia => {
                const cantones = Object.keys(terminalesAgrupados[provincia] || {}).sort();
                const totalProvincia = Object.values(terminalesAgrupados[provincia] || {}).flat().length;
                const seleccionadosProvincia = contarSeleccionadosProvincia(provincia);
                const isExpanded = expandedProvincias.has(provincia);
                
                if (selectedProvincia !== 'all' && provincia !== selectedProvincia) return null;
                
                return (
                  <div key={provincia} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleExpandProvincia(provincia)}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" style={{ color: styles.primary }} />
                        <span className="font-medium text-gray-800">{provincia}</span>
                        <span className="text-xs text-gray-500">
                          ({seleccionadosProvincia}/{totalProvincia})
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    
                    {isExpanded && (
                      <div className="p-3 space-y-3">
                        {cantones.map(canton => {
                          const terminalesCanton = terminalesAgrupados[provincia][canton];
                          const totalCanton = terminalesCanton.length;
                          const seleccionadosCanton = contarSeleccionadosCanton(provincia, canton);
                          
                          if (selectedCanton !== 'all' && canton !== selectedCanton) return null;
                          
                          return (
                            <div key={canton} className="border border-gray-100 rounded p-2">
                              <div className="flex items-center gap-2 mb-2">
                                <button
                                  onClick={() => toggleCanton(canton, provincia)}
                                  className="w-4 h-4 rounded border flex items-center justify-center"
                                  style={
                                    seleccionadosCanton === totalCanton
                                      ? { backgroundColor: styles.primary, borderColor: styles.primary, color: 'white' }
                                      : seleccionadosCanton > 0
                                        ? { backgroundColor: styles.primaryLighter, borderColor: styles.primaryLight }
                                        : { borderColor: '#d1d5db' }
                                  }
                                >
                                  {seleccionadosCanton === totalCanton && <Check className="w-3 h-3" />}
                                </button>
                                <span className="text-sm font-medium text-gray-700">{canton}</span>
                                <span className="text-xs text-gray-500">({seleccionadosCanton}/{totalCanton})</span>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 ml-6">
                                {terminalesCanton.map(terminal => {
                                  const isSelected = selectedTerminalIds.has(terminal.id);
                                  
                                  if (searchTerm && !terminal.nombre.toLowerCase().includes(searchTerm.toLowerCase())) {
                                    return null;
                                  }
                                  
                                  return (
                                    <div
                                      key={terminal.id}
                                      onClick={() => toggleTerminal(terminal.id)}
                                      className="flex items-center gap-2 p-1.5 rounded cursor-pointer text-sm border"
                                      style={
                                        isSelected
                                          ? { backgroundColor: styles.primaryLighter, borderColor: styles.primaryLight }
                                          : { backgroundColor: '#f9fafb', borderColor: '#f3f4f6' }
                                      }
                                    >
                                      <div 
                                        className="w-3 h-3 rounded border flex items-center justify-center"
                                        style={
                                          isSelected 
                                            ? { backgroundColor: styles.primary, borderColor: styles.primary, color: 'white' } 
                                            : { borderColor: '#d1d5db' }
                                        }
                                      >
                                        {isSelected && <Check className="w-2 h-2" />}
                                      </div>
                                      <Building2 className="w-3 h-3 text-gray-400" />
                                      <span className="truncate flex-1 text-gray-700">{terminal.nombre}</span>
                                      <span className={`text-xs px-1 rounded ${getTipologiaColor(terminal.tipologia)}`}>
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

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ backgroundColor: styles.primary }}
            onMouseEnter={(e) => !saving && (e.currentTarget.style.backgroundColor = styles.primaryDark)}
            onMouseLeave={(e) => !saving && (e.currentTarget.style.backgroundColor = styles.primary)}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
