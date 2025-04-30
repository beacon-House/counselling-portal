/**
 * Note item component for displaying a single note in the list view
 */
import React from 'react';
import { Note } from '../../../types/types';
import { FileText, MessageSquare, Clock, User, Pencil, FileType } from 'lucide-react';
import { motion } from 'framer-motion';

interface NoteItemProps {
  note: Note;
  onEdit?: (note: Note) => void;
}

export default function NoteItem({ note, onEdit }: NoteItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getNoteIcon = () => {
    switch (note.type) {
      case 'text':
        return <FileText className="h-5 w-5 text-gray-400" />;
      case 'transcript':
        return <MessageSquare className="h-5 w-5 text-gray-400" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  // Get a short preview of the content
  const getContentPreview = (content: string, maxLength: number = 120) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Check if note has been edited
  const hasBeenEdited = note.updated_at && note.updated_by;

  const handleEditClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent the note click event from firing
    e.stopPropagation();
    if (onEdit) {
      onEdit(note);
    }
  };

  return (
    <div className={`bg-white border border-gray-100 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow ${
      note.type === 'transcript' ? 'border-l-4 border-l-indigo-400' : ''
    }`}>
      <div className="flex items-start">
        <div className="mr-4 mt-1 flex-shrink-0">
          {getNoteIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              {note.title ? (
                <h3 className="font-medium text-gray-800 mb-1 line-clamp-1">{note.title}</h3>
              ) : (
                <h3 className="font-medium text-gray-800 mb-1 line-clamp-1">
                  {note.content?.split('\n')[0]?.trim() || 'Untitled Note'}
                </h3>
              )}
              <div className="text-xs text-gray-400 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {note.created_at ? formatDate(note.created_at) : 'Just now'}
                {note.type === 'transcript' && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs">
                    Transcript
                  </span>
                )}
              </div>
            </div>
            
            {/* Edit button */}
            {onEdit && (
              <motion.button
                onClick={handleEditClick}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                title="Edit note"
              >
                <Pencil className="h-4 w-4" />
              </motion.button>
            )}
          </div>
          
          {note.content && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {getContentPreview(note.content)}
            </p>
          )}
          
          {/* Show edit information if available */}
          {hasBeenEdited && (
            <div className="text-xs text-gray-400 flex items-center mt-2 border-t border-gray-50 pt-2">
              <User className="h-3 w-3 mr-1" />
              <span>
                Edited {note.updated_at && formatDate(note.updated_at)}
                {note.editor?.name && ` by ${note.editor.name}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}