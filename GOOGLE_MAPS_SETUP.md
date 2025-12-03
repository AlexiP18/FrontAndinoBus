# Configuración de Google Maps API

## 📝 Pasos para Obtener la API Key

### 1. Acceder a Google Cloud Console
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Crea un nuevo proyecto o selecciona uno existente

### 2. Habilitar la API de Maps JavaScript
1. En el menú lateral, ve a **APIs & Services** > **Library**
2. Busca "Maps JavaScript API"
3. Haz clic en **ENABLE** (Habilitar)

### 3. Crear Credenciales (API Key)
1. Ve a **APIs & Services** > **Credentials**
2. Haz clic en **+ CREATE CREDENTIALS**
3. Selecciona **API Key**
4. Copia la API Key generada

### 4. Configurar Restricciones (Recomendado)

#### Restricciones de Aplicación:
1. Edita tu API Key
2. En "Application restrictions", selecciona **HTTP referrers (web sites)**
3. Agrega tus dominios permitidos:
   ```
   http://localhost:3000/*
   https://tu-dominio.com/*
   ```

#### Restricciones de API:
1. En "API restrictions", selecciona **Restrict key**
2. Selecciona solo:
   - Maps JavaScript API
   - Geocoding API (opcional)
   - Directions API (opcional)

### 5. Configurar en tu Proyecto

1. Copia el archivo de ejemplo:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edita `.env.local` y pega tu API Key:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=TU_API_KEY_AQUI
   ```

3. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## 🔒 Seguridad

### ⚠️ IMPORTANTE:
- **NUNCA** subas `.env.local` al repositorio
- El archivo `.env.local` está en `.gitignore` por defecto
- Las API Keys sin restricciones pueden generar costos inesperados

### Restricciones Recomendadas:
1. ✅ **HTTP Referrers**: Limita a tus dominios
2. ✅ **API Restrictions**: Solo las APIs necesarias
3. ✅ **Quotas**: Establece límites de uso diario

## 💰 Costos

Google Maps ofrece:
- **$200 USD** de crédito mensual gratis
- Después se cobra por uso:
  - Maps JavaScript API: $7 por 1,000 cargas
  - Primeras 28,500 cargas/mes son gratuitas

### Calcular Uso Esperado:
- Si tienes 100 usuarios viendo mapas 10 veces al día
- = 1,000 cargas/día = 30,000 cargas/mes
- Costo: ~$14 USD/mes (después del crédito gratuito)

## 🧪 Modo de Prueba (Sin API Key)

Si no quieres usar Google Maps aún, el componente mostrará:
- Un placeholder con las coordenadas GPS
- Toda la funcionalidad de tracking funcionará
- Solo faltará la visualización geográfica

## 📚 Documentación Adicional

- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [React Google Maps API](https://react-google-maps-api-docs.netlify.app/)
- [Pricing Calculator](https://mapsplatform.google.com/pricing/)

## ✅ Verificación

Para verificar que todo funciona:
1. Abre el dashboard de tracking
2. Deberías ver el mapa de Google Maps cargado
3. El marker verde debe aparecer en la posición del bus
4. El polyline azul debe mostrar el historial (si está habilitado)

Si ves el placeholder:
- Verifica que la API Key esté en `.env.local`
- Verifica que la API esté habilitada en Google Cloud
- Revisa la consola del navegador para errores
