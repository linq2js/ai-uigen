import type { Skill } from "@/lib/types/skill";

export const reactContextSkill: Skill = {
  id: "system-react-context",
  name: "React Context State Management",
  description: "React Context + useReducer state management — providers, reducers, typed context patterns.",
  enabled: true,
  content: `## State Management: React Context — MANDATORY

**You MUST use React Context + useReducer for ALL shared state. Do NOT use Redux, Zustand, or other state libraries.**

### Context + Reducer Pattern
\`\`\`tsx
// types
interface Todo { id: string; text: string; done: boolean }

type TodoAction =
  | { type: 'ADD'; text: string }
  | { type: 'TOGGLE'; id: string }
  | { type: 'DELETE'; id: string }

interface TodoContextValue {
  todos: Todo[]
  dispatch: React.Dispatch<TodoAction>
}

// context
const TodoContext = createContext<TodoContextValue | null>(null)

// reducer
function todoReducer(state: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case 'ADD':
      return [...state, { id: crypto.randomUUID(), text: action.text, done: false }]
    case 'TOGGLE':
      return state.map((t) => t.id === action.id ? { ...t, done: !t.done } : t)
    case 'DELETE':
      return state.filter((t) => t.id !== action.id)
  }
}

// provider
function TodoProvider({ children }: { children: React.ReactNode }) {
  const [todos, dispatch] = useReducer(todoReducer, [])
  const value = useMemo(() => ({ todos, dispatch }), [todos])
  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>
}

// custom hook with safety check
function useTodos() {
  const ctx = useContext(TodoContext)
  if (!ctx) throw new Error('useTodos must be used within TodoProvider')
  return ctx
}
\`\`\`

### Critical Rules

**ALWAYS:**
* Create a dedicated file per context (e.g. /contexts/TodoContext.tsx)
* Use \`useReducer\` for complex state with multiple actions — not \`useState\`
* Use discriminated union types for actions (\`type: 'ADD' | 'TOGGLE'\`)
* Wrap the context value in \`useMemo\` to prevent unnecessary re-renders
* Create a custom hook for each context (e.g. \`useTodos\`) with a null check
* Keep contexts focused — one context per domain (auth, todos, theme)
* Use \`useState\` ONLY for local UI state (form inputs, toggles)

**NEVER:**
* Create a single global context for all app state — split by domain
* Wrap the entire app in every provider — wrap only where needed
* Pass dispatch directly to deeply nested children without memoization
* Store derived data in state — compute it during render
* Forget the null check in custom hooks

### Splitting Read and Write Contexts (Performance)
\`\`\`tsx
const TodoStateContext = createContext<Todo[] | null>(null)
const TodoDispatchContext = createContext<React.Dispatch<TodoAction> | null>(null)

function TodoProvider({ children }: { children: React.ReactNode }) {
  const [todos, dispatch] = useReducer(todoReducer, [])
  return (
    <TodoStateContext.Provider value={todos}>
      <TodoDispatchContext.Provider value={dispatch}>
        {children}
      </TodoDispatchContext.Provider>
    </TodoStateContext.Provider>
  )
}
\`\`\`

This prevents components that only dispatch actions from re-rendering when state changes.

### Provider Composition
\`\`\`tsx
function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <TodoProvider>
          {children}
        </TodoProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
\`\`\``,
};
