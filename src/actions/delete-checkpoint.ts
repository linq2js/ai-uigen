"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function deleteCheckpoint(checkpointId: string) {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    await prisma.checkpoint.delete({
      where: {
        id: checkpointId,
        project: { userId: session.userId },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete checkpoint:", error);
    throw new Error("Failed to delete checkpoint");
  }
}
