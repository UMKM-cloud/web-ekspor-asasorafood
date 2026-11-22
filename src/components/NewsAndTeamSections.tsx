import { useEffect, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { NewsArticle, SectionHeaders, TeamMember } from '../data/asasoraData';
import { ResilientImage } from './ResilientImage';

interface NewsAndTeamSectionsProps {
  news: NewsArticle[];
  team: TeamMember[];
  sectionHeaders: SectionHeaders;
}

export function NewsAndTeamSections({
  news,
  team,
  sectionHeaders,
}: NewsAndTeamSectionsProps) {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  useEffect(() => {
    if (!selectedArticle) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedArticle(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedArticle]);

  return (
    <>
      {/* OUR NEWS SECTION */}
      <section id="news" className="bg-[#F3F0EA] py-24 lg:py-28 border-b border-[#1B3B2B]/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-[#C87D55] mb-2">
                {sectionHeaders.newsKicker}
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#1B3B2B]">
                {sectionHeaders.newsHeading}
              </h2>
            </div>
            <p className="text-sm sm:text-base text-[#526058] max-w-md leading-relaxed">
              {sectionHeaders.newsSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {news.map((article) => (
              <article
                key={article.id}
                className="group bg-[#FAF9F6] rounded-sm overflow-hidden border border-[#1B3B2B]/15 flex flex-col transition-colors duration-150 hover:border-[#1B3B2B]/40"
              >
                <button
                  type="button"
                  onClick={() => setSelectedArticle(article)}
                  className="w-full border-b border-[#1B3B2B]/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1B3B2B]"
                >
                  <div className="w-full aspect-[16/10] overflow-hidden bg-[#E8E3DA]">
                    <ResilientImage
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </button>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-xs text-[#6B7970] mb-3">
                    <span>{article.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{article.publishedAt}</span>
                    <span aria-hidden="true">·</span>
                    <span>{article.readTime}</span>
                  </div>

                  <h3 className="font-display text-xl font-semibold text-[#1B3B2B] leading-snug mb-3">
                    <button
                      type="button"
                      onClick={() => setSelectedArticle(article)}
                      className="text-left hover:text-[#C87D55] transition-colors cursor-pointer focus-visible:outline-none focus-visible:underline"
                    >
                      {article.title}
                    </button>
                  </h3>

                  <p className="text-sm text-[#435249] leading-relaxed mb-6 flex-1">
                    {article.excerpt}
                  </p>

                  <button
                    type="button"
                    onClick={() => setSelectedArticle(article)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B3B2B] hover:text-[#C87D55] self-start transition-colors cursor-pointer focus-visible:outline-none focus-visible:underline"
                  >
                    <span>Read Dispatch</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* MEET OUR TEAM SECTION */}
      <section
        id="team-section"
        className="bg-[#FAF9F6] py-24 lg:py-28 border-b border-[#1B3B2B]/10"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-2xl mb-14">
            <p className="text-sm font-medium text-[#C87D55] mb-2">
              {sectionHeaders.teamKicker}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#1B3B2B] mb-4">
              {sectionHeaders.teamHeading}
            </h2>
            <p className="text-[#526058] text-base leading-relaxed">
              {sectionHeaders.teamSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-9">
            {team.map((member) => (
              <div key={member.id} className="group flex flex-col">
                <div className="w-full aspect-[3/4] rounded-sm overflow-hidden bg-[#F3F0EA] border border-[#1B3B2B]/15 mb-5">
                  <ResilientImage
                    src={member.image}
                    alt={`${member.name} — ${member.role}`}
                    className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <h3 className="font-display text-xl font-semibold text-[#1B3B2B]">
                  {member.name}
                </h3>
                <p className="text-sm font-medium text-[#C87D55] mb-2.5">{member.role}</p>
                <p className="text-sm text-[#435249] leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ARTICLE READER MODAL */}
      {selectedArticle && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="article-modal-title"
          className="fixed inset-0 z-50 bg-[#0F2319]/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedArticle(null)}
        >
          <article
            className="relative bg-[#FAF9F6] rounded-sm max-w-2xl w-full overflow-hidden border border-[#1B3B2B]/20 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedArticle(null)}
              aria-label="Close article"
              className="absolute top-3 right-3 z-10 w-10 h-10 rounded-sm bg-[#1B3B2B]/80 hover:bg-[#1B3B2B] text-[#FAF9F6] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-full aspect-[16/9] overflow-hidden bg-[#F3F0EA] border-b border-[#1B3B2B]/12">
              <ResilientImage
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div className="p-6 sm:p-8 bg-white">
              <div className="flex items-center gap-2 text-xs text-[#6B7970] mb-3">
                <span>{selectedArticle.category}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedArticle.publishedAt}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedArticle.readTime}</span>
              </div>
              <h2
                id="article-modal-title"
                className="font-display text-2xl font-semibold text-[#1B3B2B] leading-snug mb-5"
              >
                {selectedArticle.title}
              </h2>
              <div className="space-y-4 text-[#435249] text-base leading-relaxed">
                {selectedArticle.body.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>
          </article>
        </div>
      )}
    </>
  );
}
