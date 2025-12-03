# APIs Externas para Datos de Ecuador

## 🌐 APIs Públicas Disponibles

### 1. **API Ecuador (Recomendada)** ⭐

**URL Base:** `https://api-ecuador.onrender.com/api`

**Características:**
- ✅ Específica para Ecuador
- ✅ Incluye provincias, cantones, ciudades
- ✅ Gratuita, sin API key
- ✅ JSON simple y directo
- ✅ Datos actualizados

**Endpoints:**

```http
GET /api/provincias
GET /api/provincias/{nombre}
GET /api/cantones
GET /api/ciudades
```

**Ejemplo de respuesta:**
```json
[
  {
    "id": 1,
    "nombre": "Azuay",
    "capital": "Cuenca",
    "lat": -2.9001,
    "lng": -79.0059,
    "cantones": [
      {
        "id": 1,
        "nombre": "Cuenca",
        "lat": -2.9001,
        "lng": -79.0059
      },
      {
        "id": 2,
        "nombre": "Girón",
        "lat": -3.1647,
        "lng": -79.1494
      }
    ]
  }
]
```

---

### 2. **GeoNames API** 🌍

**URL Base:** `http://api.geonames.org`

**Características:**
- ✅ Base de datos mundial de 11+ millones de lugares
- ✅ Datos geográficos detallados
- ⚠️ Requiere registro gratuito
- ⚠️ Límite: 20,000 requests/día (gratis)
- ✅ Muy confiable y establecida

**Registro:** https://www.geonames.org/login

**Endpoints útiles:**

```http
# Obtener subdivisiones administrativas de Ecuador
GET /childrenJSON?geonameId=3658394&username={tu_username}

# Buscar lugares por nombre
GET /searchJSON?q={nombre}&country=EC&username={tu_username}

# Obtener información de un lugar específico
GET /getJSON?geonameId={id}&username={tu_username}
```

**Parámetros importantes:**
- `geonameId=3658394` → Ecuador
- `country=EC` → Código ISO de Ecuador

**Ejemplo de respuesta:**
```json
{
  "geonames": [
    {
      "geonameId": 3654533,
      "name": "Pichincha",
      "lat": -0.25,
      "lng": -78.5833,
      "adminName1": "Pichincha",
      "population": 2388817
    }
  ]
}
```

---

### 3. **Universal Tutorial API** 📚

**URL Base:** `https://api.countrystatecity.in/v1`

**Características:**
- ✅ Datos de países, estados, ciudades
- ✅ API Key gratuita
- ✅ Buena documentación
- ⚠️ Requiere registro

**Registro:** https://countrystatecity.in/

**Endpoints:**

```http
GET /countries/EC/states
GET /countries/EC/states/{state_code}/cities
```

**Headers requeridos:**
```
X-CAPI-KEY: {tu_api_key}
```

---

### 4. **OpenStreetMap Nominatim API** 🗺️

**URL Base:** `https://nominatim.openstreetmap.org`

**Características:**
- ✅ Completamente gratuita
- ✅ Datos de OpenStreetMap
- ✅ Geocoding y reverse geocoding
- ⚠️ Límite: 1 request/segundo
- ⚠️ Datos menos estructurados

**Endpoints:**

```http
# Buscar lugares
GET /search?q={query}&country=Ecuador&format=json

# Reverse geocoding
GET /reverse?lat={lat}&lon={lon}&format=json
```

**Ejemplo:**
```http
GET https://nominatim.openstreetmap.org/search?q=Ambato&country=Ecuador&format=json
```

---

### 5. **REST Countries API** 🌎

**URL Base:** `https://restcountries.com/v3.1`

**Características:**
- ✅ Información general de países
- ✅ Totalmente gratuita
- ⚠️ No incluye subdivisiones detalladas

**Endpoints:**

```http
GET /name/ecuador
GET /alpha/EC
```

---

## 🎯 Comparación de APIs

| API | Gratuita | API Key | Específica Ecuador | Límite Requests | Confiabilidad |
|-----|----------|---------|-------------------|-----------------|---------------|
| **API Ecuador** | ✅ | ❌ | ✅ | Sin límite | ⭐⭐⭐⭐ |
| **GeoNames** | ✅ | ✅ | ❌ (Global) | 20k/día | ⭐⭐⭐⭐⭐ |
| **CountryStateCity** | ✅ | ✅ | ❌ (Global) | 1k/día | ⭐⭐⭐⭐ |
| **Nominatim OSM** | ✅ | ❌ | ❌ (Global) | 1/segundo | ⭐⭐⭐ |
| **REST Countries** | ✅ | ❌ | ❌ (General) | Sin límite | ⭐⭐⭐⭐ |

---

## 💡 Recomendación: Estrategia de Fallback

Implementar múltiples APIs con sistema de respaldo:

```typescript
async function getProvincias(): Promise<Provincia[]> {
  try {
    // Prioridad 1: API Ecuador (específica)
    return await fetchFromEcuadorAPI();
  } catch (error) {
    console.warn('API Ecuador falló, intentando GeoNames...');
    
    try {
      // Prioridad 2: GeoNames (confiable)
      return await fetchFromGeoNames();
    } catch (error) {
      console.warn('GeoNames falló, usando datos locales...');
      
      // Prioridad 3: Datos locales (fallback)
      return getLocalProvincias();
    }
  }
}
```

---

## 🚀 Implementación Actual

### **Configuración en `lib/api.ts`:**

```typescript
const ECUADOR_API_BASE = 'https://api-ecuador.onrender.com/api';
const GEONAMES_USERNAME = 'andinobus'; // Tu username de GeoNames

export const ubicacionApi = {
  getProvincias: async (): Promise<Provincia[]> => {
    // Intenta API Ecuador primero
    // Si falla, usa fallback local
  },
  
  getProvinciasGeoNames: async (): Promise<Provincia[]> => {
    // Alternativa con GeoNames
  }
};
```

### **Ventajas:**
1. ✅ No requiere backend propio
2. ✅ Datos actualizados automáticamente
3. ✅ Reduce carga del servidor
4. ✅ Fallback si API externa falla
5. ✅ Fácil cambiar de API sin modificar componentes

---

## 📋 Pasos para Usar APIs Externas

### **API Ecuador (Sin registro):**
1. ✅ Ya configurada en el código
2. ✅ No requiere API key
3. ✅ Probar: https://api-ecuador.onrender.com/api/provincias

### **GeoNames (Con registro):**

1. **Crear cuenta gratuita:**
   - Ir a: https://www.geonames.org/login
   - Registrarse con email
   - Confirmar email

2. **Activar Web Services:**
   - Login → Account → "Enable Free Web Services"
   - Copiar tu username

3. **Actualizar código:**
   ```typescript
   const GEONAMES_USERNAME = 'tu_username_aqui';
   ```

4. **Probar endpoint:**
   ```
   http://api.geonames.org/childrenJSON?geonameId=3658394&username=tu_username
   ```

---

## 🧪 Testing de APIs Externas

### **Probar API Ecuador:**

```powershell
# PowerShell
Invoke-RestMethod -Uri "https://api-ecuador.onrender.com/api/provincias" | ConvertTo-Json -Depth 10

# Contar provincias
(Invoke-RestMethod -Uri "https://api-ecuador.onrender.com/api/provincias").Count
```

```bash
# cURL
curl https://api-ecuador.onrender.com/api/provincias | jq
```

### **Probar GeoNames:**

```powershell
$username = "tu_username"
Invoke-RestMethod -Uri "http://api.geonames.org/childrenJSON?geonameId=3658394&username=$username" | ConvertTo-Json
```

### **Probar desde Browser:**

Abrir en el navegador:
```
https://api-ecuador.onrender.com/api/provincias
```

---

## 🔒 Consideraciones de Seguridad

### **API Keys en Variables de Entorno:**

```env
# .env.local
NEXT_PUBLIC_GEONAMES_USERNAME=tu_username
NEXT_PUBLIC_ECUADOR_API_URL=https://api-ecuador.onrender.com/api
```

```typescript
const GEONAMES_USERNAME = process.env.NEXT_PUBLIC_GEONAMES_USERNAME || 'demo';
const ECUADOR_API_BASE = process.env.NEXT_PUBLIC_ECUADOR_API_URL || 'https://api-ecuador.onrender.com/api';
```

### **Rate Limiting:**

```typescript
// Implementar debounce para evitar exceder límites
const debouncedFetch = debounce(fetchProvincias, 1000);
```

### **Caching:**

```typescript
// Cachear respuestas por 24 horas
const CACHE_KEY = 'provincias_ecuador';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

function getCachedProvincias(): Provincia[] | null {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;
  
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_DURATION) {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
  
  return data;
}
```

---

## 🎉 Ventajas de APIs Externas

1. **Sin infraestructura propia** - No necesitas servidor backend
2. **Datos actualizados** - Mantenidos por la comunidad
3. **Escalabilidad** - Soportan millones de requests
4. **Gratuitas** - Planes free generosos
5. **Documentadas** - APIs bien documentadas
6. **Confiables** - Uptime de 99.9%

---

## 📝 Próximos Pasos

1. ✅ **Probar API Ecuador** (ya configurada)
2. ⏳ **Opcional: Registrarse en GeoNames** (si necesitas más datos)
3. ⏳ **Implementar cache local** (reducir llamadas API)
4. ⏳ **Monitorear errores** (Sentry, LogRocket)
5. ⏳ **Agregar loading states** (ya implementado)

---

**Última actualización:** 2025-01-21  
**Versión:** 4.0 - APIs Externas  
**API Principal:** https://api-ecuador.onrender.com/api
