'use client';

import { useEffect, useState } from 'react';
import { 
  busChoferApi, 
  getToken,
  type BusChoferResponse,
  type ChoferDisponible,
  type ChoferAsignacion
} from '@/lib/api';
import { User, X, Save, Search, Star, UserCheck, AlertCircle, Truck } from 'lucide-react';

interface AsignarChoferesModalProps {
  isOpen: boolean;
  onClose: () => void;
  busId: number;
  busPlaca: string;
  cooperativaId: number;
  onSuccess?: () => void;
}

const MAX_CHOFERES = 3;

export default function AsignarChoferesModal({
  isOpen,
  onClose,
  busId,
  busPlaca,
  cooperativaId,
  onSuccess,
}: AsignarChoferesModalProps) {
  const [choferesAsignados, setChoferesAsignados] = useState<BusChoferResponse[]>([]);
  const [choferesDisponibles, setChoferesDisponibles] = useState<ChoferDisponible[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [selectedChoferes, setSelectedChoferes] = useState<ChoferAsignacion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && busId) {
      loadData();
    }
  }, [isOpen, busId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      // Cargar choferes asignados
      const asignados = await busChoferApi.getChoferes(cooperativaId, busId, token);
      setChoferesAsignados(asignados);
      
      // Convertir a formato de selección
      setSelectedChoferes(asignados.map(c => ({
        choferId: c.choferId,
        tipo: c.tipo as 'PRINCIPAL' | 'ALTERNO',
        orden: c.orden,
      })));
      
      // Cargar choferes disponibles
      const disponibles = await busChoferApi.getChoferesDisponibles(cooperativaId, busId, token);
      setChoferesDisponibles(disponibles);
      
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChofer = (choferId: number) => {
    const isSelected = selectedChoferes.some(c => c.choferId === choferId);
    
    if (isSelected) {
      // Remover chofer
      setSelectedChoferes(prev => prev.filter(c => c.choferId !== choferId));
    } else {
      // Agregar chofer si no excede el máximo
      if (selectedChoferes.length >= MAX_CHOFERES) {
        setError(`No se pueden asignar más de ${MAX_CHOFERES} choferes por bus`);
        setTimeout(() => setError(null), 3000);
        return;
      }
      
      // Determinar tipo y orden
      const hasPrincipal = selectedChoferes.some(c => c.tipo === 'PRINCIPAL');
      const newChofer: ChoferAsignacion = {
        choferId,
        tipo: hasPrincipal ? 'ALTERNO' : 'PRINCIPAL',
        orden: selectedChoferes.length + 1,
      };
      
      setSelectedChoferes(prev => [...prev, newChofer]);
    }
  };

  const handleSetPrincipal = (choferId: number) => {
    setSelectedChoferes(prev => {
      // Remover principal anterior y asignar nuevo
      const updated = prev.map(c => ({
        ...c,
        tipo: c.choferId === choferId ? 'PRINCIPAL' as const : 'ALTERNO' as const,
      }));
      
      // Reordenar: principal primero
      return updated.sort((a, b) => {
        if (a.tipo === 'PRINCIPAL') return -1;
        if (b.tipo === 'PRINCIPAL') return 1;
        return (a.orden || 0) - (b.orden || 0);
      }).map((c, index) => ({ ...c, orden: index + 1 }));
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const token = getToken();
      
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      await busChoferApi.sincronizarChoferes(
        cooperativaId,
        busId,
        { choferes: selectedChoferes },
        token
      );
      
      setSuccess('Choferes asignados correctamente');
      
      if (onSuccess) {
        onSuccess();
      }
      
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

  const getChoferInfo = (choferId: number): ChoferDisponible | undefined => {
    return choferesDisponibles.find(c => c.id === choferId);
  };

  const filteredChoferes = choferesDisponibles.filter(chofer => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      chofer.nombreCompleto.toLowerCase().includes(search) ||
      chofer.cedula.toLowerCase().includes(search) ||
      (chofer.numeroLicencia && chofer.numeroLicencia.toLowerCase().includes(search))
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Truck className="w-6 h-6 text-blue-600" />
              Asignar Choferes
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Bus: <span className="font-semibold">{busPlaca}</span>
              <span className="ml-2 text-blue-600">(máximo {MAX_CHOFERES} choferes)</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Alertas */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              {success}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Cargando choferes...</p>
            </div>
          ) : (
            <>
              {/* Choferes seleccionados */}
              {selectedChoferes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    Choferes Asignados ({selectedChoferes.length}/{MAX_CHOFERES})
                  </h3>
                  <div className="space-y-2">
                    {selectedChoferes.map((asignacion, index) => {
                      const chofer = getChoferInfo(asignacion.choferId);
                      if (!chofer) return null;
                      
                      return (
                        <div
                          key={asignacion.choferId}
                          className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                            asignacion.tipo === 'PRINCIPAL'
                              ? 'bg-yellow-50 border-yellow-300'
                              : 'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              {chofer.fotoUrl ? (
                                <img 
                                  src={chofer.fotoUrl.startsWith('http') ? chofer.fotoUrl : `http://localhost:8081${chofer.fotoUrl}`}
                                  alt={chofer.nombreCompleto}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-5 h-5 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 flex items-center gap-2">
                                {chofer.nombreCompleto}
                                {asignacion.tipo === 'PRINCIPAL' && (
                                  <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs font-semibold rounded-full flex items-center gap-1">
                                    <Star className="w-3 h-3" />
                                    Principal
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-500">
                                CI: {chofer.cedula}
                                {chofer.numeroLicencia && ` • Lic: ${chofer.numeroLicencia}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {asignacion.tipo !== 'PRINCIPAL' && (
                              <button
                                onClick={() => handleSetPrincipal(asignacion.choferId)}
                                className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-full transition-colors"
                                title="Hacer principal"
                              >
                                <Star className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleChofer(asignacion.choferId)}
                              className="px-3 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded-full transition-colors"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Búsqueda */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, cédula o licencia..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>

              {/* Lista de choferes disponibles */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Choferes Disponibles ({filteredChoferes.length})
                </h3>
                
                {filteredChoferes.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No hay choferes disponibles</p>
                    <p className="text-sm text-gray-400">Registra choferes en la sección de Personal</p>
                  </div>
                ) : (
                  <div className="grid gap-2 max-h-80 overflow-y-auto">
                    {filteredChoferes.map((chofer) => {
                      const isSelected = selectedChoferes.some(c => c.choferId === chofer.id);
                      const isDisabled = !isSelected && selectedChoferes.length >= MAX_CHOFERES;
                      
                      return (
                        <div
                          key={chofer.id}
                          onClick={() => !isDisabled && handleToggleChofer(chofer.id)}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 border-blue-300'
                              : isDisabled
                              ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                              : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              {chofer.fotoUrl ? (
                                <img 
                                  src={chofer.fotoUrl.startsWith('http') ? chofer.fotoUrl : `http://localhost:8081${chofer.fotoUrl}`}
                                  alt={chofer.nombreCompleto}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-5 h-5 text-gray-500" />
                              )}
                            </div>
                            
                            <div>
                              <p className="font-medium text-gray-800">{chofer.nombreCompleto}</p>
                              <p className="text-sm text-gray-500">
                                CI: {chofer.cedula}
                                {chofer.numeroLicencia && (
                                  <span className="ml-2">
                                    • Licencia: {chofer.tipoLicencia} - {chofer.numeroLicencia}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          {chofer.busAsignadoPlaca && !chofer.yaAsignado && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                              Asignado a: {chofer.busAsignadoPlaca}
                            </span>
                          )}
                          
                          {chofer.yaAsignado && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              Asignado
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedChoferes.length === 0 ? (
              <span className="text-orange-600">Selecciona al menos un chofer</span>
            ) : (
              <span>
                <span className="font-semibold text-blue-600">{selectedChoferes.length}</span>
                {' '}chofer{selectedChoferes.length !== 1 ? 'es' : ''} seleccionado{selectedChoferes.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
