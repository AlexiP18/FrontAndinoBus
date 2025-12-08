'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useCooperativaConfig } from '@/app/context/CooperativaConfigContext';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { viajeChoferApi, ViajeChofer, getToken } from '@/lib/api';
import {
  MapPin,
  Clock,
  Calendar,
  Bus,
  Users,
  CheckCircle,
  XCircle,
  PlayCircle,
  StopCircle,
  ArrowLeft,
  AlertCircle,
  User,
  Ticket,
  Navigation,
  Map as MapIcon,
  Phone,
  Mail,
  ChevronRight
} from 'lucide-react';

// Componente de mapa con Leaflet (carga dinámica para SSR)
const MapaRuta = ({ 
  coordenadaOrigen, 
  coordenadaDestino, 
  origen, 
  destino,
  primaryColor 
}: { 
  coordenadaOrigen?: { latitud?: number; longitud?: number; nombreTerminal?: string };
  coordenadaDestino?: { latitud?: number; longitud?: number; nombreTerminal?: string };
  origen: string;
  destino: string;
  primaryColor: string;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Solo cargar en cliente
    if (typeof window === 'undefined') return;
    
    // Cargar Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Cargar Leaflet JS
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

    // Limpiar mapa anterior
    if ((mapRef.current as any)._leaflet_id) {
      (mapRef.current as any)._leaflet_id = null;
      mapRef.current.innerHTML = '';
    }

    // Coordenadas por defecto (Ecuador central) si no hay datos
    const latOrigen = coordenadaOrigen?.latitud || -2.1709;
    const lonOrigen = coordenadaOrigen?.longitud || -79.9224;
    const latDestino = coordenadaDestino?.latitud || -2.9001;
    const lonDestino = coordenadaDestino?.longitud || -79.0059;

    // Calcular centro del mapa
    const centerLat = (latOrigen + latDestino) / 2;
    const centerLon = (lonOrigen + lonDestino) / 2;

    // Crear mapa
    const map = L.map(mapRef.current).setView([centerLat, centerLon], 8);

    // Añadir capa de tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Crear iconos personalizados
    const createIcon = (color: string, letter: string) => {
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${color};
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 16px;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">${letter}</div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
    };

    // Marcador de origen
    L.marker([latOrigen, lonOrigen], { icon: createIcon('#22c55e', 'A') })
      .addTo(map)
      .bindPopup(`
        <b>🚀 Origen</b><br>
        ${coordenadaOrigen?.nombreTerminal || origen}<br>
        ${coordenadaOrigen?.latitud ? `${latOrigen.toFixed(4)}, ${lonOrigen.toFixed(4)}` : 'Coordenadas aproximadas'}
      `);

    // Marcador de destino
    L.marker([latDestino, lonDestino], { icon: createIcon('#ef4444', 'B') })
      .addTo(map)
      .bindPopup(`
        <b>🏁 Destino</b><br>
        ${coordenadaDestino?.nombreTerminal || destino}<br>
        ${coordenadaDestino?.latitud ? `${latDestino.toFixed(4)}, ${lonDestino.toFixed(4)}` : 'Coordenadas aproximadas'}
      `);

    // Dibujar línea entre origen y destino
    L.polyline([[latOrigen, lonOrigen], [latDestino, lonDestino]], {
      color: primaryColor,
      weight: 4,
      opacity: 0.8,
      dashArray: '10, 10'
    }).addTo(map);

    // Ajustar vista para mostrar ambos puntos
    const bounds = L.latLngBounds([[latOrigen, lonOrigen], [latDestino, lonDestino]]);
    map.fitBounds(bounds, { padding: [50, 50] });

    return () => {
      map.remove();
    };
  }, [mapLoaded, coordenadaOrigen, coordenadaDestino, origen, destino, primaryColor]);

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        className="w-full h-64 md:h-80 rounded-lg border-2 border-gray-200"
        style={{ minHeight: '250px' }}
      />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <MapIcon className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-gray-500">Cargando mapa...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default function MiViajeChoferPage() {
  const { user } = useAuth();
  const { cooperativaConfig } = useCooperativaConfig();
  const router = useRouter();
  const [viaje, setViaje] = useState<ViajeChofer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [mostrarModalFinalizar, setMostrarModalFinalizar] = useState(false);
  const [pasajeroVerificados, setPasajeroVerificados] = useState<Set<number>>(new Set());
  const [mostrarMapa, setMostrarMapa] = useState(true);

  // Colores dinámicos de la cooperativa
  const primaryColor = cooperativaConfig?.colorPrimario || '#ea580c';
  const secondaryColor = cooperativaConfig?.colorSecundario || '#c2410c';

  useEffect(() => {
    loadViaje();
  }, [user]);

  const loadViaje = async () => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        setLoading(false);
        return;
      }

      const hoy = new Date().toISOString().split('T')[0];
      const viajeData = await viajeChoferApi.getViajeDelDia(user.userId, hoy, token);
      
      setViaje(viajeData);
    } catch (err) {
      console.error('Error al cargar viaje:', err);
      setError('Error al cargar la información del viaje');
    } finally {
      setLoading(false);
    }
  };

  const handleIniciarViaje = async () => {
    if (!viaje) return;

    const confirmacion = window.confirm(
      `¿Estás seguro de iniciar el viaje?\n\n` +
      `Ruta: ${viaje.origen} → ${viaje.destino}\n` +
      `Bus: ${viaje.busPlaca}\n\n` +
      `Esta acción notificará a la cooperativa que el viaje está en curso.`
    );

    if (!confirmacion) return;

    try {
      setProcesando(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      if (!viaje.id) {
        setError('No se puede iniciar un viaje sin reservas. Espere a que haya pasajeros.');
        return;
      }

      const resultado = await viajeChoferApi.iniciar(viaje.id, token);
      alert(`✅ ${resultado.mensaje}\n\nLa cooperativa ha sido notificada del inicio del viaje.`);
      
      // Recargar datos
      await loadViaje();
    } catch (err: any) {
      console.error('Error al iniciar viaje:', err);
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
      setError(null);

      const token = getToken();
      if (!token) {
        setError('No se encontró token de autenticación');
        return;
      }

      const resultado = await viajeChoferApi.finalizar(viaje.id, observaciones, token);
      alert(`✅ ${resultado.mensaje}\n\nLa cooperativa ha sido notificada de la finalización del viaje.`);
      
      setMostrarModalFinalizar(false);
      setObservaciones('');
      
      await loadViaje();
    } catch (err: any) {
      console.error('Error al finalizar viaje:', err);
      setError(err.message || 'Error al finalizar el viaje');
      alert('❌ Error al finalizar el viaje');
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

  const getEstadoColor = (estado: string) => {
    switch (estado.toUpperCase()) {
      case 'PROGRAMADO': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'EN_RUTA': return 'bg-green-100 text-green-800 border-green-300';
      case 'COMPLETADO': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getEstadoNombre = (estado: string) => {
    switch (estado.toUpperCase()) {
      case 'PROGRAMADO': return '📅 Programado';
      case 'EN_RUTA': return '🚌 En Ruta';
      case 'COMPLETADO': return '✅ Completado';
      default: return estado;
    }
  };

  const getEstadoIcono = (estado: string) => {
    switch (estado.toUpperCase()) {
      case 'PROGRAMADO': return <Clock className="w-5 h-5" />;
      case 'EN_RUTA': return <Navigation className="w-5 h-5 animate-pulse" />;
      case 'COMPLETADO': return <CheckCircle className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <ProtectedRoute allowedRoles={['COOPERATIVA']} allowedRolesCooperativa={['CHOFER']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 font-medium transition-colors"
              style={{ color: primaryColor }}
              onMouseEnter={(e) => e.currentTarget.style.color = secondaryColor}
              onMouseLeave={(e) => e.currentTarget.style.color = primaryColor}
            >
              <ArrowLeft className="w-5 h-5" />
              Volver al Dashboard
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Bus className="w-8 h-8" style={{ color: primaryColor }} />
              Mi Viaje del Día
            </h1>
            <div className="w-32" />
          </div>

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div 
                className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
                style={{ borderColor: primaryColor }}
              ></div>
              <p className="text-gray-600">Cargando información del viaje...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* No hay viaje */}
          {!loading && !viaje && !error && (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No tienes viajes asignados hoy
              </h3>
              <p className="text-gray-500 mb-6">
                No hay viajes programados para ti en esta fecha. Consulta con tu cooperativa si esperas un viaje.
              </p>
              <button
                onClick={() => router.push('/dashboard/Cooperativa/Chofer')}
                className="text-white px-6 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: primaryColor }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = secondaryColor}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
              >
                Volver al Dashboard
              </button>
            </div>
          )}

          {/* Información del viaje */}
          {!loading && viaje && (
            <div className="space-y-6">
              {/* Banner de viaje EN RUTA - Cuando el chofer regresa y el viaje está en curso */}
              {viaje.estado === 'EN_RUTA' && viaje.id && (
                <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4 flex items-start gap-3 animate-pulse">
                  <Navigation className="w-8 h-8 text-green-600 shrink-0 mt-0.5 animate-bounce" />
                  <div>
                    <h4 className="font-bold text-green-800 mb-1 text-lg">🚌 Viaje en Curso</h4>
                    <p className="text-green-700">
                      Tu viaje hacia <strong>{viaje.destino}</strong> está actualmente en ruta. 
                      {viaje.horaSalidaReal && (
                        <span> Iniciaste a las <strong>{viaje.horaSalidaReal}</strong>.</span>
                      )}
                    </p>
                    <p className="text-green-600 text-sm mt-1">
                      Recuerda finalizar el viaje cuando llegues a tu destino.
                    </p>
                  </div>
                </div>
              )}

              {/* Aviso si es un viaje programado desde frecuencia (sin reservas aún) */}
              {!viaje.id && viaje.frecuenciaId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Viaje Programado</h4>
                    <p className="text-blue-700 text-sm">
                      Este es un viaje programado según tu frecuencia asignada. Aún no hay reservas de pasajeros 
                      para este viaje. Cuando haya reservas, podrás ver la lista de pasajeros e iniciar el viaje.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Card principal del viaje */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header del viaje con colores dinámicos */}
                <div 
                  className="text-white p-6"
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` 
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white/80 text-sm">
                          {viaje.id ? `Viaje #${viaje.id}` : `Frecuencia #${viaje.frecuenciaId}`}
                        </span>
                        <span className="text-white/80">•</span>
                        <span className="text-white/80 text-sm">{viaje.cooperativaNombre || 'Cooperativa'}</span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                        <span>{viaje.origen}</span>
                        <ChevronRight className="w-6 h-6 text-white/70" />
                        <span>{viaje.destino}</span>
                      </h2>
                    </div>
                    <div 
                      className={`px-4 py-2 rounded-lg border-2 font-semibold flex items-center gap-2 ${getEstadoColor(viaje.estado)}`}
                    >
                      {getEstadoIcono(viaje.estado)}
                      {getEstadoNombre(viaje.estado)}
                    </div>
                  </div>

                  {/* Grid de información */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-white/70 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs">Fecha</span>
                      </div>
                      <p className="font-semibold text-lg">{new Date(viaje.fecha).toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-white/70 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs">Hora Salida</span>
                      </div>
                      <p className="font-semibold text-lg">{viaje.horaSalidaProgramada}</p>
                      {viaje.horaSalidaReal && (
                        <p className="text-xs text-white/70">Real: {viaje.horaSalidaReal}</p>
                      )}
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-white/70 mb-1">
                        <Bus className="w-4 h-4" />
                        <span className="text-xs">Bus</span>
                      </div>
                      <p className="font-semibold text-lg">{viaje.busPlaca || 'No asignado'}</p>
                      <p className="text-xs text-white/70">{viaje.busMarca || '-'}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-white/70 mb-1">
                        <Users className="w-4 h-4" />
                        <span className="text-xs">Pasajeros</span>
                      </div>
                      {viaje.capacidadTotal ? (
                        <>
                          <p className="font-semibold text-lg">{viaje.totalPasajeros || 0} / {viaje.capacidadTotal}</p>
                          <p className="text-xs text-white/70">{Math.round(((viaje.totalPasajeros || 0) / viaje.capacidadTotal) * 100)}% ocupación</p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-lg">{viaje.totalPasajeros || 0}</p>
                          <p className="text-xs text-white/70">Sin reservas aún</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="p-4 bg-gray-50 border-b flex flex-wrap gap-3">
                  {viaje.estado === 'PROGRAMADO' && viaje.id && (
                    <button
                      onClick={handleIniciarViaje}
                      disabled={procesando}
                      className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                      <PlayCircle className="w-5 h-5" />
                      {procesando ? 'Iniciando...' : '🚀 Iniciar Viaje'}
                    </button>
                  )}
                  {viaje.estado === 'PROGRAMADO' && !viaje.id && (
                    <div className="flex-1 flex items-center justify-center gap-2 bg-blue-100 text-blue-700 px-6 py-3 rounded-lg font-semibold">
                      <Clock className="w-5 h-5" />
                      Esperando reservas de pasajeros
                    </div>
                  )}
                  {viaje.estado === 'EN_RUTA' && viaje.id && (
                    <button
                      onClick={() => setMostrarModalFinalizar(true)}
                      disabled={procesando}
                      className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                      <StopCircle className="w-5 h-5" />
                      🏁 Finalizar Viaje
                    </button>
                  )}
                  {viaje.estado === 'COMPLETADO' && viaje.id && (
                    <div className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-600 px-6 py-3 rounded-lg font-semibold">
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
                    <MapIcon className="w-5 h-5" />
                    {mostrarMapa ? 'Ocultar Mapa' : 'Ver Mapa'}
                  </button>
                </div>

                {/* Mapa de la ruta */}
                {mostrarMapa && (
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
                      <h3 className="font-semibold text-gray-800">Mapa de la Ruta</h3>
                    </div>
                    <MapaRuta 
                      coordenadaOrigen={viaje.coordenadaOrigen}
                      coordenadaDestino={viaje.coordenadaDestino}
                      origen={viaje.origen}
                      destino={viaje.destino}
                      primaryColor={primaryColor}
                    />
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                        <span><strong>A:</strong> {viaje.coordenadaOrigen?.nombreTerminal || viaje.origen}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <span><strong>B:</strong> {viaje.coordenadaDestino?.nombreTerminal || viaje.destino}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Detalles adicionales */}
                {(viaje.horaLlegadaEstimada || viaje.horaLlegadaReal) && (
                  <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viaje.horaLlegadaEstimada && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Clock className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Llegada Estimada</p>
                          <p className="font-semibold text-gray-800">{viaje.horaLlegadaEstimada}</p>
                        </div>
                      </div>
                    )}
                    {viaje.horaLlegadaReal && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm text-green-600">Llegada Real</p>
                          <p className="font-semibold text-green-800">{viaje.horaLlegadaReal}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Lista de pasajeros */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Users className="w-6 h-6" style={{ color: primaryColor }} />
                    Lista de Pasajeros ({viaje.totalPasajeros || 0})
                  </h3>
                  <div 
                    className="text-sm px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                  >
                    Verificados: <span className="font-bold">{pasajeroVerificados.size}</span> / {viaje.totalPasajeros || 0}
                  </div>
                </div>

                {(!viaje.pasajeros || viaje.pasajeros.length === 0) ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    {!viaje.id ? (
                      <div>
                        <p className="font-medium text-gray-600 mb-2">Viaje programado sin reservas</p>
                        <p className="text-sm">Las reservas aparecerán aquí cuando los clientes compren boletos para este viaje.</p>
                      </div>
                    ) : (
                      <p>No hay pasajeros registrados para este viaje</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {viaje.pasajeros.map((pasajero, index) => (
                      <div
                        key={pasajero.reservaId}
                        className={`border-2 rounded-lg p-4 transition-all ${
                          pasajeroVerificados.has(pasajero.reservaId)
                            ? 'border-green-400 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div 
                              className="rounded-full w-10 h-10 flex items-center justify-center font-bold text-white"
                              style={{ backgroundColor: pasajeroVerificados.has(pasajero.reservaId) ? '#22c55e' : primaryColor }}
                            >
                              {pasajeroVerificados.has(pasajero.reservaId) ? '✓' : index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <p className="font-semibold text-gray-800">{pasajero.clienteEmail}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Ticket className="w-4 h-4" />
                                  Asientos: <strong>{pasajero.asientos.join(', ') || 'Sin asignar'}</strong>
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  pasajero.estado === 'PAGADO'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {pasajero.estado === 'PAGADO' ? '✓ Pagado' : '⏳ Pendiente'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleVerificarPasajero(pasajero.reservaId)}
                            className={`ml-4 px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                              pasajeroVerificados.has(pasajero.reservaId)
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {pasajeroVerificados.has(pasajero.reservaId) ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Verificado
                              </>
                            ) : (
                              'Verificar'
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal Finalizar Viaje */}
          {mostrarModalFinalizar && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                <div 
                  className="text-white p-5"
                  style={{ backgroundColor: '#dc2626' }}
                >
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <StopCircle className="w-6 h-6" />
                    Finalizar Viaje
                  </h3>
                </div>
                <div className="p-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ Esta acción marcará el viaje como completado y notificará a la cooperativa.
                    </p>
                  </div>
                  
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Resumen del viaje</p>
                    <p className="font-semibold">{viaje?.origen} → {viaje?.destino}</p>
                    <p className="text-sm text-gray-500">Bus: {viaje?.busPlaca} • {viaje?.totalPasajeros} pasajeros</p>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observaciones (opcional)
                    </label>
                    <textarea
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Ej: Viaje sin novedades, llegada puntual..."
                    />
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex gap-3">
                  <button
                    onClick={() => {
                      setMostrarModalFinalizar(false);
                      setObservaciones('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                    disabled={procesando}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleFinalizarViaje}
                    disabled={procesando}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {procesando ? 'Finalizando...' : '🏁 Finalizar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
