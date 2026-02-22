"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createCheckpoint(projectId: string, name: string) {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId, userId: session.userId },
    select: { data: true },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const checkpoints = await prisma.checkpoint.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (checkpoints.length >= 3) {
    await prisma.checkpoint.delete({ where: { id: checkpoints[0].id } });
  }

  const checkpoint = await prisma.checkpoint.create({
    data: {
      name,
      data: project.data,
      projectId,
    },
    select: { id: true, name: true, createdAt: true },
  });

  return checkpoint;
}
