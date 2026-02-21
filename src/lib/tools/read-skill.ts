import { tool } from "ai";
import { z } from "zod";
import type { Skill } from "@/lib/types/skill";

export function buildReadSkillTool(skills: Skill[]) {
  return tool({
    description:
      "Load the full instructions for a skill. Review the available skills listed in your system prompt and call this tool for any skill relevant to the user's current request.",
    parameters: z.object({
      skillId: z
        .string()
        .describe("The ID of the skill to load from the available skills list"),
    }),
    execute: async ({ skillId }) => {
      const skill = skills.find((s) => s.id === skillId);
      if (!skill) {
        return `Skill "${skillId}" not found. Check available skill IDs in the system prompt.`;
      }
      return `# Skill: ${skill.name}\n\n${skill.content}`;
    },
  });
}
