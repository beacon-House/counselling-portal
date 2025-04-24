/**
 * Note item component for displaying a single note in the list view
 */
import React, { useState, useEffect } from 'react';
import { Note } from '../../../types/types';
import { FileText, Image, File, MessageSquare, Clock, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabase';

interface NoteItemProps {
  note: Note;
}

export default function NoteItem({ note }: NoteItemProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(note.file_url || null);

  // Refresh the public URL when component mounts or note changes
  useEffect(() => {
    if (note.type === 'image' && note.file_url) {
      getPublicUrl(note.file_url);
    } else {
      setImageUrl(note.file_url);
    }
  }, [note]);

  // Generate a fresh public URL from the Supabase storage path
  const getPublicUrl = async (fileUrl: string) => {
    try {
      // Extract the path from the URL
      const url = new URL(fileUrl);
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/notes\/(.*)/);
      
      if (pathMatch && pathMatch[1]) {
        const filePath = pathMatch[1];
        
        // Get fresh public URL
        const { data } = await supabase.storage
          .from('notes')
          .getPublicUrl(filePath);
        
        if (data?.publicUrl) {
          setImageUrl(data.publicUrl);
        }
      } else {
        // If we can't extract the path, use the original URL
        setImageUrl(fileUrl);
      }
    } catch (error) {
      console.error('Error refreshing public URL:', error);
      // Fallback to original URL
      setImageUrl(fileUrl);
    }
  };

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

  // Get a short preview of the content
  const getContentPreview = (content: string, maxLength: number = 120) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
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
                  {note.type === 'text' 
                    ? (note.content?.split('\n')[0]?.trim() || 'Untitled Note')
                    : note.type === 'file' || note.type === 'transcript'
                      ? (note.file_url ? getFileName(note.file_url) : 'Untitled File')
                      : 'Untitled Note'
                  }
                </h3>
              )}
              <div className="text-xs text-gray-400 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {note.created_at ? formatDate(note.created_at) : 'Just now'}
              </div>
            </div>
            
            {note.type === 'image' && imageUrl && (
              <div className="ml-4 flex-shrink-0 w-16 h-16 bg-gray-100 rounded overflow-hidden">
                <img 
                  src={imageUrl} 
                  alt="" 
                  className="w-full h-full object-cover" 
                  loading="lazy"
                  onError={(e) => {
                    console.error('Image failed to load, refreshing URL');
                    if (note.file_url) getPublicUrl(note.file_url);
                    e.currentTarget.onerror = null; // Prevent infinite loop
                  }}
                />
              </div>
            )}
          </div>
          
          {note.type === 'text' && note.content && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {getContentPreview(note.content)}
            </p>
          )}
          
          {note.type !== 'text' && note.content && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {getContentPreview(note.content)}
            </p>
          )}
          
          {note.type === 'image' && imageUrl && (
            <div className="text-xs text-gray-500 flex items-center">
              <Image className="h-3 w-3 mr-1" />
              <span>Image attachment</span>
              {note.file_url && (
                <a 
                  href={imageUrl}
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="ml-2 text-blue-500 hover:underline flex items-center"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </a>
              )}
            </div>
          )}
          
          {note.type !== 'text' && note.type !== 'image' && note.file_url && (
            <div className="text-xs text-gray-500">
              {note.type === 'file' || note.type === 'transcript' 
                ? `File: ${getFileName(note.file_url)}`
                : 'Attachment'
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}