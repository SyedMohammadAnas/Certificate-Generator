'use client';

import { useRef, useEffect, useState } from 'react';
import { CertificateTemplate, Member } from '../types/certificate';
import { generateCertificateImage } from '../lib/certificateGenerator';

interface CertificatePreviewProps {
  template: CertificateTemplate;
  member: Member | null;
  selectedMemberIndex: number;
  members: Member[];
  onMemberChange: (index: number) => void;
  onDownload: (member: Member) => void;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
}

export default function CertificatePreview({
  template,
  member,
  selectedMemberIndex,
  members,
  onMemberChange,
  onDownload,
  canvasRef: externalCanvasRef
}: CertificatePreviewProps) {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!member || !canvasRef.current || !template.imageUrl) return;

    generateCertificateImage(template.imageUrl, template.textBoxes, member)
      .then((canvas) => {
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            canvasRef.current.width = canvas.width;
            canvasRef.current.height = canvas.height;
            ctx.drawImage(canvas, 0, 0);

            // Calculate scale for display
            if (containerRef.current) {
              const containerWidth = containerRef.current.clientWidth;
              const scaleX = containerWidth / canvas.width;
              setScale(Math.min(scaleX, 0.9)); // Use 0.9 to leave some margin
            }
          }
        }
      })
      .catch((error) => {
        console.error('Failed to generate preview:', error);
      });
  }, [member, template.imageUrl, template.textBoxes]);

  if (!member) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg border border-gray-200">
        <p className="text-gray-500">Select a member to preview certificate</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Preview</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onMemberChange(Math.max(0, selectedMemberIndex - 1))}
            disabled={selectedMemberIndex === 0}
            className="px-3 py-1 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-600">
            {selectedMemberIndex + 1} / {members.length}
          </span>
          <button
            onClick={() => onMemberChange(Math.min(members.length - 1, selectedMemberIndex + 1))}
            disabled={selectedMemberIndex === members.length - 1}
            className="px-3 py-1 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
          >
            Next →
          </button>
          <button
            onClick={() => onDownload(member)}
            className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Download
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="border border-gray-300 rounded-lg p-4 bg-gray-50 overflow-auto flex justify-center"
        style={{ maxHeight: '600px' }}
      >
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto"
          style={{ display: 'block' }}
        />
      </div>
    </div>
  );
}
