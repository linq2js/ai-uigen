"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function restoreCheckpoint(checkpointId: string) {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    const checkpoint = await prisma.checkpoint.findUnique({
      where: {
        id: checkpointId,
        project: { userId: session.userId },
      },
      select: { data: true, projectId: true },
    });

    if (!checkpoint) {
      throw new Error("Checkpoint not found");
    }

    await prisma.project.update({
      where: { id: checkpoint.projectId, userId: session.userId },
      data: { data: checkpoint.data },
    });

    return { projectId: checkpoint.projectId };
  } catch (error) {
    console.error("Failed to restore checkpoint:", error);
    throw new Error("Failed to restore checkpoint");
  }
}
