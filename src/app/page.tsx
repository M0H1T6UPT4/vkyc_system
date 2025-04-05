// app/page.tsx
import type { Metadata } from 'next';
import { RoomsTable } from '@/components/rooms/rooms-table';
import { prisma } from '@/lib/db';
import { CreateRoomDialog } from '@/components/rooms/create-room-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RoomStatus } from '@prisma/client';
import { Activity, Clock, CheckCircle, UserPlus, Video } from 'lucide-react';

export const metadata: Metadata = {
  title: 'vKYC System - Agent Dashboard',
  description: 'Agent dashboard for managing vKYC sessions',
};

export default async function Home() {
  // Fetch rooms from the database
  const rooms = await prisma.room.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      agent: true,
      recordings: true,
    },
  });

  // Calculate dashboard metrics
  const pendingRooms = rooms.filter(room => room.status === 'PENDING').length;
  const activeRooms = rooms.filter(room => room.status === 'ACTIVE').length;
  const completedRooms = rooms.filter(room => room.status === 'COMPLETED').length;
  const waitingCustomers = rooms.filter(room => room.isCustomerOnline && room.status !== 'COMPLETED' && room.status !== 'REJECTED').length;
  const recordedSessions = rooms.filter(room => room.recordings.length > 0).length;

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">vKYC Dashboard</h1>
        <CreateRoomDialog />
      </div>

      {/* Dashboard Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Sessions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRooms}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting verification
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRooms}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedRooms}</div>
            <p className="text-xs text-muted-foreground">
              Successfully verified
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waiting Customers</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{waitingCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Ready for verification
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recorded Sessions</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recordedSessions}</div>
            <p className="text-xs text-muted-foreground">
              With video recordings
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-lg border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Active Sessions Overview</h2>
        <RoomsTable data={rooms} />
      </div>
    </div>
  );
}