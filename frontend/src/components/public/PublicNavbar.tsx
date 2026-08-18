import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Phone, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import logo from '../../assets/image.png';

interface NavItem {
  label: string;
  href: string;
  section?: string; // For scroll-to-section navigation
}

interface PublicNavbarProps {
  activeSection?: string;
  onNavigate?: (section: string) => void;
}

export default function PublicNavbar({ activeSection, onNavigate }: PublicNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Detect scroll for sticky navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems: NavItem[] = [
    { label: 'Home', href: '#home', section: 'home' },
    { label: 'Menu', href: '#menu', section: 'menu' },
    { label: 'About', href: '#about', section: 'about' },
    { label: 'Gallery', href: '#gallery', section: 'gallery' },
    { label: 'Contact', href: '#contact', section: 'contact' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, section: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    
    if (onNavigate) {
      onNavigate(section);
    } else {
      // Default scroll behavior
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-black/95 backdrop-blur-md shadow-lg shadow-black/20'
          : 'bg-black/30 backdrop-blur-sm'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="Restaurant Logo" 
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div className="hidden sm:block">
              <h1 className="font-bold text-xl text-white">Yoni Restaurant</h1>
              <p className="text-xs text-gray-300">Authentic Ethiopian Cuisine</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.section}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.section!)}
                className={cn(
                  'text-sm font-medium transition-colors relative',
                  activeSection === item.section
                    ? 'text-green-400'
                    : 'text-gray-200 hover:text-green-400'
                )}
              >
                {item.label}
                {activeSection === item.section && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-green-400" />
                )}
              </a>
            ))}
          </div>

          {/* Contact Info & CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-200">
              <Phone className="w-4 h-4" />
              <span>+251 911 123 456</span>
            </div>
            <Link
              to="/admin/login"
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Staff Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-700 bg-black/95 backdrop-blur-md">
          <div className="px-4 py-4 space-y-3">
            {navItems.map((item) => (
              <a
                key={item.section}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.section!)}
                className={cn(
                  'block px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeSection === item.section
                    ? 'bg-green-600 text-white'
                    : 'text-gray-200 hover:bg-white/10'
                )}
              >
                {item.label}
              </a>
            ))}
            <div className="pt-3 border-t border-gray-700">
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-200">
                <Phone className="w-4 h-4" />
                <span>+251 911 123 456</span>
              </div>
              <Link
                to="/admin/login"
                className="block mt-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium text-center hover:bg-green-700 transition-colors"
              >
                Staff Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
