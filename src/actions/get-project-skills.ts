"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Skill } from "@/lib/types/skill";

export async function getProjectSkills(projectId: string): Promise<Skill[]> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const project = await prisma.project.findUnique({
    where: { id: projectId, userId: session.userId },
    select: { skills: true },
  });

  if (!project?.skills) return [];

  try {
    return JSON.parse(project.skills);
  } catch {
    return [];
  }
}
