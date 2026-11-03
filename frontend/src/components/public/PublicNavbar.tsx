import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../contexts/ThemeContext';

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
  const { theme, toggleTheme } = useTheme();

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
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[#042417] border-b border-[#0e442d] shadow-lg shadow-black/20',
        isScrolled
          ? 'py-3 backdrop-blur-xl bg-[#042417]/95'
          : 'py-4 sm:py-5 backdrop-blur-md bg-[#042417]/90'
      )}
    >
      <div className="w-full max-w-[95%] xl:max-w-[1650px] 2xl:max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo / Brand Name */}
          <Link to="/" className="flex flex-col leading-none group py-1">
            <span className="font-serif italic font-bold text-xl sm:text-2xl tracking-wide text-white group-hover:text-[#00e676] transition-colors">
              Yoni
            </span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#00e676] drop-shadow-[0_0_8px_rgba(0,230,118,0.5)]">
              Restaurant
            </span>
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
                      ? 'text-[#00e676] font-bold'
                      : 'text-white/90 hover:text-[#00e676]'
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
          <div className="hidden md:flex items-center gap-3">
            {/* Dark / Light Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark and light mode"
              className="px-3 py-1.5 rounded-xl border border-[#145d3e] bg-[#083a26] hover:bg-[#0c4d33] hover:border-[#00e676] text-white transition-all duration-200 cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-sm"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden xl:inline text-xs text-white">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[#00e676]" />
                  <span className="hidden xl:inline text-xs text-white">Dark</span>
                </>
              )}
            </button>

            <Link
              to="/admin/login"
              className="px-4 py-2 bg-[#00e676] hover:bg-[#00c853] text-[#032314] font-bold rounded-xl text-xs sm:text-sm shadow-[0_0_15px_rgba(0,230,118,0.3)] hover:shadow-[0_0_25px_rgba(0,230,118,0.5)] transition duration-200"
            >
              Staff Portal
            </Link>
          </div>

          {/* Mobile Menu & Theme Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl bg-[#083a26] border border-[#145d3e] text-white hover:bg-[#0c4d33] transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[#00e676]" />
              )}
            </button>

            <Link
              to="/admin/login"
              className="px-3 py-1.5 bg-[#00e676] text-[#032314] font-bold rounded-lg text-xs"
            >
              Staff
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-[#083a26] border border-[#145d3e] text-white hover:bg-[#0c4d33] transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#0e442d] bg-[#042417] backdrop-blur-2xl shadow-2xl animate-in slide-in-from-top-2 duration-150">
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
                    : 'text-white/90 hover:bg-[#083a26] hover:text-[#00e676]'
                )}
              >
                {item.label}
              </a>
            ))}

            <div className="pt-3 border-t border-[#0e442d] flex items-center justify-center text-xs text-white/70">
              <span className="text-[#00e676] font-semibold">Bole, Addis Ababa</span>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
