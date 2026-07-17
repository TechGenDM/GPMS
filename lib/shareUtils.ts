import { parseGPMSDate } from './utils';

export interface ShareDonationData {
  receiptId: string;
  donorName: string;
  amount: number;
  paymentMode: string;
  purpose: string;
  collectorName?: string;
  date: string;
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

export const shareToWhatsApp = (data: ShareDonationData) => {
  const url = getVerificationUrl(data.receiptId);
  const text = generateWhatsAppShareText(data, url);
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
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
