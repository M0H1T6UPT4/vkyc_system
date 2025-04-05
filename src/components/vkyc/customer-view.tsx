'use client';

import { useState, useEffect } from 'react';
import type { Room } from '@prisma/client';
import { Camera, Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { JitsiMeeting } from './jitsi-meeting';
import { PermissionRequest } from './permission-request';
import { LocationPermission } from './location-permission';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CustomerViewProps {
  room: Room;
}

export const CustomerView = ({ room }: CustomerViewProps) => {
  const router = useRouter();
  const [permissions, setPermissions] = useState({
    camera: false,
    microphone: false,
    location: false,
  });
  const [userName, setUserName] = useState('');
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [showMeeting, setShowMeeting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem('userName')) {
      setUserName(localStorage.getItem('userName') || '');
    }

    // Update customer online status when component mounts
    updateCustomerOnlineStatus(true);

    // Update customer online status when component unmounts
    return () => {
      updateCustomerOnlineStatus(false);
    };
  }, []);
  
  const updateCustomerOnlineStatus = async (isOnline: boolean) => {
    try {
      await fetch(`/api/rooms/${room.id}/customer-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isOnline }),
      });
    } catch (error) {
      console.error('Error updating customer online status:', error);
    }
  };

  const handlePermissionsGranted = (type: 'camera' | 'microphone' | 'location', granted: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [type]: granted,
    }));

    // If location permission granted, try to get high accuracy location
    // if (type === 'location' && granted) {
    //   navigator.geolocation.getCurrentPosition(
    //     (position) => {
    //       setLocation({
    //         latitude: position.coords.latitude,
    //         longitude: position.coords.longitude,
    //       });
    //     },
    //     (error) => {
    //       console.error('Error getting location:', error);
    //       setError('Could not get your accurate location. Please try again or enable location services.');
    //       setPermissions(prev => ({
    //         ...prev,
    //         location: false,
    //       }));
    //     },
    //     { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    //   );
    // }
  };

  const handleStartMeeting = () => {
    if (!userName.trim()) {
      setError('Please enter your name to join the meeting');
      return;
    }
    
    localStorage.setItem('userName', userName);
    setShowMeeting(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserName(e.target.value);
  };

  // Create a dummy user object for Jitsi
  const dummyUser = {
    id: 'customer',
    name: userName,
    username: userName,
    email: '',
    password: '',
    role: 'customer',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const allPermissionsGranted = permissions.camera && permissions.microphone && permissions.location;
  const isSessionInvalid = room.status === 'COMPLETED' || room.status === 'REJECTED';

  if (isSessionInvalid) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Session Unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTitle>This session is no longer available</AlertTitle>
              <AlertDescription>
                {room.status === 'COMPLETED' 
                  ? 'This vKYC session has been completed. Thank you for your participation.'
                  : 'This vKYC session has been rejected or cancelled.'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">vKYC Verification</CardTitle>
          <CardDescription className="text-center">
            Please grant the required permissions to proceed with your verification
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {showMeeting ? (
            <div className="h-[600px] w-full">
              <JitsiMeeting 
                roomId={room.id} 
                user={dummyUser} 
                isAgent={false}
              />
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <PermissionRequest
                    title="Camera Access"
                    description="We need access to your camera for identity verification"
                    icon={<Camera className="h-8 w-8" />}
                    type="camera"
                    onPermissionChange={(granted) => handlePermissionsGranted('camera', granted)}
                  />
                  
                  <PermissionRequest
                    title="Microphone Access"
                    description="We need access to your microphone for communication"
                    icon={<Smartphone className="h-8 w-8" />}
                    type="microphone"
                    onPermissionChange={(granted) => handlePermissionsGranted('microphone', granted)}
                  />
                </div>
                
                <LocationPermission
                  onPermissionChange={(granted) => handlePermissionsGranted('location', granted)}
                  location={location}
                />
                
                <div className="pt-4">
                  <label htmlFor="userName" className="block text-sm font-medium mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="userName"
                    value={userName}
                    onChange={handleNameChange}
                    placeholder="Enter your full name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
        
        {!showMeeting && (
          <CardFooter>
            <Button 
              onClick={handleStartMeeting} 
              disabled={!allPermissionsGranted || !userName.trim()}
              className="w-full"
            >
              Join vKYC Session
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};