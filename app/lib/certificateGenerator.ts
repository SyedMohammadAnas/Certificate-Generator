import { TextBox, Member, CertificateTemplate } from '../types/certificate';

export async function generateCertificateImage(
  templateImageUrl: string,
  textBoxes: TextBox[],
  member: Member
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Draw the template image
      ctx.drawImage(img, 0, 0);

      // Draw each text box
      textBoxes.forEach((textBox) => {
        let text = textBox.text;

        // Replace with member data if field is linked
        if (textBox.fieldName && member[textBox.fieldName]) {
          text = String(member[textBox.fieldName]);
        }

        if (!text) return;

        ctx.save();
        ctx.font = `${textBox.fontSize}px ${textBox.fontFamily}`;
        ctx.fillStyle = textBox.color;
        ctx.textAlign = textBox.alignment;
        ctx.textBaseline = 'top';

        // Calculate text position
        let x = textBox.x;
        if (textBox.alignment === 'center') {
          x = textBox.x + (textBox.width || 0) / 2;
        } else if (textBox.alignment === 'right') {
          x = textBox.x + (textBox.width || 0);
        }

        // Draw text with word wrapping if width is specified
        if (textBox.width) {
          const words = text.split(' ');
          let line = '';
          let y = textBox.y;
          const lineHeight = textBox.fontSize * 1.2;

          for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > textBox.width && i > 0) {
              ctx.fillText(line, x, y);
              line = words[i] + ' ';
              y += lineHeight;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, x, y);
        } else {
          ctx.fillText(text, x, textBox.y);
        }

        ctx.restore();
      });

      resolve(canvas);
    };

    img.onerror = () => {
      reject(new Error('Failed to load template image'));
    };

    img.src = templateImageUrl;
  });
}

export function getTextPreview(
  textBox: TextBox,
  member: Member
): string {
  if (textBox.fieldName && member[textBox.fieldName]) {
    return String(member[textBox.fieldName]);
  }
  return textBox.text;
}
