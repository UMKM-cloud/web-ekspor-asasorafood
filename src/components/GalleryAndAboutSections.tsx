import { useState, useEffect } from 'react';
import { Play, X, Maximize2 } from 'lucide-react';
import { AboutContent, GalleryItem, SectionHeaders } from '../data/asasoraData';
import { ResilientImage } from './ResilientImage';

interface GalleryAndAboutSectionsProps {
  about: AboutContent;
  sectionHeaders: SectionHeaders;
  gallery: GalleryItem[];
}

export function GalleryAndAboutSections({
  about,
  sectionHeaders,
  gallery,
}: GalleryAndAboutSectionsProps) {
  const [selectedGallery, setSelectedGallery] = useState<GalleryItem | null>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedGallery(null);
        setVideoModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <>
      {/* ABOUT US SECTION */}
      <section id="about-section" className="bg-[#FAF9F6] py-24 lg:py-32 border-b border-[#1B3B2B]/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-sm font-medium text-[#C87D55] mb-3">{about.kicker}</p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#1B3B2B] leading-tight mb-7">
                {about.heading}
              </h2>
              <div className="space-y-5 text-[#435249] text-base leading-relaxed max-w-xl">
                {about.paragraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>

              <div className="mt-10 pt-8 border-t border-[#1B3B2B]/12 grid grid-cols-3 gap-6 max-w-lg">
                {about.kpis.map((kpi, idx) => (
                  <div key={idx}>
                    <p className="font-display text-2xl font-semibold text-[#1B3B2B] tabular-nums">
                      {kpi.value}
                    </p>
                    <p className="text-xs text-[#5E6D64] mt-1">{kpi.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="w-full aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[480px] rounded-sm overflow-hidden border border-[#1B3B2B]/15 bg-[#F3F0EA]">
                <ResilientImage
                  src={about.bannerImage}
                  alt={about.heading}
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY SECTION */}
      <section
        id="gallery-section"
        className="bg-[#F3F0EA] py-24 lg:py-28 border-b border-[#1B3B2B]/10"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-[#C87D55] mb-2">
                {sectionHeaders.galleryKicker}
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#1B3B2B]">
                {sectionHeaders.galleryHeading}
              </h2>
            </div>
            <p className="text-sm sm:text-base text-[#526058] max-w-md leading-relaxed">
              {sectionHeaders.gallerySubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
            {gallery.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedGallery(item)}
                className="group relative w-full rounded-sm overflow-hidden bg-[#1B3B2B] border border-[#1B3B2B]/15 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B2B]"
              >
                <div className="w-full aspect-[4/3] overflow-hidden bg-[#1B3B2B]">
                  <ResilientImage
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F2319]/85 via-[#0F2319]/20 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-[#FAF9F6] leading-snug">{item.title}</p>
                    <p className="text-xs text-[#FAF9F6]/75 mt-0.5">{item.location}</p>
                  </div>
                  <Maximize2 className="w-4 h-4 text-[#FAF9F6]/80 shrink-0" aria-hidden="true" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION & FARM PROCESS VIDEO SECTION */}
      <section className="bg-[#FAF9F6] py-24 lg:py-28 border-b border-[#1B3B2B]/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-6">
              <button
                type="button"
                onClick={() => setVideoModalOpen(true)}
                className="group relative w-full rounded-sm overflow-hidden bg-[#1B3B2B] border border-[#1B3B2B]/15 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B2B]"
                aria-label="Play harvest and export process video"
              >
                <div className="w-full aspect-video overflow-hidden bg-[#1B3B2B]">
                  <ResilientImage
                    src={about.videoThumbnail}
                    alt="Asasora Food harvest and export workflow preview"
                    className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-[#0F2319]/45 group-hover:bg-[#0F2319]/35 transition-colors flex flex-col items-center justify-center">
                  <span className="w-14 h-14 rounded-full bg-[#FAF9F6] text-[#1B3B2B] border border-[#1B3B2B]/15 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                    <Play className="w-5 h-5 ml-0.5 fill-current" aria-hidden="true" />
                  </span>
                  <span className="mt-3 text-sm font-medium text-[#FAF9F6] tracking-wide">
                    View Harvest &amp; Packing Workflow
                  </span>
                </div>
              </button>
            </div>

            <div className="lg:col-span-6 space-y-5 text-[#435249] text-base leading-relaxed">
              <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[#1B3B2B]">
                {about.missionHeading}
              </h3>
              {about.missionParagraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY LIGHTBOX MODAL */}
      {selectedGallery && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedGallery.title}
          className="fixed inset-0 z-50 bg-[#0F2319]/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedGallery(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-[#FAF9F6] rounded-sm overflow-hidden border border-[#1B3B2B]/20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedGallery(null)}
              aria-label="Close gallery preview"
              className="absolute top-3 right-3 z-10 w-10 h-10 rounded-sm bg-[#1B3B2B]/80 hover:bg-[#1B3B2B] text-[#FAF9F6] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-full aspect-[4/3] overflow-hidden bg-[#F3F0EA]">
              <ResilientImage
                src={selectedGallery.image}
                alt={selectedGallery.title}
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div className="px-6 py-4 flex items-center justify-between gap-4 border-t border-[#1B3B2B]/12">
              <div>
                <h3 className="font-display text-lg font-semibold text-[#1B3B2B]">
                  {selectedGallery.title}
                </h3>
                <p className="text-sm text-[#526058]">{selectedGallery.location}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGallery(null)}
                className="px-4 py-2 text-sm font-medium text-[#1B3B2B] border border-[#1B3B2B]/20 hover:bg-[#F3F0EA] rounded-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FARM PROCESS VIDEO MODAL */}
      {videoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Asasora Food farm process video"
          className="fixed inset-0 z-50 bg-[#0F2319]/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setVideoModalOpen(false)}
        >
          <div
            className="relative max-w-4xl w-full bg-[#132A1E] rounded-sm overflow-hidden border border-[#FAF9F6]/15"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#FAF9F6]/12">
              <span className="text-sm font-medium text-[#FAF9F6]">
                Asasora Food Harvest &amp; Export Packing Workflow
              </span>
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                aria-label="Close video player"
                className="w-9 h-9 rounded-sm text-[#FAF9F6]/80 hover:text-[#FAF9F6] hover:bg-[#FAF9F6]/10 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full">
              {(() => {
                let safeVideoSrc = 'https://www.youtube.com/embed/u681dxUPOzs?autoplay=1';
                try {
                  const parsed = new URL(about.videoEmbedUrl);
                  if (
                    parsed.protocol === 'https:' &&
                    ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'].includes(
                      parsed.hostname,
                    )
                  ) {
                    safeVideoSrc = parsed.toString();
                  }
                } catch {
                  // Fallback to default embed URL
                }
                return (
                  <iframe
                    src={safeVideoSrc}
                    title="Asasora Food Harvest and Export Packing Video"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
