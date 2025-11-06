'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type {
  BrandDocument,
  DocumentType,
  DocumentFileFormat,
  DocumentProcessingStatus
} from '@/types/documents';

interface DocumentUploadZoneProps {
  brandProfileId: string;
  existingDocuments?: BrandDocument[];
  onDocumentsChange?: (documents: BrandDocument[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
}

export function DocumentUploadZone({
  brandProfileId,
  existingDocuments = [],
  onDocumentsChange,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
}: DocumentUploadZoneProps) {
  const [documents, setDocuments] = useState<BrandDocument[]>(existingDocuments);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);

    // Check if adding these files would exceed the limit
    if (documents.length + acceptedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} documents allowed. You currently have ${documents.length} documents.`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedDocs: BrandDocument[] = [];

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];

        // Update progress
        setUploadProgress(((i + 1) / acceptedFiles.length) * 100);

        // Create FormData for upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('brandProfileId', brandProfileId);
        formData.append('documentType', detectDocumentType(file.name));

        // Upload to API
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const result = await response.json();

        if (result.success && result.document) {
          uploadedDocs.push(result.document);
        }
      }

      // Update documents list
      const updatedDocuments = [...documents, ...uploadedDocs];
      setDocuments(updatedDocuments);

      if (onDocumentsChange) {
        onDocumentsChange(updatedDocuments);
      }

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload documents');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [documents, brandProfileId, maxFiles, onDocumentsChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: maxFileSize,
    disabled: uploading || documents.length >= maxFiles,
  });

  const handleDelete = async (documentId: string, documentPath: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}?path=${encodeURIComponent(documentPath)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      const updatedDocuments = documents.filter(doc => doc.id !== documentId);
      setDocuments(updatedDocuments);

      if (onDocumentsChange) {
        onDocumentsChange(updatedDocuments);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusIcon = (status: DocumentProcessingStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Loader2 className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: DocumentProcessingStatus) => {
    switch (status) {
      case 'completed':
        return 'Processed';
      case 'processing':
        return 'Processing...';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isDragActive
          ? 'border-blue-400 bg-blue-50'
          : uploading || documents.length >= maxFiles
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-gray-400'
          }`}
      >
        <input {...getInputProps()} />

        <div className="space-y-3">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            {uploading ? (
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            ) : (
              <Upload className="w-6 h-6 text-gray-600" />
            )}
          </div>

          <div>
            <p className="text-base font-medium text-gray-900">
              {uploading
                ? 'Uploading documents...'
                : isDragActive
                  ? 'Drop documents here'
                  : documents.length >= maxFiles
                    ? `Maximum ${maxFiles} documents reached`
                    : 'Upload Business Documents'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {!uploading && documents.length < maxFiles && (
                <>Drag & drop or click to browse</>
              )}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              PDF, PPT, PPTX, Excel, CSV, Images • Max {formatFileSize(maxFileSize)} per file
            </p>
            <p className="text-xs text-gray-500">
              {documents.length} / {maxFiles} documents uploaded
            </p>
          </div>
        </div>

        {uploading && (
          <div className="mt-4">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-gray-600 mt-2">{Math.round(uploadProgress)}% complete</p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Uploaded Documents</h4>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.filename}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatFileSize(doc.fileSize)}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500 uppercase">
                        {doc.fileFormat}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(doc.processingStatus)}
                        <span className="text-xs text-gray-500">
                          {getStatusText(doc.processingStatus)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(doc.url, '_blank')}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id, doc.path)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Helper function to detect document type from filename
 */
function detectDocumentType(filename: string): DocumentType {
  const lower = filename.toLowerCase();

  if (lower.includes('pitch') || lower.includes('deck')) return 'pitch-deck';
  if (lower.includes('price') || lower.includes('pricing') || lower.includes('rate')) return 'pricing-sheet';
  if (lower.includes('catalog') || lower.includes('product')) return 'product-catalog';
  if (lower.includes('service') || lower.includes('brochure')) return 'service-brochure';
  if (lower.includes('brand') || lower.includes('guideline')) return 'brand-guidelines';
  if (lower.includes('marketing') || lower.includes('promo')) return 'marketing-materials';
  if (lower.includes('business') || lower.includes('plan')) return 'business-plan';
  if (lower.includes('case') || lower.includes('study')) return 'case-study';

  return 'other';
}

