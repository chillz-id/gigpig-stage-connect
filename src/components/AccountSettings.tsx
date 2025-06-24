
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Star, Crown, Zap, Check } from 'lucide-react';

export const AccountSettings: React.FC = () => {
  const upgradeOptions = [
    {
      title: "Comedian Pro",
      price: "$19.99/month",
      icon: Star,
      features: [
        "Verified comedian badge",
        "Priority in search results",
        "Advanced analytics",
        "Custom profile themes",
        "Direct messaging",
        "Priority support"
      ],
      color: "from-blue-500 to-purple-500"
    },
    {
      title: "Promoter Pro",
      price: "$24.99/month", 
      icon: Crown,
      features: [
        "Unlimited event creation",
        "Advanced event management",
        "Comedian recommendations",
        "Bulk messaging tools",
        "Analytics dashboard",
        "Priority support"
      ],
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Bundle & Save",
      price: "$39.99/month",
      originalPrice: "$44.98",
      icon: Zap,
      features: [
        "All Comedian Pro features",
        "All Promoter Pro features", 
        "Cross-platform benefits",
        "Exclusive networking events",
        "Advanced insights",
        "24/7 premium support"
      ],
      color: "from-yellow-500 to-orange-500",
      badge: "Best Value"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Upgrade Options - moved to top */}
      <Card className="professional-card">
        <CardHeader>
          <CardTitle>Upgrade Your Account</CardTitle>
          <CardDescription>
            Unlock premium features and grow your comedy career
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upgradeOptions.map((option, index) => {
              const IconComponent = option.icon;
              return (
                <div key={index} className="relative border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  {option.badge && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500">
                      {option.badge}
                    </Badge>
                  )}
                  
                  <div className="text-center mb-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${option.color} flex items-center justify-center mx-auto mb-3`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold">{option.title}</h3>
                    <div className="mt-2">
                      {option.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through mr-2">
                          {option.originalPrice}
                        </span>
                      )}
                      <span className="text-2xl font-bold">{option.price}</span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {option.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`w-full bg-gradient-to-r ${option.color} hover:opacity-90 transition-opacity`}
                  >
                    Upgrade Now
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="professional-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Account Settings
          </CardTitle>
          <CardDescription>
            Manage your account preferences and privacy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications about new opportunities</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Get text alerts for urgent updates</p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Profile Visibility</Label>
                <p className="text-sm text-muted-foreground">Make your profile discoverable to promoters</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Apply to Suitable Shows</Label>
                <p className="text-sm text-muted-foreground">Automatically apply to shows matching your criteria</p>
              </div>
              <Switch />
            </div>
          </div>

          <Button className="professional-button">Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
};
