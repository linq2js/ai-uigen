export interface Skill {
  id: string;
  name: string;
  description: string;
  content: string;
  enabled: boolean;
}

export interface SkillDescriptor {
  id: string;
  name: string;
  description: string;
}

export function toDescriptor(skill: Skill): SkillDescriptor {
  return { id: skill.id, name: skill.name, description: skill.description };
}
