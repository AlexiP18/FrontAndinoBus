'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useViajeTracking } from '@/hooks/useViajeTracking';
import { MapPin, Navigation, Activity, Clock, AlertCircle } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';

interface MapaTrackingViajeProps {
  viajeId: number;
  token?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showHistorial?: boolean;
  className?: string;
}

/**
 * Componente de mapa para visualizar el tracking GPS de un viaje en tiempo real
 * 
 * Muestra:
 * - Posición actual del bus
 * - Historial del recorrido (opcional)
 * - Información de velocidad y última actualización
 * 
 * Permisos:
 * - CLIENTE: Solo puede ver el viaje de su boleto
 * - ADMIN COOPERATIVA: Puede ver todos los viajes de su cooperativa
 * - SUPER ADMIN: Puede ver todos los viajes
 */
// Configuración del mapa
const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: -0.1807, // Quito, Ecuador
  lng: -78.4678,
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

export default function MapaTrackingViaje({
  viajeId,
  token,
  autoRefresh = true,
  refreshInterval = 10000,
  showHistorial = false,
  className = '',
}: MapaTrackingViajeProps) {
  const { posicionActual, historial, loading, error, refrescar } = useViajeTracking({
    viajeId,
    token,
    autoRefresh,
    refreshInterval,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(defaultCenter);

  // Cargar Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    language: 'es',
    region: 'EC',
  });

  // Actualizar centro del mapa cuando cambie la posición
  useEffect(() => {
    if (posicionActual) {
      const newCenter = {
        lat: Number(posicionActual.latitud),
        lng: Number(posicionActual.longitud),
      };
      setCenter(newCenter);
      
      // Auto-centrar el mapa en la nueva posición
      if (map) {
        map.panTo(newCenter);
      }
    }
  }, [posicionActual, map]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (loading && !posicionActual) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Cargando posición del bus...</p>
        </div>
      </div>
    );
  }

  if (error) {
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

  if (!posicionActual) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-8 ${className}`}>
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sin información de ubicación
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            El bus aún no ha iniciado el tracking GPS
          </p>
          <button
            onClick={refrescar}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Actualizar
          </button>
        </div>
      </div>
    );
  }

  const formatearFecha = (timestamp: string) => {
    const fecha = new Date(timestamp);
    const ahora = new Date();
    const diff = Math.floor((ahora.getTime() - fecha.getTime()) / 1000); // segundos

    if (diff < 60) return `Hace ${diff} segundos`;
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} minutos`;
    return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  // Preparar polyline del historial
  const historialPath = showHistorial && historial.length > 0
    ? historial.map(pos => ({
        lat: Number(pos.latitud),
        lng: Number(pos.longitud),
      }))
    : [];

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Información de estado */}
      <div className="bg-linear-to-r from-blue-600 to-purple-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Navigation className="w-6 h-6" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h3 className="font-semibold">Tracking en Vivo</h3>
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

      {/* Contenedor del mapa */}
      <div className="relative w-full h-96 bg-gray-100">
        {loadError || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
          <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-blue-50 to-purple-50">
            <div className="text-center p-8">
              <MapPin className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <p className="text-gray-900 font-semibold text-lg mb-2">Tracking GPS Activo</p>
              <p className="text-gray-600 text-sm mb-4">
                Configura Google Maps API para visualizar el mapa
              </p>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Latitud</p>
                    <p className="font-mono font-semibold text-blue-600">
                      {posicionActual.latitud.toFixed(6)}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div>
                    <p className="text-gray-500">Longitud</p>
                    <p className="font-mono font-semibold text-blue-600">
                      {posicionActual.longitud.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
              <a
                href="https://console.cloud.google.com/google/maps-apis"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Ver guía de configuración →
              </a>
            </div>
          </div>
        ) : !isLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={14}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={mapOptions}
          >
            {/* Polyline del historial */}
            {showHistorial && historialPath.length > 1 && (
              <Polyline
                path={historialPath}
                options={{
                  strokeColor: '#3B82F6',
                  strokeOpacity: 0.8,
                  strokeWeight: 4,
                  geodesic: true,
                }}
              />
            )}

            {/* Marker de posición actual */}
            {posicionActual && (
              <Marker
                position={{
                  lat: Number(posicionActual.latitud),
                  lng: Number(posicionActual.longitud),
                }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: '#10B981',
                  fillOpacity: 1,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 3,
                }}
                title={`Velocidad: ${posicionActual.velocidadKmh?.toFixed(0) || 0} km/h`}
              />
            )}
          </GoogleMap>
        )}
      </div>

      {/* Información de la posición actual */}
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
                key={pos.id}
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
