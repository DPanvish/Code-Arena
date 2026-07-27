import { NextResponse } from "next/server";
import { prisma } from "../../../../../../packages/db/index";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const submission = await prisma.submission.findUnique({
      where: { id },
      select: {
        status: true,
        executionMs: true,
        memoryKb: true,
      }
    });

    if (!submission) {
      return NextResponse.json({ message: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({ submission }, { status: 200 });
  } catch (error) {
    console.error("Error fetching submission:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}