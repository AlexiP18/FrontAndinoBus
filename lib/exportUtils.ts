/**
 * Utilidades para exportar datos a CSV y Excel
 */

import { FrecuenciaViaje, BusDetailResponse } from './api';

// Tipos para el reporte de asignaciones
export interface AsignacionViaje {
  dia: number;
  horaSalida: string;
  origen: string;
  destino: string;
  horaLlegada: string;
  fechas: { [fecha: string]: string }; // fecha -> placa del bus
}

export interface ReporteAsignaciones {
  titulo: string;
  fechaInicio: Date;
  fechaFin: Date;
  asignaciones: AsignacionViaje[];
}

/**
 * Función helper para extraer el cantón de un string
 * El formato puede ser "Provincia|Canton|ID" o simplemente un nombre de terminal/lugar
 */
export function extraerCanton(valor: string | undefined | null): string {
  if (!valor) return '';
  // Si contiene el separador |, extraer el cantón (segundo elemento)
  if (valor.includes('|')) {
    const partes = valor.split('|');
    return partes[1] || partes[0] || valor;
  }
  // Si no tiene separador, devolver el valor tal cual
  return valor;
}

/**
 * Obtiene el cantón de origen de una frecuencia
 * Prioriza el cantón del terminal, luego extrae del rutaOrigen
 */
export function getCantonOrigen(f: FrecuenciaViaje): string {
  if (f.terminalOrigenCanton) return f.terminalOrigenCanton;
  return extraerCanton(f.rutaOrigen);
}

/**
 * Obtiene el cantón de destino de una frecuencia
 * Prioriza el cantón del terminal, luego extrae del rutaDestino
 */
export function getCantonDestino(f: FrecuenciaViaje): string {
  if (f.terminalDestinoCanton) return f.terminalDestinoCanton;
  return extraerCanton(f.rutaDestino);
}

/**
 * Genera las fechas entre dos rangos
 */
export function generarRangoFechas(inicio: Date, fin: Date): Date[] {
  const fechas: Date[] = [];
  const current = new Date(inicio);
  while (current <= fin) {
    fechas.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return fechas;
}

/**
 * Formatea una fecha como dd-mmm (ej: 05-mar)
 */
export function formatearFechaCorta(fecha: Date): string {
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = meses[fecha.getMonth()];
  return `${dia}-${mes}`;
}

/**
 * Obtiene el día de la semana en español
 */
export function obtenerDiaSemana(fecha: Date): string {
  const dias = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
  return dias[fecha.getDay()];
}

/**
 * Verifica si una frecuencia opera en un día específico
 */
export function operaEnDia(diasOperacion: string, diaSemana: string): boolean {
  const diasArray = diasOperacion.split(',').map(d => d.trim().toUpperCase());
  return diasArray.includes(diaSemana.toUpperCase());
}

/**
 * Modo de asignación de buses en el reporte
 * - 'fijo': Cada frecuencia siempre usa el mismo bus (comportamiento actual)
 * - 'rotativo': Los buses rotan por los circuitos cada día (patrón escalonado tradicional)
 */
export type ModoAsignacion = 'fijo' | 'rotativo';

/**
 * Genera el reporte de asignaciones de frecuencias por bus
 * 
 * @param frecuencias - Lista de frecuencias a incluir
 * @param buses - Lista de buses de la cooperativa
 * @param fechaInicio - Fecha de inicio del reporte
 * @param fechaFin - Fecha de fin del reporte
 * @param titulo - Título del reporte
 * @param modoAsignacion - 'fijo' o 'rotativo' (escalonado)
 */
export function generarReporteAsignaciones(
  frecuencias: FrecuenciaViaje[],
  buses: BusDetailResponse[],
  fechaInicio: Date,
  fechaFin: Date,
  titulo: string = 'ASIGNACIÓN DE FRECUENCIAS',
  modoAsignacion: ModoAsignacion = 'fijo'
): ReporteAsignaciones {
  const fechas = generarRangoFechas(fechaInicio, fechaFin);
  
  // Ordenar frecuencias por hora de salida
  const frecuenciasOrdenadas = [...frecuencias].sort((a, b) => {
    return a.horaSalida.localeCompare(b.horaSalida);
  });

  // Obtener lista única de buses que operan (ordenados por placa)
  const busesOperando = [...new Set(frecuencias.map(f => f.busPlaca).filter(Boolean))].sort();
  const totalBuses = busesOperando.length;

  const asignaciones: AsignacionViaje[] = frecuenciasOrdenadas.map((frec, index) => {
    const fechasAsignadas: { [fecha: string]: string } = {};
    
    // Para cada fecha en el rango, verificar si la frecuencia opera ese día
    for (let diaIndex = 0; diaIndex < fechas.length; diaIndex++) {
      const fecha = fechas[diaIndex];
      const diaSemana = obtenerDiaSemana(fecha);
      
      if (operaEnDia(frec.diasOperacion, diaSemana)) {
        if (modoAsignacion === 'rotativo' && totalBuses > 0) {
          // Modo rotativo: Los buses rotan por los circuitos cada día
          // El bus que hace el circuito N hoy, mañana hace el circuito N+1
          // index = número de circuito (0-based)
          // diaIndex = día en el rango (0-based)
          // Fórmula: busIndex = (index + diaIndex) % totalBuses
          // Esto hace que cada día el bus "avance" al siguiente circuito
          const busIndex = (index + diaIndex) % totalBuses;
          fechasAsignadas[formatearFechaCorta(fecha)] = busesOperando[busIndex];
        } else {
          // Modo fijo: Cada frecuencia siempre usa el mismo bus
          fechasAsignadas[formatearFechaCorta(fecha)] = frec.busPlaca || '';
        }
      }
    }

    return {
      dia: index + 1,
      horaSalida: frec.horaSalida,
      origen: getCantonOrigen(frec),
      destino: getCantonDestino(frec),
      horaLlegada: frec.horaLlegadaEstimada || '',
      fechas: fechasAsignadas,
    };
  });

  return {
    titulo,
    fechaInicio,
    fechaFin,
    asignaciones,
  };
}

/**
 * Convierte el reporte a formato CSV
 */
export function reporteToCSV(reporte: ReporteAsignaciones): string {
  const fechas = generarRangoFechas(reporte.fechaInicio, reporte.fechaFin);
  const fechasFormateadas = fechas.map(f => formatearFechaCorta(f));
  
  // Título
  let csv = `${reporte.titulo} - Desde ${formatearFechaCompletaES(reporte.fechaInicio)} hasta ${formatearFechaCompletaES(reporte.fechaFin)}\n`;
  
  // Encabezados
  const headers = ['DIA', 'HORA DE SALIDA', 'ORIGEN', 'DESTINO', 'HORA DE LLEGADA', ...fechasFormateadas];
  csv += headers.join(';') + '\n';
  
  // Datos
  for (const asig of reporte.asignaciones) {
    const row = [
      asig.dia.toString(),
      asig.horaSalida,
      asig.origen,
      asig.destino,
      asig.horaLlegada,
      ...fechasFormateadas.map(f => asig.fechas[f] || ''),
    ];
    csv += row.join(';') + '\n';
  }
  
  return csv;
}

/**
 * Formatea fecha completa en español
 */
function formatearFechaCompletaES(fecha: Date): string {
  const opciones: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return fecha.toLocaleDateString('es-ES', opciones).toUpperCase();
}

/**
 * Descarga un archivo CSV
 */
export function descargarCSV(contenido: string, nombreArchivo: string): void {
  // Agregar BOM para que Excel reconozca UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', nombreArchivo);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Genera contenido para Excel (XLSX) usando formato XML simple
 * Este es un formato XML que Excel puede abrir directamente
 */
export function reporteToExcelXML(reporte: ReporteAsignaciones): string {
  const fechas = generarRangoFechas(reporte.fechaInicio, reporte.fechaFin);
  const fechasFormateadas = fechas.map(f => formatearFechaCorta(f));
  
  const headers = ['DIA', 'HORA SALIDA', 'ORIGEN', 'DESTINO', 'HORA LLEGADA', ...fechasFormateadas];
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#16a34a" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="Title">
      <Font ss:Bold="1" ss:Size="14"/>
      <Alignment ss:Horizontal="Center"/>
    </Style>
    <Style ss:ID="Cell">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
    <Style ss:ID="BusCell">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Interior ss:Color="#dcfce7" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
  </Styles>
  <Worksheet ss:Name="Asignaciones">
    <Table>
`;

  // Ancho de columnas
  xml += `      <Column ss:Width="40"/>\n`; // DIA
  xml += `      <Column ss:Width="80"/>\n`; // HORA SALIDA
  xml += `      <Column ss:Width="120"/>\n`; // ORIGEN
  xml += `      <Column ss:Width="120"/>\n`; // DESTINO
  xml += `      <Column ss:Width="80"/>\n`; // HORA LLEGADA
  for (let i = 0; i < fechasFormateadas.length; i++) {
    xml += `      <Column ss:Width="60"/>\n`;
  }

  // Título
  xml += `      <Row ss:Height="25">
        <Cell ss:StyleID="Title" ss:MergeAcross="${headers.length - 1}">
          <Data ss:Type="String">${reporte.titulo} - ${formatearFechaCompletaES(reporte.fechaInicio)} a ${formatearFechaCompletaES(reporte.fechaFin)}</Data>
        </Cell>
      </Row>\n`;

  // Fila vacía
  xml += `      <Row></Row>\n`;

  // Encabezados
  xml += `      <Row ss:Height="20">\n`;
  for (const header of headers) {
    xml += `        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXML(header)}</Data></Cell>\n`;
  }
  xml += `      </Row>\n`;

  // Datos
  for (const asig of reporte.asignaciones) {
    xml += `      <Row>\n`;
    xml += `        <Cell ss:StyleID="Cell"><Data ss:Type="Number">${asig.dia}</Data></Cell>\n`;
    xml += `        <Cell ss:StyleID="Cell"><Data ss:Type="String">${asig.horaSalida}</Data></Cell>\n`;
    xml += `        <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXML(asig.origen)}</Data></Cell>\n`;
    xml += `        <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXML(asig.destino)}</Data></Cell>\n`;
    xml += `        <Cell ss:StyleID="Cell"><Data ss:Type="String">${asig.horaLlegada}</Data></Cell>\n`;
    
    for (const fecha of fechasFormateadas) {
      const busPlaca = asig.fechas[fecha] || '';
      const style = busPlaca ? 'BusCell' : 'Cell';
      xml += `        <Cell ss:StyleID="${style}"><Data ss:Type="String">${escapeXML(busPlaca)}</Data></Cell>\n`;
    }
    xml += `      </Row>\n`;
  }

  xml += `    </Table>
  </Worksheet>
</Workbook>`;

  return xml;
}

/**
 * Escapa caracteres especiales para XML
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Descarga un archivo Excel (XML)
 */
export function descargarExcel(contenido: string, nombreArchivo: string): void {
  const blob = new Blob([contenido], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', nombreArchivo);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Genera un reporte detallado por bus (qué frecuencias tiene asignadas cada bus)
 */
export interface ReportePorBus {
  busPlaca: string;
  busId: number;
  choferes: string[]; // Nombres de los choferes asignados
  frecuencias: {
    horaSalida: string;
    origen: string;
    destino: string;
    diasOperacion: string;
  }[];
}

// Interfaz para los choferes del bus
export interface ChoferBusInfo {
  busId: number;
  choferes: string[];
}

export function generarReportePorBus(
  frecuencias: FrecuenciaViaje[],
  buses: BusDetailResponse[],
  choferesPorBus?: Map<number, string[]>
): ReportePorBus[] {
  const reportePorBus: Map<number, ReportePorBus> = new Map();

  // Inicializar con todos los buses
  for (const bus of buses) {
    reportePorBus.set(bus.id, {
      busPlaca: bus.placa,
      busId: bus.id,
      choferes: choferesPorBus?.get(bus.id) || [],
      frecuencias: [],
    });
  }

  // Agrupar frecuencias por bus
  for (const frec of frecuencias) {
    const reporte = reportePorBus.get(frec.busId);
    if (reporte) {
      reporte.frecuencias.push({
        horaSalida: frec.horaSalida,
        origen: getCantonOrigen(frec),
        destino: getCantonDestino(frec),
        diasOperacion: frec.diasOperacion,
      });
    }
  }

  // Ordenar frecuencias por hora de salida dentro de cada bus
  for (const reporte of reportePorBus.values()) {
    reporte.frecuencias.sort((a, b) => a.horaSalida.localeCompare(b.horaSalida));
  }

  return Array.from(reportePorBus.values()).filter(r => r.frecuencias.length > 0);
}

/**
 * Convierte el reporte por bus a CSV
 */
export function reportePorBusToCSV(reportes: ReportePorBus[]): string {
  let csv = 'REPORTE DE FRECUENCIAS POR BUS\n\n';
  
  for (const reporte of reportes) {
    csv += `BUS: ${reporte.busPlaca}\n`;
    if (reporte.choferes.length > 0) {
      csv += `CHOFERES ASIGNADOS: ${reporte.choferes.join(', ')}\n`;
    }
    csv += 'HORA SALIDA;ORIGEN;DESTINO;DÍAS DE OPERACIÓN\n';
    
    for (const frec of reporte.frecuencias) {
      csv += `${frec.horaSalida};${frec.origen};${frec.destino};${frec.diasOperacion}\n`;
    }
    
    csv += '\n';
  }
  
  return csv;
}
