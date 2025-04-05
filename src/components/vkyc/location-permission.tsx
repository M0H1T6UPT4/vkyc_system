'use client';

import { useState, useEffect } from 'react';
import { MapPin, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface LocationPermissionProps {
  onPermissionChange: (granted: boolean) => void;
  location: { latitude: number; longitude: number } | null;
}

export const LocationPermission = ({
  onPermissionChange,
  location,
}: LocationPermissionProps) => {
  const [permissionState, setPermissionState] = useState<'idle' | 'granted' | 'denied'>('idle');

  useEffect(() => {
    checkPermission();
  }, []);

  useEffect(() => {
    if (location) {
      setPermissionState('granted');
      onPermissionChange(true);
    }
  }, [location, onPermissionChange]);

  const checkPermission = () => {
    if (!navigator.geolocation) {
      setPermissionState('denied');
      onPermissionChange(false);
      return;
    }

    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((result) => {
        if (result.state === 'granted') {
          setPermissionState('granted');
          getLocation();
        } else if (result.state === 'prompt') {
          setPermissionState('idle');
        } else {
          setPermissionState('denied');
          onPermissionChange(false);
        }
      })
      .catch(() => {
        // Fallback to direct geolocation request if permissions API is not available
        getLocation();
      });
  };

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPermissionState('granted');
        onPermissionChange(true);
      },
      (error) => {
        console.error('Error getting location:', error);
        setPermissionState('denied');
        onPermissionChange(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const requestPermission = () => {
    getLocation();
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
            <MapPin className="h-8 w-8" />
          </div>
          <h3 className="font-medium text-lg">Location Access</h3>
          <p className="text-sm text-muted-foreground">
            We need your precise location for verification and fraud prevention
          </p>
          
          {permissionState === 'granted' && (
            <div className="flex items-center text-green-500 mt-2">
              <Check className="mr-1 h-4 w-4" />
              <span>Location access granted</span>
            </div>
          )}
          
          {permissionState === 'denied' && (
            <div className="flex items-center text-red-500 mt-2">
              <X className="mr-1 h-4 w-4" />
              <span>Location access denied</span>
            </div>
          )}
          
          {location && (
            <div className="text-xs text-muted-foreground mt-2">
              Lat: {location.latitude.toFixed(6)}, Long: {location.longitude.toFixed(6)}
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