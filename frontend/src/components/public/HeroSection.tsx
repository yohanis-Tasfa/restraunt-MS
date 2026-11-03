import { ArrowRight, UtensilsCrossed, Info } from 'lucide-react';
import banner1 from '../../assets/banner1.png';

interface HeroSectionProps {
  onViewMenu?: () => void;
  onBookTable?: () => void;
  tableNumber?: string | null;
}

export default function HeroSection({ onViewMenu, onBookTable, tableNumber }: HeroSectionProps) {
  return (
    <section id="home" className="relative min-h-[92vh] lg:min-h-screen flex items-center overflow-hidden bg-base-100 dark:bg-[#040c08] pt-24 pb-16">
      {/* ================= BACKGROUND BANNER IMAGE (VIBRANT & UNBLOCKED) ================= */}
      <div className="absolute inset-0 z-0">
        <img
          src={banner1}
          alt="Yoni Restaurant Sizzling Steak & Fine Dining"
          className="w-full h-full object-cover object-center select-none"
        />

        {/* Directional left gradient overlay: Keeps text on the left readable while leaving the steak, lamps & right side 100% bright and clear */}
        <div className="absolute inset-y-0 left-0 w-full md:w-3/5 lg:w-1/2 bg-gradient-to-r from-black/75 via-black/35 to-transparent pointer-events-none" />

        {/* Soft top gradient for navbar contrast */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />

        {/* Soft bottom edge feathering cleanly into the menu section */}
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[#f5f8f6] dark:from-[#030a07] to-transparent pointer-events-none" />

        {/* Ambient subtle glows matching the green foliage and warm dining lamps */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-[#00e676]/15 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* ================= HERO CONTENT ================= */}
      <div className="relative z-10 w-full max-w-[95%] xl:max-w-[1650px] 2xl:max-w-[1750px] mx-auto px-4 sm:px-8 lg:px-12 my-auto">
        <div className="max-w-2xl text-left space-y-6">
          {/* Top Subtitle with decorative divider bars */}
          <div className="inline-flex items-center gap-3">
            <span className="w-8 sm:w-12 h-px bg-[#00e676] shadow-[0_0_8px_#00e676]" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-[#00e676] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Welcome to Yoni Restaurant
            </span>
            <span className="w-8 sm:w-12 h-px bg-[#00e676] shadow-[0_0_8px_#00e676]" />
          </div>

          {/* Main Hero Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-black tracking-tight leading-[1.08] drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
              <span className="block text-white">Good Food.</span>
              <span className="block text-[#00e676] drop-shadow-[0_0_35px_rgba(0,230,118,0.5)]">
                Great Mood.
              </span>
            </h1>

            {/* Description */}
              <p className="text-sm sm:text-base lg:text-lg text-white/95 leading-relaxed max-w-xl font-medium drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
                Enjoy delicious Ethiopian and international dishes prepared with fresh ingredients and love.
              </p>

              {/* QR Table badge if scanned from physical table */}
              {tableNumber && (
                <div className="inline-block pt-1">
                  <div className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-[#00e676] text-[#00e676] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(0,230,118,0.3)] animate-pulse">
                    <span>🔥</span>
                    <span>Table {tableNumber} &bull; Ready to Order Live</span>
                  </div>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {/* Explore Menu button: Solid vibrant green pill */}
                <button
                  onClick={onViewMenu}
                  className="group px-8 py-4 bg-[#00e676] hover:bg-[#00c853] text-[#032314] font-bold text-sm sm:text-base rounded-full shadow-[0_4px_25px_rgba(0,230,118,0.5)] hover:shadow-[0_6px_35px_rgba(0,230,118,0.7)] hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2.5 cursor-pointer"
                >
                  <UtensilsCrossed className="w-5 h-5 text-[#032314]" />
                  <span>{tableNumber ? `Order for Table ${tableNumber}` : 'Explore Our Menu'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Learn More button: Glass outline pill */}
                <button
                  onClick={onBookTable}
                  className="px-8 py-4 bg-black/50 hover:bg-white/15 text-white font-semibold text-sm sm:text-base border border-white/40 hover:border-white/80 rounded-full backdrop-blur-md transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-xl"
                >
                  <Info className="w-4 h-4 text-white" />
                  <span>Learn More</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Slider Pagination Dots */}
              <div className="flex items-center gap-2.5 pt-4">
                <span className="w-8 h-2.5 rounded-full bg-[#00e676] shadow-[0_0_12px_#00e676]" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/40 shadow-sm" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/40 shadow-sm" />
              </div>
            </div>
        </div>
    </section>
  );
}
