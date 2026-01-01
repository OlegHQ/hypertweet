import type { SiteType } from '../router';

export type { SiteType };
export type Theme = 'light' | 'dark';

function isLightColor(color: string): boolean {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match || !match[1] || !match[2] || !match[3]) return false;

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

function getThemeFromBackgroundColor(): Theme {
  const bgColor = window.getComputedStyle(document.body).backgroundColor;
  return isLightColor(bgColor) ? 'light' : 'dark';
}

function hasColorScheme(scheme: 'dark' | 'light'): boolean {
  return (
    window.getComputedStyle(document.documentElement).colorScheme === scheme
  );
}

function hasDarkClass(...classNames: string[]): boolean {
  const html = document.documentElement;
  const body = document.body;
  return classNames.some(
    cls => html.classList.contains(cls) || body.classList.contains(cls)
  );
}

function hasDarkAttribute(attrName: string, darkValue: string): boolean {
  const html = document.documentElement;
  return html.getAttribute(attrName) === darkValue;
}

const THEME_DETECTORS: Record<SiteType, () => Theme> = {
  twitter: () => {
    if (hasDarkAttribute('data-theme', 'dark')) return 'dark';
    if (document.documentElement.style.colorScheme === 'dark') return 'dark';
    return getThemeFromBackgroundColor();
  },

  reddit: () => {
    if (hasColorScheme('dark')) return 'dark';
    if (hasColorScheme('light')) return 'light';
    if (hasDarkClass('dark')) return 'dark';

    const shredditApp = document.querySelector('shreddit-app');
    if (shredditApp) {
      const darkMode = shredditApp.getAttribute('darkmode');
      if (darkMode === 'true') return 'dark';
      if (darkMode === 'false') return 'light';
    }

    const themeAttr =
      document.documentElement.getAttribute('data-theme') ||
      document.body.getAttribute('data-theme');
    if (themeAttr?.includes('dark')) return 'dark';
    if (themeAttr?.includes('light')) return 'light';

    return getThemeFromBackgroundColor();
  },

  linkedin: () => {
    if (hasDarkClass('theme--dark')) return 'dark';
    return getThemeFromBackgroundColor();
  },
};

export function detectTheme(siteType: SiteType): Theme {
  return THEME_DETECTORS[siteType]();
}
