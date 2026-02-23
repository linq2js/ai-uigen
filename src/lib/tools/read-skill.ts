import { tool } from "ai";
import { z } from "zod";
import type { Skill } from "@/lib/types/skill";

export const ReadSkillParameters = z.object({
  skillId: z
    .string()
    .describe("The ID of the skill to load from the available skills list"),
});

/** Tool schema (no execute) for the thin proxy. */
export const readSkillSchema = {
  description:
    "Load the full instructions for a skill. Review the available skills listed in your system prompt and call this tool for any skill relevant to the user's current request.",
  parameters: ReadSkillParameters,
};

/** Execute the read_skill tool against a skills array. */
export function executeReadSkill(
  skills: Skill[],
  args: z.infer<typeof ReadSkillParameters>
): string {
  const skill = skills.find((s) => s.id === args.skillId);
  if (!skill) {
    return `Skill "${args.skillId}" not found. Check available skill IDs in the system prompt.`;
  }
  return `# Skill: ${skill.name}\n\n${skill.content}`;
}

export function buildReadSkillTool(skills: Skill[]) {
  return tool({
    ...readSkillSchema,
    execute: async (args: z.infer<typeof ReadSkillParameters>) =>
      executeReadSkill(skills, args),
  });
}
