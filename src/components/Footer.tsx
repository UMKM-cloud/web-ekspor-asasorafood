import { MapPin, Phone, Mail, Facebook, Instagram, Youtube } from 'lucide-react';
import { FooterContent, SiteBranding } from '../data/asasoraData';

interface FooterProps {
  branding: SiteBranding;
  footer: FooterContent;
  onOpenQuote: () => void;
  onOpenAdmin: () => void;
}

function safeSocialHref(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('#')) {
    return trimmed;
  }
  return '#contact-section';
}

export function Footer({ branding, footer, onOpenQuote, onOpenAdmin }: FooterProps) {
  const fbHref = safeSocialHref(footer.facebookUrl);
  const igHref = safeSocialHref(footer.instagramUrl);
  const ytHref = safeSocialHref(footer.youtubeUrl);

  return (
    <footer
      id="contact-section"
      className="bg-[#F3F0EA] border-t border-[#1B3B2B]/12 pt-20 pb-12 text-[#435249]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-14 border-b border-[#1B3B2B]/12">
          {/* Column 1: Brand & Contact Info */}
          <div className="md:col-span-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-sm overflow-hidden shrink-0 flex items-center justify-center">
                <img
                  src={branding.logoUrl}
                  alt={branding.brandName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain object-center"
                />
              </div>
              <span className="font-display text-2xl font-semibold text-[#1B3B2B]">
                {branding.brandName}
              </span>
            </div>

            <div className="space-y-3 text-sm text-[#435249] pt-1">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#C87D55] shrink-0 mt-0.5" aria-hidden="true" />
                <span>{footer.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#C87D55] shrink-0" aria-hidden="true" />
                <a
                  href={`tel:${footer.phone.replace(/\s+/g, '')}`}
                  className="hover:text-[#1B3B2B] tabular-nums"
                >
                  {footer.phone}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#C87D55] shrink-0" aria-hidden="true" />
                <button
                  type="button"
                  onClick={onOpenQuote}
                  className="hover:text-[#1B3B2B] cursor-pointer text-left"
                >
                  {footer.email}
                </button>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Navigation */}
          <div className="md:col-span-3">
            <h3 className="font-display text-sm font-semibold text-[#1B3B2B] mb-4">Directory</h3>
            <ul className="space-y-2.5 text-sm text-[#435249]">
              <li>
                <a href="#home-section" className="hover:text-[#1B3B2B] transition-colors">
                  Overview
                </a>
              </li>
              <li>
                <a href="#about-section" className="hover:text-[#1B3B2B] transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#gallery-section" className="hover:text-[#1B3B2B] transition-colors">
                  Packhouse Gallery
                </a>
              </li>
              <li>
                <a href="#product-section" className="hover:text-[#1B3B2B] transition-colors">
                  Export Catalog
                </a>
              </li>
              <li>
                <a href="#news" className="hover:text-[#1B3B2B] transition-colors">
                  Trade Briefs
                </a>
              </li>
              <li>
                <a href="#team-section" className="hover:text-[#1B3B2B] transition-colors">
                  Leadership
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="text-[#C87D55] hover:text-[#1B3B2B] font-medium transition-colors cursor-pointer"
                >
                  Admin Content Studio
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Mission & Socials */}
          <div className="md:col-span-4 space-y-4">
            <h3 className="font-display text-sm font-semibold text-[#1B3B2B]">Export Desk</h3>
            <p className="text-sm text-[#435249] leading-relaxed">{footer.deskSummary}</p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href={fbHref}
                target={fbHref.startsWith('http') ? '_blank' : undefined}
                rel={fbHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                aria-label={`${branding.brandName} on Facebook`}
                className="w-10 h-10 rounded-sm border border-[#1B3B2B]/20 text-[#1B3B2B] hover:bg-[#1B3B2B] hover:text-[#FAF9F6] flex items-center justify-center transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={igHref}
                target={igHref.startsWith('http') ? '_blank' : undefined}
                rel={igHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                aria-label={`${branding.brandName} on Instagram`}
                className="w-10 h-10 rounded-sm border border-[#1B3B2B]/20 text-[#1B3B2B] hover:bg-[#1B3B2B] hover:text-[#FAF9F6] flex items-center justify-center transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={ytHref}
                target={ytHref.startsWith('http') ? '_blank' : undefined}
                rel={ytHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                aria-label={`${branding.brandName} on YouTube`}
                className="w-10 h-10 rounded-sm border border-[#1B3B2B]/20 text-[#1B3B2B] hover:bg-[#1B3B2B] hover:text-[#FAF9F6] flex items-center justify-center transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7970]">
          <p>{footer.copyrightText}</p>
          <p>{footer.locationLabel}</p>
        </div>
      </div>
    </footer>
  );
}
