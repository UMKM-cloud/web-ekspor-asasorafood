import { useState } from 'react';
import { Menu, X, Lock, ShieldCheck } from 'lucide-react';
import { SiteBranding } from '../data/asasoraData';

interface NavbarProps {
  branding: SiteBranding;
  quoteCount: number;
  onOpenQuote: () => void;
  onOpenAdmin: () => void;
  activeSection: string;
  isAdminAuthenticated: boolean;
}

const NAV_LINKS = [
  { label: 'Home', href: '#home-section', id: 'home-section' },
  { label: 'About Us', href: '#about-section', id: 'about-section' },
  { label: 'Gallery', href: '#gallery-section', id: 'gallery-section' },
  { label: 'Products', href: '#product-section', id: 'product-section' },
  { label: 'News', href: '#news', id: 'news' },
  { label: 'Team', href: '#team-section', id: 'team-section' },
];

export function Navbar({
  branding,
  quoteCount,
  onOpenQuote,
  onOpenAdmin,
  activeSection,
  isAdminAuthenticated,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (href: string) => {
    setMobileMenuOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#1B3B2B]/12">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-18 md:h-20 flex items-center justify-between gap-6">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#home-section"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick('#home-section');
          }}
          className="flex items-center gap-3 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B2B] rounded-sm"
        >
          <div className="h-8 w-8 rounded-sm overflow-hidden shrink-0 flex items-center justify-center">
            <img
              src={branding.logoUrl}
              alt={branding.brandName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain object-center"
            />
          </div>
          <span className="font-display text-2xl font-semibold tracking-tight text-[#1B3B2B]">
            {branding.brandName}
          </span>
        </a>

        {/* Zone 2: Navigation links including Home, About Us, Gallery, Products, News, Team, Admin */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-6" aria-label="Primary Navigation">
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick(link.href);
                }}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1.5 border-b transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B2B] ${
                  isActive
                    ? 'text-[#1B3B2B] border-[#C87D55]'
                    : 'text-[#526058] border-transparent hover:text-[#1B3B2B] hover:border-[#1B3B2B]/30'
                }`}
              >
                {link.label}
              </a>
            );
          })}
          <button
            type="button"
            onClick={onOpenAdmin}
            className="inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap shrink-0 py-1.5 border-b border-transparent text-[#C87D55] hover:text-[#1B3B2B] hover:border-[#C87D55] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B2B]"
          >
            {isAdminAuthenticated ? (
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>Admin</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenQuote}
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-[#FAF9F6] bg-[#1B3B2B] hover:bg-[#132A1E] border border-[#1B3B2B] rounded-sm transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1B3B2B]"
          >
            {quoteCount > 0 ? `${branding.ctaLabel} (${quoteCount})` : branding.ctaLabel}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-sm text-[#1B3B2B] border border-[#1B3B2B]/15 hover:bg-[#F3F0EA] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B2B]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#1B3B2B]/12 bg-[#FAF9F6] px-6 py-5 space-y-2">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick(link.href);
              }}
              className="block px-3 py-2.5 text-sm font-medium text-[#2C3831] hover:text-[#1B3B2B] hover:bg-[#F3F0EA] rounded-sm"
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenAdmin();
            }}
            className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm font-medium text-[#C87D55] hover:text-[#1B3B2B] hover:bg-[#F3F0EA] rounded-sm cursor-pointer"
          >
            {isAdminAuthenticated ? (
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Lock className="w-4 h-4" aria-hidden="true" />
            )}
            <span>Admin Panel</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenQuote();
            }}
            className="w-full mt-3 px-4 py-3 text-sm font-medium text-[#FAF9F6] bg-[#1B3B2B] hover:bg-[#132A1E] rounded-sm transition-colors cursor-pointer"
          >
            {quoteCount > 0 ? `${branding.ctaLabel} (${quoteCount})` : branding.ctaLabel}
          </button>
        </div>
      )}
    </header>
  );
}
