import type { Skill } from "@/lib/types/skill";

export const typescriptStrictSkill: Skill = {
  id: "system-typescript-strict",
  name: "TypeScript Strict",
  description: "Strict TypeScript — no any, discriminated unions, readonly, generics, exhaustive checks.",
  enabled: true,
  content: `## Code Quality: TypeScript Strict — MANDATORY

**Write ALL code in strict TypeScript. Use .tsx for components, .ts for utilities. Zero tolerance for type safety shortcuts.**

### Strict Configuration
Assume these tsconfig.json options are enabled:
\`\`\`json
{ "strict": true, "noUncheckedIndexedAccess": true, "exactOptionalPropertyTypes": true }
\`\`\`

### Component Props (Strict)
\`\`\`tsx
interface ButtonProps {
  readonly children: React.ReactNode
  readonly variant: 'primary' | 'secondary' | 'ghost'
  readonly size?: 'sm' | 'md' | 'lg'
  readonly disabled?: boolean
  readonly onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}
\`\`\`

### Discriminated Unions (Required for Complex State)
\`\`\`tsx
type AsyncState<T> =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly data: T }
  | { readonly status: 'error'; readonly error: string }

function UserProfile({ state }: { state: AsyncState<User> }) {
  switch (state.status) {
    case 'idle': return <p>Not started</p>
    case 'loading': return <Spinner />
    case 'success': return <Profile user={state.data} />
    case 'error': return <ErrorMessage message={state.error} />
  }
}
\`\`\`

### Exhaustive Checks
\`\`\`tsx
function assertNever(x: never): never {
  throw new Error(\`Unexpected value: \${x}\`)
}

// Use in switch statements to catch unhandled cases at compile time
switch (action.type) {
  case 'ADD': return handleAdd(action)
  case 'DELETE': return handleDelete(action)
  default: return assertNever(action)
}
\`\`\`

### Readonly & Immutability
\`\`\`tsx
interface AppState {
  readonly users: readonly User[]
  readonly selectedId: string | null
  readonly filters: Readonly<FilterOptions>
}

// Use Readonly<T> for deeply immutable objects
// Use readonly arrays: readonly string[]
// Mark all interface properties as readonly
\`\`\`

### Generic Components
\`\`\`tsx
interface SelectProps<T extends string> {
  readonly options: readonly { readonly value: T; readonly label: string }[]
  readonly value: T
  readonly onChange: (value: T) => void
}

function Select<T extends string>({ options, value, onChange }: SelectProps<T>) { ... }

// Usage infers T from options
<Select options={[{ value: 'asc', label: 'Ascending' }, { value: 'desc', label: 'Descending' }]} ... />
\`\`\`

### Type Guards
\`\`\`tsx
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value && 'name' in value
}

// Use with unknown instead of any
function processResponse(data: unknown) {
  if (isUser(data)) {
    // TypeScript now knows data is User
    console.log(data.name)
  }
}
\`\`\`

### Branded/Opaque Types
\`\`\`tsx
type UserId = string & { readonly __brand: 'UserId' }
type PostId = string & { readonly __brand: 'PostId' }

function createUserId(id: string): UserId { return id as UserId }

// Prevents accidentally passing PostId where UserId is expected
function getUser(id: UserId): Promise<User> { ... }
\`\`\`

### Critical Rules

**ALWAYS:**
* Mark ALL interface properties as \`readonly\`
* Use discriminated unions for state machines and complex state
* Use exhaustive checks with \`assertNever\` in switch statements
* Use \`readonly\` arrays: \`readonly string[]\`
* Use type guards with \`unknown\` — never cast with \`as\`
* Export types alongside their components

**NEVER:**
* Use \`any\` — always use \`unknown\` with type guards
* Use type assertions (\`as T\`) — use type narrowing instead
* Use \`object\` or \`Function\` types — use specific signatures
* Use non-null assertion (\`!\`) — handle null explicitly
* Use \`enum\` — use string union types or \`as const\` objects instead`,
};
