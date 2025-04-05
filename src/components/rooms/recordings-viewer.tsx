// components/rooms/recordings-viewer.tsx
'use client';

import { useState } from 'react';
import type { Recording } from '@prisma/client';
import { format } from 'date-fns';
import { Play, Download, Video, FileClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table';

interface RecordingsViewerProps {
  recordings: Recording[];
}

export default function RecordingsViewer({ recordings }: RecordingsViewerProps) {
  const [playingRecording, setPlayingRecording] = useState<Recording | null>(null);

  const formatDuration = (start: Date, end: Date | null) => {
    if (!end) return 'In progress';
    const durationMs = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const handlePlay = (recording: Recording) => {
    setPlayingRecording(recording);
  };

  const handleDownload = (recording: Recording) => {
    // In a real app, this would download the recording file
    // For demo purposes, we'll just simulate a download
    const link = document.createElement('a');
    link.href = recording.fileUrl;
    link.download = `recording_${recording.id}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Session Recordings</h3>
      </div>

      {recordings.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Video className="h-8 w-8 mx-auto mb-2" />
          <p>No recordings available for this session</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recordings.map((recording) => (
              <TableRow key={recording.id}>
                <TableCell>
                  {format(new Date(recording.startedAt), 'MMM d, yyyy h:mm a')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <FileClock className="h-4 w-4 mr-2" />
                    {formatDuration(recording.startedAt, recording.endedAt)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePlay(recording)}
                    className="mr-1"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Play
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(recording)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!playingRecording} onOpenChange={(open) => !open && setPlayingRecording(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Recording Playback</DialogTitle>
            {playingRecording && (
              <DialogDescription>
                Recorded on {format(new Date(playingRecording.startedAt), 'PPpp')}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="mt-4 aspect-video bg-black rounded-md flex items-center justify-center">
            {playingRecording && (
              // biome-ignore lint/a11y/useMediaCaption: <explanation>
            <video
                controls
                autoPlay
                className="w-full h-full rounded-md"
                src={playingRecording.fileUrl}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}