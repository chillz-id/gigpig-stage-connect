import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Users, Trophy, Star, MapPin, CreditCard } from 'lucide-react';
import { MagicCard } from '@/components/ui/magic-card';

interface Feature {
  id: number;
  icon: React.ElementType;
  title: string;
  description: string;
  benefits: string[];
  color: string;
  gradient: string;
}

const features: Feature[] = [
  {
    id: 1,
    icon: Calendar,
    title: 'Discover Shows',
    description: 'Find comedy events across Sydney and apply to perform at the best venues',
    benefits: ['Access to 200+ venues', 'Real-time availability', 'Instant applications'],
    color: 'text-blue-400',
    gradient: 'from-blue-500 to-purple-500'
  },
  {
    id: 2,
    icon: Users,
    title: 'Connect with Comedians',
    description: 'Network with fellow performers and build your comedy community',
    benefits: ['Professional networking', 'Collaboration opportunities', 'Peer support system'],
    color: 'text-green-400',
    gradient: 'from-green-500 to-teal-500'
  },
  {
    id: 3,
    icon: Trophy,
    title: 'Grow Your Career',
    description: 'Track your performances and build your comedy portfolio',
    benefits: ['Performance analytics', 'Portfolio building', 'Career tracking'],
    color: 'text-yellow-400',
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    id: 4,
    icon: Star,
    title: 'Get Reviews & Ratings',
    description: 'Build your reputation with authentic reviews from venue owners',
    benefits: ['Verified reviews', 'Rating system', 'Credibility building'],
    color: 'text-purple-400',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 5,
    icon: MapPin,
    title: 'Find Local Venues',
    description: 'Discover comedy venues in your area and beyond',
    benefits: ['Location-based search', 'Venue details', 'Contact information'],
    color: 'text-red-400',
    gradient: 'from-red-500 to-pink-500'
  },
  {
    id: 6,
    icon: CreditCard,
    title: 'Get Paid Securely',
    description: 'Secure payment processing for all your performances',
    benefits: ['Instant payments', 'Secure transactions', 'Payment history'],
    color: 'text-indigo-400',
    gradient: 'from-indigo-500 to-purple-500'
  }
];

const FeatureSlideshow: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Auto-advance functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % features.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + features.length) % features.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  const currentFeature = features[currentIndex];

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      {/* Main slideshow container */}
      <div
        className="relative overflow-hidden rounded-2xl"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="w-full"
          >
            <MagicCard
              className="p-8 md:p-12 bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-sm border-white/20"
              gradientFrom="#9E7AFF"
              gradientTo="#FE8BBB"
              gradientSize={300}
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Left side - Content */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${currentFeature.gradient} shadow-lg`}>
                      <currentFeature.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold text-white">
                        {currentFeature.title}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-purple-200">Feature {currentIndex + 1} of {features.length}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-lg text-purple-100 leading-relaxed">
                    {currentFeature.description}
                  </p>

                  <div className="space-y-3">
                    <h4 className="text-white font-semibold">Key Benefits:</h4>
                    <ul className="space-y-2">
                      {currentFeature.benefits.map((benefit, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center space-x-3 text-purple-100"
                        >
                          <div className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full" />
                          <span>{benefit}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right side - Visual representation */}
                <div className="relative">
                  <div className={`w-48 h-48 mx-auto rounded-full bg-gradient-to-r ${currentFeature.gradient} p-1 shadow-2xl`}>
                    <div className="w-full h-full rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <currentFeature.icon className="w-20 h-20 text-white" />
                    </div>
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-pulse" />
                  <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-pink-400 rounded-full animate-pulse" />
                </div>
              </div>
            </MagicCard>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center mt-6">
        {/* Previous/Next buttons */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevSlide}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextSlide}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Dots indicator */}
        <div className="flex space-x-2">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-white shadow-lg' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Auto-play toggle */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-purple-200">Auto</span>
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`w-8 h-4 rounded-full transition-colors ${
              isAutoPlaying ? 'bg-green-500' : 'bg-gray-500'
            }`}
          >
            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
              isAutoPlaying ? 'translate-x-4' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/20 rounded-full h-1 mt-4">
        <motion.div
          className="bg-gradient-to-r from-pink-500 to-purple-500 h-1 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / features.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
};

export default FeatureSlideshow;