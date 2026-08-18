import { Truck, Utensils, Award, Shield, Clock, Phone } from 'lucide-react';

interface Feature {
  icon: any;
  title: string;
  description: string;
  color: string;
}

export default function FeaturesSection() {
  const features: Feature[] = [
    {
      icon: Truck,
      title: 'Fast Delivery',
      description: 'Quick and reliable delivery at your doorstep within minutes.',
      color: 'green',
    },
    {
      icon: Utensils,
      title: 'Fresh & Tasty',
      description: 'Made with the freshest ingredients for the best taste experience.',
      color: 'yellow',
    },
    {
      icon: Award,
      title: 'Top Quality',
      description: 'We maintain the highest standards of quality in every dish.',
      color: 'blue',
    },
    {
      icon: Shield,
      title: 'Secure Payment',
      description: 'Multiple secure payment options for your convenience.',
      color: 'purple',
    },
    {
      icon: Phone,
      title: 'Easy Ordering',
      description: 'Order your favorite food in just a few clicks.',
      color: 'red',
    },
    {
      icon: Clock,
      title: 'Table Reservation',
      description: 'Book your table and enjoy a wonderful dining experience.',
      color: 'orange',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string; border: string }> = {
      green: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-200' },
      yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600', border: 'border-yellow-200' },
      blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200' },
      purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-200' },
      red: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-200' },
      orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-200' },
    };
    return colors[color] || colors.green;
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-green-100 text-green-600 rounded-full text-sm font-semibold mb-4">
            WHY CHOOSE US
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            What Makes Us Special
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We pride ourselves on delivering exceptional dining experiences with quality, 
            service, and authentic flavors that keep our customers coming back.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const colors = getColorClasses(feature.color);
            const Icon = feature.icon;
            
            return (
              <div
                key={index}
                className="group p-6 rounded-2xl border-2 border-gray-100 hover:border-green-200 hover:shadow-xl transition-all duration-300 bg-white"
              >
                {/* Icon */}
                <div className={`w-16 h-16 rounded-xl ${colors.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-8 h-8 ${colors.icon}`} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
