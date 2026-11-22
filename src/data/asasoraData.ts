export interface HeroSlide {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  image: string;
  imageAlt: string;
}

export interface ProductSpec {
  dimensions: string;
  materials: string;
  color: string;
  style: string;
  capacity: string;
  weight: string;
  origin: string;
  grade: string;
}

export interface ProductItem {
  id: string;
  name: string;
  category: 'Fruiting Veg' | 'Root & Tuber' | 'Ready-to-Eat' | 'Culinary Ingredients';
  shortDescription: string;
  fullDescription: string;
  image: string;
  specs: ProductSpec;
  fobEstimate: string;
  seasonality: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  location: string;
  image: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  category: string;
  publishedAt: string;
  readTime: string;
  excerpt: string;
  body: string[];
  image: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
}

export interface AboutKpi {
  value: string;
  label: string;
}

export interface SiteBranding {
  brandName: string;
  logoUrl: string;
  ctaLabel: string;
}

export interface AboutContent {
  kicker: string;
  heading: string;
  paragraphs: string[];
  bannerImage: string;
  kpis: AboutKpi[];
  missionHeading: string;
  missionParagraphs: string[];
  videoEmbedUrl: string;
  videoThumbnail: string;
}

export interface FooterContent {
  address: string;
  phone: string;
  email: string;
  deskSummary: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  copyrightText: string;
  locationLabel: string;
  whatsappNumber?: string;
  whatsappLabel?: string;
  whatsappMessage?: string;
  whatsappIconUrl?: string;
}

export interface SectionHeaders {
  galleryKicker: string;
  galleryHeading: string;
  gallerySubtitle: string;
  productKicker: string;
  productHeading: string;
  productSubtitle: string;
  newsKicker: string;
  newsHeading: string;
  newsSubtitle: string;
  teamKicker: string;
  teamHeading: string;
  teamSubtitle: string;
}

export interface SiteContent {
  branding: SiteBranding;
  heroCtaLabel: string;
  heroSlides: HeroSlide[];
  about: AboutContent;
  sectionHeaders: SectionHeaders;
  gallery: GalleryItem[];
  products: ProductItem[];
  news: NewsArticle[];
  team: TeamMember[];
  footer: FooterContent;
}

export interface QuoteInquiry {
  id: string;
  referenceCode: string;
  submittedAt: string;
  companyName: string;
  email: string;
  destinationPort: string;
  notes: string;
  status: 'Pending' | 'Quoted' | 'Archived';
  items: { productId: string; productName: string; containers: number; fobEstimate: string }[];
}

export interface TwoFactorStatus {
  enabled: boolean;
  enabledAt: string | null;
  remainingRecoveryCodes: number;
}

export interface TwoFactorSetupPayload {
  setupId: string;
  qrDataUrl: string;
  manualSecret: string;
}

export interface ServerBackupSummary {
  id: string;
  createdAt: string;
  createdBy: string;
  label: string;
  checksumSha256: string;
  productsCount: number;
  inquiriesCount: number;
  sizeBytes: number;
}

export const ASASORA_LOGO_URL =
  'https://template10.webekspor.com/wp-content/uploads/2022/01/Screen-Shot-2022-01-15-at-15.15.08.png';

export const MINSORA_WHATSAPP_LOGO_URL = '/assets/aistudio/logo_minsora_0f1cbb79.jpg';

export const ABOUT_BANNER_URL =
  'https://template10.webekspor.com/wp-content/uploads/2022/01/service-middle-banner.jpeg';

export const FARM_VIDEO_EMBED_URL = 'https://www.youtube.com/embed/u681dxUPOzs?autoplay=1';

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    kicker: 'Indonesian Food & Produce Export · Est. 2017',
    title: 'Preservative-Free Culinary Ingredients & Fresh Produce',
    subtitle:
      'Asasora Food supplies commercially sterilized Indonesian culinary lines and contract-grown fresh vegetables engineered for safe, long-distance international distribution.',
    image: 'https://template10.webekspor.com/wp-content/uploads/2022/01/bg-green-1.jpeg',
    imageAlt: 'Fresh harvested Indonesian agricultural produce prepared for international export',
  },
  {
    id: 'slide-2',
    kicker: 'Export-Grade Sterilization & Cold Chain',
    title: 'Consistent Grading, Zero Artificial Preservatives, Global Reach',
    subtitle:
      'Integrated food processing, retort sterilization, and reefer logistics from Java partner facilities to Rotterdam, Hamburg, and Antwerp.',
    image:
      'https://template10.webekspor.com/wp-content/uploads/2022/01/slider12_778ed8e7-49ae-494f-b4d2-296da347b42d.jpeg',
    imageAlt: 'Sorted produce and culinary export lots staged for maritime container dispatch',
  },
];

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'gal-1',
    title: 'Packhouse Grading & Crate Sorting',
    location: 'East Java Export Facility',
    image:
      'https://template10.webekspor.com/wp-content/uploads/2022/01/markus-spiske-vyHo3nnk8G8-unsplash-1.jpg',
  },
  {
    id: 'gal-2',
    title: 'Highland Harvest Intake',
    location: 'Bandung Partner Farms',
    image:
      'https://template10.webekspor.com/wp-content/uploads/2022/01/ja-ma-gOUx23DNks-unsplash-1.jpg',
  },
  {
    id: 'gal-3',
    title: 'Washed Root & Fruiting Lots',
    location: 'Central Java Consolidation Hub',
    image:
      'https://template10.webekspor.com/wp-content/uploads/2022/01/inigo-de-la-maza-s285sDw5Ikc-unsplash-1.jpg',
  },
  {
    id: 'gal-4',
    title: 'Contract Plantation Terraces',
    location: 'High-Altitude Grower Network',
    image:
      'https://template10.webekspor.com/wp-content/uploads/2022/01/sri-lanka-KSa66AYiqnk-unsplash-1.jpg',
  },
];

export const PRODUCTS: ProductItem[] = [
  {
    id: 'cucumber',
    name: 'Cucumber',
    category: 'Fruiting Veg',
    shortDescription:
      'Hydro-cooled Indonesian green & white-skin cucumber cultivars graded for uniform length, firm flesh, and extended reefer transit stability.',
    fullDescription:
      'Cultivated across partner farms in West and East Java under residue-monitored agronomy programs. Each harvest lot is hydro-cooled within 90 minutes of picking, calibrated for diameter consistency, and packed in ventilated export crating designed for 40ft high-cube reefer airflow.',
    image:
      'https://template10.webekspor.com/wp-content/uploads/2022/01/9_408cb3a7-346d-494c-910b-d9eb148fdc73_1024x1024.jpeg',
    specs: {
      dimensions: '70cm x 68cm x 80cm',
      materials: 'Natural rattan',
      color: 'Natural',
      style: 'Box',
      capacity: '8 x 40hc',
      weight: '200g',
      origin: 'West & East Java, Indonesia',
      grade: 'Export Class I',
    },
    fobEstimate: '$1,180 / MT',
    seasonality: 'Year-round',
  },
  {
    id: 'fresh-eggplant',
    name: 'Fresh Eggplant',
    category: 'Fruiting Veg',
    shortDescription:
      'Glossy deep-purple eggplant harvested with intact green calyxes, graded for firm internal texture and minimal bruising across wholesale transit.',
    fullDescription:
      'Selected for commercial foodservice and retail wholesale buyers seeking consistent shape and creamy internal pulp. Hand-harvested at dawn to prevent field heat stress, sanitized, and packed in cushioned export cartons to eliminate skin scuffing during maritime or air freight.',
    image: 'https://template10.webekspor.com/wp-content/uploads/2022/01/23_1024x1024.jpeg',
    specs: {
      dimensions: '70cm x 68cm x 80cm',
      materials: 'Natural rattan',
      color: 'Natural',
      style: 'Box',
      capacity: '8 x 40hc',
      weight: '200g',
      origin: 'Malang, East Java',
      grade: 'Export Class I',
    },
    fobEstimate: '$1,340 / MT',
    seasonality: 'Year-round',
  },
  {
    id: 'vegetable-tomato',
    name: 'Vegetable Tomato',
    category: 'Fruiting Veg',
    shortDescription:
      'Breaker-stage highland tomatoes calibrated for controlled color maturation upon European port arrival, suited for retail and processing.',
    fullDescription:
      'Grown in volcanic upland plots in Lembang and picked at controlled breaker maturity so fruit arrives at destination ports with firm skin tension and balanced Brix acidity. Every pallet ships with full phytosanitary certification and pre-shipment lab MRL screening.',
    image:
      'https://template10.webekspor.com/wp-content/uploads/2022/01/20_f7612305-f805-4e8a-8650-d8585e026fb2_1024x1024.jpeg',
    specs: {
      dimensions: '70cm x 68cm x 80cm',
      materials: 'Natural rattan',
      color: 'Natural',
      style: 'Box',
      capacity: '8 x 40hc',
      weight: '200g',
      origin: 'Lembang Highlands, Indonesia',
      grade: 'Export Class I',
    },
    fobEstimate: '$1,420 / MT',
    seasonality: 'Year-round',
  },
  {
    id: 'fresh-carrot-natural',
    name: 'Fresh Carrot Natural',
    category: 'Root & Tuber',
    shortDescription:
      'Berastagi-type highland carrots harvested from volcanic East Java soils, hydro-washed, top-trimmed, and pre-chilled for bulk export.',
    fullDescription:
      'Our Berastagi-cultivar carrots are sourced from contract growers across East Java highlands. Each batch undergoes pressurized cold-water washing, optical defect sorting, and immediate 2°C core pre-cooling prior to container stuffing at Surabaya port.',
    image:
      'https://template10.webekspor.com/wp-content/uploads/2022/01/5_505a1bff-4f10-455b-800e-af577270d99e_1024x1024.jpeg',
    specs: {
      dimensions: '70cm x 68cm x 80cm',
      materials: 'Natural rattan',
      color: 'Natural',
      style: 'Box',
      capacity: '8 x 40hc',
      weight: '200g',
      origin: 'East Java, Indonesia',
      grade: 'Berastagi Class I',
    },
    fobEstimate: '$1,090 / MT',
    seasonality: 'Year-round',
  },
];

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'Indonesian Horticultural Exports Expand on European Retail Demand',
    category: 'Trade Brief',
    publishedAt: 'October 2026',
    readTime: '3 min read',
    excerpt:
      'Indonesia records steady export growth across specialty coffee, fresh vegetables, and tropical produce backed by modernized packhouse cold chains.',
    body: [
      'Indonesian agricultural exports continue to record steady volume expansion as European wholesale importers secure multi-quarter supply contracts for fresh vegetables, roots, and specialty coffee.',
      'Partner cooperatives across West and East Java have commissioned automated hydro-cooling and optical calibration lines, reducing farm-to-vessel turnaround times by 18 hours while maintaining full EU phytosanitary compliance.',
      'Asasora Food works directly alongside family-owned contract farms to standardize harvest windows, net-weight tolerances, and full lot traceability from field block to destination warehouse.',
    ],
    image:
      'https://template10.webekspor.com/wp-content/uploads/2022/01/inigo-de-la-maza-s285sDw5Ikc-unsplash-1.jpg',
  },
  {
    id: 'news-2',
    title: 'Regional Fresh Produce Shipments Reach $1.94 Billion in Nine Months',
    category: 'Market Report',
    publishedAt: 'September 2026',
    readTime: '4 min read',
    excerpt:
      'Fresh fruit and vegetable exports totaled $1.94 billion through Q3, with 34 percent directed toward European supermarket and foodservice buyers.',
    body: [
      'Fresh fruit and vegetable shipments reached $1.94 billion over the first nine months of the year, supported by consistent wholesale demand for greenhouse cucumbers, breaker tomatoes, and highland root crops.',
      'European buyers accounted for 34 percent of total export volume, placing strict procurement requirements on residue-tested cultivation, ventilated natural packaging, and audited food-safety documentation.',
      'By consolidating mixed-produce pallets out of Jakarta and Surabaya, Asasora Food enables importers to balance container utilization without sacrificing arrival firmness.',
    ],
    image:
      'https://template10.webekspor.com/wp-content/uploads/2022/01/markus-spiske-vyHo3nnk8G8-unsplash-1.jpg',
  },
  {
    id: 'news-3',
    title: 'Controlled-Atmosphere Sea Freight Reshapes Produce Procurement',
    category: 'Logistics Update',
    publishedAt: 'August 2026',
    readTime: '3 min read',
    excerpt:
      'Elevated air-cargo tariffs accelerate importer migration toward 40ft high-cube reefer sea freight for Asian root and fruiting vegetables.',
    body: [
      'Sustained volatility in air-freight surcharges has accelerated the transition of core vegetable export programs toward controlled-atmosphere 40ft high-cube reefer containers.',
      'When paired with rapid packhouse pre-cooling and breathable rattan and corrugated crating, sea-freighted root and fruiting crops reach European ports with shelf stability suited for retail distribution at substantially lower landed cost.',
      'Asasora Food coordinates twice-weekly reefer sailings from Tanjung Priok and Tanjung Perak, providing importers with predictable transit schedules and transparent FOB/CIF pricing.',
    ],
    image:
      'https://template10.webekspor.com/wp-content/uploads/2022/01/ja-ma-gOUx23DNks-unsplash-1.jpg',
  },
];

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'team-1',
    name: 'Nicolette Ritonni',
    role: 'Founder & Managing Director',
    bio: 'Directs international importer contracts, European phytosanitary compliance, and long-term grower partnerships since 2017.',
    image: 'https://template10.webekspor.com/wp-content/uploads/2022/01/team-img-4.jpeg',
  },
  {
    id: 'team-2',
    name: 'Juliette Massé',
    role: 'Co-Founder & Head of European Trade',
    bio: 'Leads European wholesale distribution, customs clearance coordination, and port cold-chain arrival inspections.',
    image: 'https://template10.webekspor.com/wp-content/uploads/2022/01/team-img-3.jpeg',
  },
  {
    id: 'team-3',
    name: 'Yeung Ngai',
    role: 'Co-Founder & Director of Operations',
    bio: 'Oversees highland agronomy standards, packhouse grading lines, and container loading across East and West Java.',
    image: 'https://template10.webekspor.com/wp-content/uploads/2022/01/team-img-1.jpeg',
  },
];

export const DEFAULT_SITE_CONTENT: SiteContent = {
  branding: {
    brandName: 'Asasora Food',
    logoUrl: ASASORA_LOGO_URL,
    ctaLabel: 'Request Quote',
  },
  heroCtaLabel: 'Inspect Export Catalog',
  heroSlides: HERO_SLIDES,
  about: {
    kicker: '01. About Our Export Operations',
    heading: 'Preservative-Free Food Processing & Fresh Produce Export',
    paragraphs: [
      'Since 2017, Asasora Food has operated integrated agricultural export and commercial food-processing corridors from Indonesia to European wholesale and retail importers.',
      'Our facilities pair contract-grown fresh produce with commercially sterilized ready-to-eat meals and culinary ingredients—crafted with zero artificial preservatives and hermetically sealed for extended maritime transit stability.',
      'Every container dispatch is backed by calibrated net-weight verification, phytosanitary clearance, and traceable highland grower lots under transparent FOB/CIF supply agreements.',
    ],
    bannerImage: ABOUT_BANNER_URL,
    kpis: [
      { value: 'Since 2017', label: 'Indonesia–EU Corridor' },
      { value: 'Zero', label: 'Artificial Preservatives' },
      { value: '40ft HC', label: 'Export Standardization' },
    ],
    missionHeading: 'Year-Round Contract Continuity & Food Safety Discipline',
    missionParagraphs: [
      'Our procurement mandate centers on supplying wholesale partners with consistent quality at competitive landed cost. We protect supply continuity across seasonal transitions through multi-altitude grower agreements across Java.',
      'All fruits, fruiting vegetables, and root crops originate exclusively from audited family-owned farms and certified regional cooperatives adhering to strict MRL testing, cold-storage hygiene, and calibrated tare documentation.',
    ],
    videoEmbedUrl: FARM_VIDEO_EMBED_URL,
    videoThumbnail: GALLERY_ITEMS[0].image,
  },
  sectionHeaders: {
    galleryKicker: '02. Field & Packhouse Documentation',
    galleryHeading: 'Fresh Product From Our Gallery',
    gallerySubtitle:
      'Visual inspection of our East Java grading floors, highland harvest lots, and ventilated export crating lines.',
    productKicker: '03. Export Product Portfolio',
    productHeading: 'Discover Product Specifications',
    productSubtitle:
      'Review standard export carton dimensions, 40ft high-cube reefer load capacities, and FOB indications for our primary Indonesian horticultural lines.',
    newsKicker: '04. Market Intelligence',
    newsHeading: 'Trade Briefs & Export Dispatches',
    newsSubtitle:
      'Updates on Indonesian horticultural output, reefer freight schedules, and European import demand.',
    teamKicker: '05. Export Leadership',
    teamHeading: 'Accountable Leadership Across Origin & Destination',
    teamSubtitle:
      'Direct commercial oversight spanning Indonesian agronomy procurement, port customs compliance, and European wholesale client relations.',
  },
  gallery: GALLERY_ITEMS,
  products: PRODUCTS,
  news: NEWS_ARTICLES,
  team: TEAM_MEMBERS,
  footer: {
    address: 'Jl. Indonesia Raya, Sudirman, Jakarta Selatan, DKI Jakarta, Indonesia, 10150',
    phone: '+62 812 3456 78',
    email: 'export@asasorafood.com',
    deskSummary:
      'Operating direct agricultural trade lanes between Indonesian partner farms and European wholesale receivers since 2017.',
    facebookUrl: '#contact-section',
    instagramUrl: '#contact-section',
    youtubeUrl: '#contact-section',
    copyrightText: 'Copyright © 2026 Asasora Food Export. All Rights Reserved.',
    locationLabel: 'Jakarta Headquarters · European Import Distribution',
    whatsappNumber: '+62 812 3456 78',
    whatsappLabel: 'WhatsApp Admin',
    whatsappMessage:
      'Halo Admin Minsora (Asasora Food), saya ingin menanyakan informasi produk dan penawaran ekspor.',
    whatsappIconUrl: MINSORA_WHATSAPP_LOGO_URL,
  },
};

const SITE_STORAGE_KEY = 'asasora_site_content_v1';
const INQUIRIES_STORAGE_KEY = 'asasora_quote_inquiries_v1';

export function loadSiteContent(): SiteContent {
  try {
    const raw = window.localStorage.getItem(SITE_STORAGE_KEY);
    if (!raw) return DEFAULT_SITE_CONTENT;
    const parsed = JSON.parse(raw) as Partial<SiteContent>;
    return {
      ...DEFAULT_SITE_CONTENT,
      ...parsed,
      branding: { ...DEFAULT_SITE_CONTENT.branding, ...parsed.branding },
      about: { ...DEFAULT_SITE_CONTENT.about, ...parsed.about },
      sectionHeaders: { ...DEFAULT_SITE_CONTENT.sectionHeaders, ...parsed.sectionHeaders },
      footer: { ...DEFAULT_SITE_CONTENT.footer, ...parsed.footer },
      heroSlides: parsed.heroSlides?.length ? parsed.heroSlides : DEFAULT_SITE_CONTENT.heroSlides,
      gallery: parsed.gallery?.length ? parsed.gallery : DEFAULT_SITE_CONTENT.gallery,
      products: parsed.products?.length ? parsed.products : DEFAULT_SITE_CONTENT.products,
      news: parsed.news?.length ? parsed.news : DEFAULT_SITE_CONTENT.news,
      team: parsed.team?.length ? parsed.team : DEFAULT_SITE_CONTENT.team,
    };
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
}

export function saveSiteContent(content: SiteContent): void {
  try {
    window.localStorage.setItem(SITE_STORAGE_KEY, JSON.stringify(content));
  } catch {
    // Ignore storage quota errors
  }
}

export function resetSiteContent(): SiteContent {
  try {
    window.localStorage.removeItem(SITE_STORAGE_KEY);
  } catch {
    // Ignore
  }
  return DEFAULT_SITE_CONTENT;
}

export function loadInquiries(): QuoteInquiry[] {
  try {
    const raw = window.localStorage.getItem(INQUIRIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QuoteInquiry[]) : [];
  } catch {
    return [];
  }
}

export function saveInquiries(inquiries: QuoteInquiry[]): void {
  try {
    window.localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(inquiries));
  } catch {
    // Ignore
  }
}
