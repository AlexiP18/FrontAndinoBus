'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { configuracionApi, type ConfiguracionGlobal } from '@/lib/api';

interface ConfigContextType {
  config: ConfiguracionGlobal | null;
  loading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType>({
  config: null,
  loading: true,
  error: null,
  refreshConfig: async () => {},
});

export const useConfig = () => useContext(ConfigContext);

// Función para convertir hex a HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // Eliminar el # si existe
  hex = hex.replace(/^#/, '');
  
  // Convertir a RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Aplicar colores como variables CSS
function applyColors(config: ConfiguracionGlobal) {
  const root = document.documentElement;
  
  if (config.colorPrimario) {
    const primary = hexToHSL(config.colorPrimario);
    root.style.setProperty('--color-primary', config.colorPrimario);
    root.style.setProperty('--color-primary-h', `${primary.h}`);
    root.style.setProperty('--color-primary-s', `${primary.s}%`);
    root.style.setProperty('--color-primary-l', `${primary.l}%`);
    // Variantes de primario
    root.style.setProperty('--color-primary-50', `hsl(${primary.h}, ${primary.s}%, 95%)`);
    root.style.setProperty('--color-primary-100', `hsl(${primary.h}, ${primary.s}%, 90%)`);
    root.style.setProperty('--color-primary-200', `hsl(${primary.h}, ${primary.s}%, 80%)`);
    root.style.setProperty('--color-primary-300', `hsl(${primary.h}, ${primary.s}%, 70%)`);
    root.style.setProperty('--color-primary-400', `hsl(${primary.h}, ${primary.s}%, 60%)`);
    root.style.setProperty('--color-primary-500', config.colorPrimario);
    root.style.setProperty('--color-primary-600', `hsl(${primary.h}, ${primary.s}%, ${Math.max(primary.l - 10, 10)}%)`);
    root.style.setProperty('--color-primary-700', `hsl(${primary.h}, ${primary.s}%, ${Math.max(primary.l - 20, 10)}%)`);
    root.style.setProperty('--color-primary-800', `hsl(${primary.h}, ${primary.s}%, ${Math.max(primary.l - 30, 10)}%)`);
    root.style.setProperty('--color-primary-900', `hsl(${primary.h}, ${primary.s}%, ${Math.max(primary.l - 40, 5)}%)`);
  }
  
  if (config.colorSecundario) {
    const secondary = hexToHSL(config.colorSecundario);
    root.style.setProperty('--color-secondary', config.colorSecundario);
    root.style.setProperty('--color-secondary-h', `${secondary.h}`);
    root.style.setProperty('--color-secondary-s', `${secondary.s}%`);
    root.style.setProperty('--color-secondary-l', `${secondary.l}%`);
    root.style.setProperty('--color-secondary-50', `hsl(${secondary.h}, ${secondary.s}%, 95%)`);
    root.style.setProperty('--color-secondary-100', `hsl(${secondary.h}, ${secondary.s}%, 90%)`);
    root.style.setProperty('--color-secondary-500', config.colorSecundario);
    root.style.setProperty('--color-secondary-600', `hsl(${secondary.h}, ${secondary.s}%, ${Math.max(secondary.l - 10, 10)}%)`);
    root.style.setProperty('--color-secondary-700', `hsl(${secondary.h}, ${secondary.s}%, ${Math.max(secondary.l - 20, 10)}%)`);
  }
  
  if (config.colorAcento) {
    const accent = hexToHSL(config.colorAcento);
    root.style.setProperty('--color-accent', config.colorAcento);
    root.style.setProperty('--color-accent-h', `${accent.h}`);
    root.style.setProperty('--color-accent-s', `${accent.s}%`);
    root.style.setProperty('--color-accent-l', `${accent.l}%`);
    root.style.setProperty('--color-accent-50', `hsl(${accent.h}, ${accent.s}%, 95%)`);
    root.style.setProperty('--color-accent-100', `hsl(${accent.h}, ${accent.s}%, 90%)`);
    root.style.setProperty('--color-accent-500', config.colorAcento);
    root.style.setProperty('--color-accent-600', `hsl(${accent.h}, ${accent.s}%, ${Math.max(accent.l - 10, 10)}%)`);
  }

  // Guardar nombre y logo
  if (config.nombreAplicacion) {
    root.style.setProperty('--app-name', `"${config.nombreAplicacion}"`);
  }
  if (config.logoUrl) {
    root.style.setProperty('--app-logo', `url(${config.logoUrl})`);
  }
}

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ConfiguracionGlobal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await configuracionApi.get();
      setConfig(data);
      applyColors(data);
    } catch (err) {
      console.error('Error al cargar configuración global:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Actualizar colores cuando cambia la configuración
  useEffect(() => {
    if (config) {
      applyColors(config);
    }
  }, [config]);

  const refreshConfig = useCallback(async () => {
    await loadConfig();
  }, [loadConfig]);

  return (
    <ConfigContext.Provider value={{ config, loading, error, refreshConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export default ConfigContext;
