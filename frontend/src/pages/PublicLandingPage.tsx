import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';
import PublicNavbar from '../components/public/PublicNavbar';
import Footer from '../components/public/Footer';
import HeroSection from '../components/public/HeroSection';
import MenuPreviewSection from '../components/public/MenuPreviewSection';
import AboutUsSection from '../components/public/AboutUsSection';
import ContactUsSection from '../components/public/ContactUsSection';

export default function PublicLandingPage() {
  const [searchParams] = useSearchParams();
  const sectionParam = searchParams.get('section');
  const [activeSection, setActiveSection] = useState('home');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Auto-scroll to section when requested (e.g., from navbar or anchor link)
  useEffect(() => {
    const targetSection = sectionParam || (window.location.hash ? window.location.hash.replace('#', '') : null);

    if (targetSection) {
      const element = document.getElementById(targetSection);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [sectionParam]);

  // Track active section and scroll metrics
  useEffect(() => {
    const handleScroll = () => {
      // Update scroll to top visibility
      setShowScrollTop(window.scrollY > 350);

      // Update scroll progress bar
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalScroll) * 100));
        setScrollProgress(progress);
      }

      // Track active section for navbar
      const sections = ['home', 'menu', 'about', 'contact'];
      const scrollPosition = window.scrollY + 120; // Offset for navbar

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigate = (section: string) => {
    if (section === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-base-100 text-base-content dark:bg-[#040c08] dark:text-white selection:bg-[#00e676] selection:text-black overflow-x-hidden transition-colors duration-300">
      {/* Dynamic Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 z-50 h-[3px] bg-gradient-to-r from-[#00e676] via-[#69f0ae] to-[#00c853] shadow-[0_0_12px_rgba(0,230,118,0.8)] pointer-events-none transition-all duration-75 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Navigation */}
      <PublicNavbar
        activeSection={activeSection}
        onNavigate={handleNavigate}
      />

      {/* Main Content Sections */}
      <main>
        {/* Home/Hero Section */}
        <HeroSection
          onViewMenu={() => handleNavigate('menu')}
          onBookTable={() => handleNavigate('contact')}
        />

        {/* Menu Preview Section */}
        <MenuPreviewSection />

        {/* About Us Section */}
        <AboutUsSection />

        {/* Contact Section */}
        <ContactUsSection />
      </main>

      {/* Modern Floating Scroll-to-Top Button */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Scroll to top"
        title="Back to Top"
        className={`fixed bottom-6 right-6 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#042417]/95 hover:bg-[#00e676] text-[#00e676] hover:text-[#032314] border border-[#00e676]/50 shadow-2xl backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer ${
          showScrollTop
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Footer */}
      <Footer />
    </div>
  );
}
