import { ArrowRight, Sparkles } from 'lucide-react';
import bannerImage from '../../assets/banner.png';

interface HeroSectionProps {
  onViewMenu?: () => void;
  onBookTable?: () => void;
  tableNumber?: string | null;
}

export default function HeroSection({ onViewMenu, onBookTable, tableNumber }: HeroSectionProps) {
  return (
    <section id="home" className="relative h-[85vh] flex items-center overflow-hidden bg-black">
      {/* Full Background Image with Lighter Overlay */}
      <div className="absolute inset-0">
        {/* Banner background image */}
        <div className="absolute inset-0">
          <img 
            src={bannerImage} 
            alt="Traditional Ethiopian Restaurant" 
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Lighter gradient overlay to keep original colors visible */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8">
        <div className="grid lg:grid-cols-2 gap-6 items-center">
          {/* Left side - Text content with better contrast */}
          <div className="text-white">
            {/* Welcome badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-900/60 backdrop-blur-md border border-green-700/50 rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs font-semibold text-green-300">Welcome to Yoni Restaurant</span>
            </div>

            {/* Main heading with text shadow for better visibility */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 leading-tight drop-shadow-2xl">
              <span className="text-white block drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">Great Food,</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 block drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                Better
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-green-500 to-green-600 block drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                Experience
              </span>
            </h1>

            {/* Description with background for better readability */}
            <div className="bg-black/40 backdrop-blur-sm rounded-lg p-3 mb-4 inline-block">
              <p className="text-sm md:text-base text-gray-200 leading-relaxed max-w-xl">
                Experience the perfect blend of traditional Ethiopian taste and modern dining. 
                Every dish tells a story of culture, passion, and authentic flavors.
              </p>
            </div>

            {/* Table badge if from QR scan */}
            {tableNumber && (
              <div className="mb-3 inline-block">
                <div className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-semibold shadow-lg shadow-green-600/30 animate-pulse flex items-center gap-2">
                  <span className="text-lg">🔥</span>
                  <span className="text-sm">Table {tableNumber} - Ready to Order!</span>
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <button
                onClick={onViewMenu}
                className="group px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-semibold hover:shadow-xl hover:shadow-green-600/30 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:scale-105 text-sm"
              >
                <span>🍽️ View Our Menu</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onBookTable}
                className="px-5 py-2.5 bg-transparent text-white border-2 border-green-600 rounded-lg font-semibold hover:bg-green-600/20 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm text-sm"
              >
                <span>Order Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Stats Row with better contrast */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/30">
              <div className="text-center lg:text-left">
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-yellow-600/30 backdrop-blur-sm border border-yellow-600/50 flex items-center justify-center flex-shrink-0">
                    <span className="text-base">🍽️</span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white drop-shadow-lg">50+</p>
                    <p className="text-[10px] text-gray-200 drop-shadow-md">Delicious Dishes</p>
                  </div>
                </div>
              </div>

              <div className="text-center lg:text-left border-l border-r border-white/30 px-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-green-600/30 backdrop-blur-sm border border-green-600/50 flex items-center justify-center flex-shrink-0">
                    <span className="text-base">👥</span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white drop-shadow-lg">10K+</p>
                    <p className="text-[10px] text-gray-200 drop-shadow-md">Happy Customers</p>
                  </div>
                </div>
              </div>

              <div className="text-center lg:text-left">
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-yellow-600/30 backdrop-blur-sm border border-yellow-600/50 flex items-center justify-center flex-shrink-0">
                    <span className="text-base">⭐</span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white drop-shadow-lg">4.8</p>
                    <p className="text-[10px] text-gray-200 drop-shadow-md">Average Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Keep space for balance but no separate image */}
          <div className="hidden lg:block"></div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="animate-bounce">
          <div className="w-4 h-7 border-2 border-gray-400/50 rounded-full flex justify-center p-1">
            <div className="w-0.5 h-2 bg-gray-300/70 rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
