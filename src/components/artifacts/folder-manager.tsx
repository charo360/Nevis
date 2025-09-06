// src/components/artifacts/folder-manager.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Folder,
  FolderOpen,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Hash,
  Palette,
  Settings
} from 'lucide-react';
import { ArtifactFolder, FolderCreateRequest, FolderUpdateRequest } from '@/lib/types/artifacts';
import { artifactsService } from '@/lib/services/artifacts-service';

interface FolderManagerProps {
  selectedFolderId?: string;
  onFolderSelect?: (folderId: string) => void;
  onFolderChange?: () => void;
  className?: string;
}

const folderColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
];

export function FolderManager({
  selectedFolderId,
  onFolderSelect,
  onFolderChange,
  className
}: FolderManagerProps) {
  const [folders, setFolders] = useState<ArtifactFolder[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ArtifactFolder | null>(null);
  const [newFolderData, setNewFolderData] = useState<FolderCreateRequest>({
    name: '',
    description: '',
    color: folderColors[0],
    type: 'custom'
  });

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = () => {
    const allFolders = artifactsService.getFolders();
    setFolders(allFolders);
  };

  const handleCreateFolder = async () => {
    if (!newFolderData.name.trim()) return;

    try {
      await artifactsService.createFolder(newFolderData);
      loadFolders();
      onFolderChange?.();
      setIsCreateDialogOpen(false);
      setNewFolderData({
        name: '',
        description: '',
        color: folderColors[0],
        type: 'custom'
      });
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleUpdateFolder = async (folderId: string, updates: FolderUpdateRequest) => {
    try {
      await artifactsService.updateFolder(folderId, updates);
      loadFolders();
      onFolderChange?.();
      setEditingFolder(null);
    } catch (error) {
      console.error('Failed to update folder:', error);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder? Artifacts will be moved to References.')) {
      return;
    }

    try {
      await artifactsService.deleteFolder(folderId);
      loadFolders();
      onFolderChange?.();
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  const getArtifactCount = (folderId: string) => {
    return artifactsService.getArtifactsByFolder(folderId).length;
  };

  const getFolderIcon = (folder: ArtifactFolder) => {
    const isSelected = selectedFolderId === folder.id;
    const IconComponent = isSelected ? FolderOpen : Folder;
    return <IconComponent className="h-4 w-4" style={{ color: folder.color }} />;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4" />
            Folder Management
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-3 w-3 mr-1" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="folder-name">Folder Name</Label>
                  <Input
                    id="folder-name"
                    placeholder="Enter folder name"
                    value={newFolderData.name}
                    onChange={(e) => setNewFolderData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="folder-description">Description (Optional)</Label>
                  <Input
                    id="folder-description"
                    placeholder="Enter folder description"
                    value={newFolderData.description}
                    onChange={(e) => setNewFolderData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Folder Color</Label>
                  <div className="flex gap-2">
                    {folderColors.map((color) => (
                      <button
                        key={color}
                        className={`w-6 h-6 rounded-full border-2 ${
                          newFolderData.color === color ? 'border-gray-400' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewFolderData(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateFolder} disabled={!newFolderData.name.trim()}>
                    Create Folder
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
              selectedFolderId === folder.id
                ? 'bg-primary/10 border border-primary/20'
                : 'hover:bg-muted/50'
            }`}
            onClick={() => onFolderSelect?.(folder.id)}
          >
            <div className="flex items-center gap-3 flex-1">
              {getFolderIcon(folder)}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{folder.name}</p>
                  {folder.isDefault && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                </div>
                {folder.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {folder.description}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Hash className="h-3 w-3" />
                {getArtifactCount(folder.id)}
              </div>
              
              {!folder.isDefault && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingFolder(folder)}>
                      <Edit className="h-3 w-3 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDeleteFolder(folder.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}

        {folders.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No folders available</p>
            <p>Create your first folder to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
