import { GenerationPreferences, DEFAULT_PREFERENCES } from "@/lib/types/preferences";
import { generationPrompt } from "./generation";

export function buildSystemPrompt(preferences: Partial<GenerationPreferences>): string {
  const prefs = { ...DEFAULT_PREFERENCES, ...preferences };
  const sections: string[] = [generationPrompt];

  // CSS Framework
  if (prefs.cssFramework !== DEFAULT_PREFERENCES.cssFramework) {
    switch (prefs.cssFramework) {
      case "CSS Modules":
        sections.push(`
## CSS Framework: CSS Modules

* Do NOT use Tailwind CSS classes
* Use CSS Modules for all styling — create \`.module.css\` files alongside components
* Import styles as \`import styles from './ComponentName.module.css'\`
* Use \`className={styles.container}\` syntax for applying classes
* Keep styles scoped to their component module
`);
        break;
      case "Styled Components":
        sections.push(`
## CSS Framework: Styled Components

* Do NOT use Tailwind CSS classes
* Use styled-components for all styling
* Import with \`import styled from 'styled-components'\`
* Create styled elements like \`const Container = styled.div\`...\`\`
* Keep styled components in the same file as the React component
* Use props for dynamic styling where appropriate
`);
        break;
      case "Vanilla CSS":
        sections.push(`
## CSS Framework: Vanilla CSS

* Do NOT use Tailwind CSS classes
* Use plain CSS files for all styling — create \`.css\` files alongside components
* Import styles with \`import './ComponentName.css'\`
* Use descriptive BEM-style class names (e.g. \`.card__title--active\`)
* Keep styles scoped with component-specific prefixes
`);
        break;
    }
  }

  // Design Style
  if (prefs.designStyle !== DEFAULT_PREFERENCES.designStyle) {
    switch (prefs.designStyle) {
      case "Minimal/Clean":
        sections.push(`
## Design Style: Minimal/Clean

Override the premium guidelines above. Follow a minimal design approach:
* Use ample whitespace and clean layouts
* Stick to a limited color palette — mostly neutrals with one accent color
* Avoid gradients, shadows, and decorative elements
* Use clean sans-serif typography with clear hierarchy
* Prefer flat designs with subtle borders over shadows
* Focus on content and readability over visual flair
`);
        break;
      case "Glassmorphism":
        sections.push(`
## Design Style: Glassmorphism

Override the premium guidelines above. Follow a glassmorphism design approach:
* Use frosted glass effects: \`bg-white/10 backdrop-blur-xl\` (or CSS equivalent)
* Apply subtle, semi-transparent borders: \`border border-white/20\`
* Use vibrant gradient backgrounds behind glass elements
* Add soft colored shadows that match the background
* Layer multiple glass panels at different opacity levels
* Keep text high-contrast against the glass background
`);
        break;
      case "Material Design":
        sections.push(`
## Design Style: Material Design

Override the premium guidelines above. Follow Material Design principles:
* Use elevation-based shadow system (4 levels: sm, md, lg, xl)
* Follow 8px grid spacing system
* Use Material Design color system: primary, secondary, surface, error
* Apply rounded corners consistently (4px for small, 8px for medium, 16px for large elements)
* Use ripple/press effects on interactive elements where possible
* Follow Material typography scale
`);
        break;
      case "Brutalist":
        sections.push(`
## Design Style: Brutalist

Override the premium guidelines above. Follow a brutalist web design approach:
* Use bold, high-contrast black and white as primary colors
* Apply thick, visible borders (2-4px solid black)
* Use raw, monospace or system fonts
* Avoid rounded corners — use sharp rectangular shapes
* No gradients, no shadows, no blur effects
* Embrace asymmetry and unconventional layouts
* Use oversized typography for headings
`);
        break;
    }
  }

  // Architecture Style
  if (prefs.architectureStyle !== DEFAULT_PREFERENCES.architectureStyle) {
    switch (prefs.architectureStyle) {
      case "Clean Architecture":
        sections.push(`
## Architecture: Clean Architecture

* Organize code into layers: /components (UI), /hooks (logic), /services (data), /utils (helpers)
* Separate business logic from UI components using custom hooks
* Keep components purely presentational where possible
* Use a services layer for API calls and data transformation
`);
        break;
      case "Atomic Design":
        sections.push(`
## Architecture: Atomic Design

* Follow Atomic Design methodology with these directories:
  * /components/atoms — Basic building blocks (Button, Input, Label, Icon)
  * /components/molecules — Simple groups of atoms (FormField, SearchBar, MenuItem)
  * /components/organisms — Complex UI sections (Header, Form, CardGrid)
  * /components/templates — Page-level layouts
* Start from atoms and compose upward
`);
        break;
      case "Feature-Based":
        sections.push(`
## Architecture: Feature-Based

* Organize code by feature/domain, not by type
* Each feature gets its own directory: /features/auth, /features/dashboard, etc.
* Each feature directory contains its own components, hooks, and utils
* Shared code goes in /shared/components, /shared/hooks, /shared/utils
`);
        break;
    }
  }

  // State Management
  if (prefs.stateManagement !== DEFAULT_PREFERENCES.stateManagement) {
    switch (prefs.stateManagement) {
      case "Zustand":
        sections.push(`
## State Management: Zustand

* Use Zustand for state management instead of React useState for shared state
* Create stores with \`import { create } from 'zustand'\`
* Keep stores focused and small — one store per feature/domain
* Use useState only for local UI state (form inputs, toggles)
`);
        break;
      case "Jotai":
        sections.push(`
## State Management: Jotai

* Use Jotai for state management
* Create atoms with \`import { atom, useAtom } from 'jotai'\`
* Define atoms at module level, use them in components with \`useAtom\`
* Derive computed state with derived atoms
* Use useState only for local UI state
`);
        break;
      case "Redux Toolkit":
        sections.push(`
## State Management: Redux Toolkit

* Use Redux Toolkit for state management
* Create slices with \`createSlice\` from \`@reduxjs/toolkit\`
* Use \`useSelector\` and \`useDispatch\` hooks in components
* Keep reducers pure and use RTK's immer-powered state updates
* Use useState only for local UI state
`);
        break;
      case "React Context":
        sections.push(`
## State Management: React Context

* Use React Context + useReducer for shared state management
* Create context providers for each domain area
* Use useReducer for complex state, useContext for consuming
* Keep contexts focused and avoid a single global context
* Use useState only for local UI state
`);
        break;
    }
  }

  // Code Quality / Language
  if (prefs.codeQuality !== DEFAULT_PREFERENCES.codeQuality) {
    switch (prefs.codeQuality) {
      case "TypeScript":
        sections.push(`
## Code Quality: TypeScript

* Write all code in TypeScript — use \`.tsx\` file extensions for components and \`.ts\` for utilities
* Define interfaces for component props
* Use proper typing for state, events, and function parameters
* Avoid \`any\` type — use \`unknown\` or specific types instead
`);
        break;
      case "TypeScript Strict":
        sections.push(`
## Code Quality: TypeScript Strict

* Write all code in strict TypeScript — use \`.tsx\` file extensions for components and \`.ts\` for utilities
* Define interfaces or types for ALL data structures, props, state, and function signatures
* Never use \`any\` — always use specific types, generics, or \`unknown\` with type guards
* Use discriminated unions for complex state
* Mark optional properties explicitly with \`?\`
* Use \`readonly\` for immutable data
* Export types alongside their components
`);
        break;
    }
  }

  // Accessibility
  if (prefs.accessibility) {
    sections.push(`
## Accessibility (A11y)

* Follow WCAG 2.1 AA guidelines
* Use semantic HTML elements (nav, main, section, article, aside, header, footer)
* Add ARIA labels, roles, and descriptions where semantic HTML is insufficient
* Ensure all interactive elements are keyboard accessible (proper tab order, focus styles)
* Use sufficient color contrast ratios (4.5:1 for normal text, 3:1 for large text)
* Add alt text to all images
* Use \`aria-live\` regions for dynamic content updates
* Include skip navigation links
* Ensure form inputs have associated labels
`);
  }

  return sections.join("\n");
}
