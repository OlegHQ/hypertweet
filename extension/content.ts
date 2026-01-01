import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { CacheProvider } from '@emotion/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Router } from './router';
import { Keyboard } from './Keyboard';
import { emotionCache } from './ui/emotion';
import { queryClient } from './ui/query';
import { ToastProvider } from './ui/toast';
import type { InsertTextCallback } from './base';

const router = new Router();
const siteType = router.getSiteType();
const socialPage = router.getSocialPage();
const roots = new Map<HTMLElement, Root>();

socialPage.onReplyFormRendered((container, insertText) => {
  renderKeyboard(container, insertText);
});

function renderKeyboard(
  container: HTMLElement,
  insertText: InsertTextCallback
): void {
  const existingRoot = roots.get(container);
  if (existingRoot) {
    return;
  }
  const root = createRoot(container);
  root.render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(
        ToastProvider,
        null,
        React.createElement(
          CacheProvider,
          { value: emotionCache },
          React.createElement(Keyboard, {
            insertText,
            readPage: () => socialPage.readPage(),
            siteType,
          })
        )
      )
    )
  );
  roots.set(container, root);
}
