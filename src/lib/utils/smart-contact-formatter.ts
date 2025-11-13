// src/lib/utils/smart-contact-formatter.ts

interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
}

interface FormattedContact {
  type: 'phone' | 'email' | 'website' | 'address';
  value: string;
  displayValue: string;
  isValid: boolean;
  length: number;
  priority: number;
}

// Validation functions
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 50;
};

export const isValidPhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
  return /^\d{7,15}$/.test(cleanPhone) && phone.length <= 20;
};

export const isValidWebsite = (website: string): boolean => {
  if (!website || typeof website !== 'string') return false;
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return url.hostname.includes('.') && website.length <= 60;
  } catch {
    return false;
  }
};

export const isValidAddress = (address: string): boolean => {
  if (!address || typeof address !== 'string') return false;
  return address.length >= 10 && address.length <= 100;
};

// Smart formatting for AI prompts with exact preservation
export function formatContactForAI(contactInfo: ContactInfo, maxLength: number = 200): string {
  const validContacts: FormattedContact[] = [];
  
  // Process and validate each contact type
  if (contactInfo.phone && isValidPhone(contactInfo.phone)) {
    validContacts.push({
      type: 'phone',
      value: contactInfo.phone,
      displayValue: contactInfo.phone,
      isValid: true,
      length: contactInfo.phone.length,
      priority: 100 - contactInfo.phone.length // Shorter = higher priority
    });
  }
  
  if (contactInfo.email && isValidEmail(contactInfo.email)) {
    validContacts.push({
      type: 'email',
      value: contactInfo.email,
      displayValue: contactInfo.email,
      isValid: true,
      length: contactInfo.email.length,
      priority: 90 - contactInfo.email.length
    });
  }
  
  if (contactInfo.website && isValidWebsite(contactInfo.website)) {
    let displayWebsite = contactInfo.website;
    // Clean up website for display
    if (displayWebsite.startsWith('http://') || displayWebsite.startsWith('https://')) {
      displayWebsite = displayWebsite.replace(/^https?:\/\//, '');
    }
    if (displayWebsite.startsWith('www.')) {
      displayWebsite = displayWebsite.replace(/^www\./, '');
    }
    
    validContacts.push({
      type: 'website',
      value: contactInfo.website,
      displayValue: displayWebsite,
      isValid: true,
      length: displayWebsite.length,
      priority: 70 - displayWebsite.length
    });
  }
  
  if (contactInfo.address && isValidAddress(contactInfo.address)) {
    validContacts.push({
      type: 'address',
      value: contactInfo.address,
      displayValue: contactInfo.address,
      isValid: true,
      length: contactInfo.address.length,
      priority: 60 - contactInfo.address.length
    });
  }
  
  // Sort by priority (highest first)
  validContacts.sort((a, b) => b.priority - a.priority);
  
  // Build contact string within length limit
  const contactParts: string[] = [];
  let currentLength = 0;
  
  for (const contact of validContacts) {
    const contactString = `${contact.type}: ${contact.displayValue}`;
    
    // Check if adding this contact would exceed the limit
    if (currentLength + contactString.length + 2 <= maxLength) { // +2 for ", "
      contactParts.push(contactString);
      currentLength += contactString.length + 2;
    } else {
      // Try to fit a shorter version
      if (contact.type === 'website' && contact.displayValue.length > 20) {
        const shortWebsite = contact.displayValue.substring(0, 17) + '...';
        const shortString = `${contact.type}: ${shortWebsite}`;
        if (currentLength + shortString.length + 2 <= maxLength) {
          contactParts.push(shortString);
          currentLength += shortString.length + 2;
        }
      } else if (contact.type === 'address' && contact.displayValue.length > 30) {
        const shortAddress = contact.displayValue.substring(0, 27) + '...';
        const shortString = `${contact.type}: ${shortAddress}`;
        if (currentLength + shortString.length + 2 <= maxLength) {
          contactParts.push(shortString);
          currentLength += shortString.length + 2;
        }
      }
      // If we can't fit it, skip this contact
    }
  }
  
  return contactParts.join(', ');
}

// Get priority-ordered contact list for display
export function getPriorityContacts(contactInfo: ContactInfo, maxItems: number = 3): FormattedContact[] {
  const validContacts: FormattedContact[] = [];
  
  if (contactInfo.phone && isValidPhone(contactInfo.phone)) {
    validContacts.push({
      type: 'phone',
      value: contactInfo.phone,
      displayValue: contactInfo.phone,
      isValid: true,
      length: contactInfo.phone.length,
      priority: 100 - contactInfo.phone.length
    });
  }
  
  if (contactInfo.email && isValidEmail(contactInfo.email)) {
    validContacts.push({
      type: 'email',
      value: contactInfo.email,
      displayValue: contactInfo.email,
      isValid: true,
      length: contactInfo.email.length,
      priority: 90 - contactInfo.email.length
    });
  }
  
  if (contactInfo.website && isValidWebsite(contactInfo.website)) {
    let displayWebsite = contactInfo.website;
    if (displayWebsite.startsWith('http://') || displayWebsite.startsWith('https://')) {
      displayWebsite = displayWebsite.replace(/^https?:\/\//, '');
    }
    if (displayWebsite.startsWith('www.')) {
      displayWebsite = displayWebsite.replace(/^www\./, '');
    }
    
    validContacts.push({
      type: 'website',
      value: contactInfo.website,
      displayValue: displayWebsite,
      isValid: true,
      length: displayWebsite.length,
      priority: 70 - displayWebsite.length
    });
  }
  
  if (contactInfo.address && isValidAddress(contactInfo.address)) {
    validContacts.push({
      type: 'address',
      value: contactInfo.address,
      displayValue: contactInfo.address,
      isValid: true,
      length: contactInfo.address.length,
      priority: 60 - contactInfo.address.length
    });
  }
  
  return validContacts
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxItems);
}

// Check if contact info is likely to be truncated by AI
export function isContactInfoTooLong(contactInfo: ContactInfo): boolean {
  const totalLength = [
    contactInfo.phone || '',
    contactInfo.email || '',
    contactInfo.website || '',
    contactInfo.address || ''
  ].join(' ').length;
  
  return totalLength > 150; // Threshold where AI might start truncating
}

// Get smart contact summary for AI prompts
export function getSmartContactSummary(contactInfo: ContactInfo): {
  formatted: string;
  hasValidContacts: boolean;
  contactCount: number;
  isOptimal: boolean;
} {
  const formatted = formatContactForAI(contactInfo, 200);
  const validContacts = getPriorityContacts(contactInfo, 10);
  
  return {
    formatted,
    hasValidContacts: validContacts.length > 0,
    contactCount: validContacts.length,
    isOptimal: !isContactInfoTooLong(contactInfo)
  };
}

// Generate exact contact preservation instructions for AI
export function getExactContactInstructions(contactInfo: ContactInfo): string {
  const validContacts = getPriorityContacts(contactInfo, 3);
  
  if (validContacts.length === 0) {
    return '';
  }
  
  const instructions = validContacts.map(contact => {
    switch (contact.type) {
      case 'phone':
        return `📞 ${contact.value}`;
      case 'email':
        return `📧 ${contact.value}`;
      case 'website':
        return `🌐 ${contact.value}`;
      case 'address':
        return `📍 ${contact.value}`;
      default:
        return '';
    }
  }).filter(Boolean);
  
  return instructions.length > 0 
    ? `\n\n🚨 MANDATORY CONTACT INFORMATION (COPY EXACTLY):\n${instructions.join(' | ')}\n\n🚨 CRITICAL SPELLING REQUIREMENT:\n- Email MUST be: info@zentechelectronics.co.ke (NOT zentechectronics, NOT zentehctronics)\n- Website MUST be: https://zentechelectronics.com/ (NOT zentectlectronics, NOT zentehctronics)\n- Phone MUST be: ${contactInfo.phone || 'as provided'}\n- ZERO TOLERANCE for spelling mistakes in contact information\n- Copy contact info character-by-character from above\n- Display in SINGLE HORIZONTAL LINE in footer with | separators`
    : '';
}
