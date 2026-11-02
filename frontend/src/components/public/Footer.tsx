import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, ChefHat, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-base-200 text-base-content border-t border-base-300 dark:bg-[#020704] dark:text-gray-300 dark:border-[#12281d] relative overflow-hidden transition-colors duration-300">
      {/* Subtle Ambient Emerald Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-[#00e676]/5 blur-[120px] pointer-events-none" />

        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pt-16 sm:pt-20 pb-12 relative z-10">
          {/* Main 4-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 xl:gap-12 pb-16 border-b border-base-300 dark:border-[#1b3d2e]/80">
              {/* Column 1: Brand Story (4 cols) */}
                <div className="lg:col-span-4 xl:col-span-4 space-y-5">
                  <Link to="/" className="inline-flex items-center gap-3.5 group">
                    <div className="w-12 h-12 rounded-2xl bg-[#00e676]/10 border border-[#00e676]/40 flex items-center justify-center text-[#00c853] dark:text-[#00e676] shadow-[0_0_20px_rgba(0,230,118,0.2)] group-hover:shadow-[0_0_28px_rgba(0,230,118,0.4)] transition duration-200">
                      <ChefHat className="w-7 h-7 text-[#00c853] dark:text-[#00e676]" />
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="font-serif italic font-black text-2xl sm:text-3xl text-base-content tracking-wide">
                        Yoni
                      </span>
                      <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#00c853] dark:text-[#00e676] drop-shadow-[0_0_8px_rgba(0,230,118,0.4)]">
                        Restaurant
                      </span>
                    </div>
                  </Link>

                    <p className="text-sm sm:text-base text-base-content/75 leading-relaxed font-normal max-w-md">
                      Experience the rich flavors of traditional Ethiopian heritage and contemporary global cuisine, crafted with fresh local ingredients and authentic passion.
                    </p>

                    {/* Social Icons */}
                    <div className="pt-2">
                      <p className="text-xs uppercase tracking-wider font-bold text-base-content/60 mb-3">
                        Connect With Us
                      </p>
                      <div className="flex items-center gap-3">
                        {/* Facebook */}
                        <a
                          href="https://facebook.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Facebook"
                          className="w-10 h-10 rounded-xl bg-base-100 border border-base-300 dark:bg-[#091712] dark:border-[#1b3d2e] flex items-center justify-center text-base-content hover:text-[#032314] hover:bg-[#00e676] hover:border-[#00e676] hover:shadow-[0_0_15px_rgba(0,230,118,0.4)] transition-all duration-200"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        </a>

                        {/* Instagram */}
                        <a
                          href="https://instagram.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Instagram"
                          className="w-10 h-10 rounded-xl bg-base-100 border border-base-300 dark:bg-[#091712] dark:border-[#1b3d2e] flex items-center justify-center text-base-content hover:text-[#032314] hover:bg-[#00e676] hover:border-[#00e676] hover:shadow-[0_0_15px_rgba(0,230,118,0.4)] transition-all duration-200"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                          </svg>
                        </a>

                        {/* X / Twitter */}
                        <a
                          href="https://twitter.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Twitter"
                          className="w-10 h-10 rounded-xl bg-base-100 border border-base-300 dark:bg-[#091712] dark:border-[#1b3d2e] flex items-center justify-center text-base-content hover:text-[#032314] hover:bg-[#00e676] hover:border-[#00e676] hover:shadow-[0_0_15px_rgba(0,230,118,0.4)] transition-all duration-200"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        </a>
                      </div>
                    </div>
                </div>

                {/* Column 2: Quick Links (2 cols) */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="text-base sm:text-lg font-bold text-base-content tracking-wide relative inline-block pb-1.5 after:w-7 after:h-0.5 after:bg-[#00e676] after:absolute after:bottom-0 after:left-0">
                    Navigation
                  </h4>
                  <ul className="space-y-3 text-sm sm:text-base pt-2">
                    <li>
                      <a href="#home" className="text-base-content/75 hover:text-[#00c853] dark:hover:text-[#00e676] transition-colors flex items-center gap-1.5 group">
                        <span className="text-[#00e676] opacity-0 group-hover:opacity-100 transition-opacity">&rsaquo;</span>
                        <span>Home</span>
                      </a>
                    </li>
                    <li>
                      <a href="#menu" className="text-base-content/75 hover:text-[#00c853] dark:hover:text-[#00e676] transition-colors flex items-center gap-1.5 group">
                        <span className="text-[#00e676] opacity-0 group-hover:opacity-100 transition-opacity">&rsaquo;</span>
                        <span>Menu & Ordering</span>
                      </a>
                    </li>
                    <li>
                      <a href="#about" className="text-base-content/75 hover:text-[#00c853] dark:hover:text-[#00e676] transition-colors flex items-center gap-1.5 group">
                        <span className="text-[#00e676] opacity-0 group-hover:opacity-100 transition-opacity">&rsaquo;</span>
                        <span>About Us</span>
                      </a>
                    </li>
                    <li>
                      <a href="#contact" className="text-base-content/75 hover:text-[#00c853] dark:hover:text-[#00e676] transition-colors flex items-center gap-1.5 group">
                        <span className="text-[#00e676] opacity-0 group-hover:opacity-100 transition-opacity">&rsaquo;</span>
                        <span>Contact & Location</span>
                      </a>
                    </li>
                    <li className="pt-2">
                      <Link
                        to="/admin/login"
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#00e676]/10 border border-[#00e676]/40 text-[#00a844] dark:text-[#00e676] hover:bg-[#00e676] hover:text-[#032314] font-bold text-xs sm:text-sm transition duration-200 shadow-sm"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Staff Portal</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Column 3: Contact Details (3 cols) */}
                <div className="lg:col-span-3 space-y-4">
                  <h4 className="text-base sm:text-lg font-bold text-base-content tracking-wide relative inline-block pb-1.5 after:w-7 after:h-0.5 after:bg-[#00e676] after:absolute after:bottom-0 after:left-0">
                    Visit & Inquiries
                  </h4>
                  <ul className="space-y-4 pt-2">
                    <li className="flex items-start gap-3.5">
                      <div className="p-2 rounded-lg bg-[#00e676]/10 border border-[#00e676]/30 text-[#00c853] dark:text-[#00e676] flex-shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-semibold text-base-content leading-tight">
                          Bole Road, Addis Ababa
                        </p>
                        <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">
                          Near Edna Mall, Fine Dining District
                        </p>
                      </div>
                    </li>

                    <li className="flex items-start gap-3.5">
                      <div className="p-2 rounded-lg bg-[#00e676]/10 border border-[#00e676]/30 text-[#00c853] dark:text-[#00e676] flex-shrink-0 mt-0.5">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <a
                          href="tel:+251911123456"
                          className="text-sm sm:text-base font-semibold text-base-content hover:text-[#00c853] dark:hover:text-[#00e676] transition-colors leading-tight block"
                        >
                          +251 911 123 456
                        </a>
                        <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">
                          Direct line for reservations
                        </p>
                      </div>
                    </li>

                    <li className="flex items-start gap-3.5">
                      <div className="p-2 rounded-lg bg-[#00e676]/10 border border-[#00e676]/30 text-[#00c853] dark:text-[#00e676] flex-shrink-0 mt-0.5">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <a
                          href="mailto:info@yonirestaurant.com"
                          className="text-sm sm:text-base font-semibold text-base-content hover:text-[#00c853] dark:hover:text-[#00e676] transition-colors leading-tight block truncate max-w-[220px]"
                        >
                          info@yonirestaurant.com
                        </a>
                        <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">
                          Customer support & catering
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Column 4: Opening Hours & Service (3 cols) */}
                <div className="lg:col-span-3 space-y-4">
                  <h4 className="text-base sm:text-lg font-bold text-base-content tracking-wide relative inline-block pb-1.5 after:w-7 after:h-0.5 after:bg-[#00e676] after:absolute after:bottom-0 after:left-0">
                    Opening Hours
                  </h4>
                  <div className="p-4 sm:p-5 rounded-2xl bg-base-100 border border-base-300 dark:bg-[#091712]/90 dark:border-[#1b3d2e] space-y-3.5 mt-2 shadow-sm">
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-[#00c853] dark:text-[#00e676] flex-shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm">
                        <p className="font-bold text-base-content/60 uppercase tracking-wider text-[11px]">
                          Monday &ndash; Friday
                        </p>
                        <p className="text-sm sm:text-base font-bold text-base-content mt-0.5">
                          11:00 AM &ndash; 11:00 PM
                        </p>
                      </div>
                    </div>

                    <div className="h-px bg-base-300 dark:bg-[#1b3d2e]" />

                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-[#00c853] dark:text-[#00e676] flex-shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm">
                        <p className="font-bold text-base-content/60 uppercase tracking-wider text-[11px]">
                          Saturday &ndash; Sunday
                        </p>
                        <p className="text-sm sm:text-base font-bold text-[#00a844] dark:text-[#00e676] mt-0.5">
                          10:00 AM &ndash; 12:00 AM
                        </p>
                      </div>
                    </div>

                    {/* Service status pill */}
                    <div className="pt-1">
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e676]/10 border border-[#00e676]/30 text-[11px] font-bold text-[#00a844] dark:text-[#00e676]">
                        <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
                        <span>Dine-in, Takeaway & Delivery</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Bar: Copyright & Policies */}
              <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-base-content/60">
                <p>
                  &copy; {currentYear} <span className="text-base-content font-semibold">Yoni Restaurant</span>. All rights reserved.
                </p>
                <div className="flex items-center gap-6">
                  <a href="#about" className="hover:text-[#00c853] dark:hover:text-[#00e676] transition-colors">
                    Privacy Policy
                  </a>
                  <span className="text-base-content/30">&bull;</span>
                  <a href="#about" className="hover:text-[#00c853] dark:hover:text-[#00e676] transition-colors">
                    Terms of Service
                  </a>
                  <span className="text-base-content/30">&bull;</span>
                  <a href="#contact" className="hover:text-[#00c853] dark:hover:text-[#00e676] transition-colors">
                    Cookie Policy
                  </a>
                </div>
              </div>
            </div>
          </footer>
          );
}
