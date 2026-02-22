export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY ?? "";
  return Response.json({
    hasServerKey: key.startsWith("sk-ant-"),
  });
}
