// src/components/ui/smart-contact-display.tsx
"use client";

import React from 'react';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';

interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
}

interface SmartContactDisplayProps {
  contactInfo: ContactInfo;
  maxItems?: number;
  className?: string;
  layout?: 'grid' | 'flex' | 'vertical';
}

// Utility functions for validation
const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 50; // Reasonable email length
};

const isValidPhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;
  // Remove common formatting characters
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
  // Check if it's a reasonable phone number (7-15 digits)
  return /^\d{7,15}$/.test(cleanPhone) && phone.length <= 20;
};

const isValidWebsite = (website: string): boolean => {
  if (!website || typeof website !== 'string') return false;
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return url.hostname.includes('.') && website.length <= 60; // Reasonable URL length
  } catch {
    return false;
  }
};

const isValidAddress = (address: string): boolean => {
  if (!address || typeof address !== 'string') return false;
  return address.length >= 10 && address.length <= 100; // Reasonable address length
};

// Priority scoring for contact information
const getContactPriority = (type: string, value: string): number => {
  let score = 0;
  
  // Base priority by type (higher = more important)
  switch (type) {
    case 'phone': score = 100; break;
    case 'email': score = 90; break;
    case 'website': score = 70; break;
    case 'address': score = 60; break;
    default: score = 0;
  }
  
  // Bonus for shorter, more displayable content
  if (value.length <= 20) score += 20;
  else if (value.length <= 30) score += 10;
  else if (value.length <= 40) score += 5;
  
  // Penalty for very long content that might be truncated
  if (value.length > 50) score -= 30;
  if (value.length > 70) score -= 50;
  
  return score;
};

export function SmartContactDisplay({ 
  contactInfo, 
  maxItems = 3, 
  className = "",
  layout = 'grid'
}: SmartContactDisplayProps) {
  // Validate and score all contact information
  const validContacts = React.useMemo(() => {
    const contacts = [];
    
    if (contactInfo.phone && isValidPhone(contactInfo.phone)) {
      contacts.push({
        type: 'phone',
        value: contactInfo.phone,
        icon: Phone,
        priority: getContactPriority('phone', contactInfo.phone)
      });
    }
    
    if (contactInfo.email && isValidEmail(contactInfo.email)) {
      contacts.push({
        type: 'email',
        value: contactInfo.email,
        icon: Mail,
        priority: getContactPriority('email', contactInfo.email)
      });
    }
    
    if (contactInfo.website && isValidWebsite(contactInfo.website)) {
      // Clean up website display
      let displayWebsite = contactInfo.website;
      if (displayWebsite.startsWith('http://') || displayWebsite.startsWith('https://')) {
        displayWebsite = displayWebsite.replace(/^https?:\/\//, '');
      }
      if (displayWebsite.startsWith('www.')) {
        displayWebsite = displayWebsite.replace(/^www\./, '');
      }
      
      contacts.push({
        type: 'website',
        value: displayWebsite,
        originalValue: contactInfo.website,
        icon: Globe,
        priority: getContactPriority('website', displayWebsite)
      });
    }
    
    if (contactInfo.address && isValidAddress(contactInfo.address)) {
      contacts.push({
        type: 'address',
        value: contactInfo.address,
        icon: MapPin,
        priority: getContactPriority('address', contactInfo.address)
      });
    }
    
    // Sort by priority (highest first) and limit to maxItems
    return contacts
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxItems);
  }, [contactInfo, maxItems]);

  if (validContacts.length === 0) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        No valid contact information available
      </div>
    );
  }

  const getLayoutClasses = () => {
    switch (layout) {
      case 'flex':
        return 'flex flex-wrap gap-4';
      case 'vertical':
        return 'space-y-2';
      case 'grid':
      default:
        return `grid grid-cols-1 ${validContacts.length > 1 ? 'md:grid-cols-2' : ''} gap-4`;
    }
  };

  const handleContactClick = (contact: any) => {
    switch (contact.type) {
      case 'phone':
        window.open(`tel:${contact.value}`, '_self');
        break;
      case 'email':
        window.open(`mailto:${contact.value}`, '_self');
        break;
      case 'website':
        const url = contact.originalValue || contact.value;
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;
        window.open(fullUrl, '_blank', 'noopener,noreferrer');
        break;
      case 'address':
        window.open(`https://maps.google.com/?q=${encodeURIComponent(contact.value)}`, '_blank', 'noopener,noreferrer');
        break;
    }
  };

  return (
    <div className={`${getLayoutClasses()} ${className}`}>
      {validContacts.map((contact, index) => {
        const Icon = contact.icon;
        return (
          <div 
            key={`${contact.type}-${index}`}
            className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors group"
            onClick={() => handleContactClick(contact)}
            title={`Click to ${contact.type === 'phone' ? 'call' : contact.type === 'email' ? 'email' : contact.type === 'website' ? 'visit website' : 'view on map'}`}
          >
            <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
            <span className="text-sm truncate group-hover:text-primary">
              {contact.value}
            </span>
          </div>
        );
      })}
      
      {/* Show indicator if there are more contacts than displayed */}
      {Object.keys(contactInfo).filter(key => contactInfo[key as keyof ContactInfo]).length > validContacts.length && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>+{Object.keys(contactInfo).filter(key => contactInfo[key as keyof ContactInfo]).length - validContacts.length} more</span>
        </div>
      )}
    </div>
  );
}

// Hook for getting smart contact summary
export function useSmartContactSummary(contactInfo: ContactInfo) {
  return React.useMemo(() => {
    const validContacts = [];
    
    if (contactInfo.phone && isValidPhone(contactInfo.phone)) {
      validContacts.push({ type: 'phone', value: contactInfo.phone });
    }
    
    if (contactInfo.email && isValidEmail(contactInfo.email)) {
      validContacts.push({ type: 'email', value: contactInfo.email });
    }
    
    if (contactInfo.website && isValidWebsite(contactInfo.website)) {
      validContacts.push({ type: 'website', value: contactInfo.website });
    }
    
    if (contactInfo.address && isValidAddress(contactInfo.address)) {
      validContacts.push({ type: 'address', value: contactInfo.address });
    }
    
    return {
      validContacts,
      hasValidPhone: validContacts.some(c => c.type === 'phone'),
      hasValidEmail: validContacts.some(c => c.type === 'email'),
      hasValidWebsite: validContacts.some(c => c.type === 'website'),
      hasValidAddress: validContacts.some(c => c.type === 'address'),
      totalValid: validContacts.length,
      summary: validContacts.length > 0 
        ? `${validContacts.length} valid contact${validContacts.length > 1 ? 's' : ''}`
        : 'No valid contacts'
    };
  }, [contactInfo]);
}
