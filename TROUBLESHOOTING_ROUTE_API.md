# Solución: Error 500 en Cálculo de Rutas

## 🔴 Problema

Error `POST http://localhost:3000/api/calculate-route 500 (Internal Server Error)`

## 🔍 Causa

La API key de OpenRouteService incluida en el código es pública/compartida y puede:
- Haber alcanzado el límite diario (2,000 requests/día)
- Ser inválida o estar revocada
- Tener restricciones de uso

## ✅ Soluciones

### Opción 1: Obtener Tu Propia API Key (RECOMENDADO)

1. **Registrarse en OpenRouteService** (100% GRATIS)
   - Ir a: https://openrouteservice.org/dev/#/signup
   - Completar el formulario (email, contraseña, nombre)
   - Verificar el email que te enviarán

2. **Obtener API Key**
   - Iniciar sesión: https://openrouteservice.org/dev/#/login
   - Ir a: https://openrouteservice.org/dev/#/home
   - En "Dashboard", click en "Request a Token"
   - Copiar la API Key generada (formato: `5b3ce359...`)

3. **Configurar en el Proyecto**

   **Método A: Variable de Entorno (MÁS SEGURO)**
   
   Crear archivo `.env.local` en la raíz del proyecto:
   ```env
   OPENROUTE_API_KEY=tu_api_key_aqui_sin_comillas
   ```
   
   El código ya está preparado para usar esta variable automáticamente.

   **Método B: Directamente en el Código (Solo para desarrollo)**
   
   Editar `app/api/calculate-route/route.ts`, línea 24:
   ```typescript
   const apiKey = 'TU_API_KEY_AQUI';
   ```

4. **Reiniciar el Servidor**
   ```bash
   # Detener el servidor (Ctrl+C)
   # Iniciar nuevamente
   npm run dev
   ```

### Opción 2: Usar Solo Cálculo Haversine (SIN API)

Si no quieres depender de APIs externas, puedes modificar el código para usar solo cálculo matemático:

**Editar `app/dashboard/Admin/rutas/page.tsx`**, en la función `handleCalculateRoute`:

```typescript
const handleCalculateRoute = async () => {
  if (!selectedOrigen || !selectedDestino) {
    setError('Seleccione origen y destino para calcular la ruta');
    return;
  }

  const origenData = PROVINCIAS_ECUADOR.find(p => p.value === selectedOrigen.value);
  const destinoData = PROVINCIAS_ECUADOR.find(p => p.value === selectedDestino.value);

  if (!origenData || !destinoData) return;

  setCalculatingRoute(true);
  setError(null);

  try {
    // USAR SOLO HAVERSINE - Sin API externa
    const distancia = calculateHaversineDistance(
      { lat: origenData.lat, lon: origenData.lon },
      { lat: destinoData.lat, lon: destinoData.lon }
    );
    const duracion = estimateDuration(distancia);

    setFormData({
      ...formData,
      distanciaKm: distancia,
      duracionEstimadaMinutos: duracion,
    });
  } finally {
    setCalculatingRoute(false);
  }
};
```

**Ventajas:**
- ✅ No depende de APIs externas
- ✅ Sin límites de uso
- ✅ Más rápido (sin llamadas HTTP)

**Desventajas:**
- ⚠️ Menos preciso (calcula línea recta, no carretera)
- ⚠️ No considera rutas reales, montañas, etc.

### Opción 3: Verificar Logs del Servidor

1. **Ver la terminal donde corre `npm run dev`**
   - Buscar mensajes que comiencen con:
     - 📍 Calculando ruta...
     - 🌐 Llamando a OpenRouteService API...
     - ❌ OpenRouteService error...
     - ✅ Ruta calculada...

2. **Errores Comunes:**

   ```
   ❌ OpenRouteService error: 401 Unauthorized
   ```
   → API key inválida. Usar Opción 1.

   ```
   ❌ OpenRouteService error: 403 Forbidden
   ```
   → API key sin permisos o límite alcanzado. Obtener nueva key.

   ```
   ❌ OpenRouteService error: 429 Too Many Requests
   ```
   → Límite diario alcanzado (2000 requests). Esperar 24h u obtener nueva key.

   ```
   ❌ Error: fetch failed / ENOTFOUND
   ```
   → Sin conexión a internet o API caída.

## 🧪 Probar la Solución

1. Reiniciar el servidor de desarrollo
2. Ir a `/dashboard/Admin/rutas`
3. Click en "➕ Nueva Ruta"
4. Seleccionar Origen: "Pichincha (Quito)"
5. Seleccionar Destino: "Guayas (Guayaquil)"
6. Verificar la consola del navegador (F12)
7. Deberías ver:
   ```
   📍 Iniciando cálculo de ruta...
   📡 Respuesta de API: 200
   ✅ Ruta calculada exitosamente: { distanciaKm: 420.5, duracionMinutos: 378 }
   ```

## 📝 Estado Actual del Sistema

El sistema tiene un **fallback automático**:

1. **Intenta:** Usar OpenRouteService API (datos reales de carreteras)
2. **Si falla:** Usa cálculo Haversine (distancia en línea recta)
3. **Resultado:** Siempre obtienes distancia y duración, aunque menos precisa

Por eso el sistema funciona pero con valores aproximados cuando la API falla.

## 🎯 Recomendación

**Para desarrollo:** Usar Opción 2 (solo Haversine) - Más simple y sin dependencias

**Para producción:** Usar Opción 1 (API key propia) - Más preciso y profesional

## 📞 Soporte Adicional

Si sigues teniendo problemas:

1. Verificar que el servidor de Next.js esté corriendo (`npm run dev`)
2. Limpiar caché del navegador (Ctrl+Shift+R)
3. Revisar firewall/antivirus que pueda bloquear peticiones
4. Probar en otro navegador
5. Verificar conectividad a internet

## 🔗 Enlaces Útiles

- OpenRouteService Signup: https://openrouteservice.org/dev/#/signup
- OpenRouteService Docs: https://openrouteservice.org/dev/#/api-docs
- Límites API Gratis: https://openrouteservice.org/plans/
