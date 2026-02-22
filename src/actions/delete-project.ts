"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function deleteProject(projectId: string) {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    await prisma.project.delete({
      where: { id: projectId, userId: session.userId },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete project:", error);
    throw new Error("Failed to delete project");
  }
}
