// apps/web/app/api/problems/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../../packages/db/index";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit');

    const problems = await prisma.problem.findMany({
      take: limit ? parseInt(limit) : undefined,
      orderBy: { createdAt: 'desc' },
      // By omitting the 'select' object, Prisma automatically returns ALL columns, 
      // including description and testCases.
    });

    return NextResponse.json({ problems }, { status: 200 });
  } catch (error) {
    console.error("Error fetching problems:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, slug, description, difficulty, tags, starterCode, testCases } = body;

    const problem = await prisma.problem.create({
      data: {
        title,
        slug,
        description,
        difficulty,
        tags: tags || [],
        starterCode: starterCode || "{}",
        testCases: testCases || "[]"
      }
    });

    return NextResponse.json({ message: "Problem created successfully", problem }, { status: 201 });
  } catch (error) {
    console.error("Error creating problem:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}