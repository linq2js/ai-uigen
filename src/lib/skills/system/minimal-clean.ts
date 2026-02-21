import type { Skill } from "@/lib/types/skill";

export const minimalCleanSkill: Skill = {
  id: "system-minimal-clean",
  name: "Minimal/Clean Design",
  description: "Minimal/Clean design guidelines — whitespace-focused, flat, limited palette, content-first.",
  enabled: true,
  content: `## Design Style: Minimal/Clean — MANDATORY OVERRIDE

**CRITICAL: The "Visual Design Guidelines — Make It Look Premium" section above is COMPLETELY OVERRIDDEN. You MUST ignore ALL premium styling rules and follow ONLY the minimal design rules below. Any output that uses gradients, glass effects, decorative blobs, or colored shadows is WRONG.**

### Core Principles
* Content-first: every visual element must serve a purpose — remove anything that doesn't aid comprehension
* Whitespace as a design element: generous padding (p-8, p-12, p-16) and breathing room between sections
* Visual hierarchy through typography scale and weight alone, not color or decoration

### Color Palette
* Use mostly neutrals — gray-50 through gray-900 or slate equivalents
* ONE accent color only for interactive elements (links, buttons, focus rings)
* Backgrounds: \`bg-white\` or \`bg-gray-50\` — no darker than \`bg-gray-100\`
* Text: \`text-gray-900\` for headings, \`text-gray-600\` for body, \`text-gray-400\` for muted

### Typography
* Clean sans-serif font (Inter, system-ui, or similar)
* Strong hierarchy: large headings (text-3xl+, font-bold) contrasted with regular body (text-base, font-normal)
* Generous line-height: \`leading-relaxed\` or \`leading-loose\` for body text
* Limit to 2-3 font sizes per page section

### Borders & Surfaces
* Prefer flat designs with subtle 1px borders (\`border border-gray-200\`) over shadows
* If shadows are needed, keep them minimal: \`shadow-sm\` at most
* Cards: \`bg-white border border-gray-200 rounded-lg p-6\` — clean and flat

### Layout
* Max content width of 640-768px for text-heavy layouts
* Symmetric grid layouts with consistent gap spacing
* Ample vertical spacing between sections (py-12 to py-20)

### Interactive Elements
* Buttons: clean, flat — \`bg-gray-900 text-white rounded-md px-4 py-2\` or outlined \`border border-gray-300 rounded-md\`
* Hover states: subtle background change only — \`hover:bg-gray-100\`
* Focus rings: \`focus:ring-2 focus:ring-offset-2 focus:ring-gray-400\`
* Transitions: subtle and fast — \`transition-colors duration-150\`

### FORBIDDEN — DO NOT USE:
* NO gradients (no bg-gradient-to-*, no gradient text)
* NO glass/blur effects (no backdrop-blur, no bg-white/10)
* NO decorative background elements (no blobs, orbs, grid patterns)
* NO colored shadows (no shadow-{color}-500/25)
* NO multi-stop color schemes — keep it flat and simple
* NO rounded-2xl or rounded-3xl — use rounded-md or rounded-lg at most
* NO animations beyond simple color/opacity transitions`,
};
