import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * POST /api/sync/delete
 *
 * Delete a project from PostgreSQL. Only the owner can delete.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { id: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id } = body;
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  // Only delete if the project belongs to this user
  const deleted = await prisma.project.deleteMany({
    where: { id, userId: session.userId },
  });

  return Response.json({ deleted: deleted.count });
}
