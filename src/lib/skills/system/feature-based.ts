import type { Skill } from "@/lib/types/skill";

export const featureBasedSkill: Skill = {
  id: "system-feature-based",
  name: "Feature-Based Architecture",
  description: "Feature-Based architecture — organize by domain/feature with shared modules and co-location.",
  enabled: true,
  content: `## Architecture: Feature-Based — MANDATORY

**You MUST organize code by feature/domain. Do NOT put all code in App.jsx or organize primarily by file type.**

### Directory Structure
\`\`\`
/features/
  auth/
    components/     — UI components specific to auth
    hooks/          — Custom hooks for auth logic
    utils/          — Auth-specific helpers
    types.ts        — Auth type definitions
    index.ts        — Public API (re-exports)
  dashboard/
    components/
    hooks/
    utils/
    types.ts
    index.ts
  cart/
    components/
    hooks/
    utils/
    types.ts
    index.ts
/shared/
  components/       — Reusable UI (Button, Modal, Input, etc.)
  hooks/            — Shared hooks (useLocalStorage, useDebounce, etc.)
  utils/            — Shared helpers (formatDate, classNames, etc.)
  types/            — Shared type definitions
\`\`\`

### Feature Module Rules

Each feature is self-contained:
\`\`\`tsx
// /features/auth/index.ts — public API
export { LoginForm } from './components/LoginForm'
export { useAuth } from './hooks/useAuth'
export type { User, AuthState } from './types'
\`\`\`

### Cross-Feature Communication
* Features communicate ONLY through /shared/ — never import directly between features
* Shared state that spans features goes in /shared/hooks/ or a state management store

\`\`\`tsx
// WRONG — direct cross-feature import
import { useAuth } from '@/features/auth/hooks/useAuth'  // from inside /features/dashboard/

// CORRECT — either re-export through shared or use feature's public API
import { useAuth } from '@/features/auth'
\`\`\`

### Feature Component Example
\`\`\`tsx
// /features/cart/components/CartSummary.tsx
import { Button } from '@/shared/components/Button'
import { useCart } from '../hooks/useCart'
import { formatPrice } from '../utils/formatPrice'

export function CartSummary() {
  const { items, total } = useCart()
  return (
    <div>
      <p>{items.length} items — {formatPrice(total)}</p>
      <Button>Checkout</Button>
    </div>
  )
}
\`\`\`

### Critical Rules

**ALWAYS:**
* App.jsx ONLY imports and composes top-level feature components
* Each feature directory is self-contained with its own components, hooks, utils
* Use an index.ts barrel file as the feature's public API
* Cross-feature imports go through /shared/ or the feature's index.ts
* Co-locate tests, types, and utils with their feature
* Separate files — one component per file

**NEVER:**
* Import directly between feature internals (bypassing index.ts)
* Put feature-specific code in /shared/
* Create a feature that depends on multiple other features' internals
* Organize primarily by file type (/components/, /hooks/ at root) — organize by feature first`,
};
