// src/components/artifacts/folder-view.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Folder,
  FolderOpen,
  MoreVertical,
  Move,
  Hash,
  Grid,
  List,
  Filter
} from 'lucide-react';
import { Artifact, ArtifactFolder } from '@/lib/types/artifacts';
import { artifactsService } from '@/lib/services/artifacts-service';
import { ArtifactCard } from './artifact-card';

interface FolderViewProps {
  selectedFolderId?: string;
  onArtifactSelect?: (artifactId: string) => void;
  selectedArtifacts?: string[];
  viewMode?: 'grid' | 'list';
  className?: string;
}

export function FolderView({
  selectedFolderId,
  onArtifactSelect,
  selectedArtifacts = [],
  viewMode = 'grid',
  className
}: FolderViewProps) {
  const [folder, setFolder] = useState<ArtifactFolder | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [allFolders, setAllFolders] = useState<ArtifactFolder[]>([]);
  const [draggedArtifact, setDraggedArtifact] = useState<string | null>(null);

  useEffect(() => {
    if (selectedFolderId) {
      loadFolderData();
    }
    loadAllFolders();
  }, [selectedFolderId]);

  const loadFolderData = () => {
    if (!selectedFolderId) return;

    const folderData = artifactsService.getFolder(selectedFolderId);
    const folderArtifacts = artifactsService.getArtifactsByFolder(selectedFolderId);
    
    setFolder(folderData);
    setArtifacts(folderArtifacts);
  };

  const loadAllFolders = () => {
    const folders = artifactsService.getFolders();
    setAllFolders(folders);
  };

  const handleMoveArtifact = async (artifactId: string, targetFolderId: string) => {
    try {
      await artifactsService.moveArtifactToFolder(artifactId, targetFolderId);
      loadFolderData();
      loadAllFolders();
    } catch (error) {
      console.error('Failed to move artifact:', error);
    }
  };

  const handleDragStart = (artifactId: string) => {
    setDraggedArtifact(artifactId);
  };

  const handleDragEnd = () => {
    setDraggedArtifact(null);
  };

  const handleDrop = async (targetFolderId: string) => {
    if (draggedArtifact && targetFolderId !== selectedFolderId) {
      await handleMoveArtifact(draggedArtifact, targetFolderId);
    }
    setDraggedArtifact(null);
  };

  const getFolderIcon = (folderId: string) => {
    const targetFolder = allFolders.find(f => f.id === folderId);
    if (!targetFolder) return <Folder className="h-3 w-3" />;
    
    return <Folder className="h-3 w-3" style={{ color: targetFolder.color }} />;
  };

  if (!folder) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a folder to view its contents</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FolderOpen className="h-4 w-4" style={{ color: folder.color }} />
            {folder.name}
            <Badge variant="secondary" className="text-xs">
              <Hash className="h-2 w-2 mr-1" />
              {artifacts.length}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-6 px-2">
              <Filter className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-2">
              {viewMode === 'grid' ? <Grid className="h-3 w-3" /> : <List className="h-3 w-3" />}
            </Button>
          </div>
        </div>
        
        {folder.description && (
          <p className="text-xs text-muted-foreground">{folder.description}</p>
        )}
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-96">
          {artifacts.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>This folder is empty</p>
              <p>Upload artifacts or move them here to get started</p>
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                : "space-y-2"
            }>
              {artifacts.map(artifact => (
                <div
                  key={artifact.id}
                  draggable
                  onDragStart={() => handleDragStart(artifact.id)}
                  onDragEnd={handleDragEnd}
                  className={`${draggedArtifact === artifact.id ? 'opacity-50' : ''}`}
                >
                  <div className="relative group">
                    <ArtifactCard
                      artifact={artifact}
                      selected={selectedArtifacts.includes(artifact.id)}
                      viewMode={viewMode}
                      onSelect={() => onArtifactSelect?.(artifact.id)}
                      onDelete={async (artifact) => {
                        // Handle delete - would need to implement in artifacts service
                      }}
                      onView={(artifact) => {
                      }}
                      onEdit={(artifact) => {
                      }}
                      showUsageStats={true}
                    />
                    
                    {/* Move to folder dropdown */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="sm" className="h-6 w-6 p-0">
                            <Move className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                            Move to folder:
                          </div>
                          {allFolders
                            .filter(f => f.id !== selectedFolderId)
                            .map(targetFolder => (
                              <DropdownMenuItem
                                key={targetFolder.id}
                                onClick={() => handleMoveArtifact(artifact.id, targetFolder.id)}
                              >
                                {getFolderIcon(targetFolder.id)}
                                <span className="ml-2">{targetFolder.name}</span>
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {/* Drop zones for other folders */}
        {draggedArtifact && (
          <div className="mt-4 p-3 border-2 border-dashed border-muted-foreground/25 rounded-md">
            <p className="text-xs text-muted-foreground mb-2">Drop on a folder to move:</p>
            <div className="flex flex-wrap gap-2">
              {allFolders
                .filter(f => f.id !== selectedFolderId)
                .map(targetFolder => (
                  <div
                    key={targetFolder.id}
                    className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md cursor-pointer hover:bg-muted/80 transition-colors"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(targetFolder.id)}
                  >
                    {getFolderIcon(targetFolder.id)}
                    <span className="text-xs">{targetFolder.name}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
