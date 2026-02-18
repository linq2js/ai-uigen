export type CSSFramework =
  | "Tailwind CSS"
  | "CSS Modules"
  | "Styled Components"
  | "Vanilla CSS";

export type DesignStyle =
  | "Premium/Modern"
  | "Minimal/Clean"
  | "Glassmorphism"
  | "Material Design"
  | "Brutalist";

export type ArchitectureStyle =
  | "Flat"
  | "Clean Architecture"
  | "Atomic Design"
  | "Feature-Based";

export type StateManagement =
  | "React useState"
  | "Zustand"
  | "Jotai"
  | "Redux Toolkit"
  | "React Context";

export type CodeQualityLanguage =
  | "JavaScript"
  | "TypeScript"
  | "TypeScript Strict";

export type AIModel = "Haiku 4.5" | "Sonnet 4.6" | "Opus 4.6";

export interface GenerationPreferences {
  cssFramework: CSSFramework;
  designStyle: DesignStyle;
  architectureStyle: ArchitectureStyle;
  stateManagement: StateManagement;
  codeQuality: CodeQualityLanguage;
  aiModel: AIModel;
  accessibility: boolean;
}

export const DEFAULT_PREFERENCES: GenerationPreferences = {
  cssFramework: "Tailwind CSS",
  designStyle: "Premium/Modern",
  architectureStyle: "Flat",
  stateManagement: "React useState",
  codeQuality: "JavaScript",
  aiModel: "Haiku 4.5",
  accessibility: false,
};

export interface PreferenceCategory {
  key: keyof Omit<GenerationPreferences, "accessibility">;
  label: string;
  options: string[];
}

export const PREFERENCE_CATEGORIES: PreferenceCategory[] = [
  {
    key: "cssFramework",
    label: "CSS",
    options: ["Tailwind CSS", "CSS Modules", "Styled Components", "Vanilla CSS"],
  },
  {
    key: "designStyle",
    label: "Design",
    options: [
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
    options: ["Flat", "Clean Architecture", "Atomic Design", "Feature-Based"],
  },
  {
    key: "stateManagement",
    label: "State",
    options: [
      "React useState",
      "Zustand",
      "Jotai",
      "Redux Toolkit",
      "React Context",
    ],
  },
  {
    key: "codeQuality",
    label: "Code",
    options: ["JavaScript", "TypeScript", "TypeScript Strict"],
  },
  {
    key: "aiModel",
    label: "Model",
    options: ["Haiku 4.5", "Sonnet 4.6", "Opus 4.6"],
  },
];
