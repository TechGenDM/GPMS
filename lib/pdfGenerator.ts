import { parseGPMSDate } from './utils';
import { amountToWords } from './amountToWords';

interface ReceiptData {
  receiptId: string;
  donorName: string;
  amount: number | string;
  paymentMode: string;
  purpose: string;
  date: string;
  collectorName?: string;
}

export interface ExpenseRecordData {
  expenseId: string;
  category: string;
  description: string;
  vendor?: string;
  amount: number | string;
  paidBy: string;
  date: string;
  billLink?: string;
}

// ─── Colour palette ────────────────────────────────────────────────────────────
const CREAM:      [number, number, number] = [250, 246, 240]; 
const DARK_BROWN: [number, number, number] = [74,  55,  40];
const MAROON:     [number, number, number] = [139, 69,  19];
const GOLD:       [number, number, number] = [212, 184, 150];
const MUTED_BROWN:[number, number, number] = [139, 115, 85];

const CREAM_HEX       = '#FAF6F0';
const DARK_BROWN_HEX  = '#4A3728';
const MAROON_HEX      = '#8B4513';
const MUTED_BROWN_HEX = '#8B7355';

const PPM = 10;

function textToPng(
  text: string,
  widthMM: number,
  heightMM: number,
  fontCss: string,
  colorCss: string,
  align: CanvasTextAlign = 'center'
): string {
  const W = Math.round(widthMM * PPM);
  const H = Math.round(heightMM * PPM);
  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, W, H);
  ctx.font         = fontCss;
  ctx.fillStyle    = colorCss;
  ctx.textAlign    = align;
  ctx.textBaseline = 'middle';
  const x = align === 'center' ? W / 2 : align === 'right' ? W : 0;
  ctx.fillText(text, x, H / 2);
  return canvas.toDataURL('image/png');
}

function donorNameToPng(
  name: string,
  maxWidthMM: number
): { png: string; widthMM: number; heightMM: number } {
  const maxW = Math.round(maxWidthMM * PPM);
  const canvas = document.createElement('canvas');
  canvas.width  = maxW;
  canvas.height = 1;
  const ctx = canvas.getContext('2d')!;

  // Target a large, prominent serif size
  let fontSize = 42 * PPM / 10; 
  const family = 'Georgia, "Times New Roman", serif';
  do {
    ctx.font = `normal ${fontSize}px ${family}`;
    if (ctx.measureText(name).width <= maxW * 0.95) break;
    fontSize -= 3;
  } while (fontSize > 16);

  const H = Math.round(fontSize * 1.5);
  canvas.height = H;
  ctx.clearRect(0, 0, maxW, H);
  ctx.font         = `normal ${fontSize}px ${family}`;
  ctx.fillStyle    = DARK_BROWN_HEX;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, maxW / 2, H / 2);

  return {
    png:      canvas.toDataURL('image/png'),
    widthMM:  maxWidthMM,
    heightMM: H / PPM,
  };
}

async function loadSealAtOpacity(
  url: string,
  opacity: number
): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    return await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const SZ = 800;
        const c  = document.createElement('canvas');
        c.width = c.height = SZ;
        const ctx = c.getContext('2d')!;
        ctx.globalAlpha = opacity;
        ctx.drawImage(img, 0, 0, SZ, SZ);
        URL.revokeObjectURL(blobUrl);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = () => { URL.revokeObjectURL(blobUrl); resolve(null); };
      img.src = blobUrl;
    });
  } catch {
    return null;
  }
}

function addCentredImage(
  doc: import('jspdf').jsPDF,
  png: string,
  xCentre: number,
  yTop: number,
  widthMM: number,
  heightMM: number
): void {
  doc.addImage(png, 'PNG', xCentre - widthMM / 2, yTop, widthMM, heightMM);
}

function drawScallopLine(
  doc: import('jspdf').jsPDF,
  x1: number,
  y:  number,
  x2: number,
  count: number,
  facing: 'down' | 'up'
): void {
  const r   = (x2 - x1) / (count * 2);
  const k   = r * 0.5523;
  const dir = facing === 'down' ? 1 : -1;

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.2); 
  doc.moveTo(x1, y);

  for (let i = 0; i < count; i++) {
    const lx = x1 + i * 2 * r;
    const cx = lx + r;
    const rx = lx + 2 * r;
    doc.curveTo(lx, y + dir * k, cx - k, y + dir * r, cx, y + dir * r);
    doc.curveTo(cx + k, y + dir * r, rx, y + dir * k, rx, y);
  }
  doc.stroke();
}

// ══════════════════════════════════════════════════════════════════════════════
//  DONATION — Premium ceremonial Ganesh Puja receipt  (A4 portrait)
// ══════════════════════════════════════════════════════════════════════════════
export async function generateAndDownloadReceipt(data: ReceiptData) {
  const { jsPDF } = await import('jspdf');
  const QRCode    = (await import('qrcode')).default || (await import('qrcode'));

  const origin = window.location.origin;

  const CONTENT_W = 170;
  const SERIF     = 'Georgia, "Times New Roman", Times, serif';

  const DEVANAGARI =
    '\u0964\u0964 \u0913\u092E \u0936\u094D\u0930\u0940 \u0917\u0923\u0947\u0936\u093E\u092F \u0928\u092E\u0903 \u0964\u0964';

  const devanagariPng = textToPng(
    DEVANAGARI,
    CONTENT_W, 8, // slightly smaller height
    `normal ${8.5 * PPM}px "Noto Serif Devanagari", "Mangal", "Kokila", serif`,
    MAROON_HEX
  );

  const orgNamePng = textToPng(
    'Ganesh Puja Kharsawan',
    CONTENT_W, 14,
    `normal ${14 * PPM}px ${SERIF}`,
    DARK_BROWN_HEX
  );

  const subtitlePng = textToPng(
    'Sarvajanik Ganeshotsav \u00B7 Kharsawan',
    CONTENT_W, 6,
    `italic ${5.5 * PPM}px ${SERIF}`,
    MUTED_BROWN_HEX
  );

  const gratitudePng = textToPng(
    'Received with gratitude from',
    CONTENT_W, 7,
    `italic ${5.5 * PPM}px ${SERIF}`,
    MUTED_BROWN_HEX
  );

  const donorData = donorNameToPng(data.donorName, CONTENT_W);

  const amtNum        = Number(data.amount);
  const amtFormatted  = '\u20B9' + amtNum.toLocaleString('en-IN');
  const amtPng = textToPng(
    amtFormatted,
    CONTENT_W, 18,
    `normal ${16 * PPM}px ${SERIF}`,
    MAROON_HEX
  );

  const words    = amountToWords(data.amount);
  const wordsPng = textToPng(
    words,
    CONTENT_W, 6,
    `italic ${5.5 * PPM}px ${SERIF}`,
    DARK_BROWN_HEX
  );

  // Very faint watermark: 5% opacity
  const [sealPng] = await Promise.all([
    loadSealAtOpacity(`${origin}/seal.png`, 0.05),
  ]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW  = doc.internal.pageSize.getWidth();
  const PH  = doc.internal.pageSize.getHeight();
  const MX  = 16;
  const MY  = 20; // 20mm top margin
  const PAD = 10;

  const bx  = MX;
  const by  = MY;
  const bw  = PW - MX * 2; // 178mm width
  const bh  = 225;         // Fixed receipt height (225mm), leaves ~52mm at bottom for footer
  const CX  = PW / 2;
  const leftX  = bx + PAD;
  const rightX = bx + bw - PAD;

  // Cream background for the whole page
  doc.setFillColor(...CREAM);
  doc.rect(0, 0, PW, PH, 'F');

  // Draw the scallopped edge for the receipt paper
  const scCount = 50; // many small scallops
  // Top scalloped edge (just outside the border)
  drawScallopLine(doc, bx, by - 4, bx + bw, scCount, 'down');
  // Bottom scalloped edge
  drawScallopLine(doc, bx, by + bh + 4, bx + bw, scCount, 'up');

  // Outer thin border for main receipt
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.rect(bx, by, bw, bh);

  // Inner border offset 2.5mm
  doc.setLineWidth(0.15);
  doc.rect(bx + 2.5, by + 2.5, bw - 5, bh - 5);

  // Watermark - exactly centered in the main receipt paper
  if (sealPng) {
    const wmMM = 90;
    const wmX = CX - wmMM / 2;
    const wmY = by + (bh / 2) - (wmMM / 2); // perfectly centered vertically in the receipt box
    doc.addImage(sealPng, 'PNG', wmX, wmY, wmMM, wmMM);
  }

  // CONTENT LAYOUT - tighter spacing to guarantee fit inside bh (225mm)
  let y = by + 12; // Start inside border

  // Sanskrit
  const devH = 8;
  addCentredImage(doc, devanagariPng, CX, y, CONTENT_W, devH);
  y += devH + 4;

  // Divider
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.2);
  doc.line(CX - 12, y, CX + 12, y);
  y += 4;

  // Org Name
  const orgH = 14;
  addCentredImage(doc, orgNamePng, CX, y, CONTENT_W, orgH);
  y += orgH + 2;

  // Subtitle
  const subH = 6;
  addCentredImage(doc, subtitlePng, CX, y, CONTENT_W, subH);
  y += subH + 8; 

  // OFFICIAL DONATION RECEIPT badge
  const badgeW = 90;
  const badgeH = 9; // slightly larger height
  const badgeX = CX - badgeW / 2;
  doc.setDrawColor(...MUTED_BROWN);
  doc.setLineWidth(0.2);
  doc.roundedRect(badgeX, y, badgeW, badgeH, 1.5, 1.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED_BROWN);
  doc.setCharSpace(2.0);
  doc.text('OFFICIAL DONATION RECEIPT', CX, y + 5.5, { align: 'center' });
  doc.setCharSpace(0);
  y += badgeH + 12; 

  // Receipt info row
  const receiptDate = parseGPMSDate(data.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTED_BROWN);
  doc.setCharSpace(1.0);
  doc.text('RECEIPT NO.', leftX,  y);
  doc.text('DATE',         rightX, y, { align: 'right' });
  doc.setCharSpace(0); // Reset immediately!
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...DARK_BROWN);
  doc.setCharSpace(0);
  doc.text(data.receiptId, leftX,  y);
  doc.text(receiptDate,    rightX, y, { align: 'right' });
  y += 4;

  // Thin divider
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.15);
  doc.line(leftX, y, rightX, y);
  y += 18; // breathing space before donor section

  // Donor section
  addCentredImage(doc, gratitudePng, CX, y, CONTENT_W, 7);
  y += 7 + 6;

  addCentredImage(doc, donorData.png, CX, y, donorData.widthMM, donorData.heightMM);
  y += donorData.heightMM + 12;

  // Amount section
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTED_BROWN);
  doc.setCharSpace(1.5);
  doc.text('CONTRIBUTION AMOUNT', CX, y, { align: 'center' });
  doc.setCharSpace(0); // CRITICAL RESET
  y += 8;

  const amtH = 18;
  addCentredImage(doc, amtPng, CX, y, CONTENT_W, amtH);
  y += amtH + 4;

  addCentredImage(doc, wordsPng, CX, y, CONTENT_W, 6);
  y += 6 + 18; // space before QR

  // QR Code
  const verifyUrl = `${origin}/verify/${data.receiptId}`;
  const qrMM = 40; // 40mm centered
  try {
    const qrDataUri = await QRCode.toDataURL(verifyUrl, {
      width: 400,
      margin: 1,
      color: { dark: '#4A3728', light: '#FAF6F0' },
    });

    const qrX = CX - qrMM / 2;

    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.3);
    doc.rect(qrX - 2, y - 2, qrMM + 4, qrMM + 4);

    doc.addImage(qrDataUri, 'PNG', qrX, y, qrMM, qrMM);
  } catch (qrErr) {
    console.error('[GPMS] QR generation error:', qrErr);
  }

  // Footer is placed OUTSIDE the main receipt boundary, securely below the bottom scallops
  // Main receipt ends at by + bh = 20 + 225 = 245
  // Bottom scallop is at 249
  // Footer placed safely at 265
  const footerY = by + bh + 16;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED_BROWN);
  doc.setCharSpace(0);
  doc.text('This digital receipt is issued in the spirit of the traditional bill-book. A copy', CX, footerY, { align: 'center' });
  doc.text('has been sent to your phone. May Bappa bless you.', CX, footerY + 5, { align: 'center' });

  doc.save(`${data.receiptId}.pdf`);
}

// ══════════════════════════════════════════════════════════════════════════════
//  EXPENSE — original implementation, completely unchanged
// ══════════════════════════════════════════════════════════════════════════════
export async function generateAndDownloadExpenseRecord(
  data: ExpenseRecordData
) {
  const { jsPDF } = await import('jspdf');
  const QRCode = (await import('qrcode')).default || (await import('qrcode'));

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica');

  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('Ganesh Puja Committee 2026', pageWidth / 2, 20, {
    align: 'center',
  });

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Official Expense Record', pageWidth / 2, 28, { align: 'center' });

  doc.setDrawColor(200, 200, 200);
  doc.line(15, 35, pageWidth - 15, 35);

  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);

  let y = 45;
  const leftCol   = 20;
  const rightCol  = 70;
  const lineHeight = 10;

  const fields = [
    { label: 'Expense ID:', value: data.expenseId },
    {
      label: 'Date:',
      value: parseGPMSDate(data.date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    },
    { label: 'Category:',    value: data.category },
    { label: 'Description:', value: data.description },
    {
      label: 'Amount:',
      value: `Rs. ${Number(data.amount).toLocaleString('en-IN')}`,
    },
    { label: 'Paid By:', value: data.paidBy },
  ];

  if (data.vendor) {
    fields.push({ label: 'Vendor:', value: data.vendor });
  }

  if (data.billLink) {
    fields.push({ label: 'Bill Ref:', value: 'Yes (Attached on portal)' });
  }

  fields.forEach((field) => {
    doc.setFont('helvetica', 'bold');
    doc.text(field.label, leftCol, y);
    doc.setFont('helvetica', 'normal');
    const val =
      field.value.length > 30
        ? field.value.substring(0, 27) + '...'
        : field.value;
    doc.text(val, rightCol, y);
    y += lineHeight;
  });

  const verifyUrl = `${window.location.origin}/verify/expense/${data.expenseId}`;

  try {
    const qrDataUri = await QRCode.toDataURL(verifyUrl, {
      width: 100,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    const qrSize = 40;
    doc.addImage(
      qrDataUri,
      'PNG',
      (pageWidth - qrSize) / 2,
      y + 10,
      qrSize,
      qrSize
    );

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Scan QR Code to verify authenticity', pageWidth / 2, y + 55, {
      align: 'center',
    });
  } catch (err) {
    console.error('Failed to generate QR code for PDF', err);
  }

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('Official accounting record for GPMS 2026', pageWidth / 2, 190, {
    align: 'center',
  });

  doc.save(`${data.expenseId}.pdf`);
}
