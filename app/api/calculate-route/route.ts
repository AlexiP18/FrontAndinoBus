import { NextRequest, NextResponse } from 'next/server';

interface Coordinates {
  lat: number;
  lon: number;
}

interface RouteResult {
  distanciaKm: number;
  duracionMinutos: number;
  provider: string;
}

interface RouteAlternative {
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
  }>; // Coordenadas de puntos intermedios para identificar cantones
}

interface MultiRouteResult {
  alternativas: RouteAlternative[];
  provider: string;
}

/**
 * Extrae los nombres únicos de las vías/carreteras de las instrucciones de ruta
 */
function extractRoadNames(instructions: Array<{ street_name?: string; name?: string; road?: string; ref?: string }>): string[] {
  const roadNames = new Set<string>();
  
  instructions.forEach((instruction) => {
    // Diferentes APIs usan diferentes nombres para las vías
    const roadName = instruction.street_name || instruction.name || instruction.road || '';
    const roadRef = instruction.ref || ''; // Número de ruta (ej: E35, Panamericana)
    
    if (roadName && roadName.trim() !== '' && roadName !== '-') {
      // Combinar nombre y referencia si existen
      if (roadRef && !roadName.includes(roadRef)) {
        roadNames.add(`${roadRef} - ${roadName}`);
      } else {
        roadNames.add(roadName);
      }
    } else if (roadRef) {
      roadNames.add(roadRef);
    }
  });
  
  // Filtrar vías genéricas y retornar las principales
  const filteredRoads = Array.from(roadNames).filter(name => {
    const lower = name.toLowerCase();
    // Excluir nombres genéricos
    return !lower.includes('unnamed') && 
           !lower.includes('sin nombre') && 
           name.length > 2;
  });
  
  return filteredRoads.slice(0, 8); // Máximo 8 vías principales
}

/**
 * Intenta calcular MÚLTIPLES rutas con GraphHopper API (Recomendada - Soporta alternativas)
 */
async function calculateWithGraphHopperAlternatives(origen: Coordinates, destino: Coordinates, maxAlternatives: number = 3): Promise<MultiRouteResult> {
  const apiKey = process.env.GRAPHHOPPER_API_KEY || 'e6b7ee31-e6a8-476c-bea4-27f9a98b3b13';
  
  // Solicitar múltiples alternativas CON instrucciones para obtener nombres de vías
  const url = `https://graphhopper.com/api/1/route?point=${origen.lat},${origen.lon}&point=${destino.lat},${destino.lon}&vehicle=car&locale=es&instructions=true&algorithm=alternative_route&alternative_route.max_paths=${maxAlternatives}&alternative_route.max_weight_factor=1.8&key=${apiKey}`;
  
  console.log('🚗 Solicitando alternativas con GraphHopper API (con instrucciones)...');
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GraphHopper error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.paths || data.paths.length === 0) {
    throw new Error('No se encontraron rutas en GraphHopper');
  }

  const viaNames = ['Ruta Principal', 'Vía Alterna 1', 'Vía Alterna 2', 'Vía Alterna 3'];
  
  const alternativas: RouteAlternative[] = data.paths.map((path: { 
    distance: number; 
    time: number; 
    description?: string;
    instructions?: Array<{ street_name?: string; name?: string; ref?: string }>;
  }, index: number) => {
    // Extraer nombres de vías de las instrucciones
    const vias = path.instructions ? extractRoadNames(path.instructions) : [];
    const viaPrincipal = vias.length > 0 ? vias.slice(0, 3).join(' → ') : undefined;
    
    return {
      id: index + 1,
      nombre: viaNames[index] || `Alternativa ${index + 1}`,
      distanciaKm: Math.round(path.distance / 1000 * 10) / 10,
      duracionMinutos: Math.round(path.time / 1000 / 60),
      provider: 'GraphHopper',
      descripcion: path.description || (index === 0 ? 'Ruta más rápida' : 'Ruta alternativa'),
      viaPrincipal,
      vias,
    };
  });
  
  return {
    alternativas,
    provider: 'GraphHopper'
  };
}

/**
 * Calcular ruta simple con GraphHopper (fallback)
 */
async function calculateWithGraphHopper(origen: Coordinates, destino: Coordinates): Promise<RouteResult> {
  const apiKey = process.env.GRAPHHOPPER_API_KEY || 'e6b7ee31-e6a8-476c-bea4-27f9a98b3b13';
  
  const url = `https://graphhopper.com/api/1/route?point=${origen.lat},${origen.lon}&point=${destino.lat},${destino.lon}&vehicle=car&locale=es&calc_points=false&key=${apiKey}`;
  
  console.log('🚗 Intentando con GraphHopper API...');
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GraphHopper error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.paths || data.paths.length === 0) {
    throw new Error('No se encontró una ruta en GraphHopper');
  }

  const path = data.paths[0];
  
  return {
    distanciaKm: Math.round(path.distance / 1000 * 10) / 10,
    duracionMinutos: Math.round(path.time / 1000 / 60),
    provider: 'GraphHopper'
  };
}

/**
 * Intenta calcular ruta con OpenRouteService API (Alternativa)
 */
async function calculateWithOpenRoute(origen: Coordinates, destino: Coordinates): Promise<RouteResult> {
  const apiKey = process.env.OPENROUTE_API_KEY || '5b3ce3597851110001cf6248b6aa6c5f6da84f5c9e1c9a2e6c0e5e6e';
  
  const url = 'https://api.openrouteservice.org/v2/directions/driving-car';
  
  console.log('🛣️ Intentando con OpenRouteService API...');
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': apiKey,
    },
    body: JSON.stringify({
      coordinates: [
        [origen.lon, origen.lat],
        [destino.lon, destino.lat]
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouteService error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.routes || data.routes.length === 0) {
    throw new Error('No se encontró una ruta en OpenRouteService');
  }

  const route = data.routes[0];
  const summary = route.summary;

  return {
    distanciaKm: Math.round(summary.distance / 1000 * 10) / 10,
    duracionMinutos: Math.round(summary.duration / 60),
    provider: 'OpenRouteService'
  };
}

/**
 * Intenta calcular MÚLTIPLES rutas con OSRM (Open Source Routing Machine) - Soporta alternativas
 */
async function calculateWithOSRMAlternatives(origen: Coordinates, destino: Coordinates, maxAlternatives: number = 3): Promise<MultiRouteResult> {
  // OSRM con steps=true para obtener los nombres de las vías
  const url = `https://router.project-osrm.org/route/v1/driving/${origen.lon},${origen.lat};${destino.lon},${destino.lat}?overview=false&alternatives=${maxAlternatives}&steps=true`;
  
  console.log('🗺️ Solicitando alternativas con OSRM API (con pasos)...');
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OSRM error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.routes || data.routes.length === 0) {
    throw new Error('No se encontraron rutas en OSRM');
  }

  const viaNames = ['Ruta Principal', 'Vía Alterna 1', 'Vía Alterna 2', 'Vía Alterna 3'];
  
  const alternativas: RouteAlternative[] = data.routes.map((route: { 
    distance: number; 
    duration: number; 
    legs?: Array<{ 
      summary?: string;
      steps?: Array<{ name?: string; ref?: string; destinations?: string }>;
    }>;
  }, index: number) => {
    // Extraer nombres de vías de los steps de cada leg
    const vias: string[] = [];
    const viasSet = new Set<string>();
    
    route.legs?.forEach((leg) => {
      leg.steps?.forEach((step) => {
        const roadName = step.name || '';
        const roadRef = step.ref || '';
        
        if (roadName && roadName.trim() !== '' && roadName !== '' && !viasSet.has(roadName)) {
          if (roadRef && !roadName.includes(roadRef)) {
            const fullName = `${roadRef} (${roadName})`;
            if (!viasSet.has(fullName)) {
              viasSet.add(fullName);
              vias.push(fullName);
            }
          } else {
            viasSet.add(roadName);
            vias.push(roadName);
          }
        } else if (roadRef && !viasSet.has(roadRef)) {
          viasSet.add(roadRef);
          vias.push(roadRef);
        }
      });
    });
    
    // Filtrar vías genéricas
    const filteredVias = vias.filter(name => {
      const lower = name.toLowerCase();
      return !lower.includes('unnamed') && 
             !lower.includes('sin nombre') && 
             name.length > 2;
    }).slice(0, 8);
    
    const viaPrincipal = filteredVias.length > 0 ? filteredVias.slice(0, 3).join(' → ') : route.legs?.[0]?.summary || undefined;
    
    return {
      id: index + 1,
      nombre: viaNames[index] || `Alternativa ${index + 1}`,
      distanciaKm: Math.round(route.distance / 1000 * 10) / 10,
      duracionMinutos: Math.round(route.duration / 60),
      provider: 'OSRM',
      descripcion: index === 0 ? 'Ruta más rápida' : 'Ruta alternativa',
      viaPrincipal,
      vias: filteredVias,
    };
  });
  
  return {
    alternativas,
    provider: 'OSRM'
  };
}

/**
 * Intenta calcular ruta simple con OSRM (fallback)
 */
async function calculateWithOSRM(origen: Coordinates, destino: Coordinates): Promise<RouteResult> {
  const url = `https://router.project-osrm.org/route/v1/driving/${origen.lon},${origen.lat};${destino.lon},${destino.lat}?overview=false`;
  
  console.log('🗺️ Intentando con OSRM API...');
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OSRM error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.routes || data.routes.length === 0) {
    throw new Error('No se encontró una ruta en OSRM');
  }

  const route = data.routes[0];

  return {
    distanciaKm: Math.round(route.distance / 1000 * 10) / 10,
    duracionMinutos: Math.round(route.duration / 60),
    provider: 'OSRM'
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origen, destino, alternatives = false, maxAlternatives = 3 } = body;

    console.log('📍 Calculando ruta:', { origen, destino, alternatives, maxAlternatives });

    if (!origen || !destino) {
      return NextResponse.json(
        { error: 'Origen y destino son requeridos' },
        { status: 400 }
      );
    }

    // Validar coordenadas
    if (!origen.lat || !origen.lon || !destino.lat || !destino.lon) {
      return NextResponse.json(
        { error: 'Coordenadas inválidas' },
        { status: 400 }
      );
    }

    // Limitar maxAlternatives entre 1 y 5
    const limitedMaxAlternatives = Math.min(Math.max(Number(maxAlternatives) || 3, 1), 5);

    const errors: string[] = [];

    // Si se solicitan alternativas
    if (alternatives) {
      let multiResult: MultiRouteResult | null = null;

      // 1. Intentar con GraphHopper (mejor soporte de alternativas)
      try {
        multiResult = await calculateWithGraphHopperAlternatives(origen, destino, limitedMaxAlternatives);
        console.log('✅ Alternativas obtenidas con GraphHopper:', multiResult.alternativas.length);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        console.warn('⚠️ GraphHopper alternativas falló:', errorMsg);
        errors.push(`GraphHopper: ${errorMsg}`);
      }

      // 2. Fallback a OSRM (también soporta alternativas)
      if (!multiResult) {
        try {
          multiResult = await calculateWithOSRMAlternatives(origen, destino, limitedMaxAlternatives);
          console.log('✅ Alternativas obtenidas con OSRM:', multiResult.alternativas.length);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
          console.warn('⚠️ OSRM alternativas falló:', errorMsg);
          errors.push(`OSRM: ${errorMsg}`);
        }
      }

      if (multiResult) {
        // Agregar información sobre cuántas se solicitaron vs encontradas
        return NextResponse.json({
          ...multiResult,
          solicitadas: limitedMaxAlternatives,
          encontradas: multiResult.alternativas.length,
        });
      }

      // Si las APIs de alternativas fallan, generar alternativas sintéticas basadas en una ruta
      console.warn('⚠️ Generando alternativas sintéticas...');
    }

    // Modo normal (ruta única) o fallback
    let result = null;

    // Estrategia: Intentar APIs en orden de prioridad
    // 1. GraphHopper (más confiable y generosa)
    try {
      result = await calculateWithGraphHopper(origen, destino);
      console.log('✅ Ruta calculada con GraphHopper:', result);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.warn('⚠️ GraphHopper falló:', errorMsg);
      errors.push(`GraphHopper: ${errorMsg}`);
    }

    // 2. OSRM (completamente gratuito, sin API key)
    if (!result) {
      try {
        result = await calculateWithOSRM(origen, destino);
        console.log('✅ Ruta calculada con OSRM:', result);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        console.warn('⚠️ OSRM falló:', errorMsg);
        errors.push(`OSRM: ${errorMsg}`);
      }
    }

    // 3. OpenRouteService (última opción)
    if (!result) {
      try {
        result = await calculateWithOpenRoute(origen, destino);
        console.log('✅ Ruta calculada con OpenRouteService:', result);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        console.warn('⚠️ OpenRouteService falló:', errorMsg);
        errors.push(`OpenRouteService: ${errorMsg}`);
      }
    }

    // Si todas las APIs fallaron
    if (!result) {
      console.error('❌ Todas las APIs fallaron:', errors);
      return NextResponse.json(
        { 
          error: 'ALL_APIS_FAILED',
          message: 'No se pudo calcular la ruta con ningún proveedor',
          details: errors
        },
        { status: 503 }
      );
    }

    // Si se pedían alternativas pero solo obtuvimos una ruta, generar alternativas sintéticas
    if (alternatives) {
      const syntheticAlternatives: RouteAlternative[] = [
        {
          id: 1,
          nombre: 'Ruta Principal',
          distanciaKm: result.distanciaKm,
          duracionMinutos: result.duracionMinutos,
          provider: result.provider,
          descripcion: 'Ruta más rápida',
        },
        {
          id: 2,
          nombre: 'Vía Alterna (Panorámica)',
          distanciaKm: Math.round(result.distanciaKm * 1.15 * 10) / 10, // +15% distancia
          duracionMinutos: Math.round(result.duracionMinutos * 1.2), // +20% tiempo
          provider: result.provider,
          descripcion: 'Ruta escénica, más larga pero con mejores vistas',
        },
        {
          id: 3,
          nombre: 'Vía Alterna (Pueblos)',
          distanciaKm: Math.round(result.distanciaKm * 1.25 * 10) / 10, // +25% distancia
          duracionMinutos: Math.round(result.duracionMinutos * 1.35), // +35% tiempo
          provider: result.provider,
          descripcion: 'Ruta que pasa por más localidades',
        },
      ];

      return NextResponse.json({
        alternativas: syntheticAlternatives,
        provider: result.provider,
        synthetic: true,
      });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Error en calculate-route API:', error);
    return NextResponse.json(
      { 
        error: 'CALCULATION_ERROR',
        message: error instanceof Error ? error.message : 'Error desconocido al calcular ruta'
      },
      { status: 500 }
    );
  }
}
