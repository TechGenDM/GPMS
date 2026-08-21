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
 * Draws a row of small filled circles to simulate a scalloped border.
 * Uses jsPDF's circle() — compatible with jsPDF v4.
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
  doc.setLineWidth(0.2);
  const step = totalWidth / count;
  for (let i = 0; i < count; i++) {
    const cx = startX + i * step + step / 2;
    doc.circle(cx, y, radius, 'FD');
  }
}

/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  DONATION — Premium ceremonial Ganesh Puja receipt (A4 portrait)
 * ═════════════════════════════════════════════════════════════════════════════
 */
export async function generateAndDownloadReceipt(data: ReceiptData) {
  const { jsPDF } = await import('jspdf');
  const QRCode = (await import('qrcode')).default || (await import('qrcode'));

  // ── lazy-load font modules (only when user clicks Download PDF) ──
  const { ebGaramondRegularBase64 } = await import('./fonts/ebGaramondRegular');
  const { ebGaramondItalicBase64 } = await import('./fonts/ebGaramondItalic');
  const { tiroDevanagariHindiBase64 } =
    await import('./fonts/tiroDevanagariHindi');

  // ── A4 portrait ──
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = doc.internal.pageSize.getWidth(); // 210 mm
  const PH = doc.internal.pageSize.getHeight(); // 297 mm
  const MX = 16; // horizontal margin
  const MY = 16; // vertical margin

  // ── register custom fonts ──
  doc.addFileToVFS('EBGaramond-Regular.ttf', ebGaramondRegularBase64);
  doc.addFont('EBGaramond-Regular.ttf', 'EBGaramond', 'normal');

  doc.addFileToVFS('EBGaramond-Italic.ttf', ebGaramondItalicBase64);
  doc.addFont('EBGaramond-Italic.ttf', 'EBGaramond', 'italic');

  doc.addFileToVFS('TiroDevanagari-Regular.ttf', tiroDevanagariHindiBase64);
  doc.addFont('TiroDevanagari-Regular.ttf', 'TiroDevanagari', 'normal');

  // ══════════════════════════════════════════════════════════════════════════
  // LAYER 0 — warm cream background
  // ══════════════════════════════════════════════════════════════════════════
  doc.setFillColor(...CREAM);
  doc.rect(0, 0, PW, PH, 'F');

  // ══════════════════════════════════════════════════════════════════════════
  // LAYER 1 — outer decorative double border
  // ══════════════════════════════════════════════════════════════════════════
  const bx = MX;
  const by = MY;
  const bw = PW - MX * 2;
  const bh = PH - MY * 2;

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.0);
  doc.rect(bx, by, bw, bh); // outer border

  doc.setLineWidth(0.35);
  doc.rect(bx + 3, by + 3, bw - 6, bh - 6); // inner border

  // ══════════════════════════════════════════════════════════════════════════
  // LAYER 2 — scalloped dot rows at top and bottom (decorative)
  // ══════════════════════════════════════════════════════════════════════════
  const scallopsCount = 32;
  const scRadius = 1.4;
  const scY_top = by + 3 + 4.5; // just inside inner border top
  const scY_bot = by + bh - 3 - 4.5; // just inside inner border bottom
  const scStartX = bx + 3;
  const scWidth = bw - 6;

  drawScallops(doc, scStartX, scY_top, scWidth, scallopsCount, scRadius);
  drawScallops(doc, scStartX, scY_bot, scWidth, scallopsCount, scRadius);

  // ══════════════════════════════════════════════════════════════════════════
  // LAYER 3 — Ganesh seal watermark (decorative, low-opacity simulation)
  // ══════════════════════════════════════════════════════════════════════════
  try {
    const sealResponse = await fetch('/seal.png');
    const sealBuffer = await sealResponse.arrayBuffer();
    const sealBase64 = btoa(
      new Uint8Array(sealBuffer).reduce(
        (str, byte) => str + String.fromCharCode(byte),
        ''
      )
    );

    const wmSize = 78;
    const wmX = (PW - wmSize) / 2;
    const wmY = 118;

    // Draw image then overlay near-opaque cream rect to simulate low opacity
    doc.addImage(sealBase64, 'PNG', wmX, wmY, wmSize, wmSize);
    doc.setFillColor(...CREAM);
    doc.setGState(doc.GState({ opacity: 0.8 }));
    doc.rect(wmX, wmY, wmSize, wmSize, 'F');
    doc.setGState(doc.GState({ opacity: 1.0 }));
  } catch {
    // Watermark is purely decorative — silently skip if fetch fails
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CONTENT — top to bottom
  // ══════════════════════════════════════════════════════════════════════════
  let y = by + 16; // cursor starts below top scallops

  // ── Sanskrit blessing ──────────────────────────────────────────────────────
  // Uses TiroDevanagari for correct Devanagari glyph rendering
  doc.setFont('TiroDevanagari', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(...MAROON);
  // ॥ ॐ श्री गणेशाय नमः ॥
  doc.text(
    '\u0964\u0964 \u0913\u092E\u0020\u0936\u094D\u0930\u0940 \u0917\u0923\u0947\u0936\u093E\u092F \u0928\u092E\u0903 \u0964\u0964',
    PW / 2,
    y,
    { align: 'center' }
  );
  y += 12;

  // ── thin gold ornament line ────────────────────────────────────────────────
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(PW / 2 - 30, y, PW / 2 + 30, y);
  y += 12;

  // ── organisation name ──────────────────────────────────────────────────────
  doc.setFont('EBGaramond', 'normal');
  doc.setFontSize(28);
  doc.setTextColor(...DARK_BROWN);
  doc.text('Ganesh Puja Kharsawan', PW / 2, y, { align: 'center' });
  y += 9;

  // ── subtitle ───────────────────────────────────────────────────────────────
  doc.setFont('EBGaramond', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(...MUTED_BROWN);
  doc.text('Sarvajanik Ganeshotsav \u00B7 Kharsawan', PW / 2, y, {
    align: 'center',
  });
  y += 14;

  // ── "OFFICIAL DONATION RECEIPT" badge ─────────────────────────────────────
  const badgeW = 88;
  const badgeH = 9;
  const badgeX = (PW - badgeW) / 2;
  doc.setDrawColor(...DARK_BROWN);
  doc.setLineWidth(0.5);
  doc.rect(badgeX, y, badgeW, badgeH);
  doc.setFont('EBGaramond', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...DARK_BROWN);
  doc.text('OFFICIAL DONATION RECEIPT', PW / 2, y + 5.8, {
    align: 'center',
    charSpace: 1.2,
  });
  y += badgeH + 16;

  // ── receipt info row ───────────────────────────────────────────────────────
  const receiptDate = parseGPMSDate(data.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const leftX = bx + 12;
  const rightX = bx + bw - 12;

  doc.setFont('EBGaramond', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED_BROWN);
  doc.text('RECEIPT NO.', leftX, y, { charSpace: 0.8 });
  doc.text('DATE', rightX, y, { align: 'right', charSpace: 0.8 });
  y += 7;

  doc.setFontSize(15);
  doc.setTextColor(...DARK_BROWN);
  doc.text(data.receiptId, leftX, y);
  doc.text(receiptDate, rightX, y, { align: 'right' });
  y += 6;

  // thin gold divider
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.line(leftX, y, rightX, y);
  y += 22;

  // ── "Received with gratitude from" ────────────────────────────────────────
  doc.setFont('EBGaramond', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(...MUTED_BROWN);
  doc.text('Received with gratitude from', PW / 2, y, { align: 'center' });
  y += 13;

  // ── donor name ────────────────────────────────────────────────────────────
  doc.setFont('EBGaramond', 'normal');
  doc.setFontSize(30);
  doc.setTextColor(...DARK_BROWN);
  doc.text(data.donorName, PW / 2, y, { align: 'center' });
  y += 20;

  // ── "CONTRIBUTION AMOUNT" label ───────────────────────────────────────────
  doc.setFont('EBGaramond', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED_BROWN);
  doc.text('CONTRIBUTION AMOUNT', PW / 2, y, {
    align: 'center',
    charSpace: 1.5,
  });
  y += 13;

  // ── amount (large, maroon) ────────────────────────────────────────────────
  const amtFormatted = '\u20B9' + Number(data.amount).toLocaleString('en-IN');
  doc.setFont('EBGaramond', 'normal');
  doc.setFontSize(52);
  doc.setTextColor(...MAROON);
  doc.text(amtFormatted, PW / 2, y, { align: 'center' });
  y += 11;

  // ── amount in words ───────────────────────────────────────────────────────
  const words = amountToWords(data.amount);
  doc.setFont('EBGaramond', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(...DARK_BROWN);
  doc.text(words, PW / 2, y, { align: 'center' });
  y += 26;

  // thin centre ornament divider
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.line(PW / 2 - 38, y, PW / 2 + 38, y);
  y += 16;

  // ══════════════════════════════════════════════════════════════════════════
  // QR CODE — same verification URL as before; only visual placement changed
  // ══════════════════════════════════════════════════════════════════════════
  const verifyUrl = `${window.location.origin}/verify/${data.receiptId}`;

  try {
    const qrDataUri = await QRCode.toDataURL(verifyUrl, {
      width: 200,
      margin: 1,
      color: {
        dark: '#4A3728', // dark brown dots — matches receipt palette
        light: '#FAF6F0', // cream background
      },
    });

    const qrSize = 48;
    const qrX = (PW - qrSize) / 2;

    // decorative gold border around QR
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.7);
    doc.roundedRect(qrX - 5, y - 4, qrSize + 10, qrSize + 10, 2, 2);

    doc.addImage(qrDataUri, 'PNG', qrX, y, qrSize, qrSize);
    y += qrSize + 14;

    // scan label
    doc.setFont('EBGaramond', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED_BROWN);
    doc.text('Scan to verify authenticity online', PW / 2, y, {
      align: 'center',
    });
  } catch (err) {
    console.error('[GPMS] Failed to generate QR code for donation PDF', err);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FOOTER
  // ══════════════════════════════════════════════════════════════════════════
  const footerY = PH - MY - 14;

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.line(bx + 12, footerY - 6, bx + bw - 12, footerY - 6);

  doc.setFont('EBGaramond', 'italic');
  doc.setFontSize(9);
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
    footerY + 5.5,
    {
      align: 'center',
    }
  );

  // ── save ──
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
