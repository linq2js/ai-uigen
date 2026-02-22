import type { GenerationPreferences } from "@/lib/types/preferences";
import type { Skill } from "@/lib/types/skill";

import { materialDesignSkill } from "./material-design";
import { minimalCleanSkill } from "./minimal-clean";
import { glassmorphismSkill } from "./glassmorphism";
import { brutalistSkill } from "./brutalist";
import { atomicDesignSkill } from "./atomic-design";
import { cleanArchitectureSkill } from "./clean-architecture";
import { featureBasedSkill } from "./feature-based";
import { zustandSkill } from "./zustand";
import { jotaiSkill } from "./jotai";
import { reduxToolkitSkill } from "./redux-toolkit";
import { reactContextSkill } from "./react-context";
import { cssModulesSkill } from "./css-modules";
import { styledComponentsSkill } from "./styled-components";
import { vanillaCssSkill } from "./vanilla-css";
import { typescriptSkill } from "./typescript";
import { typescriptStrictSkill } from "./typescript-strict";
import { accessibilitySkill } from "./accessibility";

const designStyleSkills: Record<string, Skill> = {
  "Minimal/Clean": minimalCleanSkill,
  "Glassmorphism": glassmorphismSkill,
  "Material Design": materialDesignSkill,
  "Brutalist": brutalistSkill,
};

const architectureStyleSkills: Record<string, Skill> = {
  "Clean Architecture": cleanArchitectureSkill,
  "Atomic Design": atomicDesignSkill,
  "Feature-Based": featureBasedSkill,
};

const stateManagementSkills: Record<string, Skill> = {
  "Zustand": zustandSkill,
  "Jotai": jotaiSkill,
  "Redux Toolkit": reduxToolkitSkill,
  "React Context": reactContextSkill,
};

const cssFrameworkSkills: Record<string, Skill> = {
  "CSS Modules": cssModulesSkill,
  "Styled Components": styledComponentsSkill,
  "Vanilla CSS": vanillaCssSkill,
};

const codeQualitySkills: Record<string, Skill> = {
  "TypeScript": typescriptSkill,
  "TypeScript Strict": typescriptStrictSkill,
};

/**
 * Returns all system skills so the AI can discover and read any of them
 * when relevant to the user's request, regardless of active preferences.
 */
export function getSystemSkills(_preferences: Partial<GenerationPreferences>): Skill[] {
  return [
    ...Object.values(designStyleSkills),
    ...Object.values(architectureStyleSkills),
    ...Object.values(stateManagementSkills),
    ...Object.values(cssFrameworkSkills),
    ...Object.values(codeQualitySkills),
    accessibilitySkill,
  ];
}
