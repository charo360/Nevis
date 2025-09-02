'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Edit,
  Trash2,
  Building2,
  Globe,
  MapPin,
  Star,
  MoreVertical,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarInset } from '@/components/ui/sidebar';
import { useUnifiedBrand } from '@/contexts/unified-brand-context';
import { toast } from '@/hooks/use-toast';

export default function BrandsPage() {
  const router = useRouter();
  const {
    brands,
    currentBrand,
    loading,
    selectBrand,
    deleteProfile: deleteBrand,
  } = useUnifiedBrand();

  const hasBrands = brands.length > 0;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const handleCreateNew = () => {
    router.push('/brand-profile?mode=create');
  };

  const handleEditBrand = (brand: any) => {
    selectBrand(brand);
    router.push(`/brand-profile?mode=edit&id=${brand.id}`);
  };

  const handleViewBrand = (brand: any) => {
    selectBrand(brand);
    router.push('/dashboard');
  };

  const handleDeleteClick = (brand: any) => {
    setBrandToDelete(brand);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!brandToDelete) return;

    try {
      setDeleting(true);
      await deleteBrand(brandToDelete.id);

      toast({
        title: "Brand deleted",
        description: `${brandToDelete.businessName || brandToDelete.name || 'Brand'} has been deleted successfully.`,
      });

      setDeleteDialogOpen(false);
      setBrandToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete brand. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getBrandInitials = (brand: any) => {
    const name = brand.businessName || brand.name || 'Brand';
    return name
      ?.split(' ')
      .map((word: string) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'BR';
  };

  if (loading) {
    return (
      <SidebarInset>
        <div className="flex-1 space-y-6 p-6">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset>
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900">Brand Profiles</h1>
            <p className="text-gray-600">
              Manage your brand profiles and switch between them easily.
            </p>
          </div>
          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Brand
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{brands.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Brand</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentBrand ? '1' : '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                {currentBrand?.businessName || currentBrand?.name || 'None selected'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateNew}
                className="w-full"
              >
                <Plus className="h-3 w-3 mr-1" />
                New Brand
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Brand Cards */}
        {hasBrands ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand: any) => {
              const isActive = currentBrand && brand.id === (currentBrand as any).id;
              const brandInitials = getBrandInitials(brand);

              return (
                <Card key={brand.id} className={`relative ${isActive ? 'ring-2 ring-primary' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={brand.logoDataUrl} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {brandInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <CardTitle className="text-lg leading-none">
                            {brand.businessName || brand.name || 'Unnamed Brand'}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {brand.businessType || 'General Business'}
                          </CardDescription>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewBrand(brand)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View & Select
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditBrand(brand)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(brand)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {isActive && (
                      <Badge variant="default" className="w-fit">
                        <Star className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      {brand.location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{brand.location}</span>
                        </div>
                      )}
                      {brand.websiteUrl && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Globe className="h-3 w-3" />
                          <span className="truncate">{brand.websiteUrl}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant={isActive ? "secondary" : "default"}
                        size="sm"
                        onClick={() => handleViewBrand(brand)}
                        className="flex-1"
                      >
                        {isActive ? 'Current' : 'Select'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditBrand(brand)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="mb-2">No Brand Profiles Yet</CardTitle>
              <CardDescription className="mb-4">
                Create your first brand profile to get started with content generation.
              </CardDescription>
              <Button onClick={handleCreateNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Brand
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Brand Profile</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{brandToDelete?.businessName}"?
                This action cannot be undone and will remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SidebarInset>
  );
}
