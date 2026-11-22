import { useMemo, useState } from 'react';
import { Download, Search, Eye, Plus, Check, LayoutGrid, TableProperties } from 'lucide-react';
import {
  FooterContent,
  ProductItem,
  SectionHeaders,
  SiteBranding,
} from '../data/asasoraData';
import { ResilientImage } from './ResilientImage';

interface ProductSectionProps {
  products: ProductItem[];
  sectionHeaders: SectionHeaders;
  branding: SiteBranding;
  footer: FooterContent;
  onSelectProduct: (product: ProductItem) => void;
  onAddToQuote: (product: ProductItem) => void;
  quoteProductIds: string[];
}

type ViewMode = 'grid' | 'table';

export function ProductSection({
  products,
  sectionHeaders,
  branding,
  footer,
  onSelectProduct,
  onAddToQuote,
  quoteProductIds,
}: ProductSectionProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [catalogNotice, setCatalogNotice] = useState(false);

  const availableCategories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category)));
    return ['All', ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
      const matchesQuery =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.shortDescription.toLowerCase().includes(q) ||
        product.specs.origin.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [products, categoryFilter, searchQuery]);

  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const handleDownloadCatalog = () => {
    const rows = products
      .map(
        (p) =>
          `<tr>
          <td style="padding:12px;border-bottom:1px solid #d6d3cd;font-weight:600;color:#1B3B2B;">${escapeHtml(p.name)}</td>
          <td style="padding:12px;border-bottom:1px solid #d6d3cd;">${escapeHtml(p.category)}</td>
          <td style="padding:12px;border-bottom:1px solid #d6d3cd;">${escapeHtml(p.specs.dimensions)}</td>
          <td style="padding:12px;border-bottom:1px solid #d6d3cd;">${escapeHtml(p.specs.materials)}</td>
          <td style="padding:12px;border-bottom:1px solid #d6d3cd;">${escapeHtml(p.specs.capacity)}</td>
          <td style="padding:12px;border-bottom:1px solid #d6d3cd;">${escapeHtml(p.specs.weight)}</td>
          <td style="padding:12px;border-bottom:1px solid #d6d3cd;">${escapeHtml(p.specs.origin)}</td>
          <td style="padding:12px;border-bottom:1px solid #d6d3cd;">${escapeHtml(p.fobEstimate)}</td>
        </tr>`,
      )
      .join('');

    const htmlDoc = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${escapeHtml(branding.brandName)} B2B Export Product Catalog</title></head>
<body style="font-family:'Plus Jakarta Sans',sans-serif;max-width:1020px;margin:48px auto;padding:0 24px;color:#1C2822;background:#FAF9F6;">
  <h1 style="font-family:Georgia,serif;color:#1B3B2B;margin-bottom:6px;">${escapeHtml(branding.brandName)} — International B2B Export Specification Sheet</h1>
  <p style="color:#526058;margin-top:0;font-size:14px;">${escapeHtml(footer.address)} · ${escapeHtml(footer.phone)} · ${escapeHtml(footer.email)}</p>
  <table style="width:100%;border-collapse:collapse;margin-top:28px;font-size:14px;background:#FFFFFF;border:1px solid #d6d3cd;">
    <thead>
      <tr style="background:#F3F0EA;text-align:left;color:#1B3B2B;">
        <th style="padding:12px;border-bottom:1px solid #d6d3cd;">Product</th>
        <th style="padding:12px;border-bottom:1px solid #d6d3cd;">Category</th>
        <th style="padding:12px;border-bottom:1px solid #d6d3cd;">Dimensions</th>
        <th style="padding:12px;border-bottom:1px solid #d6d3cd;">Crating</th>
        <th style="padding:12px;border-bottom:1px solid #d6d3cd;">Capacity</th>
        <th style="padding:12px;border-bottom:1px solid #d6d3cd;">Unit Weight</th>
        <th style="padding:12px;border-bottom:1px solid #d6d3cd;">Origin</th>
        <th style="padding:12px;border-bottom:1px solid #d6d3cd;">Indicative FOB</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Asasora-Food-B2B-Export-Catalog.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCatalogNotice(true);
    window.setTimeout(() => setCatalogNotice(false), 3500);
  };

  return (
    <section
      id="product-section"
      className="bg-[#FAF9F6] py-24 lg:py-32 border-b border-[#1B3B2B]/10"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Section Heading */}
        <div className="max-w-2xl mb-14">
          <p className="text-sm font-medium text-[#C87D55] mb-2">
            {sectionHeaders.productKicker}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#1B3B2B] mb-4">
            {sectionHeaders.productHeading}
          </h2>
          <p className="text-[#526058] text-base leading-relaxed">
            {sectionHeaders.productSubtitle}
          </p>
        </div>

        {/* Interactive Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-[#1B3B2B]/12">
          <div
            className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#F3F0EA] rounded-sm border border-[#1B3B2B]/12 self-start"
            role="tablist"
            aria-label="Filter products by category"
          >
            {availableCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={categoryFilter === cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B2B] ${
                  categoryFilter === cat
                    ? 'bg-[#1B3B2B] text-[#FAF9F6]'
                    : 'text-[#435249] hover:text-[#1B3B2B] hover:bg-[#FAF9F6]'
                }`}
              >
                {cat === 'All' ? 'All Produce' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search
                className="w-4 h-4 text-[#6B7970] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by crop or origin..."
                aria-label="Filter by crop or origin"
                className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-[#1B3B2B]/15 rounded-sm text-[#1C2822] placeholder:text-[#7E8C83] focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
              />
            </div>

            <div className="inline-flex items-center bg-[#F3F0EA] border border-[#1B3B2B]/12 rounded-sm p-1 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
                className={`p-2 rounded-sm transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#FAF9F6] text-[#1B3B2B] border border-[#1B3B2B]/12'
                    : 'text-[#5E6D64] hover:text-[#1B3B2B]'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                aria-label="Specification table view"
                aria-pressed={viewMode === 'table'}
                className={`p-2 rounded-sm transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#FAF9F6] text-[#1B3B2B] border border-[#1B3B2B]/12'
                    : 'text-[#5E6D64] hover:text-[#1B3B2B]'
                }`}
              >
                <TableProperties className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-sm border border-[#1B3B2B]/15 p-12 text-center">
            <p className="font-display text-lg font-semibold text-[#1B3B2B] mb-2">
              No matching produce lines found
            </p>
            <p className="text-sm text-[#526058] mb-6">
              Clear your search filter or return to the complete export catalog.
            </p>
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('All');
                setSearchQuery('');
              }}
              className="px-5 py-2.5 text-sm font-medium text-[#FAF9F6] bg-[#1B3B2B] hover:bg-[#132A1E] rounded-sm cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
            {filteredProducts.map((product) => {
              const isQueued = quoteProductIds.includes(product.id);
              return (
                <article
                  key={product.id}
                  className="group bg-white rounded-sm border border-[#1B3B2B]/15 overflow-hidden flex flex-col transition-colors duration-150 hover:border-[#1B3B2B]/40"
                >
                  <button
                    type="button"
                    onClick={() => onSelectProduct(product)}
                    className="relative w-full border-b border-[#1B3B2B]/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1B3B2B]"
                    aria-label={`Inspect ${product.name} export specifications`}
                  >
                    <div className="w-full aspect-square overflow-hidden bg-[#F3F0EA]">
                      <ResilientImage
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#FAF9F6]/95 border border-[#1B3B2B]/15 text-[#1B3B2B] text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Spec Sheet</span>
                    </span>
                  </button>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-1.5 text-xs text-[#6B7970] mb-2">
                      <span>{product.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{product.specs.capacity}</span>
                    </div>

                    <h3 className="font-display text-xl font-semibold text-[#1B3B2B] mb-2.5">
                      <button
                        type="button"
                        onClick={() => onSelectProduct(product)}
                        className="text-left hover:text-[#C87D55] transition-colors cursor-pointer focus-visible:outline-none focus-visible:underline"
                      >
                        {product.name}
                      </button>
                    </h3>

                    <p className="text-sm text-[#435249] leading-relaxed line-clamp-3 mb-5 flex-1">
                      {product.shortDescription}
                    </p>

                    <div className="text-xs text-[#526058] pb-4 mb-4 border-b border-[#1B3B2B]/10 flex items-center justify-between tabular-nums">
                      <span>Indicative FOB</span>
                      <span className="font-semibold text-[#1B3B2B]">{product.fobEstimate}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectProduct(product)}
                        className="text-xs font-semibold text-[#1B3B2B] hover:text-[#C87D55] whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:underline"
                      >
                        View Specs
                      </button>

                      <button
                        type="button"
                        onClick={() => onAddToQuote(product)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-sm border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B2B] ${
                          isQueued
                            ? 'bg-[#F3F0EA] text-[#1B3B2B] border-[#1B3B2B]/30 hover:bg-[#E8E3DA]'
                            : 'bg-[#1B3B2B] text-[#FAF9F6] border-[#1B3B2B] hover:bg-[#132A1E]'
                        }`}
                      >
                        {isQueued ? (
                          <>
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>In Quote</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Add to Quote</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-sm border border-[#1B3B2B]/15 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[820px]">
              <thead>
                <tr className="border-b border-[#1B3B2B]/15 bg-[#F3F0EA] text-xs font-semibold text-[#1B3B2B]">
                  <th className="py-4 px-5">Product</th>
                  <th className="py-4 px-4">Origin</th>
                  <th className="py-4 px-4">Crate Dimensions</th>
                  <th className="py-4 px-4">Packaging</th>
                  <th className="py-4 px-4">Capacity</th>
                  <th className="py-4 px-4">Unit Weight</th>
                  <th className="py-4 px-4">FOB Est.</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B3B2B]/10 text-sm">
                {filteredProducts.map((product) => {
                  const isQueued = quoteProductIds.includes(product.id);
                  return (
                    <tr key={product.id} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="py-4 px-5">
                        <button
                          type="button"
                          onClick={() => onSelectProduct(product)}
                          className="flex items-center gap-3.5 font-medium text-[#1B3B2B] hover:text-[#C87D55] cursor-pointer text-left"
                        >
                          <div className="w-11 h-11 aspect-square rounded-sm overflow-hidden bg-[#F3F0EA] border border-[#1B3B2B]/15 shrink-0">
                            <ResilientImage
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover object-center"
                            />
                          </div>
                          <span>{product.name}</span>
                        </button>
                      </td>
                      <td className="py-4 px-4 text-[#435249]">{product.specs.origin}</td>
                      <td className="py-4 px-4 text-[#435249] tabular-nums">
                        {product.specs.dimensions}
                      </td>
                      <td className="py-4 px-4 text-[#435249]">{product.specs.materials}</td>
                      <td className="py-4 px-4 text-[#435249] tabular-nums">
                        {product.specs.capacity}
                      </td>
                      <td className="py-4 px-4 text-[#435249] tabular-nums">
                        {product.specs.weight}
                      </td>
                      <td className="py-4 px-4 font-semibold text-[#1B3B2B] tabular-nums">
                        {product.fobEstimate}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => onAddToQuote(product)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-sm border transition-colors whitespace-nowrap cursor-pointer ${
                            isQueued
                              ? 'bg-[#F3F0EA] text-[#1B3B2B] border-[#1B3B2B]/30'
                              : 'bg-[#1B3B2B] text-[#FAF9F6] border-[#1B3B2B] hover:bg-[#132A1E]'
                          }`}
                        >
                          {isQueued ? 'In Quote' : 'Add to Quote'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Download Catalog CTA */}
        <div className="mt-14 pt-10 border-t border-[#1B3B2B]/12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#526058]">
            Need full palletization charts and HS codes for customs clearance?
          </p>
          <div className="flex flex-col items-end">
            <button
              type="button"
              onClick={handleDownloadCatalog}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-medium text-[#FAF9F6] bg-[#1B3B2B] hover:bg-[#132A1E] rounded-sm transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1B3B2B]"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Download Export Specification Catalog</span>
            </button>

            {catalogNotice && (
              <p role="status" className="mt-2.5 text-xs font-medium text-[#1B3B2B]">
                Catalog downloaded (Asasora-Food-B2B-Export-Catalog.html).
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
