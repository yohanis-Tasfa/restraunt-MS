import { Award, Heart, Users, Clock } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import restaurantImage from '../../assets/reartaunt image.png';

export default function AboutUsSection() {
  const { theme } = useTheme();
  
  return (
    <section id="about" className={`py-12 relative overflow-hidden ${
      theme === 'dark' 
        ? 'bg-gradient-to-b from-black to-gray-900' 
        : 'bg-gradient-to-b from-gray-50 to-white'
    }`}>
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-96 h-96 bg-green-500 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-yellow-500 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className={`inline-flex items-center gap-2 px-4 py-2 backdrop-blur-sm border rounded-full mb-4 ${
            theme === 'dark'
              ? 'bg-green-900/50 border-green-700/50'
              : 'bg-green-100/80 border-green-300/50'
          }`}>
            <span className={`font-semibold text-sm uppercase tracking-wider ${
              theme === 'dark' ? 'text-green-400' : 'text-green-700'
            }`}>
              About Us
            </span>
          </div>
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 drop-shadow-2xl ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Where <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-500">Tradition Meets Innovation</span>
          </h2>
          <p className={`text-lg max-w-3xl mx-auto drop-shadow-md ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            A modern culinary destination celebrating Ethiopian heritage alongside global flavors in a contemporary, world-class setting
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
          {/* Left: Image/Visual */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={restaurantImage}
                alt="Restaurant Interior"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating Stats Card */}
            <div className={`absolute -bottom-6 -right-6 backdrop-blur-md rounded-xl p-6 shadow-2xl ${
              theme === 'dark' ? 'bg-black/80' : 'bg-white/90'
            }`}>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">10+</div>
                  <div className={`text-xs uppercase ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Years
                  </div>
                </div>
                <div className={`h-12 w-px ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                }`} />
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">50K+</div>
                  <div className={`text-xs uppercase ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Happy Customers
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Story Content */}
          <div className="space-y-8">
            {/* Main Story */}
            <div>
              <h3 className={`text-2xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Ethiopian Heritage, Global Excellence
              </h3>
              <p className={`leading-relaxed mb-4 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Founded in 2014, we've redefined dining by seamlessly blending Ethiopia's rich culinary traditions 
                with contemporary international cuisine. Our restaurant embodies modern sophistication while honoring 
                the timeless flavors and communal spirit of Ethiopian culture.
              </p>
              <p className={`leading-relaxed ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                From traditional injera-based dishes to modern fusion creations and international favorites, 
                every plate reflects our commitment to quality, innovation, and cultural authenticity in a 
                sleek, upscale environment designed for today's global palate.
              </p>
            </div>

            {/* Core Values - 2x2 Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex gap-3 items-start">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-green-400" />
                  </div>
                </div>
                <div>
                  <h4 className={`font-semibold mb-1 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    World-Class Standards
                  </h4>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Modern facilities and international service excellence
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
                    <Heart className="w-5 h-5 text-red-400" />
                  </div>
                </div>
                <div>
                  <h4 className={`font-semibold mb-1 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Ethiopian & International
                  </h4>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Authentic dishes alongside global cuisine
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
                <div>
                  <h4 className={`font-semibold mb-1 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Modern Elegance
                  </h4>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Sophisticated décor and upscale atmosphere
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                </div>
                <div>
                  <h4 className={`font-semibold mb-1 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Tradition Reimagined
                  </h4>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Classic recipes with contemporary techniques
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
