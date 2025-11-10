'use client';

import { useRef, useEffect, useState } from 'react';
import { CertificateTemplate, Member } from '../types/certificate';
import { generateCertificateImage } from '../lib/certificateGenerator';

interface PreviewModalProps {
  template: CertificateTemplate;
  member: Member;
  onClose: () => void;
}

export default function PreviewModal({ template, member, onClose }: PreviewModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!member || !canvasRef.current || !template.imageUrl) return;

    setIsLoading(true);
    setError(null);

    generateCertificateImage(template.imageUrl, template.textBoxes, member)
      .then((canvas) => {
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            canvasRef.current.width = canvas.width;
            canvasRef.current.height = canvas.height;
            ctx.drawImage(canvas, 0, 0);
          }
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to generate preview:', err);
        setError('Failed to generate certificate preview');
        setIsLoading(false);
      });
  }, [member, template.imageUrl, template.textBoxes]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Get member display name
  const getMemberName = () => {
    const firstField = template.fields[0];
    if (firstField && member[firstField.name]) {
      return String(member[firstField.name]);
    }
    return 'Member';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">
            Certificate Preview - {getMemberName()}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-300">Generating preview...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-red-400">{error}</p>
                <button
                  onClick={onClose}
                  className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto border border-gray-600 rounded"
                style={{ display: 'block' }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && !error && (
          <div className="flex justify-end gap-2 p-4 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
