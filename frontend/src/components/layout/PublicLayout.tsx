import { ReactNode } from 'react';
import PublicNavbar from '../public/PublicNavbar';
import Footer from '../public/Footer';

interface PublicLayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
  showFooter?: boolean;
  activeSection?: string;
  onNavigate?: (section: string) => void;
}

export default function PublicLayout({ 
  children, 
  showNavbar = true, 
  showFooter = true,
  activeSection,
  onNavigate
}: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      {showNavbar && (
        <PublicNavbar activeSection={activeSection} onNavigate={onNavigate} />
      )}
      
      {/* Main content */}
      <main className="flex-1 pt-16"> {/* Padding for fixed navbar */}
        {children}
      </main>
      
      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
}
