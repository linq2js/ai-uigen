"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getProjectRules(projectId: string): Promise<string> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const project = await prisma.project.findUnique({
    where: { id: projectId, userId: session.userId },
    select: { rules: true },
  });

  return project?.rules ?? "";
}
