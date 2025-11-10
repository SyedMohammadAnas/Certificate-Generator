'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface TemplateUploaderProps {
  onImageUpload: (file: File, imageUrl: string) => void;
  currentImageUrl?: string;
}

export default function TemplateUploader({ onImageUpload, currentImageUrl }: TemplateUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      onImageUpload(file, imageUrl);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg']
    },
    multiple: false
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-900 bg-opacity-30'
            : 'border-gray-600 hover:border-gray-500 bg-gray-700'
        }`}
      >
        <input {...getInputProps()} />
        {currentImageUrl ? (
          <div className="space-y-4">
            <img
              src={currentImageUrl}
              alt="Certificate template"
              className="max-w-full max-h-64 mx-auto rounded"
            />
            <p className="text-sm text-gray-300">
              Click or drag to replace template
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-sm text-gray-300">
              {isDragActive
                ? 'Drop the image here'
                : 'Drag & drop a certificate template, or click to select'}
            </p>
            <p className="text-xs text-gray-400">PNG, JPG, SVG up to 10MB</p>
          </div>
        )}
      </div>
    </div>
  );
}
