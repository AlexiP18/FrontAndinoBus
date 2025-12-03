'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { cooperativaConfigApi, getToken, resolveResourceUrl, type CooperativaConfigResponse } from '@/lib/api';

// Función para convertir hex a RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Función para ajustar luminosidad de un color
function adjustColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const adjust = (value: number) => {
    const adjusted = Math.round(value + (255 - value) * (percent / 100));
    return Math.min(255, Math.max(0, adjusted));
  };
  
  if (percent > 0) {
    // Aclarar
    return `rgb(${adjust(rgb.r)}, ${adjust(rgb.g)}, ${adjust(rgb.b)})`;
  } else {
    // Oscurecer
    const darken = (value: number) => Math.round(value * (1 + percent / 100));
    return `rgb(${darken(rgb.r)}, ${darken(rgb.g)}, ${darken(rgb.b)})`;
  }
}

interface CooperativaStyles {
  // Colores base
  primary: string;
  secondary: string;
  // Variantes de primary
  primaryLight: string;
  primaryLighter: string;
  primaryDark: string;
  primaryHover: string;
  // Variantes de secondary
  secondaryLight: string;
  secondaryLighter: string;
  secondaryDark: string;
  // Estilos para componentes
  buttonPrimary: React.CSSProperties;
  buttonSecondary: React.CSSProperties;
  buttonOutline: React.CSSProperties;
  inputFocus: string;
  borderActive: string;
  bgLight: string;
  bgGradient: string;
  textPrimary: string;
  textSecondary: string;
}

interface CooperativaConfigContextType {
  cooperativaConfig: CooperativaConfigResponse | null;
  loading: boolean;
  error: string | null;
  refreshCooperativaConfig: () => Promise<void>;
  styles: CooperativaStyles;
}

const defaultStyles: CooperativaStyles = {
  primary: '#16a34a',
  secondary: '#15803d',
  primaryLight: 'rgb(74, 222, 128)',
  primaryLighter: 'rgb(187, 247, 208)',
  primaryDark: 'rgb(21, 128, 61)',
  primaryHover: 'rgb(20, 83, 45)',
  secondaryLight: 'rgb(74, 222, 128)',
  secondaryLighter: 'rgb(220, 252, 231)',
  secondaryDark: 'rgb(20, 83, 45)',
  buttonPrimary: { backgroundColor: '#16a34a', color: 'white' },
  buttonSecondary: { backgroundColor: '#15803d', color: 'white' },
  buttonOutline: { borderColor: '#16a34a', color: '#16a34a' },
  inputFocus: '#16a34a',
  borderActive: '#16a34a',
  bgLight: 'rgb(240, 253, 244)',
  bgGradient: 'linear-gradient(to right, #16a34a, #15803d)',
  textPrimary: '#16a34a',
  textSecondary: '#15803d',
};

const CooperativaConfigContext = createContext<CooperativaConfigContextType>({
  cooperativaConfig: null,
  loading: true,
  error: null,
  refreshCooperativaConfig: async () => {},
  styles: defaultStyles,
});

export const useCooperativaConfig = () => useContext(CooperativaConfigContext);

// Función para aplicar colores de cooperativa como variables CSS
function applyCooperativaColors(config: CooperativaConfigResponse) {
  const root = document.documentElement;
  const primary = config.colorPrimario || '#16a34a';
  const secondary = config.colorSecundario || '#15803d';
  
  // Colores base
  root.style.setProperty('--coop-color-primary', primary);
  root.style.setProperty('--coop-color-secondary', secondary);
  
  // Variantes de primary
  root.style.setProperty('--coop-primary-light', adjustColor(primary, 30));
  root.style.setProperty('--coop-primary-lighter', adjustColor(primary, 70));
  root.style.setProperty('--coop-primary-dark', adjustColor(primary, -20));
  root.style.setProperty('--coop-primary-hover', adjustColor(primary, -30));
  
  // Variantes de secondary
  root.style.setProperty('--coop-secondary-light', adjustColor(secondary, 30));
  root.style.setProperty('--coop-secondary-lighter', adjustColor(secondary, 80));
  root.style.setProperty('--coop-secondary-dark', adjustColor(secondary, -20));
  
  // RGB values para usar con opacity
  const primaryRgb = hexToRgb(primary);
  if (primaryRgb) {
    root.style.setProperty('--coop-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
  }
  
  const secondaryRgb = hexToRgb(secondary);
  if (secondaryRgb) {
    root.style.setProperty('--coop-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
  }

  const logoUrl = resolveResourceUrl(config.logoUrl);
  if (logoUrl) {
    root.style.setProperty('--coop-logo', `url(${logoUrl})`);
  }
}

// Función para generar estilos basados en los colores
function generateStyles(primary: string, secondary: string): CooperativaStyles {
  return {
    primary,
    secondary,
    primaryLight: adjustColor(primary, 30),
    primaryLighter: adjustColor(primary, 70),
    primaryDark: adjustColor(primary, -20),
    primaryHover: adjustColor(primary, -30),
    secondaryLight: adjustColor(secondary, 30),
    secondaryLighter: adjustColor(secondary, 80),
    secondaryDark: adjustColor(secondary, -20),
    buttonPrimary: { backgroundColor: primary, color: 'white' },
    buttonSecondary: { backgroundColor: secondary, color: 'white' },
    buttonOutline: { borderColor: primary, color: primary },
    inputFocus: primary,
    borderActive: primary,
    bgLight: adjustColor(primary, 90),
    bgGradient: `linear-gradient(to right, ${primary}, ${secondary})`,
    textPrimary: primary,
    textSecondary: secondary,
  };
}

export function CooperativaConfigProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cooperativaConfig, setCooperativaConfig] = useState<CooperativaConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generar estilos basados en la configuración
  const styles = useMemo(() => {
    if (cooperativaConfig) {
      return generateStyles(
        cooperativaConfig.colorPrimario || '#16a34a',
        cooperativaConfig.colorSecundario || '#15803d'
      );
    }
    return defaultStyles;
  }, [cooperativaConfig]);

  const loadConfig = useCallback(async () => {
    // Solo cargar si el usuario es de cooperativa
    if (!user?.cooperativaId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      
      const data = await cooperativaConfigApi.getConfiguracion(user.cooperativaId, token);
      setCooperativaConfig(data);
      applyCooperativaColors(data);
    } catch (err) {
      console.error('Error al cargar configuración de cooperativa:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  }, [user?.cooperativaId]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Actualizar colores cuando cambia la configuración
  useEffect(() => {
    if (cooperativaConfig) {
      applyCooperativaColors(cooperativaConfig);
    }
  }, [cooperativaConfig]);

  const refreshCooperativaConfig = useCallback(async () => {
    await loadConfig();
  }, [loadConfig]);

  return (
    <CooperativaConfigContext.Provider value={{ cooperativaConfig, loading, error, refreshCooperativaConfig, styles }}>
      {children}
    </CooperativaConfigContext.Provider>
  );
}

export default CooperativaConfigContext;
