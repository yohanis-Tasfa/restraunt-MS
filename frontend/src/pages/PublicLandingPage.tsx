import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PublicNavbar from '../components/public/PublicNavbar';
import Footer from '../components/public/Footer';
import HeroSection from '../components/public/HeroSection';
import WhyChooseUsSection from '../components/public/WhyChooseUsSection';

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
        // Delay scroll to ensure page is fully rendered
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [sectionParam]);

  // Track active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'menu', 'about', 'gallery', 'contact'];
      const scrollPosition = window.scrollY + 100; // Offset for navbar

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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <PublicNavbar 
        activeSection={activeSection} 
        onNavigate={handleNavigate}
      />

      {/* Main Content - Sections will be added in next phases */}
      <div className="pt-16"> {/* Padding for fixed navbar */}
        
        {/* Home/Hero Section */}
        <HeroSection 
          tableNumber={tableParam}
          onViewMenu={() => handleNavigate('menu')}
          onBookTable={() => handleNavigate('contact')}
        />

        {/* Why Choose Us Section - Phase 3 */}
        <WhyChooseUsSection />

        {/* About Section - Placeholder */}
        <section id="about" className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center px-4">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">About Us</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Section content will be added in Phase 3
            </p>
          </div>
        </section>

        {/* Menu Section - Placeholder */}
        <section id="menu" className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center px-4">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Menu</h2>
            {tableParam && (
              <div className="mb-6">
                <span className="inline-block px-6 py-2 bg-green-600 text-white rounded-full text-sm font-medium">
                  Table {tableParam} 🍽️
                </span>
              </div>
            )}
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Menu integration will be added in Phase 4
            </p>
          </div>
        </section>

        {/* Gallery Section - Placeholder */}
        <section id="gallery" className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center px-4">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Gallery</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Section content will be added in Phase 5
            </p>
          </div>
        </section>

        {/* Contact Section - Placeholder */}
        <section id="contact" className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center px-4">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Section content will be added in Phase 7
            </p>
          </div>
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
