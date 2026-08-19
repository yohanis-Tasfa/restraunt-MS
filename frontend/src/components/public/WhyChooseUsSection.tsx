import { Leaf, ChefHat, Zap, DollarSign, Heart, Smartphone } from 'lucide-react';

export default function WhyChooseUsSection() {
  const features = [
    {
      icon: <Leaf className="w-8 h-8" />,
      title: 'Fresh Ingredients',
      description: 'We use only the freshest, locally-sourced ingredients to ensure authentic flavors in every dish.',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: <ChefHat className="w-8 h-8" />,
      title: 'Expert Chefs',
      description: 'Our experienced chefs bring generations of Ethiopian culinary tradition to your table.',
      color: 'from-orange-500 to-orange-600',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Fast Service',
      description: 'Enjoy quick and efficient service without compromising on quality or taste.',
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: 'Affordable Prices',
      description: 'Premium Ethiopian cuisine at prices that won\'t break your budget.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Cozy Ambiance',
      description: 'Experience warm Ethiopian hospitality in our welcoming and comfortable atmosphere.',
      color: 'from-red-500 to-red-600',
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: 'Easy Online Ordering',
      description: 'Order your favorite dishes with just a few taps on your phone.',
      color: 'from-purple-500 to-purple-600',
    },
  ];

  return (
    <section id="why-choose-us" className="py-16 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-500 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-500 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/50 backdrop-blur-sm border border-green-700/50 rounded-full mb-4">
            <span className="text-green-400 font-semibold text-sm">WHY CHOOSE US</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-500">Yoni Restaurant</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Discover what makes us the premier destination for authentic Ethiopian cuisine
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 hover:-translate-y-2 border border-gray-700/50 hover:border-green-500/50"
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
              
              {/* Icon */}
              <div className="relative mb-4">
                <div className="inline-flex p-4 rounded-xl bg-gray-700/50 backdrop-blur-sm border border-gray-600/50 text-gray-200 group-hover:scale-110 transition-all duration-300">
                  {feature.icon}
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                {feature.description}
              </p>

              {/* Decorative Element */}
              <div className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${feature.color} group-hover:w-full transition-all duration-500 rounded-b-2xl`} />
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <p className="text-gray-300 mb-6 text-lg">
            Ready to experience authentic Ethiopian cuisine?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#menu"
              className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-green-600/30 transition-all duration-300 hover:scale-105"
            >
              <span>View Our Menu</span>
              <span className="ml-2">→</span>
            </a>
            <a
              href="#contact"
              className="inline-flex items-center justify-center px-8 py-3 bg-gray-800/50 backdrop-blur-sm text-white font-semibold rounded-xl border-2 border-green-500 hover:bg-green-600/20 transition-all duration-300"
            >
              <span>📍 Find Us</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
