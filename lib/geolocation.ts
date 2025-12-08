/**
 * Servicio de Geolocalización
 * Obtiene la ubicación del usuario y la convierte a nombre de ciudad/cantón
 */

export interface LocationInfo {
  latitude: number;
  longitude: number;
  city: string | null;
  canton: string | null;
  province: string | null;
  country: string | null;
  displayName: string | null;
}

export interface GeolocationError {
  code: number;
  message: string;
}

// Mapeo de ciudades ecuatorianas con sus coordenadas aproximadas
// Esto ayuda a hacer matching más preciso
const CIUDADES_ECUADOR: Record<string, { lat: number; lng: number; aliases: string[] }> = {
  'Quito': { lat: -0.1807, lng: -78.4678, aliases: ['quito', 'pichincha'] },
  'Guayaquil': { lat: -2.1709, lng: -79.9224, aliases: ['guayaquil', 'guayas'] },
  'Cuenca': { lat: -2.9001, lng: -79.0059, aliases: ['cuenca', 'azuay'] },
  'Ambato': { lat: -1.2491, lng: -78.6167, aliases: ['ambato', 'tungurahua'] },
  'Riobamba': { lat: -1.6635, lng: -78.6546, aliases: ['riobamba', 'chimborazo'] },
  'Loja': { lat: -3.9931, lng: -79.2042, aliases: ['loja'] },
  'Machala': { lat: -3.2581, lng: -79.9554, aliases: ['machala', 'el oro'] },
  'Manta': { lat: -0.9677, lng: -80.7089, aliases: ['manta', 'manabi', 'manabí'] },
  'Portoviejo': { lat: -1.0546, lng: -80.4545, aliases: ['portoviejo', 'manabi', 'manabí'] },
  'Santo Domingo': { lat: -0.2532, lng: -79.1719, aliases: ['santo domingo', 'tsáchilas', 'tsachilas'] },
  'Esmeraldas': { lat: 0.9592, lng: -79.6539, aliases: ['esmeraldas'] },
  'Ibarra': { lat: 0.3392, lng: -78.1222, aliases: ['ibarra', 'imbabura'] },
  'Latacunga': { lat: -0.9346, lng: -78.6158, aliases: ['latacunga', 'cotopaxi'] },
  'Tulcán': { lat: 0.8094, lng: -77.7172, aliases: ['tulcan', 'tulcán', 'carchi'] },
  'Babahoyo': { lat: -1.8016, lng: -79.5322, aliases: ['babahoyo', 'los rios', 'los ríos'] },
  'Quevedo': { lat: -1.0225, lng: -79.4636, aliases: ['quevedo', 'los rios', 'los ríos'] },
  'Puyo': { lat: -1.4924, lng: -78.0024, aliases: ['puyo', 'pastaza'] },
  'Tena': { lat: -0.9934, lng: -77.8141, aliases: ['tena', 'napo'] },
  'Guaranda': { lat: -1.5941, lng: -79.0013, aliases: ['guaranda', 'bolivar', 'bolívar'] },
  'Azogues': { lat: -2.7397, lng: -78.8467, aliases: ['azogues', 'cañar'] },
};

/**
 * Obtiene la ubicación aproximada por IP usando un servicio gratuito
 * Esto funciona incluso en computadoras de escritorio sin GPS
 */
async function getLocationByIP(): Promise<LocationInfo> {
  try {
    // Usar ip-api.com que es gratuito y no requiere API key
    const response = await fetch('http://ip-api.com/json/?fields=status,message,country,regionName,city,lat,lon');
    
    if (!response.ok) {
      throw new Error('Error al obtener ubicación por IP');
    }
    
    const data = await response.json();
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Error en servicio de geolocalización por IP');
    }
    
    // Intentar hacer match con ciudades ecuatorianas
    const matchedCity = data.city ? matchEcuadorianCity(data.city) : null;
    const nearestCity = findNearestCity(data.lat, data.lon);
    
    const finalCity = matchedCity || nearestCity || data.city;
    
    return {
      latitude: data.lat,
      longitude: data.lon,
      city: finalCity,
      canton: null,
      province: data.regionName || null,
      country: data.country || null,
      displayName: finalCity || data.city || data.regionName || 'Ubicación detectada'
    };
  } catch (error) {
    console.error('Error en geolocalización por IP:', error);
    throw new Error('No se pudo obtener la ubicación por IP');
  }
}

/**
 * Encuentra la ciudad más cercana basándose en coordenadas
 */
function findNearestCity(lat: number, lng: number): string | null {
  let nearestCity: string | null = null;
  let minDistance = Infinity;

  for (const [city, data] of Object.entries(CIUDADES_ECUADOR)) {
    // Calcular distancia usando fórmula de Haversine simplificada
    const dLat = Math.abs(lat - data.lat);
    const dLng = Math.abs(lng - data.lng);
    const distance = Math.sqrt(dLat * dLat + dLng * dLng);

    if (distance < minDistance && distance < 0.5) { // ~50km de radio
      minDistance = distance;
      nearestCity = city;
    }
  }

  return nearestCity;
}

/**
 * Normaliza el nombre de una ciudad para hacer matching
 */
function normalizeCityName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .trim();
}

/**
 * Encuentra la ciudad ecuatoriana que coincide con el nombre dado
 */
function matchEcuadorianCity(locationName: string): string | null {
  const normalized = normalizeCityName(locationName);
  
  for (const [city, data] of Object.entries(CIUDADES_ECUADOR)) {
    // Verificar si el nombre coincide con la ciudad o algún alias
    if (normalizeCityName(city) === normalized || 
        data.aliases.some(alias => normalized.includes(alias) || alias.includes(normalized))) {
      return city;
    }
  }
  
  return null;
}

/**
 * Obtiene la posición actual del usuario
 */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({ code: 0, message: 'Geolocalización no soportada en este navegador' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        let message = 'Error desconocido';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permiso de ubicación denegado. Por favor, habilita la ubicación en tu navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Información de ubicación no disponible.';
            break;
          case error.TIMEOUT:
            message = 'Tiempo de espera agotado al obtener la ubicación.';
            break;
        }
        reject({ code: error.code, message });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache de 5 minutos
      }
    );
  });
}

/**
 * Realiza geocodificación inversa usando Nominatim (OpenStreetMap)
 */
export async function reverseGeocode(lat: number, lng: number): Promise<LocationInfo> {
  try {
    // Primero intentar encontrar la ciudad más cercana por coordenadas
    const nearestCity = findNearestCity(lat, lng);
    
    // Usar Nominatim para obtener más detalles
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'es',
          'User-Agent': 'AndinoBus/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Error en geocodificación inversa');
    }

    const data = await response.json();
    const address = data.address || {};

    // Extraer información de la dirección
    const city = address.city || address.town || address.village || address.municipality || null;
    const canton = address.county || address.state_district || null;
    const province = address.state || null;
    const country = address.country || null;

    // Intentar hacer match con ciudades ecuatorianas
    let matchedCity = nearestCity;
    if (!matchedCity && city) {
      matchedCity = matchEcuadorianCity(city);
    }
    if (!matchedCity && canton) {
      matchedCity = matchEcuadorianCity(canton);
    }
    if (!matchedCity && province) {
      matchedCity = matchEcuadorianCity(province);
    }

    return {
      latitude: lat,
      longitude: lng,
      city: matchedCity || city,
      canton: canton,
      province: province,
      country: country,
      displayName: matchedCity || city || canton || province || 'Ubicación desconocida'
    };
  } catch (error) {
    console.error('Error en geocodificación:', error);
    
    // Si falla Nominatim, usar solo el matching por coordenadas
    const nearestCity = findNearestCity(lat, lng);
    return {
      latitude: lat,
      longitude: lng,
      city: nearestCity,
      canton: null,
      province: null,
      country: 'Ecuador',
      displayName: nearestCity || 'Ubicación desconocida'
    };
  }
}

/**
 * Obtiene la ubicación completa del usuario (posición + ciudad)
 * Primero intenta con GPS del navegador, si falla usa geolocalización por IP
 */
export async function getUserLocation(): Promise<LocationInfo> {
  // Primero intentar con la API de geolocalización del navegador
  try {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    console.log(`Coordenadas GPS obtenidas: lat=${latitude}, lng=${longitude}`);
    return reverseGeocode(latitude, longitude);
  } catch (gpsError) {
    console.warn('Geolocalización GPS no disponible, intentando por IP...', gpsError);
    
    // Si falla GPS, intentar con geolocalización por IP
    try {
      const locationByIP = await getLocationByIP();
      console.log('Ubicación obtenida por IP:', locationByIP);
      return locationByIP;
    } catch (ipError) {
      console.error('Error en geolocalización por IP:', ipError);
      // Si ambos fallan, lanzar error
      throw new Error('No se pudo detectar tu ubicación. Por favor selecciona el origen manualmente.');
    }
  }
}

/**
 * Hook para usar en componentes React
 */
export function useGeolocation() {
  return {
    getCurrentPosition,
    reverseGeocode,
    getUserLocation,
    getLocationByIP,
  };
}
