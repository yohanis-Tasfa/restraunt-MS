import { Users, Utensils, Award, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Stat {
  icon: any;
  value: number;
  suffix: string;
  label: string;
  color: string;
}

export default function StatsSection() {
  const [isVisible, setIsVisible] = useState(false);

  const stats: Stat[] = [
    {
      icon: Utensils,
      value: 50,
      suffix: '+',
      label: 'Delicious Dishes',
      color: 'green',
    },
    {
      icon: Users,
      value: 10000,
      suffix: '+',
      label: 'Happy Customers',
      color: 'blue',
    },
    {
      icon: Star,
      value: 4.8,
      suffix: '',
      label: 'Average Rating',
      color: 'yellow',
    },
    {
      icon: Award,
      value: 15,
      suffix: '+',
      label: 'Years Experience',
      color: 'purple',
    },
  ];

  // Intersection observer to trigger animation when in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    const element = document.getElementById('stats-section');
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      green: { bg: 'bg-green-600', text: 'text-green-600' },
      blue: { bg: 'bg-blue-600', text: 'text-blue-600' },
      yellow: { bg: 'bg-yellow-600', text: 'text-yellow-600' },
      purple: { bg: 'bg-purple-600', text: 'text-purple-600' },
    };
    return colors[color] || colors.green;
  };

  return (
    <section 
      id="stats-section"
      className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const colors = getColorClasses(stat.color);
            const Icon = stat.icon;
            
            return (
              <div
                key={index}
                className="text-center group"
              >
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon className={`w-8 h-8 ${colors.text}`} />
                </div>

                {/* Value with animation */}
                <div className="mb-2">
                  {isVisible && (
                    <Counter 
                      end={stat.value} 
                      suffix={stat.suffix}
                      duration={2000}
                    />
                  )}
                </div>

                {/* Label */}
                <p className="text-gray-400 font-medium">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Counter animation component
function Counter({ end, suffix, duration }: { end: number; suffix: string; duration: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / duration;

      if (progress < 1) {
        setCount(Math.floor(end * progress));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return (
    <span className="text-4xl md:text-5xl font-bold text-white">
      {count.toLocaleString()}{suffix}
    </span>
  );
}
