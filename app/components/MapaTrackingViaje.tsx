'use client';

import { useEffect, useRef, useState } from 'react';
import { useViajeTracking } from '@/hooks/useViajeTracking';
import { MapPin, Navigation, Activity, Clock, AlertCircle, Bus } from 'lucide-react';

interface TerminalCoords {
  lat: number;
  lng: number;
  nombre?: string;
}

interface MapaTrackingViajeProps {
  viajeId: number;
  token?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showHistorial?: boolean;
  showRoute?: boolean;
  terminalOrigen?: TerminalCoords;
  terminalDestino?: TerminalCoords;
  className?: string;
}

/**
 * Componente de mapa para visualizar el tracking GPS de un viaje en tiempo real
 * Usa Leaflet con OpenStreetMap
 * 
 * Muestra:
 * - Posición actual del bus
 * - Ruta entre origen y destino (opcional)
 * - Historial del recorrido (opcional)
 * - Información de velocidad y última actualización
 */
export default function MapaTrackingViaje({
  viajeId,
  token,
  autoRefresh = true,
  refreshInterval = 10000,
  showHistorial = false,
  showRoute = false,
  terminalOrigen,
  terminalDestino,
  className = '',
}: MapaTrackingViajeProps) {
  const { posicionActual, historial, loading, error, refrescar } = useViajeTracking({
    viajeId,
    token,
    autoRefresh,
    refreshInterval,
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const busMarkerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Cargar Leaflet dinámicamente
  useEffect(() => {
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

  // Inicializar mapa
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Limpiar mapa anterior
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      busMarkerRef.current = null;
    }

    // Centro por defecto (Ecuador)
    let centerLat = -1.8312;
    let centerLon = -78.1834;
    let zoom = 7;

    // Si hay terminales, centrar entre ellos
    if (terminalOrigen && terminalDestino) {
      centerLat = (terminalOrigen.lat + terminalDestino.lat) / 2;
      centerLon = (terminalOrigen.lng + terminalDestino.lng) / 2;
      zoom = 8;
    } else if (posicionActual) {
      centerLat = Number(posicionActual.latitud);
      centerLon = Number(posicionActual.longitud);
      zoom = 13;
    }

    // Crear mapa
    const map = L.map(mapRef.current).setView([centerLat, centerLon], zoom);
    mapInstanceRef.current = map;

    // Añadir capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Crear iconos personalizados
    const createIcon = (color: string, symbol: string, size: number = 36) => {
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${color};
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: ${size * 0.4}px;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">${symbol}</div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
    };

    const bounds: [number, number][] = [];

    // Marcador de origen (siempre mostrar si hay coordenadas)
    if (terminalOrigen) {
      L.marker([terminalOrigen.lat, terminalOrigen.lng], { icon: createIcon('#22c55e', 'A') })
        .addTo(map)
        .bindPopup(`
          <b>🚀 Origen</b><br>
          ${terminalOrigen.nombre || 'Terminal de origen'}<br>
          <small>${terminalOrigen.lat.toFixed(4)}, ${terminalOrigen.lng.toFixed(4)}</small>
        `);
      bounds.push([terminalOrigen.lat, terminalOrigen.lng]);
    }

    // Marcador de destino (siempre mostrar si hay coordenadas)
    if (terminalDestino) {
      L.marker([terminalDestino.lat, terminalDestino.lng], { icon: createIcon('#ef4444', 'B') })
        .addTo(map)
        .bindPopup(`
          <b>🏁 Destino</b><br>
          ${terminalDestino.nombre || 'Terminal de destino'}<br>
          <small>${terminalDestino.lat.toFixed(4)}, ${terminalDestino.lng.toFixed(4)}</small>
        `);
      bounds.push([terminalDestino.lat, terminalDestino.lng]);
    }

    // Dibujar línea de ruta entre origen y destino
    if (terminalOrigen && terminalDestino) {
      L.polyline(
        [[terminalOrigen.lat, terminalOrigen.lng], [terminalDestino.lat, terminalDestino.lng]],
        {
          color: '#6366f1',
          weight: 4,
          opacity: 0.7,
          dashArray: '10, 10'
        }
      ).addTo(map);
    }

    // Dibujar historial si está habilitado
    if (showHistorial && historial.length > 1) {
      const historialPath = historial.map(pos => [Number(pos.latitud), Number(pos.longitud)]);
      L.polyline(historialPath as [number, number][], {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.8,
      }).addTo(map);
    }

    // Ajustar vista si hay bounds
    if (bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        busMarkerRef.current = null;
      }
    };
  }, [mapLoaded, terminalOrigen, terminalDestino, showRoute, showHistorial, historial]);

  // Actualizar marcador del bus cuando cambie la posición
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !posicionActual) return;

    const L = (window as any).L;
    if (!L) return;

    const lat = Number(posicionActual.latitud);
    const lng = Number(posicionActual.longitud);

    // Crear icono del bus
    const busIcon = L.divIcon({
      className: 'bus-marker',
      html: `
        <div style="
          background-color: #f59e0b;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          animation: pulse 2s infinite;
        ">🚌</div>
        <style>
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        </style>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    // Actualizar o crear marcador del bus
    if (busMarkerRef.current) {
      busMarkerRef.current.setLatLng([lat, lng]);
    } else {
      busMarkerRef.current = L.marker([lat, lng], { icon: busIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <b>🚌 Bus en Ruta</b><br>
          Velocidad: ${posicionActual.velocidadKmh?.toFixed(0) || 0} km/h<br>
          <small>Última actualización: ${formatearFecha(posicionActual.timestamp)}</small>
        `);
    }

    // Si no hay ruta definida, centrar en el bus
    if (!terminalOrigen || !terminalDestino) {
      mapInstanceRef.current.setView([lat, lng], 14);
    }
  }, [mapLoaded, posicionActual, terminalOrigen, terminalDestino]);

  const formatearFecha = (timestamp: string) => {
    const fecha = new Date(timestamp);
    const ahora = new Date();
    const diff = Math.floor((ahora.getTime() - fecha.getTime()) / 1000);

    if (diff < 60) return `Hace ${diff} segundos`;
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} minutos`;
    return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && !posicionActual && !terminalOrigen) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Cargando información del viaje...</p>
        </div>
      </div>
    );
  }

  if (error && !terminalOrigen) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-8 ${className}`}>
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-6 h-6" />
          <div>
            <p className="font-semibold">Error al cargar tracking</p>
            <p className="text-sm text-red-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Navigation className="w-6 h-6" />
              {posicionActual && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              )}
            </div>
            <div>
              <h3 className="font-semibold">
                {posicionActual ? 'Tracking en Vivo' : 'Ruta del Viaje'}
              </h3>
              <p className="text-sm text-blue-100">Viaje #{viajeId}</p>
            </div>
          </div>

          <button
            onClick={refrescar}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            title="Actualizar posición"
          >
            <Activity className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mapa */}
      <div className="relative w-full h-96 bg-gray-100">
        <div
          ref={mapRef}
          className="w-full h-full"
          style={{ minHeight: '384px' }}
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

      {/* Información de la posición actual */}
      {posicionActual && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Latitud</p>
                <p className="text-sm font-semibold text-gray-900">
                  {posicionActual.latitud.toFixed(6)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Longitud</p>
                <p className="text-sm font-semibold text-gray-900">
                  {posicionActual.longitud.toFixed(6)}
                </p>
              </div>
            </div>

            {posicionActual.velocidadKmh !== null && posicionActual.velocidadKmh !== undefined && (
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">Velocidad</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {posicionActual.velocidadKmh.toFixed(0)} km/h
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xs text-gray-500">Actualizado</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatearFecha(posicionActual.timestamp)}
                </p>
              </div>
            </div>
          </div>

          {posicionActual.precision && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Precisión GPS: ±{posicionActual.precision.toFixed(0)}m
                {posicionActual.provider && ` • Proveedor: ${posicionActual.provider}`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mensaje cuando no hay tracking GPS */}
      {!posicionActual && (terminalOrigen || terminalDestino) && (
        <div className="p-4 bg-amber-50 border-t border-amber-200">
          <div className="flex items-center gap-3 text-amber-700">
            <Bus className="w-5 h-5" />
            <div>
              <p className="font-medium">Esperando inicio de tracking</p>
              <p className="text-sm text-amber-600">
                La ubicación en tiempo real del bus estará disponible cuando inicie el viaje
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Historial */}
      {showHistorial && historial.length > 0 && (
        <div className="p-4 bg-white border-t border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Historial de Posiciones ({historial.length})
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {historial.slice(0, 10).map((pos, index) => (
              <div
                key={pos.id || index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {pos.latitud.toFixed(6)}, {pos.longitud.toFixed(6)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(pos.timestamp).toLocaleString('es-ES')}
                    </p>
                  </div>
                </div>
                {pos.velocidadKmh && (
                  <span className="text-xs font-semibold text-green-600">
                    {pos.velocidadKmh.toFixed(0)} km/h
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
