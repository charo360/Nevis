'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { CREVO_CONTACTS } from '@/lib/constants/contacts';

export function WhatsAppButton() {
  // Format phone number for WhatsApp (remove spaces and special characters, keep only numbers and +)
  const whatsappNumber = CREVO_CONTACTS.phone.replace(/[^\d+]/g, '');
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=Hi! I'm interested in Crevo AI Designer. Can you help me?`;

  const handleWhatsAppClick = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 group"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
      
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
        Chat with us on WhatsApp
        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </button>
  );
}
