export type Theme = 'light' | 'dark';
export type SiteType = 'twitter' | 'reddit' | 'linkedin';

function isLightColor(color: string): boolean {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match || !match[1] || !match[2] || !match[3]) return false;

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

function detectTwitterTheme(): Theme {
  const html = document.documentElement;

  const dataTheme = html.getAttribute('data-theme');
  if (dataTheme === 'dark') return 'dark';

  if (html.style.colorScheme === 'dark') return 'dark';

  const bgColor = window.getComputedStyle(document.body).backgroundColor;
  return isLightColor(bgColor) ? 'light' : 'dark';
}

function detectRedditTheme(): Theme {
  const html = document.documentElement;
  const body = document.body;

  // Check color-scheme on html element (new Reddit uses this)
  const colorScheme = window.getComputedStyle(html).colorScheme;
  if (colorScheme === 'dark') return 'dark';
  if (colorScheme === 'light') return 'light';

  // Check for dark class
  if (html.classList.contains('dark') || body.classList.contains('dark')) {
    return 'dark';
  }

  // Check shreddit-app element (new Reddit's main container)
  const shredditApp = document.querySelector('shreddit-app');
  if (shredditApp) {
    const darkMode = shredditApp.getAttribute('darkmode');
    if (darkMode === 'true') return 'dark';
    if (darkMode === 'false') return 'light';
  }

  // Check data-theme attributes
  const themeAttr =
    html.getAttribute('data-theme') || body.getAttribute('data-theme');
  if (themeAttr?.includes('dark')) return 'dark';
  if (themeAttr?.includes('light')) return 'light';

  // Fallback to background color check
  const bgColor = window.getComputedStyle(body).backgroundColor;
  return isLightColor(bgColor) ? 'light' : 'dark';
}

function detectLinkedInTheme(): Theme {
  const html = document.documentElement;
  const body = document.body;

  if (
    body.classList.contains('theme--dark') ||
    html.classList.contains('theme--dark')
  ) {
    return 'dark';
  }

  const bgColor = window.getComputedStyle(body).backgroundColor;
  return isLightColor(bgColor) ? 'light' : 'dark';
}

export function detectTheme(siteType: SiteType): Theme {
  switch (siteType) {
    case 'twitter':
      return detectTwitterTheme();
    case 'reddit':
      return detectRedditTheme();
    case 'linkedin':
      return detectLinkedInTheme();
  }
}
