import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import logo from '../../assets/image.png';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { theme } = useTheme();

  return (
    <footer className={theme === 'dark' ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-700'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Restaurant Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={logo} 
                alt="Restaurant Logo" 
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div>
                <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Yoni Restaurant
                </h3>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Authentic Ethiopian Cuisine
                </p>
              </div>
            </div>
            <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Experience the rich flavors of traditional Ethiopian dishes prepared with 
              fresh ingredients and authentic recipes passed down through generations.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#home" className="text-sm hover:text-green-400 transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#menu" className="text-sm hover:text-green-400 transition-colors">
                  Menu
                </a>
              </li>
              <li>
                <a href="#about" className="text-sm hover:text-green-400 transition-colors">
                  About Us
                </a>
              </li>

              <li>
                <a href="#contact" className="text-sm hover:text-green-400 transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <Link 
                  to="/admin/login" 
                  className="text-sm hover:text-green-400 transition-colors"
                >
                  Staff Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Contact Us
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p>Bole Road, Addis Ababa</p>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                    Near Edna Mall
                  </p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div className="text-sm">
                  <p>+251 911 123 456</p>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                    +251 911 789 012
                  </p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-green-400 flex-shrink-0" />
                <a 
                  href="mailto:info@yonirestaurant.com" 
                  className="text-sm hover:text-green-400 transition-colors"
                >
                  info@yonirestaurant.com
                </a>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div>
            <h4 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Opening Hours
            </h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Monday - Friday
                  </p>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                    10:00 AM - 11:00 PM
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Saturday - Sunday
                  </p>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                    9:00 AM - 12:00 AM
                  </p>
                </div>
              </li>
            </ul>
            
            {/* Social Media */}
            <div className="mt-6">
              <h5 className={`font-semibold mb-3 text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Follow Us
              </h5>
              <div className="flex items-center gap-3">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-9 h-9 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors text-sm ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                  }`}
                >
                  f
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-9 h-9 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors text-sm ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                  }`}
                >
                  📷
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-9 h-9 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors text-sm ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                  }`}
                >
                  𝕏
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`mt-12 pt-8 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              © {currentYear} Yoni Restaurant. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="hover:text-green-400 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-green-400 transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
