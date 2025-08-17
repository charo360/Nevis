// src/components/artifacts/upload-zone.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  X,
  FileImage,
  FileText,
  File,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  ArtifactCategory,
  ArtifactUploadType,
  ArtifactUsageType,
  ArtifactTextOverlay
} from '@/lib/types/artifacts';
import { artifactsService } from '@/lib/services/artifacts-service';
import { brandScopedArtifactsService } from '@/lib/services/brand-scoped-artifacts-service';
// TODO: Re-enable enhanced components once they're properly set up
// import { TypeSelector } from './type-selector';
// import { UsageCategorySelector } from './usage-category-selector';
// import { FolderSelector } from './folder-selector';
// import { TextOverlayEditor } from './text-overlay-editor';

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface UploadZoneProps {
  onUploadComplete?: (artifactIds: string[]) => void;
  onUploadError?: (error: Error) => void;
  category?: ArtifactCategory;
  maxFiles?: number;
  className?: string;
  // New enhanced props
  showTypeSelector?: boolean;
  showUsageSelector?: boolean;
  showFolderSelector?: boolean;
  showTextOverlay?: boolean;
  defaultUploadType?: ArtifactUploadType;
  defaultUsageType?: ArtifactUsageType;
  defaultFolderId?: string;
  customName?: string; // Custom name for uploaded files
  instructions?: string; // Usage instructions for exact-use artifacts
  useBrandScopedService?: boolean; // Use brand-scoped service instead of regular service
}

export function UploadZone({
  onUploadComplete,
  onUploadError,
  category,
  maxFiles = 10,
  className,
  showTypeSelector = true,
  showUsageSelector = true,
  showFolderSelector = true,
  showTextOverlay = true,
  defaultUploadType = 'image',
  defaultUsageType = 'reference',
  defaultFolderId,
  customName,
  instructions,
  useBrandScopedService = false
}: UploadZoneProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // New enhanced state
  const [selectedUploadType, setSelectedUploadType] = useState<ArtifactUploadType>(defaultUploadType);
  const [selectedUsageType, setSelectedUsageType] = useState<ArtifactUsageType>(defaultUsageType);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(defaultFolderId || '');
  const [textOverlay, setTextOverlay] = useState<ArtifactTextOverlay>({});

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      file,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      progress: 0
    }));

    setUploadFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
  }, [maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    maxFiles,
    disabled: isUploading
  });

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    const uploadedArtifactIds: string[] = [];

    try {
      for (const uploadFile of uploadFiles) {
        // Update status to uploading
        setUploadFiles(prev => prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, status: 'uploading', progress: 0 }
            : f
        ));

        try {
          // Simulate upload progress
          for (let progress = 0; progress <= 100; progress += 20) {
            setUploadFiles(prev => prev.map(f =>
              f.id === uploadFile.id
                ? { ...f, progress }
                : f
            ));
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          // Upload the file with enhanced configuration
          const service = useBrandScopedService ? brandScopedArtifactsService : artifactsService;
          const artifacts = await service.uploadArtifacts([uploadFile.file], category, {
            uploadType: selectedUploadType,
            usageType: selectedUsageType,
            folderId: selectedFolderId,
            textOverlay: isExactUse && Object.keys(textOverlay).length > 0 ? textOverlay : undefined,
            isActive: false, // Default to inactive, user can activate later
            customName: customName, // Use custom name if provided
            instructions: instructions // Use instructions if provided
          });

          // Update status to success
          setUploadFiles(prev => prev.map(f =>
            f.id === uploadFile.id
              ? { ...f, status: 'success', progress: 100 }
              : f
          ));

          uploadedArtifactIds.push(...artifacts.map(a => a.id));

        } catch (error) {
          // Update status to error
          setUploadFiles(prev => prev.map(f =>
            f.id === uploadFile.id
              ? { ...f, status: 'error', error: error.message }
              : f
          ));
        }
      }

      // Call completion callback
      if (uploadedArtifactIds.length > 0 && onUploadComplete) {
        onUploadComplete(uploadedArtifactIds);
      }

      // Clear successful uploads after a delay
      setTimeout(() => {
        setUploadFiles(prev => prev.filter(f => f.status === 'error'));
      }, 2000);

    } catch (error) {
      if (onUploadError) {
        onUploadError(error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage className="h-4 w-4" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isExactUse = selectedUsageType === 'exact-use';
  const requiresTextOverlay = isExactUse && showTextOverlay;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* TODO: Re-enable enhanced upload configuration once components are set up */}
      {/* Enhanced Upload Configuration */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {showTypeSelector && (
          <TypeSelector
            selectedType={selectedUploadType}
            onTypeChange={setSelectedUploadType}
          />
        )}

        {showUsageSelector && (
          <UsageCategorySelector
            selectedUsage={selectedUsageType}
            onUsageChange={setSelectedUsageType}
          />
        )}
      </div>

      {showFolderSelector && (
        <FolderSelector
          selectedFolderId={selectedFolderId}
          onFolderChange={setSelectedFolderId}
        />
      )}

      {requiresTextOverlay && (
        <TextOverlayEditor
          textOverlay={textOverlay}
          onTextOverlayChange={setTextOverlay}
          required={true}
        />
      )} */}

      {/* Drop Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
              }
              ${isUploading ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />

            {isDragActive ? (
              <div>
                <p className="text-lg font-medium">Drop files here</p>
                <p className="text-sm text-muted-foreground">Release to upload</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports images (JPG, PNG, GIF, WebP, SVG), PDFs, and text files
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="secondary">Max {maxFiles} files</Badge>
                  <Badge variant="secondary">10MB per file</Badge>
                  {category && (
                    <Badge variant="outline">Category: {category}</Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {uploadFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Files to Upload ({uploadFiles.length})</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadFiles([])}
                  disabled={isUploading}
                >
                  Clear All
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || uploadFiles.length === 0}
                  size="sm"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {uploadFiles.length} Files
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {uploadFiles.map(uploadFile => (
                <div key={uploadFile.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getFileIcon(uploadFile.file)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {uploadFile.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(uploadFile.file.size)}
                      </p>
                    </div>
                  </div>

                  {/* Progress/Status */}
                  <div className="flex items-center gap-2">
                    {uploadFile.status === 'uploading' && (
                      <div className="w-24">
                        <Progress value={uploadFile.progress} className="h-2" />
                      </div>
                    )}

                    {uploadFile.status === 'error' && uploadFile.error && (
                      <p className="text-xs text-red-600 max-w-32 truncate" title={uploadFile.error}>
                        {uploadFile.error}
                      </p>
                    )}

                    {getStatusIcon(uploadFile.status)}

                    {uploadFile.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadFile.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
