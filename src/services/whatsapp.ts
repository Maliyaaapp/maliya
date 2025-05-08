import  { WHATSAPP_API_URL } from '../utils/constants';

// WhatsApp messenger service to use our proxy for sending messages
export const sendWhatsAppMessage = async (phone: string, message: string): Promise<boolean> => {
  try {
    // Clean phone number - remove spaces, dashes, etc.
    const cleanPhone = phone.replace(/\s+/g, '').replace(/-/g, '');
    
    // Ensure phone has country code
    const phoneWithCountry = cleanPhone.startsWith('+') 
      ? cleanPhone 
      : (cleanPhone.startsWith('968') ? '+' + cleanPhone : '+968' + cleanPhone);
    
    // Prepare payload for WhatsApp Business API (simplified for proxy)
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneWithCountry,
      type: "text",
      text: { body: message }
    };
    
    // Send directly to WhatsApp API
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('WhatsApp API error:', errorData);
      return false;
    }
    
    const data = await response.json();
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
};

// WhatsApp template messages for common use cases
export const getTemplateMessage = (
  templateName: 'payment_reminder' | 'payment_confirmation' | 'transportation_notice' | 'general',
  params: {
    studentName: string;
    amount?: number;
    dueDate?: string;
    schoolName?: string;
    customMessage?: string;
  }
): string => {
  const { studentName, amount, dueDate, schoolName, customMessage } = params;
  
  switch (templateName) {
    case 'payment_reminder':
      return `تذكير بدفع الرسوم المستحقة للطالب ${studentName} بمبلغ ${amount} ر.ع ${dueDate ? `والمستحقة بتاريخ ${dueDate}` : ''}. ${schoolName || ''}`;
      
    case 'payment_confirmation':
      return `نشكركم على دفع الرسوم للطالب ${studentName} بمبلغ ${amount} ر.ع. ${schoolName || ''}`;
      
    case 'transportation_notice':
      return `إشعار بشأن خدمة النقل المدرسي للطالب ${studentName}. ${customMessage || ''}. ${schoolName || ''}`;
      
    case 'general':
    default:
      return customMessage || `رسالة من ${schoolName || 'المدرسة'} بخصوص الطالب ${studentName}`;
  }
};

export default {
  sendWhatsAppMessage,
  getTemplateMessage
};
 