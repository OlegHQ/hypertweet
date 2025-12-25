import createCache from '@emotion/cache';

// Stylis plugin to add !important to all declarations
// Plugin format: (element, index, children, callback) => string | void
function importantPlugin(element: {
  type: string;
  value: string;
  return: string;
}): void {
  if (element.type === 'decl' && element.value) {
    // Modify the return value to include !important
    element.return = `${element.value.replace(/;$/, '')} !important;`;
  }
}

export const emotionCache = createCache({
  key: 'ht',
  stylisPlugins: [importantPlugin],
});
