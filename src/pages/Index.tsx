
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, MapPin, Star, DollarSign, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
      {/* Header */}
      <header className="bg-black/10 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">GP</span>
            </div>
            <h1 className="text-2xl font-bold text-white">GigPig</h1>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">
              Sign In
            </Button>
            <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold text-white mb-6">
          The Platform That Connects
          <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent block">
            Comedy Professionals
          </span>
        </h2>
        <p className="text-xl text-purple-100 mb-12 max-w-3xl mx-auto">
          Whether you're a comedian looking for your next gig or a promoter booking talent, 
          GigPig makes comedy bookings simple, transparent, and professional.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl">For Comedians</CardTitle>
              <CardDescription className="text-purple-100">
                Find paid gigs, build your network, and grow your comedy career
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-left">
                <li className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span>Browse available spots</span>
                </li>
                <li className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span>Access paid opportunities</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span>Get verified status</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl">For Promoters</CardTitle>
              <CardDescription className="text-purple-100">
                Manage events, book talent, and grow your comedy business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-left">
                <li className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>Create & manage events</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-green-400" />
                  <span>Build comedian groups</span>
                </li>
                <li className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-red-400" />
                  <span>Reach local talent</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-lg px-8 py-3">
          Start Your Comedy Journey
        </Button>
      </section>

      {/* Features Section */}
      <section className="bg-black/20 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-white text-center mb-12">
            Everything You Need to Succeed
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Smart Scheduling</h4>
              <p className="text-purple-100">
                Recurring events, template management, and automated booking
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Automated Payments</h4>
              <p className="text-purple-100">
                Invoice generation, settlement tracking, and secure payments
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Professional Tools</h4>
              <p className="text-purple-100">
                Portfolio management, verification system, and industry networking
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-white text-center mb-12">
          Simple, Transparent Pricing
        </h3>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Comedian Free</CardTitle>
              <CardDescription className="text-purple-100">Perfect for starting out</CardDescription>
              <div className="text-3xl font-bold">$0<span className="text-lg font-normal">/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>✓ Basic profile</li>
                <li>✓ Apply for free spots</li>
                <li>✓ Browse public events</li>
                <li>✗ Paid opportunities</li>
                <li>✗ Verified status</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 backdrop-blur-sm border-pink-400/30 text-white ring-2 ring-pink-400">
            <CardHeader>
              <CardTitle className="text-2xl">Comedian Verified</CardTitle>
              <CardDescription className="text-purple-100">Unlock paid opportunities</CardDescription>
              <div className="text-3xl font-bold">$20<span className="text-lg font-normal"> AUD/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>✓ Everything in Free</li>
                <li>✓ Access paid spots</li>
                <li>✓ Promoter contact details</li>
                <li>✓ Verified badge</li>
                <li>✓ Priority applications</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Promoter Pro</CardTitle>
              <CardDescription className="text-purple-100">Full event management</CardDescription>
              <div className="text-3xl font-bold">$20<span className="text-lg font-normal"> AUD/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>✓ Unlimited events</li>
                <li>✓ Comedian groups</li>
                <li>✓ Payment management</li>
                <li>✓ Analytics & insights</li>
                <li>✓ Priority support</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-sm border-t border-white/10 py-8">
        <div className="container mx-auto px-4 text-center text-purple-100">
          <p>&copy; 2024 GigPig. Making comedy connections easier.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
