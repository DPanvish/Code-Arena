import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../../../packages/db/index";
import { submissionQueue } from "../../../lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // 1. Strict Authentication Guard
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { problemId, code, language } = body;

    // 2. Validate Payload
    if (!problemId || !code || !language) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // 3. Verify the Problem Exists
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      select: { id: true, testCases: true } // We fetch testCases to send to the worker
    });

    if (!problem) {
      return NextResponse.json({ message: "Problem not found" }, { status: 404 });
    }

    // 4. Create the PENDING submission in PostgreSQL
    const submission = await prisma.submission.create({
      data: {
        userId: session.user.id,
        problemId: problem.id,
        code,
        language,
        status: "PENDING",
      }
    });

    // 5. Enqueue the Job to BullMQ (Redis)
    await submissionQueue.add(
      "judge-execution", 
      {
        submissionId: submission.id,
        code,
        language,
        testCases: problem.testCases, 
      },
      {
        jobId: submission.id, // Enforces uniqueness and traceability
      }
    );

    // 6. Return the ID immediately so the frontend can open a WebSocket/Poll for results
    return NextResponse.json({ 
      message: "Submission queued successfully", 
      submissionId: submission.id 
    }, { status: 201 });

  } catch (error) {
    console.error("Submission API Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}