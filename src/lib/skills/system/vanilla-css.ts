import type { Skill } from "@/lib/types/skill";

export const vanillaCssSkill: Skill = {
  id: "system-vanilla-css",
  name: "Vanilla CSS",
  description: "Vanilla CSS guidelines — plain CSS, BEM naming, custom properties, modern features.",
  enabled: true,
  content: `## CSS Framework: Vanilla CSS — MANDATORY

**Do NOT use Tailwind CSS classes. Use plain CSS files for ALL styling.**

### File Structure
* Create \`.css\` files alongside components: \`Button.css\` next to \`Button.tsx\`
* Import with: \`import './Button.css'\`

### BEM Naming Convention
Use Block__Element--Modifier for structured, predictable class names:
\`\`\`css
/* Block */
.card { padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; }

/* Element */
.card__title { font-size: 1.25rem; font-weight: 600; margin-bottom: 8px; }
.card__body { font-size: 1rem; color: #475569; line-height: 1.6; }
.card__footer { margin-top: 16px; display: flex; gap: 8px; }

/* Modifier */
.card--featured { border-color: #2563eb; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15); }
.card--compact { padding: 16px; }

/* Button block with modifiers */
.btn { padding: 8px 16px; border: none; border-radius: 8px; font-weight: 500; cursor: pointer; }
.btn--primary { background: #2563eb; color: white; }
.btn--secondary { background: #f1f5f9; color: #1e293b; }
.btn--lg { padding: 12px 24px; font-size: 1.125rem; }
\`\`\`

### CSS Custom Properties (Theming)
\`\`\`css
:root {
  --color-primary: #2563eb;
  --color-bg: #ffffff;
  --color-text: #1e293b;
  --color-muted: #64748b;
  --color-border: #e2e8f0;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}

.btn--primary {
  background: var(--color-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
}
\`\`\`

### Modern CSS Features
* Use \`display: grid\` and \`display: flex\` for layouts
* Use \`gap\` instead of margin hacks for spacing
* Use \`clamp()\` for responsive typography: \`font-size: clamp(1rem, 2vw, 1.5rem)\`
* Use \`container queries\` for component-level responsiveness where supported
* Use \`@layer\` to organize cascade precedence

### Critical Rules

**ALWAYS:**
* One .css file per component, co-located
* Use BEM naming: \`.block__element--modifier\`
* Use CSS custom properties for design tokens (colors, spacing, radii)
* Use semantic class names — descriptive of purpose, not appearance
* Scope styles with component-specific block names to avoid collisions

**NEVER:**
* Use Tailwind utility classes
* Use inline styles except for truly dynamic values
* Use generic class names like \`.container\`, \`.title\` — prefix with component name
* Use !important — fix specificity issues with better selectors
* Use ID selectors for styling`,
};
