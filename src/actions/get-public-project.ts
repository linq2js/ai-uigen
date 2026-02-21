"use server";

import { prisma } from "@/lib/prisma";

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
    messages: JSON.parse(project.messages),
    data: JSON.parse(project.data),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}
