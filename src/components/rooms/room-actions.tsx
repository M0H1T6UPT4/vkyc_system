// components/rooms/room-actions.tsx
'use client';

import { useState } from 'react';
import type { Room, User, Recording } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { Copy, CheckCircle, Video, Link, Check, X, Trash2, FileText, Eye } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { SessionDetailsSheet } from './session-details-sheet';

type RoomWithDetails = Room & {
  agent: User;
  recordings: Recording[];
};

interface RoomActionsProps {
  room: RoomWithDetails;
}

export const RoomActions = ({ room }: RoomActionsProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const copyInviteLink = async () => {
    const inviteLink = `${window.location.origin}/invite/${room.inviteToken}`;
    await navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied', {
      description: 'The invitation link has been copied to your clipboard.',
    });
  };

  const startSession = () => {
    router.push(`/rooms/${room.id}`);
  };

  const updateRoomStatus = async (status: 'ACTIVE' | 'COMPLETED' | 'REJECTED') => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/rooms/${room.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update room status');
      }

      toast.success('Room status updated', {
        description: `Room status has been updated to ${status.toLowerCase()}.`,
      });

      router.refresh();
    } catch (error) {
      toast.error('Error', {
        description: 'An error occurred while updating room status.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRoom = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/rooms/${room.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete room');
      }

      toast.success('Room deleted', {
        description: 'The room has been permanently deleted.',
      });

      router.refresh();
    } catch (error) {
      toast.error('Error', {
        description: 'An error occurred while deleting the room.',
      });
    } finally {
      setIsLoading(false);
      setIsDeleteAlertOpen(false);
    }
  };

  const hasRecordings = room.recordings && room.recordings.length > 0;
  const isCompleted = room.status === 'COMPLETED';
  const isRejected = room.status === 'REJECTED';
  const isPending = room.status === 'PENDING';
  const isActive = room.status === 'ACTIVE';
  const isCustomerOnline = room.isCustomerOnline;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <title>ICON</title>
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsDetailsOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={startSession} disabled={isCompleted || isRejected}>
            <Video className="mr-2 h-4 w-4" />
            {isCustomerOnline ? "Join Session (Customer Online)" : "Start Session"}
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={copyInviteLink} disabled={isCompleted || isRejected}>
            <Link className="mr-2 h-4 w-4" />
            Copy Invite Link
          </DropdownMenuItem>
          
          {hasRecordings && (
            <DropdownMenuItem onClick={() => setIsDetailsOpen(true)}>
              <Eye className="mr-2 h-4 w-4" />
              View Recordings ({room.recordings.length})
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          {isPending && (
            <DropdownMenuItem 
              onClick={() => updateRoomStatus('ACTIVE')}
              disabled={isLoading}
            >
              <Check className="mr-2 h-4 w-4" />
              Accept Customer
            </DropdownMenuItem>
          )}
          
          {isPending && (
            <DropdownMenuItem 
              onClick={() => updateRoomStatus('REJECTED')}
              disabled={isLoading}
            >
              <X className="mr-2 h-4 w-4" />
              Reject Customer
            </DropdownMenuItem>
          )}
          
          {(isActive || isPending) && (
            <DropdownMenuItem 
              onClick={() => updateRoomStatus('COMPLETED')}
              disabled={isLoading}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Completed
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setIsDeleteAlertOpen(true)}
            disabled={isLoading}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Session
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the session
              and all associated recordings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteRoom}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SessionDetailsSheet 
        room={room} 
        open={isDetailsOpen} 
        onOpenChange={setIsDetailsOpen}
      />
    </>
  );
};