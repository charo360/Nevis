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
import { useBrandContext } from '@/contexts/brand-context';
import { useRouter } from 'next/navigation';

export function BrandSelector() {
  const router = useRouter();
  const {
    currentBrand,
    brands,
    loading,
    selectBrand,
    hasBrands,
    brandCount
  } = useBrandContext();

  const [isOpen, setIsOpen] = useState(false);

  const handleBrandSelect = (brand: any) => {
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

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
        <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!hasBrands) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCreateNew}
        className="w-full justify-start gap-2 px-2 py-1.5 h-auto text-left"
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10">
          <Plus className="h-3 w-3 text-primary" />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium">Create Brand</span>
          <span className="text-xs text-muted-foreground">Get started</span>
        </div>
      </Button>
    );
  }

  const currentBrandName = currentBrand?.businessName || currentBrand?.name || 'Brand';
  const currentBrandInitials = currentBrandName
    ?.split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'BR';

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between gap-2 px-2 py-1.5 h-auto text-left hover:bg-accent"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-6 w-6">
              <AvatarImage src={currentBrand?.logoDataUrl} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {currentBrandInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-medium truncate max-w-[120px]">
                {currentBrand?.businessName || currentBrand?.name || 'Select Brand'}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">
                  {brandCount} brand{brandCount !== 1 ? 's' : ''}
                </span>
                {currentBrand && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    Active
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Brand Profiles ({brandCount})
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Scrollable brand list - shows first 4 brands, rest are scrollable */}
        <div className="max-h-[280px] overflow-y-auto">
          {brands.map((brand: any) => {
            const isSelected = currentBrand && brand.id === (currentBrand as any).id;
            const brandName = brand.businessName || brand.name || 'Brand';
            const brandInitials = brandName
              ?.split(' ')
              .map((word: string) => word[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || 'BR';

            return (
              <DropdownMenuItem
                key={brand.id}
                onClick={() => handleBrandSelect(brand)}
                className="flex items-center gap-2 p-2 cursor-pointer"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={brand.logoDataUrl} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {brandInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="text-sm font-medium truncate max-w-[140px]">
                    {brand.businessName || brand.name || 'Unnamed Brand'}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                    {brand.businessType || 'General Business'}
                  </span>
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleCreateNew} className="flex items-center gap-2 p-2 cursor-pointer">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10">
            <Plus className="h-3 w-3 text-primary" />
          </div>
          <span className="text-sm font-medium">Create New Brand</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleManageBrands} className="flex items-center gap-2 p-2 cursor-pointer">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Manage Brands</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
