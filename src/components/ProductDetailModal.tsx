import { useEffect, useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { ProductItem } from '../data/asasoraData';
import { ResilientImage } from './ResilientImage';

interface ProductDetailModalProps {
  product: ProductItem | null;
  onClose: () => void;
  onAddToQuote: (product: ProductItem, containers: number) => void;
  isQueued: boolean;
}

export function ProductDetailModal({
  product,
  onClose,
  onAddToQuote,
  isQueued,
}: ProductDetailModalProps) {
  const [containers, setContainers] = useState(1);

  useEffect(() => {
    setContainers(1);
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [product, onClose]);

  if (!product) return null;

  const specRows = [
    { label: 'Dimensions', value: product.specs.dimensions },
    { label: 'Materials', value: product.specs.materials },
    { label: 'Color', value: product.specs.color },
    { label: 'Style', value: product.specs.style },
    { label: 'Capacity', value: product.specs.capacity },
    { label: 'Unit Weight', value: product.specs.weight },
    { label: 'Origin', value: product.specs.origin },
    { label: 'Export Grade', value: product.specs.grade },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      className="fixed inset-0 z-50 bg-[#0F2319]/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-[#FAF9F6] rounded-sm max-w-4xl w-full overflow-hidden border border-[#1B3B2B]/20 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1B3B2B]/12 bg-[#F3F0EA]">
          <div className="flex items-center gap-2 text-xs text-[#526058]">
            <span className="font-semibold text-[#1B3B2B]">{product.category}</span>
            <span aria-hidden="true">·</span>
            <span>{product.seasonality} Harvest Schedule</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product specification modal"
            className="w-9 h-9 rounded-sm text-[#435249] hover:text-[#1B3B2B] hover:bg-[#FAF9F6] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Split */}
        <div className="grid grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-5 bg-[#F3F0EA]/60 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#1B3B2B]/12">
            <div className="w-full aspect-square rounded-sm overflow-hidden bg-[#FAF9F6] border border-[#1B3B2B]/12 p-4 flex items-center justify-center">
              <ResilientImage
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain object-center"
              />
            </div>

            <div className="mt-5 pt-4 border-t border-[#1B3B2B]/12 flex items-center justify-between text-sm">
              <span className="text-[#526058]">Indicative FOB</span>
              <span className="font-display text-lg font-semibold text-[#1B3B2B] tabular-nums">
                {product.fobEstimate}
              </span>
            </div>
          </div>

          <div className="md:col-span-7 bg-white p-6 sm:p-8 flex flex-col">
            <h2
              id="product-modal-title"
              className="font-display text-2xl sm:text-3xl font-semibold text-[#1B3B2B] mb-3"
            >
              {product.name}
            </h2>
            <p className="text-sm sm:text-base text-[#435249] leading-relaxed mb-6">
              {product.fullDescription}
            </p>

            {/* Information Specification Table */}
            <div className="mb-7">
              <h3 className="font-display text-sm font-semibold text-[#1B3B2B] mb-3">
                Export Information
              </h3>
              <div className="border border-[#1B3B2B]/15 rounded-sm overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <tbody className="divide-y divide-[#1B3B2B]/10">
                    {specRows.map((row) => (
                      <tr key={row.label} className="odd:bg-[#FAF9F6] even:bg-white">
                        <th className="py-2.5 px-4 text-left font-medium text-[#526058] w-2/5">
                          {row.label}
                        </th>
                        <td className="py-2.5 px-4 text-[#1C2822] tabular-nums">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Purchase / Export Inquiry Module */}
            <div className="mt-auto pt-5 border-t border-[#1B3B2B]/12 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <label htmlFor="container-qty" className="text-xs font-medium text-[#435249]">
                  Reefer Containers (40hc)
                </label>
                <div className="inline-flex items-center border border-[#1B3B2B]/20 rounded-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setContainers((c) => Math.max(1, c - 1))}
                    aria-label="Decrease containers"
                    className="px-3 py-1.5 text-sm font-medium text-[#1B3B2B] hover:bg-[#F3F0EA] cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    id="container-qty"
                    type="number"
                    min={1}
                    max={20}
                    value={containers}
                    onChange={(e) => setContainers(Math.max(1, Number(e.target.value) || 1))}
                    className="w-12 text-center text-sm font-medium text-[#1B3B2B] tabular-nums py-1.5 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setContainers((c) => Math.min(20, c + 1))}
                    aria-label="Increase containers"
                    className="px-3 py-1.5 text-sm font-medium text-[#1B3B2B] hover:bg-[#F3F0EA] cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onAddToQuote(product, containers);
                  onClose();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[#FAF9F6] bg-[#1B3B2B] hover:bg-[#132A1E] rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B2B]"
              >
                {isQueued ? (
                  <>
                    <Check className="w-4 h-4" aria-hidden="true" />
                    <span>Update Export Quote</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>Add to Export Quote</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
