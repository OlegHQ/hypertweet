import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppRouter } from '@/router/Router';

const initSidebar = (): void => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <AppRouter />
      </React.StrictMode>
    );
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSidebar);
} else {
  initSidebar();
}