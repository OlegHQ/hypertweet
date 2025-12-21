# Extension Development Guidelines

## Code Standards

1. Write type-safe code - no `any` types allowed
2. Keep code short and simple - only implement what was asked
3. Understand new code added by the user before modifying
4. **NO backward compatibility** - delete old code, don't keep deprecated exports or shims
5. Prefix all API functions with `api` (e.g., `apiLogin`, `apiListTones`) for LSP clarity

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
<Button variant="ghost" size="sm">Cancel</Button>
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

All API functions in `api.ts` are prefixed with `api`:

```ts
import { apiLogin, apiRegister, apiListTones, apiCreateTone } from './api';

// Auth
apiLogin({ Email, Password })    // returns TokenRes
apiRegister({ Email, Password }) // returns { message }
apiRefresh({ RefreshToken })     // returns { token }

// Tones (protected - require auth)
apiListTones()                   // returns Tone[]
apiCreateTone({ Title, Instruction })
apiUpdateTone(id)({ Title, Instruction })
apiDeleteTone(id)()
apiToggleTone(id, enable)()
```
