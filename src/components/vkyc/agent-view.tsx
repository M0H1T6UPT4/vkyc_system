// components/vkyc/agent-view.tsx
'use client';

import { useState } from 'react';
import type { Room, User } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { Camera, CameraOff, Video, Check, Copy, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { JitsiMeeting } from './jitsi-meeting';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AgentViewProps {
  room: Room;
  agent: User;
}

export const AgentView = ({ room, agent }: AgentViewProps) => {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(room.isRecording);
  const [isCameraOn, setIsCameraOn] = useState(true);
  
  const copyInviteLink = async () => {
    const inviteLink = `${window.location.origin}/invite/${room.inviteToken}`;
    await navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied', {
      description: 'The invitation link has been copied to your clipboard.',
    });
  };

  const toggleRecording = async () => {
    try {
      const response = await fetch(`/api/rooms/${room.id}/recording`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRecording: !isRecording }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle recording');
      }

      setIsRecording(!isRecording);
      toast.success(isRecording ? 'Recording stopped' : 'Recording started', {
        description: isRecording 
          ? 'The vKYC session recording has been stopped.' 
          : 'The vKYC session is now being recorded.',
      });
    } catch (error) {
      toast.error('Error', {
        description: 'An error occurred while toggling recording.',
      });
    }
  };

  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn);
    // In a real implementation, you would interact with the Jitsi API to toggle camera
  };

  const completeSession = async () => {
    try {
      const response = await fetch(`/api/rooms/${room.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete session');
      }

      toast.success('Session completed', {
        description: 'The vKYC session has been marked as completed.',
      });

      router.push('/');
    } catch (error) {
      toast.error('Error', {
        description: 'An error occurred while completing the session.',
      });
    }
  };

  const handleMeetingEnd = () => {
    router.push('/');
  };

  // Status display
  const statusConfig = {
    PENDING: { label: 'Pending', variant: 'outline' as const },
    ACTIVE: { label: 'Active', variant: 'default' as const },
    COMPLETED: { label: 'Completed', variant: 'secondary' as const },
    REJECTED: { label: 'Rejected', variant: 'destructive' as const },
  };
  
  const { label, variant } = statusConfig[room.status as keyof typeof statusConfig];

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">vKYC Session</h1>
            <Badge variant={variant}>{label}</Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyInviteLink}
              disabled={room.status === 'COMPLETED' || room.status === 'REJECTED'}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Invite Link
            </Button>
            
            <Button
              variant={isRecording ? 'destructive' : 'outline'}
              size="sm"
              onClick={toggleRecording}
              disabled={room.status === 'COMPLETED' || room.status === 'REJECTED'}
            >
              <Video className="mr-2 h-4 w-4" />
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleCamera}
              disabled={room.status === 'COMPLETED' || room.status === 'REJECTED'}
            >
              {isCameraOn ? (
                <>
                  <CameraOff className="mr-2 h-4 w-4" />
                  Turn Off Camera
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Turn On Camera
                </>
              )}
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={completeSession}
              disabled={room.status === 'COMPLETED' || room.status === 'REJECTED'}
            >
              <Check className="mr-2 h-4 w-4" />
              Complete Session
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
            <CardDescription>
              Customer: <strong>{room.customerName}</strong> • 
              Application ID: <strong>{room.applicationId}</strong>
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {room.status === 'COMPLETED' || room.status === 'REJECTED' ? (
              <div className="p-12 text-center">
                <h3 className="text-xl font-medium mb-2">
                  This session is {room.status === 'COMPLETED' ? 'completed' : 'rejected'}
                </h3>
                <p className="text-muted-foreground">
                  {room.status === 'COMPLETED' 
                    ? 'The vKYC verification has been successfully completed.' 
                    : 'This application has been rejected.'}
                </p>
              </div>
            ) : (
              <div className="h-[600px] w-full">
                <JitsiMeeting 
                  roomId={room.id} 
                  user={agent} 
                  isAgent={true}
                  onMeetingEnd={handleMeetingEnd}
                />
              </div>
            )}
          </CardContent>
          
          {(room.status === 'COMPLETED' || room.status === 'REJECTED') && (
            <CardFooter className="justify-center">
              <Button asChild>
                <Link href="/">
                  Return to Dashboard
                </Link>
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};