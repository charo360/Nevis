/**
 * Contact Information for Crevo Platform
 * Centralized contact details for all Revo versions
 */

export const CREVO_CONTACTS = {
  // General Contact Information
  email: 'support@crevo.app',
  phone: '+254 700 000 000',
  address: 'Nairobi, Kenya',
  
  // Social Media Links
  social: {
    twitter: 'https://twitter.com/crevoapp',
    facebook: 'https://facebook.com/crevoapp',
    instagram: 'https://instagram.com/crevoapp',
    linkedin: 'https://linkedin.com/company/crevoapp',
    youtube: 'https://youtube.com/@crevoapp',
  },
  
  // Support & Help
  support: {
    email: 'support@crevo.app',
    helpCenter: 'https://help.crevo.app',
    documentation: 'https://docs.crevo.app',
  },
  
  // Business Inquiries
  business: {
    email: 'business@crevo.app',
    partnerships: 'partnerships@crevo.app',
  },
  
  // Website
  website: 'https://crevo.app',
  
  // Working Hours
  workingHours: 'Monday - Friday, 9:00 AM - 6:00 PM EAT',
} as const;

// Revo-specific contact information (if needed for different support channels)
export const REVO_CONTACTS = {
  'revo-1.0': {
    support: 'revo1@crevo.app',
    documentation: 'https://docs.crevo.app/revo-1.0',
  },
  'revo-1.5': {
    support: 'revo1.5@crevo.app',
    documentation: 'https://docs.crevo.app/revo-1.5',
  },
  'revo-2.0': {
    support: 'revo2@crevo.app',
    documentation: 'https://docs.crevo.app/revo-2.0',
  },
} as const;

export type RevoVersion = keyof typeof REVO_CONTACTS;

