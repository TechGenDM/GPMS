import { parseGPMSDate } from './utils';

export interface ShareDonationData {
  receiptId: string;
  donorName: string;
  amount: number;
  paymentMode: string;
  purpose: string;
  collectorName?: string;
  date: string;
  donorPhone?: string | number;
}

export const getVerificationUrl = (receiptId: string) => {
  return `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${receiptId}`;
};

export const generateWhatsAppShareText = (data: ShareDonationData, verificationUrl: string) => {
  const dateStr = parseGPMSDate(data.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  
  return `🙏 Thank you, ${data.donorName}, for your generous contribution towards Ganesh Puja 2026!\n\n💰 Amount: ₹${data.amount.toLocaleString('en-IN')}\n🧾 Receipt ID: ${data.receiptId}\n💳 Payment Mode: ${data.paymentMode}\n🎯 Purpose: ${data.purpose}\n👤 Collected By: ${data.collectorName || 'N/A'}\n📅 Date: ${dateStr}\n\n🔍 Verify your official donation receipt:\n${verificationUrl}\n\nThank you for your support and contribution. 🙏\n— Ganesh Puja Committee 2026, Near Kharsawan Police Station, Jharkhand.`;
};

export const normalizeWhatsAppNumber = (phone?: string | number): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters (spaces, +, hyphens, etc.)
  const digitsOnly = String(phone).replace(/\D/g, '');
  
  if (!digitsOnly) return '';

  // If it's exactly 10 digits, assume standard Indian number and prepend 91
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }
  
  // If it's already 12 digits and starts with 91, it's correct
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return digitsOnly;
  }
  
  // Return the raw digits for any other valid international format
  return digitsOnly;
};

export const shareToWhatsApp = (data: ShareDonationData) => {
  const url = getVerificationUrl(data.receiptId);
  const text = generateWhatsAppShareText(data, url);
  const formattedPhone = normalizeWhatsAppNumber(data.donorPhone);
  
  // Use native intent on mobile for a more reliable deep link to the chat
  const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent);
  const baseUrl = isMobile ? 'whatsapp://send' : 'https://api.whatsapp.com/send';
  
  const targetUrl = formattedPhone 
    ? `${baseUrl}?phone=${formattedPhone}&text=${encodeURIComponent(text)}`
    : `${baseUrl}?text=${encodeURIComponent(text)}`;
    
  window.open(targetUrl, '_blank');
};

export const shareNative = async (data: ShareDonationData): Promise<boolean> => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'GPMS Donation Receipt',
        text: `Thank you for your donation of ₹${data.amount.toLocaleString('en-IN')}. Receipt ID: ${data.receiptId}`,
        url: getVerificationUrl(data.receiptId),
      });
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
};
