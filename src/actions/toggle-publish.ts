"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function togglePublish(projectId: string) {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId, userId: session.userId },
      select: { published: true },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    const updated = await prisma.project.update({
      where: { id: projectId, userId: session.userId },
      data: { published: !project.published },
      select: { published: true },
    });

    return updated.published;
  } catch (error) {
    console.error("Failed to toggle publish:", error);
    throw new Error("Failed to toggle publish status");
  }
}
