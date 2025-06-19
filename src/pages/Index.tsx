
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Mic, Users, Calendar, Star, CheckCircle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              🎭 The Future of Comedy Booking
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
              Connect Comedians with Perfect Gigs
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The ultimate platform where talented comedians meet amazing opportunities. 
              Book shows, build your career, and make audiences laugh.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button asChild size="lg" className="professional-button">
                  <Link to="/dashboard">
                    Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="professional-button">
                    <Link to="/auth">
                      Get Started <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/browse">Browse Events</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Comedy Connect?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We've built the perfect ecosystem for comedians and promoters to connect, 
              collaborate, and create unforgettable comedy experiences.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="professional-card text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>For Comedians</CardTitle>
                <CardDescription>
                  Find gigs, build your reputation, and grow your comedy career
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Discover local comedy opportunities
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Build your performance portfolio
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Get vouched by other comedians
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="professional-card text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>For Promoters</CardTitle>
                <CardDescription>
                  Book verified talent and create amazing comedy events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Access to verified comedians
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Streamlined booking process
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Event management tools
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="professional-card text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Quality Guaranteed</CardTitle>
                <CardDescription>
                  Our vouch system ensures quality performers and events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Peer-reviewed talent verification
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Rating and review system
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Secure payment processing
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Active Comedians</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">200+</div>
              <div className="text-muted-foreground">Monthly Events</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">1000+</div>
              <div className="text-muted-foreground">Successful Bookings</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">4.8⭐</div>
              <div className="text-muted-foreground">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Comedy Career?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of comedians and promoters who are already using Comedy Connect 
            to create amazing comedy experiences.
          </p>
          {!user && (
            <Button asChild size="lg" variant="secondary" className="text-primary">
              <Link to="/auth">
                Start Your Journey <TrendingUp className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
