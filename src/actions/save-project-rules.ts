"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function saveProjectRules(projectId: string, rules: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  try {
    await prisma.project.update({
      where: { id: projectId, userId: session.userId },
      data: { rules },
    });
  } catch (error) {
    console.error("Failed to save project rules:", error);
    throw new Error("Failed to save project rules");
  }
}
