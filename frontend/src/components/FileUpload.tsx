import React, { useState } from 'react';
import { fileService } from '../services/fileService';
import { CloudArrowUpIcon, CheckCircleIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface FileUploadProps {
  onUploadSuccess: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{ 
    message: string; 
    isDuplicate: boolean; 
    spaceSaved?: number 
  } | null>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: fileService.uploadFile,
    onSuccess: (data) => {
      // Invalidate and refetch files query
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['storageStats'] });
      queryClient.invalidateQueries({ queryKey: ['fileTypes'] });
      
      setUploadResult({
        message: data.message,
        isDuplicate: data.is_duplicate,
        spaceSaved: data.space_saved,
      });
      
      setSelectedFile(null);
      onUploadSuccess();
      
      // Clear success message after 5 seconds
      setTimeout(() => setUploadResult(null), 5000);
    },
    onError: (error) => {
      setError('Failed to upload file. Please try again.');
      console.error('Upload error:', error);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    try {
      setError(null);
      setUploadResult(null);
      await uploadMutation.mutateAsync(selectedFile);
    } catch (err) {
      // Error handling is done in onError callback
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-4">
        <CloudArrowUpIcon className="h-6 w-6 text-primary-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">Upload File</h2>
      </div>
      <div className="mt-4 space-y-4">
        <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
          <div className="space-y-1 text-center">
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
              >
                <span>Upload a file</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileSelect}
                  disabled={uploadMutation.isPending}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">Any file up to 10MB</p>
          </div>
        </div>
        
        {selectedFile && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <strong>Selected:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
          </div>
        )}
        
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
            {error}
          </div>
        )}
        
        {uploadResult && (
          <div className={`text-sm p-3 rounded border ${
            uploadResult.isDuplicate 
              ? 'bg-blue-50 text-blue-800 border-blue-200' 
              : 'bg-green-50 text-green-800 border-green-200'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {uploadResult.isDuplicate ? (
                  <DocumentDuplicateIcon className="h-5 w-5 text-blue-600" />
                ) : (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div className="ml-3">
                <p className="font-medium">{uploadResult.message}</p>
                {uploadResult.isDuplicate && uploadResult.spaceSaved && (
                  <p className="mt-1 text-xs">
                    Space saved: {(uploadResult.spaceSaved / 1024).toFixed(2)} KB
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploadMutation.isPending}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            !selectedFile || uploadMutation.isPending
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
          }`}
        >
          {uploadMutation.isPending ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Uploading...
            </>
          ) : (
            'Upload'
          )}
        </button>
      </div>
    </div>
  );
};