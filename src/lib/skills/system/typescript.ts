import type { Skill } from "@/lib/types/skill";

export const typescriptSkill: Skill = {
  id: "system-typescript",
  name: "TypeScript",
  description: "TypeScript code quality — typed props, events, state, generics, utility types.",
  enabled: true,
  content: `## Code Quality: TypeScript — MANDATORY

**Write ALL code in TypeScript. Use .tsx for components, .ts for utilities.**

### Component Props
\`\`\`tsx
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick?: () => void
}

export function Button({ children, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return <button {...props}>{children}</button>
}
\`\`\`

### Event Handlers
\`\`\`tsx
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { ... }
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { ... }
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => { ... }
const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { ... }
\`\`\`

### State Typing
\`\`\`tsx
const [count, setCount] = useState(0)              // inferred as number
const [user, setUser] = useState<User | null>(null) // explicit for complex/nullable
const [items, setItems] = useState<Item[]>([])      // explicit for arrays
\`\`\`

### Common Patterns
\`\`\`tsx
// Children prop
interface LayoutProps { children: React.ReactNode }

// Extending HTML elements
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

// Generic components
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
}
function List<T>({ items, renderItem }: ListProps<T>) { ... }

// Discriminated unions for state
type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User[] }
  | { status: 'error'; error: string }
\`\`\`

### Utility Types
\`\`\`tsx
Partial<T>       // All properties optional
Required<T>      // All properties required
Pick<T, K>       // Select specific properties
Omit<T, K>       // Exclude specific properties
Record<K, V>     // Object type with key K and value V
\`\`\`

### Critical Rules

**ALWAYS:**
* Define interfaces for all component props
* Type event handlers with React event types
* Use union types for constrained values: \`'sm' | 'md' | 'lg'\`
* Use \`React.ReactNode\` for children props
* Extend native HTML attributes when wrapping elements

**NEVER:**
* Use \`any\` — use \`unknown\` with type guards or specific types
* Use \`Function\` type — use specific signatures \`() => void\`
* Use \`object\` type — define specific interfaces
* Leave function parameters untyped`,
};
