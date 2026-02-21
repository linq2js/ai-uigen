"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Skill } from "@/lib/types/skill";

export async function saveProjectSkills(projectId: string, skills: Skill[]) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await prisma.project.update({
    where: { id: projectId, userId: session.userId },
    data: { skills: JSON.stringify(skills) },
  });
}
