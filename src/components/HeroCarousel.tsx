import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowDown } from 'lucide-react';
import { HeroSlide } from '../data/asasoraData';
import { ResilientImage } from './ResilientImage';

interface HeroCarouselProps {
  slides: HeroSlide[];
  ctaLabel: string;
  onExploreProducts: () => void;
}

export function HeroCarousel({ slides, ctaLabel, onExploreProducts }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= slides.length) {
      setActiveIndex(0);
    }
  }, [slides.length, activeIndex]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const currentSlide = slides[activeIndex] ?? slides[0];
  if (!currentSlide) return null;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <section
      id="home-section"
      aria-label="Featured export showcase"
      className="relative w-full h-[560px] sm:h-[620px] lg:h-[680px] overflow-hidden bg-[#1B3B2B] border-b border-[#1B3B2B]/15"
    >
      {/* Background slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          aria-hidden={index !== activeIndex}
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            index === activeIndex ? 'opacity-100 z-0' : 'opacity-0 -z-10 pointer-events-none'
          }`}
        >
          <ResilientImage
            src={slide.image}
            alt={slide.imageAlt}
            loading={index === 0 ? 'eager' : 'lazy'}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F2319]/88 via-[#1B3B2B]/65 to-[#1B3B2B]/30" />
        </div>
      ))}

      {/* Hero Foreground Content */}
      <div className="relative z-10 max-w-7xl mx-auto h-full px-6 lg:px-10 flex flex-col justify-center">
        <div className="max-w-2xl">
          <p className="text-sm font-medium tracking-wide text-[#E29E79] mb-4">
            {currentSlide.kicker}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold text-[#FAF9F6] leading-[1.12] tracking-tight mb-6">
            {currentSlide.title}
          </h1>
          <p className="text-base sm:text-lg text-[#FAF9F6]/85 leading-relaxed max-w-xl mb-9">
            {currentSlide.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onExploreProducts}
              className="inline-flex items-center gap-3 px-7 py-3.5 text-sm font-medium text-[#FAF9F6] bg-[#C87D55] hover:bg-[#B36B46] rounded-sm transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF9F6]"
            >
              <span>{ctaLabel}</span>
              <ArrowDown className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide Controls */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 z-20 max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5" role="tablist" aria-label="Hero slide selection">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`View slide ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF9F6] ${
                  index === activeIndex
                    ? 'w-10 bg-[#C87D55]'
                    : 'w-3 bg-[#FAF9F6]/45 hover:bg-[#FAF9F6]/75'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous slide"
              className="w-10 h-10 rounded-sm bg-[#1B3B2B]/70 hover:bg-[#1B3B2B] text-[#FAF9F6] border border-[#FAF9F6]/25 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF9F6]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next slide"
              className="w-10 h-10 rounded-sm bg-[#1B3B2B]/70 hover:bg-[#1B3B2B] text-[#FAF9F6] border border-[#FAF9F6]/25 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF9F6]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
