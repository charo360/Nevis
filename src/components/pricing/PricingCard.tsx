'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';

interface PricingCardProps {
  id: string;
  name: string;
  price: number;
  credits: number;
  costPerCredit: number;
  icon: React.ReactNode;
  popular?: boolean;
  features: string[];
  bonuses?: string[];
  description: string;
  selected?: boolean;
  onSelect: (planId: string) => void;
}

export function PricingCard({
  id,
  name,
  price,
  credits,
  costPerCredit,
  icon,
  popular = false,
  features,
  bonuses,
  description,
  selected = false,
  onSelect
}: PricingCardProps) {
  return (
    <Card 
      className={`relative transition-all duration-300 hover:shadow-lg ${
        popular ? 'ring-2 ring-blue-500 scale-105' : ''
      } ${selected ? 'ring-2 ring-green-500' : ''}`}
    >
      {popular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
          Most Popular
        </Badge>
      )}
      
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          {icon}
        </div>
        <CardTitle className="text-xl font-bold">{name}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>

      <CardContent className="text-center pb-4">
        <div className="mb-4">
          <span className="text-3xl font-bold">${price}</span>
          {price > 0 && <span className="text-gray-500 text-sm"> one-time</span>}
        </div>
        
        <div className="mb-4">
          <div className="text-2xl font-semibold text-blue-600">{credits}</div>
          <div className="text-sm text-gray-500">credits</div>
          {price > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              ${costPerCredit.toFixed(3)} per credit
            </div>
          )}
        </div>

        {/* Features */}
        <ul className="text-sm text-left space-y-2 mb-4">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Bonuses */}
        {bonuses && bonuses.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-semibold text-blue-800 mb-2">Bonus Features:</div>
            <ul className="text-sm space-y-1">
              {bonuses.map((bonus, index) => (
                <li key={index} className="flex items-start text-blue-700">
                  <Star className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{bonus}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button 
          className="w-full" 
          variant={popular ? "default" : "outline"}
          onClick={() => onSelect(id)}
          disabled={selected}
        >
          {selected ? 'Selected' : 
           price === 0 ? 'Get Started Free' : 'Buy Credits'}
        </Button>
      </CardFooter>
    </Card>
  );
}
