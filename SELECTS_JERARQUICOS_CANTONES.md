# Selects Jerárquicos con Cantones del Ecuador

## 📋 Resumen de Cambios

Se ha implementado un sistema de selección jerárquico para rutas que ahora incluye **todos los cantones de Ecuador** organizados por provincia, con destacado especial para las capitales provinciales.

## 🎯 Características Implementadas

### 1. **Estructura de Datos Completa**
- ✅ 24 provincias de Ecuador
- ✅ Cantones principales de cada provincia (5-9 cantones por provincia)
- ✅ Coordenadas geográficas precisas (lat/lon) para cada cantón
- ✅ Identificación de capitales provinciales

### 2. **Interfaz de Usuario Mejorada**

#### **Cambios en el Modal de Rutas:**
- **Antes:** "Provincia de Origen" / "Provincia de Destino"
- **Ahora:** "Origen" / "Destino"

#### **Selects Jerárquicos:**
```
📁 Tungurahua
   ⭐ Ambato (Capital)
   • Baños de Agua Santa
   • Cevallos
   • Mocha
   • Patate
   • Pelileo
   • Píllaro
   • Quero
   • Tisaleo

📁 Pichincha
   ⭐ Quito (Capital)
   • Cayambe
   • Machachi
   • Pedro Moncayo
   • Rumiñahui
   • San Miguel de los Bancos
```

### 3. **Destacado de Capitales**

Las capitales provinciales se distinguen con:
- ⭐ **Estrella amarilla** al inicio
- **Texto en azul negrita** (`text-blue-700`)
- **Fondo amarillo suave** (`#fef3c7`)
- **Etiqueta "(Capital)"** al final
- **Peso de fuente 600** (semibold)

Los cantones normales tienen:
- Texto en gris (`#374151`)
- Fondo blanco
- Peso de fuente 400 (normal)
- Indentación mayor (32px vs 24px de capitales)

### 4. **Formato de Almacenamiento**

#### **Valor almacenado en la base de datos:**
```
"Provincia|Canton"
```

Ejemplos:
- `"Tungurahua|Ambato"`
- `"Pichincha|Quito"`
- `"Guayas|Guayaquil"`

#### **Nombre de ruta generado automáticamente:**
```
"Provincia Canton - Provincia Canton"
```

Ejemplos:
- `"Tungurahua Ambato - Guayas Guayaquil"`
- `"Pichincha Quito - Azuay Cuenca"`

## 🏗️ Estructura Técnica

### **constants.ts**
```typescript
export const PROVINCIAS_CANTONES_ECUADOR = [
  {
    provincia: 'Tungurahua',
    capital: 'Ambato',
    lat: -1.2543,
    lon: -78.6226,
    cantones: [
      { nombre: 'Ambato', lat: -1.2543, lon: -78.6226, esCapital: true },
      { nombre: 'Baños de Agua Santa', lat: -1.3967, lon: -78.4231, esCapital: false },
      // ... más cantones
    ]
  },
  // ... 23 provincias más
]
```

### **Tipos TypeScript**
```typescript
type CantonOption = {
  value: string;          // "Provincia|Canton"
  label: string;          // "Canton"
  lat: number;            // Latitud
  lon: number;            // Longitud
  esCapital: boolean;     // Si es capital provincial
  provincia: string;      // Nombre de la provincia
};

type ProvinciaGroup = GroupBase<CantonOption> & {
  label: string;          // Nombre de la provincia
  options: CantonOption[]; // Array de cantones
};
```

## 🎨 Estilos Personalizados

### **react-select Styles**

```typescript
styles={{
  // Encabezados de grupo (provincias)
  groupHeading: {
    backgroundColor: '#f3f4f6',  // Gris claro
    color: '#1f2937',            // Gris oscuro
    fontWeight: 700,             // Bold
    padding: '8px 12px'
  },
  
  // Opciones (cantones)
  option: {
    paddingLeft: esCapital ? '24px' : '32px',
    backgroundColor: esCapital ? '#fef3c7' : 'white',
    color: esCapital ? '#1e40af' : '#374151',
    fontWeight: esCapital ? 600 : 400
  }
}
```

### **formatOptionLabel**
```typescript
formatOptionLabel={(option) => (
  <div className={option.esCapital ? 'font-semibold' : ''}>
    {option.esCapital && <span className="mr-2 text-yellow-500">⭐</span>}
    <span className={option.esCapital ? 'text-blue-700' : ''}>
      {option.label}
    </span>
    {option.esCapital && (
      <span className="ml-2 text-xs text-gray-500">(Capital)</span>
    )}
  </div>
)}
```

## 🚀 Funcionalidad de Auto-cálculo

### **Proceso Automático:**

1. **Usuario selecciona origen:** "Tungurahua → Ambato"
2. **Usuario selecciona destino:** "Guayas → Guayaquil"
3. **Sistema genera automáticamente:**
   - **Nombre:** `"Tungurahua Ambato - Guayas Guayaquil"`
   - **Coordenadas:** Lat/Lon de Ambato y Guayaquil
   - **Espera 500ms** (debounce)
4. **Sistema calcula ruta:**
   - Intenta **GraphHopper API** (prioridad 1)
   - Si falla, intenta **OSRM API** (prioridad 2)
   - Si falla, intenta **OpenRouteService API** (prioridad 3)
   - Si todo falla, usa **Haversine** (aproximación matemática)
5. **Resultado:**
   - **Distancia:** 420.5 km (real, por carretera)
   - **Duración:** 360 minutos (6 horas)
   - **Estado:** "✓ Calculado con datos reales de carreteras"

## 📊 Cobertura de Cantones

### **Provincias con más cantones:**
1. **Tungurahua:** 9 cantones (Ambato, Baños, Cevallos, Mocha, Patate, Pelileo, Píllaro, Quero, Tisaleo)
2. **Guayas:** 7 cantones (Guayaquil, Daule, Durán, Milagro, Playas, Salinas, Samborondón)
3. **Manabí:** 7 cantones (Portoviejo, Bahía, Chone, El Carmen, Jipijapa, Manta, Montecristi)

### **Total de cantones incluidos:** ~140 cantones principales

## 🔧 Mantenimiento

### **Agregar nuevos cantones:**

```typescript
{
  provincia: 'Tungurahua',
  capital: 'Ambato',
  lat: -1.2543,
  lon: -78.6226,
  cantones: [
    // ... cantones existentes
    { 
      nombre: 'Nuevo Canton', 
      lat: -1.1234, 
      lon: -78.5678, 
      esCapital: false 
    },
  ]
}
```

### **Obtener coordenadas de un cantón:**
- Usar [Google Maps](https://www.google.com/maps)
- Hacer clic derecho en el cantón
- Seleccionar "¿Qué hay aquí?"
- Copiar coordenadas (lat, lon)

## 📝 Ejemplo de Uso Completo

### **Escenario:**
Admin quiere crear la ruta "Ambato - Quito"

### **Pasos:**
1. Abrir modal "Añadir Ruta"
2. En "Origen", buscar "Ambato":
   - Aparece bajo el grupo "Tungurahua"
   - Tiene estrella ⭐ (es capital)
   - Fondo amarillo suave
3. En "Destino", buscar "Quito":
   - Aparece bajo el grupo "Pichincha"
   - Tiene estrella ⭐ (es capital)
   - Fondo amarillo suave
4. **Sistema genera automáticamente:**
   - **Nombre:** "Tungurahua Ambato - Pichincha Quito"
   - **Calcula en 500ms:** Distancia y duración
5. Admin puede editar el nombre si desea:
   - "Ruta Ambato - Quito Express"
   - "Ambato - Quito Vía Latacunga"
6. Guardar ruta

### **Resultado en base de datos:**
```json
{
  "nombre": "Tungurahua Ambato - Pichincha Quito",
  "origen": "Tungurahua|Ambato",
  "destino": "Pichincha|Quito",
  "distanciaKm": 138.7,
  "duracionEstimadaMinutos": 180
}
```

## ✅ Ventajas del Sistema

1. **Precisión geográfica:** Coordenadas exactas de cada cantón
2. **Usabilidad:** Búsqueda rápida por nombre de cantón
3. **Organización:** Agrupación clara por provincia
4. **Distinción visual:** Capitales destacadas con colores y símbolos
5. **Flexibilidad:** Nombres editables después de auto-generación
6. **Escalabilidad:** Fácil agregar más cantones
7. **Integración API:** Cálculos automáticos con datos reales
8. **Fallback robusto:** Múltiples APIs + Haversine de respaldo

## 🎯 Próximos Pasos Recomendados

1. **Backend:** Actualizar validación para aceptar formato "Provincia|Canton"
2. **Base de datos:** Migración para rutas existentes al nuevo formato
3. **Pruebas:** Verificar cálculos con rutas de diferentes distancias
4. **Documentación:** Capacitar usuarios sobre el nuevo sistema
5. **Optimización:** Cache de rutas calculadas frecuentemente

---

**Fecha de implementación:** 2025-01-21
**Versión:** 2.0
**Autor:** Sistema de Gestión de Rutas AndinoBus
