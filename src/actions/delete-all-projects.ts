"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function deleteAllProjects() {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    const result = await prisma.project.deleteMany({
      where: { userId: session.userId },
    });

    return { success: true, count: result.count };
  } catch (error) {
    console.error("Failed to delete all projects:", error);
    throw new Error("Failed to delete all projects");
  }
}
