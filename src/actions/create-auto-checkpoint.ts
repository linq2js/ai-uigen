"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { CheckpointType } from "@/lib/project-store/types";

export async function createAutoCheckpoint(projectId: string) {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId, userId: session.userId },
      select: { data: true },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Delete all existing auto-checkpoints for this project (keep max 1)
    await prisma.checkpoint.deleteMany({
      where: { projectId, type: "auto" },
    });

    const checkpoint = await prisma.checkpoint.create({
      data: {
        name: `Auto: ${new Date().toLocaleString()}`,
        type: "auto",
        data: project.data,
        projectId,
      },
      select: { id: true, name: true, type: true, createdAt: true },
    });

    return { ...checkpoint, type: checkpoint.type as CheckpointType };
  } catch (error) {
    console.error("Failed to create auto-checkpoint:", error);
    throw new Error("Failed to create auto-checkpoint");
  }
}
