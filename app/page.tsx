'use client';

import { useState, useRef, useEffect } from 'react';
import TemplateUploader from './components/TemplateUploader';
import TextBoxEditor, { TextBoxControls } from './components/TextBoxEditor';
import MemberManager from './components/MemberManager';
import CertificatePreview from './components/CertificatePreview';
import ExportControls from './components/ExportControls';
import { CertificateTemplate, TextBox, Member, FieldDefinition } from './types/certificate';
import { generateCertificatePDF } from './lib/pdfGenerator';
import { saveAs } from 'file-saver';

export default function Home() {
  const [template, setTemplate] = useState<CertificateTemplate>({
    id: '1',
    imageUrl: '',
    textBoxes: [],
    fields: []
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedTextBoxId, setSelectedTextBoxId] = useState<string | null>(null);
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number>(0);
  const [scale, setScale] = useState(1);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const templateContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (templateContainerRef.current && template.imageUrl) {
      const img = new Image();
      img.onload = () => {
        const containerWidth = templateContainerRef.current?.clientWidth || 800;
        const scaleX = containerWidth / img.width;
        setScale(Math.min(scaleX, 1));
      };
      img.src = template.imageUrl;
    }
  }, [template.imageUrl]);

  const handleImageUpload = (file: File, imageUrl: string) => {
    setTemplate({
      ...template,
      imageUrl,
      imageFile: file
    });
  };

  const handleAddTextBox = () => {
    const newTextBox: TextBox = {
      id: Date.now().toString(),
      x: 100,
      y: 100,
      text: 'New Text',
      fontSize: 24,
      fontFamily: 'Arial',
      color: '#000000',
      alignment: 'left'
    };
    setTemplate({
      ...template,
      textBoxes: [...template.textBoxes, newTextBox]
    });
    setSelectedTextBoxId(newTextBox.id);
  };

  const handleUpdateTextBox = (updatedTextBox: TextBox) => {
    setTemplate({
      ...template,
      textBoxes: template.textBoxes.map((tb) =>
        tb.id === updatedTextBox.id ? updatedTextBox : tb
      )
    });
  };

  const handleDeleteTextBox = (id: string) => {
    setTemplate({
      ...template,
      textBoxes: template.textBoxes.filter((tb) => tb.id !== id)
    });
    if (selectedTextBoxId === id) {
      setSelectedTextBoxId(null);
    }
  };

  const handleFieldsChange = (fields: FieldDefinition[]) => {
    setTemplate({
      ...template,
      fields
    });
  };

  const handleDownloadPreview = async (member: Member) => {
    try {
      const blob = await generateCertificatePDF(template, member, 'pdf');
      const firstField = template.fields[0];
      const filename = firstField && member[firstField.name]
        ? `${String(member[firstField.name]).replace(/[^a-z0-9]/gi, '_')}.pdf`
        : `certificate_${member.id}.pdf`;
      saveAs(blob, filename);
    } catch (error) {
      console.error('Failed to download certificate:', error);
      alert('Failed to download certificate. Please try again.');
    }
  };

  const handleImport = (data: { template: CertificateTemplate; members: Member[] }) => {
    // Note: Image URL won't be in imported data, user will need to re-upload template
    setTemplate({
      ...data.template,
      imageUrl: template.imageUrl // Keep current image if available
    });
    setMembers(data.members);
    if (data.members.length > 0) {
      setSelectedMemberIndex(0);
    }
  };

  const selectedTextBox = template.textBoxes.find((tb) => tb.id === selectedTextBoxId);
  const selectedMember = members[selectedMemberIndex] || null;

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-white">Certificate Generator</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Template Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Upload */}
            <div className="bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4 text-white">Template</h2>
              <TemplateUploader
                onImageUpload={handleImageUpload}
                currentImageUrl={template.imageUrl}
              />
            </div>

            {/* Canvas Area */}
            {template.imageUrl && (
              <div className="bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white">Editor</h2>
                  <button
                    onClick={handleAddTextBox}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Add Text Box
                  </button>
                </div>
                <div
                  ref={templateContainerRef}
                  className="relative border-2 border-gray-600 rounded-lg overflow-auto bg-gray-700"
                  style={{ minHeight: '400px', maxHeight: '600px' }}
                >
                  <img
                    src={template.imageUrl}
                    alt="Certificate template"
                    className="block"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                  {template.textBoxes.map((textBox) => (
                    <TextBoxEditor
                      key={textBox.id}
                      textBox={textBox}
                      onUpdate={handleUpdateTextBox}
                      onDelete={handleDeleteTextBox}
                      onSelect={setSelectedTextBoxId}
                      isSelected={selectedTextBoxId === textBox.id}
                      scale={scale}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Text Box Controls */}
            {selectedTextBox && (
              <div className="bg-gray-800 rounded-lg shadow p-6">
                <TextBoxControls
                  textBox={selectedTextBox}
                  onUpdate={handleUpdateTextBox}
                  fields={template.fields}
                />
              </div>
            )}

            {/* Preview */}
            {template.imageUrl && members.length > 0 && (
              <div className="bg-gray-800 rounded-lg shadow p-6">
                <CertificatePreview
                  template={template}
                  member={selectedMember}
                  selectedMemberIndex={selectedMemberIndex}
                  members={members}
                  onMemberChange={setSelectedMemberIndex}
                  onDownload={handleDownloadPreview}
                  canvasRef={previewCanvasRef}
                />
              </div>
            )}
          </div>

          {/* Right Column - Members & Export */}
          <div className="space-y-6">
            {/* Member Manager */}
            <div className="bg-gray-800 rounded-lg shadow p-6">
              <MemberManager
                members={members}
                fields={template.fields}
                onMembersChange={setMembers}
                onFieldsChange={handleFieldsChange}
              />
            </div>

            {/* Export Controls */}
            {template.imageUrl && (
              <div className="bg-gray-800 rounded-lg shadow p-6">
                <ExportControls
                  template={template}
                  members={members}
                  previewElementRef={previewCanvasRef}
                  onImport={handleImport}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
