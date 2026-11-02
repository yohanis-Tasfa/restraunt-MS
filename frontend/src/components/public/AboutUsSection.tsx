import { Award, Heart, Users, Clock } from 'lucide-react';
import restaurantImage from '../../assets/reartaunt image.png';

export default function AboutUsSection() {
  return (
    <section id="about" className="py-20 relative overflow-hidden bg-[#030906] text-white border-t border-[#12281d]">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-20 left-20 w-96 h-96 bg-[#00e676]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#00e676]/10 rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 backdrop-blur-sm border border-[#00e676]/30 bg-[#00e676]/10 rounded-full mb-4">
            <span className="font-bold text-xs uppercase tracking-[0.2em] text-[#00e676]">
              About Us
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-black mb-4 tracking-tight text-white drop-shadow-2xl">
            Where <span className="text-[#00e676] drop-shadow-[0_0_25px_rgba(0,230,118,0.45)]">Tradition Meets Innovation</span>
          </h2>
          <p className="text-base sm:text-lg max-w-3xl mx-auto text-gray-300 leading-relaxed">
            A modern culinary destination celebrating Ethiopian heritage alongside global flavors in a contemporary, world-class setting.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
          {/* Left: Image/Visual */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-[#1b3d2e]">
              <img
                src={restaurantImage}
                alt="Restaurant Interior"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            {/* Floating Stats Card */}
            <div className="absolute -bottom-6 -right-6 backdrop-blur-xl bg-[#081510]/95 border-2 border-[#00e676]/50 rounded-2xl p-6 shadow-2xl shadow-black/80">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-[#00e676] drop-shadow-[0_0_10px_rgba(0,230,118,0.5)]">10+</div>
                  <div className="text-xs uppercase font-semibold text-gray-400 mt-0.5">
                    Years of Taste
                  </div>
                </div>
                <div className="h-10 w-px bg-[#1b3d2e]" />
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-[#00e676] drop-shadow-[0_0_10px_rgba(0,230,118,0.5)]">50K+</div>
                  <div className="text-xs uppercase font-semibold text-gray-400 mt-0.5">
                    Happy Guests
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Story Content */}
          <div className="space-y-6 lg:pl-6">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-3 text-white">
                Ethiopian Heritage, Global Excellence
              </h3>
              <p className="leading-relaxed text-gray-300 text-sm sm:text-base mb-3.5">
                Founded in 2014, we've redefined dining by seamlessly blending Ethiopia's rich culinary traditions 
                with contemporary international cuisine. Our restaurant embodies modern sophistication while honoring 
                the timeless flavors and communal spirit of Ethiopian culture.
              </p>
              <p className="leading-relaxed text-gray-300 text-sm sm:text-base">
                From traditional injera-based dishes to modern fusion creations and international favorites, 
                every plate reflects our commitment to quality, innovation, and cultural authenticity in a 
                sleek, upscale environment designed for today's global palate.
              </p>
            </div>

            {/* Core Values - 2x2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex gap-3.5 items-start bg-[#091712] border border-[#1b3d2e] rounded-2xl p-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#00e676]/15 border border-[#00e676]/30 rounded-xl flex items-center justify-center text-[#00e676]">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm mb-0.5">
                    World-Class Standards
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Modern facilities and international service excellence.
                  </p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start bg-[#091712] border border-[#1b3d2e] rounded-2xl p-4">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm mb-0.5">
                    Fresh & Authentic
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Locally sourced organic ingredients and spices.
                  </p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start bg-[#091712] border border-[#1b3d2e] rounded-2xl p-4">
                <div className="flex-shrink-0 w-10 h-10 bg-teal-500/15 border border-teal-500/30 rounded-xl flex items-center justify-center text-teal-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm mb-0.5">
                    Modern Atmosphere
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Sophisticated décor, warm lighting and ambient music.
                  </p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start bg-[#091712] border border-[#1b3d2e] rounded-2xl p-4">
                <div className="flex-shrink-0 w-10 h-10 bg-yellow-500/15 border border-yellow-500/30 rounded-xl flex items-center justify-center text-yellow-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm mb-0.5">
                    Tradition Reimagined
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Classic recipes with contemporary culinary flair.
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
