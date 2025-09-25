// Background service worker for Hypertweet extension

// Handle extension installation
chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') {
    if (process.env['NODE_ENV'] === 'development') {
      console.log('Hypertweet extension installed');
    }

    // Open sidebar on installation
    chrome.windows
      .getCurrent()
      .then(window => {
        if (window.id !== undefined) {
          chrome.sidePanel.open({ windowId: window.id }).catch(error => {
            if (process.env['NODE_ENV'] === 'development') {
              console.warn('Could not open side panel on install:', error);
            }
          });
        }
      })
      .catch(error => {
        if (process.env['NODE_ENV'] === 'development') {
          console.warn('Could not get current window:', error);
        }
      });
  }
});

// Handle toolbar button clicks
chrome.action.onClicked.addListener(tab => {
  // Open the side panel when extension icon is clicked
  if (tab.id !== undefined) {
    chrome.sidePanel.open({ tabId: tab.id }).catch(error => {
      if (process.env['NODE_ENV'] === 'development') {
        console.error('Failed to open side panel:', error);
      }
    });
  }
});

// Handle messages from content scripts or sidebar
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (process.env['NODE_ENV'] === 'development') {
    console.log('Background received message:', message, 'from:', sender);
  }

  switch (message.type) {
    case 'GET_AUTH_TOKEN':
      // Handle auth token requests
      chrome.storage.sync
        .get(['authToken'])
        .then(result => {
          sendResponse({ token: result['authToken'] });
        })
        .catch(error => {
          if (process.env['NODE_ENV'] === 'development') {
            console.error('Failed to get auth token:', error);
          }
          sendResponse({ error: 'Failed to get auth token' });
        });
      return true; // Keep message channel open for async response

    case 'SET_AUTH_TOKEN':
      // Handle auth token storage
      chrome.storage.sync
        .set({ authToken: message.token })
        .then(() => {
          sendResponse({ success: true });
        })
        .catch(error => {
          if (process.env['NODE_ENV'] === 'development') {
            console.error('Failed to set auth token:', error);
          }
          sendResponse({ error: 'Failed to set auth token' });
        });
      return true;

    case 'CLEAR_AUTH_TOKEN':
      // Handle logout
      chrome.storage.sync
        .remove(['authToken'])
        .then(() => {
          sendResponse({ success: true });
        })
        .catch(error => {
          if (process.env['NODE_ENV'] === 'development') {
            console.error('Failed to clear auth token:', error);
          }
          sendResponse({ error: 'Failed to clear auth token' });
        });
      return true;

    default:
      if (process.env['NODE_ENV'] === 'development') {
        console.warn('Unknown message type:', message.type);
      }
      sendResponse({ error: 'Unknown message type' });
      return false;
  }
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes['authToken']) {
    if (process.env['NODE_ENV'] === 'development') {
      console.log('Auth token changed:', changes['authToken']);
    }

    // Notify all tabs about auth status change
    chrome.tabs.query({}, tabs => {
      tabs.forEach(tab => {
        if (tab.id !== undefined) {
          chrome.tabs
            .sendMessage(tab.id, {
              type: 'AUTH_STATUS_CHANGED',
              isAuthenticated: !!changes['authToken']?.newValue,
            })
            .catch(() => {
              // Ignore errors for tabs that don't have content script
            });
        }
      });
    });
  }
});

export {}; // Make this a module
