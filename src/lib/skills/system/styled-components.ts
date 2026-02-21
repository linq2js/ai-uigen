import type { Skill } from "@/lib/types/skill";

export const styledComponentsSkill: Skill = {
  id: "system-styled-components",
  name: "Styled Components",
  description: "Styled Components CSS-in-JS guidelines — theming, dynamic styles, patterns, performance.",
  enabled: true,
  content: `## CSS Framework: Styled Components — MANDATORY

**Do NOT use Tailwind CSS classes. Use styled-components for ALL styling.**

### Setup
\`\`\`tsx
import styled from 'styled-components'
\`\`\`

### Basic Usage
\`\`\`tsx
const Container = styled.div\`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
\`

const Title = styled.h1\`
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
\`
\`\`\`

### Dynamic Styles with Props
\`\`\`tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

const Button = styled.button<ButtonProps>\`
  padding: \${({ size }) => size === 'lg' ? '12px 24px' : size === 'sm' ? '6px 12px' : '8px 16px'};
  background: \${({ variant }) => variant === 'primary' ? '#2563eb' : '#f1f5f9'};
  color: \${({ variant }) => variant === 'primary' ? 'white' : '#1e293b'};
  border: none;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
\`
\`\`\`

### Theming with ThemeProvider
\`\`\`tsx
import { ThemeProvider } from 'styled-components'

const theme = {
  colors: { primary: '#2563eb', bg: '#ffffff', text: '#1e293b' },
  spacing: { sm: '8px', md: '16px', lg: '24px' },
  radii: { sm: '4px', md: '8px', lg: '16px' },
}

// Wrap app
<ThemeProvider theme={theme}><App /></ThemeProvider>

// Use in components
const Card = styled.div\`
  background: \${({ theme }) => theme.colors.bg};
  padding: \${({ theme }) => theme.spacing.lg};
  border-radius: \${({ theme }) => theme.radii.md};
\`
\`\`\`

### Extending Styles
\`\`\`tsx
const BaseButton = styled.button\`
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
\`

const PrimaryButton = styled(BaseButton)\`
  background: #2563eb;
  color: white;
\`

const DangerButton = styled(BaseButton)\`
  background: #dc2626;
  color: white;
\`
\`\`\`

### CSS Helper for Reusable Mixins
\`\`\`tsx
import { css } from 'styled-components'

const truncate = css\`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
\`

const Title = styled.h2\`
  \${truncate}
  font-size: 1.5rem;
\`
\`\`\`

### Critical Rules

**ALWAYS:**
* Keep styled components in the same file as their React component
* Use ThemeProvider for consistent design tokens
* Use \`styled(Base)\` for extending existing components
* Use the \`css\` helper for reusable style mixins
* Type dynamic props with TypeScript interfaces
* Use \`attrs()\` for frequently changing props to reduce class generation

**NEVER:**
* Use Tailwind utility classes
* Create styled components inside render functions — define them outside
* Use inline styles except for truly dynamic values (e.g. calculated positions)
* Duplicate styles — extract shared patterns with \`css\` helper or extension`,
};
