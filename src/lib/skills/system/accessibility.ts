import type { Skill } from "@/lib/types/skill";

export const accessibilitySkill: Skill = {
  id: "system-accessibility",
  name: "Accessibility (A11y)",
  description: "WCAG 2.1 AA accessibility — semantic HTML, ARIA, keyboard nav, contrast, focus management.",
  enabled: true,
  content: `## Accessibility: WCAG 2.1 AA — MANDATORY

**ALL generated code MUST meet WCAG 2.1 AA compliance. This is not optional.**

### Semantic HTML (Foundation)
* Use semantic elements: \`<nav>\`, \`<main>\`, \`<section>\`, \`<article>\`, \`<aside>\`, \`<header>\`, \`<footer>\`
* Use \`<button>\` for actions, \`<a>\` for navigation — NEVER use \`<div onClick>\`
* Use heading hierarchy: \`<h1>\` → \`<h2>\` → \`<h3>\` — never skip levels
* Use \`<ul>\`/\`<ol>\` for lists, \`<table>\` for tabular data
* Use \`<label>\` with \`htmlFor\` for ALL form inputs

### ARIA (When Semantic HTML Is Insufficient)
\`\`\`tsx
// Landmarks
<nav aria-label="Main navigation">
<main aria-label="Page content">
<aside aria-label="Related articles">

// Interactive elements
<button aria-expanded={isOpen} aria-controls="menu-id">Menu</button>
<div id="menu-id" role="menu" aria-hidden={!isOpen}>

// Form fields
<input aria-required="true" aria-invalid={!!error} aria-describedby="error-id" />
{error && <span id="error-id" role="alert">{error}</span>}

// Live regions for dynamic updates
<div aria-live="polite" aria-atomic="true">{statusMessage}</div>
\`\`\`

### Keyboard Navigation
* ALL interactive elements must be reachable via Tab key
* Logical tab order following visual layout
* Visible focus indicators: \`focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none\`
* Escape key closes modals/dropdowns/popups
* Arrow keys for navigating within composite widgets (menus, tabs, listboxes)
* Enter/Space activates buttons and links

### Color & Contrast
* Normal text: minimum 4.5:1 contrast ratio against background
* Large text (18px+ bold or 24px+ regular): minimum 3:1 ratio
* UI components and icons: minimum 3:1 ratio
* NEVER rely on color alone to convey meaning — use icons, text, or patterns too
* Ensure all states (hover, focus, active, disabled, error) meet contrast requirements

### Images & Media
* ALL images: \`<img alt="Descriptive text">\` — describe the content, not "image of..."
* Decorative images: \`<img alt="" role="presentation">\`
* Videos: provide captions and transcripts
* Icons used as buttons: \`<button aria-label="Close"><XIcon /></button>\`

### Forms
\`\`\`tsx
<div>
  <label htmlFor="email">Email address</label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? 'email-error' : undefined}
  />
  {errors.email && (
    <span id="email-error" role="alert" className="text-red-600 text-sm">
      {errors.email}
    </span>
  )}
</div>
\`\`\`

### Focus Management
* Move focus to modals when opened, return to trigger when closed
* Move focus to new content after route changes
* Use \`tabIndex={-1}\` on non-interactive elements that need programmatic focus
* Skip navigation link: \`<a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>\`

### Motion & Animation
* Respect \`prefers-reduced-motion\`: \`@media (prefers-reduced-motion: reduce) { * { animation: none; transition: none; } }\`
* No content flashing more than 3 times per second
* Provide controls to pause/stop auto-playing content

### Screen Reader Only Text
\`\`\`tsx
// Tailwind sr-only equivalent
<span className="sr-only">Additional context for screen readers</span>

// Or with CSS: position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0);
\`\`\`

### Testing Checklist
* Navigate the entire UI using only keyboard
* Test with a screen reader (VoiceOver, NVDA)
* Verify all interactive elements have accessible names
* Check color contrast with browser devtools
* Verify focus is visible on all interactive elements`,
};
