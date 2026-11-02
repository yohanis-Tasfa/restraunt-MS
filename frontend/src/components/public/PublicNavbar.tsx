import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Phone, ChefHat, Sun, Moon } from 'lucide-react';
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
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-base-100/95 backdrop-blur-xl border-b border-base-300 dark:border-[#1b3d2e] shadow-lg py-3'
          : 'bg-gradient-to-b from-black/85 via-black/35 to-transparent py-4 sm:py-5 border-b border-transparent'
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
              <span className={cn(
                "font-serif italic font-bold text-xl sm:text-2xl tracking-wide transition-colors",
                isScrolled ? "text-gray-900 dark:text-white" : "text-white"
              )}>
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
                      : isScrolled
                        ? 'text-gray-700 hover:text-[#00c853] dark:text-gray-300 dark:hover:text-[#00e676]'
                        : 'text-gray-200 hover:text-[#00e676]'
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
              className={cn(
                "px-3 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-1.5 text-xs font-semibold",
                isScrolled
                  ? "bg-base-200 dark:bg-white/5 border-base-300 dark:border-white/10 text-base-content hover:border-[#00e676]"
                  : "bg-black/40 hover:bg-black/60 border-white/20 text-white hover:border-[#00e676]"
              )}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden xl:inline text-xs">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-emerald-500" />
                  <span className="hidden xl:inline text-xs">Dark</span>
                </>
              )}
            </button>

            <div className={cn(
              "hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs",
              isScrolled
                ? "bg-base-200 dark:bg-white/5 border-base-300 dark:border-white/10 text-base-content/80"
                : "bg-black/40 border-white/20 text-gray-200"
            )}>
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

          {/* Mobile Menu & Theme Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-emerald-400" />
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
              className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-[#1b3d2e] bg-white/98 dark:bg-[#040c08]/98 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-top-2 duration-150">
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
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-[#00e676]'
                )}
              >
                {item.label}
              </a>
            ))}

            <div className="pt-3 border-t border-gray-200 dark:border-[#1b3d2e] flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#00e676]" />
                <span className="font-mono">+251 911 123 456</span>
              </div>
              <span className="text-[#00e676] font-semibold">Bole, Addis Ababa</span>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
