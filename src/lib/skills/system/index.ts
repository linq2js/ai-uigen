import type { GenerationPreferences } from "@/lib/types/preferences";
import { DEFAULT_PREFERENCES } from "@/lib/types/preferences";
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
 * Returns system skills that should be activated based on the user's preferences.
 * Only returns skills for preferences that differ from the defaults.
 */
export function getSystemSkills(preferences: Partial<GenerationPreferences>): Skill[] {
  const prefs = { ...DEFAULT_PREFERENCES, ...preferences };
  const skills: Skill[] = [];

  if (prefs.designStyle !== DEFAULT_PREFERENCES.designStyle) {
    const skill = designStyleSkills[prefs.designStyle];
    if (skill) skills.push(skill);
  }

  if (prefs.architectureStyle !== DEFAULT_PREFERENCES.architectureStyle) {
    const skill = architectureStyleSkills[prefs.architectureStyle];
    if (skill) skills.push(skill);
  }

  if (prefs.stateManagement !== DEFAULT_PREFERENCES.stateManagement) {
    const skill = stateManagementSkills[prefs.stateManagement];
    if (skill) skills.push(skill);
  }

  if (prefs.cssFramework !== DEFAULT_PREFERENCES.cssFramework) {
    const skill = cssFrameworkSkills[prefs.cssFramework];
    if (skill) skills.push(skill);
  }

  if (prefs.codeQuality !== DEFAULT_PREFERENCES.codeQuality) {
    const skill = codeQualitySkills[prefs.codeQuality];
    if (skill) skills.push(skill);
  }

  if (prefs.accessibility) {
    skills.push(accessibilitySkill);
  }

  return skills;
}
