
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Drama, Calendar, Users, Trophy, ArrowRight, Star, Mic, MapPin } from 'lucide-react';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import HeroVideoShowreel from '@/components/HeroVideoShowreel';

const Index = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Calendar,
      title: 'Discover Shows',
      description: 'Find comedy events across Sydney and apply to perform at top venues',
    },
    {
      icon: Users,
      title: 'Connect with Comedians',
      description: 'Network with fellow performers and build your comedy community',
    },
    {
      icon: Trophy,
      title: 'Grow Your Career',
      description: 'Track your performances and build your comedy portfolio',
    },
  ];

  const benefits = [
    {
      icon: Mic,
      title: 'Live Performance Opportunities',
      description: 'Access to Sydney\'s best comedy venues and regular open mic nights',
    },
    {
      icon: Star,
      title: 'Professional Development',
      description: 'Connect with industry professionals and seasoned comedians',
    },
    {
      icon: MapPin,
      title: 'Sydney-Wide Network',
      description: 'From inner-city pubs to major theaters - find your perfect stage',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <main>
        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-r from-red-900/20 to-gray-900">
          <div className="relative z-10 text-center text-white max-w-5xl mx-auto px-4">
            <div className="mb-8">
              <Drama className="w-20 h-20 mx-auto mb-6 text-yellow-400 drop-shadow-lg" />
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 drop-shadow-lg">
                Sydney's Premier Comedy Community
              </h1>
              <p className="text-xl sm:text-2xl md:text-3xl text-gray-100 leading-relaxed mb-8 drop-shadow-md">
                Connect with venues, discover shows, and advance your comedy career in Australia's comedy capital.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              {user ? (
                <>
                  <Link to="/browse">
                    <Button 
                      size="lg" 
                      className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto min-h-[56px] text-lg px-8 shadow-xl"
                    >
                      Browse Shows
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="border-2 border-white text-white hover:bg-white hover:text-gray-900 w-full sm:w-auto min-h-[56px] text-lg px-8 shadow-xl"
                    >
                      My Dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auth">
                    <Button 
                      size="lg" 
                      className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto min-h-[56px] text-lg px-8 shadow-xl"
                      data-testid="signup-button"
                    >
                      Sign Up Now
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link to="/browse">
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="border-2 border-white text-white hover:bg-white hover:text-gray-900 w-full sm:w-auto min-h-[56px] text-lg px-8 shadow-xl"
                    >
                      Browse Shows
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-800">
          <ResponsiveContainer>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
                Everything You Need to Succeed
              </h2>
              <p className="text-gray-300 text-lg sm:text-xl max-w-3xl mx-auto px-4">
                Our platform provides all the tools comedians need to find gigs, connect with venues, and grow their careers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="bg-gray-700 border-gray-600 hover:bg-gray-600 transition-colors">
                    <CardContent className="p-8 text-center">
                      <Icon className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                      <h3 className="text-xl font-semibold text-white mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-gray-300 text-base leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ResponsiveContainer>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-gray-900">
          <ResponsiveContainer>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
                Why Choose Stand Up Sydney?
              </h2>
              <p className="text-gray-300 text-lg sm:text-xl max-w-3xl mx-auto px-4">
                Join Sydney's most vibrant comedy community and take your career to the next level.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <Card key={index} className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition-colors">
                    <CardContent className="p-8 text-center">
                      <Icon className="w-12 h-12 mx-auto mb-4 text-red-400" />
                      <h3 className="text-xl font-semibold text-white mb-3">
                        {benefit.title}
                      </h3>
                      <p className="text-gray-300 text-base leading-relaxed">
                        {benefit.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ResponsiveContainer>
        </section>

        {/* Call to Action Section */}
        <section className="py-20 bg-gradient-to-r from-red-900/20 to-gray-900">
          <ResponsiveContainer>
            <Card className="bg-gray-800 border-gray-700 shadow-2xl">
              <CardContent className="p-12 text-center">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
                  Ready to Take the Stage?
                </h2>
                <p className="text-gray-300 text-lg sm:text-xl mb-8 max-w-3xl mx-auto">
                  Join hundreds of comedians who are already using Stand Up Sydney to find gigs, 
                  connect with venues, and build their comedy careers.
                </p>
                
                {!user && (
                  <Link to="/auth">
                    <Button 
                      size="lg" 
                      className="bg-red-600 hover:bg-red-700 text-white min-h-[56px] text-lg px-8 shadow-xl"
                    >
                      Get Started Today
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </ResponsiveContainer>
        </section>
      </main>
    </div>
  );
};

export default Index;
