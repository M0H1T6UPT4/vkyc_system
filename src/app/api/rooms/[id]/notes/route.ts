import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// PATCH /api/rooms/[id]/notes - Update room notes
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const resolvedParams = await context.params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { notes } = body;

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

    // Update room notes
    const updatedRoom = await prisma.room.update({
      where: {
        id,
      },
      data: {
        notes,
      },
    });

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error('Error updating room notes:', error);
    return NextResponse.json(
      { error: 'Failed to update room notes' },
      { status: 500 }
    );
  }
}