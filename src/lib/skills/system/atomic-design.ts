import type { Skill } from "@/lib/types/skill";

export const atomicDesignSkill: Skill = {
  id: "system-atomic-design",
  name: "Atomic Design",
  description: "Atomic Design architecture — atoms, molecules, organisms, templates hierarchy with examples.",
  enabled: true,
  content: `## Architecture: Atomic Design — MANDATORY

**You MUST follow Atomic Design methodology (Brad Frost). Do NOT put all code in App.jsx — this is a hard requirement.**

### Directory Structure
\`\`\`
/components/
  atoms/        — Smallest indivisible UI elements
  molecules/    — Combinations of 2+ atoms
  organisms/    — Complex sections composed of molecules + atoms
  templates/    — Page-level layout components
\`\`\`

### Atoms (Building Blocks)
Smallest reusable UI elements. Each atom is its own file. They accept props but contain no business logic.
* Button.jsx, Input.jsx, Label.jsx, Icon.jsx, Badge.jsx, Checkbox.jsx, Avatar.jsx, Spinner.jsx
* Text.jsx, Heading.jsx, Image.jsx, Link.jsx

\`\`\`tsx
// /components/atoms/Button.jsx
export function Button({ children, variant = 'primary', ...props }) {
  return <button className={buttonStyles[variant]} {...props}>{children}</button>
}
\`\`\`

### Molecules (Atom Combinations)
Groups of atoms functioning together as a unit. Each molecule is its own file.
* FormField.jsx (Label + Input + error text)
* SearchBar.jsx (Input + Button)
* TodoItem.jsx (Checkbox + Label + Button)
* NavLink.jsx (Icon + Link)
* UserBadge.jsx (Avatar + Text)

\`\`\`tsx
// /components/molecules/FormField.jsx
import { Label } from '@/components/atoms/Label'
import { Input } from '@/components/atoms/Input'

export function FormField({ label, error, ...inputProps }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input {...inputProps} />
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  )
}
\`\`\`

### Organisms (Complex Sections)
Major UI sections composed of molecules and atoms. Contains layout logic but minimal business logic.
* Header.jsx, Sidebar.jsx, TodoList.jsx, CardGrid.jsx, LoginForm.jsx, ProductCard.jsx

### Templates (Page Layouts)
Page-level components that define layout structure. Receive organisms as children or props.
* MainLayout.jsx, DashboardTemplate.jsx, AuthLayout.jsx

### Critical Rules

**ALWAYS:**
* App.jsx ONLY imports and composes top-level organisms or templates — NO inline UI elements
* Create atoms FIRST, then molecules, then organisms, then templates
* Each component lives in its own file at the correct atomic level
* Use the @/ import alias: \`import { Button } from '@/components/atoms/Button'\`
* Even for small apps, extract at least atoms and molecules

**NEVER:**
* Put UI elements directly in App.jsx
* Skip atomic levels — don't jump from atoms to organisms
* Put business logic in atoms or molecules
* Create "god components" that span multiple atomic levels
* Put multiple components in one file`,
};
