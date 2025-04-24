/**
 * Utility component to fix existing file records in the database
 * This ensures proper file type and refreshed URLs
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Loader, Check, AlertTriangle } from 'lucide-react';

export default function FileFixUtility() {
  const [isFixing, setIsFixing] = useState(false);
  const [fixedCount, setFixedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const fixExistingFiles = async () => {
    setIsFixing(true);
    setError(null);
    
    try {
      // First, get all notes with file_url that aren't correctly typed
      const { data: fileNotes, error: fetchError } = await supabase
        .from('notes')
        .select('*')
        .not('file_url', 'is', null);
      
      if (fetchError) throw fetchError;
      
      if (!fileNotes || fileNotes.length === 0) {
        setIsComplete(true);
        setTotalCount(0);
        setFixedCount(0);
        setIsFixing(false);
        return;
      }
      
      setTotalCount(fileNotes.length);
      let fixed = 0;
      
      // Process each file note
      for (const note of fileNotes) {
        try {
          if (!note.file_url) continue;
          
          // Extract the file path from URL
          const url = new URL(note.file_url);
          const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/notes\/(.*)/);
          
          if (pathMatch && pathMatch[1]) {
            const filePath = pathMatch[1];
            
            // Check if file exists in storage
            const { data: fileData, error: fileError } = await supabase.storage
              .from('notes')
              .getPublicUrl(filePath);
            
            if (fileError) {
              console.error(`Error checking file ${filePath}:`, fileError);
              continue;
            }
            
            // Determine file type based on extension
            const fileExt = filePath.split('.').pop()?.toLowerCase();
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
            const isImage = fileExt && imageExtensions.includes(fileExt);
            
            // Update note with fresh URL and correct file type
            const { error: updateError } = await supabase
              .from('notes')
              .update({
                file_url: fileData.publicUrl,
                type: isImage ? 'image' : 'file'
              })
              .eq('id', note.id);
            
            if (updateError) {
              console.error(`Error updating note ${note.id}:`, updateError);
              continue;
            }
            
            fixed++;
            setFixedCount(fixed);
          }
        } catch (err) {
          console.error(`Error processing note ${note.id}:`, err);
        }
      }
      
      setIsComplete(true);
    } catch (err: any) {
      console.error('Error fixing files:', err);
      setError(err.message || 'An error occurred while fixing files');
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-medium text-gray-800 mb-4">File Fix Utility</h3>
      
      <p className="text-gray-600 mb-4">
        This utility will fix existing file records in the database to ensure they have the correct file type and refreshed URLs.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      {isComplete && !error && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-start">
          <Check className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>
            {fixedCount > 0 
              ? `Successfully fixed ${fixedCount} of ${totalCount} file records.` 
              : "No files needed fixing or no file records found."}
          </span>
        </div>
      )}
      
      <button
        onClick={fixExistingFiles}
        disabled={isFixing}
        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center"
      >
        {isFixing ? (
          <>
            <Loader className="animate-spin h-4 w-4 mr-2" />
            Fixing Files... ({fixedCount}/{totalCount})
          </>
        ) : (
          'Fix Existing Files'
        )}
      </button>
    </div>
  );
}