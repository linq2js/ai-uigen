import type { Skill } from "@/lib/types/skill";

export const cleanArchitectureSkill: Skill = {
  id: "system-clean-architecture",
  name: "Clean Architecture",
  description: "Clean Architecture — components, hooks, services, utils separation with dependency rules.",
  enabled: true,
  content: `## Architecture: Clean Architecture — MANDATORY

**You MUST organize code into clean architecture layers. Do NOT put all code in App.jsx.**

### Directory Structure
\`\`\`
/components/    — Pure UI/presentational components (NO business logic)
/hooks/         — Custom hooks with business logic and state
/services/      — Data fetching, API calls, transformations
/utils/         — Pure helper functions, no side effects
/types/         — TypeScript interfaces and type definitions
\`\`\`

### Layer Rules (Dependency Direction)

Components → Hooks → Services → Utils

Each layer may only depend on layers below it, never above.

### Components Layer (Presentational)
* Pure UI — receives ALL data and callbacks via props
* NO direct API calls, NO business logic, NO state management beyond local UI state
* Focus on rendering, layout, and user interaction

\`\`\`tsx
// /components/TodoList.jsx — pure presentational
export function TodoList({ todos, onToggle, onDelete }) {
  return (
    <ul>
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onDelete={onDelete} />
      ))}
    </ul>
  )
}
\`\`\`

### Hooks Layer (Business Logic)
* Custom hooks that orchestrate business logic
* Call services for data, manage state, handle side effects
* Components consume hooks, never call services directly

\`\`\`tsx
// /hooks/useTodos.ts
export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    todoService.getAll().then((data) => {
      setTodos(data)
      setLoading(false)
    })
  }, [])

  const toggle = (id: string) => {
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t))
  }

  return { todos, loading, toggle }
}
\`\`\`

### Services Layer (Data Access)
* All API calls, data fetching, and external integrations
* Pure data transformation — no React code, no hooks, no JSX
* Returns typed data

\`\`\`tsx
// /services/todoService.ts
export const todoService = {
  getAll: async (): Promise<Todo[]> => {
    const res = await fetch('/api/todos')
    return res.json()
  },
  create: async (text: string): Promise<Todo> => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
    return res.json()
  },
}
\`\`\`

### Utils Layer
* Pure functions with no side effects — formatting, validation, calculations
* No React imports, no API calls

### Critical Rules

**ALWAYS:**
* App.jsx ONLY composes top-level components — minimal code, NO inline logic
* Every component is purely presentational — data and callbacks via props
* ALL business logic in custom hooks
* ALL data fetching in the services layer
* Separate files for each component, hook, and service

**NEVER:**
* Put fetch/API calls in components
* Put business logic in components
* Import services directly in components — always go through hooks
* Mix layers — a service should never import a component or hook`,
};
