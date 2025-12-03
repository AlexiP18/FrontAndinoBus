# Configuración de API para Cálculo de Rutas

## OpenRouteService API

El sistema utiliza la API de OpenRouteService para calcular automáticamente la distancia y duración entre provincias de Ecuador.

### Arquitectura
- ✅ **Proxy API**: Utiliza Next.js API Routes (`/api/calculate-route`)
- ✅ **Sin CORS**: Evita problemas de seguridad del navegador
- ✅ **Seguro**: La API key nunca se expone al cliente

### Características
- ✅ **Gratuito**: Hasta 2,000 requests por día
- ✅ **Sin tarjeta de crédito requerida**
- ✅ **Cálculo preciso**: Usa datos reales de carreteras
- ✅ **Fallback incluido**: Si la API falla, usa cálculo Haversine (línea recta)

### Cómo obtener tu propia API Key (RECOMENDADO)

1. **Registrarse en OpenRouteService**
   - Visita: https://openrouteservice.org/dev/#/signup
   - Completa el formulario de registro (gratis)
   - Verifica tu email

2. **Obtener la API Key**
   - Inicia sesión en: https://openrouteservice.org/dev/#/login
   - Ve a "Dashboard" → "Tokens"
   - Copia tu API Key

3. **Configurar en el proyecto**
   - Abre el archivo: `FrontAndinaBus/app/api/calculate-route/route.ts`
   - En la línea 16, reemplaza la API Key:
   ```typescript
   const apiKey = 'TU_API_KEY_AQUI';
   ```
   - ⚠️ **IMPORTANTE**: La API key está en el servidor, NO en el cliente (más seguro)

### API Key Actual
La API key incluida en el código es pública y compartida. Para producción, se recomienda:
- Obtener tu propia API key
- Mover la API key a variables de entorno (.env.local)
- Agregar validación de rate limiting

### Variables de Entorno (RECOMENDADO para Producción)

Puedes crear un archivo `.env.local` en la raíz del proyecto:

```env
OPENROUTE_API_KEY=tu_api_key_aqui
```

Y luego actualizar `app/api/calculate-route/route.ts`:

```typescript
const apiKey = process.env.OPENROUTE_API_KEY || 'fallback_key';
```

⚠️ **Nota**: No uses `NEXT_PUBLIC_` porque esto expondría la key en el cliente. La API key debe estar solo en el servidor.

### Límites de la API Gratuita
- **Requests por día**: 2,000
- **Requests por minuto**: 40
- **Timeout**: 60 segundos por request

### Fallback Automático
Si la API falla o se alcanza el límite, el sistema automáticamente:
1. Calcula distancia usando fórmula Haversine (distancia en línea recta)
2. Estima duración basada en velocidad promedio de 60 km/h
3. Permite edición manual de los valores

### Alternativas Gratuitas
Si necesitas más requests, considera estas alternativas:

1. **GraphHopper API**
   - URL: https://www.graphhopper.com/
   - Límite gratuito: 500 requests/día

2. **Mapbox Directions API**
   - URL: https://www.mapbox.com/
   - Límite gratuito: 100,000 requests/mes

3. **Google Maps Directions API**
   - URL: https://developers.google.com/maps
   - Requiere tarjeta de crédito
   - $200 USD de crédito mensual gratuito

## Provincias de Ecuador Incluidas

El sistema incluye las 24 provincias de Ecuador con sus coordenadas:

1. Azuay (Cuenca)
2. Bolívar (Guaranda)
3. Cañar (Azogues)
4. Carchi (Tulcán)
5. Chimborazo (Riobamba)
6. Cotopaxi (Latacunga)
7. El Oro (Machala)
8. Esmeraldas
9. Galápagos (Puerto Baquerizo Moreno)
10. Guayas (Guayaquil)
11. Imbabura (Ibarra)
12. Loja
13. Los Ríos (Babahoyo)
14. Manabí (Portoviejo)
15. Morona Santiago (Macas)
16. Napo (Tena)
17. Orellana (Puerto Francisco de Orellana)
18. Pastaza (Puyo)
19. Pichincha (Quito)
20. Santa Elena
21. Santo Domingo de los Tsáchilas
22. Sucumbíos (Nueva Loja)
23. Tungurahua (Ambato)
24. Zamora Chinchipe (Zamora)

## Arquitectura del Sistema

### Flujo de Datos

```
┌─────────────┐
│  Frontend   │  Usuario selecciona origen y destino
│  (Browser)  │
└──────┬──────┘
       │ POST /api/calculate-route
       │ { origen: {lat, lon}, destino: {lat, lon} }
       ▼
┌─────────────┐
│  Next.js    │  API Route actúa como proxy
│  Server     │  (Evita CORS, protege API key)
└──────┬──────┘
       │ POST https://api.openrouteservice.org/v2/directions/driving-car
       │ Headers: { Authorization: API_KEY }
       ▼
┌─────────────┐
│ OpenRoute   │  Calcula ruta real por carretera
│  Service    │
└──────┬──────┘
       │ { distance: 420500m, duration: 22680s }
       ▼
┌─────────────┐
│  Next.js    │  Procesa y convierte unidades
│  Server     │  distance/1000 = 420.5 km
└──────┬──────┘  duration/60 = 378 min
       │ { distanciaKm: 420.5, duracionMinutos: 378 }
       ▼
┌─────────────┐
│  Frontend   │  Muestra resultados al usuario
│  (Browser)  │  "420.5 km" y "6h 18m"
└─────────────┘
```

### Ventajas de esta Arquitectura

1. **Sin CORS**: El servidor de Next.js hace la petición, no el navegador
2. **Seguridad**: La API key nunca se expone al cliente
3. **Control**: Puedes agregar rate limiting, caché, logging, etc.
4. **Fallback**: Si falla, usa cálculo matemático Haversine

## Funcionamiento del Sistema

### 1. Selección de Provincias
- Select con búsqueda (react-select)
- Muestra las 24 provincias
- Búsqueda en tiempo real

### 2. Cálculo Automático
- Se ejecuta automáticamente al seleccionar origen y destino
- Muestra "Calculando..." mientras procesa
- Actualiza distancia (km) y duración (minutos)

### 3. Edición Manual
- Los valores calculados son editables
- Útil para ajustes manuales
- Requeridos antes de guardar la ruta

### 4. Visualización
- Distancia en kilómetros (1 decimal)
- Duración en minutos (convertida a horas y minutos)
- Estado visual del cálculo (calculando, completado, error)

## Soporte Técnico

Si encuentras problemas con la API:
1. Verifica tu conexión a internet
2. Revisa la consola del navegador para errores
3. Confirma que la API key es válida
4. El sistema usará cálculo aproximado como fallback

## Actualización de Coordenadas

Para actualizar las coordenadas de las provincias, edita:
`FrontAndinaBus/lib/constants.ts`

Las coordenadas actuales son de las capitales provinciales.
