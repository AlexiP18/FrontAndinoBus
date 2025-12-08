'use client';

import { useState, useEffect } from 'react';
import { useCooperativaConfig } from '@/app/context/CooperativaConfigContext';
import { useAuth } from '@/app/context/AuthContext';
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Bus,
  Loader2,
  RotateCcw,
  Lock,
} from 'lucide-react';
import {
  generarReporteAsignaciones,
  generarReportePorBus,
  reporteToCSV,
  reporteToExcelXML,
  reportePorBusToCSV,
  descargarCSV,
  descargarExcel,
  ModoAsignacion,
} from '@/lib/exportUtils';
import { FrecuenciaViaje, BusDetailResponse, busChoferApi } from '@/lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  frecuencias: FrecuenciaViaje[];
  buses: BusDetailResponse[];
  cooperativaNombre?: string;
  cooperativaId?: number;
}

type TipoReporte = 'asignaciones' | 'porBus';
type FormatoExport = 'csv' | 'excel';

export default function ExportarFrecuenciasModal({
  isOpen,
  onClose,
  frecuencias,
  buses,
  cooperativaNombre = 'Cooperativa',
  cooperativaId,
}: Props) {
  const { styles } = useCooperativaConfig();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tipoReporte, setTipoReporte] = useState<TipoReporte>('asignaciones');
  const [formato, setFormato] = useState<FormatoExport>('excel');
  const [modoAsignacion, setModoAsignacion] = useState<ModoAsignacion>('rotativo');
  const [choferesPorBus, setChoferesPorBus] = useState<Map<number, string[]>>(new Map());
  const [loadingChoferes, setLoadingChoferes] = useState(false);
  
  // Calcular rango de fechas desde las frecuencias existentes
  // Usamos la fecha actual y 2 semanas hacia adelante como referencia
  const [fechaInicio] = useState(() => {
    const today = new Date();
    return today;
  });
  const [fechaFin] = useState(() => {
    const twoWeeks = new Date();
    twoWeeks.setDate(twoWeeks.getDate() + 14);
    return twoWeeks;
  });
  
  // Cargar choferes cuando se abre el modal y se selecciona reporte por bus
  useEffect(() => {
    if (isOpen && tipoReporte === 'porBus' && buses.length > 0) {
      loadChoferes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tipoReporte, buses]);
  
  const loadChoferes = async () => {
    const coopId = cooperativaId || user?.cooperativaId;
    if (!coopId) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    setLoadingChoferes(true);
    const nuevosChoferes = new Map<number, string[]>();
    
    try {
      for (const bus of buses) {
        try {
          const choferes = await busChoferApi.getChoferes(coopId, bus.id, token);
          const nombres = choferes.map(c => c.choferNombre);
          nuevosChoferes.set(bus.id, nombres);
        } catch {
          // Si falla para un bus, continuar con los demás
          nuevosChoferes.set(bus.id, []);
        }
      }
      setChoferesPorBus(nuevosChoferes);
    } catch (error) {
      console.error('Error al cargar choferes:', error);
    } finally {
      setLoadingChoferes(false);
    }
  };

  if (!isOpen) return null;

  const handleExportar = () => {
    setLoading(true);
    
    try {
      const fechaActual = new Date().toISOString().split('T')[0].replace(/-/g, '');
      
      if (tipoReporte === 'asignaciones') {
        const reporte = generarReporteAsignaciones(
          frecuencias,
          buses,
          fechaInicio,
          fechaFin,
          `HORAS DE TRABAJO - ${cooperativaNombre.toUpperCase()}`,
          modoAsignacion
        );
        
        if (formato === 'csv') {
          const csv = reporteToCSV(reporte);
          descargarCSV(csv, `Asignaciones_${cooperativaNombre}_${fechaActual}.csv`);
        } else {
          const excel = reporteToExcelXML(reporte);
          descargarExcel(excel, `Asignaciones_${cooperativaNombre}_${fechaActual}.xls`);
        }
      } else {
        // Reporte por bus (incluye choferes asignados)
        const reportes = generarReportePorBus(frecuencias, buses, choferesPorBus);
        const csv = reportePorBusToCSV(reportes);
        descargarCSV(csv, `FrecuenciasPorBus_${cooperativaNombre}_${fechaActual}.csv`);
      }
      
      onClose();
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al generar el archivo de exportación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div 
          className="p-4 text-white flex justify-between items-center flex-shrink-0"
          style={{ backgroundColor: styles.primary }}
        >
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Exportar Frecuencias</h2>
              <p className="text-sm opacity-90">Genera reportes en CSV o Excel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Tipo de reporte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de reporte
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTipoReporte('asignaciones')}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  tipoReporte === 'asignaciones'
                    ? 'border-current bg-opacity-10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{
                  borderColor: tipoReporte === 'asignaciones' ? styles.primary : undefined,
                  backgroundColor: tipoReporte === 'asignaciones' ? `${styles.primary}15` : undefined,
                }}
              >
                <Calendar 
                  className="w-8 h-8" 
                  style={{ color: tipoReporte === 'asignaciones' ? styles.primary : '#6b7280' }}
                />
                <span 
                  className="font-medium text-sm"
                  style={{ color: tipoReporte === 'asignaciones' ? styles.primary : '#374151' }}
                >
                  Asignaciones por fecha
                </span>
                <span className="text-xs text-gray-500 text-center">
                  Matriz de días vs buses asignados
                </span>
              </button>
              
              <button
                onClick={() => setTipoReporte('porBus')}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  tipoReporte === 'porBus'
                    ? 'border-current bg-opacity-10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{
                  borderColor: tipoReporte === 'porBus' ? styles.primary : undefined,
                  backgroundColor: tipoReporte === 'porBus' ? `${styles.primary}15` : undefined,
                }}
              >
                <Bus 
                  className="w-8 h-8" 
                  style={{ color: tipoReporte === 'porBus' ? styles.primary : '#6b7280' }}
                />
                <span 
                  className="font-medium text-sm"
                  style={{ color: tipoReporte === 'porBus' ? styles.primary : '#374151' }}
                >
                  Frecuencias por bus
                </span>
                <span className="text-xs text-gray-500 text-center">
                  Lista de rutas y choferes por bus
                </span>
              </button>
            </div>
          </div>

          {/* Modo de asignación (solo para asignaciones) */}
          {tipoReporte === 'asignaciones' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Modo de asignación
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setModoAsignacion('rotativo')}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                    modoAsignacion === 'rotativo'
                      ? 'border-current'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{
                    borderColor: modoAsignacion === 'rotativo' ? styles.primary : undefined,
                    backgroundColor: modoAsignacion === 'rotativo' ? `${styles.primary}15` : undefined,
                  }}
                >
                  <RotateCcw 
                    className="w-5 h-5" 
                    style={{ color: modoAsignacion === 'rotativo' ? styles.primary : '#6b7280' }}
                  />
                  <div className="text-left">
                    <span 
                      className="font-medium text-sm block"
                      style={{ color: modoAsignacion === 'rotativo' ? styles.primary : '#374151' }}
                    >
                      Rotativo
                    </span>
                    <span className="text-xs text-gray-500">
                      Buses rotan por circuitos
                    </span>
                  </div>
                </button>
                
                <button
                  onClick={() => setModoAsignacion('fijo')}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                    modoAsignacion === 'fijo'
                      ? 'border-current'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{
                    borderColor: modoAsignacion === 'fijo' ? styles.primary : undefined,
                    backgroundColor: modoAsignacion === 'fijo' ? `${styles.primary}15` : undefined,
                  }}
                >
                  <Lock 
                    className="w-5 h-5" 
                    style={{ color: modoAsignacion === 'fijo' ? styles.primary : '#6b7280' }}
                  />
                  <div className="text-left">
                    <span 
                      className="font-medium text-sm block"
                      style={{ color: modoAsignacion === 'fijo' ? styles.primary : '#374151' }}
                    >
                      Fijo
                    </span>
                    <span className="text-xs text-gray-500">
                      Bus fijo por frecuencia
                    </span>
                  </div>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {modoAsignacion === 'rotativo' 
                  ? '🔄 Los buses avanzan al siguiente circuito cada día (patrón escalonado)'
                  : '🔒 Cada frecuencia mantiene el mismo bus asignado todos los días'}
              </p>
            </div>
          )}

          {/* Formato de exportación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Formato de archivo
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setFormato('excel')}
                disabled={tipoReporte === 'porBus'}
                className={`flex-1 p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                  formato === 'excel' && tipoReporte !== 'porBus'
                    ? 'border-current'
                    : 'border-gray-200 hover:border-gray-300'
                } ${tipoReporte === 'porBus' ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{
                  borderColor: formato === 'excel' && tipoReporte !== 'porBus' ? styles.primary : undefined,
                  backgroundColor: formato === 'excel' && tipoReporte !== 'porBus' ? `${styles.primary}15` : undefined,
                }}
              >
                <FileSpreadsheet 
                  className="w-5 h-5" 
                  style={{ color: formato === 'excel' && tipoReporte !== 'porBus' ? styles.primary : '#6b7280' }}
                />
                <span 
                  className="font-medium"
                  style={{ color: formato === 'excel' && tipoReporte !== 'porBus' ? styles.primary : '#374151' }}
                >
                  Excel (.xls)
                </span>
              </button>
              
              <button
                onClick={() => setFormato('csv')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                  formato === 'csv' || tipoReporte === 'porBus'
                    ? 'border-current'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{
                  borderColor: formato === 'csv' || tipoReporte === 'porBus' ? styles.primary : undefined,
                  backgroundColor: formato === 'csv' || tipoReporte === 'porBus' ? `${styles.primary}15` : undefined,
                }}
              >
                <FileText 
                  className="w-5 h-5" 
                  style={{ color: formato === 'csv' || tipoReporte === 'porBus' ? styles.primary : '#6b7280' }}
                />
                <span 
                  className="font-medium"
                  style={{ color: formato === 'csv' || tipoReporte === 'porBus' ? styles.primary : '#374151' }}
                >
                  CSV
                </span>
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            <p className="font-medium mb-1">📋 Información del reporte:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>{frecuencias.length} frecuencias registradas</li>
              <li>{buses.length} buses en la cooperativa</li>
              {tipoReporte === 'porBus' && (
                <li>
                  {loadingChoferes ? 'Cargando choferes...' : `${choferesPorBus.size} buses con información de choferes`}
                </li>
              )}
              {tipoReporte === 'asignaciones' && (
                <li>Período: 15 días desde la fecha actual</li>
              )}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleExportar}
            disabled={loading || frecuencias.length === 0 || (tipoReporte === 'porBus' && loadingChoferes)}
            className="flex items-center gap-2 px-6 py-2 text-white rounded-lg disabled:opacity-50 transition-colors"
            style={{ backgroundColor: styles.primary }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.primaryDark}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.primary}
          >
            {loading || (tipoReporte === 'porBus' && loadingChoferes) ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Exportar
          </button>
        </div>
      </div>
    </div>
  );
}
