import {
  GenerationPreferences,
  DEFAULT_PREFERENCES,
} from "@/lib/types/preferences";
import type { SkillDescriptor } from "@/lib/types/skill";
import { generationPrompt } from "./generation";

interface AttachmentDescriptor {
  name: string;
  contentType: string;
  isImage: boolean;
}

interface EditorContext {
  selectedFile: string | null;
  visibleRange: { startLine: number; endLine: number } | null;
}

interface PromptOptions {
  globalRules?: string;
  projectRules?: string;
  skills?: SkillDescriptor[];
  attachments?: AttachmentDescriptor[];
  editorContext?: EditorContext;
  previewErrors?: string[];
}

// Short mandatory notes that tell the AI which preference is active and which skill to read.
// The full guidelines live in the system skill files loaded via read_skill.
const PREFERENCE_NOTES: Record<string, Record<string, string>> = {
  cssFramework: {
    "CSS Modules":
      "CSS Framework: CSS Modules — MANDATORY. Do NOT use Tailwind. Read the 'system-css-modules' skill for full guidelines.",
    "Styled Components":
      "CSS Framework: Styled Components — MANDATORY. Do NOT use Tailwind. Read the 'system-styled-components' skill for full guidelines.",
    "Vanilla CSS":
      "CSS Framework: Vanilla CSS — MANDATORY. Do NOT use Tailwind. Read the 'system-vanilla-css' skill for full guidelines.",
  },
  designStyle: {
    "Minimal/Clean":
      "Design Style: Minimal/Clean — MANDATORY. Overrides the premium design guidelines. Read the 'system-minimal-clean' skill for full guidelines. You MUST follow them.",
    Glassmorphism:
      "Design Style: Glassmorphism — MANDATORY. Overrides the premium design guidelines. Read the 'system-glassmorphism' skill for full guidelines. You MUST follow them.",
    "Material Design":
      "Design Style: Material Design 3 — MANDATORY. Overrides the premium design guidelines. Read the 'system-material-design' skill for full guidelines. You MUST follow them.",
    Brutalist:
      "Design Style: Brutalist — MANDATORY. Overrides the premium design guidelines. Read the 'system-brutalist' skill for full guidelines. You MUST follow them.",
  },
  architectureStyle: {
    "Clean Architecture":
      "Architecture: Clean Architecture — MANDATORY. Read the 'system-clean-architecture' skill for full guidelines.",
    "Atomic Design":
      "Architecture: Atomic Design — MANDATORY. Read the 'system-atomic-design' skill for full guidelines.",
    "Feature-Based":
      "Architecture: Feature-Based — MANDATORY. Read the 'system-feature-based' skill for full guidelines.",
  },
  stateManagement: {
    Zustand:
      "State Management: Zustand — MANDATORY. Read the 'system-zustand' skill for full guidelines.",
    Jotai:
      "State Management: Jotai — MANDATORY. Read the 'system-jotai' skill for full guidelines.",
    "Redux Toolkit":
      "State Management: Redux Toolkit — MANDATORY. Read the 'system-redux-toolkit' skill for full guidelines.",
    "React Context":
      "State Management: React Context — MANDATORY. Read the 'system-react-context' skill for full guidelines.",
  },
  codeQuality: {
    TypeScript:
      "Code Quality: TypeScript — MANDATORY. Read the 'system-typescript' skill for full guidelines.",
    "TypeScript Strict":
      "Code Quality: TypeScript Strict — MANDATORY. Read the 'system-typescript-strict' skill for full guidelines.",
  },
};

export function buildSystemPrompt(
  preferences: Partial<GenerationPreferences>,
  options?: PromptOptions
): string {
  const prefs = { ...DEFAULT_PREFERENCES, ...preferences };
  const sections: string[] = [generationPrompt];

  // Collect short mandatory notes for non-default preferences
  const activeNotes: string[] = [];

  for (const [key, noteMap] of Object.entries(PREFERENCE_NOTES)) {
    const prefValue = prefs[key as keyof GenerationPreferences] as string;
    const defaultValue = DEFAULT_PREFERENCES[
      key as keyof GenerationPreferences
    ] as string;
    if (prefValue !== defaultValue && noteMap[prefValue]) {
      activeNotes.push(noteMap[prefValue]);
    }
  }

  if (prefs.accessibility) {
    activeNotes.push(
      "Accessibility: A11y enabled — MANDATORY. Read the 'system-accessibility' skill for full WCAG 2.1 AA guidelines."
    );
  }

  if (activeNotes.length > 0) {
    sections.push(`
## Active Preference Overrides

The following preferences are active. You MUST read the referenced skills using the \`read_skill\` tool before generating code, as they contain mandatory guidelines you must follow.

${activeNotes.map((n) => `- ${n}`).join("\n")}
`);
  }

  // User-defined rules
  const globalRules = options?.globalRules?.trim();
  const projectRules = options?.projectRules?.trim();

  if (globalRules) {
    sections.push(`
## User's Global Rules

The following rules were defined by the user and apply to all their projects. Follow them unless they directly contradict the core system instructions above.

${globalRules}
`);
  }

  if (projectRules) {
    sections.push(`
## Project-Specific Rules

The following rules were defined by the user for this specific project. They take priority over global rules when there is a conflict.

${projectRules}
`);
  }

  // Available skills
  const skills = options?.skills;
  if (skills && skills.length > 0) {
    const skillList = skills
      .map((s) => `- ${s.id}: "${s.name}" — ${s.description}`)
      .join("\n");

    sections.push(`
## Available Skills

You have access to specialized skills. Before responding, review the list below and use the \`read_skill\` tool to load full instructions for any skill relevant to the current request. Only load skills that are clearly relevant.

${skillList}
`);
  }

  // Available attachments from previous turns
  const attachments = options?.attachments;
  if (attachments && attachments.length > 0) {
    const attList = attachments
      .map(
        (a) => `- "${a.name}" (${a.contentType})${a.isImage ? " [image]" : ""}`
      )
      .join("\n");

    sections.push(`
## Attachments from Previous Turns

The user has attached files in earlier messages. Their content was stripped from history to save tokens. If you need to re-examine any of these files, use the \`read_attachment\` tool with the filename. The current turn's attachments (if any) are already visible inline.

${attList}
`);
  }

  // Editor context
  const editorContext = options?.editorContext;
  if (editorContext?.selectedFile) {
    let editorSection = `
## Current Editor State

The user is currently viewing:
- File: ${editorContext.selectedFile}`;

    if (editorContext.visibleRange) {
      editorSection += `\n- Visible lines: ${editorContext.visibleRange.startLine}–${editorContext.visibleRange.endLine}`;
    }

    editorSection +=
      "\n\nFocus your edits on this file and area when relevant.";
    sections.push(editorSection);
  }

  // Preview errors
  const previewErrors = options?.previewErrors;
  if (previewErrors && previewErrors.length > 0) {
    const errorList = previewErrors.map((e) => `- ${e}`).join("\n");
    sections.push(`
## Preview Errors

The live preview is showing the following errors:
${errorList}

Address these errors if relevant to the user's request.
`);
  }

  return sections.join("\n");
}
