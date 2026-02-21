import type { Skill } from "@/lib/types/skill";

export const zustandSkill: Skill = {
  id: "system-zustand",
  name: "Zustand State Management",
  description: "Zustand state management guidelines — stores, selectors, middleware, TypeScript patterns, best practices.",
  enabled: true,
  content: `## State Management: Zustand — MANDATORY

**You MUST use Zustand for ALL shared state. Do NOT use React Context, Redux, or other state libraries for shared state.**

### Setup
\`\`\`
import { create } from 'zustand'
\`\`\`

### Store Creation (TypeScript)
\`\`\`tsx
interface CounterStore {
  count: number
  increment: () => void
  reset: () => void
}

const useCounterStore = create<CounterStore>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  reset: () => set({ count: 0 }),
}))
\`\`\`

CRITICAL: Always use double parentheses \`create<T>()()\` in TypeScript — required for middleware compatibility.

### Critical Rules

**ALWAYS:**
* Create a separate store file per feature/domain (e.g. /stores/cartStore.ts, /stores/userStore.ts)
* Use selector functions: \`const count = useStore((state) => state.count)\`
* Use \`set\` with updater functions for derived state: \`set((state) => ({ count: state.count + 1 }))\`
* Use \`useState\` ONLY for local UI state (form inputs, toggles, modals)
* Use \`shallow\` from \`zustand/shallow\` when selecting multiple values
* Define separate interfaces for state and actions

**NEVER:**
* Use single parentheses \`create<T>(...)\` in TypeScript — breaks middleware types
* Mutate state directly — always return new objects
* Create new objects in selectors without \`shallow\` — causes infinite renders
* Use Zustand for server/fetched data — use TanStack Query or SWR instead
* Export the store instance — always export the hook

### Persist Middleware (localStorage)
\`\`\`tsx
import { persist, createJSONStorage } from 'zustand/middleware'

const useStore = create<MyStore>()(
  persist(
    (set) => ({ /* store */ }),
    { name: 'storage-key', storage: createJSONStorage(() => localStorage) },
  ),
)
\`\`\`

### Async Actions
\`\`\`tsx
const useStore = create<Store>()((set) => ({
  data: null,
  isLoading: false,
  fetchData: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/data')
      set({ data: await res.json(), isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },
}))
\`\`\`

### Slices Pattern (Large Stores)
\`\`\`tsx
import { StateCreator } from 'zustand'

const createBearSlice: StateCreator<BearSlice & FishSlice, [], [], BearSlice> = (set) => ({
  bears: 0,
  addBear: () => set((s) => ({ bears: s.bears + 1 })),
})

const useStore = create<BearSlice & FishSlice>()((...a) => ({
  ...createBearSlice(...a),
  ...createFishSlice(...a),
}))
\`\`\`

### Preventing Infinite Renders
\`\`\`tsx
// WRONG — new object every render
const { a, b } = useStore((s) => ({ a: s.a, b: s.b }))

// CORRECT — use shallow
import { shallow } from 'zustand/shallow'
const { a, b } = useStore((s) => ({ a: s.a, b: s.b }), shallow)

// CORRECT — select primitives separately
const a = useStore((s) => s.a)
const b = useStore((s) => s.b)
\`\`\``,
};
