export type CSSFramework =
  | "Auto"
  | "Tailwind CSS"
  | "CSS Modules"
  | "Styled Components"
  | "Vanilla CSS";

export type DesignStyle =
  | "Auto"
  | "Premium/Modern"
  | "Minimal/Clean"
  | "Glassmorphism"
  | "Material Design"
  | "Brutalist";

export type ArchitectureStyle =
  | "Auto"
  | "Flat"
  | "Clean Architecture"
  | "Atomic Design"
  | "Feature-Based";

export type StateManagement =
  | "Auto"
  | "Zustand"
  | "Jotai"
  | "Redux Toolkit"
  | "React Context";

export type CodeQualityLanguage =
  | "Auto"
  | "JavaScript"
  | "TypeScript"
  | "TypeScript Strict";

export type AIModel =
  | "Haiku 4.5"
  | "Sonnet 4.6"
  | "Sonnet 4.6 Thinking"
  | "Opus 4.6"
  | "Opus 4.6 Thinking";

export interface GenerationPreferences {
  cssFramework: CSSFramework;
  designStyle: DesignStyle;
  architectureStyle: ArchitectureStyle;
  stateManagement: StateManagement;
  codeQuality: CodeQualityLanguage;
  aiModel: AIModel;
  accessibility: boolean;
  maxSteps: number;
}

export const DEFAULT_PREFERENCES: GenerationPreferences = {
  cssFramework: "Tailwind CSS",
  designStyle: "Auto",
  architectureStyle: "Auto",
  stateManagement: "Auto",
  codeQuality: "Auto",
  aiModel: "Haiku 4.5",
  accessibility: false,
  maxSteps: 40,
};

export const MAX_STEPS_MIN = 4;
export const MAX_STEPS_MAX = 120;

/** Max tool-call steps per single request (keeps each request within Vercel's 300s limit) */
export const STEPS_PER_REQUEST = 25;

/** Max automatic "Continue." messages the client will send when a response is truncated */
export const MAX_AUTO_CONTINUATIONS = 5;

export interface PreferenceCategory {
  key: keyof Omit<GenerationPreferences, "accessibility" | "maxSteps">;
  label: string;
  options: string[];
}

export const PREFERENCE_CATEGORIES: PreferenceCategory[] = [
  {
    key: "cssFramework",
    label: "CSS",
    options: ["Auto", "Tailwind CSS", "CSS Modules", "Styled Components", "Vanilla CSS"],
  },
  {
    key: "designStyle",
    label: "Design",
    options: [
      "Auto",
      "Premium/Modern",
      "Minimal/Clean",
      "Glassmorphism",
      "Material Design",
      "Brutalist",
    ],
  },
  {
    key: "architectureStyle",
    label: "Architecture",
    options: ["Auto", "Flat", "Clean Architecture", "Atomic Design", "Feature-Based"],
  },
  {
    key: "stateManagement",
    label: "State",
    options: [
      "Auto",
      "Zustand",
      "Jotai",
      "Redux Toolkit",
      "React Context",
    ],
  },
  {
    key: "codeQuality",
    label: "Code",
    options: ["Auto", "JavaScript", "TypeScript", "TypeScript Strict"],
  },
];

export const AI_MODEL_OPTIONS: AIModel[] = [
  "Haiku 4.5",
  "Sonnet 4.6",
  "Sonnet 4.6 Thinking",
  "Opus 4.6",
  "Opus 4.6 Thinking",
];
