import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * GET /api/sync?ids=id1,id2,...
 *
 * Returns `[{ id, updatedAt }]` for the given project IDs owned by the
 * authenticated user. Used by the client to compare local timestamps and
 * decide whether to push or pull.
 *
 * If `ids` is omitted, returns ALL projects for the user — used for
 * discovering projects created on other devices.
 */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const idsParam = url.searchParams.get("ids");

  const where: { userId: string; id?: { in: string[] } } = {
    userId: session.userId,
  };

  if (idsParam) {
    const ids = idsParam.split(",").filter(Boolean);
    if (ids.length === 0) {
      return Response.json([]);
    }
    where.id = { in: ids };
  }

  const projects = await prisma.project.findMany({
    where,
    select: { id: true, updatedAt: true },
  });

  return Response.json(
    projects.map((p) => ({ id: p.id, updatedAt: p.updatedAt.toISOString() }))
  );
}
