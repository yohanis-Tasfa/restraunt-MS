import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Phone, ChefHat, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItem {
  label: string;
  href: string;
  section?: string;
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
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems: NavItem[] = [
    { label: 'Home', href: '#home', section: 'home' },
    { label: 'Menu & Ordering', href: '#menu', section: 'menu' },
    { label: 'About Us', href: '#about', section: 'about' },
    { label: 'Contact & Location', href: '#contact', section: 'contact' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, section: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    if (onNavigate) {
      onNavigate(section);
    } else {
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
          ? 'bg-[#040c08]/95 backdrop-blur-xl border-b border-[#1b3d2e] shadow-2xl py-3'
          : 'bg-gradient-to-b from-black/90 to-transparent py-4 sm:py-5 border-b border-transparent'
      )}
    >
      <div className="w-full max-w-[95%] xl:max-w-[1650px] 2xl:max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-[#00e676]/10 border border-[#00e676]/40 flex items-center justify-center text-[#00e676] shadow-[0_0_15px_rgba(0,230,118,0.3)] group-hover:shadow-[0_0_22px_rgba(0,230,118,0.5)] transition duration-200">
              <ChefHat className="w-6 h-6 text-[#00e676]" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-serif italic font-bold text-xl sm:text-2xl text-white tracking-wide">
                Yoni
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#00e676] drop-shadow-[0_0_8px_rgba(0,230,118,0.5)]">
                Restaurant
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = activeSection === item.section;
              return (
                <a
                  key={item.section}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.section!)}
                  className={cn(
                    'text-sm font-medium transition-all relative py-1 cursor-pointer',
                    isActive
                      ? 'text-[#00e676] font-semibold'
                      : 'text-gray-300 hover:text-[#00e676]'
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#00e676] rounded-full shadow-[0_0_8px_#00e676]" />
                  )}
                </a>
              );
            })}
          </div>

          {/* Actions & Staff Login */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">
              <Phone className="w-3.5 h-3.5 text-[#00e676]" />
              <span className="font-mono">+251 911 123 456</span>
            </div>

            <Link
              to="/admin/login"
              className="px-4 py-2 bg-[#00e676] hover:bg-[#00c853] text-[#032314] font-bold rounded-xl text-xs sm:text-sm shadow-[0_0_15px_rgba(0,230,118,0.3)] hover:shadow-[0_0_25px_rgba(0,230,118,0.5)] transition duration-200"
            >
              Staff Portal
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              to="/admin/login"
              className="px-3 py-1.5 bg-[#00e676] text-[#032314] font-bold rounded-lg text-xs"
            >
              Staff Login
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#1b3d2e] bg-[#040c08]/98 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-top-2 duration-150">
          <div className="px-5 py-5 space-y-3">
            {navItems.map((item) => (
              <a
                key={item.section}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.section!)}
                className={cn(
                  'block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  activeSection === item.section
                    ? 'bg-[#00e676] text-[#032314] font-bold shadow-md'
                    : 'text-gray-300 hover:bg-white/5 hover:text-[#00e676]'
                )}
              >
                {item.label}
              </a>
            ))}

            <div className="pt-3 border-t border-[#1b3d2e] flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#00e676]" />
                <span className="font-mono">+251 911 123 456</span>
              </div>
              <span className="text-[#00e676]">Bole, Addis Ababa</span>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
