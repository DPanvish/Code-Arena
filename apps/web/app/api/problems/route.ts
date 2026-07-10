import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma, Prisma } from "../../../../../packages/db/index";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

const isDifficulty = (value: string | null): value is Difficulty =>
  value === "EASY" || value === "MEDIUM" || value === "HARD";

// GET: Public Problem List (Pagination & Filtering)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const difficultyParam = searchParams.get("difficulty");
    const difficulty = isDifficulty(difficultyParam) ? difficultyParam : null;
    const tag = searchParams.get("tag");
    const whereClause: Prisma.ProblemWhereInput = {};
    if (difficulty) whereClause.difficulty = difficulty;
    if (tag) whereClause.tags = { has: tag };

    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          tags: true,
        }
      }),
      prisma.problem.count({ where: whereClause })
    ]);

    return NextResponse.json({
      problems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Fetch Problems Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// POST: Admin Create Problem
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 });
    }

    const body = await req.json();
    const { title, slug, description, difficulty, tags, starterCode, testCases } = body;

    if (!title || !slug || !description) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const existingProblem = await prisma.problem.findUnique({ where: { slug } });
    if (existingProblem) {
      return NextResponse.json({ message: "Problem with this slug already exists" }, { status: 409 });
    }

    const newProblem = await prisma.problem.create({
      data: {
        title,
        slug,
        description,
        difficulty: isDifficulty(difficulty) ? difficulty : "MEDIUM",
        tags: tags || [],
        starterCode: starterCode || {},
        testCases: testCases || {}
      }
    });

    return NextResponse.json({ message: "Problem forged successfully", problem: newProblem }, { status: 201 });
  } catch (error) {
    console.error("Create Problem Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}