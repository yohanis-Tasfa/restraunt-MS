import { ArrowRight, Sparkles, Check } from 'lucide-react';

interface HeroSectionProps {
  onViewMenu?: () => void;
  onBookTable?: () => void;
  tableNumber?: string | null;
}

export default function HeroSection({ onViewMenu, onBookTable, tableNumber }: HeroSectionProps) {
  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* You can add a background image here */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div className="text-white">
            {/* Welcome badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium">Welcome to Yoni Restaurant</span>
            </div>

            {/* Main heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Great Food,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-green-400">
                Better Experience
              </span>
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-xl">
              Experience the perfect blend of traditional Ethiopian taste and modern dining. 
              Every dish tells a story of culture, passion, and authentic flavors.
            </p>

            {/* Table badge if from QR scan */}
            {tableNumber && (
              <div className="mb-6 inline-block px-6 py-3 bg-green-600 text-white rounded-lg font-semibold animate-pulse">
                🔥 Table {tableNumber} - Ready to Order!
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button
                onClick={onViewMenu}
                className="group px-8 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <span className="text-lg">🍽️ View Our Menu</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onBookTable}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span className="text-lg">📞 Book a Table</span>
              </button>
            </div>

            {/* Quick features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-semibold">Fresh Ingredients</p>
                  <p className="text-sm text-gray-400">Quality you can taste</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-semibold">Fast Service</p>
                  <p className="text-sm text-gray-400">Quick and reliable</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Image/Decoration */}
          <div className="hidden lg:block relative">
            {/* Placeholder for food image - can be replaced with actual image */}
            <div className="relative w-full h-[600px] rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 to-yellow-600/20 backdrop-blur-3xl" />
              
              {/* Floating decoration cards */}
              <div className="absolute top-10 right-10 bg-white rounded-xl p-4 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-2xl">🌿</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Fresh Ingredients</p>
                    <p className="text-sm text-gray-600">Quality You Can Taste</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-10 left-10 bg-white rounded-xl p-4 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
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
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-2">
            <div className="w-1 h-3 bg-white/50 rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
