'use client';

import React, { useState, useEffect } from 'react';
import { artifactsService } from '@/lib/services/artifacts-service';
import { ImageIcon } from 'lucide-react';

interface ThumbnailImageProps {
  artifactId: string;
  alt: string;
  className?: string;
}

export function ThumbnailImage({ artifactId, alt, className = "w-20 h-20 object-cover rounded border" }: ThumbnailImageProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadThumbnail = async () => {
      try {
        setLoading(true);
        setError(false);
        const url = await artifactsService.getArtifactThumbnail(artifactId);
        setThumbnailUrl(url);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadThumbnail();
  }, [artifactId]);

  if (loading) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (error || !thumbnailUrl) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <ImageIcon className="h-6 w-6 text-gray-400" />
      </div>
    );
  }

  return (
    <img 
      src={thumbnailUrl} 
      alt={alt}
      className={className}
    />
  );
}
