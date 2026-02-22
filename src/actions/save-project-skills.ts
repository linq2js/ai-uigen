"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Skill } from "@/lib/types/skill";

export async function saveProjectSkills(projectId: string, skills: Skill[]) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  try {
    await prisma.project.update({
      where: { id: projectId, userId: session.userId },
      data: { skills: JSON.stringify(skills) },
    });
  } catch (error) {
    console.error("Failed to save project skills:", error);
    throw new Error("Failed to save project skills");
  }
}
