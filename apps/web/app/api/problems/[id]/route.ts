import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "@codearena/db";

// PUT: Admin Update a Specific Problem
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 });
    }

    const problemId = params.id;
    const body = await req.json();
    
    const { title, slug, description, difficulty, tags, starterCode, testCases } = body;

    const existingProblem = await prisma.problem.findUnique({
      where: { id: problemId }
    });

    if (!existingProblem) {
      return NextResponse.json({ message: "Problem not found" }, { status: 404 });
    }

    const updatedProblem = await prisma.problem.update({
      where: { id: problemId },
      data: {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(description && { description }),
        ...(difficulty && { difficulty }),
        ...(tags && { tags }),
        ...(starterCode && { starterCode }),
        ...(testCases && { testCases }),
      }
    });

    return NextResponse.json({ message: "Problem updated successfully", problem: updatedProblem }, { status: 200 });
  } catch (error) {
    console.error("Update Problem Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Admin Delete a Specific Problem
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 });
    }

    const problemId = params.id;

    const existingProblem = await prisma.problem.findUnique({
      where: { id: problemId }
    });

    if (!existingProblem) {
      return NextResponse.json({ message: "Problem not found" }, { status: 404 });
    }

    await prisma.problem.delete({
      where: { id: problemId }
    });

    return NextResponse.json({ message: "Problem permanently deleted from the Arena" }, { status: 200 });
  } catch (error) {
    console.error("Delete Problem Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}