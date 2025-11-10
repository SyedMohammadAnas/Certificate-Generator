'use client';

import { useState } from 'react';
import { generateCertificatePDF } from '../lib/pdfGenerator';
import { generateBulkCertificates, exportDataAsJSON, importDataFromJSON } from '../lib/bulkExport';
import { CertificateTemplate, Member } from '../types/certificate';
import { saveAs } from 'file-saver';

interface ExportControlsProps {
  template: CertificateTemplate;
  members: Member[];
  previewElementRef: React.RefObject<HTMLDivElement | HTMLCanvasElement | null>;
  onImport?: (data: { template: CertificateTemplate; members: Member[] }) => void;
}

export default function ExportControls({
  template,
  members,
  previewElementRef,
  onImport
}: ExportControlsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'png'>('pdf');

  const handleDownloadSingle = async (member: Member) => {
    try {
      setIsGenerating(true);
      const blob = await generateCertificatePDF(template, member, exportFormat);
      const extension = exportFormat === 'pdf' ? 'pdf' : 'png';
      const firstField = template.fields[0];
      const filename = firstField && member[firstField.name]
        ? `${String(member[firstField.name]).replace(/[^a-z0-9]/gi, '_')}.${extension}`
        : `certificate_${member.id}.${extension}`;
      saveAs(blob, filename);
    } catch (error) {
      console.error('Failed to generate certificate:', error);
      alert('Failed to generate certificate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBulkDownload = async () => {
    if (members.length === 0) {
      alert('Please add at least one member before generating certificates.');
      return;
    }
    try {
      setIsGenerating(true);
      await generateBulkCertificates(template, members, exportFormat);
    } catch (error) {
      console.error('Failed to generate bulk certificates:', error);
      alert('Failed to generate certificates. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = async () => {
    if (!previewElementRef.current || members.length === 0) {
      alert('Please select a member to preview first.');
      return;
    }

    // For print, we'll generate a temporary image and print it
    try {
      const canvas = previewElementRef.current as HTMLCanvasElement;
      if (canvas && canvas.width > 0) {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          alert('Please allow popups to print the certificate');
          return;
        }

        const imgData = canvas.toDataURL('image/png');
        printWindow.document.write(`
          <html>
            <head>
              <title>Certificate</title>
              <style>
                body { margin: 0; padding: 20px; }
                img { max-width: 100%; height: auto; }
              </style>
            </head>
            <body>
              <img src="${imgData}" alt="Certificate" />
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    } catch (error) {
      console.error('Print error:', error);
      alert('Failed to print. Please try downloading instead.');
    }
  };

  const handleExportData = () => {
    exportDataAsJSON(template, members);
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await importDataFromJSON(file);
      if (onImport) {
        onImport({ template: data.template, members: data.members });
        alert('Data imported successfully!');
      } else {
        alert('Import handler not configured. Please refresh the page.');
      }
    } catch (error) {
      alert('Failed to import data. Please check the file format.');
    }
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="space-y-4 p-4 bg-gray-800 rounded-lg border border-gray-600">
      <h3 className="font-semibold text-lg text-white">Export & Print</h3>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Export Format
        </label>
        <select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'png')}
          className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white"
        >
          <option value="pdf">PDF</option>
          <option value="png">PNG Image</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleBulkDownload}
          disabled={isGenerating || members.length === 0}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : `Download All (${members.length})`}
        </button>

        <button
          onClick={handlePrint}
          disabled={!previewElementRef.current}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Print Preview
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleExportData}
            className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
          >
            Export Data (JSON)
          </button>
          <label className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 text-center cursor-pointer">
            Import Data
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
