import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'node:crypto';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/rooms/[id]/invite - Generate a new invitation token
export async function POST(request: Request, context: RouteContext) {
  try {
    const resolvedParams = await context.params;
    const { id } = resolvedParams;
    
    // Check if room exists
    const room = await prisma.room.findUnique({
      where: {
        id,
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Generate a new invitation token
    const inviteToken = crypto.randomBytes(16).toString('hex');
    
    // Update the room with the new token
    const updatedRoom = await prisma.room.update({
      where: {
        id,
      },
      data: {
        inviteToken,
      },
    });

    // Return the invite URL
    return NextResponse.json({
      inviteUrl: `/invite/${inviteToken}`,
    });
  } catch (error) {
    console.error('Error generating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to generate invitation' },
      { status: 500 }
    );
  }
}