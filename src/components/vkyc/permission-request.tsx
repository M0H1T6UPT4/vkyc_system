// components/vkyc/permission-request.tsx
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface PermissionRequestProps {
  title: string;
  description: string;
  icon: ReactNode;
  type: 'camera' | 'microphone';
  onPermissionChange: (granted: boolean) => void;
}

export const PermissionRequest = ({
  title,
  description,
  icon,
  type,
  onPermissionChange,
}: PermissionRequestProps) => {
  const [permissionState, setPermissionState] = useState<'idle' | 'granted' | 'denied'>('idle');

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'camera',
        audio: type === 'microphone',
      });

      if (stream) {
        // Stop the stream after checking
        // biome-ignore lint/complexity/noForEach: <explanation>
        stream.getTracks().forEach(track => track.stop());
        setPermissionState('granted');
        onPermissionChange(true);
      }
    } catch (error) {
      console.error(`${type} permission error:`, error);
      setPermissionState('denied');
      onPermissionChange(false);
    }
  };

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'camera',
        audio: type === 'microphone',
      });

      if (stream) {
        // Keep the stream active for camera preview if needed
        if (type === 'camera') {
          // For simplicity, we just stop the tracks
          // In a real app, you might want to show a preview
          // biome-ignore lint/complexity/noForEach: <explanation>
            stream.getTracks().forEach(track => track.stop());
        } else {
          // For microphone, just stop the tracks
          // biome-ignore lint/complexity/noForEach: <explanation>
                    stream.getTracks().forEach(track => track.stop());
        }
        
        setPermissionState('granted');
        onPermissionChange(true);
      }
    } catch (error) {
      console.error(`${type} permission error:`, error);
      setPermissionState('denied');
      onPermissionChange(false);
    }
  };

  return (
    <Card className={`${
      permissionState === 'granted' 
        ? 'border-green-500' 
        : permissionState === 'denied' 
          ? 'border-red-500' 
          : ''
    }`}>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-2 bg-muted rounded-full">
            {icon}
          </div>
          <h3 className="font-medium text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          
          {permissionState === 'granted' && (
            <div className="flex items-center text-green-500 mt-2">
              <Check className="mr-1 h-4 w-4" />
              <span>Permission granted</span>
            </div>
          )}
          
          {permissionState === 'denied' && (
            <div className="flex items-center text-red-500 mt-2">
              <X className="mr-1 h-4 w-4" />
              <span>Permission denied</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <Button
          variant={permissionState === 'granted' ? 'outline' : 'default'}
          size="sm"
          onClick={requestPermission}
          disabled={permissionState === 'granted'}
        >
          {permissionState === 'granted' 
            ? 'Granted' 
            : permissionState === 'denied' 
              ? 'Retry' 
              : 'Grant Permission'}
        </Button>
      </CardFooter>
    </Card>
  );
};