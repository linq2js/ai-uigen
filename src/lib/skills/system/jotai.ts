import type { Skill } from "@/lib/types/skill";

export const jotaiSkill: Skill = {
  id: "system-jotai",
  name: "Jotai State Management",
  description: "Jotai state management guidelines — atoms, derived atoms, async atoms, TypeScript patterns.",
  enabled: true,
  content: `## State Management: Jotai — MANDATORY

**You MUST use Jotai for ALL shared state. Do NOT use React Context, Redux, Zustand, or other state libraries for shared state.**

### Setup
\`\`\`
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
\`\`\`

### Primitive Atoms
\`\`\`tsx
// Define atoms at module level, NOT inside components
const countAtom = atom(0)
const nameAtom = atom('')
const todosAtom = atom<Todo[]>([])

// Use in components
function Counter() {
  const [count, setCount] = useAtom(countAtom)
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>
}
\`\`\`

### Derived (Read-Only) Atoms
\`\`\`tsx
const doubleCountAtom = atom((get) => get(countAtom) * 2)
const completedTodosAtom = atom((get) => get(todosAtom).filter((t) => t.done))
\`\`\`

### Writable Derived Atoms
\`\`\`tsx
const uppercaseAtom = atom(
  (get) => get(nameAtom).toUpperCase(),
  (_get, set, newName: string) => set(nameAtom, newName.trim()),
)
\`\`\`

### Async Atoms (with React Suspense)
\`\`\`tsx
const userAtom = atom(async () => {
  const res = await fetch('/api/user')
  return res.json()
})

// Dependent async atom
const postsAtom = atom(async (get) => {
  const user = await get(userAtom)
  const res = await fetch(\`/api/posts?userId=\${user.id}\`)
  return res.json()
})
\`\`\`

### Critical Rules

**ALWAYS:**
* Define atoms at module level in dedicated files (e.g. /atoms/todoAtoms.ts)
* Use \`useAtomValue\` for read-only access and \`useSetAtom\` for write-only — avoids unnecessary re-renders
* Use derived atoms for computed/filtered state
* Group related atoms in the same file by domain
* Use \`useState\` ONLY for local UI state (form inputs, toggles)

**NEVER:**
* Define atoms inside component render functions — causes new atom identity each render
* Store derived data that can be computed — use derived atoms instead
* Use \`useAtom\` when you only need to read or write (not both)
* Pass atoms through props — import them directly where needed

### Write-Only Atoms (Actions)
\`\`\`tsx
const addTodoAtom = atom(null, (get, set, text: string) => {
  const todos = get(todosAtom)
  set(todosAtom, [...todos, { id: Date.now(), text, done: false }])
})

function AddTodo() {
  const addTodo = useSetAtom(addTodoAtom)
  return <button onClick={() => addTodo('New task')}>Add</button>
}
\`\`\`

### Atom with localStorage Persistence
\`\`\`tsx
import { atomWithStorage } from 'jotai/utils'

const themeAtom = atomWithStorage<'light' | 'dark'>('theme', 'light')
\`\`\`

### TypeScript
* Primitive atoms infer types automatically: \`atom(0)\` → \`PrimitiveAtom<number>\`
* Explicitly type complex atoms: \`atom<Todo[]>([])\`
* Enable \`strictNullChecks\` in tsconfig.json for best type inference`,
};
