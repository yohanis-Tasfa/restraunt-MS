import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PublicNavbar from '../components/public/PublicNavbar';
import Footer from '../components/public/Footer';
import HeroSection from '../components/public/HeroSection';
import MenuPreviewSection from '../components/public/MenuPreviewSection';
import AboutUsSection from '../components/public/AboutUsSection';
import ContactUsSection from '../components/public/ContactUsSection';

export default function PublicLandingPage() {
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState('home');

  // Get table and section from URL params (for QR code integration)
  const tableParam = searchParams.get('table');
  const sectionParam = searchParams.get('section');

  // Auto-scroll to section when QR code is scanned
  useEffect(() => {
    if (sectionParam) {
      const element = document.getElementById(sectionParam);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [sectionParam]);

  // Track active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
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

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigate = (section: string) => {
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-base-100 text-base-content dark:bg-[#040c08] dark:text-white selection:bg-[#00e676] selection:text-black overflow-x-hidden transition-colors duration-300">
      {/* Navigation */}
      <PublicNavbar
        activeSection={activeSection}
        onNavigate={handleNavigate}
      />

      {/* Main Content Sections */}
      <main>
        {/* Home/Hero Section */}
        <HeroSection
          tableNumber={tableParam}
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

      {/* Footer */}
      <Footer />
    </div>
  );
}
