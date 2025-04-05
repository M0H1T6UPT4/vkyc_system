import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { CustomerView } from '@/components/vkyc/customer-view';

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const room = await prisma.room.findUnique({
    where: {
      inviteToken: resolvedParams.token,
    },
  });

  if (!room) {
    return {
      title: 'Invalid Invitation',
    };
  }

  return {
    title: `vKYC Verification - ${room.customerName}`,
  };
}

export default async function InvitePage({ params }: PageProps) {
  const resolvedParams = await params;
  const { token } = resolvedParams;

  const room = await prisma.room.findUnique({
    where: {
      inviteToken: token,
    },
  });

  if (!room) {
    notFound();
  }

  return <CustomerView room={room} />;
}