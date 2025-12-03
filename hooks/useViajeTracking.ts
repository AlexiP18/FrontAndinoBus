import { useState, useEffect, useCallback, useRef } from 'react';
import { trackingApi, PosicionViaje } from '@/lib/api';

interface UseViajeTrackingOptions {
  viajeId: number;
  token?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

interface UseViajeTrackingReturn {
  posicionActual: PosicionViaje | null;
  historial: PosicionViaje[];
  loading: boolean;
  error: string | null;
  refrescar: () => Promise<void>;
  obtenerHistorial: (desde?: string) => Promise<void>;
}

/**
 * Hook para tracking GPS de un viaje en tiempo real
 * 
 * @example
 * const { posicionActual, historial, loading, refrescar } = useViajeTracking({
 *   viajeId: 123,
 *   token: 'bearer-token',
 *   autoRefresh: true,
 *   refreshInterval: 10000 // 10 segundos
 * });
 */
export function useViajeTracking({
  viajeId,
  token,
  autoRefresh = false,
  refreshInterval = 10000,
}: UseViajeTrackingOptions): UseViajeTrackingReturn {
  const [posicionActual, setPosicionActual] = useState<PosicionViaje | null>(null);
  const [historial, setHistorial] = useState<PosicionViaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const obtenerPosicionActual = useCallback(async () => {
    if (!viajeId) return;

    try {
      setError(null);
      const posicion = await trackingApi.obtenerPosicionActual(viajeId, token);
      setPosicionActual(posicion);
    } catch (err) {
      console.error('Error al obtener posición actual:', err);
      setError(err instanceof Error ? err.message : 'Error al obtener posición');
    }
  }, [viajeId, token]);

  const obtenerHistorial = useCallback(async (desde?: string) => {
    if (!viajeId) return;

    try {
      setError(null);
      const posiciones = await trackingApi.obtenerHistorial(viajeId, desde, token);
      setHistorial(posiciones);
    } catch (err) {
      console.error('Error al obtener historial:', err);
      setError(err instanceof Error ? err.message : 'Error al obtener historial');
    }
  }, [viajeId, token]);

  const refrescar = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      obtenerPosicionActual(),
      obtenerHistorial(),
    ]);
    setLoading(false);
  }, [obtenerPosicionActual, obtenerHistorial]);

  // Cargar datos iniciales
  useEffect(() => {
    refrescar();
  }, [refrescar]);

  // Auto-refresh si está habilitado
  useEffect(() => {
    if (!autoRefresh) return;

    intervalRef.current = setInterval(() => {
      obtenerPosicionActual();
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, obtenerPosicionActual]);

  return {
    posicionActual,
    historial,
    loading,
    error,
    refrescar,
    obtenerHistorial,
  };
}

/**
 * Hook para enviar actualizaciones de posición GPS (para app del chofer)
 */
export function useEnviarPosicion(viajeId: number, token: string) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviarPosicion = useCallback(async (
    latitud: number,
    longitud: number,
    velocidadKmh?: number,
    precision?: number
  ) => {
    setEnviando(true);
    setError(null);

    try {
      await trackingApi.actualizarPosicion(viajeId, {
        latitud,
        longitud,
        velocidadKmh,
        precision,
        timestamp: new Date().toISOString(),
        provider: 'GPS',
      }, token);
    } catch (err) {
      console.error('Error al enviar posición:', err);
      setError(err instanceof Error ? err.message : 'Error al enviar posición');
      throw err;
    } finally {
      setEnviando(false);
    }
  }, [viajeId, token]);

  return {
    enviarPosicion,
    enviando,
    error,
  };
}
