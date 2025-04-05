// app/rooms/[id]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { AgentView } from '@/components/vkyc/agent-view';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const room = await prisma.room.findUnique({
    where: {
      id: resolvedParams.id,
    },
  });

  if (!room) {
    return {
      title: 'Room Not Found',
    };
  }

  return {
    title: `vKYC Session - ${room.customerName}`,
  };
}

export default async function RoomPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const room = await prisma.room.findUnique({
    where: {
      id,
    },
    include: {
      agent: true,
    },
  });

  if (!room) {
    notFound();
  }

  return <AgentView room={room} agent={room.agent} />;
}