'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageIcon, X } from 'lucide-react';

interface ProductImage {
  id: string;
  name: string;
  file: File;
  preview: string;
}

interface ProductImageSelectorProps {
  productImages: ProductImage[];
  selectedProductId: string | null;
  onSelectProduct: (productId: string | null) => void;
  onClearSelection: () => void;
}

export default function ProductImageSelector({
  productImages,
  selectedProductId,
  onSelectProduct,
  onClearSelection
}: ProductImageSelectorProps) {
  if (!productImages || productImages.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Select Product Image
        </CardTitle>
        <p className="text-sm text-gray-600">
          Choose a product image to use in your design
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Product Display */}
        {selectedProductId && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <img
                src={productImages.find(p => p.id === selectedProductId)?.preview}
                alt="Selected product"
                className="w-12 h-12 object-cover rounded"
              />
              <div>
                <p className="font-medium text-sm">
                  {productImages.find(p => p.id === selectedProductId)?.name}
                </p>
                <p className="text-xs text-gray-500">Selected for design</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelection}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Product Images Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {productImages.map((product) => (
            <div
              key={product.id}
              className={`relative group cursor-pointer rounded-lg border-2 transition-all ${
                selectedProductId === product.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelectProduct(product.id)}
            >
              <div className="aspect-square relative overflow-hidden rounded-lg">
                <img
                  src={product.preview}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {selectedProductId === product.id && (
                  <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium truncate">{product.name}</p>
                <p className="text-xs text-gray-500">
                  {(product.file.size / 1024 / 1024).toFixed(1)}MB
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Clear Selection Button */}
        {selectedProductId && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelection}
              className="text-gray-600 hover:text-gray-800"
            >
              Clear Selection
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}