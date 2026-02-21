import type { Skill } from "@/lib/types/skill";

export const glassmorphismSkill: Skill = {
  id: "system-glassmorphism",
  name: "Glassmorphism Design",
  description: "Glassmorphism design guidelines — frosted glass, translucent panels, vibrant backgrounds, layering.",
  enabled: true,
  content: `## Design Style: Glassmorphism — MANDATORY OVERRIDE

**CRITICAL: The "Visual Design Guidelines — Make It Look Premium" section above is COMPLETELY OVERRIDDEN. You MUST follow ONLY the glassmorphism rules below.**

### Core CSS Properties (All 4 Required)
Every glass panel MUST have all four:
1. **Semi-transparent background**: \`bg-white/10\` to \`bg-white/20\` (dark theme) or \`bg-white/40\` to \`bg-white/60\` (light theme)
2. **Backdrop blur**: \`backdrop-blur-xl\` or \`backdrop-blur-2xl\`
3. **Subtle border**: \`border border-white/20\`
4. **Soft shadow**: \`shadow-lg\` or \`shadow-xl\`

### Glass Panel Recipe
\`\`\`
className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl p-6"
\`\`\`

### Background (Behind the Glass)
* The glass effect ONLY works with a vibrant background behind it
* Use gradient backgrounds on the page/section: \`bg-gradient-to-br from-purple-600 via-blue-500 to-cyan-400\`
* Or use colorful images, mesh gradients, or decorative gradient blobs
* The more colorful the background, the more visible the glass effect

### Layering & Depth
* Layer multiple glass panels at different opacity levels for depth
* Outer container: \`bg-white/5 backdrop-blur-md\`
* Inner cards: \`bg-white/10 backdrop-blur-xl\`
* Foreground elements: \`bg-white/20 backdrop-blur-2xl\`

### Typography on Glass
* Use white or near-white text: \`text-white\` or \`text-white/90\`
* Add subtle text shadow for readability: use \`drop-shadow-sm\` or a darker text-shadow
* Muted text: \`text-white/60\`
* Headings: \`text-white font-bold\`

### Corner Rounding
* Glass panels: \`rounded-2xl\` or \`rounded-3xl\`
* Buttons on glass: \`rounded-xl\` or \`rounded-full\`
* Inputs on glass: \`rounded-xl bg-white/10 border border-white/20\`

### Colored Glass Variations
* Purple glass: \`bg-purple-500/15 backdrop-blur-xl border border-purple-300/20\`
* Blue glass: \`bg-blue-500/15 backdrop-blur-xl border border-blue-300/20\`
* Frosted dark: \`bg-black/30 backdrop-blur-xl border border-white/10\`

### Interactive Elements
* Buttons: \`bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/25 rounded-xl\`
* Primary action: \`bg-white/90 text-gray-900 rounded-xl\` (solid on glass)
* Inputs: \`bg-white/10 border border-white/20 rounded-xl placeholder:text-white/40\`

### FORBIDDEN:
* NO opaque/solid background cards — every container must be translucent
* NO flat solid-color surfaces — everything should have glass transparency
* NO plain white or gray backgrounds without gradient behind them`,
};
