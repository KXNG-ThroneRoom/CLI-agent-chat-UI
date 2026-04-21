import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { content } = await req.json();

  return NextResponse.json({
    id: params.id,
    content,
    updatedAt: new Date().toISOString(),
  });
}
