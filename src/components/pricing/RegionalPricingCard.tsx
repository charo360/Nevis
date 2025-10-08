'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Globe, Zap } from 'lucide-react';

interface RegionalPricingCardProps {
  onSelect: () => void;
}

export function RegionalPricingCard({ onSelect }: RegionalPricingCardProps) {
  const [userRegion, setUserRegion] = useState<string>('detecting...');
  const [price, setPrice] = useState<string>('$14.99');
  const [regionGroup, setRegionGroup] = useState<string>('rest');

  useEffect(() => {
    // Simple client-side region detection
    const detectRegion = async () => {
      try {
        // Try to get country from IP geolocation service
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const countryCode = data.country_code;
        
        if (countryCode) {
          setUserRegion(data.country_name || countryCode);
          
          // Determine pricing based on country
          if (countryCode === 'IN' || isAfricanCountry(countryCode)) {
            setPrice('$9.99');
            setRegionGroup('africa_india');
          } else if (countryCode === 'US' || countryCode === 'CA' || isEuropeanCountry(countryCode)) {
            setPrice('$19.99');
            setRegionGroup('us_canada_europe');
          } else {
            setPrice('$14.99');
            setRegionGroup('rest');
          }
        } else {
          setUserRegion('Global');
          setPrice('$14.99');
          setRegionGroup('rest');
        }
      } catch (error) {
        // Fallback to default pricing
        setUserRegion('Global');
        setPrice('$14.99');
        setRegionGroup('rest');
      }
    };

    detectRegion();
  }, []);

  const isAfricanCountry = (code: string) => {
    const africanCountries = ['DZ','AO','BJ','BW','BF','BI','CM','CV','CF','TD','KM','CG','CD','CI','DJ','EG','GQ','ER','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN','SC','SL','SO','ZA','SS','SD','TZ','TG','TN','UG','ZM','ZW'];
    return africanCountries.includes(code);
  };

  const isEuropeanCountry = (code: string) => {
    const europeanCountries = ['AL','AD','AT','BY','BE','BA','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IE','IT','XK','LV','LI','LT','LU','MT','MD','MC','ME','NL','MK','NO','PL','PT','RO','RU','SM','RS','SK','SI','ES','SE','CH','UA','GB','VA'];
    return europeanCountries.includes(code);
  };

  const getRegionBadge = () => {
    switch (regionGroup) {
      case 'africa_india':
        return <Badge className="bg-green-500">Africa & India</Badge>;
      case 'us_canada_europe':
        return <Badge className="bg-blue-500">US, Canada & Europe</Badge>;
      default:
        return <Badge className="bg-gray-500">Global</Badge>;
    }
  };

  return (
    <Card className="relative transition-all duration-300 hover:shadow-lg ring-2 ring-purple-500 scale-105">
      <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500">
        Regional Special
      </Badge>
      
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <Globe className="w-6 h-6 text-purple-600" />
        </div>
        <CardTitle className="text-xl font-bold">45 Generations</CardTitle>
        <CardDescription className="text-sm">Special regional pricing for your location</CardDescription>
        <div className="mt-2">
          {getRegionBadge()}
        </div>
      </CardHeader>

      <CardContent className="text-center pb-4">
        <div className="mb-4">
          <span className="text-3xl font-bold text-purple-600">{price}</span>
          <span className="text-gray-500 text-sm"> one-time</span>
        </div>
        
        <div className="mb-4">
          <div className="text-2xl font-semibold text-purple-600">45</div>
          <div className="text-sm text-gray-500">generations</div>
          <div className="text-xs text-gray-400 mt-1">
            Detected: {userRegion}
          </div>
        </div>

        {/* Features */}
        <ul className="text-sm text-left space-y-2 mb-4">
          <li className="flex items-start">
            <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>45 AI generations (any model)</span>
          </li>
          <li className="flex items-start">
            <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>HD images without watermark</span>
          </li>
          <li className="flex items-start">
            <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>Regional pricing for your location</span>
          </li>
          <li className="flex items-start">
            <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>Credits never expire</span>
          </li>
        </ul>

        {/* Pricing explanation */}
        <div className="mt-4 p-3 bg-purple-50 rounded-lg">
          <div className="text-sm font-semibold text-purple-800 mb-2">Regional Pricing:</div>
          <div className="text-xs text-purple-700 space-y-1">
            <div>• Africa & India: $9.99</div>
            <div>• US, Canada & Europe: $19.99</div>
            <div>• Rest of World: $14.99</div>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button 
          className="w-full bg-purple-600 hover:bg-purple-700" 
          onClick={onSelect}
        >
          <Zap className="w-4 h-4 mr-2" />
          Buy 45 Generations
        </Button>
      </CardFooter>
    </Card>
  );
}








