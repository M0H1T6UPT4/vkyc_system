'use client';

import { useEffect, useState } from 'react';
import type { Room, User, Recording } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Edit, Save, FileText, Video, Clock, User as UserIcon, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import RecordingsViewer from './recordings-viewer';

// Import WYSIWYG editor
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Toolbar from './editor-toolbar';
import TextAlign from '@tiptap/extension-text-align';

interface SessionDetailsSheetProps {
  room: Room & {
    agent: User;
    recordings: Recording[];
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionDetailsSheet({
  room,
  open,
  onOpenChange,
}: SessionDetailsSheetProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(room.notes || '');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize the TipTap editor with initial control set by isEditing.
  const editor = useEditor({
    extensions: [StarterKit],
    content: notes,
    editable: isEditing, // initial state
    onUpdate: ({ editor }) => {
      setNotes(editor.getHTML());
    },
  });

  // Update the editor's editable state when isEditing changes.
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  // Execute a flawless save operation for our session notes.
  const handleSaveNotes = async () => {
    if (!notes.trim() && !room.notes) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/rooms/${room.id}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to save notes');
      }

      toast.success('Notes saved successfully');
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      toast.error('Failed to save notes');
      console.error('Error saving notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Assemble our status squad to showcase the session state with style.
  const statusConfig = {
    PENDING: { label: 'Pending', variant: 'outline' as const },
    ACTIVE: { label: 'Active', variant: 'default' as const },
    COMPLETED: { label: 'Completed', variant: 'secondary' as const },
    REJECTED: { label: 'Rejected', variant: 'destructive' as const },
  };

  const { label, variant } =
    statusConfig[room.status as keyof typeof statusConfig];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl p-6 overflow-y-auto bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <SheetHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-semibold">
              Session Details
            </SheetTitle>
            <Badge variant={variant} className="text-sm">
              {label}
            </Badge>
          </div>
          <SheetDescription className="mt-2 text-gray-600 dark:text-gray-400">
            Application ID:{' '}
            <span className="font-mono">{room.applicationId}</span>
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="details" className="mt-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <TabsTrigger value="details" className="px-4 py-2 text-sm font-medium">
              Customer Details
            </TabsTrigger>
            <TabsTrigger value="notes" className="px-4 py-2 text-sm font-medium">
              Session Notes
            </TabsTrigger>
            <TabsTrigger value="recordings" className="px-4 py-2 text-sm font-medium">
              Recordings
            </TabsTrigger>
          </TabsList>

          {/* Customer Details Tab */}
          <TabsContent value="details" className="mt-6 space-y-6">
            <div className="grid gap-4">
              <div className="flex items-center">
                <UserIcon className="mr-3 h-5 w-5 text-gray-500" />
                <span className="font-medium text-lg">Customer:</span>
                <span className="ml-3 text-gray-700 dark:text-gray-300">
                  {room.customerName}
                </span>
              </div>

              <div className="flex items-center">
                <Calendar className="mr-3 h-5 w-5 text-gray-500" />
                <span className="font-medium text-lg">Created:</span>
                <span className="ml-3 text-gray-700 dark:text-gray-300">
                  {format(new Date(room.createdAt), 'PPpp')}
                </span>
              </div>

              {room.completedAt && (
                <div className="flex items-center">
                  <CheckCircle className="mr-3 h-5 w-5 text-green-500" />
                  <span className="font-medium text-lg">Completed:</span>
                  <span className="ml-3 text-gray-700 dark:text-gray-300">
                    {format(new Date(room.completedAt), 'PPpp')}
                  </span>
                </div>
              )}

              <div className="flex items-center">
                <Clock className="mr-3 h-5 w-5 text-gray-500" />
                <span className="font-medium text-lg">Status:</span>
                <Badge variant={variant} className="ml-3">
                  {label}
                </Badge>
                {room.isCustomerOnline && (
                  <Badge variant="secondary" className="ml-3">
                    Customer Online
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium text-lg mb-2">Invite Link</h3>
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-xs break-all font-mono">
                {`${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${room.inviteToken}`}
              </div>
            </div>
          </TabsContent>

          {/* Session Notes Tab */}
          <TabsContent value="notes" className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg">Session Notes</h3>
              {isEditing ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={isLoading}
                  className="flex items-center"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? 'Saving...' : 'Save'}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>

            <div
              className={`border rounded-md p-4 min-h-[200px] ${
                isEditing
                  ? 'bg-white dark:bg-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              {editor && (
                <>
                  {isEditing && <Toolbar editor={editor} />}
                  <EditorContent
                    editor={editor}
                    className="prose max-w-none mt-4"
                  />
                </>
              )}
              {!notes && !isEditing && (
                <div className="text-gray-500 dark:text-gray-400 flex items-center justify-center h-full">
                  <FileText className="mr-2 h-5 w-5" />
                  No notes added yet
                </div>
              )}
            </div>
          </TabsContent>

          {/* Recordings Tab */}
          <TabsContent value="recordings" className="mt-6">
            <RecordingsViewer recordings={room.recordings} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
