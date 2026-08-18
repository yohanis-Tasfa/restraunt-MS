import { ArrowRight, Sparkles } from 'lucide-react';
import foodImage from '../../assets/food.png';

interface HeroSectionProps {
  onViewMenu?: () => void;
  onBookTable?: () => void;
  tableNumber?: string | null;
}

export default function HeroSection({ onViewMenu, onBookTable, tableNumber }: HeroSectionProps) {
  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden bg-black">
      {/* Full Dark Restaurant Background with Food Image */}
      <div className="absolute inset-0">
        {/* Dark restaurant atmosphere base */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-neutral-900 to-black" />
        
        {/* Food image positioned on right with natural blending */}
        <div className="absolute inset-0">
          <div className="absolute right-0 top-0 bottom-0 w-full lg:w-3/5">
            <img 
              src={foodImage} 
              alt="Traditional Ethiopian Dishes" 
              className="w-full h-full object-cover object-center"
              style={{ 
                maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0.8) 70%, rgba(0,0,0,0) 100%)',
                WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0.8) 70%, rgba(0,0,0,0) 100%)'
              }}
            />
          </div>
        </div>

        {/* Dark gradient overlay for text readability and unified feel */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-transparent" />
        
        {/* Warm restaurant lighting bokeh effects */}
        <div className="absolute top-20 right-40 w-64 h-64 bg-yellow-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-32 right-20 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" style={{ animationDelay: '1s' }} />
        <div className="absolute top-40 left-20 w-48 h-48 bg-green-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div className="text-white">
            {/* Welcome badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/40 backdrop-blur-sm border border-green-700/30 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-green-300">Welcome to Yoni Restaurant</span>
            </div>

            {/* Main heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-white block">Great Food,</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 block">
                Better
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-green-500 to-green-600 block">
                Experience
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed max-w-xl">
              Experience the perfect blend of traditional Ethiopian taste and modern dining. 
              Every dish tells a story of culture, passion, and authentic flavors.
            </p>

            {/* Table badge if from QR scan */}
            {tableNumber && (
              <div className="mb-6 inline-block">
                <div className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-semibold shadow-lg shadow-green-600/30 animate-pulse flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  <span>Table {tableNumber} - Ready to Order!</span>
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button
                onClick={onViewMenu}
                className="group px-8 py-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-green-600/30 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:scale-105"
              >
                <span className="text-lg">🍽️ View Our Menu</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onBookTable}
                className="px-8 py-4 bg-transparent text-white border-2 border-green-600 rounded-xl font-semibold hover:bg-green-600/20 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm"
              >
                <span className="text-lg">Order Now</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-700/50">
              <div className="text-center lg:text-left">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-yellow-600/20 border border-yellow-600/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🍽️</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">50+</p>
                    <p className="text-sm text-gray-400">Delicious Dishes</p>
                  </div>
                </div>
              </div>

              <div className="text-center lg:text-left border-l border-r border-gray-700/50 px-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-600/20 border border-green-600/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">10K+</p>
                    <p className="text-sm text-gray-400">Happy Customers</p>
                  </div>
                </div>
              </div>

              <div className="text-center lg:text-left">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-yellow-600/20 border border-yellow-600/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">⭐</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">4.8</p>
                    <p className="text-sm text-gray-400">Average Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Food Image with Floating Cards (visible on desktop) */}
          <div className="hidden lg:block relative h-[600px]">
            {/* Floating badge - Fresh Ingredients */}
            <div className="absolute top-10 right-10 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl shadow-black/30 animate-float z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🌿</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Fresh Ingredients</p>
                  <p className="text-sm text-gray-600">Quality You Can Taste</p>
                </div>
              </div>
            </div>

            {/* Floating badge - Rating */}
            <div className="absolute bottom-20 right-16 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl shadow-black/30 animate-float z-10" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">⭐</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">4.8 Rating</p>
                  <p className="text-sm text-gray-600">Average Customer Rating</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-500/50 rounded-full flex justify-center p-2">
            <div className="w-1 h-3 bg-gray-400/70 rounded-full" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
