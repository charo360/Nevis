'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube
} from 'lucide-react';
import { AppRoutesPaths } from '@/lib/routes';
import { CREVO_CONTACTS } from '@/lib/constants/contacts';
import logoImage from '@/assets/logo.jpg';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-6">
              <div className="relative w-48 h-12 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <Image
                  src={logoImage}
                  alt="Crevo Logo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6">
              AI-powered content creation platform that helps businesses and creators generate stunning social media content in seconds.
            </p>

            {/* Contact Information */}
            <div className="space-y-3">
              <h4 className="font-semibold text-white mb-3">Contact Us</h4>
              <a
                href={`mailto:${CREVO_CONTACTS.email}`}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">{CREVO_CONTACTS.email}</span>
              </a>
              <a
                href={`tel:${CREVO_CONTACTS.phone.replace(/\s/g, '')}`}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm">{CREVO_CONTACTS.phone}</span>
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href={AppRoutesPaths.features} className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href={AppRoutesPaths.pricing} className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href={AppRoutesPaths.dashboard.root} className="hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href={AppRoutesPaths.about} className="hover:text-white transition-colors">About</Link></li>
              <li><a href={CREVO_CONTACTS.business.email} className="hover:text-white transition-colors">Partnerships</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href={`mailto:${CREVO_CONTACTS.support.email}`} className="hover:text-white transition-colors">Help Center</a></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">© 2025 Crevo. All rights reserved.</p>

            {/* Social Media Links */}
            <div className="flex items-center gap-4">
              <a
                href={CREVO_CONTACTS.social.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href={CREVO_CONTACTS.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href={CREVO_CONTACTS.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href={CREVO_CONTACTS.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href={CREVO_CONTACTS.social.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Revo Versions Info */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-center text-gray-500 text-xs">
              Powered by Revo AI Technology • Revo 1.0 • Revo 1.5 • Revo 2.0
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}