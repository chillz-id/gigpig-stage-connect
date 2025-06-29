
import React from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Drama, Calendar, Users, Trophy, ArrowRight } from 'lucide-react';
import ResponsiveContainer from '@/components/ResponsiveContainer';

const Index = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Calendar,
      title: 'Discover Shows',
      description: 'Find comedy events across Sydney and apply to perform',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <section className="py-12 sm:py-20">
          <ResponsiveContainer>
            <div className="text-center text-white max-w-4xl mx-auto">
              <div className="mb-6 sm:mb-8">
                <Drama className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 text-yellow-400" />
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6">
                  Sydney's Premier Comedy Community
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl text-purple-100 leading-relaxed px-4">
                  Connect with venues, discover shows, and advance your comedy career in Australia's comedy capital.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
                {user ? (
                  <>
                    <Link to="/browse">
                      <Button 
                        size="lg" 
                        className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white w-full sm:w-auto min-h-[48px] text-base"
                      >
                        Browse Shows
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                    <Link to="/dashboard">
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="border-white text-white hover:bg-white hover:text-purple-900 w-full sm:w-auto min-h-[48px] text-base"
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
                        className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white w-full sm:w-auto min-h-[48px] text-base"
                      >
                        Join the Community
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                    <Link to="/browse">
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="border-white text-white hover:bg-white hover:text-purple-900 w-full sm:w-auto min-h-[48px] text-base"
                      >
                        Browse Shows
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </ResponsiveContainer>
        </section>

        {/* Features Section */}
        <section className="py-12 sm:py-20 bg-white/5 backdrop-blur-sm">
          <ResponsiveContainer>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-purple-100 text-base sm:text-lg max-w-2xl mx-auto px-4">
                Our platform provides all the tools comedians need to find gigs, connect with venues, and grow their careers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-colors">
                    <CardContent className="p-6 sm:p-8 text-center">
                      <Icon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-yellow-400" />
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-purple-100 text-sm sm:text-base leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ResponsiveContainer>
        </section>

        {/* Call to Action Section */}
        <section className="py-12 sm:py-20">
          <ResponsiveContainer>
            <Card className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 backdrop-blur-sm border-white/20">
              <CardContent className="p-8 sm:p-12 text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
                  Ready to Take the Stage?
                </h2>
                <p className="text-purple-100 text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto">
                  Join hundreds of comedians who are already using Stand Up Sydney to find gigs, 
                  connect with venues, and build their comedy careers.
                </p>
                
                {!user && (
                  <Link to="/auth">
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white min-h-[48px] text-base"
                    >
                      Get Started Today
                      <ArrowRight className="ml-2 w-4 h-4" />
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
