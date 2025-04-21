/**
 * Note item component for displaying a single note
 */
import React from 'react';
import { Note } from '../../../types/types';
import { FileText, Image, File, MessageSquare, Clock } from 'lucide-react';

interface NoteItemProps {
  note: Note;
}

export default function NoteItem({ note }: NoteItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getNoteIcon = () => {
    switch (note.type) {
      case 'text':
        return <FileText className="h-5 w-5 text-gray-500" />;
      case 'image':
        return <Image className="h-5 w-5 text-gray-500" />;
      case 'file':
        return <File className="h-5 w-5 text-gray-500" />;
      case 'transcript':
        return <MessageSquare className="h-5 w-5 text-gray-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="mr-3">
          {getNoteIcon()}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {note.created_at ? formatDate(note.created_at) : 'Just now'}
            </span>
          </div>
          
          <div className="prose prose-sm max-w-none">
            {note.type === 'text' && note.content && (
              <p className="whitespace-pre-wrap">{note.content}</p>
            )}
            
            {note.type === 'image' && note.file_url && (
              <div>
                <img 
                  src={note.file_url} 
                  alt="Note" 
                  className="max-w-full rounded-md" 
                />
              </div>
            )}
            
            {note.type === 'file' && note.file_url && (
              <div className="flex items-center p-3 bg-gray-50 rounded-md">
                <File className="h-6 w-6 text-gray-500 mr-2" />
                <div>
                  <p className="font-medium">Document</p>
                  <a 
                    href={note.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View Document
                  </a>
                </div>
              </div>
            )}
            
            {note.type === 'transcript' && note.content && (
              <div>
                <div className="p-2 bg-gray-50 rounded-md mb-2">
                  <p className="text-xs font-medium text-gray-700">Transcript Summary</p>
                </div>
                <p className="whitespace-pre-wrap">{note.content}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}