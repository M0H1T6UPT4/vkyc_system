import { NextResponse } from "next/server"
import { hash } from "@node-rs/argon2"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json()

    // Validate inputs
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or username already exists" },
        { status: 409 }
      )
    }

    // Hash password with argon2 (extreme security settings)
    const hashedPassword = await hash(password, {
    algorithm: 2,
      memoryCost: 65536, // 64 MiB
      timeCost: 3,       // 3 iterations
      parallelism: 4,    // 4 threads
    })

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name: username // Default name to username
      }
    })

    // Return success but don't include password
    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Error creating user" },
      { status: 500 }
    )
  }
}