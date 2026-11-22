import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutDashboard,
  Layers,
  Inbox,
  Settings,
  Search,
  Save,
  Eye,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Copy,
  ChevronDown,
  ChevronRight,
  Download,
  Upload,
  RotateCcw,
  Check,
  ExternalLink,
  LogOut,
  ShieldCheck,
  KeyRound,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import {
  DEFAULT_SITE_CONTENT,
  GalleryItem,
  HeroSlide,
  MINSORA_WHATSAPP_LOGO_URL,
  NewsArticle,
  ProductItem,
  QuoteInquiry,
  ServerBackupSummary,
  SiteContent,
  TeamMember,
  TwoFactorSetupPayload,
  TwoFactorStatus,
} from '../data/asasoraData';
import { AdminImageField } from './AdminImageField';
import { ResilientImage } from './ResilientImage';

export type AdminTab =
  | 'overview'
  | 'hero'
  | 'about'
  | 'gallery'
  | 'products'
  | 'news'
  | 'team'
  | 'footer'
  | 'inquiries'
  | 'settings';

interface AdminPanelProps {
  content: SiteContent;
  onChangeContent: (next: SiteContent) => void;
  onSaveContent: () => Promise<boolean> | void;
  onResetContent: () => Promise<void> | void;
  onExitAdmin: (scrollToId?: string) => void;
  onLogout: () => void;
  adminEmail: string;
  inquiries: QuoteInquiry[];
  onUpdateInquiryStatus: (id: string, status: QuoteInquiry['status']) => void;
  onDeleteInquiry: (id: string) => void;
  hasUnsavedChanges: boolean;
  onFetch2FAStatus: () => Promise<TwoFactorStatus | null>;
  onSetup2FA: () => Promise<TwoFactorSetupPayload>;
  onEnable2FA: (setupId: string, code: string) => Promise<string[]>;
  onDisable2FA: (password: string, code: string) => Promise<void>;
  onListBackups: () => Promise<ServerBackupSummary[]>;
  onCreateBackup: (label: string) => Promise<ServerBackupSummary>;
  onRestoreBackup: (id: string) => Promise<ServerBackupSummary[]>;
  onDownloadBackup: (id: string) => Promise<void>;
  onDeleteBackup: (id: string) => Promise<void>;
  onRestoreJsonBackup: (rawPayload: unknown) => Promise<ServerBackupSummary[]>;
}

const SECTION_TABS: { id: AdminTab; label: string; previewSectionId?: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'hero', label: 'Header & Hero', previewSectionId: 'home-section' },
  { id: 'about', label: 'About Us', previewSectionId: 'about-section' },
  { id: 'gallery', label: 'Gallery & Video', previewSectionId: 'gallery-section' },
  { id: 'products', label: 'Products', previewSectionId: 'product-section' },
  { id: 'news', label: 'Our News', previewSectionId: 'news' },
  { id: 'team', label: 'Team', previewSectionId: 'team-section' },
  { id: 'footer', label: 'Footer & Contact', previewSectionId: 'contact-section' },
  { id: 'inquiries', label: 'Inquiries' },
  { id: 'settings', label: 'Backup' },
];

function reorderItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const copy = [...list];
  const [moved] = copy.splice(index, 1);
  copy.splice(target, 0, moved);
  return copy;
}

export function AdminPanel({
  content,
  onChangeContent,
  onSaveContent,
  onResetContent,
  onExitAdmin,
  onLogout,
  adminEmail,
  inquiries,
  onUpdateInquiryStatus,
  onDeleteInquiry,
  hasUnsavedChanges,
  onFetch2FAStatus,
  onSetup2FA,
  onEnable2FA,
  onDisable2FA,
  onListBackups,
  onCreateBackup,
  onRestoreBackup,
  onDownloadBackup,
  onDeleteBackup,
  onRestoreJsonBackup,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [sectionsMenuOpen, setSectionsMenuOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // 2FA & Server Backup state
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null);
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetupPayload | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showDisable2FAForm, setShowDisable2FAForm] = useState(false);
  const [securityError, setSecurityError] = useState('');
  const [securityBusy, setSecurityBusy] = useState(false);

  const [backups, setBackups] = useState<ServerBackupSummary[]>([]);
  const [backupLabel, setBackupLabel] = useState('');
  const [backupsBusy, setBackupsBusy] = useState(false);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [confirmDeleteBackupId, setConfirmDeleteBackupId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== 'settings') return;
    let active = true;
    onFetch2FAStatus().then((s) => {
      if (active && s) setTwoFactorStatus(s);
    });
    onListBackups().then((list) => {
      if (active) setBackups(list);
    });
    return () => {
      active = false;
    };
  }, [activeTab]);

  // Selected item IDs for split-view editing
  const [selectedSlideId, setSelectedSlideId] = useState<string>(
    content.heroSlides[0]?.id ?? '',
  );
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>(
    content.gallery[0]?.id ?? '',
  );
  const [selectedProductId, setSelectedProductId] = useState<string>(
    content.products[0]?.id ?? '',
  );
  const [selectedArticleId, setSelectedArticleId] = useState<string>(
    content.news[0]?.id ?? '',
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    content.team[0]?.id ?? '',
  );
  const [highlightedEditor, setHighlightedEditor] = useState<
    'slide' | 'gallery' | 'product' | 'article' | 'member' | null
  >(null);

  const jsonImportRef = useRef<HTMLInputElement | null>(null);
  const slideEditorRef = useRef<HTMLDivElement | null>(null);
  const galleryEditorRef = useRef<HTMLDivElement | null>(null);
  const productEditorRef = useRef<HTMLDivElement | null>(null);
  const productNameInputRef = useRef<HTMLInputElement | null>(null);
  const articleEditorRef = useRef<HTMLDivElement | null>(null);
  const memberEditorRef = useRef<HTMLDivElement | null>(null);

  const focusEditorCard = (
    key: 'slide' | 'gallery' | 'product' | 'article' | 'member',
    cardRef: { current: HTMLDivElement | null },
    inputRef?: { current: HTMLInputElement | null },
  ) => {
    setHighlightedEditor(key);
    window.setTimeout(() => {
      setHighlightedEditor((prev) => (prev === key ? null : prev));
    }, 1500);

    window.setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (inputRef?.current) {
        window.setTimeout(() => {
          inputRef.current?.focus({ preventScroll: true });
        }, 320);
      }
    }, 40);
  };

  const selectProductForEdit = (productId: string) => {
    setSelectedProductId(productId);
    focusEditorCard('product', productEditorRef, productNameInputRef);
  };

  const showToast = (msg: string) => {
    setSaveToast(msg);
    window.setTimeout(() => setSaveToast(null), 3000);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const ok = await onSaveContent();
      if (ok === false) {
        showToast('Session expired or save failed. Please sign in again.');
      } else {
        showToast('All website changes saved and synced.');
      }
    } catch {
      showToast('Failed to save changes to server.');
    } finally {
      setSaving(false);
    }
  };

  // Active item selectors with safe fallback
  const activeSlide =
    content.heroSlides.find((s) => s.id === selectedSlideId) ?? content.heroSlides[0];
  const activeGallery =
    content.gallery.find((g) => g.id === selectedGalleryId) ?? content.gallery[0];
  const activeProduct =
    content.products.find((p) => p.id === selectedProductId) ?? content.products[0];
  const activeArticle =
    content.news.find((n) => n.id === selectedArticleId) ?? content.news[0];
  const activeMember =
    content.team.find((m) => m.id === selectedMemberId) ?? content.team[0];

  // Global search results across sections
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: { label: string; type: string; tab: AdminTab; onSelect?: () => void }[] = [];

    content.products.forEach((p) => {
      if (p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) {
        results.push({
          label: p.name,
          type: 'Product',
          tab: 'products',
          onSelect: () => selectProductForEdit(p.id),
        });
      }
    });
    content.news.forEach((n) => {
      if (n.title.toLowerCase().includes(q)) {
        results.push({
          label: n.title,
          type: 'News',
          tab: 'news',
          onSelect: () => setSelectedArticleId(n.id),
        });
      }
    });
    content.gallery.forEach((g) => {
      if (g.title.toLowerCase().includes(q) || g.location.toLowerCase().includes(q)) {
        results.push({
          label: g.title,
          type: 'Gallery',
          tab: 'gallery',
          onSelect: () => setSelectedGalleryId(g.id),
        });
      }
    });
    content.team.forEach((m) => {
      if (m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)) {
        results.push({
          label: m.name,
          type: 'Team',
          tab: 'team',
          onSelect: () => setSelectedMemberId(m.id),
        });
      }
    });
    return results.slice(0, 8);
  }, [searchQuery, content]);

  const currentTabMeta = SECTION_TABS.find((t) => t.id === activeTab);

  // CRUD handlers
  const handleAddSlide = () => {
    const id = `slide-${Date.now()}`;
    const newSlide: HeroSlide = {
      id,
      kicker: 'New Export Highlight',
      title: 'Indonesian Agricultural & Culinary Excellence',
      subtitle: 'Zero artificial preservatives, packed for international distribution.',
      image: DEFAULT_SITE_CONTENT.heroSlides[0].image,
      imageAlt: 'Asasora Food export banner',
    };
    onChangeContent({ ...content, heroSlides: [...content.heroSlides, newSlide] });
    setSelectedSlideId(id);
  };

  const handleAddGalleryItem = () => {
    const id = `gal-${Date.now()}`;
    const item: GalleryItem = {
      id,
      title: 'New Facility Dispatch',
      location: 'Java Export Hub',
      image: DEFAULT_SITE_CONTENT.gallery[0].image,
    };
    onChangeContent({ ...content, gallery: [...content.gallery, item] });
    setSelectedGalleryId(id);
  };

  const handleAddProduct = () => {
    const id = `prod-${Date.now()}`;
    const item: ProductItem = {
      id,
      name: 'New Export Product',
      category: 'Fruiting Veg',
      shortDescription:
        'Export-grade Indonesian agricultural product processed without artificial preservatives.',
      fullDescription:
        'Prepared and packed under strict international food-safety and phytosanitary standards for long-distance maritime container transit.',
      image: DEFAULT_SITE_CONTENT.products[0].image,
      specs: {
        dimensions: '70cm x 68cm x 80cm',
        materials: 'Natural rattan',
        color: 'Natural',
        style: 'Box',
        capacity: '8 x 40hc',
        weight: '200g',
        origin: 'Java, Indonesia',
        grade: 'Export Class I',
      },
      fobEstimate: '$1,250 / MT',
      seasonality: 'Year-round',
    };
    onChangeContent({ ...content, products: [...content.products, item] });
    selectProductForEdit(id);
  };

  const handleDuplicateProduct = (product: ProductItem) => {
    const id = `prod-${Date.now()}`;
    const copy: ProductItem = {
      ...product,
      id,
      name: `${product.name} (Copy)`,
      specs: { ...product.specs },
    };
    onChangeContent({ ...content, products: [...content.products, copy] });
    selectProductForEdit(id);
  };

  const handleAddArticle = () => {
    const id = `news-${Date.now()}`;
    const article: NewsArticle = {
      id,
      title: 'New Export Dispatch & Supply Update',
      category: 'Trade Brief',
      publishedAt: 'November 2026',
      readTime: '3 min read',
      excerpt: 'Summary of recent export corridor operations and seasonal availability.',
      body: [
        'Asasora Food continues expanding container schedules across European destination ports.',
      ],
      image: DEFAULT_SITE_CONTENT.news[0].image,
    };
    onChangeContent({ ...content, news: [...content.news, article] });
    setSelectedArticleId(id);
  };

  const handleAddMember = () => {
    const id = `team-${Date.now()}`;
    const member: TeamMember = {
      id,
      name: 'New Team Member',
      role: 'Export Operations Specialist',
      bio: 'Coordinates international buyer documentation and quality assurance.',
      image: DEFAULT_SITE_CONTENT.team[0].image,
    };
    onChangeContent({ ...content, team: [...content.team, member] });
    setSelectedMemberId(id);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(content, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asasora-food-cms-backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('CMS configuration exported as JSON.');
  };

  const handleImportJson = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as unknown;
        setBackupsBusy(true);
        const updatedBackups = await onRestoreJsonBackup(parsed);
        setBackups(updatedBackups);
        showToast('Backup restored and verified on server.');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Unable to restore selected JSON file.');
      } finally {
        setBackupsBusy(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleStartSetup2FA = async () => {
    setSecurityError('');
    setRecoveryCodes(null);
    setSecurityBusy(true);
    try {
      const data = await onSetup2FA();
      setTwoFactorSetup(data);
      setTwoFactorCode('');
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : 'Failed to start 2FA setup.');
    } finally {
      setSecurityBusy(false);
    }
  };

  const handleConfirmEnable2FA = async () => {
    if (!twoFactorSetup || !twoFactorCode.trim()) {
      setSecurityError('Enter the 6-digit code shown in your authenticator app.');
      return;
    }
    setSecurityError('');
    setSecurityBusy(true);
    try {
      const codes = await onEnable2FA(twoFactorSetup.setupId, twoFactorCode.trim());
      setRecoveryCodes(codes);
      setTwoFactorSetup(null);
      setTwoFactorCode('');
      setTwoFactorStatus({
        enabled: true,
        enabledAt: new Date().toISOString(),
        remainingRecoveryCodes: codes.length,
      });
      showToast('Two-Factor Authentication (2FA) enabled.');
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : 'Invalid verification code.');
    } finally {
      setSecurityBusy(false);
    }
  };

  const handleConfirmDisable2FA = async () => {
    if (!disablePassword || !disableCode.trim()) {
      setSecurityError('Password and current 2FA/recovery code are required.');
      return;
    }
    setSecurityError('');
    setSecurityBusy(true);
    try {
      await onDisable2FA(disablePassword, disableCode.trim());
      setTwoFactorStatus({ enabled: false, enabledAt: null, remainingRecoveryCodes: 0 });
      setShowDisable2FAForm(false);
      setDisablePassword('');
      setDisableCode('');
      setRecoveryCodes(null);
      showToast('Two-Factor Authentication disabled.');
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : 'Failed to disable 2FA.');
    } finally {
      setSecurityBusy(false);
    }
  };

  const handleCreateServerBackup = async () => {
    setBackupsBusy(true);
    try {
      const created = await onCreateBackup(backupLabel.trim() || 'Manual Snapshot');
      setBackups((prev) => [created, ...prev]);
      setBackupLabel('');
      showToast(`Server snapshot "${created.label}" created.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create server backup.');
    } finally {
      setBackupsBusy(false);
    }
  };

  const handleRestoreServerBackup = async (id: string) => {
    setBackupsBusy(true);
    try {
      const list = await onRestoreBackup(id);
      setBackups(list);
      setConfirmRestoreId(null);
      showToast('Website content & inquiries restored from verified snapshot.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Restore failed.');
    } finally {
      setBackupsBusy(false);
    }
  };

  const handleDeleteServerBackup = async (id: string) => {
    setBackupsBusy(true);
    try {
      await onDeleteBackup(id);
      setBackups((prev) => prev.filter((b) => b.id !== id));
      setConfirmDeleteBackupId(null);
      showToast('Backup snapshot deleted.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setBackupsBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C2822] flex flex-col lg:flex-row">
      {/* LEFT SIDEBAR matching reference screenshot */}
      <aside className="w-full lg:w-64 shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-[#1B3B2B]/12 flex flex-col">
        <div className="p-6 border-b border-[#1B3B2B]/12">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-sm overflow-hidden bg-[#FAF9F6] border border-[#1B3B2B]/12 shrink-0 flex items-center justify-center p-0.5">
              <img
                src={content.branding.logoUrl}
                alt={content.branding.brandName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain object-center"
              />
            </div>
            <div className="min-w-0">
              <p className="font-display text-base font-semibold text-[#1B3B2B] truncate">
                {content.branding.brandName}
              </p>
              <p className="text-xs text-[#6B7970]">Content Studio</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1 flex-1" aria-label="Admin Navigation">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-sm transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#1B3B2B] text-[#FAF9F6]'
                : 'text-[#435249] hover:bg-[#F3F0EA] hover:text-[#1B3B2B]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Dashboard Overview</span>
          </button>

          <div>
            <button
              type="button"
              onClick={() => setSectionsMenuOpen((o) => !o)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-[#1B3B2B] hover:bg-[#F3F0EA] rounded-sm cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Website Sections</span>
              </span>
              {sectionsMenuOpen ? (
                <ChevronDown className="w-4 h-4 text-[#6B7970]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#6B7970]" />
              )}
            </button>

            {sectionsMenuOpen && (
              <div className="mt-1 ml-4 pl-3 border-l border-[#1B3B2B]/12 space-y-1">
                {SECTION_TABS.filter(
                  (t) => !['overview', 'inquiries', 'settings'].includes(t.id),
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3 py-2 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-[#F3F0EA] text-[#1B3B2B] font-semibold border border-[#1B3B2B]/15'
                        : 'text-[#526058] hover:text-[#1B3B2B] hover:bg-[#FAF9F6]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('inquiries')}
            className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-sm transition-colors cursor-pointer ${
              activeTab === 'inquiries'
                ? 'bg-[#1B3B2B] text-[#FAF9F6]'
                : 'text-[#435249] hover:bg-[#F3F0EA] hover:text-[#1B3B2B]'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Inbox className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Quote Inquiries</span>
            </span>
            <span className="text-xs tabular-nums opacity-80">{inquiries.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-sm transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#1B3B2B] text-[#FAF9F6]'
                : 'text-[#435249] hover:bg-[#F3F0EA] hover:text-[#1B3B2B]'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Backup &amp; Settings</span>
          </button>
        </nav>

        {/* Bottom Sidebar Live Preview & Session Box */}
        <div className="p-4 border-t border-[#1B3B2B]/12 bg-[#FAF9F6] space-y-2.5">
          <div>
            <p className="text-xs font-semibold text-[#1B3B2B]">Signed In Administrator</p>
            <p className="text-xs text-[#526058] truncate mt-0.5" title={adminEmail}>
              {adminEmail}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onExitAdmin(currentTabMeta?.previewSectionId)}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-[#1B3B2B] bg-white hover:bg-[#F3F0EA] border border-[#1B3B2B]/20 rounded-sm cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            <span>View Live Website</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-[#8C3B2B] bg-white hover:bg-red-50 border border-[#8C3B2B]/25 rounded-sm cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sign Out &amp; Lock Admin</span>
          </button>
        </div>
      </aside>

      {/* MAIN ADMIN WORKSPACE */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Workspace Header */}
        <div className="bg-white border-b border-[#1B3B2B]/12 px-6 lg:px-10 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[#C87D55] font-medium mb-1">
                Admin Studio / {currentTabMeta?.label ?? 'Editor'}
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#1B3B2B]">
                Website Content Management
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Global Search */}
              <div className="relative w-full sm:w-64">
                <Search
                  className="w-4 h-4 text-[#6B7970] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search section or item..."
                  aria-label="Search section or item"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF9F6] border border-[#1B3B2B]/15 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
                />
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-[#1B3B2B]/20 rounded-sm divide-y divide-[#1B3B2B]/10">
                    {searchResults.map((res, idx) => (
                      <button
                        key={`${res.tab}-${idx}`}
                        type="button"
                        onClick={() => {
                          setActiveTab(res.tab);
                          res.onSelect?.();
                          setSearchQuery('');
                        }}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-[#F3F0EA] flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <span className="truncate font-medium text-[#1B3B2B]">{res.label}</span>
                        <span className="text-[11px] text-[#6B7970] shrink-0">{res.type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#FAF9F6] bg-[#1B3B2B] hover:bg-[#132A1E] disabled:opacity-60 rounded-sm whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {saving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes*' : 'Save Changes'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onExitAdmin(currentTabMeta?.previewSectionId)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#1B3B2B] bg-[#F3F0EA] hover:bg-[#E8E3DA] border border-[#1B3B2B]/20 rounded-sm whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Preview Site</span>
              </button>
            </div>
          </div>

          {saveToast && (
            <div
              role="status"
              className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-[#F3F0EA] text-[#1B3B2B] border border-[#1B3B2B]/20 rounded-sm"
            >
              <Check className="w-3.5 h-3.5 text-[#C87D55]" aria-hidden="true" />
              <span>{saveToast}</span>
            </div>
          )}
        </div>

        {/* Workspace Content */}
        <div className="p-6 lg:p-10 space-y-8 flex-1">
          {/* 4-Column Summary Row matching uploaded screenshot */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('hero')}
              className="text-left bg-white p-5 rounded-sm border border-[#1B3B2B]/12 hover:border-[#1B3B2B]/35 transition-colors cursor-pointer"
            >
              <p className="text-xs text-[#6B7970] mb-1">Hero Carousel</p>
              <p className="font-display text-2xl font-semibold text-[#1B3B2B] tabular-nums">
                {content.heroSlides.length} Slides
              </p>
              <p className="text-xs text-[#526058] mt-1">Branding &amp; Banner</p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className="text-left bg-white p-5 rounded-sm border border-[#1B3B2B]/12 hover:border-[#1B3B2B]/35 transition-colors cursor-pointer"
            >
              <p className="text-xs text-[#6B7970] mb-1">Export Catalog</p>
              <p className="font-display text-2xl font-semibold text-[#1B3B2B] tabular-nums">
                {content.products.length} Products
              </p>
              <p className="text-xs text-[#526058] mt-1">Specs &amp; FOB Matrix</p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('news')}
              className="text-left bg-white p-5 rounded-sm border border-[#1B3B2B]/12 hover:border-[#1B3B2B]/35 transition-colors cursor-pointer"
            >
              <p className="text-xs text-[#6B7970] mb-1">Market Briefs</p>
              <p className="font-display text-2xl font-semibold text-[#1B3B2B] tabular-nums">
                {content.news.length} Articles
              </p>
              <p className="text-xs text-[#526058] mt-1">News &amp; Dispatches</p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inquiries')}
              className="text-left bg-white p-5 rounded-sm border border-[#1B3B2B]/12 hover:border-[#1B3B2B]/35 transition-colors cursor-pointer"
            >
              <p className="text-xs text-[#6B7970] mb-1">B2B Quote Inbox</p>
              <p className="font-display text-2xl font-semibold text-[#1B3B2B] tabular-nums">
                {inquiries.length} Requests
              </p>
              <p className="text-xs text-[#526058] mt-1">Importer Inquiries</p>
            </button>
          </div>

          {/* Horizontal Section Tab Strip */}
          <div className="border-b border-[#1B3B2B]/12 overflow-x-auto">
            <div className="flex items-center gap-6 min-w-max" role="tablist">
              {SECTION_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-[#C87D55] text-[#1B3B2B]'
                      : 'border-transparent text-[#6B7970] hover:text-[#1B3B2B]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SECTION_TABS.filter(
                (t) => !['overview', 'settings'].includes(t.id),
              ).map((section) => (
                <div
                  key={section.id}
                  className="bg-white border border-[#1B3B2B]/15 rounded-sm p-6 flex flex-col justify-between gap-4"
                >
                  <div>
                    <h2 className="font-display text-lg font-semibold text-[#1B3B2B] mb-1">
                      {section.label}
                    </h2>
                    <p className="text-xs text-[#526058] leading-relaxed">
                      {section.id === 'hero' &&
                        `Brand mark (${content.branding.brandName}), navigation CTA, and ${content.heroSlides.length} carousel slides.`}
                      {section.id === 'about' &&
                        `Company overview, ${content.about.kpis.length} trade facts, and farm workflow video.`}
                      {section.id === 'gallery' &&
                        `${content.gallery.length} packhouse and harvest photos with lightbox captions.`}
                      {section.id === 'products' &&
                        `${content.products.length} active export SKUs, container specs, and FOB estimates.`}
                      {section.id === 'news' &&
                        `${content.news.length} market briefs and logistics dispatches.`}
                      {section.id === 'team' &&
                        `${content.team.length} leadership profiles and portraits.`}
                      {section.id === 'footer' &&
                        `Headquarters address, export email (${content.footer.email}), and social links.`}
                      {section.id === 'inquiries' &&
                        `${inquiries.length} submitted B2B buyer proforma requests.`}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#1B3B2B]/10">
                    <button
                      type="button"
                      onClick={() => setActiveTab(section.id)}
                      className="text-xs font-semibold text-[#1B3B2B] hover:text-[#C87D55] cursor-pointer"
                    >
                      Open Editor
                    </button>
                    {section.previewSectionId && (
                      <button
                        type="button"
                        onClick={() => onExitAdmin(section.previewSectionId)}
                        className="text-xs text-[#6B7970] hover:text-[#1B3B2B] cursor-pointer"
                      >
                        View on Site
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: HEADER & HERO */}
          {activeTab === 'hero' && (
            <div className="space-y-8">
              {/* Global Branding Box */}
              <div className="bg-white border border-[#1B3B2B]/15 rounded-sm p-6 sm:p-8">
                <h2 className="font-display text-xl font-semibold text-[#1B3B2B] mb-5">
                  Site Branding &amp; Header Navigation
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-7 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-[#435249] mb-1.5">
                        Brand Name
                      </label>
                      <input
                        type="text"
                        value={content.branding.brandName}
                        onChange={(e) =>
                          onChangeContent({
                            ...content,
                            branding: { ...content.branding, brandName: e.target.value },
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#435249] mb-1.5">
                          Header Primary Button Label
                        </label>
                        <input
                          type="text"
                          value={content.branding.ctaLabel}
                          onChange={(e) =>
                            onChangeContent({
                              ...content,
                              branding: { ...content.branding, ctaLabel: e.target.value },
                            })
                          }
                          className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#435249] mb-1.5">
                          Hero Primary Button Label
                        </label>
                        <input
                          type="text"
                          value={content.heroCtaLabel}
                          onChange={(e) =>
                            onChangeContent({ ...content, heroCtaLabel: e.target.value })
                          }
                          className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    <AdminImageField
                      label="Brand Logo Image"
                      value={content.branding.logoUrl}
                      defaultUrl={DEFAULT_SITE_CONTENT.branding.logoUrl}
                      aspectClass="aspect-[16/6]"
                      fitMode="contain"
                      onChange={(logoUrl) =>
                        onChangeContent({
                          ...content,
                          branding: { ...content.branding, logoUrl },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Selected Hero Slide Editor */}
              {activeSlide && (
                <div
                  ref={slideEditorRef}
                  className={`scroll-mt-6 bg-white border rounded-sm p-6 sm:p-8 transition-shadow ${
                    highlightedEditor === 'slide'
                      ? 'border-[#C87D55] ring-2 ring-[#C87D55]/40'
                      : 'border-[#1B3B2B]/15'
                  }`}
                >
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1B3B2B]/10">
                    <div>
                      <h2 className="font-display text-xl font-semibold text-[#1B3B2B]">
                        Edit Hero Slide
                      </h2>
                      <p className="text-xs text-[#6B7970]">
                        Modify kicker, headline, subtitle, and slide background media.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSlide}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#FAF9F6] bg-[#1B3B2B] hover:bg-[#132A1E] rounded-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Add Hero Slide</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7 space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-[#435249] mb-1.5">
                          Slide Kicker
                        </label>
                        <input
                          type="text"
                          value={activeSlide.kicker}
                          onChange={(e) =>
                            onChangeContent({
                              ...content,
                              heroSlides: content.heroSlides.map((s) =>
                                s.id === activeSlide.id ? { ...s, kicker: e.target.value } : s,
                              ),
                            })
                          }
                          className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#435249] mb-1.5">
                          Hero Display Headline
                        </label>
                        <input
                          type="text"
                          value={activeSlide.title}
                          onChange={(e) =>
                            onChangeContent({
                              ...content,
                              heroSlides: content.heroSlides.map((s) =>
                                s.id === activeSlide.id ? { ...s, title: e.target.value } : s,
                              ),
                            })
                          }
                          className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#435249] mb-1.5">
                          Hero Subtitle
                        </label>
                        <textarea
                          rows={3}
                          value={activeSlide.subtitle}
                          onChange={(e) =>
                            onChangeContent({
                              ...content,
                              heroSlides: content.heroSlides.map((s) =>
                                s.id === activeSlide.id ? { ...s, subtitle: e.target.value } : s,
                              ),
                            })
                          }
                          className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#435249] mb-1.5">
                          Image Alt Description
                        </label>
                        <input
                          type="text"
                          value={activeSlide.imageAlt}
                          onChange={(e) =>
                            onChangeContent({
                              ...content,
                              heroSlides: content.heroSlides.map((s) =>
                                s.id === activeSlide.id ? { ...s, imageAlt: e.target.value } : s,
                              ),
                            })
                          }
                          className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-5">
                      <AdminImageField
                        label="Slide Background Image"
                        value={activeSlide.image}
                        defaultUrl={DEFAULT_SITE_CONTENT.heroSlides[0].image}
                        onChange={(image) =>
                          onChangeContent({
                            ...content,
                            heroSlides: content.heroSlides.map((s) =>
                              s.id === activeSlide.id ? { ...s, image } : s,
                            ),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Hero Slides List */}
              <div className="bg-white border border-[#1B3B2B]/15 rounded-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#1B3B2B]/12 bg-[#F3F0EA] flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold text-[#1B3B2B]">
                    All Hero Slides ({content.heroSlides.length})
                  </h3>
                </div>
                <ul className="divide-y divide-[#1B3B2B]/10">
                  {content.heroSlides.map((slide, idx) => (
                    <li
                      key={slide.id}
                      className={`px-6 py-4 flex flex-wrap items-center justify-between gap-4 ${
                        slide.id === activeSlide?.id ? 'bg-[#FAF9F6]' : 'bg-white'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedSlideId(slide.id)}
                        className="flex items-center gap-4 text-left flex-1 min-w-[240px] cursor-pointer"
                      >
                        <div className="w-16 aspect-[16/10] rounded-sm overflow-hidden bg-[#F3F0EA] border border-[#1B3B2B]/15 shrink-0">
                          <ResilientImage
                            src={slide.image}
                            alt={slide.title}
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1B3B2B] truncate">
                            {slide.title}
                          </p>
                          <p className="text-xs text-[#6B7970] truncate">{slide.kicker}</p>
                        </div>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            onChangeContent({
                              ...content,
                              heroSlides: reorderItem(content.heroSlides, idx, -1),
                            })
                          }
                          disabled={idx === 0}
                          aria-label="Move slide up"
                          className="p-2 text-[#526058] hover:text-[#1B3B2B] disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onChangeContent({
                              ...content,
                              heroSlides: reorderItem(content.heroSlides, idx, 1),
                            })
                          }
                          disabled={idx === content.heroSlides.length - 1}
                          aria-label="Move slide down"
                          className="p-2 text-[#526058] hover:text-[#1B3B2B] disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSlideId(slide.id);
                            focusEditorCard('slide', slideEditorRef);
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-sm cursor-pointer transition-colors ${
                            slide.id === activeSlide?.id
                              ? 'bg-[#1B3B2B] text-[#FAF9F6]'
                              : 'text-[#1B3B2B] bg-[#F3F0EA] hover:bg-[#E8E3DA]'
                          }`}
                        >
                          Edit
                        </button>
                        {content.heroSlides.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = content.heroSlides.filter((s) => s.id !== slide.id);
                              onChangeContent({ ...content, heroSlides: next });
                              if (selectedSlideId === slide.id && next[0]) {
                                setSelectedSlideId(next[0].id);
                              }
                            }}
                            aria-label="Delete slide"
                            className="p-2 text-[#6B7970] hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: ABOUT US & FARM VIDEO */}
          {activeTab === 'about' && (
            <div className="space-y-8">
              <div className="bg-white border border-[#1B3B2B]/15 rounded-sm p-6 sm:p-8">
                <h2 className="font-display text-xl font-semibold text-[#1B3B2B] mb-6">
                  About Us Section Content
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-7 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-[#435249] mb-1.5">
                        Section Kicker
                      </label>
                      <input
                        type="text"
                        value={content.about.kicker}
                        onChange={(e) =>
                          onChangeContent({
                            ...content,
                            about: { ...content.about, kicker: e.target.value },
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#435249] mb-1.5">
                        Main Heading
                      </label>
                      <input
                        type="text"
                        value={content.about.heading}
                        onChange={(e) =>
                          onChangeContent({
                            ...content,
                            about: { ...content.about, heading: e.target.value },
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#435249] mb-1.5">
                        Narrative Paragraphs (separated by blank line)
                      </label>
                      <textarea
                        rows={7}
                        value={content.about.paragraphs.join('\n\n')}
                        onChange={(e) =>
                          onChangeContent({
                            ...content,
                            about: {
                              ...content.about,
                              paragraphs: e.target.value.split(/\n\s*\n/).filter(Boolean),
                            },
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#435249] mb-2">
                        Key Trade Figures (3 Columns)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {content.about.kpis.map((kpi, idx) => (
                          <div
                            key={idx}
                            className="p-3 border border-[#1B3B2B]/15 rounded-sm bg-[#FAF9F6] space-y-2"
                          >
                            <input
                              type="text"
                              value={kpi.value}
                              aria-label={`KPI ${idx + 1} value`}
                              onChange={(e) => {
                                const nextKpis = content.about.kpis.map((item, i) =>
                                  i === idx ? { ...item, value: e.target.value } : item,
                                );
                                onChangeContent({
                                  ...content,
                                  about: { ...content.about, kpis: nextKpis },
                                });
                              }}
                              className="w-full px-2.5 py-1.5 text-sm font-semibold bg-white border border-[#1B3B2B]/20 rounded-sm"
                            />
                            <input
                              type="text"
                              value={kpi.label}
                              aria-label={`KPI ${idx + 1} label`}
                              onChange={(e) => {
                                const nextKpis = content.about.kpis.map((item, i) =>
                                  i === idx ? { ...item, label: e.target.value } : item,
                                );
                                onChangeContent({
                                  ...content,
                                  about: { ...content.about, kpis: nextKpis },
                                });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#1B3B2B]/20 rounded-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    <AdminImageField
                      label="About Section Feature Banner"
                      value={content.about.bannerImage}
                      defaultUrl={DEFAULT_SITE_CONTENT.about.bannerImage}
                      aspectClass="aspect-[4/3]"
                      onChange={(bannerImage) =>
                        onChangeContent({
                          ...content,
                          about: { ...content.about, bannerImage },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Farm Workflow & Video Block */}
              <div className="bg-white border border-[#1B3B2B]/15 rounded-sm p-6 sm:p-8">
                <h2 className="font-display text-xl font-semibold text-[#1B3B2B] mb-6">
                  Mission &amp; Harvest Video Section
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-7 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-[#435249] mb-1.5">
                        Mission Heading
                      </label>
                      <input
                        type="text"
                        value={content.about.missionHeading}
                        onChange={(e) =>
                          onChangeContent({
                            ...content,
                            about: { ...content.about, missionHeading: e.target.value },
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#435249] mb-1.5">
                        Mission Copy (separated by blank line)
                      </label>
                      <textarea
                        rows={5}
                        value={content.about.missionParagraphs.join('\n\n')}
                        onChange={(e) =>
                          onChangeContent({
                            ...content,
                            about: {
                              ...content.about,
                              missionParagraphs: e.target.value.split(/\n\s*\n/).filter(Boolean),
                            },
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#435249] mb-1.5">
                        YouTube Embed URL
                      </label>
                      <input
                        type="url"
                        value={content.about.videoEmbedUrl}
                        onChange={(e) =>
                          onChangeContent({
                            ...content,
                            about: { ...content.about, videoEmbedUrl: e.target.value },
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
                      />
                    </div>
                  </div>
                  <div className="lg:col-span-5">
                    <AdminImageField
                      label="Video Preview Thumbnail"
                      value={content.about.videoThumbnail}
                      defaultUrl={DEFAULT_SITE_CONTENT.about.videoThumbnail}
                      onChange={(videoThumbnail) =>
                        onChangeContent({
                          ...content,
                          about: { ...content.about, videoThumbnail },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GALLERY */}
          {activeTab === 'gallery' && (
            <div className="space-y-8">
              <div className="bg-white border border-[#1B3B2B]/15 rounded-sm p-6 sm:p-8">
                <h2 className="font-display text-lg font-semibold text-[#1B3B2B] mb-4">
                  Gallery Section Header
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#435249] mb-1">Kicker</label>
                    <input
                      type="text"
                      value={content.sectionHeaders.galleryKicker}
                      onChange={(e) =>
                        onChangeContent({
                          ...content,
                          sectionHeaders: {
                            ...content.sectionHeaders,
                            galleryKicker: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#435249] mb-1">Heading</label>
                    <input
                      type="text"
                      value={content.sectionHeaders.galleryHeading}
                      onChange={(e) =>
                        onChangeContent({
                          ...content,
                          sectionHeaders: {
                            ...content.sectionHeaders,
                            galleryHeading: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#435249] mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={content.sectionHeaders.gallerySubtitle}
                      onChange={(e) =>
                        onChangeContent({
                          ...content,
                          sectionHeaders: {
                            ...content.sectionHeaders,
                            gallerySubtitle: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                    />
                  </div>
                </div>
              </div>

              {activeGallery && (
                <div
                  ref={galleryEditorRef}
                  className={`scroll-mt-6 bg-white border rounded-sm p-6 sm:p-8 transition-shadow ${
                    highlightedEditor === 'gallery'
                      ? 'border-[#C87D55] ring-2 ring-[#C87D55]/40'
                      : 'border-[#1B3B2B]/15'
                  }`}
                >
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1B3B2B]/10">
                    <h2 className="font-display text-xl font-semibold text-[#1B3B2B]">
                      Edit Gallery Photo
                    </h2>
                    <button
                      type="button"
                      onClick={handleAddGalleryItem}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#FAF9F6] bg-[#1B3B2B] hover:bg-[#132A1E] rounded-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Add Photo</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-6 space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-[#435249] mb-1.5">
                          Photo Title
                        </label>
                        <input
                          type="text"
                          value={activeGallery.title}
                          onChange={(e) =>
                            onChangeContent({
                              ...content,
                              gallery: content.gallery.map((g) =>
                                g.id === activeGallery.id ? { ...g, title: e.target.value } : g,
                              ),
                            })
                          }
                          className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#435249] mb-1.5">
                          Facility / Location
                        </label>
                        <input
                          type="text"
                          value={activeGallery.location}
                          onChange={(e) =>
                            onChangeContent({
                              ...content,
                              gallery: content.gallery.map((g) =>
                                g.id === activeGallery.id ? { ...g, location: e.target.value } : g,
                              ),
                            })
                          }
                          className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-6">
                      <AdminImageField
                        label="Gallery Image"
                        value={activeGallery.image}
                        defaultUrl={DEFAULT_SITE_CONTENT.gallery[0].image}
                        aspectClass="aspect-[4/3]"
                        onChange={(image) =>
                          onChangeContent({
                            ...content,
                            gallery: content.gallery.map((g) =>
                              g.id === activeGallery.id ? { ...g, image } : g,
                            ),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white border border-[#1B3B2B]/15 rounded-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#1B3B2B]/12 bg-[#F3F0EA]">
                  <h3 className="font-display text-base font-semibold text-[#1B3B2B]">
                    Gallery Items ({content.gallery.length})
                  </h3>
                </div>
                <ul className="divide-y divide-[#1B3B2B]/10">
                  {content.gallery.map((item, idx) => (
                    <li
                      key={item.id}
                      className={`px-6 py-4 flex flex-wrap items-center justify-between gap-4 ${
                        item.id === activeGallery?.id ? 'bg-[#FAF9F6]' : 'bg-white'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedGalleryId(item.id)}
                        className="flex items-center gap-4 text-left flex-1 min-w-[200px] cursor-pointer"
                      >
                        <div className="w-16 aspect-[4/3] rounded-sm overflow-hidden bg-[#F3F0EA] border border-[#1B3B2B]/15 shrink-0">
                          <ResilientImage
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1B3B2B]">{item.title}</p>
                          <p className="text-xs text-[#6B7970]">{item.location}</p>
                        </div>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            onChangeContent({
                              ...content,
                              gallery: reorderItem(content.gallery, idx, -1),
                            })
                          }
                          disabled={idx === 0}
                          aria-label="Move photo up"
                          className="p-2 text-[#526058] hover:text-[#1B3B2B] disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onChangeContent({
                              ...content,
                              gallery: reorderItem(content.gallery, idx, 1),
                            })
                          }
                          disabled={idx === content.gallery.length - 1}
                          aria-label="Move photo down"
                          className="p-2 text-[#526058] hover:text-[#1B3B2B] disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedGalleryId(item.id);
                            focusEditorCard('gallery', galleryEditorRef);
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-sm cursor-pointer transition-colors ${
                            item.id === activeGallery?.id
                              ? 'bg-[#1B3B2B] text-[#FAF9F6]'
                              : 'text-[#1B3B2B] bg-[#F3F0EA] hover:bg-[#E8E3DA]'
                          }`}
                        >
                          Edit
                        </button>
                        {content.gallery.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = content.gallery.filter((g) => g.id !== item.id);
                              onChangeContent({ ...content, gallery: next });
                              if (selectedGalleryId === item.id && next[0]) {
                                setSelectedGalleryId(next[0].id);
                              }
                            }}
                            aria-label="Delete photo"
                            className="p-2 text-[#6B7970] hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 5: PRODUCTS CATALOG (Main Editor matching reference screenshot) */}
          {activeTab === 'products' && (
            <div className="space-y-8">
              <div className="bg-white border border-[#1B3B2B]/15 rounded-sm p-6 sm:p-8">
                <h2 className="font-display text-lg font-semibold text-[#1B3B2B] mb-4">
                  Product Portfolio Section Header
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#435249] mb-1">Kicker</label>
                    <input
                      type="text"
                      value={content.sectionHeaders.productKicker}
                      onChange={(e) =>
                        onChangeContent({
                          ...content,
                          sectionHeaders: {
                            ...content.sectionHeaders,
                            productKicker: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#435249] mb-1">Heading</label>
                    <input
                      type="text"
                      value={content.sectionHeaders.productHeading}
                      onChange={(e) =>
                        onChangeContent({
                          ...content,
                          sectionHeaders: {
                            ...content.sectionHeaders,
                            productHeading: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#435249] mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={content.sectionHeaders.productSubtitle}
                      onChange={(e) =>
                        onChangeContent({
                          ...content,
                          sectionHeaders: {
                            ...content.sectionHeaders,
                            productSubtitle: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                    />
                  </div>
                </div>
              </div>

              {activeProduct && (
                <div
                  ref={productEditorRef}
                  className={`scroll-mt-6 bg-white border rounded-sm p-6 sm:p-8 transition-shadow ${
                    highlightedEditor === 'product'
                      ? 'border-[#C87D55] ring-2 ring-[#C87D55]/40'
                      : 'border-[#1B3B2B]/15'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[#1B3B2B]/10">
                    <div>
                      <h2 className="font-display text-xl font-semibold text-[#1B3B2B]">
                        Edit Product: {activeProduct.name}
                      </h2>
                      <p className="text-xs text-[#6B7970]">
                        Modify export specifications, container capacity, FOB pricing, and media.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddProduct}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#FAF9F6] bg-[#1B3B2B] hover:bg-[#132A1E] rounded-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Add Product</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-[#435249] mb-1.5">
                            Product Name
                          </label>
                          <input
                            ref={productNameInputRef}
                            type="text"
                            value={activeProduct.name}
                            onChange={(e) =>
                              onChangeContent({
                                ...content,
                                products: content.products.map((p) =>
                                  p.id === activeProduct.id ? { ...p, name: e.target.value } : p,
                                ),
                              })
                            }
                            className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#435249] mb-1.5">
                            Category
                          </label>
                          <select
                            value={activeProduct.category}
                            onChange={(e) =>
                              onChangeContent({
                                ...content,
                                products: content.products.map((p) =>
                                  p.id === activeProduct.id
                                    ? {
                                        ...p,
                                        category: e.target.value as ProductItem['category'],
                                      }
                                    : p,
                                ),
                              })
                            }
                            className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm bg-white"
                          >
                            <option value="Fruiting Veg">Fruiting Veg</option>
                            <option value="Root & Tuber">Root &amp; Tuber</option>
                            <option value="Ready-to-Eat">Ready-to-Eat</option>
                            <option value="Culinary Ingredients">Culinary Ingredients</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-[#435249] mb-1.5">
                            Indicative FOB Price
                          </label>
                          <input
                            type="text"
                            value={activeProduct.fobEstimate}
                            onChange={(e) =>
                              onChangeContent({
                                ...content,
                                products: content.products.map((p) =>
                                  p.id === activeProduct.id
                                    ? { ...p, fobEstimate: e.target.value }
                                    : p,
                                ),
                              })
                            }
                            className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#435249] mb-1.5">
                            Harvest Seasonality
                          </label>
                          <input
                            type="text"
                            value={activeProduct.seasonality}
                            onChange={(e) =>
                              onChangeContent({
                                ...content,
                                products: content.products.map((p) =>
                                  p.id === activeProduct.id
                                    ? { ...p, seasonality: e.target.value }
                                    : p,
                                ),
                              })
                            }
                            className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#435249] mb-1.5">
                          Card Summary
                        </label>
                        <textarea
                          rows={2}
                          value={activeProduct.shortDescription}
                          onChange={(e) =>
                            onChangeContent({
                              ...content,
                              products: content.products.map((p) =>
                                p.id === activeProduct.id
                                  ? { ...p, shortDescription: e.target.value }
                                  : p,
                              ),
                            })
                          }
                          className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#435249] mb-1.5">
                          Detailed Export Description
                        </label>
                        <textarea
                          rows={3}
                          value={activeProduct.fullDescription}
                          onChange={(e) =>
                            onChangeContent({
                              ...content,
                              products: content.products.map((p) =>
                                p.id === activeProduct.id
                                  ? { ...p, fullDescription: e.target.value }
                                  : p,
                              ),
                            })
                          }
                          className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                        />
                      </div>

                      {/* Export Specifications Sub-grid */}
                      <div className="pt-2">
                        <p className="text-xs font-semibold text-[#1B3B2B] mb-3">
                          Export Specification Table Fields
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {(
                            [
                              ['dimensions', 'Dimensions'],
                              ['materials', 'Materials'],
                              ['color', 'Color'],
                              ['style', 'Style'],
                              ['capacity', 'Capacity'],
                              ['weight', 'Unit Weight'],
                              ['origin', 'Origin'],
                              ['grade', 'Export Grade'],
                            ] as const
                          ).map(([key, label]) => (
                            <div key={key}>
                              <label className="block text-[11px] font-medium text-[#526058] mb-1">
                                {label}
                              </label>
                              <input
                                type="text"
                                value={activeProduct.specs[key]}
                                onChange={(e) =>
                                  onChangeContent({
                                    ...content,
                                    products: content.products.map((p) =>
                                      p.id === activeProduct.id
                                        ? {
                                            ...p,
                                            specs: { ...p.specs, [key]: e.target.value },
                                          }
                                        : p,
                                    ),
                                  })
                                }
                                className="w-full px-2.5 py-1.5 text-xs border border-[#1B3B2B]/20 rounded-sm"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-5">
                      <AdminImageField
                        label="Product Photograph"
                        value={activeProduct.image}
                        defaultUrl={
                          DEFAULT_SITE_CONTENT.products.find((d) => d.id === activeProduct.id)
                            ?.image ?? DEFAULT_SITE_CONTENT.products[0].image
                        }
                        aspectClass="aspect-square"
                        onChange={(image) =>
                          onChangeContent({
                            ...content,
                            products: content.products.map((p) =>
                              p.id === activeProduct.id ? { ...p, image } : p,
                            ),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Product List Table matching bottom section of uploaded screenshot */}
              <div className="bg-white border border-[#1B3B2B]/15 rounded-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#1B3B2B]/12 bg-[#F3F0EA] flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold text-[#1B3B2B]">
                    All Export Products ({content.products.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="text-xs font-semibold text-[#1B3B2B] hover:text-[#C87D55] cursor-pointer"
                  >
                    + New SKU
                  </button>
                </div>
                <ul className="divide-y divide-[#1B3B2B]/10">
                  {content.products.map((product, idx) => {
                    const isSelected = product.id === activeProduct?.id;
                    return (
                    <li
                      key={product.id}
                      className={`px-6 py-4 flex flex-wrap items-center justify-between gap-4 transition-colors ${
                        isSelected
                          ? 'bg-[#FAF9F6] border-l-4 border-l-[#C87D55]'
                          : 'bg-white border-l-4 border-l-transparent'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => selectProductForEdit(product.id)}
                        className="flex items-center gap-4 text-left flex-1 min-w-[220px] cursor-pointer"
                      >
                        <div className="w-12 h-12 aspect-square rounded-sm overflow-hidden bg-[#F3F0EA] border border-[#1B3B2B]/15 shrink-0">
                          <ResilientImage
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-[#1B3B2B] truncate">
                              {product.name}
                            </p>
                            {isSelected && (
                              <span className="text-[11px] font-medium text-[#C87D55] shrink-0">
                                Editing Now
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#6B7970] truncate tabular-nums">
                            {product.category} · {product.specs.origin} · {product.fobEstimate}
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            onChangeContent({
                              ...content,
                              products: reorderItem(content.products, idx, -1),
                            })
                          }
                          disabled={idx === 0}
                          aria-label="Move product up"
                          className="p-2 text-[#526058] hover:text-[#1B3B2B] disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onChangeContent({
                              ...content,
                              products: reorderItem(content.products, idx, 1),
                            })
                          }
                          disabled={idx === content.products.length - 1}
                          aria-label="Move product down"
                          className="p-2 text-[#526058] hover:text-[#1B3B2B] disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateProduct(product)}
                          aria-label={`Duplicate ${product.name}`}
                          className="p-2 text-[#526058] hover:text-[#1B3B2B] cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => selectProductForEdit(product.id)}
                          className={`px-3.5 py-1.5 text-xs font-medium rounded-sm cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#1B3B2B] text-[#FAF9F6] hover:bg-[#132A1E]'
                              : 'text-[#1B3B2B] bg-[#F3F0EA] hover:bg-[#1B3B2B] hover:text-[#FAF9F6]'
                          }`}
                        >
                          Edit
                        </button>
                        {content.products.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = content.products.filter((p) => p.id !== product.id);
                              onChangeContent({ ...content, products: next });
                              if (selectedProductId === product.id && next[0]) {
                                setSelectedProductId(next[0].id);
                              }
                            }}
                            aria-label={`Delete ${product.name}`}
                            className="p-2 text-[#6B7970] hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 6: OUR NEWS */}
          {activeTab === 'news' && (
            <div className="space-y-8">
              <div className="bg-white border border-[#1B3B2B]/15 rounded-sm p-6 sm:p-8">
                <h2 className="font-display text-lg font-semibold text-[#1B3B2B] mb-4">
                  News Section Header
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#435249] mb-1">Kicker</label>
                    <input
                      type="text"
                      value={content.sectionHeaders.newsKicker}
                      onChange={(e) =>
                        onChangeContent({
                          ...content,
                          sectionHeaders: {
                            ...content.sectionHeaders,
                            newsKicker: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#435249] mb-1">Heading</label>
                    <input
                      type="text"
                      value={content.sectionHeaders.newsHeading}
                      onChange={(e) =>
                        onChangeContent({
                          ...content,
                          sectionHeaders: {
                            ...content.sectionHeaders,
                            newsHeading: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#435249] mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={content.sectionHeaders.newsSubtitle}
                      onChange={(e) =>
                        onChangeContent({
                          ...content,
                          sectionHeaders: {
                            ...content.sectionHeaders,
                            newsSubtitle: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                    />
                  </div>
                </div>
              </div>

              {activeArticle && (
                <div
                  ref={articleEditorRef}
                  className={`scroll-mt-6 bg-white border rounded-sm p-6 sm:p-8 transition-shadow ${
                    highlightedEditor === 'article'
                      ? 'border-[#C87D55] ring-2 ring-[#C87D55]/40'
                      : 'border-[#1B3B2B]/15'
                  }`}
                >
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1B3B2B]/10">
                    <h2 className="font-display text-xl font-semibold text-[#1B3B2B]">
                      Edit Trade Brief
                    </h2>
                    <button
                      type="button"
                      onClick={handleAddArticle}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#FAF9F6] bg-[#1B3B2B] hover:bg-[#132A1E] rounded-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Add Dispatch</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7 space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-[#435249] mb-1.5">
                          Article Title
                        </label>
                        <input
                          type="text"
                          value={activeArticle.title}
                          onChange={(e) =>
                            onChangeContent({
                              ...content,
                              news: content.news.map((n) =>
                                n.id === activeArticle.id ? { ...n, title: e.target.value } : n,
                              ),
                            })
                          }
                          className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#435249] mb-1">
                            Category
                          </label>
                          <input
                            type="text"
                            value={activeArticle.category}
                            onChange={(e) =>
                              onChangeContent({
                                ...content,
                                news: content.news.map((n) =>
                                  n.id === activeArticle.id
                                    ? { ...n, category: e.target.value }
                                    : n,
                                ),
                              })
                            }
                            className="w-full px-3 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#435249] mb-1">
                            Published Date
                          </label>
                          <input
                            type="text"
                            value={activeArticle.publishedAt}
                            onChange={(e) =>
                              onChangeContent({
                                ...content,
                                news: content.news.map((n) =>
                                  n.id === activeArticle.id
                                    ? { ...n, publishedAt: e.target.value }
                                    : n,
                                ),
                              })
                            }
                            className="w-full px-3 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#435249] mb-1">
                            Read Time
                          </label>
                          <input
                            type="text"
                            value={activeArticle.readTime}
                            onChange={(e) =>
                              onChangeContent({
                                ...content,
                                news: content.news.map((n) =>
                                  n.id === activeArticle.id
                                    ? { ...n, readTime: e.target.value }
                                    : n,
                                ),
                              })
                            }
                            className="w-full px-3 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#435249] mb-1.5">
                          Card Excerpt
                        </label>
                        <textarea
                          rows={2}
                          value={activeArticle.excerpt}
                          onChange={(e) =>
                            onChangeContent({
                              ...content,
                              news: content.news.map((n) =>
                                n.id === activeArticle.id ? { ...n, excerpt: e.target.value } : n,
                              ),
                            })
                          }
                          className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#435249] mb-1.5">
                          Article Body (paragraphs separated by blank line)
                        </label>
                        <textarea
                          rows={6}
                          value={activeArticle.body.join('\n\n')}
                          onChange={(e) =>
                            onChangeContent({
                              ...content,
                              news: content.news.map((n) =>
                                n.id === activeArticle.id
                                  ? {
                                      ...n,
                                      body: e.target.value.split(/\n\s*\n/).filter(Boolean),
                                    }
                                  : n,
                              ),
                            })
                          }
                          className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-5">
                      <AdminImageField
                        label="Article Cover Image"
                        value={activeArticle.image}
                        defaultUrl={DEFAULT_SITE_CONTENT.news[0].image}
                        onChange={(image) =>
                          onChangeContent({
                            ...content,
                            news: content.news.map((n) =>
                              n.id === activeArticle.id ? { ...n, image } : n,
                            ),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white border border-[#1B3B2B]/15 rounded-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#1B3B2B]/12 bg-[#F3F0EA]">
                  <h3 className="font-display text-base font-semibold text-[#1B3B2B]">
                    Published Dispatches ({content.news.length})
                  </h3>
                </div>
                <ul className="divide-y divide-[#1B3B2B]/10">
                  {content.news.map((article, idx) => (
                    <li
                      key={article.id}
                      className={`px-6 py-4 flex flex-wrap items-center justify-between gap-4 ${
                        article.id === activeArticle?.id ? 'bg-[#FAF9F6]' : 'bg-white'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedArticleId(article.id)}
                        className="flex items-center gap-4 text-left flex-1 min-w-[220px] cursor-pointer"
                      >
                        <div className="w-16 aspect-[16/10] rounded-sm overflow-hidden bg-[#F3F0EA] border border-[#1B3B2B]/15 shrink-0">
                          <ResilientImage
                            src={article.image}
                            alt={article.title}
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1B3B2B] truncate">
                            {article.title}
                          </p>
                          <p className="text-xs text-[#6B7970]">
                            {article.category} · {article.publishedAt}
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            onChangeContent({
                              ...content,
                              news: reorderItem(content.news, idx, -1),
                            })
                          }
                          disabled={idx === 0}
                          aria-label="Move article up"
                          className="p-2 text-[#526058] hover:text-[#1B3B2B] disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onChangeContent({
                              ...content,
                              news: reorderItem(content.news, idx, 1),
                            })
                          }
                          disabled={idx === content.news.length - 1}
                          aria-label="Move article down"
                          className="p-2 text-[#526058] hover:text-[#1B3B2B] disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedArticleId(article.id);
                            focusEditorCard('article', articleEditorRef);
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-sm cursor-pointer transition-colors ${
                            article.id === activeArticle?.id
                              ? 'bg-[#1B3B2B] text-[#FAF9F6]'
                              : 'text-[#1B3B2B] bg-[#F3F0EA] hover:bg-[#E8E3DA]'
                          }`}
                        >
                          Edit
                        </button>
                        {content.news.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = content.news.filter((n) => n.id !== article.id);
                              onChangeContent({ ...content, news: next });
                              if (selectedArticleId === article.id && next[0]) {
                                setSelectedArticleId(next[0].id);
                              }
                            }}
                            aria-label="Delete article"
                            className="p-2 text-[#6B7970] hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 7: TEAM MEMBERS */}
          {activeTab === 'team' && (
            <div className="space-y-8">
              <div className="bg-white border border-[#1B3B2B]/15 rounded-sm p-6 sm:p-8">
                <h2 className="font-display text-lg font-semibold text-[#1B3B2B] mb-4">
                  Leadership Section Header
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#435249] mb-1">Kicker</label>
                    <input
                      type="text"
                      value={content.sectionHeaders.teamKicker}
                      onChange={(e) =>
                        onChangeContent({
                          ...content,
                          sectionHeaders: {
                            ...content.sectionHeaders,
                            teamKicker: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#435249] mb-1">Heading</label>
                    <input
                      type="text"
                      value={content.sectionHeaders.teamHeading}
                      onChange={(e) =>
                        onChangeContent({
                          ...content,
                          sectionHeaders: {
                            ...content.sectionHeaders,
                            teamHeading: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#435249] mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={content.sectionHeaders.teamSubtitle}
                      onChange={(e) =>
                        onChangeContent({
                          ...content,
                          sectionHeaders: {
                            ...content.sectionHeaders,
                            teamSubtitle: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                    />
                  </div>
                </div>
              </div>

              {activeMember && (
                <div
                  ref={memberEditorRef}
                  className={`scroll-mt-6 bg-white border rounded-sm p-6 sm:p-8 transition-shadow ${
                    highlightedEditor === 'member'
                      ? 'border-[#C87D55] ring-2 ring-[#C87D55]/40'
                      : 'border-[#1B3B2B]/15'
                  }`}
                >
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1B3B2B]/10">
                    <h2 className="font-display text-xl font-semibold text-[#1B3B2B]">
                      Edit Leadership Profile
                    </h2>
                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#FAF9F6] bg-[#1B3B2B] hover:bg-[#132A1E] rounded-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Add Member</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7 space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-[#435249] mb-1.5">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={activeMember.name}
                          onChange={(e) =>
                            onChangeContent({
                              ...content,
                              team: content.team.map((m) =>
                                m.id === activeMember.id ? { ...m, name: e.target.value } : m,
                              ),
                            })
                          }
                          className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#435249] mb-1.5">
                          Role / Title
                        </label>
                        <input
                          type="text"
                          value={activeMember.role}
                          onChange={(e) =>
                            onChangeContent({
                              ...content,
                              team: content.team.map((m) =>
                                m.id === activeMember.id ? { ...m, role: e.target.value } : m,
                              ),
                            })
                          }
                          className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#435249] mb-1.5">
                          Biography
                        </label>
                        <textarea
                          rows={4}
                          value={activeMember.bio}
                          onChange={(e) =>
                            onChangeContent({
                              ...content,
                              team: content.team.map((m) =>
                                m.id === activeMember.id ? { ...m, bio: e.target.value } : m,
                              ),
                            })
                          }
                          className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-5">
                      <AdminImageField
                        label="Portrait Photograph"
                        value={activeMember.image}
                        defaultUrl={DEFAULT_SITE_CONTENT.team[0].image}
                        aspectClass="aspect-[3/4] max-w-xs"
                        onChange={(image) =>
                          onChangeContent({
                            ...content,
                            team: content.team.map((m) =>
                              m.id === activeMember.id ? { ...m, image } : m,
                            ),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white border border-[#1B3B2B]/15 rounded-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#1B3B2B]/12 bg-[#F3F0EA]">
                  <h3 className="font-display text-base font-semibold text-[#1B3B2B]">
                    Team Roster ({content.team.length})
                  </h3>
                </div>
                <ul className="divide-y divide-[#1B3B2B]/10">
                  {content.team.map((member, idx) => (
                    <li
                      key={member.id}
                      className={`px-6 py-4 flex flex-wrap items-center justify-between gap-4 ${
                        member.id === activeMember?.id ? 'bg-[#FAF9F6]' : 'bg-white'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedMemberId(member.id)}
                        className="flex items-center gap-4 text-left flex-1 min-w-[200px] cursor-pointer"
                      >
                        <div className="w-11 aspect-[3/4] rounded-sm overflow-hidden bg-[#F3F0EA] border border-[#1B3B2B]/15 shrink-0">
                          <ResilientImage
                            src={member.image}
                            alt={member.name}
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1B3B2B]">{member.name}</p>
                          <p className="text-xs text-[#6B7970]">{member.role}</p>
                        </div>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            onChangeContent({
                              ...content,
                              team: reorderItem(content.team, idx, -1),
                            })
                          }
                          disabled={idx === 0}
                          aria-label="Move member up"
                          className="p-2 text-[#526058] hover:text-[#1B3B2B] disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onChangeContent({
                              ...content,
                              team: reorderItem(content.team, idx, 1),
                            })
                          }
                          disabled={idx === content.team.length - 1}
                          aria-label="Move member down"
                          className="p-2 text-[#526058] hover:text-[#1B3B2B] disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMemberId(member.id);
                            focusEditorCard('member', memberEditorRef);
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-sm cursor-pointer transition-colors ${
                            member.id === activeMember?.id
                              ? 'bg-[#1B3B2B] text-[#FAF9F6]'
                              : 'text-[#1B3B2B] bg-[#F3F0EA] hover:bg-[#E8E3DA]'
                          }`}
                        >
                          Edit
                        </button>
                        {content.team.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = content.team.filter((m) => m.id !== member.id);
                              onChangeContent({ ...content, team: next });
                              if (selectedMemberId === member.id && next[0]) {
                                setSelectedMemberId(next[0].id);
                              }
                            }}
                            aria-label="Delete member"
                            className="p-2 text-[#6B7970] hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 8: CONTACT & FOOTER */}
          {activeTab === 'footer' && (
            <div className="bg-white border border-[#1B3B2B]/15 rounded-sm p-6 sm:p-8 space-y-6">
              <h2 className="font-display text-xl font-semibold text-[#1B3B2B]">
                Contact Details &amp; Footer Directory
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-[#435249] mb-1.5">
                    Headquarters Street Address
                  </label>
                  <input
                    type="text"
                    value={content.footer.address}
                    onChange={(e) =>
                      onChangeContent({
                        ...content,
                        footer: { ...content.footer, address: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#435249] mb-1.5">
                    Export Desk Telephone
                  </label>
                  <input
                    type="text"
                    value={content.footer.phone}
                    onChange={(e) =>
                      onChangeContent({
                        ...content,
                        footer: { ...content.footer, phone: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#435249] mb-1.5">
                    Export Inquiry Email
                  </label>
                  <input
                    type="email"
                    value={content.footer.email}
                    onChange={(e) =>
                      onChangeContent({
                        ...content,
                        footer: { ...content.footer, email: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-[#435249] mb-1.5">
                    Export Desk Summary
                  </label>
                  <textarea
                    rows={3}
                    value={content.footer.deskSummary}
                    onChange={(e) =>
                      onChangeContent({
                        ...content,
                        footer: { ...content.footer, deskSummary: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#435249] mb-1.5">
                    Facebook URL
                  </label>
                  <input
                    type="text"
                    value={content.footer.facebookUrl}
                    onChange={(e) =>
                      onChangeContent({
                        ...content,
                        footer: { ...content.footer, facebookUrl: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#435249] mb-1.5">
                    Instagram URL
                  </label>
                  <input
                    type="text"
                    value={content.footer.instagramUrl}
                    onChange={(e) =>
                      onChangeContent({
                        ...content,
                        footer: { ...content.footer, instagramUrl: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#435249] mb-1.5">
                    YouTube URL
                  </label>
                  <input
                    type="text"
                    value={content.footer.youtubeUrl}
                    onChange={(e) =>
                      onChangeContent({
                        ...content,
                        footer: { ...content.footer, youtubeUrl: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#435249] mb-1.5">
                    Footer Trade Corridor Tagline
                  </label>
                  <input
                    type="text"
                    value={content.footer.locationLabel}
                    onChange={(e) =>
                      onChangeContent({
                        ...content,
                        footer: { ...content.footer, locationLabel: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-[#435249] mb-1.5">
                    Copyright Notice
                  </label>
                  <input
                    type="text"
                    value={content.footer.copyrightText}
                    onChange={(e) =>
                      onChangeContent({
                        ...content,
                        footer: { ...content.footer, copyrightText: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                  />
                </div>
              </div>

              {/* Floating WhatsApp Admin Settings */}
              <div className="pt-6 border-t border-[#1B3B2B]/12">
                <h3 className="font-display text-lg font-semibold text-[#1B3B2B] mb-1">
                  Floating WhatsApp Admin Button
                </h3>
                <p className="text-xs text-[#526058] mb-5">
                  Configure the floating WhatsApp contact button and custom Minsora icon shown at the bottom right of the storefront.
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#435249] mb-1.5">
                          WhatsApp Admin Number
                        </label>
                        <input
                          type="text"
                          value={content.footer.whatsappNumber ?? content.footer.phone}
                          onChange={(e) =>
                            onChangeContent({
                              ...content,
                              footer: { ...content.footer, whatsappNumber: e.target.value },
                            })
                          }
                          placeholder="+62 812 3456 78"
                          className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#435249] mb-1.5">
                          Button Label
                        </label>
                        <input
                          type="text"
                          value={content.footer.whatsappLabel ?? 'WhatsApp Admin'}
                          onChange={(e) =>
                            onChangeContent({
                              ...content,
                              footer: { ...content.footer, whatsappLabel: e.target.value },
                            })
                          }
                          placeholder="WhatsApp Admin"
                          className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#435249] mb-1.5">
                        Default WhatsApp Greeting Message
                      </label>
                      <textarea
                        rows={3}
                        value={
                          content.footer.whatsappMessage ??
                          'Halo Admin Minsora (Asasora Food), saya ingin menanyakan informasi produk dan penawaran ekspor.'
                        }
                        onChange={(e) =>
                          onChangeContent({
                            ...content,
                            footer: { ...content.footer, whatsappMessage: e.target.value },
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-[#1B3B2B]/20 rounded-sm"
                      />
                    </div>
                  </div>
                  <div className="lg:col-span-5">
                    <AdminImageField
                      label="Floating Button Icon (Logo Minsora)"
                      value={content.footer.whatsappIconUrl ?? MINSORA_WHATSAPP_LOGO_URL}
                      defaultUrl={MINSORA_WHATSAPP_LOGO_URL}
                      aspectClass="aspect-square"
                      fitMode="contain"
                      onChange={(whatsappIconUrl) =>
                        onChangeContent({
                          ...content,
                          footer: { ...content.footer, whatsappIconUrl },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: QUOTE INQUIRIES INBOX */}
          {activeTab === 'inquiries' && (
            <div className="bg-white border border-[#1B3B2B]/15 rounded-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-[#1B3B2B]/12 bg-[#F3F0EA] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-semibold text-[#1B3B2B]">
                    B2B Export Quote Inquiries
                  </h2>
                  <p className="text-xs text-[#526058]">
                    Requests submitted through the Request Quote drawer appear here in real time.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onExitAdmin('product-section')}
                  className="px-3.5 py-2 text-xs font-medium text-[#1B3B2B] bg-white border border-[#1B3B2B]/20 hover:bg-[#FAF9F6] rounded-sm cursor-pointer"
                >
                  Open Live Catalog
                </button>
              </div>

              {inquiries.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="font-display text-lg font-semibold text-[#1B3B2B] mb-2">
                    No quote inquiries submitted yet
                  </p>
                  <p className="text-sm text-[#526058] max-w-md mx-auto">
                    When an importer adds produce lines and submits the Export Quote Request
                    drawer on the live storefront, the proforma request will be logged here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-[#1B3B2B]/12">
                  {inquiries.map((inq) => (
                    <li key={inq.id} className="p-6 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-[#6B7970] mb-1 tabular-nums">
                            <span className="font-semibold text-[#1B3B2B]">
                              {inq.referenceCode}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{inq.submittedAt}</span>
                            <span aria-hidden="true">·</span>
                            <span>{inq.destinationPort}</span>
                          </div>
                          <h3 className="font-display text-lg font-semibold text-[#1B3B2B]">
                            {inq.companyName}
                          </h3>
                          <p className="text-xs text-[#526058]">{inq.email}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={inq.status}
                            aria-label={`Status for ${inq.referenceCode}`}
                            onChange={(e) =>
                              onUpdateInquiryStatus(
                                inq.id,
                                e.target.value as QuoteInquiry['status'],
                              )
                            }
                            className="px-3 py-1.5 text-xs font-medium border border-[#1B3B2B]/20 rounded-sm bg-[#FAF9F6] text-[#1B3B2B]"
                          >
                            <option value="Pending">Pending Review</option>
                            <option value="Quoted">Proforma Sent</option>
                            <option value="Archived">Archived</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => onDeleteInquiry(inq.id)}
                            aria-label={`Delete inquiry ${inq.referenceCode}`}
                            className="p-2 text-[#6B7970] hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {inq.items.length > 0 && (
                        <div className="bg-[#FAF9F6] border border-[#1B3B2B]/10 rounded-sm p-3 text-xs text-[#435249] space-y-1">
                          {inq.items.map((item) => (
                            <div
                              key={item.productId}
                              className="flex items-center justify-between tabular-nums"
                            >
                              <span className="font-medium text-[#1B3B2B]">
                                {item.productName}
                              </span>
                              <span>
                                {item.containers} x 40ft HC ({item.fobEstimate})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {inq.notes && (
                        <p className="text-xs text-[#526058] italic">Notes: {inq.notes}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* TAB 10: SECURITY (2FA), BACKUP & RESTORE */}
          {activeTab === 'settings' && (
            <div className="space-y-8">
              {/* Two-Factor Authentication Card */}
              <div className="bg-white border border-[#1B3B2B]/15 rounded-sm p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-[#C87D55] mb-1">
                      <KeyRound className="w-4 h-4" aria-hidden="true" />
                      <span>Account Protection</span>
                    </div>
                    <h2 className="font-display text-xl font-semibold text-[#1B3B2B]">
                      Two-Factor Authentication (2FA)
                    </h2>
                    <p className="text-xs sm:text-sm text-[#526058] mt-1 max-w-2xl">
                      Require a time-based 6-digit code from Google Authenticator, Authy, or 1Password when signing in to Admin Panel.
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-sm border ${
                      twoFactorStatus?.enabled
                        ? 'bg-[#F3F0EA] text-[#1B3B2B] border-[#1B3B2B]/25'
                        : 'bg-amber-50 text-amber-900 border-amber-200'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {twoFactorStatus?.enabled ? '2FA Enabled' : '2FA Not Enabled'}
                    </span>
                  </span>
                </div>

                {securityError && (
                  <div
                    role="alert"
                    className="px-4 py-2.5 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-sm"
                  >
                    {securityError}
                  </div>
                )}

                {recoveryCodes && (
                  <div className="p-5 bg-[#FAF9F6] border border-[#C87D55]/50 rounded-sm space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[#1B3B2B]">
                        Save Your One-Time Recovery Codes (Shown Once)
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(recoveryCodes.join('\n'));
                          showToast('Recovery codes copied to clipboard.');
                        }}
                        className="text-xs font-medium text-[#C87D55] hover:text-[#1B3B2B] cursor-pointer"
                      >
                        Copy Codes
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {recoveryCodes.map((code) => (
                        <code
                          key={code}
                          className="px-3 py-1.5 text-xs font-mono text-center bg-white border border-[#1B3B2B]/15 rounded-sm text-[#1B3B2B]"
                        >
                          {code}
                        </code>
                      ))}
                    </div>
                  </div>
                )}

                {!twoFactorStatus?.enabled && !twoFactorSetup && (
                  <div>
                    <button
                      type="button"
                      disabled={securityBusy}
                      onClick={handleStartSetup2FA}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-[#FAF9F6] bg-[#1B3B2B] hover:bg-[#132A1E] disabled:opacity-60 rounded-sm cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                      <span>{securityBusy ? 'Preparing QR...' : 'Enable Two-Factor Authentication'}</span>
                    </button>
                  </div>
                )}

                {twoFactorSetup && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-5 bg-[#FAF9F6] border border-[#1B3B2B]/15 rounded-sm">
                    <div className="md:col-span-4 flex flex-col items-center">
                      <div className="w-44 aspect-square rounded-sm overflow-hidden bg-white border border-[#1B3B2B]/15 p-2 flex items-center justify-center">
                        <img
                          src={twoFactorSetup.qrDataUrl}
                          alt="2FA Authenticator QR Code"
                          className="w-full h-full object-contain object-center"
                        />
                      </div>
                      <p className="text-[11px] text-[#526058] mt-2 text-center">
                        Scan with Google Authenticator or Authy
                      </p>
                    </div>
                    <div className="md:col-span-8 space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-[#1B3B2B] mb-1">
                          Manual Setup Key
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-[#1B3B2B]/15 rounded-sm break-all text-[#1B3B2B]">
                            {twoFactorSetup.manualSecret}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(twoFactorSetup.manualSecret);
                              showToast('Secret key copied.');
                            }}
                            className="px-3 py-2 text-xs font-medium text-[#1B3B2B] bg-white border border-[#1B3B2B]/20 hover:bg-[#F3F0EA] rounded-sm cursor-pointer"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="setup-2fa-code"
                          className="block text-xs font-medium text-[#435249] mb-1.5"
                        >
                          Enter 6-Digit Code from App to Activate
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            id="setup-2fa-code"
                            type="text"
                            inputMode="numeric"
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value)}
                            placeholder="123456"
                            className="w-40 px-3 py-2 text-sm font-mono tracking-widest text-center bg-white border border-[#1B3B2B]/20 rounded-sm"
                          />
                          <button
                            type="button"
                            disabled={securityBusy}
                            onClick={handleConfirmEnable2FA}
                            className="px-4 py-2 text-xs font-medium text-[#FAF9F6] bg-[#1B3B2B] hover:bg-[#132A1E] disabled:opacity-60 rounded-sm cursor-pointer"
                          >
                            Verify &amp; Activate 2FA
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTwoFactorSetup(null);
                              setTwoFactorCode('');
                              setSecurityError('');
                            }}
                            className="px-3 py-2 text-xs text-[#526058] hover:text-[#1B3B2B] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {twoFactorStatus?.enabled && (
                  <div className="pt-2 border-t border-[#1B3B2B]/10 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#526058]">
                      <span>
                        Remaining one-time recovery codes:{' '}
                        <strong className="text-[#1B3B2B] tabular-nums">
                          {twoFactorStatus.remainingRecoveryCodes}
                        </strong>
                      </span>
                      {!showDisable2FAForm && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowDisable2FAForm(true);
                            setSecurityError('');
                          }}
                          className="text-xs font-medium text-red-800 hover:underline cursor-pointer"
                        >
                          Disable Two-Factor Authentication
                        </button>
                      )}
                    </div>

                    {showDisable2FAForm && (
                      <div className="p-4 bg-red-50/50 border border-red-200 rounded-sm space-y-3">
                        <p className="text-xs font-semibold text-red-900">
                          Confirm Password &amp; Current 2FA Code to Disable
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="password"
                            value={disablePassword}
                            onChange={(e) => setDisablePassword(e.target.value)}
                            placeholder="Admin password"
                            aria-label="Admin password"
                            className="px-3 py-2 text-xs bg-white border border-red-200 rounded-sm"
                          />
                          <input
                            type="text"
                            value={disableCode}
                            onChange={(e) => setDisableCode(e.target.value)}
                            placeholder="6-digit code or recovery code"
                            aria-label="2FA code"
                            className="px-3 py-2 text-xs font-mono bg-white border border-red-200 rounded-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={securityBusy}
                            onClick={handleConfirmDisable2FA}
                            className="px-4 py-2 text-xs font-medium text-white bg-red-700 hover:bg-red-800 disabled:opacity-60 rounded-sm cursor-pointer"
                          >
                            Confirm Disable 2FA
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowDisable2FAForm(false);
                              setDisablePassword('');
                              setDisableCode('');
                              setSecurityError('');
                            }}
                            className="px-3 py-2 text-xs text-[#1B3B2B] bg-white border border-[#1B3B2B]/20 rounded-sm cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Server Backup & Restore Card */}
              <div className="bg-white border border-[#1B3B2B]/15 rounded-sm p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-[#C87D55] mb-1">
                      <HardDrive className="w-4 h-4" aria-hidden="true" />
                      <span>Private Server Storage (SHA-256 Verified)</span>
                    </div>
                    <h2 className="font-display text-xl font-semibold text-[#1B3B2B]">
                      Server Snapshots &amp; One-Click Restore
                    </h2>
                    <p className="text-xs sm:text-sm text-[#526058] mt-1">
                      Create integrity-verified snapshots stored securely on the server, or restore any point-in-time state cleanly.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={backupsBusy}
                    onClick={() => onListBackups().then(setBackups)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#1B3B2B] bg-[#F3F0EA] hover:bg-[#E8E3DA] rounded-sm cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={backupLabel}
                    onChange={(e) => setBackupLabel(e.target.value)}
                    placeholder="Snapshot label (e.g., Pre-Launch Catalog Freeze)"
                    aria-label="Snapshot label"
                    className="flex-1 px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#1B3B2B]/20 rounded-sm"
                  />
                  <button
                    type="button"
                    disabled={backupsBusy}
                    onClick={handleCreateServerBackup}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-medium text-[#FAF9F6] bg-[#1B3B2B] hover:bg-[#132A1E] disabled:opacity-60 rounded-sm whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>{backupsBusy ? 'Working...' : 'Create Backup Snapshot'}</span>
                  </button>
                </div>

                {backups.length === 0 ? (
                  <div className="p-6 text-center bg-[#FAF9F6] border border-dashed border-[#1B3B2B]/20 rounded-sm text-xs text-[#526058]">
                    No server backup snapshots recorded yet. Create your first snapshot above before publishing changes.
                  </div>
                ) : (
                  <ul className="divide-y divide-[#1B3B2B]/12 border border-[#1B3B2B]/15 rounded-sm overflow-hidden">
                    {backups.map((bkp) => (
                      <li
                        key={bkp.id}
                        className="p-4 bg-[#FAF9F6] flex flex-wrap items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1B3B2B] truncate">
                            {bkp.label}
                          </p>
                          <p className="text-xs text-[#526058] tabular-nums mt-0.5">
                            {new Date(bkp.createdAt).toLocaleString()} &middot; {bkp.productsCount} Products &middot; {bkp.inquiriesCount} Inquiries &middot; SHA-256:{' '}
                            <span className="font-mono">{bkp.checksumSha256.slice(0, 12)}</span>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {confirmRestoreId === bkp.id ? (
                            <>
                              <button
                                type="button"
                                disabled={backupsBusy}
                                onClick={() => handleRestoreServerBackup(bkp.id)}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-[#1B3B2B] hover:bg-[#132A1E] rounded-sm cursor-pointer"
                              >
                                Confirm Restore
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmRestoreId(null)}
                                className="px-2.5 py-1.5 text-xs text-[#526058] bg-white border border-[#1B3B2B]/15 rounded-sm cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmRestoreId(bkp.id)}
                              className="px-3 py-1.5 text-xs font-medium text-[#1B3B2B] bg-white hover:bg-[#F3F0EA] border border-[#1B3B2B]/20 rounded-sm cursor-pointer"
                            >
                              Restore
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              onDownloadBackup(bkp.id).catch(() =>
                                showToast('Failed to download backup.'),
                              )
                            }
                            aria-label={`Download ${bkp.label}`}
                            className="p-2 text-[#1B3B2B] bg-white hover:bg-[#F3F0EA] border border-[#1B3B2B]/20 rounded-sm cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {confirmDeleteBackupId === bkp.id ? (
                            <button
                              type="button"
                              disabled={backupsBusy}
                              onClick={() => handleDeleteServerBackup(bkp.id)}
                              className="px-2.5 py-1.5 text-xs font-medium text-white bg-red-700 hover:bg-red-800 rounded-sm cursor-pointer"
                            >
                              Confirm Delete
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteBackupId(bkp.id)}
                              aria-label={`Delete ${bkp.label}`}
                              className="p-2 text-[#6B7970] hover:text-red-700 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Portable Export, Restore & Factory Reset */}
              <div className="bg-white border border-[#1B3B2B]/15 rounded-sm p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="font-display text-xl font-semibold text-[#1B3B2B] mb-2">
                    Portable JSON Export, Restore &amp; Factory Reset
                  </h2>
                  <p className="text-sm text-[#526058]">
                    Download a portable copy or upload a saved JSON backup for validated server-side restore.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 border border-[#1B3B2B]/15 rounded-sm bg-[#FAF9F6] flex flex-col justify-between gap-4">
                    <div>
                      <h3 className="font-display text-base font-semibold text-[#1B3B2B] mb-1">
                        Export JSON Backup
                      </h3>
                      <p className="text-xs text-[#526058]">
                        Download all headings, product specs, articles, and team bios.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportJson}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-[#FAF9F6] bg-[#1B3B2B] hover:bg-[#132A1E] rounded-sm cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Download JSON</span>
                    </button>
                  </div>

                  <div className="p-5 border border-[#1B3B2B]/15 rounded-sm bg-[#FAF9F6] flex flex-col justify-between gap-4">
                    <div>
                      <h3 className="font-display text-base font-semibold text-[#1B3B2B] mb-1">
                        Restore JSON Snapshot
                      </h3>
                      <p className="text-xs text-[#526058]">
                        Upload an Asasora Food JSON backup to validate and restore on the server.
                      </p>
                    </div>
                    <input
                      ref={jsonImportRef}
                      type="file"
                      accept="application/json,.json"
                      onChange={handleImportJson}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={backupsBusy}
                      onClick={() => jsonImportRef.current?.click()}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-[#1B3B2B] bg-white hover:bg-[#F3F0EA] border border-[#1B3B2B]/20 rounded-sm cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Upload &amp; Restore JSON</span>
                    </button>
                  </div>

                  <div className="p-5 border border-red-200 rounded-sm bg-red-50/40 flex flex-col justify-between gap-4">
                    <div>
                      <h3 className="font-display text-base font-semibold text-red-900 mb-1">
                        Reset to Factory Defaults
                      </h3>
                      <p className="text-xs text-red-800/80">
                        Automatically snapshots current state before reverting all sections to defaults.
                      </p>
                    </div>
                    {!confirmReset ? (
                      <button
                        type="button"
                        onClick={() => setConfirmReset(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-red-800 bg-white hover:bg-red-50 border border-red-300 rounded-sm cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Reset Content</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            await onResetContent();
                            setConfirmReset(false);
                            onListBackups().then(setBackups);
                            showToast('All website content reset to factory defaults.');
                          }}
                          className="flex-1 px-3 py-2 text-xs font-medium text-white bg-red-700 hover:bg-red-800 rounded-sm cursor-pointer"
                        >
                          Confirm Reset
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmReset(false)}
                          className="px-3 py-2 text-xs font-medium text-[#1B3B2B] bg-white border border-[#1B3B2B]/20 rounded-sm cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
