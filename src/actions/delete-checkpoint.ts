"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function deleteCheckpoint(checkpointId: string) {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  await prisma.checkpoint.delete({
    where: {
      id: checkpointId,
      project: { userId: session.userId },
    },
  });

  return { success: true };
}
