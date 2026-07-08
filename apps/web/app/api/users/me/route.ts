import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../.././lib/auth";
import { prisma } from "../../../../../../packages/db/index";

// GET: Fetch the current user's profile and stats
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        ratingTier: true,
        ratingScore: true,
        role: true,
        createdAt: true,
        _count: {
          select: { submissions: true } 
        }
      }
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Profile GET Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Update the current user's profile (e.g., username)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const name = body?.name;

    if (typeof name !== "string" || name.trim().length < 3) {
      return NextResponse.json({ message: "Username must be at least 3 characters" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { name: name.trim() },
      select: {
        id: true,
        name: true,
        email: true,
      }
    });

    return NextResponse.json({ message: "Profile updated successfully", user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Profile PATCH Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}