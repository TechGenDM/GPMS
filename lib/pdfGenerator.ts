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
const CREAM:      [number, number, number] = [252, 248, 242]; 
const WHITE:      [number, number, number] = [255, 255, 255];
const DARK_BROWN: [number, number, number] = [44,  35,  28];
const MAROON:     [number, number, number] = [139, 69,  19];
const GOLD:       [number, number, number] = [200, 160, 110];
const MUTED_BROWN:[number, number, number] = [120, 100, 80];

const DARK_BROWN_HEX  = '#2C231C';
const MAROON_HEX      = '#8B4513';
const MUTED_BROWN_HEX = '#786450';

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

  // Decreased from 28 to 22 for better proportions
  let fontSize = 22 * PPM; 
  const family = '"EB Garamond", Georgia, serif';
  do {
    ctx.font = `normal ${fontSize}px ${family}`;
    if (ctx.measureText(name).width <= maxW * 0.95) break;
    fontSize -= 4;
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

function addImageAlign(
  doc: import('jspdf').jsPDF,
  png: string,
  x: number,
  yTop: number,
  widthMM: number,
  heightMM: number,
  align: 'left' | 'center' | 'right'
): void {
  let imgX = x;
  if (align === 'center') imgX = x - widthMM / 2;
  if (align === 'right')  imgX = x - widthMM;
  doc.addImage(png, 'PNG', imgX, yTop, widthMM, heightMM);
}

function drawTopScallopMask(doc: import('jspdf').jsPDF, bx: number, by: number, bw: number, count: number) {
  const r = bw / (count * 2);
  const k = r * 0.5523;
  doc.setFillColor(...WHITE);
  doc.moveTo(bx, by);
  for (let i = 0; i < count; i++) {
    const lx = bx + i * 2 * r;
    const cx = lx + r;
    const rx = lx + 2 * r;
    doc.curveTo(lx, by + k, cx - k, by + r, cx, by + r);
    doc.curveTo(cx + k, by + r, rx, by + k, rx, by);
  }
  doc.lineTo(bx + bw, by - 10);
  doc.lineTo(bx, by - 10);
  doc.lineTo(bx, by);
  doc.fill();

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.moveTo(bx, by);
  for (let i = 0; i < count; i++) {
    const lx = bx + i * 2 * r;
    const cx = lx + r;
    const rx = lx + 2 * r;
    doc.curveTo(lx, by + k, cx - k, by + r, cx, by + r);
    doc.curveTo(cx + k, by + r, rx, by + k, rx, by);
  }
  doc.stroke();
}

function drawBottomScallopMask(doc: import('jspdf').jsPDF, bx: number, by: number, bw: number, count: number) {
  const r = bw / (count * 2);
  const k = r * 0.5523;
  doc.setFillColor(...WHITE);
  doc.moveTo(bx, by);
  for (let i = 0; i < count; i++) {
    const lx = bx + i * 2 * r;
    const cx = lx + r;
    const rx = lx + 2 * r;
    doc.curveTo(lx, by - k, cx - k, by - r, cx, by - r);
    doc.curveTo(cx + k, by - r, rx, by - k, rx, by);
  }
  doc.lineTo(bx + bw, by + 10);
  doc.lineTo(bx, by + 10);
  doc.lineTo(bx, by);
  doc.fill();

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.moveTo(bx, by);
  for (let i = 0; i < count; i++) {
    const lx = bx + i * 2 * r;
    const cx = lx + r;
    const rx = lx + 2 * r;
    doc.curveTo(lx, by - k, cx - k, by - r, cx, by - r);
    doc.curveTo(cx + k, by - r, rx, by - k, rx, by);
  }
  doc.stroke();
}

function drawOrnament(doc: import('jspdf').jsPDF, cx: number, y: number) {
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.2);
  doc.line(cx - 15, y, cx - 2, y);
  doc.line(cx + 2, y, cx + 15, y);
  doc.setFillColor(...GOLD);
  doc.moveTo(cx, y - 1);
  doc.lineTo(cx + 1, y);
  doc.lineTo(cx, y + 1);
  doc.lineTo(cx - 1, y);
  doc.fill();
}

// ══════════════════════════════════════════════════════════════════════════════
//  DONATION — Premium ceremonial Ganesh Puja receipt  (A4 portrait)
// ══════════════════════════════════════════════════════════════════════════════
export async function generateAndDownloadReceipt(data: ReceiptData) {
  const { jsPDF } = await import('jspdf');
  const QRCode    = (await import('qrcode')).default || (await import('qrcode'));

  const origin = window.location.origin;
  const CONTENT_W = 160;

  const DEVANAGARI = '\u0964\u0964 \u0913\u092E \u0936\u094D\u0930\u0940 \u0917\u0923\u0947\u0936\u093E\u092F \u0928\u092E\u0903 \u0964\u0964';

  const devanagariPng = textToPng(
    DEVANAGARI, CONTENT_W, 12,
    `normal ${10 * PPM}px "Tiro Devanagari Hindi", "Noto Serif Devanagari", serif`,
    MAROON_HEX
  );

  // Decreased title size from 16 to 13
  const orgNamePng = textToPng(
    'Ganesh Puja Kharsawan', CONTENT_W, 14,
    `normal ${13 * PPM}px "EB Garamond", serif`,
    DARK_BROWN_HEX
  );

  // Decreased subtitle size from 7 to 6
  const subtitlePng = textToPng(
    'Sarvajanik Ganeshotsav \u00B7 Kharsawan', CONTENT_W, 6,
    `italic ${6 * PPM}px "EB Garamond", serif`,
    MUTED_BROWN_HEX
  );

  const receiptDate = parseGPMSDate(data.date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  // Decreased receipt values from 7 to 6
  const rctIdPng = textToPng(data.receiptId, 80, 6, `normal ${6 * PPM}px "EB Garamond", serif`, DARK_BROWN_HEX, 'left');
  const datePng  = textToPng(receiptDate, 80, 6, `normal ${6 * PPM}px "EB Garamond", serif`, DARK_BROWN_HEX, 'right');

  // Decreased gratitude from 7.5 to 6.5
  const gratitudePng = textToPng(
    'Received with gratitude from', CONTENT_W, 7,
    `italic ${6.5 * PPM}px "EB Garamond", serif`,
    MUTED_BROWN_HEX
  );

  const donorData = donorNameToPng(data.donorName, CONTENT_W);

  const amtNum       = Number(data.amount);
  const amtFormatted = '\u20B9' + amtNum.toLocaleString('en-IN');
  // Decreased amount from 26 to 21
  const amtPng = textToPng(
    amtFormatted, CONTENT_W, 22,
    `normal ${21 * PPM}px "EB Garamond", serif`,
    MAROON_HEX
  );

  // Decreased words from 7.5 to 6.5
  const wordsPng = textToPng(
    amountToWords(data.amount), CONTENT_W, 7,
    `italic ${6.5 * PPM}px "EB Garamond", serif`,
    DARK_BROWN_HEX
  );
  
  // Decreased scan text from 5 to 4.5
  const verifyTextPng = textToPng(
    'Scan to verify authenticity online', CONTENT_W, 5,
    `normal ${4.5 * PPM}px "EB Garamond", serif`,
    DARK_BROWN_HEX
  );

  // Decreased footer from 6 to 5.5
  const footer1 = textToPng('This digital receipt is issued in the spirit of the traditional bill-book.', CONTENT_W, 6, `italic ${5.5 * PPM}px "EB Garamond", serif`, MUTED_BROWN_HEX);
  const footer2 = textToPng('A copy has been sent to your phone. May Bappa bless you.', CONTENT_W, 6, `italic ${5.5 * PPM}px "EB Garamond", serif`, MUTED_BROWN_HEX);

  // Faint watermark: 6% opacity
  const [sealPng] = await Promise.all([
    loadSealAtOpacity(`${origin}/seal.png`, 0.06),
  ]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW  = doc.internal.pageSize.getWidth();
  const PH  = doc.internal.pageSize.getHeight();
  
  const bx  = 16;
  const bw  = PW - 32;
  const by  = 15;
  const bh  = 240; 
  const CX  = PW / 2;
  const leftX  = bx + 15;
  const rightX = bx + bw - 15;

  // 1. Fill entire A4 with WHITE
  doc.setFillColor(...WHITE);
  doc.rect(0, 0, PW, PH, 'F');

  // 2. Draw CREAM receipt base
  doc.setFillColor(...CREAM);
  doc.rect(bx, by, bw, bh, 'F');

  // 3. Draw Side borders for receipt (the cream box edges)
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.line(bx, by, bx, by + bh);
  doc.line(bx + bw, by, bx + bw, by + bh);

  // 4. Draw Scalloped Top/Bottom masks
  const scCount = 40;
  drawTopScallopMask(doc, bx, by, bw, scCount);
  drawBottomScallopMask(doc, bx, by + bh, bw, scCount);

  // 5. Draw Double Border INSIDE the receipt
  const padThick = 6;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.rect(bx + padThick, by + padThick, bw - padThick*2, bh - padThick*2);

  const padThin = 8;
  doc.setLineWidth(0.2);
  doc.rect(bx + padThin, by + padThin, bw - padThin*2, bh - padThin*2);

  // 6. Centered Faint Watermark
  if (sealPng) {
    const wmMM = 90;
    const wmX = CX - wmMM / 2;
    const wmY = by + (bh / 2) - (wmMM / 2) + 15;
    doc.addImage(sealPng, 'PNG', wmX, wmY, wmMM, wmMM);
  }

  // 7. Render Content
  let y = by + 14;

  // Sanskrit
  addImageAlign(doc, devanagariPng, CX, y, CONTENT_W, 12, 'center');
  y += 12 + 3;

  // Top Ornament
  drawOrnament(doc, CX, y + 2);
  y += 7;

  // Title
  addImageAlign(doc, orgNamePng, CX, y, CONTENT_W, 14, 'center');
  y += 14 + 1;

  // Subtitle
  addImageAlign(doc, subtitlePng, CX, y, CONTENT_W, 6, 'center');
  y += 6 + 10;

  // Badge - Using literal spaces for perfect kerning and centering without jsPDF charSpace bugs
  const badgeText = 'O F F I C I A L   D O N A T I O N   R E C E I P T';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.0); // Slightly smaller
  const textWidth = doc.getTextWidth(badgeText);
  const badgeW = textWidth + 12; // 6mm padding on each side
  const badgeH = 7;
  const badgeX = CX - badgeW / 2;
  doc.setDrawColor(...MUTED_BROWN);
  doc.setLineWidth(0.2);
  doc.roundedRect(badgeX, y, badgeW, badgeH, 1.5, 1.5);
  doc.setTextColor(...DARK_BROWN);
  doc.setCharSpace(0); // Explicitly 0
  doc.text(badgeText, CX, y + 4.5, { align: 'center' });
  y += badgeH + 10;

  // Info Labels
  const infoLabelText = 'R E C E I P T   N O.';
  const dateLabelText = 'D A T E';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.0);
  doc.setTextColor(...MUTED_BROWN);
  doc.text(infoLabelText, leftX, y);
  doc.text(dateLabelText, rightX, y, { align: 'right' });
  y += 3.0;

  // Info Values
  addImageAlign(doc, rctIdPng, leftX, y, 80, 6, 'left');
  addImageAlign(doc, datePng, rightX, y, 80, 6, 'right');
  y += 6 + 3;

  // Divider line
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.2);
  doc.line(leftX, y, rightX, y);
  y += 10;

  // Gratitude
  addImageAlign(doc, gratitudePng, CX, y, CONTENT_W, 7, 'center');
  y += 7 + 2;

  // Donor
  addImageAlign(doc, donorData.png, CX, y, donorData.widthMM, donorData.heightMM, 'center');
  y += donorData.heightMM + 8;

  // Contrib Label - Again using manual spaces to guarantee perfect mathematical centering
  const contribText = 'C O N T R I B U T I O N   A M O U N T';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(...MUTED_BROWN);
  doc.text(contribText, CX, y, { align: 'center' });
  y += 4;

  // Amount
  addImageAlign(doc, amtPng, CX, y, CONTENT_W, 22, 'center');
  y += 22 + 1;

  // Words
  addImageAlign(doc, wordsPng, CX, y, CONTENT_W, 7, 'center');
  y += 7 + 7;

  // Bot Ornament
  drawOrnament(doc, CX, y + 2);
  y += 8;

  // QR
  const qrMM = 32;
  const qrX = CX - qrMM / 2;
  try {
    const verifyUrl = `${origin}/verify/${data.receiptId}`;
    const qrDataUri = await QRCode.toDataURL(verifyUrl, {
      width: 400,
      margin: 1,
      color: { dark: DARK_BROWN_HEX, light: '#FCF8F2' },
    });
    
    // Thin gold frame around QR
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.3);
    doc.roundedRect(qrX - 1.5, y - 1.5, qrMM + 3, qrMM + 3, 1, 1);
    doc.addImage(qrDataUri, 'PNG', qrX, y, qrMM, qrMM);
  } catch (qrErr) {
    console.error('[GPMS] QR generation error:', qrErr);
  }
  y += qrMM + 5;

  // Scan text
  addImageAlign(doc, verifyTextPng, CX, y, CONTENT_W, 5, 'center');
  
  // Footer (Rendered OUTSIDE the receipt, below the bottom scallop)
  const footerY = by + bh + 12;
  addImageAlign(doc, footer1, CX, footerY, CONTENT_W, 6, 'center');
  addImageAlign(doc, footer2, CX, footerY + 5, CONTENT_W, 6, 'center');

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
