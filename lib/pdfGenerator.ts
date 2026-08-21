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

// ─── Colour palette (RGB tuples) ─────────────────────────────────────────────
const CREAM: [number, number, number] = [250, 246, 240];
const DARK_BROWN: [number, number, number] = [74, 55, 40];
const MAROON: [number, number, number] = [139, 69, 19];
const GOLD: [number, number, number] = [212, 184, 150];
const MUTED_BROWN: [number, number, number] = [139, 115, 85];

/**
 * Renders the Devanagari Sanskrit blessing using the browser's native Canvas,
 * which supports system Devanagari fonts on all platforms.
 * Returns a PNG data URL suitable for doc.addImage().
 */
function renderDevanagariToPng(
  text: string,
  widthPx: number,
  heightPx: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext('2d')!;

  // Transparent background (matches cream PDF background)
  ctx.clearRect(0, 0, widthPx, heightPx);

  // Use system Devanagari font stack — supported on all modern OSes
  ctx.font = `bold ${heightPx * 0.55}px "Noto Serif Devanagari", "Mangal", "Kokila", serif`;
  ctx.fillStyle = '#8B4513'; // MAROON
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, widthPx / 2, heightPx / 2);

  return canvas.toDataURL('image/png');
}

/**
 * Fetches a URL as base64. Used for loading the Ganesh seal watermark.
 */
async function fetchAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch ${url}: HTTP ${response.status}`);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Draws a row of small filled circles — scalloped / beaded border decoration.
 */
function drawScallops(
  doc: import('jspdf').jsPDF,
  startX: number,
  y: number,
  totalWidth: number,
  count: number,
  radius: number
): void {
  doc.setFillColor(...GOLD);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.1);
  const step = totalWidth / count;
  for (let i = 0; i < count; i++) {
    doc.circle(startX + i * step + step / 2, y, radius, 'FD');
  }
}

/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  DONATION — Premium ceremonial Ganesh Puja receipt (A4 portrait)
 *
 *  Typography: Helvetica (built-in jsPDF — zero parsing errors guaranteed).
 *  Devanagari: Rendered via browser Canvas → embedded as PNG image.
 *  Design: cream background, gold double border, scallops, watermark, QR.
 * ═════════════════════════════════════════════════════════════════════════════
 */
export async function generateAndDownloadReceipt(data: ReceiptData) {
  const { jsPDF } = await import('jspdf');
  const QRCode = (await import('qrcode')).default || (await import('qrcode'));

  const origin = window.location.origin;

  // ── Render Sanskrit blessing via Canvas → PNG ─────────────────────────────
  // ॥ ॐ श्री गणेशाय नमः ॥
  const devanagariText =
    '\u0964\u0964 \u0913\u092E \u0936\u094D\u0930\u0940 \u0917\u0923\u0947\u0936\u093E\u092F \u0928\u092E\u0903 \u0964\u0964';
  let devanagariPng: string | null = null;
  try {
    devanagariPng = renderDevanagariToPng(devanagariText, 900, 80);
  } catch {
    // Silently skip — we will show a latin fallback text instead
  }

  // ── A4 portrait — using only built-in Helvetica (always available) ────────
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = doc.internal.pageSize.getWidth(); // 210 mm
  const PH = doc.internal.pageSize.getHeight(); // 297 mm
  const MX = 16;
  const MY = 16;

  // ══════════════════════════════════════════════════════════════════════════
  // LAYER 0 — warm cream background
  // ══════════════════════════════════════════════════════════════════════════
  doc.setFillColor(...CREAM);
  doc.rect(0, 0, PW, PH, 'F');

  // ══════════════════════════════════════════════════════════════════════════
  // LAYER 1 — outer decorative double gold border
  // ══════════════════════════════════════════════════════════════════════════
  const bx = MX;
  const by = MY;
  const bw = PW - MX * 2;
  const bh = PH - MY * 2;

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.0);
  doc.rect(bx, by, bw, bh);
  doc.setLineWidth(0.35);
  doc.rect(bx + 3, by + 3, bw - 6, bh - 6);

  // ══════════════════════════════════════════════════════════════════════════
  // LAYER 2 — scalloped dot rows (top and bottom)
  // ══════════════════════════════════════════════════════════════════════════
  const scX = bx + 3;
  const scW = bw - 6;
  drawScallops(doc, scX, by + 3 + 4.8, scW, 32, 1.3);
  drawScallops(doc, scX, by + bh - 3 - 4.8, scW, 32, 1.3);

  // ══════════════════════════════════════════════════════════════════════════
  // LAYER 3 — Ganesh seal watermark (non-fatal, purely decorative)
  // ══════════════════════════════════════════════════════════════════════════
  try {
    const sealB64 = await fetchAsBase64(`${origin}/seal.png`);
    const wmSize = 78;
    const wmX = (PW - wmSize) / 2;
    const wmY = 122;
    doc.addImage(sealB64, 'PNG', wmX, wmY, wmSize, wmSize);
    doc.setFillColor(...CREAM);
    doc.setGState(doc.GState({ opacity: 0.82 }));
    doc.rect(wmX, wmY, wmSize, wmSize, 'F');
    doc.setGState(doc.GState({ opacity: 1.0 }));
  } catch {
    // Watermark is decorative — skip silently
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CONTENT (top → bottom, Y cursor)
  // ══════════════════════════════════════════════════════════════════════════
  let y = by + 14;

  // ── Sanskrit blessing (Canvas-rendered PNG, or latin fallback) ─────────────
  if (devanagariPng) {
    // Embed the Canvas-rendered Devanagari as an image (90mm wide, 8mm tall)
    const imgW = 90;
    const imgH = 8;
    doc.addImage(devanagariPng, 'PNG', (PW - imgW) / 2, y - 5, imgW, imgH);
    y += 10;
  } else {
    // Plain latin fallback if Canvas failed
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...MAROON);
    doc.text('|| Om Shri Ganeshaya Namah ||', PW / 2, y, { align: 'center' });
    y += 9;
  }

  // ── gold ornament line ─────────────────────────────────────────────────────
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(PW / 2 - 30, y, PW / 2 + 30, y);
  y += 11;

  // ── organisation name ──────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...DARK_BROWN);
  doc.text('Ganesh Puja Kharsawan', PW / 2, y, { align: 'center' });
  y += 9;

  // ── subtitle ───────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED_BROWN);
  doc.text('Sarvajanik Ganeshotsav  \u00B7  Kharsawan', PW / 2, y, {
    align: 'center',
  });
  y += 13;

  // ── OFFICIAL DONATION RECEIPT badge ───────────────────────────────────────
  const badgeW = 90;
  const badgeH = 9;
  const badgeX = (PW - badgeW) / 2;
  doc.setDrawColor(...DARK_BROWN);
  doc.setLineWidth(0.5);
  doc.rect(badgeX, y, badgeW, badgeH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK_BROWN);
  doc.text('OFFICIAL DONATION RECEIPT', PW / 2, y + 5.7, {
    align: 'center',
    charSpace: 1.2,
  });
  y += badgeH + 16;

  // ── Receipt info row ──────────────────────────────────────────────────────
  const receiptDate = parseGPMSDate(data.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const leftX = bx + 12;
  const rightX = bx + bw - 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED_BROWN);
  doc.text('RECEIPT NO.', leftX, y, { charSpace: 0.8 });
  doc.text('DATE', rightX, y, { align: 'right', charSpace: 0.8 });
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...DARK_BROWN);
  doc.text(data.receiptId, leftX, y);
  doc.text(receiptDate, rightX, y, { align: 'right' });
  y += 6;

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.line(leftX, y, rightX, y);
  y += 22;

  // ── "Received with gratitude from" ────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...MUTED_BROWN);
  doc.text('Received with gratitude from', PW / 2, y, { align: 'center' });
  y += 12;

  // ── Donor name ────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...DARK_BROWN);
  doc.text(data.donorName, PW / 2, y, { align: 'center' });
  y += 18;

  // ── CONTRIBUTION AMOUNT label ─────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED_BROWN);
  doc.text('CONTRIBUTION AMOUNT', PW / 2, y, {
    align: 'center',
    charSpace: 1.5,
  });
  y += 12;

  // ── Amount (large, maroon) ────────────────────────────────────────────────
  const amtFormatted = '\u20B9' + Number(data.amount).toLocaleString('en-IN');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(46);
  doc.setTextColor(...MAROON);
  doc.text(amtFormatted, PW / 2, y, { align: 'center' });
  y += 10;

  // ── Amount in words ───────────────────────────────────────────────────────
  const words = amountToWords(data.amount);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...DARK_BROWN);
  doc.text(words, PW / 2, y, { align: 'center' });
  y += 24;

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.line(PW / 2 - 38, y, PW / 2 + 38, y);
  y += 15;

  // ══════════════════════════════════════════════════════════════════════════
  // QR CODE — same /verify/{receiptId} URL as the original implementation
  // ══════════════════════════════════════════════════════════════════════════
  const verifyUrl = `${origin}/verify/${data.receiptId}`;
  try {
    const qrDataUri = await QRCode.toDataURL(verifyUrl, {
      width: 200,
      margin: 1,
      color: { dark: '#4A3728', light: '#FAF6F0' },
    });
    const qrSize = 48;
    const qrX = (PW - qrSize) / 2;

    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.7);
    doc.roundedRect(qrX - 5, y - 4, qrSize + 10, qrSize + 10, 2, 2);
    doc.addImage(qrDataUri, 'PNG', qrX, y, qrSize, qrSize);
    y += qrSize + 13;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED_BROWN);
    doc.text('Scan to verify authenticity online', PW / 2, y, {
      align: 'center',
    });
  } catch (qrErr) {
    console.error('[GPMS] QR generation failed:', qrErr);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FOOTER
  // ══════════════════════════════════════════════════════════════════════════
  const footerY = PH - MY - 14;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.line(bx + 12, footerY - 6, bx + bw - 12, footerY - 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED_BROWN);
  doc.text(
    'This digital receipt is issued in the spirit of the traditional bill-book.',
    PW / 2,
    footerY,
    { align: 'center' }
  );
  doc.text(
    'A copy has been sent to your phone. May Bappa bless you.',
    PW / 2,
    footerY + 5,
    { align: 'center' }
  );

  doc.save(`${data.receiptId}.pdf`);
}

/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  EXPENSE — original implementation, completely unchanged
 * ═════════════════════════════════════════════════════════════════════════════
 */
export async function generateAndDownloadExpenseRecord(
  data: ExpenseRecordData
) {
  const { jsPDF } = await import('jspdf');
  const QRCode = (await import('qrcode')).default || (await import('qrcode'));

  // Create a new A5 portrait PDF (standard for records)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Set fonts and colors
  doc.setFont('helvetica');

  // Title / Organization Header
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('Ganesh Puja Committee 2026', pageWidth / 2, 20, {
    align: 'center',
  });

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Official Expense Record', pageWidth / 2, 28, { align: 'center' });

  // Draw a horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 35, pageWidth - 15, 35);

  // Record Details
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);

  let y = 45;
  const leftCol = 20;
  const rightCol = 70;
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
    { label: 'Category:', value: data.category },
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
    // For description which might be long, slice it
    const val =
      field.value.length > 30
        ? field.value.substring(0, 27) + '...'
        : field.value;
    doc.text(val, rightCol, y);
    y += lineHeight;
  });

  // Verification URL
  const verifyUrl = `${window.location.origin}/verify/expense/${data.expenseId}`;

  try {
    // Generate QR Code as Data URI
    const qrDataUri = await QRCode.toDataURL(verifyUrl, {
      width: 100,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    // Add QR code image
    const qrSize = 40;
    doc.addImage(
      qrDataUri,
      'PNG',
      (pageWidth - qrSize) / 2,
      y + 10,
      qrSize,
      qrSize
    );

    // Scan text
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Scan QR Code to verify authenticity', pageWidth / 2, y + 55, {
      align: 'center',
    });
  } catch (err) {
    console.error('Failed to generate QR code for PDF', err);
  }

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('Official accounting record for GPMS 2026', pageWidth / 2, 190, {
    align: 'center',
  });

  // Save the PDF
  doc.save(`${data.expenseId}.pdf`);
}
