import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { RoomStatus } from '@prisma/client';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// PATCH /api/rooms/[id]/status - Update room status
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const resolvedParams = await context.params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !Object.values(RoomStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required' },
        { status: 400 }
      );
    }

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

    // Update room status
    const updatedRoom = await prisma.room.update({
      where: {
        id,
      },
      data: {
        status,
        ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
    });

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error('Error updating room status:', error);
    return NextResponse.json(
      { error: 'Failed to update room status' },
      { status: 500 }
    );
  }
}