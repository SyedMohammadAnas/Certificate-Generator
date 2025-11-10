import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { generateCertificateImage } from './certificateGenerator';
import { CertificateTemplate, Member } from '../types/certificate';

export async function generateCertificatePDF(
  template: CertificateTemplate,
  member: Member,
  format: 'pdf' | 'png' = 'pdf'
): Promise<Blob> {
  const canvas = await generateCertificateImage(
    template.imageUrl,
    template.textBoxes,
    member
  );

  if (format === 'png') {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          throw new Error('Failed to convert canvas to blob');
        }
      }, 'image/png');
    });
  }

  // Generate PDF
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [canvas.width, canvas.height]
  });

  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
  return pdf.output('blob');
}

export async function generateCertificateFromElement(
  element: HTMLElement,
  filename: string = 'certificate'
): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [canvas.width, canvas.height]
  });

  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
  return pdf.output('blob');
}

export function printCertificate(element: HTMLElement) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print the certificate');
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>Certificate</title>
        <style>
          body { margin: 0; padding: 0; }
          img { width: 100%; height: auto; }
        </style>
      </head>
      <body>
        ${element.innerHTML}
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

