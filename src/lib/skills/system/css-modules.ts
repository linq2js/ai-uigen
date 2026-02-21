import type { Skill } from "@/lib/types/skill";

export const cssModulesSkill: Skill = {
  id: "system-css-modules",
  name: "CSS Modules",
  description: "CSS Modules framework guidelines — scoped styles, composition, naming, theming.",
  enabled: true,
  content: `## CSS Framework: CSS Modules — MANDATORY

**Do NOT use Tailwind CSS classes. Use CSS Modules for ALL styling.**

### File Structure
* Create \`.module.css\` files alongside components: \`Button.module.css\` next to \`Button.tsx\`
* Import as: \`import styles from './Button.module.css'\`
* Apply as: \`className={styles.container}\`

### Naming Conventions
* Use camelCase for class names: \`.primaryButton\`, \`.cardTitle\`, \`.navLink\`
* Be descriptive: \`.submitButton\` not \`.btn1\`
* Component-scoped — no need for BEM prefixes since CSS Modules auto-scopes

### Composition (Style Reuse)
\`\`\`css
/* shared.module.css */
.baseButton { padding: 8px 16px; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; }

/* Button.module.css */
.primary { composes: baseButton from './shared.module.css'; background: #2563eb; color: white; }
.secondary { composes: baseButton from './shared.module.css'; background: #f1f5f9; color: #1e293b; }
\`\`\`

### Dynamic Classes
Use the \`classnames\` or \`clsx\` library for conditional classes:
\`\`\`tsx
import styles from './Button.module.css'
import clsx from 'clsx'

<button className={clsx(styles.button, isActive && styles.active, size === 'lg' && styles.large)}>
\`\`\`

### Theming with CSS Variables
\`\`\`css
/* theme.module.css */
.root {
  --color-primary: #2563eb;
  --color-bg: #ffffff;
  --color-text: #1e293b;
  --radius: 8px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
}

/* Button.module.css */
.button {
  background: var(--color-primary);
  border-radius: var(--radius);
  padding: var(--spacing-sm) var(--spacing-md);
}
\`\`\`

### Critical Rules

**ALWAYS:**
* One .module.css file per component
* Use camelCase class names
* Use \`composes\` for shared base styles
* Use CSS custom properties for theming
* Use \`clsx\` or \`classnames\` for conditional classes

**NEVER:**
* Use Tailwind utility classes
* Use inline styles for anything except truly dynamic values (e.g. calculated widths)
* Use :global() except for integrating with third-party libraries
* Create a single global stylesheet — keep styles co-located with components`,
};
