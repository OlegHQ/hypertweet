# EXTENSION_SIDEBAR_UI - Initial Implementation Plan

## Project Overview

Create a Chrome extension sidebar UI for user authentication, tone management, and account administration. The sidebar will communicate with the Rust backend API and provide a seamless user experience for managing AI response generation settings.

---

## 🏗️ **Phase 1: Project Setup & Dependencies**

### Dependencies & Package Management

- [ ] Add React 18+ with TypeScript support
- [ ] Add Emotion for CSS-in-JS styling (`@emotion/react`, `@emotion/styled`)
- [ ] Add form validation library (`react-hook-form` + `@hookform/resolvers`)
- [ ] Add HTTP client library (built-in `fetch` with custom wrapper)
- [ ] Add Chrome types (`@types/chrome`)
- [ ] Update existing build dependencies for multi-entry bundling

### Build System Updates

- [ ] Update `justfile` to include sidebar build commands
- [ ] Modify esbuild configuration for multiple entry points:
  - [ ] `extension/content.ts` → `extension/dist/content.js`
  - [ ] `extension/sidebar.tsx` → `extension/dist/sidebar.js`
- [ ] Create `extension/sidebar.html` template with React root
- [ ] Update esbuild to handle JSX/TSX files and Emotion
- [ ] Add separate build commands:
  - [ ] `just build-sidebar` - Build sidebar only
  - [ ] `just watch-sidebar` - Watch sidebar with hot reload
  - [ ] `just build-all` - Build content script + sidebar

### Manifest Updates

- [ ] Update `manifest.json` for Manifest V3 sidebar permissions:
  - [ ] Add `sidePanel` permission
  - [ ] Add `storage` permission for token storage
  - [ ] Add `identity` permission if needed for OAuth
  - [ ] Add sidebar declaration in manifest
- [ ] Configure CSP for React and Emotion

---

## 🔐 **Phase 2: Authentication Infrastructure**

### Chrome Storage Integration

- [ ] Create `auth/storage.ts` utility for token management:
  - [ ] `saveAuthToken(token: string)` - Store JWT in chrome.storage.sync
  - [ ] `getAuthToken()` - Retrieve stored token
  - [ ] `clearAuthToken()` - Remove token on logout
  - [ ] `isTokenValid(token: string)` - Basic JWT expiration check

### API Communication Layer

- [ ] Create `api/client.ts` with authenticated fetch wrapper:
  - [ ] Base API client with automatic token injection
  - [ ] Request/response interceptors for auth headers
  - [ ] Error handling for 401/403 responses
  - [ ] Automatic token refresh logic
  - [ ] TypeScript interfaces for API responses

### Authentication API Endpoints

- [ ] `api/auth.ts` - Authentication endpoint wrappers:
  - [ ] `login(email: string, password: string)` → JWT token
  - [ ] `register(email: string, password: string)` → User creation
  - [ ] `refreshToken()` → New JWT token
  - [ ] `logout()` → Token invalidation
  - [ ] `getUserProfile()` → Current user info

---

## 🎨 **Phase 3: UI Components & Styling**

### Emotion Styling Setup

- [ ] Create `styles/theme.ts` with design system:
  - [ ] Color palette (primary, secondary, error, success)
  - [ ] Typography scale and font families
  - [ ] Spacing scale and breakpoints
  - [ ] Component variants and states
- [ ] Create `styles/global.ts` with global styles and CSS reset
- [ ] Create reusable styled components in `components/common/`:
  - [ ] `Button` with variants (primary, secondary, danger)
  - [ ] `Input` with validation states
  - [ ] `Card` container component
  - [ ] `Loading` spinner component
  - [ ] `Alert` for error/success messages

### Form Components

- [ ] Create `components/forms/` directory:
  - [ ] `LoginForm.tsx` - Email/password with validation
  - [ ] `RegisterForm.tsx` - Email/password/confirm with validation
  - [ ] `PasswordChangeForm.tsx` - Current/new password fields
  - [ ] `ProfileEditForm.tsx` - User profile editing
- [ ] Implement form validation with react-hook-form
- [ ] Add loading states and error handling to all forms

### Layout Components

- [ ] Create `components/layout/` directory:
  - [ ] `Sidebar.tsx` - Main container with navigation
  - [ ] `Header.tsx` - Top bar with user info and logout
  - [ ] `Navigation.tsx` - Side navigation menu
  - [ ] `PageContainer.tsx` - Content area wrapper

---

## 📱 **Phase 4: Screen Implementation**

### Authentication Screens

- [ ] `screens/auth/LoginScreen.tsx`:
  - [ ] Email/password form with validation
  - [ ] "Remember me" checkbox
  - [ ] "Forgot password" link (if implemented)
  - [ ] Link to registration screen
  - [ ] Loading states and error display
- [ ] `screens/auth/RegisterScreen.tsx`:
  - [ ] Email/password/confirm form
  - [ ] Terms of service checkbox
  - [ ] Link back to login screen
  - [ ] Success state after registration

### Main Dashboard

- [ ] `screens/DashboardScreen.tsx`:
  - [ ] Welcome message with user name
  - [ ] Quick stats (total tones, recent usage)
  - [ ] Navigation to tone editor and account settings
  - [ ] Recent activity or quick actions

### Tone Management

- [ ] `screens/tones/ToneListScreen.tsx`:
  - [ ] List of user's custom tones
  - [ ] Search/filter functionality
  - [ ] "Create new tone" button
  - [ ] Edit/delete actions for each tone
- [ ] `screens/tones/ToneEditorScreen.tsx`:
  - [ ] Tone name and description fields
  - [ ] Tone content/prompt editor (large textarea)
  - [ ] Preview functionality (mock response generation)
  - [ ] Save/cancel buttons
  - [ ] Delete confirmation for existing tones

### Account Management

- [ ] `screens/account/ProfileScreen.tsx`:
  - [ ] Display and edit user profile information
  - [ ] Email change functionality
  - [ ] Account creation date and stats
- [ ] `screens/account/SecurityScreen.tsx`:
  - [ ] Password change form
  - [ ] Active sessions display
  - [ ] Two-factor authentication (future)
- [ ] `screens/account/SettingsScreen.tsx`:
  - [ ] General extension preferences
  - [ ] Default tone selection
  - [ ] Notification settings
- [ ] `screens/account/BillingScreen.tsx` (if needed):
  - [ ] Usage statistics and limits
  - [ ] Subscription management

---

## 🔄 **Phase 5: State Management**

### Authentication State

- [ ] Create `store/auth.ts` with context/hooks:
  - [ ] `useAuth()` hook for authentication state
  - [ ] Login/logout actions
  - [ ] Token refresh handling
  - [ ] User profile state management

### Application State

- [ ] Create `store/tones.ts` for tone management:
  - [ ] List of user tones
  - [ ] CRUD operations
  - [ ] Loading and error states
- [ ] Create `store/ui.ts` for UI state:
  - [ ] Current active screen
  - [ ] Modal/popup state
  - [ ] Global loading states
  - [ ] Notification/alert state

### Route Management

- [ ] Create simple routing system or use React Router:
  - [ ] Route definitions for all screens
  - [ ] Protected routes (require authentication)
  - [ ] Navigation helpers
  - [ ] URL state synchronization

---

## 🌐 **Phase 6: API Integration**

### Tone Management API

- [ ] `api/tones.ts` - Tone CRUD operations:
  - [ ] `getTones()` - Fetch user's tones
  - [ ] `createTone(tone: ToneData)` - Create new tone
  - [ ] `updateTone(id: string, tone: ToneData)` - Update existing tone
  - [ ] `deleteTone(id: string)` - Delete tone
  - [ ] `previewTone(tone: ToneData, context: string)` - Generate preview

### User Management API

- [ ] `api/user.ts` - User profile and account operations:
  - [ ] `updateProfile(profile: UserProfile)` - Update user info
  - [ ] `changePassword(oldPassword: string, newPassword: string)`
  - [ ] `deleteAccount()` - Account deletion
  - [ ] `getUsageStats()` - Usage statistics and limits

### Error Handling & Retry Logic

- [ ] Implement comprehensive error handling:
  - [ ] Network error detection and user feedback
  - [ ] Retry logic for failed requests
  - [ ] Token expiration handling with automatic refresh
  - [ ] Graceful degradation for offline scenarios

---

## 🧪 **Phase 7: Testing & Quality Assurance**

### Component Testing

- [ ] Set up testing framework (Jest + React Testing Library)
- [ ] Write unit tests for utility functions
- [ ] Write integration tests for authentication flow
- [ ] Write component tests for critical UI components

### Manual Testing Scenarios

- [ ] Authentication flow testing:
  - [ ] Successful login/logout
  - [ ] Invalid credentials handling
  - [ ] Token expiration and refresh
  - [ ] Registration flow
- [ ] Tone management testing:
  - [ ] CRUD operations for tones
  - [ ] Form validation and error handling
  - [ ] Preview functionality
- [ ] Cross-browser compatibility testing
- [ ] Extension installation and permissions testing

---

## 🎯 **Phase 8: Polish & Launch Preparation**

### UI/UX Polish

- [ ] Responsive design for different sidebar widths
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)
- [ ] Loading states and skeleton screens
- [ ] Smooth transitions and animations
- [ ] Error state illustrations and helpful messaging

### Performance Optimization

- [ ] Bundle size optimization
- [ ] Lazy loading for non-critical components
- [ ] API request caching where appropriate
- [ ] Chrome storage optimization

### Documentation & Deployment

- [ ] Update CLAUDE.md with sidebar development instructions
- [ ] Create user documentation for sidebar features
- [ ] Prepare for Chrome Web Store submission
- [ ] Set up CI/CD for automated builds

---

## 📋 **Development Commands (Post-Implementation)**

```bash
# Sidebar-specific development
just watch-sidebar        # Watch sidebar with hot reload
just build-sidebar        # Build sidebar for production
just test-sidebar         # Run sidebar tests

# Full extension development
just build-all            # Build content script + sidebar
just watch-all            # Watch both content script and sidebar
just test-all             # Run all tests

# Existing commands remain unchanged
just build                # Build content script only
just watch                # Watch content script only
```

## 🏆 **Success Criteria**

- [ ] Users can successfully authenticate and maintain session
- [ ] Token storage and refresh works seamlessly
- [ ] All tone management operations work correctly
- [ ] Account management features are fully functional
- [ ] UI is responsive and accessible
- [ ] Error handling provides clear user feedback
- [ ] Extension passes Chrome Web Store review guidelines
- [ ] Build system supports efficient development workflow
