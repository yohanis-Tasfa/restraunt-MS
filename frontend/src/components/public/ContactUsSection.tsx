import { Phone, Mail, MapPin, Clock, Send, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ContactUsSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast.success('Message sent! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', phone: '', message: '' });
      setIsSubmitting(false);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section id="contact" className="py-16 bg-black relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-96 h-96 bg-green-500 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-yellow-500 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/50 backdrop-blur-sm border border-green-700/50 rounded-full mb-4">
            <span className="text-green-400 font-semibold text-sm uppercase tracking-wider">
              Contact Us
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-2xl">
            Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-500">Touch</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto drop-shadow-md">
            Have questions or want to make a reservation? We'd love to hear from you
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="space-y-6">
            {/* Contact Cards */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-green-500/50 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-600/20 rounded-lg border border-green-600/30">
                  <Phone className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Phone</h3>
                  <p className="text-gray-400">Call us for reservations</p>
                  <a
                    href="tel:+251911123456"
                    className="text-green-400 hover:text-green-300 font-medium mt-2 inline-block"
                  >
                    +251 911 123 456
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-green-500/50 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-600/20 rounded-lg border border-green-600/30">
                  <Mail className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Email</h3>
                  <p className="text-gray-400">Send us a message</p>
                  <a
                    href="mailto:info@yonirestaurant.com"
                    className="text-green-400 hover:text-green-300 font-medium mt-2 inline-block"
                  >
                    info@yonirestaurant.com
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-green-500/50 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-600/20 rounded-lg border border-green-600/30">
                  <MapPin className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Location</h3>
                  <p className="text-gray-400">Visit our restaurant</p>
                  <p className="text-green-400 font-medium mt-2">
                    Bole Road, Addis Ababa, Ethiopia
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-green-500/50 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-600/20 rounded-lg border border-green-600/30">
                  <Clock className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Opening Hours</h3>
                  <div className="text-gray-400 space-y-1 mt-2">
                    <p>Monday - Friday: 11:00 AM - 11:00 PM</p>
                    <p>Saturday - Sunday: 10:00 AM - 12:00 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-6">Send us a Message</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="+251 911 123 456"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-12 bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 overflow-hidden">
          <div className="aspect-video rounded-lg overflow-hidden">
           <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.7283682323223!2d38.78410537478007!3d8.997123291062934!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b8502fe44f345%3A0x209cbe597069517f!2sEdna%20Mall!5e0!3m2!1sen!2set!4v1791090507035!5m2!1sen!2set" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
              title="Restaurant Location Map"
            />
          </div>
          <div className="mt-4 text-center">
            <p className="text-gray-400 text-sm">
              <MapPin className="w-4 h-4 inline-block mr-1" />
              Bole Road, Addis Ababa, Ethiopia
            </p>
            <a
              href="https://www.google.com/maps/dir//Bole+Road,+Addis+Ababa,+Ethiopia"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-2 text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
            >
              Get Directions
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
