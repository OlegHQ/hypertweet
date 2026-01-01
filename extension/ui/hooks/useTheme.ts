import { useEffect, useRef } from 'react';
import { detectTheme, type Theme, type SiteType } from '../theme';
import { setTheme } from '../styles';

export function useTheme(siteType: SiteType): void {
  const lastThemeRef = useRef<Theme | null>(null);

  useEffect(() => {
    const currentTheme = detectTheme(siteType);

    if (lastThemeRef.current !== currentTheme) {
      setTheme(currentTheme);
      lastThemeRef.current = currentTheme;
    }
  });
}
