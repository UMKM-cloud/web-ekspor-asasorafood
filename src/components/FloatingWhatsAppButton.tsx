import { FooterContent, MINSORA_WHATSAPP_LOGO_URL } from '../data/asasoraData';

interface FloatingWhatsAppButtonProps {
  footer: FooterContent;
  brandName: string;
}

function buildWhatsAppUrl(rawPhone: string, message: string): string {
  let digits = rawPhone.replace(/\D/g, '');
  if (!digits) {
    digits = '62812345678';
  } else if (digits.startsWith('0')) {
    digits = `62${digits.slice(1)}`;
  }
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${digits}?text=${encodedMsg}`;
}

export function FloatingWhatsAppButton({ footer, brandName }: FloatingWhatsAppButtonProps) {
  const phone = footer.whatsappNumber?.trim() || footer.phone;
  const label = footer.whatsappLabel?.trim() || 'WhatsApp Admin';
  const message =
    footer.whatsappMessage?.trim() ||
    `Halo Admin ${brandName}, saya ingin menanyakan informasi produk dan penawaran ekspor.`;
  const iconUrl = footer.whatsappIconUrl?.trim() || MINSORA_WHATSAPP_LOGO_URL;

  const waHref = buildWhatsAppUrl(phone, message);

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-40">
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label} — Chat via WhatsApp`}
        className="group flex items-center gap-3 pl-2 pr-4 py-2 bg-[#1B3B2B] hover:bg-[#132A1E] text-[#FAF9F6] border border-[#FAF9F6]/20 rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1B3B2B]"
      >
        <div className="relative w-11 h-11 aspect-square rounded-full bg-white border border-[#C87D55]/60 overflow-hidden flex items-center justify-center shrink-0">
          <img
            src={iconUrl}
            alt="Minsora WhatsApp Admin"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain object-center p-0.5 transition-transform duration-200 group-hover:scale-105"
          />
        </div>

        <div className="text-left leading-tight pr-0.5">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-[#C87D55]">
            Minsora Support
          </span>
          <span className="block text-xs sm:text-sm font-semibold text-[#FAF9F6] whitespace-nowrap">
            {label}
          </span>
        </div>
      </a>
    </div>
  );
}
