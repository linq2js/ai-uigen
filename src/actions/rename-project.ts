"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function renameProject(projectId: string, name: string) {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Name cannot be empty");
  }

  try {
    const updated = await prisma.project.update({
      where: { id: projectId, userId: session.userId },
      data: { name: trimmed },
      select: { name: true },
    });

    return updated.name;
  } catch (error) {
    console.error("Failed to rename project:", error);
    throw new Error("Failed to rename project");
  }
}
