import { Award, Heart, Users, Clock } from 'lucide-react';
import restaurantImage from '../../assets/reartaunt image.png';

export default function AboutUsSection() {
  return (
    <section id="about" className="py-16 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-96 h-96 bg-green-500 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-yellow-500 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/50 backdrop-blur-sm border border-green-700/50 rounded-full mb-4">
            <span className="text-green-400 font-semibold text-sm uppercase tracking-wider">About Us</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-2xl">
            Where <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-500">Tradition Meets Innovation</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto drop-shadow-md">
            A modern culinary destination celebrating Ethiopian heritage alongside global flavors in a contemporary, world-class setting
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left: Image/Visual */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-green-500/30 shadow-2xl">
              <img
                src={restaurantImage}
                alt="Restaurant Interior"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating Stats Card */}
            <div className="absolute -bottom-6 -right-6 bg-black/80 backdrop-blur-md border border-green-500/50 rounded-xl p-6 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">10+</div>
                  <div className="text-xs text-gray-400 uppercase">Years</div>
                </div>
                <div className="h-12 w-px bg-gray-700" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">50K+</div>
                  <div className="text-xs text-gray-400 uppercase">Happy Customers</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Story Content */}
          <div className="space-y-6">
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-green-500/50 transition-all duration-300">
              <h3 className="text-2xl font-bold text-white mb-4">Ethiopian Heritage, Global Excellence</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Founded in 2014, we've redefined dining by seamlessly blending Ethiopia's rich culinary traditions 
                with contemporary international cuisine. Our restaurant embodies modern sophistication while honoring 
                the timeless flavors and communal spirit of Ethiopian culture.
              </p>
              <p className="text-gray-300 leading-relaxed">
                From traditional injera-based dishes to modern fusion creations and international favorites, 
                every plate reflects our commitment to quality, innovation, and cultural authenticity in a 
                sleek, upscale environment designed for today's global palate.
              </p>
            </div>

            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-green-500/50 transition-all duration-300">
              <h3 className="text-2xl font-bold text-white mb-4">Our Vision</h3>
              <p className="text-gray-300 leading-relaxed">
                To be the premier destination where Ethiopian culture and international cuisine converge, 
                offering a world-class dining experience that appeals to both local traditions and global tastes. 
                We celebrate diversity through food, bringing people together in a modern, welcoming space.
              </p>
            </div>
          </div>
        </div>

        {/* Core Values Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Value 1: Modern Standards */}
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-green-500/50 hover:-translate-y-2 transition-all duration-300 group">
            <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Award className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">
              World-Class Standards
            </h3>
            <p className="text-gray-400 text-sm">
              Modern facilities, premium ingredients, and international service excellence in every detail
            </p>
          </div>

          {/* Value 2: Cultural Fusion */}
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-green-500/50 hover:-translate-y-2 transition-all duration-300 group">
            <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">
              Ethiopian & International
            </h3>
            <p className="text-gray-400 text-sm">
              Authentic Ethiopian dishes alongside modern global cuisine, crafted for diverse palates
            </p>
          </div>

          {/* Value 3: Contemporary Ambiance */}
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-green-500/50 hover:-translate-y-2 transition-all duration-300 group">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">
              Modern Elegance
            </h3>
            <p className="text-gray-400 text-sm">
              Sophisticated décor, comfortable seating, and an upscale atmosphere for every occasion
            </p>
          </div>

          {/* Value 4: Innovation */}
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-green-500/50 hover:-translate-y-2 transition-all duration-300 group">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">
              Tradition Reimagined
            </h3>
            <p className="text-gray-400 text-sm">
              Classic recipes enhanced with contemporary techniques for an elevated dining experience
            </p>
          </div>
        </div>

        {/* Chef's Message */}
        <div className="mt-16 bg-gradient-to-r from-green-900/20 to-yellow-900/20 backdrop-blur-md border border-green-500/30 rounded-2xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-green-500/50 shadow-xl">
                <div className="w-full h-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center">
                  <span className="text-5xl">👨‍🍳</span>
                </div>
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <p className="text-lg md:text-xl text-gray-300 italic leading-relaxed mb-4">
                "Our restaurant bridges two worlds – the soulful richness of Ethiopian traditions and the 
                refined elegance of international cuisine. We've created a space where ancient recipes 
                meet modern techniques, where everyone from local families to global travelers feels at home. 
                This is more than a restaurant; it's a celebration of culinary diversity."
              </p>
              <div>
                <p className="text-green-400 font-bold text-lg">Chef Abebe Tadesse</p>
                <p className="text-gray-500 text-sm">Executive Chef & Co-Founder</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
