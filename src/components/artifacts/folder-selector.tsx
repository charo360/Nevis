// src/components/artifacts/folder-selector.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Folder, 
  Plus,
  FolderOpen,
  Hash
} from 'lucide-react';
import { ArtifactFolder } from '@/lib/types/artifacts';
import { artifactsService } from '@/lib/services/artifacts-service';

interface FolderSelectorProps {
  selectedFolderId?: string;
  onFolderChange: (folderId: string) => void;
  className?: string;
}

export function FolderSelector({ 
  selectedFolderId, 
  onFolderChange, 
  className 
}: FolderSelectorProps) {
  const [folders, setFolders] = useState<ArtifactFolder[]>([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = () => {
    const allFolders = artifactsService.getFolders();
    setFolders(allFolders);
    
    // Set default selection if none selected
    if (!selectedFolderId && allFolders.length > 0) {
      onFolderChange(allFolders[0].id);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setIsCreating(true);
    try {
      const newFolder = await artifactsService.createFolder({
        name: newFolderName.trim(),
        type: 'custom'
      });
      
      setFolders(prev => [...prev, newFolder]);
      onFolderChange(newFolder.id);
      setNewFolderName('');
      setShowCreateFolder(false);
    } catch (error) {
    } finally {
      setIsCreating(false);
    }
  };

  const getFolderIcon = (folder: ArtifactFolder) => {
    if (folder.id === selectedFolderId) {
      return <FolderOpen className="h-4 w-4" style={{ color: folder.color }} />;
    }
    return <Folder className="h-4 w-4" style={{ color: folder.color }} />;
  };

  const getArtifactCount = (folderId: string) => {
    return artifactsService.getArtifactsByFolder(folderId).length;
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Select Folder</Label>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateFolder(!showCreateFolder)}
              className="h-6 px-2"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {showCreateFolder && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-md">
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder();
                  } else if (e.key === 'Escape') {
                    setShowCreateFolder(false);
                    setNewFolderName('');
                  }
                }}
                className="h-8"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim() || isCreating}
                  className="h-6 px-2 text-xs"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCreateFolder(false);
                    setNewFolderName('');
                  }}
                  className="h-6 px-2 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                  selectedFolderId === folder.id
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => onFolderChange(folder.id)}
              >
                <div className="flex items-center gap-2 flex-1">
                  {getFolderIcon(folder)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{folder.name}</p>
                    {folder.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {folder.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Hash className="h-3 w-3" />
                  {getArtifactCount(folder.id)}
                </div>
              </div>
            ))}
          </div>

          {folders.length === 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No folders available. Create one to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
