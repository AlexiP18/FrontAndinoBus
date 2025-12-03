# Guía de Testing - API Externa de Ecuador

## 🧪 Pruebas de Integración

### 1. **Probar API Externa Directamente**

#### **Desde PowerShell:**

```powershell
# Probar endpoint de provincias
$response = Invoke-RestMethod -Uri "https://api-ecuador.onrender.com/api/provincias"
Write-Host "Total provincias: $($response.Count)"
Write-Host "Estructura del primer elemento:"
$response[0] | ConvertTo-Json -Depth 3
```

**Output esperado:**
```
Total provincias: 24
Estructura del primer elemento:
{
  "id": 1,
  "nombre": "Azuay",
  "capital": "Cuenca",
  "lat": -2.9001,
  "lng": -79.0059,
  "cantones": [...]
}
```

#### **Desde el Navegador:**

Abrir: https://api-ecuador.onrender.com/api/provincias

Deberías ver JSON con las 24 provincias de Ecuador.

---

### 2. **Probar en el Frontend**

#### **Paso 1: Iniciar el Frontend**

```powershell
cd "C:\Users\alexi\Desktop\Proyecto DAS\FrontAndinaBus"
npm run dev
```

#### **Paso 2: Abrir Developer Tools**

1. Abrir navegador: http://localhost:3000
2. Presionar **F12** para abrir DevTools
3. Ir a la pestaña **Network**
4. Filtrar por "provincias"

#### **Paso 3: Probar el Modal de Rutas**

1. Login como Admin
2. Ir a **Dashboard → Admin → Rutas**
3. Clic en **"Añadir Ruta"**

#### **Paso 4: Verificar en DevTools**

En la pestaña Network, deberías ver:

```
Request URL: https://api-ecuador.onrender.com/api/provincias
Status Code: 200 OK
Response: [24 provincias con cantones]
```

#### **Paso 5: Verificar en la Interfaz**

✅ Los selects muestran "Cargando cantones..." brevemente  
✅ Después aparecen las 24 provincias agrupadas  
✅ Cada provincia muestra sus cantones  
✅ Las capitales tienen ⭐ y fondo amarillo  

---

### 3. **Probar Fallback Local**

Para probar que el fallback funciona cuando la API externa falla:

#### **Simular fallo de API:**

```typescript
// Modificar temporalmente en lib/api.ts
const ECUADOR_API_BASE = 'https://api-invalida-test.com/api'; // URL inválida
```

#### **Resultado esperado:**

1. La llamada a la API falla
2. Console muestra: `"Error con API Ecuador, usando fallback"`
3. El sistema usa datos locales (3 provincias básicas)
4. Los selects funcionan con datos mínimos

---

## 🔍 Verificaciones de Calidad

### **Test 1: Estructura de Datos**

```powershell
$provincias = Invoke-RestMethod -Uri "https://api-ecuador.onrender.com/api/provincias"

# Verificar que todas las provincias tienen los campos requeridos
foreach ($prov in $provincias) {
    if (-not $prov.nombre) { Write-Error "Provincia sin nombre: $($prov.id)" }
    if (-not $prov.capital) { Write-Error "Provincia sin capital: $($prov.nombre)" }
    if (-not $prov.cantones) { Write-Error "Provincia sin cantones: $($prov.nombre)" }
}

Write-Host "✅ Estructura de datos válida"
```

### **Test 2: Coordenadas Válidas**

```powershell
$provincias = Invoke-RestMethod -Uri "https://api-ecuador.onrender.com/api/provincias"

foreach ($prov in $provincias) {
    # Ecuador está entre lat: -5 a 2, lng: -92 a -75
    if ($prov.lat -lt -5 -or $prov.lat -gt 2) {
        Write-Warning "Latitud inválida para $($prov.nombre): $($prov.lat)"
    }
    if ($prov.lng -lt -92 -or $prov.lng -gt -75) {
        Write-Warning "Longitud inválida para $($prov.nombre): $($prov.lng)"
    }
}

Write-Host "✅ Coordenadas verificadas"
```

### **Test 3: Capitales Identificadas**

```typescript
// En el componente, verificar que esCapital se asigna correctamente
const provincias = await ubicacionApi.getProvincias();

provincias.forEach(provincia => {
  const capitales = provincia.cantones.filter(c => c.esCapital);
  
  if (capitales.length !== 1) {
    console.error(`❌ ${provincia.nombre} tiene ${capitales.length} capitales`);
  } else {
    console.log(`✅ ${provincia.nombre}: ${capitales[0].nombre}`);
  }
});
```

---

## 📊 Benchmarks de Performance

### **Latencia Esperada:**

| Operación | Tiempo | Descripción |
|-----------|--------|-------------|
| API Call | 200-800ms | Depende de ubicación del servidor |
| Transformación | <10ms | Mapeo de datos |
| Render | 50-200ms | Renderizado de 24 provincias |
| **Total** | **300-1000ms** | Primera carga |
| Cache hit | <50ms | Si datos están en localStorage |

### **Medir Performance:**

```typescript
console.time('Carga de provincias');

const provincias = await ubicacionApi.getProvincias();

console.timeEnd('Carga de provincias');
// Output: Carga de provincias: 456ms
```

---

## 🚨 Casos de Error Comunes

### **Error 1: CORS Policy**

**Síntoma:**
```
Access to fetch at 'https://api-ecuador.onrender.com/api/provincias' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Causa:** La API no permite requests desde localhost

**Solución:**
La API Ecuador ya tiene CORS habilitado, pero si usas otra API, necesitas:
1. Usar proxy en Next.js (crear API route)
2. Pedir al proveedor habilitar CORS

---

### **Error 2: API Timeout**

**Síntoma:**
```
Error con API Ecuador, usando fallback: Failed to fetch
```

**Causa:** La API tarda demasiado o está caída

**Solución:**
✅ El sistema usa fallback automático  
✅ Datos locales garantizan funcionamiento  

**Configurar timeout:**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos

const response = await fetch(url, {
  signal: controller.signal
});

clearTimeout(timeoutId);
```

---

### **Error 3: Datos Malformados**

**Síntoma:**
```
Cannot read property 'map' of undefined
```

**Causa:** API retorna estructura diferente

**Solución:**
```typescript
// Validar datos antes de mapear
const cantones = Array.isArray(prov.cantones) ? prov.cantones : [];
```

---

## ✅ Checklist de Validación

### **API Externa:**
- [ ] URL de API es accesible desde navegador
- [ ] Responde JSON válido
- [ ] Retorna 24 provincias
- [ ] Cada provincia tiene cantones
- [ ] Coordenadas están en rango válido
- [ ] No requiere autenticación (o token configurado)

### **Frontend:**
- [ ] Loading state se muestra correctamente
- [ ] Datos se transforman al formato esperado
- [ ] Selects muestran todas las provincias
- [ ] Capitales están destacadas (⭐)
- [ ] Búsqueda funciona
- [ ] Fallback funciona si API falla

### **Integración:**
- [ ] Origen y destino se seleccionan correctamente
- [ ] Coordenadas se usan para calcular ruta
- [ ] Nombre de ruta se genera automáticamente
- [ ] Datos se guardan en formato correcto

---

## 🎯 Script de Testing Automatizado

```powershell
# test-api-ecuador.ps1

Write-Host "🧪 Iniciando tests de API Ecuador..." -ForegroundColor Cyan

# Test 1: API está accesible
Write-Host "`n📡 Test 1: Verificando accesibilidad de API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "https://api-ecuador.onrender.com/api/provincias" -TimeoutSec 10
    Write-Host "✅ API accesible" -ForegroundColor Green
} catch {
    Write-Host "❌ API no accesible: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Número de provincias
Write-Host "`n📊 Test 2: Verificando número de provincias..." -ForegroundColor Yellow
$count = $response.Count
if ($count -eq 24) {
    Write-Host "✅ 24 provincias encontradas" -ForegroundColor Green
} else {
    Write-Host "❌ Esperadas 24 provincias, encontradas $count" -ForegroundColor Red
}

# Test 3: Estructura de datos
Write-Host "`n🔍 Test 3: Verificando estructura de datos..." -ForegroundColor Yellow
$errors = 0
foreach ($prov in $response) {
    if (-not $prov.nombre) { $errors++; Write-Host "  ❌ Provincia sin nombre" -ForegroundColor Red }
    if (-not $prov.capital) { $errors++; Write-Host "  ❌ $($prov.nombre) sin capital" -ForegroundColor Red }
    if (-not $prov.cantones) { $errors++; Write-Host "  ❌ $($prov.nombre) sin cantones" -ForegroundColor Red }
}
if ($errors -eq 0) {
    Write-Host "✅ Estructura de datos válida" -ForegroundColor Green
} else {
    Write-Host "❌ $errors errores de estructura encontrados" -ForegroundColor Red
}

# Test 4: Coordenadas válidas
Write-Host "`n📍 Test 4: Verificando coordenadas..." -ForegroundColor Yellow
$coordErrors = 0
foreach ($prov in $response) {
    if ($prov.lat -lt -5 -or $prov.lat -gt 2) { $coordErrors++ }
    if ($prov.lng -lt -92 -or $prov.lng -gt -75) { $coordErrors++ }
}
if ($coordErrors -eq 0) {
    Write-Host "✅ Coordenadas válidas" -ForegroundColor Green
} else {
    Write-Host "⚠️ $coordErrors coordenadas fuera de rango" -ForegroundColor Yellow
}

# Test 5: Provincias principales
Write-Host "`n🏛️ Test 5: Verificando provincias principales..." -ForegroundColor Yellow
$principales = @("Pichincha", "Guayas", "Azuay", "Manabí", "Tungurahua")
$found = 0
foreach ($nombre in $principales) {
    if ($response | Where-Object { $_.nombre -eq $nombre }) {
        $found++
    } else {
        Write-Host "  ⚠️ No se encontró: $nombre" -ForegroundColor Yellow
    }
}
Write-Host "✅ $found/$($principales.Count) provincias principales encontradas" -ForegroundColor Green

# Resumen
Write-Host "`n📋 RESUMEN DE TESTS" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host "Total provincias: $count"
Write-Host "Errores de estructura: $errors"
Write-Host "Errores de coordenadas: $coordErrors"
Write-Host "Provincias principales: $found/$($principales.Count)"

if ($errors -eq 0 -and $count -eq 24) {
    Write-Host "`n✅ TODOS LOS TESTS PASARON" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ ALGUNOS TESTS FALLARON" -ForegroundColor Yellow
}
```

**Ejecutar:**
```powershell
.\test-api-ecuador.ps1
```

---

**Última actualización:** 2025-01-21  
**Versión:** 4.0  
**Estado:** ✅ Lista para pruebas con API externa
