/**
 * Note item component for displaying a single note
 */
import React from 'react';
import { Note } from '../../../types/types';
import { FileText, Image, File, MessageSquare, Clock, Download, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

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
        return <FileText className="h-5 w-5 text-gray-400" />;
      case 'image':
        return <Image className="h-5 w-5 text-gray-400" />;
      case 'file':
        return <File className="h-5 w-5 text-gray-400" />;
      case 'transcript':
        return <MessageSquare className="h-5 w-5 text-gray-400" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  // Get file name from the URL
  const getFileName = (url: string) => {
    if (!url) return 'File';
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    // Decode URL encoded characters and remove timestamp prefix
    try {
      const decodedName = decodeURIComponent(fileName);
      // Remove timestamp if present (timestamp_filename format)
      const withoutTimestamp = decodedName.replace(/^\d+_/, '');
      return withoutTimestamp;
    } catch (e) {
      return fileName;
    }
  };

  return (
    <motion.div 
      className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm"
      whileHover={{ y: -2, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)" }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start">
        <div className="mr-4 mt-1">
          {getNoteIcon()}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {note.created_at ? formatDate(note.created_at) : 'Just now'}
            </span>
          </div>
          
          <div className="prose prose-sm max-w-none text-gray-700">
            {note.type === 'text' && note.content && (
              <p className="whitespace-pre-wrap leading-relaxed">{note.content}</p>
            )}
            
            {note.type === 'image' && note.file_url && (
              <div>
                <img 
                  src={note.file_url} 
                  alt="Note" 
                  className="max-w-full rounded-md" 
                  loading="lazy"
                />
                {note.content && (
                  <p className="mt-3 text-gray-600 text-sm">{note.content}</p>
                )}
              </div>
            )}
            
            {note.type === 'file' && note.file_url && (
              <div className="flex flex-col">
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <File className="h-6 w-6 text-gray-400 mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{getFileName(note.file_url)}</p>
                    <div className="flex mt-2 space-x-3">
                      <a 
                        href={note.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center"
                        download
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </a>
                      <a 
                        href={note.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </a>
                    </div>
                  </div>
                </div>
                {note.content && (
                  <p className="mt-3 text-gray-600 text-sm">{note.content}</p>
                )}
              </div>
            )}
            
            {note.type === 'transcript' && note.file_url && (
              <div className="flex flex-col">
                <div className="p-2 bg-gray-50 rounded-md mb-3">
                  <p className="text-xs font-medium text-gray-600">Transcript</p>
                </div>
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-gray-400 mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{getFileName(note.file_url)}</p>
                    <div className="flex mt-2 space-x-3">
                      <a 
                        href={note.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center"
                        download
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </a>
                      <a 
                        href={note.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </a>
                    </div>
                  </div>
                </div>
                {note.content && (
                  <p className="mt-3 text-gray-600 text-sm">{note.content}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}