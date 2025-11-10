import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateCertificatePDF } from './pdfGenerator';
import { CertificateTemplate, Member, CertificateData } from '../types/certificate';

export async function generateBulkCertificates(
  template: CertificateTemplate,
  members: Member[],
  format: 'pdf' | 'png' = 'pdf'
): Promise<void> {
  if (members.length === 0) {
    alert('No members to generate certificates for');
    return;
  }

  const zip = new JSZip();
  const certificatesFolder = zip.folder('certificates');

  if (!certificatesFolder) {
    throw new Error('Failed to create certificates folder in ZIP');
  }

  // Generate certificate data for JSON export
  const certificateData: CertificateData = {
    template: {
      ...template,
      imageUrl: '', // Don't include image URL in JSON
      imageFile: undefined
    },
    members,
    generatedAt: new Date().toISOString()
  };

  // Generate certificates for each member
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    try {
      const blob = await generateCertificatePDF(template, member, format);
      const extension = format === 'pdf' ? 'pdf' : 'png';

      // Generate filename from member data (use first field or member ID)
      const firstField = template.fields[0];
      const filename = firstField && member[firstField.name]
        ? `${String(member[firstField.name]).replace(/[^a-z0-9]/gi, '_')}.${extension}`
        : `certificate_${member.id}.${extension}`;

      certificatesFolder.file(filename, blob);
    } catch (error) {
      console.error(`Failed to generate certificate for member ${member.id}:`, error);
    }
  }

  // Add JSON data file
  const jsonData = JSON.stringify(certificateData, null, 2);
  zip.file('certificate_data.json', jsonData);

  // Generate and download ZIP
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipFilename = `certificates_${new Date().toISOString().split('T')[0]}.zip`;
  saveAs(zipBlob, zipFilename);
}

export function exportDataAsJSON(
  template: CertificateTemplate,
  members: Member[]
): void {
  const certificateData: CertificateData = {
    template: {
      ...template,
      imageUrl: '', // Don't include image URL in JSON
      imageFile: undefined
    },
    members,
    generatedAt: new Date().toISOString()
  };

  const jsonData = JSON.stringify(certificateData, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const filename = `certificate_data_${new Date().toISOString().split('T')[0]}.json`;
  saveAs(blob, filename);
}

export async function importDataFromJSON(file: File): Promise<CertificateData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as CertificateData;
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsText(file);
  });
}
