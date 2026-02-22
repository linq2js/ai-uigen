"use server";

import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/safe-json";

export async function getPublicProject(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId, published: true },
  });

  if (!project) {
    return null;
  }

  return {
    id: project.id,
    name: project.name,
    messages: safeJsonParse(project.messages, []),
    data: safeJsonParse(project.data, {}),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}
