import { useCallback, useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroCarousel } from './components/HeroCarousel';
import { GalleryAndAboutSections } from './components/GalleryAndAboutSections';
import { ProductSection } from './components/ProductSection';
import { NewsAndTeamSections } from './components/NewsAndTeamSections';
import { Footer } from './components/Footer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { QuoteDrawerModal, QuoteLine } from './components/QuoteDrawerModal';
import { AdminPanel } from './components/AdminPanel';
import { AdminAuthGate } from './components/AdminAuthGate';
import { FloatingWhatsAppButton } from './components/FloatingWhatsAppButton';
import {
  DEFAULT_SITE_CONTENT,
  ProductItem,
  QuoteInquiry,
  ServerBackupSummary,
  SiteContent,
  TwoFactorSetupPayload,
  TwoFactorStatus,
} from './data/asasoraData';

const OBSERVED_SECTIONS = [
  'home-section',
  'about-section',
  'gallery-section',
  'product-section',
  'news',
  'team-section',
  'contact-section',
];

export default function App() {
  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [inquiries, setInquiries] = useState<QuoteInquiry[]>([]);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(
    () => window.location.hash === '#admin',
  );

  // Admin auth token and email are kept strictly in React memory (never persisted in browser storage)
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string>('');

  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [quoteDrawerOpen, setQuoteDrawerOpen] = useState(false);
  const [quoteLines, setQuoteLines] = useState<QuoteLine[]>([]);
  const [activeSection, setActiveSection] = useState('home-section');

  const clearSession = useCallback(() => {
    setAdminToken(null);
    setAdminEmail('');
    setInquiries([]);
  }, []);

  const authFetch = useCallback(
    async (url: string, init?: RequestInit): Promise<Response> => {
      if (!adminToken) {
        throw new Error('Not authenticated');
      }
      const headers = new Headers(init?.headers);
      headers.set('Authorization', `Bearer ${adminToken}`);
      const res = await fetch(url, { ...init, headers });
      if (res.status === 401) {
        clearSession();
      }
      return res;
    },
    [adminToken, clearSession],
  );

  // Hydrate public storefront content from server on mount
  useEffect(() => {
    let active = true;
    fetch('/api/site-content')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SiteContent | null) => {
        if (active && data && data.branding) {
          setSiteContent(data);
        }
      })
      .catch(() => {
        // Keep DEFAULT_SITE_CONTENT fallback if server is temporarily unreachable
      });
    return () => {
      active = false;
    };
  }, []);

  // Load protected B2B quote inquiries only when admin session token is active
  useEffect(() => {
    if (!adminToken) {
      setInquiries([]);
      return;
    }

    let active = true;
    fetch('/api/inquiries', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
      .then((res) => {
        if (res.status === 401) {
          if (active) clearSession();
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((data: QuoteInquiry[] | null) => {
        if (active && Array.isArray(data)) {
          setInquiries(data);
        }
      })
      .catch(() => {
        // Ignore transient network errors
      });

    return () => {
      active = false;
    };
  }, [adminToken, clearSession]);

  useEffect(() => {
    if (!isAdminMode && window.location.hash && window.location.hash !== '#admin') {
      const target = document.querySelector(window.location.hash);
      if (target) {
        window.setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }
    }
  }, [isAdminMode]);

  useEffect(() => {
    if (isAdminMode) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: '-25% 0px -55% 0px', threshold: [0.1, 0.35] },
    );

    OBSERVED_SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [isAdminMode]);

  const handleContentChange = (next: SiteContent) => {
    setSiteContent(next);
    setHasUnsavedChanges(true);
  };

  const handleSaveContent = async (): Promise<boolean> => {
    if (!adminToken) return false;
    try {
      const res = await authFetch('/api/site-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteContent),
      });
      if (!res.ok) return false;
      const saved = (await res.json()) as SiteContent;
      setSiteContent(saved);
      setHasUnsavedChanges(false);
      return true;
    } catch {
      return false;
    }
  };

  const handleResetContent = async (): Promise<void> => {
    if (!adminToken) return;
    try {
      const res = await authFetch('/api/site-content/reset', {
        method: 'POST',
      });
      if (!res.ok) return;
      const reset = (await res.json()) as SiteContent;
      setSiteContent(reset);
      setHasUnsavedChanges(false);
    } catch {
      // Keep current content on failure
    }
  };

  const handleOpenAdmin = () => {
    setIsAdminMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExitAdmin = (scrollToId?: string) => {
    setIsAdminMode(false);
    if (scrollToId) {
      window.setTimeout(() => {
        const target = document.getElementById(scrollToId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogout = async () => {
    if (adminToken) {
      try {
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
      } catch {
        // Proceed with clearing client state regardless
      }
    }
    clearSession();
  };

  // Two-Factor Authentication handlers
  const handleFetch2FAStatus = async (): Promise<TwoFactorStatus | null> => {
    try {
      const res = await authFetch('/api/admin/2fa/status');
      if (!res.ok) return null;
      return (await res.json()) as TwoFactorStatus;
    } catch {
      return null;
    }
  };

  const handleSetup2FA = async (): Promise<TwoFactorSetupPayload> => {
    const res = await authFetch('/api/admin/2fa/setup', { method: 'POST' });
    const data = (await res.json()) as TwoFactorSetupPayload & { error?: string };
    if (!res.ok) throw new Error(data.error || 'Failed to initiate 2FA setup.');
    return data;
  };

  const handleEnable2FA = async (setupId: string, code: string): Promise<string[]> => {
    const res = await authFetch('/api/admin/2fa/enable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setupId, code }),
    });
    const data = (await res.json()) as { recoveryCodes?: string[]; error?: string };
    if (!res.ok || !data.recoveryCodes) {
      throw new Error(data.error || 'Verification failed.');
    }
    return data.recoveryCodes;
  };

  const handleDisable2FA = async (password: string, code: string): Promise<void> => {
    const res = await authFetch('/api/admin/2fa/disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, code }),
    });
    const data = (await res.json()) as { enabled?: boolean; error?: string };
    if (!res.ok) {
      throw new Error(data.error || 'Unable to disable 2FA.');
    }
  };

  // Server Backup & Restore handlers
  const handleListBackups = async (): Promise<ServerBackupSummary[]> => {
    try {
      const res = await authFetch('/api/admin/backups');
      if (!res.ok) return [];
      return (await res.json()) as ServerBackupSummary[];
    } catch {
      return [];
    }
  };

  const handleCreateBackup = async (label: string): Promise<ServerBackupSummary> => {
    const res = await authFetch('/api/admin/backups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    });
    const data = (await res.json()) as ServerBackupSummary & { error?: string };
    if (!res.ok) throw new Error(data.error || 'Failed to create server backup.');
    return data;
  };

  const handleRestoreBackup = async (id: string): Promise<ServerBackupSummary[]> => {
    const res = await authFetch(`/api/admin/backups/${encodeURIComponent(id)}/restore`, {
      method: 'POST',
    });
    const data = (await res.json()) as {
      siteContent?: SiteContent;
      inquiries?: QuoteInquiry[];
      backups?: ServerBackupSummary[];
      error?: string;
    };
    if (!res.ok || !data.siteContent) {
      throw new Error(data.error || 'Failed to restore snapshot.');
    }
    setSiteContent(data.siteContent);
    if (Array.isArray(data.inquiries)) {
      setInquiries(data.inquiries);
    }
    setHasUnsavedChanges(false);
    return data.backups ?? [];
  };

  const handleDownloadBackup = async (id: string): Promise<void> => {
    const res = await authFetch(`/api/admin/backups/${encodeURIComponent(id)}/download`);
    if (!res.ok) throw new Error('Failed to download backup snapshot.');
    const text = await res.text();
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asasora-${id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteBackup = async (id: string): Promise<void> => {
    const res = await authFetch(`/api/admin/backups/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete backup snapshot.');
  };

  const handleRestoreJsonBackup = async (rawPayload: unknown): Promise<ServerBackupSummary[]> => {
    const res = await authFetch('/api/admin/restore-json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rawPayload),
    });
    const data = (await res.json()) as {
      siteContent?: SiteContent;
      inquiries?: QuoteInquiry[];
      backups?: ServerBackupSummary[];
      error?: string;
    };
    if (!res.ok || !data.siteContent) {
      throw new Error(data.error || 'Invalid JSON backup payload.');
    }
    setSiteContent(data.siteContent);
    if (Array.isArray(data.inquiries)) {
      setInquiries(data.inquiries);
    }
    setHasUnsavedChanges(false);
    return data.backups ?? [];
  };

  const handleExploreProducts = () => {
    const el = document.getElementById('product-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAddToQuote = (product: ProductItem, containers = 1) => {
    setQuoteLines((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, containers } : item,
        );
      }
      return [...prev, { product, containers }];
    });
  };

  const handleUpdateQuantity = (productId: string, containers: number) => {
    setQuoteLines((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, containers } : item)),
    );
  };

  const handleRemoveLine = (productId: string) => {
    setQuoteLines((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearAll = () => {
    setQuoteLines([]);
  };

  const handleSubmitInquiry = async (
    payload: Omit<QuoteInquiry, 'id' | 'submittedAt' | 'status' | 'referenceCode'>,
  ): Promise<string> => {
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error('Failed to submit inquiry');
    }
    const created = (await res.json()) as QuoteInquiry;
    if (adminToken) {
      setInquiries((prev) => [created, ...prev]);
    }
    return created.referenceCode;
  };

  const handleUpdateInquiryStatus = async (id: string, status: QuoteInquiry['status']) => {
    if (!adminToken) return;
    const res = await authFetch(`/api/inquiries/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = (await res.json()) as QuoteInquiry;
      setInquiries((prev) => prev.map((inq) => (inq.id === id ? updated : inq)));
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!adminToken) return;
    const res = await authFetch(`/api/inquiries/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setInquiries((prev) => prev.filter((inq) => inq.id !== id));
    }
  };

  const quoteProductIds = quoteLines.map((line) => line.product.id);
  const totalQuoteContainers = quoteLines.reduce((sum, line) => sum + line.containers, 0);

  if (isAdminMode) {
    if (!adminToken) {
      return (
        <AdminAuthGate
          branding={siteContent.branding}
          onAuthenticated={(token, email) => {
            setAdminToken(token);
            setAdminEmail(email);
          }}
          onBackToSite={() => handleExitAdmin()}
        />
      );
    }

    return (
      <AdminPanel
        content={siteContent}
        onChangeContent={handleContentChange}
        onSaveContent={handleSaveContent}
        onResetContent={handleResetContent}
        onExitAdmin={handleExitAdmin}
        onLogout={handleLogout}
        adminEmail={adminEmail}
        inquiries={inquiries}
        onUpdateInquiryStatus={handleUpdateInquiryStatus}
        onDeleteInquiry={handleDeleteInquiry}
        hasUnsavedChanges={hasUnsavedChanges}
        onFetch2FAStatus={handleFetch2FAStatus}
        onSetup2FA={handleSetup2FA}
        onEnable2FA={handleEnable2FA}
        onDisable2FA={handleDisable2FA}
        onListBackups={handleListBackups}
        onCreateBackup={handleCreateBackup}
        onRestoreBackup={handleRestoreBackup}
        onDownloadBackup={handleDownloadBackup}
        onDeleteBackup={handleDeleteBackup}
        onRestoreJsonBackup={handleRestoreJsonBackup}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#1C2822]">
      <Navbar
        branding={siteContent.branding}
        quoteCount={totalQuoteContainers}
        onOpenQuote={() => setQuoteDrawerOpen(true)}
        onOpenAdmin={handleOpenAdmin}
        activeSection={activeSection}
        isAdminAuthenticated={Boolean(adminToken)}
      />

      <main className="flex-1">
        <HeroCarousel
          slides={siteContent.heroSlides}
          ctaLabel={siteContent.heroCtaLabel}
          onExploreProducts={handleExploreProducts}
        />
        <GalleryAndAboutSections
          about={siteContent.about}
          sectionHeaders={siteContent.sectionHeaders}
          gallery={siteContent.gallery}
        />
        <ProductSection
          products={siteContent.products}
          sectionHeaders={siteContent.sectionHeaders}
          branding={siteContent.branding}
          footer={siteContent.footer}
          onSelectProduct={setSelectedProduct}
          onAddToQuote={(product) => handleAddToQuote(product, 1)}
          quoteProductIds={quoteProductIds}
        />
        <NewsAndTeamSections
          news={siteContent.news}
          team={siteContent.team}
          sectionHeaders={siteContent.sectionHeaders}
        />
      </main>

      <Footer
        branding={siteContent.branding}
        footer={siteContent.footer}
        onOpenQuote={() => setQuoteDrawerOpen(true)}
        onOpenAdmin={handleOpenAdmin}
      />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToQuote={handleAddToQuote}
        isQueued={selectedProduct ? quoteProductIds.includes(selectedProduct.id) : false}
      />

      <QuoteDrawerModal
        isOpen={quoteDrawerOpen}
        onClose={() => setQuoteDrawerOpen(false)}
        quoteLines={quoteLines}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveLine={handleRemoveLine}
        onClearAll={handleClearAll}
        onSubmitInquiry={handleSubmitInquiry}
      />

      <FloatingWhatsAppButton
        footer={siteContent.footer}
        brandName={siteContent.branding.brandName}
      />
    </div>
  );
}
