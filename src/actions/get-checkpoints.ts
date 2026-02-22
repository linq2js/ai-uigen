"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    select: { id: true, name: true, createdAt: true },
  });

  return checkpoints;
}
