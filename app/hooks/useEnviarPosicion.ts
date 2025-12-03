import { useState, useCallback } from 'react';
import { trackingApi } from '@/lib/api';

interface EnviarPosicionOptions {
  viajeId: number;
  token: string;
}

interface EnviarPosicionReturn {
  enviarPosicion: (
    latitud: number,
    longitud: number,
    velocidadKmh?: number,
    precision?: number
  ) => Promise<void>;
  enviando: boolean;
  error: string | null;
}

/**
 * Hook para enviar actualizaciones de posición GPS (para app del chofer)
 * 
 * @example
 * const { enviarPosicion, enviando, error } = useEnviarPosicion({
 *   viajeId: 123,
 *   token: 'bearer-token'
 * });
 * 
 * await enviarPosicion(-0.1807, -78.4678, 85.5);
 */
export function useEnviarPosicion({
  viajeId,
  token,
}: EnviarPosicionOptions): EnviarPosicionReturn {
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
