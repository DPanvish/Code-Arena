import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../../../packages/db/index";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ message: "Email already in use" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        ratingScore: 1000, 
        ratingTier: "Bronze",
      }
    });

    return NextResponse.json({ message: "User created successfully", userId: user.id }, { status: 201 });
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}