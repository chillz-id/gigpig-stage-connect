import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Star, Quote, MapPin, Calendar } from 'lucide-react';
import { MagicCard } from '@/components/ui/magic-card';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  venue: string;
  location: string;
  rating: number;
  quote: string;
  image: string;
  performanceCount: number;
  yearsActive: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Stand-up Comedian",
    venue: "The Comedy Store",
    location: "Sydney CBD",
    rating: 5,
    quote: "Stand Up Sydney transformed my comedy career. I went from performing at open mics to headlining at major venues. The platform's networking features helped me connect with amazing comedians and venues across the city.",
    image: "https://images.unsplash.com/photo-1494790108755-2616b332e234?w=150&h=150&fit=crop&crop=face",
    performanceCount: 47,
    yearsActive: 3
  },
  {
    id: 2,
    name: "Marcus Thompson",
    role: "Comedy Promoter",
    venue: "Laugh Track Comedy Club",
    location: "Newtown",
    rating: 5,
    quote: "As a venue owner, Stand Up Sydney has been invaluable. The quality of comedians we discover through the platform is exceptional. The booking system is seamless, and the community aspect brings together the best talent in Sydney.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    performanceCount: 124,
    yearsActive: 7
  },
  {
    id: 3,
    name: "Emma Rodriguez",
    role: "Rising Comedian",
    venue: "The Basement Comedy",
    location: "Circular Quay",
    rating: 5,
    quote: "I was nervous about my first few gigs, but the Stand Up Sydney community was incredibly supportive. The platform helped me find my voice and build confidence. Now I'm performing regularly and loving every minute of it!",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    performanceCount: 23,
    yearsActive: 1
  },
  {
    id: 4,
    name: "James Wilson",
    role: "Comedy Veteran",
    venue: "Enmore Theatre",
    location: "Enmore",
    rating: 5,
    quote: "After 15 years in comedy, I thought I'd seen it all. Stand Up Sydney brought fresh opportunities and connections I never expected. The platform keeps evolving with the comedy scene, and it's been brilliant for my career.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    performanceCount: 203,
    yearsActive: 15
  },
  {
    id: 5,
    name: "Lisa Park",
    role: "Venue Manager",
    venue: "The Comedy Factory",
    location: "Marrickville",
    rating: 5,
    quote: "Managing a comedy venue means finding fresh talent consistently. Stand Up Sydney makes this so much easier. The review system helps us book reliable performers, and the community aspect creates a positive environment for everyone.",
    image: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face",
    performanceCount: 89,
    yearsActive: 5
  },
  {
    id: 6,
    name: "David Kim",
    role: "Comedy Newcomer",
    venue: "Local Comedy Night",
    location: "Bondi",
    rating: 5,
    quote: "I never thought I'd have the courage to try stand-up, but Stand Up Sydney made it feel approachable. The supportive community and easy booking system gave me the confidence to take the leap. Best decision I've made!",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    performanceCount: 8,
    yearsActive: 0.5
  }
];

const SocialProofTestimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');

  // Auto-advance functionality for carousel
  useEffect(() => {
    if (!isAutoPlaying || viewMode === 'grid') return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 7000); // Change testimonial every 7 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, viewMode]);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'
        }`}
      />
    ));
  };

  const TestimonialCard: React.FC<{ testimonial: Testimonial; index?: number }> = ({ testimonial, index }) => (
    <MagicCard
      className="p-6 bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300"
      gradientFrom="#9E7AFF"
      gradientTo="#FE8BBB"
      gradientSize={250}
    >
      <div className="space-y-4">
        {/* Header with quote icon */}
        <div className="flex justify-between items-start">
          <Quote className="w-8 h-8 text-purple-300" />
          <div className="flex space-x-1">
            {renderStars(testimonial.rating)}
          </div>
        </div>

        {/* Testimonial text */}
        <blockquote className="text-purple-100 leading-relaxed italic">
          "{testimonial.quote}"
        </blockquote>

        {/* Author info */}
        <div className="flex items-center space-x-4 pt-4 border-t border-white/10">
          <div className="relative">
            <img
              src={testimonial.image}
              alt={testimonial.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-400/50"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-purple-900" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-white">{testimonial.name}</h4>
              <span className="text-sm text-purple-300">•</span>
              <span className="text-sm text-purple-300">{testimonial.role}</span>
            </div>
            
            <div className="flex items-center space-x-4 mt-1 text-sm text-purple-200">
              <div className="flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span>{testimonial.venue}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{testimonial.performanceCount} shows</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-between items-center pt-2 text-sm">
          <div className="text-purple-200">
            <span className="font-semibold text-white">{testimonial.yearsActive}</span>
            {testimonial.yearsActive === 1 ? ' year' : ' years'} active
          </div>
          <div className="text-purple-200">
            <span className="font-semibold text-white">{testimonial.location}</span>
          </div>
        </div>
      </div>
    </MagicCard>
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header with view toggle */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            What Our Community Says
          </h2>
          <p className="text-purple-100">
            Real testimonials from comedians and venues across Sydney
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'carousel' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('carousel')}
            className={viewMode === 'carousel' 
              ? 'bg-gradient-to-r from-pink-500 to-purple-500' 
              : 'border-white/20 text-white hover:bg-white/10'
            }
          >
            Carousel
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' 
              ? 'bg-gradient-to-r from-pink-500 to-purple-500' 
              : 'border-white/20 text-white hover:bg-white/10'
            }
          >
            Grid
          </Button>
        </div>
      </div>

      {/* Testimonials display */}
      {viewMode === 'carousel' ? (
        <div className="relative">
          <div className="overflow-hidden rounded-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -300 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <TestimonialCard testimonial={testimonials[currentIndex]} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Carousel Controls */}
          <div className="flex justify-between items-center mt-6">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevTestimonial}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextTestimonial}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Dots indicator */}
            <div className="flex space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-white w-6' 
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>

            {/* Current testimonial indicator */}
            <div className="text-sm text-purple-200">
              {currentIndex + 1} of {testimonials.length}
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <TestimonialCard testimonial={testimonial} index={index} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
          <div className="text-2xl font-bold text-white">4.9/5</div>
          <div className="text-sm text-purple-200">Average Rating</div>
        </div>
        <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
          <div className="text-2xl font-bold text-white">500+</div>
          <div className="text-sm text-purple-200">Happy Comedians</div>
        </div>
        <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
          <div className="text-2xl font-bold text-white">2,000+</div>
          <div className="text-sm text-purple-200">Successful Shows</div>
        </div>
      </div>
    </div>
  );
};

export default SocialProofTestimonials;