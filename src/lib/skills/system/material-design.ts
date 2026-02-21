import type { Skill } from "@/lib/types/skill";

export const materialDesignSkill: Skill = {
  id: "system-material-design",
  name: "Material Design 3",
  description: "Full Material Design 3 (M3) guidelines — elevation, color, typography, components, layout, 8px grid.",
  enabled: true,
  content: `## Design Style: Material Design 3 — MANDATORY OVERRIDE

**CRITICAL: The "Visual Design Guidelines — Make It Look Premium" section above is COMPLETELY OVERRIDDEN. You MUST ignore ALL premium styling rules and follow ONLY Material Design 3 (M3) guidelines below. The output MUST look like a Google Material Design app, NOT a dark premium/glassmorphism site.**

### Color System
* Define a primary, secondary, and tertiary color. Derive surface/on-surface/container colors from them.
* Primary actions: \`bg-{primary}-500 text-white\`
* Containers: \`bg-{primary}-50\` or \`bg-{primary}-100\`
* Surface colors: \`bg-white\` or \`bg-slate-50\` (light mode), \`bg-slate-900\` (dark mode)
* Error state: \`bg-red-500\` for error containers, \`text-red-700\` for error text
* Use light mode by default — white/near-white backgrounds with dark text

### Elevation System (Shadows)
* Level 0 (flat): No shadow — flush surfaces
* Level 1 (cards, buttons): \`shadow-sm\`
* Level 2 (raised cards): \`shadow-md\`
* Level 3 (modals, dialogs): \`shadow-xl\`
* Level 4 (FABs): \`shadow-lg\`
* Surfaces stack with increasing elevation — higher = more shadow

### 8px Grid System
* ALL spacing and sizing MUST be multiples of 4px or 8px
* Use Tailwind spacing: p-1 (4px), p-2 (8px), p-3 (12px), p-4 (16px), p-6 (24px), p-8 (32px)
* Gaps: gap-2, gap-4, gap-6, gap-8

### Corner Rounding (Shape System)
* Small (chips, buttons): \`rounded-full\` or \`rounded-lg\`
* Medium (cards, dialogs): \`rounded-xl\` to \`rounded-2xl\`
* Large (bottom sheets): \`rounded-3xl\` on top corners only

### Components
* **Buttons**: Filled (\`bg-primary rounded-full px-6 py-2.5\`), Outlined (\`border-2 border-primary rounded-full\`), Text (\`text-primary rounded-full\`). Buttons are ALWAYS \`rounded-full\`.
* **Cards**: Surface-tinted backgrounds, subtle shadow, \`rounded-xl\`. NO gradient backgrounds.
* **Top App Bar**: Prominent bar with title and action icons
* **FABs**: Primary actions — \`rounded-2xl p-4 shadow-lg\`
* **Chips**: \`rounded-full px-3 py-1 text-sm border\`
* **Dialogs**: Centered modal, \`rounded-3xl shadow-xl\`, max-w-sm
* **Text Fields**: Outlined (\`border-2 rounded\`) or Filled (\`bg-gray-100 rounded-t border-b-2\`)

### Typography (M3 Type Scale)
* Display: text-4xl to text-6xl, font-light — hero sections
* Headline: text-2xl to text-3xl, font-normal — page titles
* Title: text-lg to text-xl, font-medium — section headers
* Body: text-base, font-normal — primary content
* Label: text-sm, font-medium — buttons, captions
* Use clean sans-serif font throughout

### FORBIDDEN — DO NOT USE:
* NO gradient backgrounds on buttons, cards, or surfaces
* NO gradient text (no bg-clip-text)
* NO glass/blur effects (no backdrop-blur, no bg-white/10)
* NO decorative background blobs, orbs, or grid patterns
* NO colored shadows — use neutral shadows ONLY
* NO dark/black backgrounds by default
* NO neon glows, no "premium" visual effects`,
};
