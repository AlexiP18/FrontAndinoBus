'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { viajesActivosApi, ViajeActivo, getToken, cooperativaConfigApi, CooperativaConfigResponse } from '@/lib/api';
import { 
  Bus, 
  MapPin, 
  Users, 
  Clock, 
  RefreshCw, 
  AlertCircle,
  Navigation,
  ChevronRight,
  Activity,
  Eye,
  Maximize2,
  Minimize2
} from 'lucide-react';

// Importación dinámica de Leaflet para evitar SSR issues
let L: any = null;

export default function BusesEnViajePage() {
  const { user } = useAuth();
  const [viajesActivos, setViajesActivos] = useState<ViajeActivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedViaje, setSelectedViaje] = useState<ViajeActivo | null>(null);
  const [config, setConfig] = useState<CooperativaConfigResponse | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<number, any>>(new Map());

  // Cargar configuración de cooperativa y viajes activos
  useEffect(() => {
    if (user?.cooperativaId) {
      loadData();
      // Auto-refresh cada 30 segundos
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.cooperativaId]);

  // Cargar Leaflet
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Cargar CSS de Leaflet
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Cargar JS de Leaflet
    if (!(window as any).L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        L = (window as any).L;
        setMapLoaded(true);
      };
      document.head.appendChild(script);
    } else {
      L = (window as any).L;
      setMapLoaded(true);
    }
  }, []);

  // Inicializar mapa cuando cargue
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

    // Centro de Ecuador por defecto
    const map = L.map(mapRef.current).setView([-1.8312, -78.1834], 7);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapLoaded]);

  // Actualizar marcadores cuando cambien los viajes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    updateMarkers();
  }, [mapLoaded, viajesActivos, selectedViaje]);

  const loadData = async () => {
    try {
      const token = getToken();
      if (!token || !user?.cooperativaId) return;

      const [viajes, configuracion] = await Promise.all([
        viajesActivosApi.obtenerViajesPorCooperativa(user.cooperativaId, token),
        cooperativaConfigApi.getConfiguracion(user.cooperativaId, token).catch(() => null)
      ]);

      setViajesActivos(viajes);
      setConfig(configuracion);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar viajes activos');
    } finally {
      setLoading(false);
    }
  };

  const updateMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !L) return;

    const map = mapInstanceRef.current;
    const primaryColor = config?.colorPrimario || '#7c3aed';
    const bounds: [number, number][] = [];

    // Limpiar marcadores anteriores
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();
    
    // Limpiar capas previas (terminales y rutas)
    map.eachLayer((layer: any) => {
      if (layer.options?.className === 'terminal-marker' || layer.options?.className === 'route-line') {
        layer.remove();
      }
    });

    viajesActivos.forEach(viaje => {
      const isSelected = selectedViaje?.id === viaje.id;
      
      // Marcador del bus (posición actual)
      if (viaje.latitudActual && viaje.longitudActual) {
        const busIcon = L.divIcon({
          className: 'bus-marker',
          html: `
            <div style="
              background-color: ${isSelected ? '#f59e0b' : primaryColor};
              width: ${isSelected ? '48px' : '40px'};
              height: ${isSelected ? '48px' : '40px'};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: ${isSelected ? '24px' : '20px'};
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
              ${isSelected ? 'animation: pulse 2s infinite;' : ''}
            ">🚌</div>
            <style>
              @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.15); }
              }
            </style>
          `,
          iconSize: [isSelected ? 48 : 40, isSelected ? 48 : 40],
          iconAnchor: [isSelected ? 24 : 20, isSelected ? 24 : 20],
        });

        const marker = L.marker([viaje.latitudActual, viaje.longitudActual], { icon: busIcon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width: 200px;">
              <h3 style="font-weight: bold; margin-bottom: 8px; color: ${primaryColor};">
                🚌 ${viaje.busPlaca}
              </h3>
              <p><strong>Ruta:</strong> ${viaje.rutaOrigen} → ${viaje.rutaDestino}</p>
              <p><strong>Chofer:</strong> ${viaje.choferNombreCompleto || `${viaje.choferNombre} ${viaje.choferApellido}`}</p>
              <p><strong>Pasajeros:</strong> ${viaje.numeroPasajeros}/${viaje.capacidadTotal}</p>
              <p><strong>Velocidad:</strong> ${viaje.velocidadKmh?.toFixed(0) || 0} km/h</p>
              ${viaje.ultimaActualizacion ? `<p style="font-size: 11px; color: #666;">Última actualización: ${formatTime(viaje.ultimaActualizacion)}</p>` : ''}
            </div>
          `)
          .on('click', () => setSelectedViaje(isSelected ? null : viaje));

        markersRef.current.set(viaje.id, marker);
        bounds.push([viaje.latitudActual, viaje.longitudActual]);
      }

      // Solo mostrar terminales y ruta del bus seleccionado
      if (isSelected) {
        // Marcadores de terminales origen y destino
        if (viaje.terminalOrigenLatitud && viaje.terminalOrigenLongitud) {
          const origenIcon = L.divIcon({
            className: 'terminal-marker',
            html: `<div style="background-color: #22c55e; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4);">A</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          const origenMarker = L.marker([viaje.terminalOrigenLatitud, viaje.terminalOrigenLongitud], { 
            icon: origenIcon,
            className: 'terminal-marker'
          })
            .addTo(map)
            .bindPopup(`<b>🟢 Origen:</b> ${viaje.terminalOrigenNombre || viaje.rutaOrigen}`);
          markersRef.current.set(-viaje.id * 1000, origenMarker); // ID negativo para terminales
        }

        if (viaje.terminalDestinoLatitud && viaje.terminalDestinoLongitud) {
          const destinoIcon = L.divIcon({
            className: 'terminal-marker',
            html: `<div style="background-color: #ef4444; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4);">B</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          const destinoMarker = L.marker([viaje.terminalDestinoLatitud, viaje.terminalDestinoLongitud], { 
            icon: destinoIcon,
            className: 'terminal-marker'
          })
            .addTo(map)
            .bindPopup(`<b>🔴 Destino:</b> ${viaje.terminalDestinoNombre || viaje.rutaDestino}`);
          markersRef.current.set(-viaje.id * 1000 - 1, destinoMarker);
        }

        // Dibujar ruta si hay terminales
        if (viaje.terminalOrigenLatitud && viaje.terminalOrigenLongitud && 
            viaje.terminalDestinoLatitud && viaje.terminalDestinoLongitud) {
          
          // Construir puntos de la ruta: Origen -> Bus -> Destino
          const routePoints: [number, number][] = [
            [viaje.terminalOrigenLatitud, viaje.terminalOrigenLongitud]
          ];
          
          // Añadir posición actual del bus si está disponible
          if (viaje.latitudActual && viaje.longitudActual) {
            routePoints.push([viaje.latitudActual, viaje.longitudActual]);
          }
          
          routePoints.push([viaje.terminalDestinoLatitud, viaje.terminalDestinoLongitud]);
          
          const routeLine = L.polyline(routePoints, {
            color: '#f59e0b',
            weight: 4,
            opacity: 0.8,
            dashArray: '12, 8',
            className: 'route-line'
          }).addTo(map);
          
          markersRef.current.set(-viaje.id * 2000, routeLine);
        }
      }
    });

    // Ajustar vista del mapa
    if (selectedViaje && selectedViaje.latitudActual && selectedViaje.longitudActual) {
      // Si hay un viaje seleccionado, centrar en el bus con sus terminales
      const selectedBounds: [number, number][] = [[selectedViaje.latitudActual, selectedViaje.longitudActual]];
      
      if (selectedViaje.terminalOrigenLatitud && selectedViaje.terminalOrigenLongitud) {
        selectedBounds.push([selectedViaje.terminalOrigenLatitud, selectedViaje.terminalOrigenLongitud]);
      }
      if (selectedViaje.terminalDestinoLatitud && selectedViaje.terminalDestinoLongitud) {
        selectedBounds.push([selectedViaje.terminalDestinoLatitud, selectedViaje.terminalDestinoLongitud]);
      }
      
      map.fitBounds(selectedBounds, { padding: [60, 60], maxZoom: 13 });
    } else if (bounds.length > 0) {
      // Si no hay selección, mostrar todos los buses
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [viajesActivos, selectedViaje, config?.colorPrimario]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return 'Hace unos segundos';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    return `Hace ${Math.floor(diffMin / 60)}h ${diffMin % 60}m`;
  };

  const getOcupacionColor = (ocupacion: number) => {
    if (ocupacion >= 80) return 'text-red-600 bg-red-100';
    if (ocupacion >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const primaryColor = config?.colorPrimario || '#7c3aed';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: primaryColor }}
          ></div>
          <p className="text-gray-600">Cargando buses en viaje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Bus className="w-8 h-8" style={{ color: primaryColor }} />
            Buses en Viaje
          </h1>
          <p className="text-gray-500 mt-1">
            Monitoreo en tiempo real • Última actualización: {formatTimeAgo(lastUpdate.toISOString())}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
            {viajesActivos.length} buses activos
          </span>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className={`grid gap-6 ${isMapFullscreen ? 'grid-cols-1' : 'lg:grid-cols-3'}`}>
        {/* Mapa */}
        <div className={`${isMapFullscreen ? '' : 'lg:col-span-2'}`}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div 
              className="p-4 flex items-center justify-between"
              style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)` }}
            >
              <div className="flex items-center gap-3">
                <Navigation className="w-5 h-5" style={{ color: primaryColor }} />
                <h2 className="font-semibold text-gray-800">Mapa de Tracking</h2>
              </div>
              <button
                onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                title={isMapFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              >
                {isMapFullscreen ? (
                  <Minimize2 className="w-5 h-5 text-gray-600" />
                ) : (
                  <Maximize2 className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
            <div 
              ref={mapRef} 
              className={`w-full ${isMapFullscreen ? 'h-[70vh]' : 'h-96'}`}
              style={{ minHeight: isMapFullscreen ? '70vh' : '400px' }}
            />
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm text-gray-500">Cargando mapa...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lista de buses */}
        {!isMapFullscreen && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full">
              <div 
                className="p-4"
                style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)` }}
              >
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Activity className="w-5 h-5" style={{ color: primaryColor }} />
                  Buses Activos
                </h2>
              </div>
              
              <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {viajesActivos.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No hay buses en viaje actualmente</p>
                  </div>
                ) : (
                  viajesActivos.map(viaje => {
                    const ocupacion = viaje.porcentajeOcupacion || 
                      (viaje.capacidadTotal > 0 ? (viaje.numeroPasajeros / viaje.capacidadTotal) * 100 : 0);
                    const isSelected = selectedViaje?.id === viaje.id;
                    
                    return (
                      <button
                        key={viaje.id}
                        onClick={() => setSelectedViaje(isSelected ? null : viaje)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-gray-50 border-l-4' : ''
                        }`}
                        style={isSelected ? { borderLeftColor: primaryColor } : {}}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span 
                              className="text-lg font-bold"
                              style={{ color: primaryColor }}
                            >
                              🚌 {viaje.busPlaca}
                            </span>
                            {viaje.latitudActual && (
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            )}
                          </div>
                          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {viaje.rutaOrigen} → {viaje.rutaDestino}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(viaje.fechaSalida + 'T' + viaje.horaSalida)}
                          </span>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${getOcupacionColor(ocupacion)}`}>
                            <Users className="w-3 h-3" />
                            {viaje.numeroPasajeros}/{viaje.capacidadTotal}
                          </span>
                        </div>

                        {isSelected && viaje.choferNombreCompleto && (
                          <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
                            <p><strong>Chofer:</strong> {viaje.choferNombreCompleto}</p>
                            {viaje.velocidadKmh && (
                              <p><strong>Velocidad:</strong> {viaje.velocidadKmh.toFixed(0)} km/h</p>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detalle del viaje seleccionado */}
      {selectedViaje && !isMapFullscreen && (
        <div 
          className="bg-white rounded-xl shadow-sm border-2 p-6"
          style={{ borderColor: primaryColor + '40' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Eye className="w-5 h-5" style={{ color: primaryColor }} />
              Detalles del Viaje #{selectedViaje.viajeId}
            </h3>
            <button
              onClick={() => setSelectedViaje(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Bus</p>
              <p className="font-semibold text-gray-800">{selectedViaje.busPlaca}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Ruta</p>
              <p className="font-semibold text-gray-800">{selectedViaje.rutaOrigen} → {selectedViaje.rutaDestino}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Chofer</p>
              <p className="font-semibold text-gray-800">
                {selectedViaje.choferNombreCompleto || `${selectedViaje.choferNombre} ${selectedViaje.choferApellido}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Pasajeros</p>
              <p className="font-semibold text-gray-800">
                {selectedViaje.numeroPasajeros} / {selectedViaje.capacidadTotal}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Hora Salida</p>
              <p className="font-semibold text-gray-800">{selectedViaje.horaSalida}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Hora Llegada Est.</p>
              <p className="font-semibold text-gray-800">{selectedViaje.horaLlegadaEstimada || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Estado</p>
              <span 
                className="inline-flex px-2 py-1 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: primaryColor + '20',
                  color: primaryColor 
                }}
              >
                {selectedViaje.estado}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Velocidad Actual</p>
              <p className="font-semibold text-gray-800">
                {selectedViaje.velocidadKmh ? `${selectedViaje.velocidadKmh.toFixed(0)} km/h` : 'Sin datos GPS'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
