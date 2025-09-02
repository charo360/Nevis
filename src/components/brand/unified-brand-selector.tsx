'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ChevronDown,
  Plus,
  Building2,
  Check,
  Settings,
  Sparkles
} from 'lucide-react';
import { useUnifiedBrand } from '@/contexts/unified-brand-context';
import { useRouter } from 'next/navigation';
import type { CompleteBrandProfile } from '@/components/cbrand/cbrand-wizard';

export function UnifiedBrandSelector() {
  const router = useRouter();
  const {
    currentBrand,
    brands,
    loading,
    selectBrand,
  } = useUnifiedBrand();

  const [isOpen, setIsOpen] = useState(false);

  const handleBrandSelect = (brand: CompleteBrandProfile) => {
    selectBrand(brand);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    router.push('/brand-profile?mode=create');
  };

  const handleManageBrands = () => {
    setIsOpen(false);
    router.push('/brands');
  };

  // Get brand initials for avatar
  const getBrandInitials = (brand: CompleteBrandProfile): string => {
    const name = brand.businessName || brand.name || 'Brand';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get brand display name
  const getBrandDisplayName = (brand: CompleteBrandProfile): string => {
    return brand.businessName || brand.name || 'Unnamed Brand';
  };

  // Get brand type/category
  const getBrandType = (brand: CompleteBrandProfile): string => {
    return brand.businessType || 'Business';
  };

  // Loading state
  if (loading && brands.length === 0) {
    return (
      <Button variant="outline" disabled className="min-w-[200px]">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
        Loading brands...
      </Button>
    );
  }

  // No brands state
  if (!loading && brands.length === 0) {
    return (
      <Button 
        onClick={handleCreateNew}
        className="min-w-[200px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create First Brand
      </Button>
    );
  }

  // No current brand selected
  if (!currentBrand) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="min-w-[200px]">
            <Building2 className="w-4 h-4 mr-2" />
            Select Brand
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Brand Profiles ({brands.length})
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {brands.map((brand) => (
            <DropdownMenuItem
              key={brand.id}
              onClick={() => handleBrandSelect(brand)}
              className="flex items-center gap-3 p-3 cursor-pointer"
            >
              <Avatar className="w-8 h-8">
                {brand.logoDataUrl ? (
                  <AvatarImage src={brand.logoDataUrl} alt={getBrandDisplayName(brand)} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                    {getBrandInitials(brand)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">{getBrandDisplayName(brand)}</div>
                <div className="text-sm text-gray-500">{getBrandType(brand)}</div>
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCreateNew} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <span>Create New Brand</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleManageBrands} className="flex items-center gap-2">
            <Settings className="w-4 h-4 ml-2" />
            <span>Manage Brands</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Current brand selected
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="min-w-[200px] border-2 border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100"
        >
          <div className="flex items-center gap-2 flex-1">
            <Avatar className="w-6 h-6">
              {currentBrand.logoDataUrl ? (
                <AvatarImage src={currentBrand.logoDataUrl} alt={getBrandDisplayName(currentBrand)} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                  {getBrandInitials(currentBrand)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 text-left">
              <div className="font-medium text-sm">{getBrandDisplayName(currentBrand)}</div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>{brands.length} brands</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs px-1 py-0">
                  Active
                </Badge>
              </div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Brand Profiles ({brands.length})
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {brands.map((brand) => {
          const isSelected = currentBrand.id === brand.id;
          return (
            <DropdownMenuItem
              key={brand.id}
              onClick={() => handleBrandSelect(brand)}
              className="flex items-center gap-3 p-3 cursor-pointer"
            >
              <Avatar className="w-8 h-8">
                {brand.logoDataUrl ? (
                  <AvatarImage src={brand.logoDataUrl} alt={getBrandDisplayName(brand)} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                    {getBrandInitials(brand)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">{getBrandDisplayName(brand)}</div>
                <div className="text-sm text-gray-500">{getBrandType(brand)}</div>
              </div>
              {isSelected && (
                <Check className="w-4 h-4 text-green-600" />
              )}
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCreateNew} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          <span>Create New Brand</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleManageBrands} className="flex items-center gap-2">
          <Settings className="w-4 h-4 ml-2" />
          <span>Manage Brands</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Export as default for easy replacement
export default UnifiedBrandSelector;
