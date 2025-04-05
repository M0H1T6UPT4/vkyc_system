import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/rooms/[id]/recording - Toggle recording status
export async function POST(request: Request, context: RouteContext) {
  try {
    const resolvedParams = await context.params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { isRecording } = body;

    if (typeof isRecording !== 'boolean') {
      return NextResponse.json(
        { error: 'isRecording boolean is required' },
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

    // Update recording status
    const updatedRoom = await prisma.room.update({
      where: {
        id,
      },
      data: {
        isRecording,
      },
    });

    // If starting recording, create a new recording entry
    if (isRecording) {
      await prisma.recording.create({
        data: {
          roomId: id,
          fileUrl: `recording_${id}_${Date.now()}.mp4`, // In a real app, this would be the actual file URL
        },
      });
    } else {
      // If stopping recording, update the endedAt for the active recording
      const activeRecording = await prisma.recording.findFirst({
        where: {
          roomId: id,
          endedAt: null,
        },
      });

      if (activeRecording) {
        await prisma.recording.update({
          where: {
            id: activeRecording.id,
          },
          data: {
            endedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error('Error toggling recording:', error);
    return NextResponse.json(
      { error: 'Failed to toggle recording' },
      { status: 500 }
    );
  }
}