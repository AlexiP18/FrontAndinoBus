/**
 * Servicio para calcular distancia y duración entre dos provincias de Ecuador
 * Utiliza la API de OpenRouteService (gratuita)
 */

interface RouteData {
  distanciaKm: number;
  duracionMinutos: number;
}

interface ProvinciaCoordenadas {
  lat: number;
  lon: number;
}

export interface RouteAlternative {
  id: number;
  nombre: string;
  distanciaKm: number;
  duracionMinutos: number;
  provider: string;
  descripcion?: string;
  viaPrincipal?: string;
  vias?: string[]; // Lista de carreteras/vías que se toman
  puntosIntermedios?: Array<{
    lat: number;
    lon: number;
    nombre?: string;
  }>; // Coordenadas de puntos intermedios
}

export interface MultiRouteResponse {
  alternativas: RouteAlternative[];
  provider: string;
  synthetic?: boolean;
  solicitadas?: number;
  encontradas?: number;
}

/**
 * Calcula la distancia y duración entre dos puntos usando OpenRouteService
 * a través de la API local de Next.js (evita problemas de CORS)
 * Nota: Esta es una API gratuita con límite de 2000 requests/día
 */
export async function calculateRouteData(
  origen: ProvinciaCoordenadas,
  destino: ProvinciaCoordenadas
): Promise<RouteData> {
  try {
    console.log('📍 Iniciando cálculo de ruta...', { origen, destino });
    
    // Usar la API route local de Next.js que actúa como proxy
    const response = await fetch('/api/calculate-route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origen: { lat: origen.lat, lon: origen.lon },
        destino: { lat: destino.lat, lon: destino.lon }
      }),
    });

    console.log('📡 Respuesta de API:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'PARSE_ERROR' }));
      console.error('❌ Error de API:', errorData);
      
      // Si es error 503 (Service Unavailable), usar fallback
      if (response.status === 503 || errorData.error === 'API_FAILED') {
        console.warn('⚠️ API no disponible, usando cálculo Haversine');
        throw new Error('API_UNAVAILABLE');
      }
      
      throw new Error(errorData.message || 'Error al calcular la ruta');
    }

    const data = await response.json();
    console.log('✅ Ruta calculada exitosamente:', data);

    return {
      distanciaKm: data.distanciaKm,
      duracionMinutos: data.duracionMinutos,
    };
  } catch (error) {
    console.error('❌ Error al calcular ruta:', error);
    throw error; // Propagar el error para que el componente use el fallback
  }
}

/**
 * Calcula múltiples alternativas de ruta entre dos puntos
 * @param maxAlternatives - Número máximo de alternativas a solicitar (1-5)
 */
export async function calculateRouteAlternatives(
  origen: ProvinciaCoordenadas,
  destino: ProvinciaCoordenadas,
  maxAlternatives: number = 3
): Promise<MultiRouteResponse> {
  try {
    console.log('📍 Solicitando alternativas de ruta...', { origen, destino, maxAlternatives });
    
    const response = await fetch('/api/calculate-route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origen: { lat: origen.lat, lon: origen.lon },
        destino: { lat: destino.lat, lon: destino.lon },
        alternatives: true,
        maxAlternatives: Math.min(Math.max(maxAlternatives, 1), 5), // Limitar entre 1 y 5
      }),
    });

    console.log('📡 Respuesta de API alternativas:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'PARSE_ERROR' }));
      console.error('❌ Error de API:', errorData);
      throw new Error(errorData.message || 'Error al calcular alternativas');
    }

    const data = await response.json();
    console.log(`✅ Alternativas: ${data.encontradas || data.alternativas?.length || 0} de ${data.solicitadas || maxAlternatives} solicitadas`);

    return data as MultiRouteResponse;
  } catch (error) {
    console.error('❌ Error al calcular alternativas:', error);
    throw error;
  }
}

/**
 * Calcula distancia aproximada usando la fórmula de Haversine (más simple, sin API)
 * Útil como fallback si la API falla
 */
export function calculateHaversineDistance(
  origen: ProvinciaCoordenadas,
  destino: ProvinciaCoordenadas
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(destino.lat - origen.lat);
  const dLon = toRad(destino.lon - origen.lon);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(origen.lat)) * Math.cos(toRad(destino.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Redondear a 1 decimal
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Estima duración basada en distancia (aproximadamente 60 km/h promedio en Ecuador)
 */
export function estimateDuration(distanciaKm: number): number {
  const velocidadPromedio = 60; // km/h
  return Math.round((distanciaKm / velocidadPromedio) * 60); // En minutos
}
