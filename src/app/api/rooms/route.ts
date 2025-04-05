import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/rooms - Get all rooms
export async function GET() {
    try {
      const rooms = await prisma.room.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          agent: true,
        },
      });
  
      return NextResponse.json(rooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return NextResponse.json(
        { error: 'Failed to fetch rooms' },
        { status: 500 }
      );
    }
  }
  
  // POST /api/rooms - Create a new room
  export async function POST(request: Request) {
    try {
      const body = await request.json();
      const { customerName, applicationId } = body;
  
      // Validate input
      if (!customerName || !applicationId) {
        return NextResponse.json(
          { error: 'Customer name and application ID are required' },
          { status: 400 }
        );
      }
  
      // In a real app, you would get the agent ID from the authenticated user
      // For now, we'll use a hardcoded agent ID
      const agent = await prisma.user.findFirst({
        where: {
          role: 'agent',
        },
      });
  
      if (!agent) {
        // If no agent exists, create a default one for demo purposes
        const defaultAgent = await prisma.user.create({
          data: {
            name: 'Default Agent',
            email: 'agent@example.com',
            password: 'password', // In real app, this would be hashed
            role: 'agent',
          },
        });
        
        const room = await prisma.room.create({
          data: {
            customerName,
            applicationId,
            agentId: defaultAgent.id,
          },
        });
    
        return NextResponse.json(room);
      }
  
      const room = await prisma.room.create({
        data: {
          customerName,
          applicationId,
          agentId: agent.id,
        },
      });
  
      return NextResponse.json(room);
    } catch (error) {
      console.error('Error creating room:', error);
      return NextResponse.json(
        { error: 'Failed to create room' },
        { status: 500 }
      );
    }
  }