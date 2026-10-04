import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Phone, Clock, Sun, Moon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../contexts/ThemeContext';
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
  const { theme, toggleTheme } = useTheme();

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
        theme === 'dark' 
          ? 'bg-black/95 backdrop-blur-md shadow-lg shadow-black/20'
          : 'bg-white/95 backdrop-blur-md shadow-lg shadow-gray-200/50'
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
              <h1 className={cn("font-bold text-xl", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                Yoni Restaurant
              </h1>
              <p className={cn("text-xs", theme === 'dark' ? 'text-gray-300' : 'text-gray-600')}>
                Authentic Ethiopian Cuisine
              </p>
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
                    : theme === 'dark' 
                      ? 'text-gray-200 hover:text-green-400'
                      : 'text-gray-700 hover:text-green-600'
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
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={cn(
                "p-2 rounded-lg transition-all duration-300 hover:scale-110",
                theme === 'dark' 
                  ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              )}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            <Link
              to="/admin/login"
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Staff Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={cn(
                "p-2 rounded-lg transition-all duration-300",
                theme === 'dark' 
                  ? 'hover:bg-white/10 text-yellow-400'
                  : 'hover:bg-gray-200 text-gray-700'
              )}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
              )}
            >
              {isMobileMenuOpen ? (
                <X className={cn("w-6 h-6", theme === 'dark' ? 'text-white' : 'text-gray-900')} />
              ) : (
                <Menu className={cn("w-6 h-6", theme === 'dark' ? 'text-white' : 'text-gray-900')} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className={cn(
          "md:hidden border-t backdrop-blur-md",
          theme === 'dark' 
            ? 'border-gray-700 bg-black/95'
            : 'border-gray-200 bg-white/95'
        )}>
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
                    : theme === 'dark'
                      ? 'text-gray-200 hover:bg-white/10'
                      : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                {item.label}
              </a>
            ))}
            <div className={cn("pt-3 border-t", theme === 'dark' ? 'border-gray-700' : 'border-gray-200')}>
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm",
                theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
              )}>
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
