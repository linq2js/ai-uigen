"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { CheckpointType } from "@/lib/project-store/types";

export async function getCheckpoints(projectId: string) {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const checkpoints = await prisma.checkpoint.findMany({
    where: {
      projectId,
      project: { userId: session.userId },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, type: true, createdAt: true },
  });

  return checkpoints.map((cp) => ({
    ...cp,
    type: (cp.type as CheckpointType) ?? "manual",
  }));
}
