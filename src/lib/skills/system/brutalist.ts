import type { Skill } from "@/lib/types/skill";

export const brutalistSkill: Skill = {
  id: "system-brutalist",
  name: "Brutalist Design",
  description: "Brutalist design guidelines — bold, raw, high-contrast, monospace, no decoration.",
  enabled: true,
  content: `## Design Style: Brutalist — MANDATORY OVERRIDE

**CRITICAL: The "Visual Design Guidelines — Make It Look Premium" section above is COMPLETELY OVERRIDDEN. You MUST ignore ALL premium styling rules and follow ONLY the brutalist rules below.**

### Core Philosophy
Brutalist design is raw, honest, and unapologetic. Content and function over decoration. Derived from architectural "béton brut" (raw concrete). Embrace imperfection and directness.

### Typography
* Use monospace or system fonts for ALL text: \`font-mono\` (Courier, JetBrains Mono, monospace)
* Oversized headings: text-5xl, text-6xl, text-7xl or larger, uppercase, \`font-black tracking-tight\`
* Body text: text-base or text-lg, \`font-mono\`
* Text transforms: \`uppercase\` for headings and labels
* No font smoothing — raw system rendering

### Color
* Primary palette: black (#000) and white (#fff) only
* If using accent color: ONE bold, flat color (e.g. \`bg-red-600\`, \`bg-yellow-400\`, \`bg-blue-600\`) — never subtle
* High-contrast combinations: black on white, white on black, or bold color on black
* NO subtle grays — only black, white, and optional bold accent

### Borders & Shapes
* Thick, visible borders on ALL containers: \`border-2 border-black\` or \`border-4 border-black\`
* Sharp rectangular shapes — NO rounded corners anywhere (\`rounded-none\`)
* Use borders as primary visual structure, not shadows or backgrounds
* Double borders, offset borders, or dashed borders for emphasis

### Layout
* Asymmetric, grid-breaking layouts — deliberately unconventional
* Harsh contrast between large and small elements
* Dense information display or extreme whitespace — no middle ground
* Overlapping elements with \`-mt-4\` or negative margins are acceptable

### Interactive Elements
* Buttons: \`border-2 border-black bg-black text-white px-6 py-3 font-mono uppercase tracking-wider\`
* Hover: invert colors — \`hover:bg-white hover:text-black\`
* Links: plain underlined text, \`underline\` — no fancy styles
* NO smooth transitions — brutalist is immediate and raw

### Cards & Containers
* \`border-2 border-black p-6\` — no shadow, no rounding, no background color
* Use thick horizontal rules (\`border-t-4 border-black\`) as dividers
* Stack content with harsh edges

### FORBIDDEN — DO NOT USE:
* NO rounded corners of any kind (no rounded-*)
* NO gradients (no bg-gradient-to-*)
* NO shadows (no shadow-*)
* NO blur effects (no backdrop-blur)
* NO glass effects
* NO decorative background elements (no blobs, orbs, grids)
* NO smooth transitions or hover animations
* NO subtle colors — nothing between black and white unless it's a bold accent`,
};
