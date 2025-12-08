'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useCooperativaConfig } from '@/app/context/CooperativaConfigContext';
import { getFullName } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { cooperativaApi, viajeChoferApi, ChoferStats, ViajeChofer, PasajeroViaje, getToken } from '@/lib/api';
import { 
  Bus, 
  Map, 
  Calendar, 
  Star, 
  TrendingUp, 
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  Activity,
  ArrowRight,
  Bell,
  Timer,
  PlayCircle,
  StopCircle,
  Navigation,
  MapPin,
  ChevronRight,
  Eye,
  EyeOff,
  UserCheck,
  Ticket,
  RefreshCw
} from 'lucide-react';

// Componente de mapa con Leaflet
const MapaRutaMini = ({ 
  coordenadaOrigen, 
  coordenadaDestino, 
  primaryColor 
}: { 
  coordenadaOrigen?: { latitud?: number; longitud?: number };
  coordenadaDestino?: { latitud?: number; longitud?: number };
  primaryColor: string;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!(window as any).L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    
    const L = (window as any).L;
    if (!L) return;

    if ((mapRef.current as any)._leaflet_id) {
      (mapRef.current as any)._leaflet_id = null;
      mapRef.current.innerHTML = '';
    }

    const latOrigen = coordenadaOrigen?.latitud || -2.1709;
    const lonOrigen = coordenadaOrigen?.longitud || -79.9224;
    const latDestino = coordenadaDestino?.latitud || -2.9001;
    const lonDestino = coordenadaDestino?.longitud || -79.0059;
    const centerLat = (latOrigen + latDestino) / 2;
    const centerLon = (lonOrigen + lonDestino) / 2;

    const map = L.map(mapRef.current).setView([centerLat, centerLon], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OSM'
    }).addTo(map);

    const createIcon = (color: string, letter: string) => {
      return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color:${color};width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);">${letter}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
    };

    L.marker([latOrigen, lonOrigen], { icon: createIcon('#22c55e', 'A') }).addTo(map);
    L.marker([latDestino, lonDestino], { icon: createIcon('#ef4444', 'B') }).addTo(map);
    L.polyline([[latOrigen, lonOrigen], [latDestino, lonDestino]], {
      color: primaryColor,
      weight: 3,
      opacity: 0.8,
      dashArray: '8, 8'
    }).addTo(map);

    const bounds = L.latLngBounds([[latOrigen, lonOrigen], [latDestino, lonDestino]]);
    map.fitBounds(bounds, { padding: [30, 30] });

    return () => { map.remove(); };
  }, [mapLoaded, coordenadaOrigen, coordenadaDestino, primaryColor]);

  return (
    <div ref={mapRef} className="w-full h-40 rounded-lg border border-gray-200" style={{ minHeight: '160px' }} />
  );
};

// Componente de mapa de asientos del bus (soporta 1 o 2 pisos)
const MapaAsientos = ({ 
  pasajeros, 
  capacidadTotal,
  capacidadPiso1,
  capacidadPiso2,
  verificados,
  onVerificar,
  primaryColor 
}: { 
  pasajeros: PasajeroViaje[];
  capacidadTotal: number;
  capacidadPiso1?: number;
  capacidadPiso2?: number;
  verificados: Set<number>;
  onVerificar: (reservaId: number) => void;
  primaryColor: string;
}) => {
  const [pisoActivo, setPisoActivo] = useState(1);
  
  // Determinar si es bus de dos pisos
  const tieneDospisos = (capacidadPiso2 ?? 0) > 0;
  
  // Calcular capacidades por piso
  const capPiso1 = capacidadPiso1 || (tieneDospisos ? Math.ceil(capacidadTotal / 2) : capacidadTotal);
  const capPiso2 = capacidadPiso2 || (tieneDospisos ? Math.floor(capacidadTotal / 2) : 0);
  
  const asientosOcupados: Record<number, PasajeroViaje> = {};
  pasajeros.forEach(p => {
    p.asientos.forEach(asiento => {
      const numAsiento = parseInt(asiento, 10);
      if (!isNaN(numAsiento)) {
        asientosOcupados[numAsiento] = p;
      }
    });
  });

  // Generar array de asientos para un piso específico
  const generarAsientosPiso = (piso: number) => {
    const capacidad = piso === 1 ? capPiso1 : capPiso2;
    const inicio = piso === 1 ? 1 : capPiso1 + 1;
    const filas = Math.ceil(capacidad / 4);
    const asientosArray = [];
    
    for (let fila = 0; fila < filas; fila++) {
      const asientosFila = [];
      for (let col = 0; col < 4; col++) {
        const numAsiento = inicio + (fila * 4) + col;
        if (numAsiento <= inicio + capacidad - 1) {
          asientosFila.push(numAsiento);
        }
      }
      if (asientosFila.length > 0) {
        asientosArray.push(asientosFila);
      }
    }
    return asientosArray;
  };

  const asientosPisoActivo = generarAsientosPiso(pisoActivo);

  // Contar ocupados por piso
  const contarOcupadosPiso = (piso: number) => {
    const inicio = piso === 1 ? 1 : capPiso1 + 1;
    const fin = piso === 1 ? capPiso1 : capPiso1 + capPiso2;
    let count = 0;
    for (let i = inicio; i <= fin; i++) {
      if (asientosOcupados[i]) count++;
    }
    return count;
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      {/* Selector de pisos si es bus de dos pisos */}
      {tieneDospisos && (
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => setPisoActivo(1)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              pisoActivo === 1
                ? 'text-white shadow-md'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
            style={pisoActivo === 1 ? { backgroundColor: primaryColor } : {}}
          >
            <span>🚌 Piso 1</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              pisoActivo === 1 ? 'bg-white/20' : 'bg-gray-300'
            }`}>
              {contarOcupadosPiso(1)}/{capPiso1}
            </span>
          </button>
          <button
            onClick={() => setPisoActivo(2)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              pisoActivo === 2
                ? 'text-white shadow-md'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
            style={pisoActivo === 2 ? { backgroundColor: primaryColor } : {}}
          >
            <span>🚌 Piso 2</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              pisoActivo === 2 ? 'bg-white/20' : 'bg-gray-300'
            }`}>
              {contarOcupadosPiso(2)}/{capPiso2}
            </span>
          </button>
        </div>
      )}

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-gray-200 border border-gray-300"></div>
          <span className="text-gray-600">Disponible</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded border-2" style={{ backgroundColor: `${primaryColor}30`, borderColor: primaryColor }}></div>
          <span className="text-gray-600">Vendido</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span className="text-gray-600">Verificado</span>
        </div>
      </div>

      {/* Bus layout */}
      <div className="relative">
        {/* Frente del bus */}
        <div className="text-center mb-2">
          <div className="inline-block bg-gray-300 rounded-t-xl px-8 py-1 text-xs text-gray-600 font-medium">
            🚌 {tieneDospisos ? `Piso ${pisoActivo} - ` : ''}Frente
          </div>
        </div>

        {/* Asientos */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="space-y-1">
            {asientosPisoActivo.map((fila, filaIdx) => (
              <div key={filaIdx} className="flex justify-center gap-1">
                {fila.map((numAsiento, colIdx) => {
                  const pasajero = asientosOcupados[numAsiento];
                  const estaVerificado = pasajero && verificados.has(pasajero.reservaId);
                  const estaOcupado = !!pasajero;
                  
                  return (
                    <div key={numAsiento} className="flex items-center">
                      {colIdx === 2 && <div className="w-4"></div>}
                      <button
                        onClick={() => pasajero && onVerificar(pasajero.reservaId)}
                        disabled={!estaOcupado}
                        className={`w-8 h-8 rounded text-xs font-medium transition-all ${
                          estaVerificado
                            ? 'bg-green-500 text-white shadow-sm'
                            : estaOcupado
                            ? 'border-2 text-gray-700 hover:scale-105'
                            : 'bg-gray-200 text-gray-400 border border-gray-300 cursor-default'
                        }`}
                        style={estaOcupado && !estaVerificado ? { 
                          backgroundColor: `${primaryColor}30`, 
                          borderColor: primaryColor 
                        } : {}}
                        title={pasajero ? `${pasajero.clienteEmail} - ${estaVerificado ? 'Verificado' : 'Click para verificar'}` : 'Disponible'}
                      >
                        {numAsiento}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Indicador de piso actual para buses de dos pisos */}
        {tieneDospisos && (
          <div className="text-center mt-2">
            <span className="text-xs text-gray-500">
              {pisoActivo === 1 ? '⬆️ Subir al Piso 2' : '⬇️ Bajar al Piso 1'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Tipo para notificaciones de compra de boleto
interface NotificacionCompra {
  id: string;
  clienteEmail: string;
  asientos: string[];
  reservaId: number;
  timestamp: Date;
  leida: boolean;
}

export default function ChoferDashboardPage() {
  const { user } = useAuth();
  const { cooperativaConfig } = useCooperativaConfig();
  const router = useRouter();
  const [stats, setStats] = useState<ChoferStats | null>(null);
  const [viaje, setViaje] = useState<ViajeChofer | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingViaje, setLoadingViaje] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [pasajeroVerificados, setPasajeroVerificados] = useState<Set<number>>(new Set());
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [mostrarAsientos, setMostrarAsientos] = useState(true);
  const [observaciones, setObservaciones] = useState('');
  const [mostrarModalFinalizar, setMostrarModalFinalizar] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
  const [notificacionesCompra, setNotificacionesCompra] = useState<NotificacionCompra[]>([]);
  const [pasajerosAnteriores, setPasajerosAnteriores] = useState<Set<number>>(new Set());

  // Colores dinámicos de la cooperativa
  const primaryColor = cooperativaConfig?.colorPrimario || '#ea580c';
  const secondaryColor = cooperativaConfig?.colorSecundario || '#c2410c';
  const coopName = cooperativaConfig?.nombre || user?.cooperativaNombre || 'Cooperativa';

  // Estilos dinámicos
  const headerStyle = {
    background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
  };

  // Función para detectar nuevos pasajeros y crear notificaciones
  const detectarNuevosPasajeros = (nuevoPasajeros: PasajeroViaje[]) => {
    const nuevosIds = new Set(nuevoPasajeros.map(p => p.reservaId));
    const nuevasNotificaciones: NotificacionCompra[] = [];
    
    nuevoPasajeros.forEach(pasajero => {
      if (!pasajerosAnteriores.has(pasajero.reservaId)) {
        // Es un pasajero nuevo, crear notificación
        nuevasNotificaciones.push({
          id: `compra-${pasajero.reservaId}-${Date.now()}`,
          clienteEmail: pasajero.clienteEmail,
          asientos: pasajero.asientos,
          reservaId: pasajero.reservaId,
          timestamp: new Date(),
          leida: false
        });
      }
    });
    
    if (nuevasNotificaciones.length > 0) {
      // Agregar las nuevas notificaciones al inicio
      setNotificacionesCompra(prev => [...nuevasNotificaciones, ...prev].slice(0, 20)); // Máximo 20 notificaciones
      
      // Reproducir sonido de notificación (opcional)
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {}); // Ignorar error si no hay audio
      } catch {}
    }
    
    // Actualizar el set de pasajeros anteriores
    setPasajerosAnteriores(nuevosIds);
  };

  const loadViaje = async () => {
    if (!user?.userId) return;

    try {
      setLoadingViaje(true);
      const token = getToken();
      if (!token) return;

      const hoy = new Date();
      const fechaHoy = hoy.toISOString().split('T')[0];
      
      // Primero buscar viaje de hoy
      let viajeData = await viajeChoferApi.getViajeDelDia(user.userId, fechaHoy, token);
      
      // Si no hay viaje disponible hoy (el backend ya filtra por hora),
      // buscar el viaje de mañana
      if (!viajeData) {
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);
        const fechaManana = manana.toISOString().split('T')[0];
        viajeData = await viajeChoferApi.getViajeDelDia(user.userId, fechaManana, token);
      }
      
      // Detectar nuevos pasajeros y crear notificaciones
      if (viajeData && viajeData.pasajeros) {
        detectarNuevosPasajeros(viajeData.pasajeros);
      }
      
      setViaje(viajeData);
      setUltimaActualizacion(new Date());
    } catch (err) {
      console.error('Error al cargar viaje:', err);
      setViaje(null);
    } finally {
      setLoadingViaje(false);
    }
  };

  // Marcar notificación como leída
  const marcarNotificacionLeida = (id: string) => {
    setNotificacionesCompra(prev => 
      prev.map(n => n.id === id ? { ...n, leida: true } : n)
    );
  };

  // Marcar todas como leídas
  const marcarTodasLeidas = () => {
    setNotificacionesCompra(prev => prev.map(n => ({ ...n, leida: true })));
  };

  // Contar notificaciones no leídas
  const notificacionesSinLeer = notificacionesCompra.filter(n => !n.leida).length;

  // Auto-refresh cada 30 segundos cuando hay viaje activo
  useEffect(() => {
    if (!viaje || viaje.estado === 'COMPLETADO' || viaje.estado === 'CANCELADO') return;
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh de viaje del chofer...');
      loadViaje();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [viaje?.id, viaje?.estado, user?.userId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.userId) {
        setLoading(false);
        return;
      }

      try {
        const token = getToken();
        if (!token) {
          setError('No se encontró token de autenticación');
          setLoading(false);
          return;
        }

        // Cargar estadísticas y viaje en paralelo
        const [statsData] = await Promise.all([
          cooperativaApi.getChoferStats(user.userId, token),
        ]);
        setStats(statsData);
        
        // Cargar viaje del día
        await loadViaje();
        
        setError(null);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('No se pudieron cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Función para formatear tiempo transcurrido
  const formatearTiempoTranscurrido = (fecha: Date): string => {
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();
    const segundos = Math.floor(diferencia / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    
    if (segundos < 60) return 'Ahora mismo';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    return fecha.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const handleIniciarViaje = async () => {
    if (!viaje) return;

    const confirmacion = window.confirm(
      `¿Estás seguro de iniciar el viaje?\n\n` +
      `Ruta: ${viaje.origen} → ${viaje.destino}\n` +
      `Bus: ${viaje.busPlaca}\n\n` +
      `Esta acción notificará a la cooperativa.`
    );

    if (!confirmacion) return;

    try {
      setProcesando(true);
      const token = getToken();
      if (!token) return;
      if (!viaje.id) {
        setError('No se puede iniciar un viaje sin reservas');
        setProcesando(false);
        return;
      }

      const resultado = await viajeChoferApi.iniciar(viaje.id, token);
      alert(`✅ ${resultado.mensaje}\n\nLa cooperativa ha sido notificada.`);
      await loadViaje();
    } catch (err: any) {
      const errorMsg = err.message || 'Error al iniciar el viaje';
      
      // Manejar error de hora temprana
      if (errorMsg.includes('No puede iniciar el viaje aún')) {
        setError(`⏰ ${errorMsg}`);
      } else {
        setError(errorMsg);
      }
    } finally {
      setProcesando(false);
    }
  };

  const handleFinalizarViaje = async () => {
    if (!viaje || !viaje.id) return;

    try {
      setProcesando(true);
      const token = getToken();
      if (!token) return;

      const resultado = await viajeChoferApi.finalizar(viaje.id, observaciones, token);
      alert(`✅ ${resultado.mensaje}\n\nLa cooperativa ha sido notificada.`);
      setMostrarModalFinalizar(false);
      setObservaciones('');
      await loadViaje();
    } catch (err: any) {
      setError(err.message || 'Error al finalizar el viaje');
    } finally {
      setProcesando(false);
    }
  };

  const toggleVerificarPasajero = (reservaId: number) => {
    const newSet = new Set(pasajeroVerificados);
    if (newSet.has(reservaId)) {
      newSet.delete(reservaId);
    } else {
      newSet.add(reservaId);
    }
    setPasajeroVerificados(newSet);
  };

  // Verificar si el viaje es de hoy o de mañana
  const esViajeDeHoy = (fechaViaje: string): boolean => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fecha = new Date(fechaViaje + 'T00:00:00');
    return fecha.getTime() === hoy.getTime();
  };

  // Verificar si se puede iniciar el viaje
  const puedeIniciarViaje = (viajeActual: ViajeChofer): { puede: boolean; razon?: string } => {
    if (!viajeActual) return { puede: false };
    
    // Verificar si es de hoy
    if (!esViajeDeHoy(viajeActual.fecha)) {
      return { 
        puede: false, 
        razon: 'Este viaje está programado para mañana. Solo podrá iniciarlo el día correspondiente.' 
      };
    }
    
    return { puede: true };
  };

  const getEstadoInfo = (estado: string) => {
    switch (estado?.toUpperCase()) {
      case 'PROGRAMADO': return { color: 'bg-blue-100 text-blue-800', icon: <Clock className="w-4 h-4" />, label: '📅 Programado' };
      case 'EN_RUTA': return { color: 'bg-green-100 text-green-800', icon: <Navigation className="w-4 h-4 animate-pulse" />, label: '🚌 En Ruta' };
      case 'COMPLETADO': return { color: 'bg-gray-100 text-gray-800', icon: <CheckCircle className="w-4 h-4" />, label: '✅ Completado' };
      default: return { color: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="w-4 h-4" />, label: estado };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto mb-4"
            style={{ borderColor: primaryColor }}
          ></div>
          <p className="text-gray-600 font-medium">Cargando datos del chofer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="shadow-lg" style={headerStyle}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Panel del Chofer
              </h1>
              <p className="text-white text-opacity-80 mt-2 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Bienvenido, {user ? getFullName(user) : 'Chofer'}
              </p>
            </div>
            {user?.cooperativaNombre && (
              <div className="bg-white rounded-lg px-6 py-3 shadow-md">
                <p className="text-gray-500 text-xs uppercase tracking-wide">Cooperativa</p>
                <p className="text-gray-800 font-bold text-lg">
                  {user.cooperativaNombre}
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Banner de Viaje en Curso - Visible inmediatamente al iniciar sesión */}
        {viaje && viaje.estado === 'EN_RUTA' && (
          <div className="mb-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg p-5 border-2 border-green-400">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <Navigation className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    🚌 Viaje en Curso
                  </h3>
                  <p className="text-green-100 mt-1">
                    <strong>{viaje.origen}</strong> → <strong>{viaje.destino}</strong>
                    {viaje.horaSalidaReal && (
                      <span className="ml-2 text-sm">
                        (Iniciado a las {viaje.horaSalidaReal})
                      </span>
                    )}
                  </p>
                  <p className="text-green-200 text-sm mt-1">
                    Tienes {viaje.totalPasajeros || 0} pasajero(s) a bordo. Recuerda finalizar el viaje al llegar.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMostrarModalFinalizar(true)}
                disabled={procesando}
                className="bg-white text-green-700 hover:bg-green-50 px-6 py-3 rounded-lg font-bold shadow-md flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <StopCircle className="w-5 h-5" />
                🏁 Finalizar Viaje
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Principal - Viaje del Día y Bus */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card del Viaje del Día con Bus Asignado */}
            {viaje ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Banner de viaje de mañana */}
                {!esViajeDeHoy(viaje.fecha) && (
                  <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-600" />
                    <span className="text-amber-800 font-medium">
                      📅 Este es tu próximo viaje programado para mañana
                    </span>
                  </div>
                )}
                {/* Header del viaje */}
                <div 
                  className="px-6 py-4"
                  style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm">Viaje #{viaje.id || 'Nuevo'} • {viaje.cooperativaNombre}</p>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-1">
                        {viaje.origen} <ChevronRight className="w-5 h-5" /> {viaje.destino}
                      </h2>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${getEstadoInfo(viaje.estado).color}`}>
                      {getEstadoInfo(viaje.estado).icon}
                      <span className="font-medium text-sm">{getEstadoInfo(viaje.estado).label}</span>
                    </div>
                  </div>
                </div>

                {/* Información del Bus y Viaje */}
                <div className="p-6">
                  {/* Grid de información principal */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Fecha
                      </div>
                      <p className="font-semibold text-gray-900">
                        {esViajeDeHoy(viaje.fecha) ? (
                          <span className="text-green-600">Hoy</span>
                        ) : (
                          <span className="text-amber-600">Mañana</span>
                        )}
                        {' - '}
                        {new Date(viaje.fecha + 'T00:00:00').toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <Clock className="w-3.5 h-3.5" />
                        Hora Salida
                      </div>
                      <p className="font-semibold text-gray-900">{viaje.horaSalidaProgramada}</p>
                      {viaje.horaSalidaReal && (
                        <p className="text-xs text-green-600">Real: {viaje.horaSalidaReal}</p>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <Bus className="w-3.5 h-3.5" />
                        Bus Asignado
                      </div>
                      <p className="font-semibold text-gray-900">{viaje.busPlaca}</p>
                      <p className="text-xs text-gray-500">{viaje.busMarca}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <Users className="w-3.5 h-3.5" />
                        Ocupación
                      </div>
                      <p className="font-semibold text-gray-900">{viaje.totalPasajeros || 0} / {viaje.capacidadTotal || 0}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="h-1.5 rounded-full transition-all"
                            style={{ 
                              width: `${viaje.capacidadTotal ? ((viaje.totalPasajeros || 0) / viaje.capacidadTotal) * 100 : 0}%`,
                              backgroundColor: primaryColor
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{viaje.capacidadTotal ? Math.round(((viaje.totalPasajeros || 0) / viaje.capacidadTotal) * 100) : 0}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Botones de control */}
                  <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b border-gray-200">
                    {viaje.estado === 'PROGRAMADO' && (() => {
                      const { puede, razon } = puedeIniciarViaje(viaje);
                      return (
                        <div className="flex-1 min-w-40 flex flex-col">
                          <button
                            onClick={handleIniciarViaje}
                            disabled={procesando || !puede}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors font-semibold shadow-md ${
                              puede 
                                ? 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                                : 'bg-gray-400 text-white cursor-not-allowed'
                            }`}
                            title={razon}
                          >
                            <PlayCircle className="w-5 h-5" />
                            {procesando ? 'Iniciando...' : puede ? '🚀 Iniciar Viaje' : '🔒 Viaje de Mañana'}
                          </button>
                          {!puede && razon && (
                            <p className="text-xs text-amber-600 mt-1 text-center">
                              ⏰ {razon}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                    {viaje.estado === 'EN_RUTA' && (
                      <button
                        onClick={() => setMostrarModalFinalizar(true)}
                        disabled={procesando}
                        className="flex-1 min-w-40 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 shadow-md"
                      >
                        <StopCircle className="w-5 h-5" />
                        🏁 Finalizar Viaje
                      </button>
                    )}
                    {viaje.estado === 'COMPLETADO' && (
                      <div className="flex-1 min-w-40 flex items-center justify-center gap-2 bg-gray-200 text-gray-600 px-4 py-3 rounded-lg font-semibold">
                        <CheckCircle className="w-5 h-5" />
                        Viaje Completado
                      </div>
                    )}
                    <button
                      onClick={() => setMostrarMapa(!mostrarMapa)}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-colors"
                      style={{ 
                        borderColor: primaryColor, 
                        color: mostrarMapa ? 'white' : primaryColor,
                        backgroundColor: mostrarMapa ? primaryColor : 'transparent'
                      }}
                    >
                      <MapPin className="w-4 h-4" />
                      {mostrarMapa ? 'Ocultar Mapa' : 'Ver Mapa'}
                    </button>
                    <button
                      onClick={() => setMostrarAsientos(!mostrarAsientos)}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      {mostrarAsientos ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {mostrarAsientos ? 'Ocultar Asientos' : 'Ver Asientos'}
                    </button>
                    <button
                      onClick={loadViaje}
                      disabled={loadingViaje}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 text-white font-medium hover:opacity-90 transition-colors"
                      style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                      title={ultimaActualizacion ? `Última actualización: ${ultimaActualizacion.toLocaleTimeString()}` : 'Actualizar'}
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingViaje ? 'animate-spin' : ''}`} />
                      Actualizar
                    </button>
                  </div>

                  {/* Indicador de última actualización */}
                  {ultimaActualizacion && (
                    <div className="mb-4 flex items-center justify-end gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>Última actualización: {ultimaActualizacion.toLocaleTimeString()}</span>
                      <span className="text-gray-400">(Auto-refresh cada 30s)</span>
                    </div>
                  )}

                  {/* Mapa de la ruta */}
                  {mostrarMapa && (
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4" style={{ color: primaryColor }} />
                        <h3 className="font-semibold text-gray-800">Ruta del Viaje</h3>
                      </div>
                      <MapaRutaMini 
                        coordenadaOrigen={viaje.coordenadaOrigen}
                        coordenadaDestino={viaje.coordenadaDestino}
                        primaryColor={primaryColor}
                      />
                      <div className="flex gap-4 mt-2 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          {viaje.coordenadaOrigen?.nombreTerminal || viaje.origen}
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          {viaje.coordenadaDestino?.nombreTerminal || viaje.destino}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Mapa de asientos del bus */}
                  {mostrarAsientos && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4" style={{ color: primaryColor }} />
                          <h3 className="font-semibold text-gray-800">Mapa de Asientos</h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <UserCheck className="w-4 h-4 text-green-600" />
                          <span className="text-gray-600">Verificados: <strong>{pasajeroVerificados.size}</strong>/{viaje.totalPasajeros || 0}</span>
                        </div>
                      </div>
                      <MapaAsientos 
                        pasajeros={viaje.pasajeros || []}
                        capacidadTotal={viaje.capacidadTotal || 0}
                        capacidadPiso1={viaje.capacidadPiso1}
                        capacidadPiso2={viaje.capacidadPiso2}
                        verificados={pasajeroVerificados}
                        onVerificar={toggleVerificarPasajero}
                        primaryColor={primaryColor}
                      />
                    </div>
                  )}

                  {/* Lista de pasajeros compacta */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Users className="w-4 h-4" style={{ color: primaryColor }} />
                        Pasajeros ({viaje.totalPasajeros})
                      </h3>
                    </div>
                    {viaje.pasajeros.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">No hay pasajeros registrados</p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {viaje.pasajeros.map((pasajero, index) => (
                          <div
                            key={pasajero.reservaId}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                              pasajeroVerificados.has(pasajero.reservaId)
                                ? 'bg-green-50 border-green-300'
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                style={{ backgroundColor: pasajeroVerificados.has(pasajero.reservaId) ? '#22c55e' : primaryColor }}
                              >
                                {pasajeroVerificados.has(pasajero.reservaId) ? '✓' : index + 1}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">{pasajero.clienteEmail}</p>
                                <p className="text-xs text-gray-500">
                                  Asientos: {pasajero.asientos.join(', ')} • 
                                  <span className={pasajero.estado === 'PAGADO' ? 'text-green-600' : 'text-yellow-600'}>
                                    {' '}{pasajero.estado === 'PAGADO' ? '✓ Pagado' : '⏳ Pendiente'}
                                  </span>
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => toggleVerificarPasajero(pasajero.reservaId)}
                              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                                pasajeroVerificados.has(pasajero.reservaId)
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {pasajeroVerificados.has(pasajero.reservaId) ? 'Verificado' : 'Verificar'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay viaje asignado para hoy
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Actualmente no tienes un viaje programado. Consulta con tu cooperativa.
                </p>
                <button
                  onClick={loadViaje}
                  disabled={loadingViaje}
                  className="px-4 py-2 rounded-lg text-white font-medium transition-colors"
                  style={{ backgroundColor: primaryColor }}
                >
                  {loadingViaje ? 'Actualizando...' : 'Actualizar'}
                </button>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Viajes del Mes */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Este mes
                  </span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Viajes Realizados</h3>
                <p className="text-3xl font-bold text-gray-900">{stats?.viajesDelMes ?? 0}</p>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +12% vs mes anterior
                </p>
              </div>

              {/* Pasajeros Transportados */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                    Total
                  </span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Pasajeros</h3>
                <p className="text-3xl font-bold text-gray-900">{stats?.pasajerosTransportados ?? 0}</p>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Promedio: {stats?.pasajerosTransportados && stats?.viajesDelMes 
                    ? Math.round(stats.pasajerosTransportados / stats.viajesDelMes) 
                    : 0}/viaje
                </p>
              </div>

              {/* Calificación */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-600 fill-yellow-600" />
                  </div>
                  <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                    Promedio
                  </span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Calificación</h3>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.calificacion ? stats.calificacion.toFixed(1) : '0.0'}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.floor(stats?.calificacion ?? 0)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => router.push('/dashboard/Cooperativa/Chofer/mi-viaje')}
                className="bg-white p-6 rounded-xl shadow-md border-2 border-transparent transition-all group"
                style={{ '--hover-border-color': primaryColor } as React.CSSProperties}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = primaryColor}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                      style={{ background: `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor})` }}
                    >
                      <Bus className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900 text-sm">Mi Viaje del Día</h3>
                      <p className="text-xs text-gray-600">Ver detalles actuales</p>
                    </div>
                  </div>
                  <ArrowRight 
                    className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-all" 
                    style={{ color: undefined }}
                  />
                </div>
              </button>

              <button
                onClick={() => router.push('/dashboard/Cooperativa/Chofer/mis-rutas')}
                className="bg-white p-6 rounded-xl shadow-md border-2 border-transparent transition-all group"
                onMouseEnter={(e) => e.currentTarget.style.borderColor = primaryColor}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Map className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900 text-sm">Mis Rutas</h3>
                      <p className="text-xs text-gray-600">Ver todas las rutas</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </button>

              <button
                onClick={() => router.push('/dashboard/Cooperativa/Chofer/historial')}
                className="bg-white p-6 rounded-xl shadow-md border-2 border-transparent transition-all group"
                onMouseEnter={(e) => e.currentTarget.style.borderColor = primaryColor}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-linear-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900 text-sm">Historial de Viajes</h3>
                      <p className="text-xs text-gray-600">Revisar viajes pasados</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                </div>
              </button>

              <button
                onClick={() => router.push('/dashboard/Cooperativa/Chofer/calificaciones')}
                className="bg-white p-6 rounded-xl shadow-md border-2 border-transparent transition-all group"
                onMouseEnter={(e) => e.currentTarget.style.borderColor = primaryColor}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-linear-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900 text-sm">Mis Calificaciones</h3>
                      <p className="text-xs text-gray-600">Ver opiniones</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-yellow-600 group-hover:translate-x-1 transition-all" />
                </div>
              </button>

              <button
                onClick={() => router.push('/dashboard/Cooperativa/Chofer/mis-horas')}
                className="bg-white p-6 rounded-xl shadow-md border-2 border-transparent transition-all group sm:col-span-2"
                onMouseEnter={(e) => e.currentTarget.style.borderColor = primaryColor}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Timer className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900 text-sm">Mis Horas de Trabajo</h3>
                      <p className="text-xs text-gray-600">Control de jornada laboral</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            </div>
          </div>

          {/* Columna Lateral - Notificaciones */}
          <div className="lg:col-span-1 space-y-6">
            {/* Notificaciones */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="w-5 h-5" style={{ color: primaryColor }} />
                  Notificaciones
                  {notificacionesSinLeer > 0 && (
                    <span 
                      className="px-2 py-0.5 text-xs font-bold text-white rounded-full animate-pulse"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {notificacionesSinLeer}
                    </span>
                  )}
                </h2>
                {notificacionesSinLeer > 0 && (
                  <button
                    onClick={marcarTodasLeidas}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Marcar todas leídas
                  </button>
                )}
              </div>
              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {/* Notificaciones de compra de boletos */}
                {notificacionesCompra.map((notif) => (
                  <div 
                    key={notif.id}
                    onClick={() => marcarNotificacionLeida(notif.id)}
                    className={`rounded-lg p-4 border cursor-pointer transition-all hover:shadow-md ${
                      notif.leida ? 'bg-gray-50 border-gray-200' : 'bg-green-50 border-green-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`shrink-0 ${notif.leida ? '' : 'animate-pulse'}`}>
                        <Ticket className={`w-5 h-5 ${notif.leida ? 'text-gray-400' : 'text-green-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`text-sm font-semibold ${notif.leida ? 'text-gray-700' : 'text-green-800'}`}>
                            🎫 Nueva compra de boleto
                          </p>
                          {!notif.leida && (
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Cliente:</span>{' '}
                            <span className="text-gray-900">{notif.clienteEmail}</span>
                          </p>
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Asiento(s):</span>{' '}
                            <span 
                              className="font-bold px-1.5 py-0.5 rounded text-white"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {notif.asientos.join(', ')}
                            </span>
                          </p>
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Reserva #:</span>{' '}
                            <span className="text-gray-900">{notif.reservaId}</span>
                          </p>
                        </div>
                        <span className={`text-xs font-medium mt-2 block ${notif.leida ? 'text-gray-400' : 'text-green-600'}`}>
                          {formatearTiempoTranscurrido(notif.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Mensaje cuando no hay notificaciones de compra */}
                {notificacionesCompra.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <Ticket className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No hay compras recientes</p>
                    <p className="text-xs mt-1">Las notificaciones aparecerán aquí cuando los pasajeros compren boletos</p>
                  </div>
                )}

                {/* Separador si hay notificaciones de compra */}
                {notificacionesCompra.length > 0 && (
                  <div className="border-t border-gray-200 my-4 pt-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Otras notificaciones</p>
                  </div>
                )}

                {/* Notificación de viaje programado */}
                {viaje && (
                  <div 
                    className="rounded-lg p-4 border"
                    style={{ 
                      backgroundColor: `${primaryColor}10`, 
                      borderColor: `${primaryColor}40` 
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-2 h-2 rounded-full mt-2 shrink-0"
                        style={{ backgroundColor: primaryColor }}
                      ></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Viaje programado para hoy
                        </p>
                        <p className="text-xs text-gray-600 mb-2">
                          Tu viaje a {viaje.destino} está programado para las {viaje.horaSalidaProgramada}
                        </p>
                        <span 
                          className="text-xs font-medium"
                          style={{ color: primaryColor }}
                        >Hoy</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notificación de pasajeros actuales */}
                {viaje && viaje.totalPasajeros && viaje.totalPasajeros > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Pasajeros confirmados
                        </p>
                        <p className="text-xs text-gray-600 mb-2">
                          Tienes {viaje.totalPasajeros} pasajero(s) para este viaje
                        </p>
                        <span className="text-xs text-blue-600 font-medium">Actualizado</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tips Rápidos */}
            <div 
              className="rounded-xl p-6 border"
              style={{ 
                background: `linear-gradient(to bottom right, ${primaryColor}10, ${primaryColor}20)`,
                borderColor: `${primaryColor}40`
              }}
            >
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5" style={{ color: primaryColor }} />
                Consejo del día
              </h3>
              <p className="text-sm text-gray-700">
                Mantén una velocidad constante y evita frenadas bruscas para garantizar 
                la comodidad de tus pasajeros y mejorar tu calificación.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Finalizar Viaje */}
      {mostrarModalFinalizar && viaje && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div 
              className="px-6 py-4"
              style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
            >
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <StopCircle className="w-5 h-5" />
                Finalizar Viaje
              </h3>
              <p className="text-white/80 text-sm mt-1">
                {viaje.origen} → {viaje.destino}
              </p>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones del viaje (opcional)
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Novedades, incidentes, comentarios sobre el viaje..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:border-transparent transition-all resize-none"
                  style={{ outlineColor: primaryColor }}
                  rows={4}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">¿Estás seguro de finalizar?</p>
                    <p className="mt-1 text-yellow-700">
                      Esta acción marcará el viaje como completado y notificará a la cooperativa.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setMostrarModalFinalizar(false);
                    setObservaciones('');
                  }}
                  disabled={procesando}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleFinalizarViaje}
                  disabled={procesando}
                  className="flex-1 px-4 py-3 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#ef4444' }}
                >
                  {procesando ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    <>
                      <StopCircle className="w-4 h-4" />
                      Finalizar Viaje
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
