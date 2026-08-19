import { ArrowRight, Sparkles, Truck, Utensils, Award, Smartphone, Shield, Calendar } from 'lucide-react';
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
      <div className="relative z-10 h-full flex flex-col justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8">
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

        {/* Feature Cards - Full Width at Bottom */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 lg:gap-3 mt-auto pb-4">
          {/* Feature 1 - Fast Delivery */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-lg p-2.5 border border-white/10 hover:border-green-500/50 transition-all duration-300 group">
            <div className="w-8 h-8 rounded-lg bg-green-600/20 border border-green-600/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Truck className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate drop-shadow-md">Fast Delivery</p>
              <p className="text-[10px] text-gray-300 truncate">Quick & reliable</p>
            </div>
          </div>

          {/* Feature 2 - Fresh & Tasty */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-lg p-2.5 border border-white/10 hover:border-orange-500/50 transition-all duration-300 group">
            <div className="w-8 h-8 rounded-lg bg-orange-600/20 border border-orange-600/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Utensils className="w-4 h-4 text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate drop-shadow-md">Fresh & Tasty</p>
              <p className="text-[10px] text-gray-300 truncate">Best ingredients</p>
            </div>
          </div>

          {/* Feature 3 - Top Quality */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-lg p-2.5 border border-white/10 hover:border-yellow-500/50 transition-all duration-300 group">
            <div className="w-8 h-8 rounded-lg bg-yellow-600/20 border border-yellow-600/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Award className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate drop-shadow-md">Top Quality</p>
              <p className="text-[10px] text-gray-300 truncate">Highest standards</p>
            </div>
          </div>

          {/* Feature 4 - Easy Ordering */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-lg p-2.5 border border-white/10 hover:border-blue-500/50 transition-all duration-300 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Smartphone className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate drop-shadow-md">Easy Ordering</p>
              <p className="text-[10px] text-gray-300 truncate">Just a few clicks</p>
            </div>
          </div>

          {/* Feature 5 - Secure Payment */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-lg p-2.5 border border-white/10 hover:border-purple-500/50 transition-all duration-300 group">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-600/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Shield className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate drop-shadow-md">Secure Payment</p>
              <p className="text-[10px] text-gray-300 truncate">Multiple options</p>
            </div>
          </div>

          {/* Feature 6 - Table Reservation */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-lg p-2.5 border border-white/10 hover:border-red-500/50 transition-all duration-300 group">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-600/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate drop-shadow-md">Table Reservation</p>
              <p className="text-[10px] text-gray-300 truncate">Book your table</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
