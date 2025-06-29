
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Mic, Users, Calendar, Star, CheckCircle, TrendingUp, MapPin, Clock, Laugh } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 bg-yellow-500/20 text-yellow-300 border-yellow-500/30 animate-pulse">
              🎭 Sydney's Premier Comedy Platform
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
              Stand Up
              <span className="block text-yellow-400">Sydney</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              Where Sydney's funniest comedians meet their next stage. 
              Discover shows, book talent, and be part of the city's thriving comedy scene.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button asChild size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg px-8 py-4">
                  <Link to="/dashboard">
                    Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg px-8 py-4">
                    <Link to="/auth">
                      Join the Scene <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-4">
                    <Link to="/browse">Explore Shows</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 text-6xl animate-bounce">🎤</div>
        <div className="absolute top-40 right-20 text-4xl animate-pulse">😂</div>
        <div className="absolute bottom-20 left-20 text-5xl animate-bounce" style={{animationDelay: '1s'}}>🎭</div>
      </section>

      {/* Sydney-specific features */}
      <section className="py-16 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Why Sydney Chooses Us</h2>
            <p className="text-white/80 max-w-2xl mx-auto text-lg">
              From Newtown to North Sydney, we're connecting the harbour city's 
              comedy community like never before.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-8 h-8 text-yellow-400" />
                </div>
                <CardTitle className="text-xl">For Sydney Comedians</CardTitle>
                <CardDescription className="text-white/70">
                  Find your next gig across Sydney's vibrant comedy venues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Inner West to Eastern Suburbs coverage</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Build your Sydney comedy reputation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Connect with local comedy communities</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-yellow-400" />
                </div>
                <CardTitle className="text-xl">For Sydney Venues</CardTitle>
                <CardDescription className="text-white/70">
                  Book quality comedians for your Sydney establishment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Vetted local and touring talent</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Easy booking and event management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Build your venue's comedy reputation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Laugh className="w-8 h-8 text-yellow-400" />
                </div>
                <CardTitle className="text-xl">For Sydney Audiences</CardTitle>
                <CardDescription className="text-white/70">
                  Discover the best comedy shows happening in your city
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Shows across all Sydney suburbs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>From intimate rooms to major venues</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Support local Sydney comedy</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Sydney Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Sydney's Comedy Numbers</h2>
            <p className="text-white/70">Making Sydney laugh, one show at a time</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">150+</div>
              <div className="text-white/80 text-sm md:text-base">Sydney Comedians</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">80+</div>
              <div className="text-white/80 text-sm md:text-base">Monthly Shows</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">25+</div>
              <div className="text-white/80 text-sm md:text-base">Sydney Venues</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">5⭐</div>
              <div className="text-white/80 text-sm md:text-base">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Sydney Areas Section */}
      <section className="py-16 bg-black/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Comedy Across Sydney</h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              From the Inner West's alternative scene to the CBD's premium venues, 
              we cover all of Sydney's comedy hotspots.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { area: "Inner West", venues: "Newtown, Enmore, Marrickville", icon: "🎭" },
              { area: "CBD & City", venues: "Opera Bar, Comedy Store", icon: "🏙️" },
              { area: "Eastern Suburbs", venues: "Bondi, Paddington, Coogee", icon: "🏖️" },
              { area: "North Shore", venues: "North Sydney, Chatswood", icon: "🌉" }
            ].map((location, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 text-center hover:bg-white/15 transition-all duration-300">
                <div className="text-4xl mb-3">{location.icon}</div>
                <h3 className="text-white font-bold text-lg mb-2">{location.area}</h3>
                <p className="text-white/70 text-sm">{location.venues}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-yellow-500 to-orange-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">Ready to Join Sydney's Comedy Scene?</h2>
          <p className="text-xl mb-8 text-black/80 max-w-2xl mx-auto">
            Whether you're a comedian looking for your next gig or a venue wanting to host the best comedy in Sydney, 
            we're here to connect you.
          </p>
          {!user && (
            <Button asChild size="lg" className="bg-black hover:bg-gray-800 text-white text-lg px-8 py-4">
              <Link to="/auth">
                Get Started Today <TrendingUp className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
