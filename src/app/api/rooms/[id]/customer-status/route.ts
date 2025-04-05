import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// PATCH /api/rooms/[id]/customer-status - Update customer online status
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const resolvedParams = await context.params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { isOnline } = body;

    if (typeof isOnline !== 'boolean') {
      return NextResponse.json(
        { error: 'isOnline boolean is required' },
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

    // Update customer online status
    const updatedRoom = await prisma.room.update({
      where: {
        id,
      },
      data: {
        isCustomerOnline: isOnline,
        lastCustomerActivity: new Date(),
      },
    });

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error('Error updating customer status:', error);
    return NextResponse.json(
      { error: 'Failed to update customer status' },
      { status: 500 }
    );
  }
}