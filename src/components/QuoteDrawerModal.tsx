import { FormEvent, useEffect, useState } from 'react';
import { X, Trash2, CheckCircle2, ArrowRight } from 'lucide-react';
import { ProductItem, QuoteInquiry } from '../data/asasoraData';
import { ResilientImage } from './ResilientImage';

export interface QuoteLine {
  product: ProductItem;
  containers: number;
}

interface QuoteDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteLines: QuoteLine[];
  onUpdateQuantity: (productId: string, containers: number) => void;
  onRemoveLine: (productId: string) => void;
  onClearAll: () => void;
  onSubmitInquiry: (inquiry: Omit<QuoteInquiry, 'id' | 'submittedAt' | 'status' | 'referenceCode'>) => Promise<string>;
}

export function QuoteDrawerModal({
  isOpen,
  onClose,
  quoteLines,
  onUpdateQuantity,
  onRemoveLine,
  onClearAll,
  onSubmitInquiry,
}: QuoteDrawerModalProps) {
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [destinationPort, setDestinationPort] = useState('Rotterdam, NL (CIF)');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalContainers = quoteLines.reduce((acc, item) => acc + item.containers, 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!companyName.trim()) {
      setErrorMsg('Please enter your importing company name.');
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setErrorMsg('Please enter a valid corporate email address.');
      return;
    }

    setSubmitting(true);
    try {
      const refCode = await onSubmitInquiry({
        companyName: companyName.trim(),
        email: email.trim(),
        destinationPort,
        notes: notes.trim(),
        items: quoteLines.map((l) => ({
          productId: l.product.id,
          productName: l.product.name,
          containers: l.containers,
          fobEstimate: l.product.fobEstimate,
        })),
      });
      setSubmittedRef(refCode);
      onClearAll();
    } catch {
      setErrorMsg('Unable to submit quote request right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedRef(null);
    setCompanyName('');
    setEmail('');
    setNotes('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Export Quote Inquiry"
      className="fixed inset-0 z-50 bg-[#0F2319]/65 backdrop-blur-xs flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#FAF9F6] h-full flex flex-col border-l border-[#1B3B2B]/15 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[#1B3B2B]/12 flex items-center justify-between bg-[#F3F0EA]">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#1B3B2B]">
              Export Quote &amp; Proforma Request
            </h2>
            <p className="text-xs text-[#526058] mt-0.5 tabular-nums">
              {totalContainers > 0
                ? `${quoteLines.length} produce lines · ${totalContainers} x 40ft HC selected`
                : 'Request FOB Tanjung Priok or CIF European port pricing'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export quote drawer"
            className="w-9 h-9 rounded-sm text-[#435249] hover:bg-[#FAF9F6] hover:text-[#1B3B2B] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {submittedRef ? (
            <div className="py-12 text-center">
              <CheckCircle2
                className="w-12 h-12 text-[#1B3B2B] mx-auto mb-4"
                aria-hidden="true"
              />
              <h3 className="font-display text-2xl font-semibold text-[#1B3B2B] mb-2">
                Inquiry {submittedRef} Logged
              </h3>
              <p className="text-sm text-[#435249] leading-relaxed max-w-sm mx-auto mb-8">
                Our Jakarta export desk has received your specification request for{' '}
                {destinationPort}. You will receive a formal proforma quotation and vessel schedule
                within 24 business hours.
              </p>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-6 py-2.5 text-sm font-medium text-[#FAF9F6] bg-[#1B3B2B] hover:bg-[#132A1E] rounded-sm cursor-pointer"
              >
                Return to Catalog
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h3 className="font-display text-sm font-semibold text-[#1B3B2B] mb-3">
                  Selected Produce Allocation
                </h3>
                {quoteLines.length === 0 ? (
                  <div className="rounded-sm border border-dashed border-[#1B3B2B]/25 bg-white p-5 text-center text-sm text-[#526058]">
                    No items queued yet. You may submit a general procurement inquiry below or add
                    items from the Export Product Portfolio.
                  </div>
                ) : (
                  <ul className="divide-y divide-[#1B3B2B]/10 border border-[#1B3B2B]/15 bg-white rounded-sm">
                    {quoteLines.map(({ product, containers }) => (
                      <li key={product.id} className="p-3.5 flex items-center gap-3">
                        <div className="w-12 h-12 aspect-square rounded-sm overflow-hidden bg-[#FAF9F6] border border-[#1B3B2B]/15 p-0.5 shrink-0 flex items-center justify-center">
                          <ResilientImage
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-contain object-center"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1B3B2B] truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-[#526058] tabular-nums">
                            {product.fobEstimate} · {product.specs.materials}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="inline-flex items-center border border-[#1B3B2B]/20 rounded-sm">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateQuantity(product.id, Math.max(1, containers - 1))
                              }
                              aria-label={`Decrease ${product.name} quantity`}
                              className="px-2.5 py-1 text-xs font-medium text-[#1B3B2B] hover:bg-[#F3F0EA] cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2.5 text-xs font-medium text-[#1B3B2B] tabular-nums">
                              {containers}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(product.id, containers + 1)}
                              aria-label={`Increase ${product.name} quantity`}
                              className="px-2.5 py-1 text-xs font-medium text-[#1B3B2B] hover:bg-[#F3F0EA] cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => onRemoveLine(product.id)}
                            aria-label={`Remove ${product.name}`}
                            className="p-1.5 text-[#6B7970] hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <form id="quote-inquiry-form" onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-display text-sm font-semibold text-[#1B3B2B]">
                  Importer &amp; Destination Port
                </h3>

                {errorMsg && (
                  <p
                    role="alert"
                    className="text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-sm px-3 py-2"
                  >
                    {errorMsg}
                  </p>
                )}

                <div>
                  <label htmlFor="quote-company" className="block text-xs font-medium text-[#435249] mb-1.5">
                    Importing Company Name
                  </label>
                  <input
                    id="quote-company"
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="EuroFresh Produce B.V."
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#1B3B2B]/20 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
                  />
                </div>

                <div>
                  <label htmlFor="quote-email" className="block text-xs font-medium text-[#435249] mb-1.5">
                    Procurement Contact Email
                  </label>
                  <input
                    id="quote-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="procurement@importer.eu"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#1B3B2B]/20 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
                  />
                </div>

                <div>
                  <label htmlFor="quote-port" className="block text-xs font-medium text-[#435249] mb-1.5">
                    Destination Port &amp; Incoterm
                  </label>
                  <select
                    id="quote-port"
                    value={destinationPort}
                    onChange={(e) => setDestinationPort(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#1B3B2B]/20 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
                  >
                    <option value="Rotterdam, NL (CIF)">Rotterdam, Netherlands (CIF)</option>
                    <option value="Hamburg, DE (CIF)">Hamburg, Germany (CIF)</option>
                    <option value="Antwerp, BE (CIF)">Antwerp, Belgium (CIF)</option>
                    <option value="Tanjung Priok, ID (FOB)">Tanjung Priok, Jakarta (FOB)</option>
                    <option value="Other Destination Port">Other Destination Port</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="quote-notes" className="block text-xs font-medium text-[#435249] mb-1.5">
                    Packaging or Delivery Schedule Notes (Optional)
                  </label>
                  <textarea
                    id="quote-notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Specify preferred weekly tonnage, pallet dimensions, or phytosanitary requirements..."
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#1B3B2B]/20 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
                  />
                </div>
              </form>
            </>
          )}
        </div>

        {!submittedRef && (
          <div className="p-6 border-t border-[#1B3B2B]/12 bg-[#F3F0EA]">
            <button
              type="submit"
              form="quote-inquiry-form"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-[#FAF9F6] bg-[#1B3B2B] hover:bg-[#132A1E] disabled:opacity-60 rounded-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B2B]"
            >
              <span>{submitting ? 'Submitting Request...' : 'Submit Export Quote Request'}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
