# Extension Development Guidelines

## Code Standards

1. Write type-safe code - no `any` types allowed
2. Keep code short and simple - only implement what was asked
3. Understand new code added by the user before modifying
4. **NO backward compatibility** - delete old code, don't keep deprecated exports or shims

## UI Component Architecture

### Styling Approach

**Critical**: This extension injects UI into Twitter, Reddit, and LinkedIn pages. Host page CSS will conflict with our styles. We use injected `<style>` tags with `!important` on all properties.

- **DO NOT** use Emotion's `styled` components for injected UI - they don't guarantee `!important`
- **DO** use class names with `ht-` prefix (e.g., `ht-btn`, `ht-card`, `ht-input`)
- **DO** define all styles in `ui/styles.ts` via `injectGlobalStyles()` with `!important` on every property

### File Structure

```
ui/
├── tokens.ts          # Design tokens (colors, spacing, fonts) - shadcn-inspired
├── styles.ts          # Global CSS injection with !important
├── emotion.ts         # Emotion cache (used for CacheProvider, not for styling)
├── hooks/
│   └── useAuth.ts     # Chrome storage auth hook (key: 'hypertweet.token')
└── components/
    ├── Button.tsx     # Uses className="ht-btn ht-btn-{variant}"
    ├── Card.tsx       # Uses className="ht-card"
    ├── Input.tsx      # Uses className="ht-input"
    ├── Modal.tsx      # Portal with injected styles
    └── LoginForm.tsx  # Composed from Button, Input
```

### Component Patterns

**Button variants**: `default`, `secondary`, `ghost`, `destructive`
**Button sizes**: `sm`, `default`, `lg`

```tsx
<Button variant="ghost" size="sm">
  Cancel
</Button>
```

**Modal**: Uses React Portal to `#hypertweet-modal-root`, injects its own styles via `injectModalStyles()`.

```tsx
<Modal isOpen={showLogin} onClose={() => setShowLogin(false)}>
  <LoginForm onSuccess={handleSuccess} onClose={handleClose} />
</Modal>
```

### Design Tokens (shadcn-inspired)

Located in `ui/tokens.ts`:

- **Primary**: `#2563EB` (blue)
- **Background**: `#09090B` (near black)
- **Card**: `#18181B` (dark gray)
- **Foreground**: `#FAFAFA` (white)
- **Border**: `#27272A`
- **Destructive**: `#EF4444` (red)

### Adding New Components

1. Add styles to `ui/styles.ts` with `ht-` prefix and `!important` on all properties
2. Create component in `ui/components/` using class names only
3. Use Framer Motion for animations (`motion.div`, `whileTap`, etc.)

Example style block:

```ts
.ht-new-component {
  background: ${tokens.colors.card} !important;
  padding: ${tokens.spacing[4]} !important;
  /* ... all properties need !important */
}
```

### Chrome Storage

Auth token stored at `hypertweet.token` in `chrome.storage.local`.

```ts
const { token, isLoading, login, logout } = useAuth();
```

### Permissions

Manifest requires: `"permissions": ["activeTab", "storage"]`

## API

### Architecture

- **`api.ts`** - Core API functions (runs in background script only)
- **`apiProxy.ts`** - Proxy for content scripts to call API via message passing
- **`background.ts`** - Background script that exposes api.ts functions

Content scripts use `apiProxy.ts` to avoid mixed content issues (HTTP API from HTTPS pages).

### Usage

```ts
import { api } from './apiProxy';

// Auth
api.login({ email, password }); // returns TokenRes
api.register({ email, password }); // returns { message }
api.saveTokens(tokenRes); // stores tokens in chrome.storage
api.clearTokens(); // removes tokens

// Tones (protected - require auth)
api.listTones(); // returns Tone[]
api.createTone({ title, instruction });
api.updateTone(id, { title, instruction });
api.deleteTone(id);
api.toggleTone(id, enable);
```

### API Response Types (camelCase)

```ts
interface TokenRes {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
interface Tone {
  id: string;
  title: string;
  instruction: string;
  isDefault: boolean;
}
```

## React Query

Use TanStack React Query for all API interactions. QueryClientProvider is set up in `content.ts`.

### Query Client Config (`ui/query.ts`)

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 },
  },
});
```

### Queries (for fetching data)

Create hooks in `ui/hooks/`:

```ts
// ui/hooks/useTones.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../../apiProxy';

export function useTones(enabled: boolean) {
  return useQuery<Tone[]>({
    queryKey: ['tones'],
    queryFn: () => api.listTones() as Promise<Tone[]>,
    enabled,
  });
}
```

Usage:

```tsx
const { data: tones = [], isLoading, error } = useTones(!!token);
```

### Mutations (for creating/updating/deleting)

Use `useMutation` inline or in hooks:

```tsx
const loginMutation = useMutation({
  mutationFn: async () => {
    const result = (await api.login({ email, password })) as TokenRes;
    await api.saveTokens(result);
    return result;
  },
  onSuccess: res => onSuccess(res.accessToken),
  onError: () => setError('Invalid email or password'),
});

// Trigger with:
loginMutation.mutate();

// Check state:
loginMutation.isPending;
```

### Invalidating/Clearing Cache

```ts
const queryClient = useQueryClient();

// Invalidate specific query (refetch)
queryClient.invalidateQueries({ queryKey: ['tones'] });

// Clear all cache (e.g., on logout)
queryClient.clear();
```

### Best Practices

1. **Query keys**: Use descriptive arrays like `['tones']`, `['tone', id]`
2. **Enabled flag**: Disable queries until auth is ready: `enabled: !!token`
3. **Type the response**: `useQuery<Tone[]>({ ... })`
4. **Handle loading/error**: Destructure `isLoading`, `error` from query result
5. **Mutations for side effects**: Never use `useQuery` for POST/PUT/DELETE
6. **Clear cache on logout**: Call `queryClient.clear()` to reset state

## Raw Scraper Files (\*.raw.js)

The `twitter.raw.js`, `reddit.raw.js`, and `linkedin.raw.js` files are **self-contained** vanilla JavaScript scrapers designed for:

1. **Console debugging** - Copy-paste entire file into browser DevTools to test selectors
2. **No dependencies** - Each file must work standalone without imports
3. **Duplication is intentional** - Shared utilities like `waitForSelector()` are duplicated in each file to maintain copy-paste capability

**DO NOT** refactor these files to share code or reduce duplication. The duplication is a deliberate design choice.
