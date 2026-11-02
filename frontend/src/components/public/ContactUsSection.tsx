import { Phone, Mail, MapPin, Clock, Send, ChevronRight, Navigation } from 'lucide-react';
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

    setTimeout(() => {
      toast.success("Message sent! We'll get back to you soon.");
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
    <section id="contact" className="py-20 relative overflow-hidden bg-[#040c08] text-white border-t border-[#12281d]">
      {/* Decorative Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-20 left-20 w-96 h-96 bg-[#00e676]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#00e676]/10 rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 backdrop-blur-sm border border-[#00e676]/30 bg-[#00e676]/10 rounded-full mb-3">
            <span className="font-bold text-xs uppercase tracking-[0.2em] text-[#00e676]">
              Contact & Location
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-black mb-3 tracking-tight text-white drop-shadow-2xl">
            Get in <span className="text-[#00e676] drop-shadow-[0_0_25px_rgba(0,230,118,0.45)]">Touch</span>
          </h2>
          <p className="text-sm sm:text-base max-w-xl mx-auto text-gray-300 leading-relaxed">
            Have questions or want to make a reservation? Visit our dining hall or reach out anytime.
          </p>
        </div>

        {/* 4 Sleek Info Cards in a standard grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Phone */}
          <div className="rounded-2xl p-4 bg-[#091712]/90 border border-[#1b3d2e] hover:border-[#00e676]/50 transition flex items-center gap-3.5 shadow-lg">
            <div className="p-2.5 bg-[#00e676]/15 rounded-xl border border-[#00e676]/30 text-[#00e676] flex-shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider font-bold text-gray-400">Phone & Call</div>
              <a href="tel:+251911123456" className="text-sm font-semibold text-white hover:text-[#00e676] transition truncate block">
                +251 911 123 456
              </a>
            </div>
          </div>

          {/* Email */}
          <div className="rounded-2xl p-4 bg-[#091712]/90 border border-[#1b3d2e] hover:border-[#00e676]/50 transition flex items-center gap-3.5 shadow-lg">
            <div className="p-2.5 bg-[#00e676]/15 rounded-xl border border-[#00e676]/30 text-[#00e676] flex-shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider font-bold text-gray-400">Email Support</div>
              <a href="mailto:info@yonirestaurant.com" className="text-sm font-semibold text-white hover:text-[#00e676] transition truncate block">
                info@yonirestaurant.com
              </a>
            </div>
          </div>

          {/* Location */}
          <div className="rounded-2xl p-4 bg-[#091712]/90 border border-[#1b3d2e] hover:border-[#00e676]/50 transition flex items-center gap-3.5 shadow-lg">
            <div className="p-2.5 bg-[#00e676]/15 rounded-xl border border-[#00e676]/30 text-[#00e676] flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider font-bold text-gray-400">Dining Hall</div>
              <p className="text-xs font-semibold text-white truncate">
                Bole Road, Near Edna Mall
              </p>
            </div>
          </div>

          {/* Opening Hours */}
          <div className="rounded-2xl p-4 bg-[#091712]/90 border border-[#1b3d2e] hover:border-[#00e676]/50 transition flex items-center gap-3.5 shadow-lg">
            <div className="p-2.5 bg-[#00e676]/15 rounded-xl border border-[#00e676]/30 text-[#00e676] flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider font-bold text-gray-400">Service Hours</div>
              <p className="text-xs font-semibold text-white truncate">
                Daily: 11:00 AM &ndash; 11:30 PM
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Side-by-Side: Form on Left, Integrated Map on Right */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          {/* Contact Form - 6 cols */}
          <div className="lg:col-span-6 rounded-3xl p-6 sm:p-8 bg-[#091712]/90 border border-[#1b3d2e] shadow-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold mb-1.5 text-white">
                Send us a Message
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 mb-6">
                Fill out the form below and our team will get back to you shortly.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 bg-[#040c08] border border-[#1b3d2e] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00e676]/30 focus:border-[#00e676] transition text-sm"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 bg-[#040c08] border border-[#1b3d2e] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00e676]/30 focus:border-[#00e676] transition text-sm"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-[#040c08] border border-[#1b3d2e] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00e676]/30 focus:border-[#00e676] transition text-sm"
                    placeholder="+251 911 123 456"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-2.5 bg-[#040c08] border border-[#1b3d2e] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00e676]/30 focus:border-[#00e676] transition resize-none text-sm"
                    placeholder="Tell us how we can assist you..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-6 bg-[#00e676] hover:bg-[#00c853] text-[#032314] font-bold rounded-xl shadow-lg shadow-[#00e676]/25 transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#032314] border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-[#032314]" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Integrated Interactive Map - 6 cols, matching height */}
          <div className="lg:col-span-6 rounded-3xl overflow-hidden bg-[#091712]/90 border border-[#1b3d2e] shadow-2xl flex flex-col relative min-h-[420px]">
            <div className="relative flex-1 w-full h-full min-h-[340px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.7283682323223!2d38.78410537478007!3d8.997123291062934!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b8502fe44f345%3A0x209cbe597069517f!2sEdna%20Mall!5e0!3m2!1sen!2set!4v1791090507035!5m2!1sen!2set"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full min-h-[340px] filter grayscale-[25%] contrast-[1.05]"
                title="Restaurant Location Map"
              />
            </div>

            {/* Map footer strip with quick direction link */}
            <div className="p-4 bg-[#081510] border-t border-[#1b3d2e] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00e676] animate-pulse" />
                <span className="font-semibold text-white">Yoni Restaurant</span>
                <span className="text-gray-400">&bull; Bole Road, Addis Ababa</span>
              </div>
              <a
                href="https://www.google.com/maps/dir//Bole+Road,+Addis+Ababa,+Ethiopia"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00e676]/15 text-[#00e676] border border-[#00e676]/30 hover:bg-[#00e676] hover:text-[#032314] font-bold text-xs transition duration-200"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Get Directions</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
