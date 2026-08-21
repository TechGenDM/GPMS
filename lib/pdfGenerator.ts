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

// Pixels-per-mm for Canvas rendering (higher = sharper text in PDF)
const PPM = 10;

// ─── Canvas helpers ────────────────────────────────────────────────────────────

/**
 * Renders text onto a Canvas and returns a PNG data URL.
 * Dimensions are in mm; internally multiplied by PPM for pixel resolution.
 */
function textToPng(
  text: string,
  widthMM: number,
  heightMM: number,
  fontCss: string,          // CSS font string, e.g. "bold 120px Georgia, serif"
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

/**
 * Auto-sizes the donor name to fit within maxWidthMM.
 * Returns { png, widthMM, heightMM }.
 */
function donorNameToPng(
  name: string,
  maxWidthMM: number
): { png: string; widthMM: number; heightMM: number } {
  const maxW = Math.round(maxWidthMM * PPM);
  const canvas = document.createElement('canvas');
  canvas.width  = maxW;
  canvas.height = 1; // temp
  const ctx = canvas.getContext('2d')!;

  // Start at a generous size and shrink to fit
  let fontSize = 26 * PPM / 10; // start ~26mm equivalent
  const family = 'Georgia, "Times New Roman", serif';
  do {
    ctx.font = `bold ${fontSize}px ${family}`;
    if (ctx.measureText(name).width <= maxW * 0.92) break;
    fontSize -= 5;
  } while (fontSize > 14);

  const H = Math.round(fontSize * 1.6);
  canvas.height = H;
  ctx.clearRect(0, 0, maxW, H);
  ctx.font         = `bold ${fontSize}px ${family}`;
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

/**
 * Fetches seal.png and re-renders it at the requested opacity (0–1) using Canvas.
 * Returns a PNG data URL with opacity baked in, or null on failure.
 */
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

// ─── PDF drawing helpers ───────────────────────────────────────────────────────

/**
 * Adds a PNG image centred horizontally at the given Y (top of image).
 */
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

/**
 * Draws a scalloped wave line using cubic-bezier semicircles.
 * facing='down' → arcs bow downward (for top border).
 * facing='up'   → arcs bow upward   (for bottom border).
 */
function drawScallopLine(
  doc: import('jspdf').jsPDF,
  x1: number,
  y:  number,
  x2: number,
  count: number,
  facing: 'down' | 'up'
): void {
  const r   = (x2 - x1) / (count * 2);
  const k   = r * 0.5523; // Bézier control-point factor for circle approx
  const dir = facing === 'down' ? 1 : -1;

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.45);
  doc.moveTo(x1, y);

  for (let i = 0; i < count; i++) {
    const lx = x1 + i * 2 * r;
    const cx = lx + r;
    const rx = lx + 2 * r;
    // First half: (lx, y) → (cx, y + dir*r)
    doc.curveTo(lx, y + dir * k, cx - k, y + dir * r, cx, y + dir * r);
    // Second half: (cx, y+dir*r) → (rx, y)
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

  // ── Pre-render all Canvas images in parallel ────────────────────────────────
  const CONTENT_W = 162; // mm (content width inside border padding)
  const SERIF     = 'Georgia, "Times New Roman", Times, serif';

  // Devanagari — system fonts handle Devanagari natively in Canvas
  // ॥ ॐ श्री गणेशाय नमः ॥
  const DEVANAGARI =
    '\u0964\u0964 \u0913\u092E \u0936\u094D\u0930\u0940 \u0917\u0923\u0947\u0936\u093E\u092F \u0928\u092E\u0903 \u0964\u0964';

  const devanagariPng = textToPng(
    DEVANAGARI,
    CONTENT_W, 10,
    `bold ${11 * PPM}px "Noto Serif Devanagari", "Mangal", "Kokila", serif`,
    MAROON_HEX
  );

  const orgNamePng = textToPng(
    'Ganesh Puja Kharsawan',
    CONTENT_W, 17,
    `bold ${14 * PPM}px ${SERIF}`,
    DARK_BROWN_HEX
  );

  const subtitlePng = textToPng(
    'Sarvajanik Ganeshotsav \u00B7 Kharsawan',
    CONTENT_W, 8,
    `italic ${6 * PPM}px ${SERIF}`,
    MUTED_BROWN_HEX
  );

  const gratitudePng = textToPng(
    'Received with gratitude from',
    CONTENT_W, 7,
    `italic ${5.5 * PPM}px ${SERIF}`,
    MUTED_BROWN_HEX
  );

  const donorData = donorNameToPng(data.donorName, CONTENT_W);

  // Amount: large serif, maroon, using Canvas so ₹ renders via system font
  const amtNum        = Number(data.amount);
  const amtFormatted  = '\u20B9' + amtNum.toLocaleString('en-IN');
  const amtPng = textToPng(
    amtFormatted,
    CONTENT_W, 22,
    `bold ${18 * PPM}px ${SERIF}`,
    MAROON_HEX
  );

  const words    = amountToWords(data.amount);
  const wordsPng = textToPng(
    words,
    CONTENT_W, 7,
    `italic ${5.5 * PPM}px ${SERIF}`,
    DARK_BROWN_HEX
  );

  // Watermark — seal at ~7% opacity, pre-processed on Canvas
  const [sealPng] = await Promise.all([
    loadSealAtOpacity(`${origin}/seal.png`, 0.07),
  ]);

  // ── Create A4 document ──────────────────────────────────────────────────────
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW  = doc.internal.pageSize.getWidth();  // 210 mm
  const PH  = doc.internal.pageSize.getHeight(); // 297 mm
  const MX  = 12; // outer margin
  const MY  = 12;
  const PAD = 10; // inner padding from border to content edge

  const bx  = MX;
  const by  = MY;
  const bw  = PW - MX * 2;  // 186 mm
  const bh  = PH - MY * 2;  // 273 mm
  const CX  = PW / 2;       // centre X
  const leftX  = bx + PAD;
  const rightX = bx + bw - PAD;

  // ── LAYER 0: cream background ───────────────────────────────────────────────
  doc.setFillColor(...CREAM);
  doc.rect(0, 0, PW, PH, 'F');

  // ── LAYER 1: outer border ───────────────────────────────────────────────────
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.rect(bx, by, bw, bh);

  // inner border (offset 3mm)
  doc.setLineWidth(0.3);
  doc.rect(bx + 3, by + 3, bw - 6, bh - 6);

  // ── LAYER 2: scalloped wave lines (bezier) ──────────────────────────────────
  const scCount  = 26; // number of scallop arcs along top/bottom
  const scY_top  = by + 3 + 5.5;  // just inside inner border top
  const scY_bot  = by + bh - 3 - 5.5; // just inside inner border bottom
  const scX1     = bx + 3;
  const scX2     = bx + bw - 3;

  drawScallopLine(doc, scX1, scY_top, scX2, scCount, 'down');
  drawScallopLine(doc, scX1, scY_bot, scX2, scCount, 'up');

  // ── LAYER 3: Ganesh watermark (7% opacity, pre-processed via Canvas) ────────
  if (sealPng) {
    const wmMM = 74;
    // Position watermark behind donor/amount section
    const wmX = CX - wmMM / 2;
    const wmY = 145;
    doc.addImage(sealPng, 'PNG', wmX, wmY, wmMM, wmMM);
  }

  // ── CONTENT: y-cursor layout ────────────────────────────────────────────────
  // y always = TOP of the next element
  let y = by + 3 + 5.5 + 3 + 2; // just below the top scallop row

  // ── Devanagari Sanskrit blessing ────────────────────────────────────────────
  const devH = 10;
  addCentredImage(doc, devanagariPng, CX, y, CONTENT_W, devH);
  y += devH + 6;

  // ── Thin gold ornament line ──────────────────────────────────────────────────
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(CX - 25, y, CX + 25, y);
  y += 5;

  // ── Organisation name ────────────────────────────────────────────────────────
  const orgH = 17;
  addCentredImage(doc, orgNamePng, CX, y, CONTENT_W, orgH);
  y += orgH + 2;

  // ── Subtitle ─────────────────────────────────────────────────────────────────
  const subH = 8;
  addCentredImage(doc, subtitlePng, CX, y, CONTENT_W, subH);
  y += subH + 9;

  // ── OFFICIAL DONATION RECEIPT badge ─────────────────────────────────────────
  const badgeW = 86;
  const badgeH = 8.5;
  const badgeX = CX - badgeW / 2;
  doc.setDrawColor(...DARK_BROWN);
  doc.setLineWidth(0.45);
  doc.rect(badgeX, y, badgeW, badgeH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...DARK_BROWN);
  doc.setCharSpace(1.0);
  doc.text('OFFICIAL DONATION RECEIPT', CX, y + 5.3, { align: 'center' });
  doc.setCharSpace(0); // RESET — prevents bleeding into next text
  y += badgeH + 14;

  // ── Receipt info row ─────────────────────────────────────────────────────────
  const receiptDate = parseGPMSDate(data.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Labels (tiny, tracked)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTED_BROWN);
  doc.setCharSpace(0.9);
  doc.text('RECEIPT NO.', leftX,  y);
  doc.text('DATE',         rightX, y, { align: 'right' });
  doc.setCharSpace(0);
  y += 6;

  // Values
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...DARK_BROWN);
  doc.setCharSpace(0);
  doc.text(data.receiptId, leftX,  y);
  doc.text(receiptDate,    rightX, y, { align: 'right' });
  y += 5;

  // Divider
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.line(leftX, y, rightX, y);
  y += 20;

  // ── "Received with gratitude from" ───────────────────────────────────────────
  addCentredImage(doc, gratitudePng, CX, y, CONTENT_W, 7);
  y += 7 + 6;

  // ── Donor name (auto-sized) ──────────────────────────────────────────────────
  addCentredImage(doc, donorData.png, CX, y, donorData.widthMM, donorData.heightMM);
  y += donorData.heightMM + 14;

  // ── "CONTRIBUTION AMOUNT" label ──────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED_BROWN);
  doc.setCharSpace(1.5);
  doc.text('CONTRIBUTION AMOUNT', CX, y, { align: 'center' });
  doc.setCharSpace(0); // RESET — critical, prevents ₹ spacing bug
  y += 10;

  // ── Amount (Canvas — ₹ rendered via system font, no jsPDF ₹ encoding issue) ──
  const amtH = 22;
  addCentredImage(doc, amtPng, CX, y, CONTENT_W, amtH);
  y += amtH + 4;

  // ── Amount in words ──────────────────────────────────────────────────────────
  addCentredImage(doc, wordsPng, CX, y, CONTENT_W, 7);
  y += 7 + 18;

  // Centre divider
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.line(CX - 32, y, CX + 32, y);
  y += 12;

  // ── QR Code ──────────────────────────────────────────────────────────────────
  // same /verify/{receiptId} URL as original implementation
  const verifyUrl = `${origin}/verify/${data.receiptId}`;
  const qrMM = 44;
  try {
    const qrDataUri = await QRCode.toDataURL(verifyUrl, {
      width: 440,
      margin: 1,
      color: { dark: '#4A3728', light: '#FAF6F0' },
    });

    const qrX = CX - qrMM / 2;

    // Thin gold rounded border around QR
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.65);
    doc.roundedRect(qrX - 5, y - 4, qrMM + 10, qrMM + 10, 2, 2);

    doc.addImage(qrDataUri, 'PNG', qrX, y, qrMM, qrMM);
    y += qrMM + 14;
  } catch (qrErr) {
    console.error('[GPMS] QR generation error:', qrErr);
    y += 10;
  }

  // ── Footer (placed AFTER QR, not at fixed position) ──────────────────────────
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.line(leftX, y, rightX, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED_BROWN);
  doc.setCharSpace(0);
  const footerLine1 = 'This digital receipt is issued in the spirit of the traditional bill-book.';
  const footerLine2 = 'A copy has been sent to your phone. May Bappa bless you.';
  doc.text(footerLine1, CX, y,     { align: 'center' });
  doc.text(footerLine2, CX, y + 5, { align: 'center' });

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
