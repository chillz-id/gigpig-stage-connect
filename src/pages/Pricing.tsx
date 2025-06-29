
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, Zap, Crown, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Pricing = () => {
  const { hasRole } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">User Roles & Access</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Different user roles provide access to various features of our platform.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Contact an administrator to upgrade your role
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {[
            {
              name: 'Guest',
              description: 'Basic access to public content',
              icon: Star,
              features: [
                'View public events',
                'Browse comedian profiles',
                'View venue information',
                'Basic search functionality'
              ],
              buttonText: 'Default Access',
              isCurrentPlan: !hasRole('member') && !hasRole('comedian') && !hasRole('promoter'),
              popular: false,
            },
            {
              name: 'Member',
              description: 'Enhanced access for comedy fans',
              icon: Users,
              features: [
                'Everything in Guest',
                'Create user profile',
                'Save favorite events',
                'Purchase tickets',
                'Join community discussions',
                'Access member-only content'
              ],
              buttonText: hasRole('member') ? 'Current Role' : 'Contact Admin',
              isCurrentPlan: hasRole('member'),
              popular: true,
            },
            {
              name: 'Comedian',
              description: 'For professional comedians',
              icon: Zap,
              features: [
                'Everything in Member',
                'Create comedian profile',
                'Apply to events',
                'Access promoter marketplace',
                'Manage performance calendar',
                'Receive booking requests',
                'Track performance metrics'
              ],
              buttonText: hasRole('comedian') ? 'Current Role' : 'Contact Admin',
              isCurrentPlan: hasRole('comedian'),
              popular: false,
            },
            {
              name: 'Promoter',
              description: 'For event promoters and venues',
              icon: Crown,
              features: [
                'Everything in Member',
                'Create and manage events',
                'Access comedian marketplace',
                'Manage venue information',
                'Handle ticket sales',
                'Assign co-promoters',
                'Advanced analytics',
                'Revenue management'
              ],
              buttonText: hasRole('promoter') ? 'Current Role' : 'Contact Admin',
              isCurrentPlan: hasRole('promoter'),
              popular: false,
            }
          ].map((role) => {
            const Icon = role.icon;
            return (
              <Card
                key={role.name}
                className={`relative bg-card border-border text-foreground ${
                  role.popular ? 'ring-2 ring-primary' : ''
                }`}
              >
                {role.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Most Common
                  </div>
                )}

                <CardHeader className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-primary rounded-full flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-2xl text-foreground">{role.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">{role.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {role.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className={`w-full ${
                      role.isCurrentPlan
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : role.popular
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                    disabled={role.isCurrentPlan}
                  >
                    {role.buttonText}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">How do I upgrade my role?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Contact an administrator to request a role upgrade. You'll need to provide relevant information about your experience and requirements.</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">What is a Co-Promoter?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Co-Promoters are assigned by main Promoters to help manage specific events. They get access to ticket sales data and can assist with event management tasks.</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Can I have multiple roles?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Users can have multiple roles if needed. For example, someone can be both a Comedian and a Member, accessing features from both roles.</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">What are the Marketplaces?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-muted-foreground">
                  <div>
                    <h4 className="font-semibold text-foreground">Comedian Marketplace (Promoter Access)</h4>
                    <p>Promoters can browse and contact comedians for their events.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Promoter Marketplace (Comedian Access)</h4>
                    <p>Comedians can browse and contact promoters for performance opportunities.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
