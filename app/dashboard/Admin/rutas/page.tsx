'use client';

import { useEffect, useState, useRef } from 'react';
import Select, { GroupBase } from 'react-select';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { useConfig } from '@/app/context/ConfigContext';
import { rutasAdminApi, getToken, type RutaResponse, type CreateRutaRequest, type UpdateRutaRequest, type Terminal } from '@/lib/api';
import { calculateRouteAlternatives, calculateHaversineDistance, estimateDuration, type RouteAlternative } from '@/lib/routeService';
import { MapPin, Route, Building2, Upload, X, Edit2, Eye, Trash2, Search, Filter, Grid3X3, List, Clock, Navigation, CheckCircle2, Info, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Check, Power, FileCheck } from 'lucide-react';

// Tipo para las opciones del select basado en terminales
type TerminalOption = {
  value: string;
  label: string;
  terminalId: number;
  terminalNombre: string;
  canton: string;
  provincia: string;
  tipologia: string;
  lat?: number;
  lon?: number;
};

type ProvinciaTerminalGroup = GroupBase<TerminalOption> & {
  label: string;
  options: TerminalOption[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function RutasManagementPage() {
  // Config global
  const { config } = useConfig();
  const primaryColor = config?.colorPrimario || '#2563eb';
  const secondaryColor = config?.colorSecundario || '#3b82f6';
  const accentColor = config?.colorAcento || '#10b981';
  
  // Tab activo
  const [activeTab, setActiveTab] = useState<'rutas' | 'terminales'>('rutas');
  
  // Estados para Rutas
  const [rutas, setRutas] = useState<RutaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRuta, setEditingRuta] = useState<RutaResponse | null>(null);
  const [filter, setFilter] = useState<'all' | 'activas' | 'aprobadas'>('all');
  const [tipoRutaFilter, setTipoRutaFilter] = useState<'all' | 'INTERPROVINCIAL' | 'INTRAPROVINCIAL'>('all');
  const [provinciaFilter, setProvinciaFilter] = useState<string>('all');
  const [cantonFilter, setCantonFilter] = useState<string>('all');
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [selectedOrigen, setSelectedOrigen] = useState<TerminalOption | null>(null);
  const [selectedDestino, setSelectedDestino] = useState<TerminalOption | null>(null);
  const [terminales, setTerminales] = useState<Terminal[]>([]);
  const [loadingTerminales, setLoadingTerminales] = useState(true);
  
  // Estados para alternativas de rutas
  const [routeAlternatives, setRouteAlternatives] = useState<RouteAlternative[]>([]);
  const [selectedAlternative, setSelectedAlternative] = useState<RouteAlternative | null>(null);
  const [maxAlternatives, setMaxAlternatives] = useState<number>(3); // Cantidad de alternativas a solicitar
  const [alternativasInfo, setAlternativasInfo] = useState<{ solicitadas: number; encontradas: number } | null>(null);
  const [errorMismoCanton, setErrorMismoCanton] = useState<string | null>(null);
  
  // Estados para Terminales
  const [terminalSearch, setTerminalSearch] = useState('');
  const [terminalFilter, setTerminalFilter] = useState<string>('all');
  const [terminalProvinciaFilter, setTerminalProvinciaFilter] = useState<string>('all');
  const [terminalViewMode, setTerminalViewMode] = useState<'cards' | 'table'>('cards');
  const [showTerminalModal, setShowTerminalModal] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null);
  const [viewingTerminal, setViewingTerminal] = useState<Terminal | null>(null);
  const [terminalFormData, setTerminalFormData] = useState({
    nombre: '',
    provincia: '',
    canton: '',
    tipologia: 'T3' as 'T1' | 'T2' | 'T3' | 'T4' | 'T5',
    andenes: 10,
    direccion: '',
    telefono: '',
    horarioApertura: '05:00',
    horarioCierre: '22:00',
    latitud: undefined as number | undefined,
    longitud: undefined as number | undefined,
    imagenUrl: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para selección múltiple y paginación de rutas
  const [selectedRutas, setSelectedRutas] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Construir opciones agrupadas por provincia desde los terminales
  const opcionesAgrupadas: ProvinciaTerminalGroup[] = (() => {
    const porProvincia: Record<string, TerminalOption[]> = {};
    
    terminales.forEach((terminal) => {
      if (!porProvincia[terminal.provincia]) {
        porProvincia[terminal.provincia] = [];
      }
      porProvincia[terminal.provincia].push({
        value: `${terminal.provincia}|${terminal.canton}|${terminal.id}`,
        label: `${terminal.canton} - ${terminal.nombre}`,
        terminalId: terminal.id,
        terminalNombre: terminal.nombre,
        canton: terminal.canton,
        provincia: terminal.provincia,
        tipologia: terminal.tipologia,
        lat: terminal.latitud,
        lon: terminal.longitud,
      });
    });

    // Ordenar provincias alfabéticamente
    return Object.entries(porProvincia)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([provincia, options]) => ({
        label: provincia,
        options: options.sort((a, b) => a.canton.localeCompare(b.canton)),
      }));
  })();

  // Función para identificar cantones intermedios en una ruta
  const getCantonesIntermedios = (origenLat: number, origenLon: number, destinoLat: number, destinoLon: number) => {
    if (!terminales.length) return [];
    
    // Calcular el bounding box de la ruta con un margen
    const minLat = Math.min(origenLat, destinoLat);
    const maxLat = Math.max(origenLat, destinoLat);
    const minLon = Math.min(origenLon, destinoLon);
    const maxLon = Math.max(origenLon, destinoLon);
    
    // Margen de 0.5 grados (aproximadamente 50km)
    const margen = 0.5;
    
    // Función para calcular si un punto está cerca de la línea entre origen y destino
    const distanciaAPuntoEnLinea = (lat: number, lon: number): number => {
      // Vector de origen a destino
      const dx = destinoLon - origenLon;
      const dy = destinoLat - origenLat;
      const longitudLinea = Math.sqrt(dx * dx + dy * dy);
      
      if (longitudLinea === 0) return Infinity;
      
      // Proyección del punto sobre la línea
      const t = Math.max(0, Math.min(1, ((lon - origenLon) * dx + (lat - origenLat) * dy) / (longitudLinea * longitudLinea)));
      
      // Punto más cercano en la línea
      const proyX = origenLon + t * dx;
      const proyY = origenLat + t * dy;
      
      // Distancia del punto a la proyección (en grados, aproximado)
      return Math.sqrt(Math.pow(lon - proyX, 2) + Math.pow(lat - proyY, 2));
    };
    
    // Filtrar terminales que están cerca de la ruta
    const cantonesIntermedios = terminales
      .filter(t => {
        if (!t.latitud || !t.longitud) return false;
        
        // Verificar si está dentro del bounding box expandido
        if (t.latitud < minLat - margen || t.latitud > maxLat + margen) return false;
        if (t.longitud < minLon - margen || t.longitud > maxLon + margen) return false;
        
        // Verificar si está cerca de la línea de ruta (máximo 0.3 grados ~ 30km)
        const distancia = distanciaAPuntoEnLinea(t.latitud, t.longitud);
        return distancia < 0.3;
      })
      .map(t => ({
        canton: t.canton,
        provincia: t.provincia,
        terminalNombre: t.nombre,
        terminalId: t.id,
        lat: t.latitud,
        lon: t.longitud,
        tieneTerminal: true,
        tipologia: t.tipologia,
      }))
      // Ordenar por distancia desde el origen
      .sort((a, b) => {
        const distA = Math.sqrt(Math.pow((a.lat || 0) - origenLat, 2) + Math.pow((a.lon || 0) - origenLon, 2));
        const distB = Math.sqrt(Math.pow((b.lat || 0) - origenLat, 2) + Math.pow((b.lon || 0) - origenLon, 2));
        return distA - distB;
      })
      // Eliminar duplicados por cantón
      .filter((item, index, self) => 
        index === self.findIndex(t => t.canton === item.canton)
      );
    
    return cantonesIntermedios;
  };

  const [formData, setFormData] = useState<CreateRutaRequest>({
    nombre: '',
    origen: '',
    destino: '',
    distanciaKm: undefined,
    duracionEstimadaMinutos: undefined,
    descripcion: '',
    aprobadaAnt: false,
    numeroResolucionAnt: '',
    fechaAprobacionAnt: '',
    vigenciaHasta: '',
    observacionesAnt: '',
  });

  useEffect(() => {
    loadRutas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, tipoRutaFilter]);

  useEffect(() => {
    loadTerminales();
  }, []);

  const loadTerminales = async () => {
    try {
      setLoadingTerminales(true);
      const token = getToken();
      const response = await fetch(`${API_BASE}/terminales`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Error al cargar terminales');
      const data = await response.json();
      setTerminales(data);
    } catch (err) {
      console.error('Error al cargar terminales:', err);
      setError('No se pudieron cargar los terminales');
    } finally {
      setLoadingTerminales(false);
    }
  };

  const loadRutas = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const filterParam = filter === 'all' ? undefined : filter;
      const tipoRutaParam = tipoRutaFilter === 'all' ? undefined : tipoRutaFilter;
      const data = await rutasAdminApi.getAll(filterParam, tipoRutaParam, token || undefined);
      setRutas(data);
    } catch (err: unknown) {
      console.error('Error al cargar rutas:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar las rutas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (ruta?: RutaResponse) => {
    if (ruta) {
      setEditingRuta(ruta);
      setFormData({
        nombre: ruta.nombre,
        origen: ruta.origen,
        destino: ruta.destino,
        distanciaKm: ruta.distanciaKm,
        duracionEstimadaMinutos: ruta.duracionEstimadaMinutos,
        descripcion: ruta.descripcion || '',
        aprobadaAnt: ruta.aprobadaAnt,
        numeroResolucionAnt: ruta.numeroResolucionAnt || '',
        fechaAprobacionAnt: ruta.fechaAprobacionAnt || '',
        vigenciaHasta: ruta.vigenciaHasta || '',
        observacionesAnt: ruta.observacionesAnt || '',
      });
      
      // Buscar terminal de origen y destino en los terminales cargados
      let origenOption: TerminalOption | null = null;
      let destinoOption: TerminalOption | null = null;

      // Extraer IDs de terminales del formato "provincia|canton|terminal_id" o usar terminalOrigenId/terminalDestinoId
      const origenParts = ruta.origen.split('|');
      const destinoParts = ruta.destino.split('|');
      const origenTerminalId = ruta.terminalOrigenId || (origenParts.length === 3 ? parseInt(origenParts[2]) : null);
      const destinoTerminalId = ruta.terminalDestinoId || (destinoParts.length === 3 ? parseInt(destinoParts[2]) : null);

      for (const terminal of terminales) {
        const optionValue = `${terminal.provincia}|${terminal.canton}|${terminal.id}`;
        
        // Buscar por ID de terminal (más preciso) o por coincidencia de cantón como fallback
        const matchesOrigen = origenTerminalId 
          ? terminal.id === origenTerminalId 
          : ruta.origen.includes(terminal.canton);
        const matchesDestino = destinoTerminalId 
          ? terminal.id === destinoTerminalId 
          : ruta.destino.includes(terminal.canton);
        
        if (!origenOption && matchesOrigen) {
          origenOption = {
            value: optionValue,
            label: `${terminal.canton} - ${terminal.nombre}`,
            terminalId: terminal.id,
            terminalNombre: terminal.nombre,
            canton: terminal.canton,
            provincia: terminal.provincia,
            tipologia: terminal.tipologia,
            lat: terminal.latitud,
            lon: terminal.longitud,
          };
        }
        if (!destinoOption && matchesDestino) {
          destinoOption = {
            value: optionValue,
            label: `${terminal.canton} - ${terminal.nombre}`,
            terminalId: terminal.id,
            terminalNombre: terminal.nombre,
            canton: terminal.canton,
            provincia: terminal.provincia,
            tipologia: terminal.tipologia,
            lat: terminal.latitud,
            lon: terminal.longitud,
          };
        }
      }

      setSelectedOrigen(origenOption);
      setSelectedDestino(destinoOption);
    } else {
      setEditingRuta(null);
      setFormData({
        nombre: '',
        origen: '',
        destino: '',
        distanciaKm: undefined,
        duracionEstimadaMinutos: undefined,
        descripcion: '',
        aprobadaAnt: false,
        numeroResolucionAnt: '',
        fechaAprobacionAnt: '',
        vigenciaHasta: '',
        observacionesAnt: '',
      });
      setSelectedOrigen(null);
      setSelectedDestino(null);
      setRouteAlternatives([]);
      setSelectedAlternative(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRuta(null);
    setSelectedOrigen(null);
    setSelectedDestino(null);
    setCalculatingRoute(false);
    setRouteAlternatives([]);
    setSelectedAlternative(null);
    setErrorMismoCanton(null);
  };

  // Función para calcular automáticamente distancia y duración con alternativas
  const handleCalculateRoute = async () => {
    if (!selectedOrigen || !selectedDestino) {
      setError('Seleccione origen y destino para calcular la ruta');
      return;
    }

    // Verificar que tengamos coordenadas
    if (!selectedOrigen.lat || !selectedOrigen.lon || !selectedDestino.lat || !selectedDestino.lon) {
      // Si no hay coordenadas, usar estimación basada en tipología
      const distanciaEstimada = 100; // km por defecto
      const duracionEstimada = 120; // minutos por defecto
      setRouteAlternatives([{
        id: 1,
        nombre: 'Ruta Estimada',
        distanciaKm: distanciaEstimada,
        duracionMinutos: duracionEstimada,
        provider: 'Estimación',
        descripcion: 'Valores estimados (sin coordenadas GPS)',
      }]);
      setSelectedAlternative(null);
      setFormData({
        ...formData,
        distanciaKm: distanciaEstimada,
        duracionEstimadaMinutos: duracionEstimada,
      });
      return;
    }

    setCalculatingRoute(true);
    setError(null);
    setRouteAlternatives([]);
    setSelectedAlternative(null);
    setAlternativasInfo(null);

    try {
      // Intentar obtener alternativas de ruta
      try {
        const response = await calculateRouteAlternatives(
          { lat: selectedOrigen.lat, lon: selectedOrigen.lon },
          { lat: selectedDestino.lat, lon: selectedDestino.lon },
          maxAlternatives
        );

        if (response.alternativas && response.alternativas.length > 0) {
          setRouteAlternatives(response.alternativas);
          setAlternativasInfo({
            solicitadas: response.solicitadas || maxAlternatives,
            encontradas: response.encontradas || response.alternativas.length,
          });
          // Auto-seleccionar la primera alternativa (ruta principal)
          const principal = response.alternativas[0];
          setSelectedAlternative(principal);
          setFormData({
            ...formData,
            distanciaKm: principal.distanciaKm,
            duracionEstimadaMinutos: principal.duracionMinutos,
          });
        }
      } catch (apiError) {
        // Fallback: usar cálculo de Haversine si TODAS las APIs fallan
        console.warn('⚠️ Todas las APIs fallaron, usando cálculo aproximado:', apiError);
        const distancia = calculateHaversineDistance(
          { lat: selectedOrigen.lat, lon: selectedOrigen.lon },
          { lat: selectedDestino.lat, lon: selectedDestino.lon }
        );
        const duracion = estimateDuration(distancia);

        // Generar alternativas sintéticas basadas en Haversine
        const syntheticAlternatives: RouteAlternative[] = [
          {
            id: 1,
            nombre: 'Ruta Principal (Estimada)',
            distanciaKm: Math.round(distancia * 1.3 * 10) / 10, // Factor carretera
            duracionMinutos: Math.round(duracion * 1.3),
            provider: 'Haversine',
            descripcion: 'Ruta estimada por carretera',
            vias: ['Troncal de la Sierra (E35)', 'Panamericana'],
          },
          {
            id: 2,
            nombre: 'Vía Alterna (Estimada)',
            distanciaKm: Math.round(distancia * 1.5 * 10) / 10,
            duracionMinutos: Math.round(duracion * 1.5),
            provider: 'Haversine',
            descripcion: 'Ruta alternativa estimada',
            vias: ['Vía Secundaria Provincial'],
          },
        ];

        setRouteAlternatives(syntheticAlternatives);
        setSelectedAlternative(syntheticAlternatives[0]);
        setFormData({
          ...formData,
          distanciaKm: syntheticAlternatives[0].distanciaKm,
          duracionEstimadaMinutos: syntheticAlternatives[0].duracionMinutos,
        });
      }
    } catch (err) {
      console.error('❌ Error al calcular ruta:', err);
      setError('No se pudo calcular la ruta. Por favor ingrese los valores manualmente.');
    } finally {
      setCalculatingRoute(false);
    }
  };

  // Handler para seleccionar una alternativa
  const handleSelectAlternative = (alternative: RouteAlternative) => {
    setSelectedAlternative(alternative);
    
    // Construir descripción del camino seleccionado
    let descripcionCamino = `Camino: ${alternative.nombre}`;
    if (alternative.vias && alternative.vias.length > 0) {
      descripcionCamino += ` | Vías: ${alternative.vias.join(' → ')}`;
    } else if (alternative.viaPrincipal) {
      descripcionCamino += ` | Vía principal: ${alternative.viaPrincipal}`;
    }
    descripcionCamino += ` | Distancia base: ${alternative.distanciaKm} km | Duración base: ${Math.floor(alternative.duracionMinutos / 60)}h ${alternative.duracionMinutos % 60}m`;
    
    setFormData({
      ...formData,
      distanciaKm: alternative.distanciaKm,
      duracionEstimadaMinutos: alternative.duracionMinutos,
      descripcion: descripcionCamino,
    });
  };

  // Calcular automáticamente cuando cambian origen y destino
  useEffect(() => {
    if (selectedOrigen && selectedDestino && selectedOrigen.value !== selectedDestino.value) {
      // Validar que no sean del mismo cantón
      if (selectedOrigen.canton === selectedDestino.canton) {
        setErrorMismoCanton('No se pueden crear rutas entre terminales del mismo cantón');
        setRouteAlternatives([]);
        setSelectedAlternative(null);
        return;
      }
      setErrorMismoCanton(null);

      // Generar nombre de ruta automáticamente: "Canton (Terminal) - Canton (Terminal)"
      const nombreRuta = `${selectedOrigen.canton} - ${selectedDestino.canton}`;
      setFormData(prev => ({
        ...prev,
        nombre: nombreRuta,
        origen: selectedOrigen.value,
        destino: selectedDestino.value
      }));

      // Pequeño delay para evitar múltiples llamadas
      const timer = setTimeout(() => {
        handleCalculateRoute();
      }, 500);
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrigen, selectedDestino]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que no sean del mismo cantón
    if (selectedOrigen && selectedDestino && selectedOrigen.canton === selectedDestino.canton) {
      setError('No se pueden crear rutas entre terminales del mismo cantón');
      return;
    }
    
    try {
      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      if (editingRuta) {
        await rutasAdminApi.update(editingRuta.id, formData as UpdateRutaRequest, token);
      } else {
        await rutasAdminApi.create(formData, token);
      }

      handleCloseModal();
      loadRutas();
    } catch (err: unknown) {
      console.error('Error al guardar ruta:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar la ruta');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de desactivar esta ruta?')) return;

    try {
      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      await rutasAdminApi.delete(id, token);
      loadRutas();
    } catch (err: unknown) {
      console.error('Error al eliminar ruta:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar la ruta');
    }
  };

  // ===================== FUNCIONES PARA SELECCIÓN Y ACCIONES MASIVAS =====================
  
  // Rutas filtradas (antes de paginación)
  const filteredRutas = rutas
    .filter(ruta => {
      if (provinciaFilter !== 'all') {
        const matchesProvincia = ruta.origen.includes(provinciaFilter) || ruta.destino.includes(provinciaFilter);
        if (!matchesProvincia) return false;
      }
      if (cantonFilter !== 'all' && provinciaFilter !== 'all') {
        const matchesCanton = ruta.origen.includes(cantonFilter) || ruta.destino.includes(cantonFilter);
        if (!matchesCanton) return false;
      }
      return true;
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Paginación
  const totalPages = Math.ceil(filteredRutas.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedRutas = filteredRutas.slice(startIndex, endIndex);

  // Selección de rutas
  const handleSelectRuta = (id: number) => {
    const newSelected = new Set(selectedRutas);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRutas(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRutas.size === paginatedRutas.length) {
      // Deseleccionar todos
      setSelectedRutas(new Set());
    } else {
      // Seleccionar todos los de la página actual
      setSelectedRutas(new Set(paginatedRutas.map(r => r.id)));
    }
  };

  const handleSelectAllFiltered = () => {
    // Seleccionar todas las rutas filtradas (no solo la página actual)
    setSelectedRutas(new Set(filteredRutas.map(r => r.id)));
  };

  const clearSelection = () => {
    setSelectedRutas(new Set());
  };

  // Acciones masivas
  const handleBulkActivate = async (activate: boolean) => {
    if (selectedRutas.size === 0) return;
    
    const action = activate ? 'activar' : 'desactivar';
    if (!confirm(`¿Está seguro de ${action} ${selectedRutas.size} ruta(s)?`)) return;

    setBulkActionLoading(true);
    try {
      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      // Actualizar cada ruta seleccionada
      const promises = Array.from(selectedRutas).map(id => 
        rutasAdminApi.update(id, { activo: activate }, token)
      );
      
      await Promise.all(promises);
      clearSelection();
      loadRutas();
    } catch (err: unknown) {
      console.error(`Error al ${action} rutas:`, err);
      setError(err instanceof Error ? err.message : `Error al ${action} las rutas`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkApproveAnt = async (approve: boolean) => {
    if (selectedRutas.size === 0) return;
    
    const action = approve ? 'aprobar' : 'quitar aprobación de';
    if (!confirm(`¿Está seguro de ${action} ${selectedRutas.size} ruta(s) en la ANT?`)) return;

    setBulkActionLoading(true);
    try {
      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      // Actualizar cada ruta seleccionada
      const promises = Array.from(selectedRutas).map(id => 
        rutasAdminApi.update(id, { aprobadaAnt: approve }, token)
      );
      
      await Promise.all(promises);
      clearSelection();
      loadRutas();
    } catch (err: unknown) {
      console.error(`Error al ${action} rutas:`, err);
      setError(err instanceof Error ? err.message : `Error al ${action} las rutas`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Cambiar página
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // ===================== FUNCIONES PARA TERMINALES =====================
  
  const filteredTerminales = terminales.filter(terminal => {
    const matchesSearch = terminal.nombre.toLowerCase().includes(terminalSearch.toLowerCase()) ||
                         terminal.canton.toLowerCase().includes(terminalSearch.toLowerCase()) ||
                         terminal.provincia.toLowerCase().includes(terminalSearch.toLowerCase());
    const matchesFilter = terminalFilter === 'all' || terminal.tipologia === terminalFilter;
    const matchesProvincia = terminalProvinciaFilter === 'all' || terminal.provincia === terminalProvinciaFilter;
    return matchesSearch && matchesFilter && matchesProvincia;
  });

  const getTipologiaInfo = (tipologia: string) => {
    const info: Record<string, { label: string; color: string; bgColor: string }> = {
      'T1': { label: 'Básico/Satélite', color: 'text-gray-700', bgColor: 'bg-gray-100' },
      'T2': { label: 'Pequeño', color: 'text-blue-700', bgColor: 'bg-blue-100' },
      'T3': { label: 'Mediano', color: 'text-green-700', bgColor: 'bg-green-100' },
      'T4': { label: 'Grande', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
      'T5': { label: 'Principal/Hub', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    };
    return info[tipologia] || info['T3'];
  };

  const handleOpenTerminalModal = (terminal?: Terminal) => {
    if (terminal) {
      setEditingTerminal(terminal);
      setTerminalFormData({
        nombre: terminal.nombre,
        provincia: terminal.provincia,
        canton: terminal.canton,
        tipologia: terminal.tipologia,
        andenes: terminal.andenes,
        direccion: terminal.direccion || '',
        telefono: terminal.telefono || '',
        horarioApertura: terminal.horarioApertura || '05:00',
        horarioCierre: terminal.horarioCierre || '22:00',
        latitud: terminal.latitud ?? undefined,
        longitud: terminal.longitud ?? undefined,
        imagenUrl: terminal.imagenUrl || '',
      });
    } else {
      setEditingTerminal(null);
      setTerminalFormData({
        nombre: '',
        provincia: '',
        canton: '',
        tipologia: 'T3',
        andenes: 10,
        direccion: '',
        telefono: '',
        horarioApertura: '05:00',
        horarioCierre: '22:00',
        latitud: undefined,
        longitud: undefined,
        imagenUrl: '',
      });
    }
    setShowTerminalModal(true);
  };

  const handleCloseTerminalModal = () => {
    setShowTerminalModal(false);
    setEditingTerminal(null);
  };

  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      const url = editingTerminal 
        ? `${API_BASE}/terminales/${editingTerminal.id}`
        : `${API_BASE}/terminales`;
      
      const method = editingTerminal ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(terminalFormData)
      });

      if (!response.ok) throw new Error('Error al guardar terminal');
      
      handleCloseTerminalModal();
      loadTerminales();
    } catch (err) {
      console.error('Error al guardar terminal:', err);
      setError('Error al guardar el terminal');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor seleccione una imagen válida');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      // Simular upload - en producción usar un servicio real
      const reader = new FileReader();
      reader.onloadend = () => {
        setTerminalFormData(prev => ({
          ...prev,
          imagenUrl: reader.result as string
        }));
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error al subir imagen:', err);
      setError('Error al subir la imagen');
      setUploadingImage(false);
    }
  };

  const provinciasUnicas = [...new Set(terminales.map(t => t.provincia))].sort();

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-8">
          {/* Header con Tabs */}
          <div className="bg-white rounded-lg shadow mb-6">
            {/* Título */}
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Rutas y Terminales</h1>
              <p className="text-sm text-gray-600 mt-1">Administra las rutas aprobadas por la ANT y los terminales terrestres</p>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('rutas')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'rutas'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Route className="w-4 h-4" />
                Rutas ({rutas.length})
              </button>
              <button
                onClick={() => setActiveTab('terminales')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'terminales'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Terminales ({terminales.length})
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
              <button onClick={() => setError(null)} className="text-red-600 text-sm underline mt-1">Cerrar</button>
            </div>
          )}

          {/* ===================== TAB: RUTAS ===================== */}
          {activeTab === 'rutas' && (
            <>
              {/* Header de Rutas */}
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    {/* Filtro por estado */}
                    <div className="flex gap-2">
                      <span className="text-xs text-gray-500 self-center mr-1">Estado:</span>
                      <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Todas
                      </button>
                      <button
                        onClick={() => setFilter('activas')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          filter === 'activas' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Activas
                      </button>
                      <button
                        onClick={() => setFilter('aprobadas')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          filter === 'aprobadas' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Aprobadas ANT
                      </button>
                    </div>
                    {/* Filtro por tipo de ruta */}
                    <div className="flex gap-2">
                      <span className="text-xs text-gray-500 self-center mr-1">Tipo:</span>
                      <button
                        onClick={() => setTipoRutaFilter('all')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          tipoRutaFilter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Todas
                      </button>
                      <button
                        onClick={() => setTipoRutaFilter('INTERPROVINCIAL')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          tipoRutaFilter === 'INTERPROVINCIAL' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Interprovinciales
                      </button>
                      <button
                        onClick={() => setTipoRutaFilter('INTRAPROVINCIAL')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          tipoRutaFilter === 'INTRAPROVINCIAL' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Intraprovinciales
                      </button>
                    </div>
                    {/* Filtro por provincia */}
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-gray-500 mr-1">Provincia:</span>
                      <select
                        value={provinciaFilter}
                        onChange={(e) => {
                          setProvinciaFilter(e.target.value);
                          setCantonFilter('all'); // Resetear cantón al cambiar provincia
                        }}
                        className="px-3 py-1.5 rounded text-sm font-medium border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="all">Todas las provincias</option>
                        {Array.from(new Set(terminales.map(t => t.provincia))).sort().map(provincia => (
                          <option key={provincia} value={provincia}>{provincia}</option>
                        ))}
                      </select>
                      {/* Filtro por cantón - Solo visible cuando hay provincia seleccionada */}
                      {provinciaFilter !== 'all' && (
                        <>
                          <span className="text-xs text-gray-500 ml-2 mr-1">Cantón:</span>
                          <select
                            value={cantonFilter}
                            onChange={(e) => setCantonFilter(e.target.value)}
                            className="px-3 py-1.5 rounded text-sm font-medium border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          >
                            <option value="all">Todos los cantones</option>
                            {Array.from(new Set(
                              terminales
                                .filter(t => t.provincia === provinciaFilter)
                                .map(t => t.canton)
                            )).sort().map(canton => (
                              <option key={canton} value={canton}>{canton}</option>
                            ))}
                          </select>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    + Nueva Ruta
                  </button>
                </div>
              </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando rutas...</p>
            </div>
          )}

          {/* Tabla de rutas con scroll horizontal y columnas fijas */}
          {!loading && (
            <div className="bg-white rounded-lg shadow">
              {rutas.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay rutas registradas</p>
              ) : (
                <>
                  {/* Barra de acciones masivas */}
                  {selectedRutas.size > 0 && (
                    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-blue-800">
                          {selectedRutas.size} ruta(s) seleccionada(s)
                        </span>
                        {selectedRutas.size < filteredRutas.length && (
                          <button
                            onClick={handleSelectAllFiltered}
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            Seleccionar todas las {filteredRutas.length} rutas filtradas
                          </button>
                        )}
                        <button
                          onClick={clearSelection}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Limpiar selección
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleBulkActivate(true)}
                          disabled={bulkActionLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          <Power className="w-4 h-4" />
                          Activar
                        </button>
                        <button
                          onClick={() => handleBulkActivate(false)}
                          disabled={bulkActionLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
                        >
                          <Power className="w-4 h-4" />
                          Desactivar
                        </button>
                        <div className="w-px h-6 bg-gray-300 mx-1" />
                        <button
                          onClick={() => handleBulkApproveAnt(true)}
                          disabled={bulkActionLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          <FileCheck className="w-4 h-4" />
                          Aprobar ANT
                        </button>
                        <button
                          onClick={() => handleBulkApproveAnt(false)}
                          disabled={bulkActionLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                        >
                          <FileCheck className="w-4 h-4" />
                          Quitar ANT
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '1300px' }}>
                      <thead className="bg-gray-50">
                        <tr>
                          {/* Checkbox header - Fija izquierda */}
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 min-w-[40px]">
                            <input
                              type="checkbox"
                              checked={paginatedRutas.length > 0 && selectedRutas.size === paginatedRutas.length}
                              onChange={handleSelectAll}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                              title="Seleccionar todos en esta página"
                            />
                          </th>
                          {/* Columnas fijas a la izquierda */}
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-[40px] bg-gray-50 z-10 min-w-[50px]">
                            #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-[90px] bg-gray-50 z-10 min-w-[180px]">
                            Origen (Terminal)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-[270px] bg-gray-50 z-10 min-w-[180px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            Destino (Terminal)
                          </th>
                          {/* Columnas scrollables centrales */}
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                            Tipo
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                            # Caminos
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                            Distancia
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                            Duración
                          </th>
                          {/* Columnas fijas a la derecha (3 últimas) */}
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-[160px] bg-gray-50 z-10 min-w-[110px] shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            Aprobación ANT
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-[80px] bg-gray-50 z-10 min-w-[80px]">
                            Estado
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10 min-w-[80px]">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedRutas.map((ruta, index) => (
                          <tr 
                            key={ruta.id} 
                            className={`hover:bg-gray-50 group ${selectedRutas.has(ruta.id) ? 'bg-blue-50' : ''}`}
                          >
                            {/* Checkbox - Fija izquierda */}
                            <td className={`px-3 py-3 sticky left-0 z-10 text-center ${selectedRutas.has(ruta.id) ? 'bg-blue-50' : 'bg-white'} group-hover:bg-gray-50`}>
                              <input
                                type="checkbox"
                                checked={selectedRutas.has(ruta.id)}
                                onChange={() => handleSelectRuta(ruta.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                            {/* # - Fija izquierda */}
                            <td className={`px-4 py-3 sticky left-[40px] z-10 text-sm text-gray-500 font-medium ${selectedRutas.has(ruta.id) ? 'bg-blue-50' : 'bg-white'} group-hover:bg-gray-50`}>
                              {startIndex + index + 1}
                            </td>
                            {/* Origen (Terminal) - Fija izquierda */}
                            <td className={`px-4 py-3 sticky left-[90px] z-10 ${selectedRutas.has(ruta.id) ? 'bg-blue-50' : 'bg-white'} group-hover:bg-gray-50`}>
                              <div className="text-sm font-medium text-gray-900">{ruta.origen}</div>
                              {ruta.terminalOrigenNombre && (
                                <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                  <Building2 className="w-3 h-3" />
                                  {ruta.terminalOrigenNombre}
                                </div>
                              )}
                            </td>
                            {/* Destino (Terminal) - Fija izquierda con sombra */}
                            <td className={`px-4 py-3 sticky left-[270px] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${selectedRutas.has(ruta.id) ? 'bg-blue-50' : 'bg-white'} group-hover:bg-gray-50`}>
                              <div className="text-sm font-medium text-gray-900">{ruta.destino}</div>
                              {ruta.terminalDestinoNombre && (
                                <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                  <Building2 className="w-3 h-3" />
                                  {ruta.terminalDestinoNombre}
                                </div>
                              )}
                            </td>
                            {/* Tipo */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  ruta.tipoRuta === 'INTERPROVINCIAL' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : ruta.tipoRuta === 'INTRAPROVINCIAL'
                                      ? 'bg-cyan-100 text-cyan-800'
                                      : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {ruta.tipoRuta === 'INTERPROVINCIAL' 
                                  ? 'Interprovincial' 
                                  : ruta.tipoRuta === 'INTRAPROVINCIAL' 
                                    ? 'Intraprovincial' 
                                    : 'Sin tipo'}
                              </span>
                            </td>
                            {/* # Caminos */}
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                (ruta.cantidadCaminos ?? 0) > 0 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {ruta.cantidadCaminos ?? 0}
                              </span>
                            </td>
                            {/* Distancia */}
                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-700">
                              {ruta.distanciaKm ? `${ruta.distanciaKm} km` : 'N/A'}
                            </td>
                            {/* Duración */}
                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-700">
                              {ruta.duracionEstimadaMinutos 
                                ? `${Math.floor(ruta.duracionEstimadaMinutos / 60)}h ${ruta.duracionEstimadaMinutos % 60}m` 
                                : 'N/A'}
                            </td>
                            {/* Aprobación ANT - Fija derecha con sombra */}
                            <td className={`px-4 py-3 whitespace-nowrap sticky right-[160px] z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] ${selectedRutas.has(ruta.id) ? 'bg-blue-50' : 'bg-white'} group-hover:bg-gray-50`}>
                              <div className="flex items-center justify-center gap-1">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    ruta.aprobadaAnt ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {ruta.aprobadaAnt ? 'Aprobada' : 'Pendiente'}
                                </span>
                                {ruta.aprobadaAnt && ruta.observacionesAnt && (
                                  <div className="relative group/tooltip">
                                    <Info className="w-4 h-4 cursor-help text-blue-600" />
                                    <div className="absolute right-0 top-6 hidden group-hover/tooltip:block bg-gray-900 text-white p-3 rounded-lg shadow-xl z-20 w-64 text-left">
                                      <p className="text-xs">
                                        <strong>Resolución:</strong> {ruta.numeroResolucionAnt}
                                      </p>
                                      <p className="text-xs">
                                        <strong>Aprobada:</strong> {ruta.fechaAprobacionAnt}
                                      </p>
                                      <p className="text-xs">
                                        <strong>Vigente hasta:</strong> {ruta.vigenciaHasta}
                                      </p>
                                      <p className="text-xs mt-1">{ruta.observacionesAnt}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                            {/* Estado - Fija derecha */}
                            <td className={`px-4 py-3 whitespace-nowrap sticky right-[80px] z-10 text-center ${selectedRutas.has(ruta.id) ? 'bg-blue-50' : 'bg-white'} group-hover:bg-gray-50`}>
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  ruta.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {ruta.activo ? 'Activa' : 'Inactiva'}
                              </span>
                            </td>
                            {/* Acciones - Fija derecha */}
                            <td className={`px-4 py-3 whitespace-nowrap text-sm sticky right-0 z-10 ${selectedRutas.has(ruta.id) ? 'bg-blue-50' : 'bg-white'} group-hover:bg-gray-50`}>
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleOpenModal(ruta)}
                                  className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(ruta.id)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    ruta.activo 
                                      ? 'text-red-600 hover:bg-red-50 hover:text-red-700' 
                                      : 'text-gray-400 cursor-not-allowed'
                                  }`}
                                  title="Desactivar"
                                  disabled={!ruta.activo}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Footer de paginación */}
                  <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-700">
                        Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                        <span className="font-medium">{Math.min(endIndex, filteredRutas.length)}</span> de{' '}
                        <span className="font-medium">{filteredRutas.length}</span> rutas
                      </span>
                      <div className="flex items-center gap-2">
                        <label htmlFor="rowsPerPage" className="text-sm text-gray-600">Filas por página:</label>
                        <select
                          id="rowsPerPage"
                          value={rowsPerPage}
                          onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Primera página"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Página anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-600">Página</span>
                        <input
                          type="number"
                          min={1}
                          max={totalPages}
                          value={currentPage}
                          onChange={(e) => goToPage(Number(e.target.value))}
                          className="w-14 px-2 py-1 text-sm text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="text-sm text-gray-600">de {totalPages}</span>
                      </div>
                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Página siguiente"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Última página"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {editingRuta ? 'Editar Ruta' : 'Nueva Ruta'}
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Información básica */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre de la Ruta *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                          placeholder="Ej: Quito - Guayaquil Vía Alóag"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Origen (Terminal) *
                          </label>
                          <Select<TerminalOption, false, ProvinciaTerminalGroup>
                            value={selectedOrigen}
                            onChange={(option) => {
                              setSelectedOrigen(option);
                              setFormData({ ...formData, origen: option?.value || '' });
                            }}
                            options={opcionesAgrupadas}
                            placeholder={loadingTerminales ? "Cargando terminales..." : "Buscar terminal..."}
                            isClearable
                            isSearchable
                            isLoading={loadingTerminales}
                            isDisabled={loadingTerminales}
                            noOptionsMessage={() => 'No se encontró el terminal'}
                            className="react-select-container"
                            classNamePrefix="react-select"
                            formatGroupLabel={(group) => (
                              <div className="font-bold text-gray-900 py-1 text-sm bg-blue-50 px-2 rounded">
                                {group.label}
                              </div>
                            )}
                            formatOptionLabel={(option) => (
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium">{option.canton}</span>
                                  <span className="text-gray-500 text-sm ml-2">- {option.terminalNombre}</span>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  option.tipologia === 'T5' ? 'bg-purple-100 text-purple-700' :
                                  option.tipologia === 'T4' ? 'bg-yellow-100 text-yellow-700' :
                                  option.tipologia === 'T3' ? 'bg-green-100 text-green-700' :
                                  option.tipologia === 'T2' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {option.tipologia}
                                </span>
                              </div>
                            )}
                            styles={{
                              control: (base) => ({
                                ...base,
                                minHeight: '42px',
                                borderColor: '#d1d5db',
                                '&:hover': { borderColor: '#3b82f6' },
                              }),
                              groupHeading: (base) => ({
                                ...base,
                                backgroundColor: '#eff6ff',
                                color: '#1e40af',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                                padding: '8px 12px',
                                margin: 0,
                              }),
                              option: (base, state) => ({
                                ...base,
                                backgroundColor: state.isSelected
                                  ? '#3b82f6'
                                  : state.isFocused
                                  ? '#dbeafe'
                                  : 'white',
                                color: state.isSelected ? 'white' : '#374151',
                                '&:hover': {
                                  backgroundColor: state.isSelected ? '#3b82f6' : '#bfdbfe',
                                },
                              }),
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Destino (Terminal) *
                          </label>
                          <Select<TerminalOption, false, ProvinciaTerminalGroup>
                            value={selectedDestino}
                            onChange={(option) => {
                              setSelectedDestino(option);
                              setFormData({ ...formData, destino: option?.value || '' });
                            }}
                            options={opcionesAgrupadas}
                            placeholder={loadingTerminales ? "Cargando terminales..." : "Buscar terminal..."}
                            isClearable
                            isSearchable
                            isLoading={loadingTerminales}
                            isDisabled={loadingTerminales}
                            noOptionsMessage={() => 'No se encontró el terminal'}
                            className="react-select-container"
                            classNamePrefix="react-select"
                            formatGroupLabel={(group) => (
                              <div className="font-bold text-gray-900 py-1 text-sm bg-green-50 px-2 rounded">
                                {group.label}
                              </div>
                            )}
                            formatOptionLabel={(option) => (
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium">{option.terminalNombre}</span>
                                  <span className="text-gray-500 text-sm ml-2">({option.canton})</span>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  option.tipologia === 'T5' ? 'bg-purple-100 text-purple-700' :
                                  option.tipologia === 'T4' ? 'bg-yellow-100 text-yellow-700' :
                                  option.tipologia === 'T3' ? 'bg-green-100 text-green-700' :
                                  option.tipologia === 'T2' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {option.tipologia}
                                </span>
                              </div>
                            )}
                            styles={{
                              control: (base) => ({
                                ...base,
                                minHeight: '42px',
                                borderColor: '#d1d5db',
                                '&:hover': { borderColor: '#10b981' },
                              }),
                              groupHeading: (base) => ({
                                ...base,
                                backgroundColor: '#ecfdf5',
                                color: '#047857',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                                padding: '8px 12px',
                                margin: 0,
                              }),
                              option: (base, state) => ({
                                ...base,
                                backgroundColor: state.isSelected
                                  ? '#10b981'
                                  : state.isFocused
                                  ? '#d1fae5'
                                  : 'white',
                                color: state.isSelected ? 'white' : '#374151',
                                '&:hover': {
                                  backgroundColor: state.isSelected ? '#10b981' : '#a7f3d0',
                                },
                              }),
                            }}
                          />
                        </div>
                      </div>

                      {/* Mensaje de error: mismo cantón */}
                      {errorMismoCanton && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="text-red-700 font-medium text-sm">{errorMismoCanton}</span>
                        </div>
                      )}
                    </div>

                    {/* Distancia y duración - Calculados automáticamente */}
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Route className="w-5 h-5 text-blue-600" />
                          <span className="text-blue-700 font-semibold">Alternativas de Ruta</span>
                        </div>
                        {calculatingRoute && (
                          <div className="flex items-center gap-2 text-blue-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                            <span className="text-sm animate-pulse">Buscando rutas disponibles...</span>
                          </div>
                        )}
                        {routeAlternatives.length > 0 && !calculatingRoute && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                            {routeAlternatives.length} ruta{routeAlternatives.length > 1 ? 's' : ''} encontrada{routeAlternatives.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Información de coordenadas */}
                      {selectedOrigen && selectedDestino && (
                        <div className="mb-4 p-3 bg-white/50 rounded-lg border border-blue-100">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="font-semibold text-blue-700">Origen:</span>
                              <p className="text-gray-700">{selectedOrigen.terminalNombre}</p>
                              {selectedOrigen.lat && selectedOrigen.lon ? (
                                <p className="text-green-600 font-mono">
                                  {selectedOrigen.lat.toFixed(4)}, {selectedOrigen.lon.toFixed(4)}
                                </p>
                              ) : (
                                <p className="text-orange-500">Sin coordenadas GPS</p>
                              )}
                            </div>
                            <div>
                              <span className="font-semibold text-green-700">Destino:</span>
                              <p className="text-gray-700">{selectedDestino.terminalNombre}</p>
                              {selectedDestino.lat && selectedDestino.lon ? (
                                <p className="text-green-600 font-mono">
                                  {selectedDestino.lat.toFixed(4)}, {selectedDestino.lon.toFixed(4)}
                                </p>
                              ) : (
                                <p className="text-orange-500">Sin coordenadas GPS</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Lista de alternativas de ruta */}
                      {routeAlternatives.length > 0 && (
                        <div className="mb-4">
                          {/* Nota informativa */}
                          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <span className="text-amber-500 text-lg">ℹ️</span>
                              <div className="text-xs text-amber-800">
                                <p className="font-semibold mb-1">Información referencial</p>
                                <p className="mb-2">Los caminos mostrados son solo informativos. La cooperativa definirá el camino específico al crear sus frecuencias.</p>
                                <div className="flex items-center gap-4 text-[10px] pt-1 border-t border-amber-200">
                                  <span className="inline-flex items-center gap-1">
                                    <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white"><Building2 className="w-2.5 h-2.5" /></span>
                                    Origen/Destino
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <span className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-white ring-1 ring-amber-300"><Building2 className="w-2.5 h-2.5" /></span>
                                    Terminal intermedio
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 border border-gray-300"><Route className="w-2 h-2" /></span>
                                    Vía/Carretera
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-sm font-medium text-gray-700 mb-2">Caminos disponibles:</p>
                          <div className="space-y-3">
                            {routeAlternatives.map((alt) => (
                              <div
                                key={alt.id}
                                onClick={() => handleSelectAlternative(alt)}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                  selectedAlternative?.id === alt.id
                                    ? 'border-green-500 bg-green-50 shadow-md'
                                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                      selectedAlternative?.id === alt.id
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-200 text-gray-600'
                                    }`}>
                                      {selectedAlternative?.id === alt.id ? (
                                        <CheckCircle2 className="w-5 h-5" />
                                      ) : (
                                        <span className="text-sm font-bold">{alt.id}</span>
                                      )}
                                    </div>
                                    <div>
                                      <p className={`font-semibold ${
                                        selectedAlternative?.id === alt.id ? 'text-green-700' : 'text-gray-900'
                                      }`}>
                                        {alt.nombre}
                                      </p>
                                      {alt.descripcion && (
                                        <p className="text-xs text-gray-500">{alt.descripcion}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 text-right flex-shrink-0">
                                    <div className="flex items-center gap-1 text-blue-600">
                                      <Navigation className="w-4 h-4" />
                                      <span className="font-bold">{alt.distanciaKm} km</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-purple-600">
                                      <Clock className="w-4 h-4" />
                                      <span className="font-bold">
                                        {Math.floor(alt.duracionMinutos / 60)}h {alt.duracionMinutos % 60}m
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Estadísticas del camino: terminales y vías */}
                                {(() => {
                                  const cantonesIntermedios = (selectedOrigen?.lat && selectedOrigen?.lon && selectedDestino?.lat && selectedDestino?.lon)
                                    ? getCantonesIntermedios(
                                        selectedOrigen.lat, 
                                        selectedOrigen.lon, 
                                        selectedDestino.lat, 
                                        selectedDestino.lon
                                      ).filter(c => 
                                        c.canton !== selectedOrigen?.canton && c.canton !== selectedDestino?.canton
                                      )
                                    : [];
                                  
                                  const numVias = alt.vias?.length || (alt.viaPrincipal ? 1 : 0);
                                  const numTerminales = cantonesIntermedios.length + 2; // +2 por origen y destino
                                  
                                  return (
                                    <div className="mt-2 ml-11 flex flex-wrap gap-3">
                                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                                        selectedAlternative?.id === alt.id 
                                          ? 'bg-amber-100 text-amber-800' 
                                          : 'bg-gray-100 text-gray-600'
                                      }`}>
                                        <Building2 className="w-3.5 h-3.5" />
                                        <span className="font-semibold">{numTerminales}</span> terminales
                                        {cantonesIntermedios.length > 0 && (
                                          <span className="text-[10px] opacity-70">({cantonesIntermedios.length} intermedios)</span>
                                        )}
                                      </span>
                                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                                        selectedAlternative?.id === alt.id 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-gray-100 text-gray-600'
                                      }`}>
                                        <Route className="w-3.5 h-3.5" />
                                        <span className="font-semibold">{numVias}</span> {numVias === 1 ? 'vía' : 'vías'}
                                      </span>
                                    </div>
                                  );
                                })()}
                                
                                {/* Secuencia de carreteras/vías del camino con terminales integrados */}
                                {alt.vias && alt.vias.length > 0 && (
                                  <div className="mt-3 ml-11">
                                    <p className="text-xs font-medium text-gray-600 mb-2">Recorrido:</p>
                                    {(() => {
                                      // Obtener cantones intermedios si hay coordenadas
                                      const cantonesIntermedios = (selectedOrigen?.lat && selectedOrigen?.lon && selectedDestino?.lat && selectedDestino?.lon)
                                        ? getCantonesIntermedios(
                                            selectedOrigen.lat, 
                                            selectedOrigen.lon, 
                                            selectedDestino.lat, 
                                            selectedDestino.lon
                                          ).filter(c => 
                                            c.canton !== selectedOrigen.canton && c.canton !== selectedDestino.canton
                                          )
                                        : [];
                                      
                                      // Distribuir los cantones entre las vías
                                      const viasConTerminales: Array<{tipo: 'via' | 'terminal', contenido: string, terminal?: typeof cantonesIntermedios[0]}> = [];
                                      const terminalesPorVia = Math.ceil(cantonesIntermedios.length / (alt.vias?.length || 1));
                                      
                                      alt.vias?.forEach((via, idx) => {
                                        // Agregar terminales antes de esta vía (distribuidos)
                                        const startIdx = idx * terminalesPorVia;
                                        const endIdx = Math.min(startIdx + terminalesPorVia, cantonesIntermedios.length);
                                        
                                        for (let i = startIdx; i < endIdx; i++) {
                                          viasConTerminales.push({
                                            tipo: 'terminal',
                                            contenido: cantonesIntermedios[i].canton,
                                            terminal: cantonesIntermedios[i]
                                          });
                                        }
                                        
                                        // Agregar la vía
                                        viasConTerminales.push({ tipo: 'via', contenido: via });
                                      });
                                      
                                      return (
                                        <div className={`relative pl-4 border-l-2 ${
                                          selectedAlternative?.id === alt.id 
                                            ? 'border-green-400' 
                                            : 'border-gray-300'
                                        }`}>
                                          {/* Punto de origen */}
                                          <div className="relative pb-3">
                                            <div className={`absolute -left-[13px] w-6 h-6 rounded-full flex items-center justify-center ${
                                              selectedAlternative?.id === alt.id 
                                                ? 'bg-green-500 text-white' 
                                                : 'bg-blue-500 text-white'
                                            }`}>
                                              <Building2 className="w-3 h-3" />
                                            </div>
                                            <p className="ml-4 text-xs font-semibold text-gray-800">
                                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                                                selectedAlternative?.id === alt.id 
                                                  ? 'bg-green-100 text-green-800' 
                                                  : 'bg-blue-100 text-blue-800'
                                              }`}>
                                                <span>{selectedOrigen?.terminalNombre || 'Origen'}</span>
                                                <span className="font-normal opacity-70">({selectedOrigen?.canton})</span>
                                              </span>
                                            </p>
                                          </div>
                                          
                                          {/* Vías y terminales intercalados */}
                                          {viasConTerminales.map((item, idx) => (
                                            <div key={idx} className="relative pb-3">
                                              {item.tipo === 'terminal' ? (
                                                <>
                                                  <div className={`absolute -left-[11px] w-5 h-5 rounded-full flex items-center justify-center ${
                                                    selectedAlternative?.id === alt.id 
                                                      ? 'bg-amber-500 text-white ring-2 ring-amber-300' 
                                                      : 'bg-amber-400 text-white ring-2 ring-amber-200'
                                                  }`}>
                                                    <Building2 className="w-3 h-3" />
                                                  </div>
                                                  <div className="ml-4">
                                                    <span 
                                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                                                        selectedAlternative?.id === alt.id 
                                                          ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                                                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                      }`}
                                                      title={`Terminal: ${item.terminal?.terminalNombre} (${item.terminal?.tipologia})`}
                                                    >
                                                      {item.terminal?.canton}
                                                      <span className="font-normal opacity-70 text-[10px]">({item.terminal?.provincia})</span>
                                                    </span>
                                                  </div>
                                                </>
                                              ) : (
                                                <>
                                                  <div className={`absolute -left-[9px] w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                                                    selectedAlternative?.id === alt.id 
                                                      ? 'bg-green-100 text-green-700 border-2 border-green-400' 
                                                      : 'bg-gray-100 text-gray-600 border-2 border-gray-300'
                                                  }`}>
                                                    <Route className="w-2.5 h-2.5" />
                                                  </div>
                                                  <p className={`ml-4 text-xs ${
                                                    selectedAlternative?.id === alt.id 
                                                      ? 'text-green-700' 
                                                      : 'text-gray-600'
                                                  }`}>
                                                    {item.contenido}
                                                  </p>
                                                </>
                                              )}
                                            </div>
                                          ))}
                                          
                                          {/* Punto de destino */}
                                          <div className="relative">
                                            <div className={`absolute -left-[13px] w-6 h-6 rounded-full flex items-center justify-center ${
                                              selectedAlternative?.id === alt.id 
                                                ? 'bg-green-600 text-white' 
                                                : 'bg-red-500 text-white'
                                            }`}>
                                              <Building2 className="w-3 h-3" />
                                            </div>
                                            <p className="ml-4 text-xs font-semibold text-gray-800">
                                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                                                selectedAlternative?.id === alt.id 
                                                  ? 'bg-green-100 text-green-800' 
                                                  : 'bg-red-100 text-red-800'
                                              }`}>
                                                <span>{selectedDestino?.terminalNombre || 'Destino'}</span>
                                                <span className="font-normal opacity-70">({selectedDestino?.canton})</span>
                                              </span>
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                                
                                {/* Vía principal (fallback si no hay vias detalladas) - con terminales integrados */}
                                {(!alt.vias || alt.vias.length === 0) && alt.viaPrincipal && (
                                  <div className="mt-3 ml-11">
                                    <p className="text-xs font-medium text-gray-600 mb-2">Recorrido:</p>
                                    {(() => {
                                      const cantonesIntermedios = (selectedOrigen?.lat && selectedOrigen?.lon && selectedDestino?.lat && selectedDestino?.lon)
                                        ? getCantonesIntermedios(
                                            selectedOrigen.lat, 
                                            selectedOrigen.lon, 
                                            selectedDestino.lat, 
                                            selectedDestino.lon
                                          ).filter(c => 
                                            c.canton !== selectedOrigen?.canton && c.canton !== selectedDestino?.canton
                                          )
                                        : [];
                                      
                                      return (
                                        <div className={`relative pl-4 border-l-2 ${
                                          selectedAlternative?.id === alt.id 
                                            ? 'border-green-400' 
                                            : 'border-gray-300'
                                        }`}>
                                          {/* Origen */}
                                          <div className="relative pb-3">
                                            <div className={`absolute -left-[13px] w-6 h-6 rounded-full flex items-center justify-center ${
                                              selectedAlternative?.id === alt.id 
                                                ? 'bg-green-500 text-white' 
                                                : 'bg-blue-500 text-white'
                                            }`}>
                                              <Building2 className="w-3 h-3" />
                                            </div>
                                            <p className="ml-4 text-xs font-semibold">
                                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                                                selectedAlternative?.id === alt.id 
                                                  ? 'bg-green-100 text-green-800' 
                                                  : 'bg-blue-100 text-blue-800'
                                              }`}>
                                                {selectedOrigen?.terminalNombre} ({selectedOrigen?.canton})
                                              </span>
                                            </p>
                                          </div>
                                          
                                          {/* Cantones intermedios con terminal */}
                                          {cantonesIntermedios.map((canton, idx) => (
                                            <div key={idx} className="relative pb-3">
                                              <div className={`absolute -left-[11px] w-5 h-5 rounded-full flex items-center justify-center ${
                                                selectedAlternative?.id === alt.id 
                                                  ? 'bg-amber-500 text-white ring-2 ring-amber-300' 
                                                  : 'bg-amber-400 text-white ring-2 ring-amber-200'
                                              }`}>
                                                <Building2 className="w-3 h-3" />
                                              </div>
                                              <div className="ml-4">
                                                <span 
                                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                                                    selectedAlternative?.id === alt.id 
                                                      ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                  }`}
                                                  title={`Terminal: ${canton.terminalNombre} (${canton.tipologia})`}
                                                >
                                                  {canton.canton}
                                                  <span className="font-normal opacity-70 text-[10px]">({canton.provincia})</span>
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                          
                                          {/* Vía principal */}
                                          <div className="relative pb-3">
                                            <div className={`absolute -left-[9px] w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                                              selectedAlternative?.id === alt.id 
                                                ? 'bg-green-100 text-green-700 border-2 border-green-400' 
                                                : 'bg-gray-100 text-gray-600 border-2 border-gray-300'
                                            }`}>
                                              <Route className="w-2.5 h-2.5" />
                                            </div>
                                            <p className={`ml-4 text-xs ${
                                              selectedAlternative?.id === alt.id 
                                                ? 'text-green-700' 
                                                : 'text-gray-600'
                                            }`}>
                                              {alt.viaPrincipal}
                                            </p>
                                          </div>
                                          
                                          {/* Destino */}
                                          <div className="relative">
                                            <div className={`absolute -left-[13px] w-6 h-6 rounded-full flex items-center justify-center ${
                                              selectedAlternative?.id === alt.id 
                                                ? 'bg-green-600 text-white' 
                                                : 'bg-red-500 text-white'
                                            }`}>
                                              <Building2 className="w-3 h-3" />
                                            </div>
                                            <p className="ml-4 text-xs font-semibold">
                                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                                                selectedAlternative?.id === alt.id 
                                                  ? 'bg-green-100 text-green-800' 
                                                  : 'bg-red-100 text-red-800'
                                              }`}>
                                                {selectedDestino?.terminalNombre} ({selectedDestino?.canton})
                                              </span>
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                                
                                {/* Si no hay vías, mostrar recorrido simple con terminales integrados */}
                                {(!alt.vias || alt.vias.length === 0) && !alt.viaPrincipal && (
                                  <div className="mt-3 ml-11">
                                    <p className="text-xs font-medium text-gray-600 mb-2">Recorrido:</p>
                                    {(() => {
                                      const cantonesIntermedios = (selectedOrigen?.lat && selectedOrigen?.lon && selectedDestino?.lat && selectedDestino?.lon)
                                        ? getCantonesIntermedios(
                                            selectedOrigen.lat, 
                                            selectedOrigen.lon, 
                                            selectedDestino.lat, 
                                            selectedDestino.lon
                                          ).filter(c => 
                                            c.canton !== selectedOrigen?.canton && c.canton !== selectedDestino?.canton
                                          )
                                        : [];
                                      
                                      return (
                                        <div className={`relative pl-4 border-l-2 ${
                                          selectedAlternative?.id === alt.id 
                                            ? 'border-green-400' 
                                            : 'border-gray-300'
                                        }`}>
                                          {/* Origen */}
                                          <div className="relative pb-3">
                                            <div className={`absolute -left-[13px] w-6 h-6 rounded-full flex items-center justify-center ${
                                              selectedAlternative?.id === alt.id 
                                                ? 'bg-green-500 text-white' 
                                                : 'bg-blue-500 text-white'
                                            }`}>
                                              <Building2 className="w-3 h-3" />
                                            </div>
                                            <p className="ml-4 text-xs font-semibold">
                                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                                                selectedAlternative?.id === alt.id 
                                                  ? 'bg-green-100 text-green-800' 
                                                  : 'bg-blue-100 text-blue-800'
                                              }`}>
                                                {selectedOrigen?.terminalNombre} ({selectedOrigen?.canton})
                                              </span>
                                            </p>
                                          </div>
                                          
                                          {/* Cantones intermedios con terminal */}
                                          {cantonesIntermedios.map((canton, idx) => (
                                            <div key={idx} className="relative pb-3">
                                              <div className={`absolute -left-[11px] w-5 h-5 rounded-full flex items-center justify-center ${
                                                selectedAlternative?.id === alt.id 
                                                  ? 'bg-amber-500 text-white ring-2 ring-amber-300' 
                                                  : 'bg-amber-400 text-white ring-2 ring-amber-200'
                                              }`}>
                                                <Building2 className="w-3 h-3" />
                                              </div>
                                              <div className="ml-4">
                                                <span 
                                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                                                    selectedAlternative?.id === alt.id 
                                                      ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                  }`}
                                                  title={`Terminal: ${canton.terminalNombre} (${canton.tipologia})`}
                                                >
                                                  {canton.canton}
                                                  <span className="font-normal opacity-70 text-[10px]">({canton.provincia})</span>
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                          
                                          {/* Destino */}
                                          <div className="relative">
                                            <div className={`absolute -left-[13px] w-6 h-6 rounded-full flex items-center justify-center ${
                                              selectedAlternative?.id === alt.id 
                                                ? 'bg-green-600 text-white' 
                                                : 'bg-red-500 text-white'
                                            }`}>
                                              <Building2 className="w-3 h-3" />
                                            </div>
                                            <p className="ml-4 text-xs font-semibold">
                                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                                                selectedAlternative?.id === alt.id 
                                                  ? 'bg-green-100 text-green-800' 
                                                  : 'bg-red-100 text-red-800'
                                              }`}>
                                                {selectedDestino?.terminalNombre} ({selectedDestino?.canton})
                                              </span>
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Proveedor: {routeAlternatives[0]?.provider || 'N/A'}
                          </p>
                        </div>
                      )}
                      
                      {/* Campos de distancia y duración (editables basados en camino seleccionado) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Distancia (km) *
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            required
                            value={formData.distanciaKm || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, distanciaKm: e.target.value ? Number(e.target.value) : undefined })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            placeholder="Seleccione un camino arriba"
                          />
                          {selectedAlternative && (
                            <p className="text-xs text-blue-600 mt-1">
                              Base del camino: {selectedAlternative.distanciaKm} km 
                              {formData.distanciaKm && formData.distanciaKm !== selectedAlternative.distanciaKm && (
                                <span className="text-amber-600 ml-1">
                                  (ajustado: {formData.distanciaKm > selectedAlternative.distanciaKm ? '+' : ''}{(formData.distanciaKm - selectedAlternative.distanciaKm).toFixed(1)} km)
                                </span>
                              )}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duración Estimada (minutos) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={formData.duracionEstimadaMinutos || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                duracionEstimadaMinutos: e.target.value ? Number(e.target.value) : undefined,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            placeholder="Seleccione un camino arriba"
                          />
                          <p className="text-xs mt-1">
                            {formData.duracionEstimadaMinutos ? (
                              <span className="text-gray-600">
                                ≈ {Math.floor(formData.duracionEstimadaMinutos / 60)}h {formData.duracionEstimadaMinutos % 60}m
                              </span>
                            ) : (
                              <span className="text-gray-500">Se completa al seleccionar un camino</span>
                            )}
                            {selectedAlternative && formData.duracionEstimadaMinutos && formData.duracionEstimadaMinutos !== selectedAlternative.duracionMinutos && (
                              <span className="text-amber-600 ml-1">
                                (base: {Math.floor(selectedAlternative.duracionMinutos / 60)}h {selectedAlternative.duracionMinutos % 60}m)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      {/* Indicador de camino seleccionado */}
                      {selectedAlternative && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 text-green-800">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="font-medium text-sm">Camino seleccionado: {selectedAlternative.nombre}</span>
                          </div>
                          <p className="text-xs text-green-700 mt-1">
                            Puede ajustar la distancia y duración según sus necesidades. Los valores base son referenciales.
                          </p>
                        </div>
                      )}

                      {/* Botón de recálculo manual y selector de cantidad */}
                      {selectedOrigen && selectedDestino && (
                        <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          {/* Selector de cantidad de alternativas */}
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-600">Mostrar hasta:</label>
                            <select
                              value={maxAlternatives}
                              onChange={(e) => setMaxAlternatives(Number(e.target.value))}
                              className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            >
                              <option value={2}>2 caminos</option>
                              <option value={3}>3 caminos</option>
                              <option value={4}>4 caminos</option>
                              <option value={5}>5 caminos</option>
                            </select>
                            {alternativasInfo && (
                              <span className="text-xs text-gray-500">
                                ({alternativasInfo.encontradas} de {alternativasInfo.solicitadas} encontrados)
                              </span>
                            )}
                          </div>
                          
                          {/* Botón de búsqueda */}
                          <button
                            type="button"
                            onClick={handleCalculateRoute}
                            disabled={calculatingRoute}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                          >
                            {calculatingRoute ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Buscando rutas...
                              </>
                            ) : (
                              <>
                                <Route className="w-4 h-4" />
                                {routeAlternatives.length > 0 ? 'Buscar Nuevamente' : 'Buscar Alternativas'}
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Mensaje si no hay terminales seleccionados */}
                      {(!selectedOrigen || !selectedDestino) && (
                        <div className="mt-3 p-3 bg-gray-100 rounded-lg text-center text-sm text-gray-600">
                          <MapPin className="w-5 h-5 inline mr-2 text-gray-400" />
                          Seleccione los terminales de origen y destino para ver las alternativas de ruta disponibles.
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                      <textarea
                        rows={2}
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>

                    {/* Información ANT */}
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Información ANT</h3>

                      <div className="mb-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.aprobadaAnt}
                            onChange={(e) => setFormData({ ...formData, aprobadaAnt: e.target.checked })}
                            className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">Ruta aprobada por la ANT</span>
                        </label>
                      </div>

                      {formData.aprobadaAnt && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Número de Resolución ANT
                            </label>
                            <input
                              type="text"
                              value={formData.numeroResolucionAnt}
                              onChange={(e) => setFormData({ ...formData, numeroResolucionAnt: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                              placeholder="Ej: ANT-2023-001-RES"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha de Aprobación
                              </label>
                              <input
                                type="date"
                                value={formData.fechaAprobacionAnt}
                                onChange={(e) => setFormData({ ...formData, fechaAprobacionAnt: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Vigente Hasta</label>
                              <input
                                type="date"
                                value={formData.vigenciaHasta}
                                onChange={(e) => setFormData({ ...formData, vigenciaHasta: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Observaciones (Paradas autorizadas, restricciones, etc.)
                            </label>
                            <textarea
                              rows={3}
                              value={formData.observacionesAnt}
                              onChange={(e) => setFormData({ ...formData, observacionesAnt: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                              placeholder="Ej: Ruta aprobada con paradas autorizadas en: Machachi, Latacunga, Ambato..."
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={!!errorMismoCanton}
                        className={`px-4 py-2 rounded-lg ${
                          errorMismoCanton
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {editingRuta ? 'Actualizar' : 'Crear'} Ruta
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
            </>
          )}

          {/* ===================== TAB: TERMINALES ===================== */}
          {activeTab === 'terminales' && (
            <>
              {/* Header de Terminales */}
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    {/* Búsqueda */}
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar terminal..."
                        value={terminalSearch}
                        onChange={(e) => setTerminalSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                    {/* Filtro por tipología */}
                    <select
                      value={terminalFilter}
                      onChange={(e) => setTerminalFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="all">Todas las tipologías</option>
                      <option value="T1">T1 - Básico/Satélite</option>
                      <option value="T2">T2 - Pequeño</option>
                      <option value="T3">T3 - Mediano</option>
                      <option value="T4">T4 - Grande</option>
                      <option value="T5">T5 - Principal/Hub</option>
                    </select>
                    {/* Filtro por provincia */}
                    <select
                      value={terminalProvinciaFilter}
                      onChange={(e) => setTerminalProvinciaFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="all">Todas las provincias</option>
                      {Array.from(new Set(terminales.map(t => t.provincia))).sort().map(provincia => (
                        <option key={provincia} value={provincia}>{provincia}</option>
                      ))}
                    </select>
                    {/* Toggle de vista */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setTerminalViewMode('cards')}
                        className={`p-2 rounded ${terminalViewMode === 'cards' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        title="Vista de tarjetas"
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setTerminalViewMode('table')}
                        className={`p-2 rounded ${terminalViewMode === 'table' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        title="Vista de tabla"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenTerminalModal()}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    + Nuevo Terminal
                  </button>
                </div>
              </div>

              {/* Estadísticas de Terminales */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {['T1', 'T2', 'T3', 'T4', 'T5'].map((tipo) => {
                  const info = getTipologiaInfo(tipo);
                  const count = terminales.filter(t => t.tipologia === tipo).length;
                  return (
                    <div key={tipo} className={`${info.bgColor} rounded-lg p-4 text-center`}>
                      <div className={`text-2xl font-bold ${info.color}`}>{count}</div>
                      <div className={`text-sm ${info.color}`}>{tipo} - {info.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* Loading */}
              {loadingTerminales && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Cargando terminales...</p>
                </div>
              )}

              {/* Vista de Terminales */}
              {!loadingTerminales && filteredTerminales.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No se encontraron terminales</p>
                </div>
              )}

              {/* Vista de Tabla */}
              {!loadingTerminales && filteredTerminales.length > 0 && terminalViewMode === 'table' && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="overflow-x-auto relative">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 min-w-[240px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Terminal</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Ubicación</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Tipología</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Andenes</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Frec./Día</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[160px]">Coordenadas</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-[100px] bg-gray-50 z-10 min-w-[90px] shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">Estado</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10 min-w-[100px] shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTerminales.map((terminal) => {
                          const tipologiaInfo = getTipologiaInfo(terminal.tipologia);
                          return (
                            <tr key={terminal.id} className="hover:bg-gray-50 group">
                              <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {terminal.imagenUrl ? (
                                      <img src={terminal.imagenUrl} alt={terminal.nombre} className="w-full h-full object-cover" />
                                    ) : (
                                      <Building2 className="w-5 h-5 text-gray-400" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">{terminal.nombre}</div>
                                    <div className="text-xs text-gray-500">{terminal.descripcionTipologia}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-gray-900">{terminal.canton}</div>
                                <div className="text-xs text-gray-500">{terminal.provincia}</div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex px-2 py-1 text-xs font-bold rounded ${tipologiaInfo.bgColor} ${tipologiaInfo.color}`}>
                                  {terminal.tipologia}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-semibold text-gray-900">{terminal.andenes}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-gray-700">{terminal.maxFrecuenciasDiarias.toLocaleString()}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {terminal.latitud && terminal.longitud ? (
                                  <span className="text-xs text-green-600 font-medium">
                                    {terminal.latitud.toFixed(4)}, {terminal.longitud.toFixed(4)}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">Sin coordenadas</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center sticky right-[100px] bg-white group-hover:bg-gray-50 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${terminal.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {terminal.activo ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center sticky right-0 bg-white group-hover:bg-gray-50 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => setViewingTerminal(terminal)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Ver detalles"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenTerminalModal(terminal)}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="Editar"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Footer de tabla */}
                  <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Mostrando <span className="font-medium">{filteredTerminales.length}</span> de <span className="font-medium">{terminales.length}</span> terminales
                    </p>
                  </div>
                </div>
              )}

              {/* Vista de Cards */}
              {!loadingTerminales && filteredTerminales.length > 0 && terminalViewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTerminales.map((terminal) => {
                    const tipologiaInfo = getTipologiaInfo(terminal.tipologia);
                    return (
                      <div key={terminal.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
                        {/* Imagen del terminal */}
                        <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 relative">
                          {terminal.imagenUrl ? (
                            <img
                              src={terminal.imagenUrl}
                              alt={terminal.nombre}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Building2 className="w-16 h-16 text-gray-300" />
                            </div>
                          )}
                          {/* Badge de tipología */}
                          <span className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-bold ${tipologiaInfo.bgColor} ${tipologiaInfo.color}`}>
                            {terminal.tipologia}
                          </span>
                        </div>
                        
                        {/* Contenido */}
                        <div className="p-4">
                          <h3 className="font-bold text-lg text-gray-900 mb-1">{terminal.nombre}</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {terminal.canton}, {terminal.provincia}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                            <div className="bg-gray-50 rounded p-2">
                              <div className="text-gray-500 text-xs font-bold">Andenes</div>
                              <div className="font-semibold text-gray-900">{terminal.andenes}</div>
                            </div>
                            <div className="bg-gray-50 rounded p-2">
                              <div className="text-gray-500 text-xs font-bold">Frecuencias/día</div>
                              <div className="font-semibold text-gray-900">{terminal.maxFrecuenciasDiarias}</div>
                            </div>
                          </div>

                          {/* Acciones */}
                          <div className="flex gap-2 pt-3 border-t">
                            <button
                              onClick={() => setViewingTerminal(terminal)}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Eye className="w-4 h-4" /> Ver
                            </button>
                            <button
                              onClick={() => handleOpenTerminalModal(terminal)}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded transition-colors"
                            >
                              <Edit2 className="w-4 h-4" /> Editar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Modal Ver Terminal */}
              {viewingTerminal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header con imagen */}
                    <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-700 relative">
                      {viewingTerminal.imagenUrl ? (
                        <img
                          src={viewingTerminal.imagenUrl}
                          alt={viewingTerminal.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Building2 className="w-20 h-20 text-white/50" />
                        </div>
                      )}
                      <button
                        onClick={() => setViewingTerminal(null)}
                        className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-4 left-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getTipologiaInfo(viewingTerminal.tipologia).bgColor} ${getTipologiaInfo(viewingTerminal.tipologia).color}`}>
                          {viewingTerminal.tipologia} - {getTipologiaInfo(viewingTerminal.tipologia).label}
                        </span>
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{viewingTerminal.nombre}</h2>
                      <p className="text-gray-600 mb-6 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {viewingTerminal.canton}, {viewingTerminal.provincia}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-blue-700">{viewingTerminal.andenes}</div>
                          <div className="text-sm text-blue-600">Andenes</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-700">{viewingTerminal.frecuenciasPorAnden}</div>
                          <div className="text-sm text-green-600">Frec./Andén</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-purple-700">{viewingTerminal.maxFrecuenciasDiarias}</div>
                          <div className="text-sm text-purple-600">Max Frec./Día</div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-orange-700">
                            {viewingTerminal.activo ? 'Sí' : 'No'}
                          </div>
                          <div className="text-sm text-orange-600">Activo</div>
                        </div>
                      </div>

                      {/* Información adicional */}
                      <div className="space-y-3">
                        {viewingTerminal.direccion && (
                          <div className="flex items-start gap-3">
                            <span className="text-gray-500 text-sm w-24">Dirección:</span>
                            <span className="text-gray-900">{viewingTerminal.direccion}</span>
                          </div>
                        )}
                        {viewingTerminal.telefono && (
                          <div className="flex items-start gap-3">
                            <span className="text-gray-500 text-sm w-24">Teléfono:</span>
                            <span className="text-gray-900">{viewingTerminal.telefono}</span>
                          </div>
                        )}
                        {(viewingTerminal.horarioApertura || viewingTerminal.horarioCierre) && (
                          <div className="flex items-start gap-3">
                            <span className="text-gray-500 text-sm w-24">Horario:</span>
                            <span className="text-gray-900">
                              {viewingTerminal.horarioApertura || '05:00'} - {viewingTerminal.horarioCierre || '22:00'}
                            </span>
                          </div>
                        )}
                        {(viewingTerminal.latitud && viewingTerminal.longitud) && (
                          <div className="flex items-start gap-3">
                            <span className="text-gray-500 text-sm w-24">Coordenadas:</span>
                            <span className="text-gray-900">
                              {viewingTerminal.latitud?.toFixed(4)}, {viewingTerminal.longitud?.toFixed(4)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Botones */}
                      <div className="flex gap-3 mt-6 pt-4 border-t">
                        <button
                          onClick={() => {
                            setViewingTerminal(null);
                            handleOpenTerminalModal(viewingTerminal);
                          }}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Editar Terminal
                        </button>
                        <button
                          onClick={() => setViewingTerminal(null)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Crear/Editar Terminal */}
              {showTerminalModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">
                          {editingTerminal ? 'Editar Terminal' : 'Nuevo Terminal'}
                        </h2>
                        <button onClick={handleCloseTerminalModal} className="p-2 hover:bg-gray-100 rounded-lg">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <form onSubmit={handleTerminalSubmit} className="p-6 space-y-6">
                      {/* Imagen */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Imagen del Terminal</label>
                        <div className="flex items-center gap-4">
                          <div className="w-32 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300 relative">
                            {terminalFormData.imagenUrl ? (
                              <>
                                <img src={terminalFormData.imagenUrl} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setTerminalFormData(prev => ({ ...prev, imagenUrl: '' }))}
                                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                  title="Eliminar imagen"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <Building2 className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <input
                              type="file"
                              ref={fileInputRef}
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingImage}
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
                            >
                              <Upload className="w-4 h-4" />
                              {uploadingImage ? 'Subiendo...' : terminalFormData.imagenUrl ? 'Cambiar imagen' : 'Subir imagen'}
                            </button>
                            <p className="text-xs text-gray-500 mt-1">JPG, PNG o GIF. Max 5MB.</p>
                            {terminalFormData.imagenUrl && (
                              <p className="text-xs text-green-600 mt-1">✓ Imagen cargada</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Nombre */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Terminal *</label>
                        <input
                          type="text"
                          required
                          value={terminalFormData.nombre}
                          onChange={(e) => setTerminalFormData({ ...terminalFormData, nombre: e.target.value })}
                          placeholder="Ej: Terminal Terrestre Quitumbe"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                        />
                      </div>

                      {/* Ubicación */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Provincia *</label>
                          <select
                            required
                            value={terminalFormData.provincia}
                            onChange={(e) => setTerminalFormData({ ...terminalFormData, provincia: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                          >
                            <option value="">Seleccionar provincia</option>
                            {provinciasUnicas.map(prov => (
                              <option key={prov} value={prov}>{prov}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cantón *</label>
                          <input
                            type="text"
                            required
                            value={terminalFormData.canton}
                            onChange={(e) => setTerminalFormData({ ...terminalFormData, canton: e.target.value })}
                            placeholder="Ej: Quito"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                          />
                        </div>
                      </div>

                      {/* Tipología y Andenes */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tipología *</label>
                          <select
                            required
                            value={terminalFormData.tipologia}
                            onChange={(e) => setTerminalFormData({ ...terminalFormData, tipologia: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                          >
                            <option value="T1">T1 - Básico/Satélite (1-5 andenes)</option>
                            <option value="T2">T2 - Pequeño (6-15 andenes)</option>
                            <option value="T3">T3 - Mediano (16-25 andenes)</option>
                            <option value="T4">T4 - Grande (26-40 andenes)</option>
                            <option value="T5">T5 - Principal/Hub (40+ andenes)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Número de Andenes *</label>
                          <input
                            type="number"
                            required
                            min="1"
                            max="100"
                            value={terminalFormData.andenes}
                            onChange={(e) => setTerminalFormData({ ...terminalFormData, andenes: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                          />
                        </div>
                      </div>

                      {/* Dirección y Teléfono */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                          <input
                            type="text"
                            value={terminalFormData.direccion}
                            onChange={(e) => setTerminalFormData({ ...terminalFormData, direccion: e.target.value })}
                            placeholder="Ej: Av. Mariscal Sucre y Cóndor Ñan"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                          <input
                            type="text"
                            value={terminalFormData.telefono}
                            onChange={(e) => setTerminalFormData({ ...terminalFormData, telefono: e.target.value })}
                            placeholder="Ej: 02-398-8200"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                          />
                        </div>
                      </div>

                      {/* Horarios */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Hora Apertura</label>
                          <input
                            type="time"
                            value={terminalFormData.horarioApertura}
                            onChange={(e) => setTerminalFormData({ ...terminalFormData, horarioApertura: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Hora Cierre</label>
                          <input
                            type="time"
                            value={terminalFormData.horarioCierre}
                            onChange={(e) => setTerminalFormData({ ...terminalFormData, horarioCierre: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                          />
                        </div>
                      </div>

                      {/* Coordenadas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={terminalFormData.latitud || ''}
                            onChange={(e) => setTerminalFormData({ ...terminalFormData, latitud: parseFloat(e.target.value) || undefined })}
                            placeholder="Ej: -0.2392"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={terminalFormData.longitud || ''}
                            onChange={(e) => setTerminalFormData({ ...terminalFormData, longitud: parseFloat(e.target.value) || undefined })}
                            placeholder="Ej: -78.5219"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                          />
                        </div>
                      </div>

                      {/* Botones */}
                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                          type="button"
                          onClick={handleCloseTerminalModal}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          {editingTerminal ? 'Actualizar' : 'Crear'} Terminal
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
