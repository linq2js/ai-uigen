"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function saveProjectData(projectId: string, data: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  try {
    await prisma.project.update({
      where: { id: projectId, userId: session.userId },
      data: { data },
    });
  } catch (error) {
    console.error("Failed to save project data:", error);
    throw new Error("Failed to save project data");
  }
}
