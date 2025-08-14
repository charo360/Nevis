// Data migration dialog component
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, Database, Upload } from 'lucide-react';
import { migrateAllData, needsMigration, clearMigratedData } from '@/lib/firebase/migration';
import { useUserId } from '@/hooks/use-firebase-auth';
import type { MigrationStatus } from '@/lib/firebase/migration';

interface DataMigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function DataMigrationDialog({ 
  open, 
  onOpenChange, 
  onComplete 
}: DataMigrationDialogProps) {
  const userId = useUserId();
  const [migrationState, setMigrationState] = useState<{
    status: 'idle' | 'running' | 'complete' | 'error';
    progress: number;
    currentStep: string;
    result?: MigrationStatus;
  }>({
    status: 'idle',
    progress: 0,
    currentStep: '',
  });

  const runMigration = async () => {
    if (!userId) {
      setMigrationState(prev => ({
        ...prev,
        status: 'error',
        currentStep: 'Authentication required',
      }));
      return;
    }

    setMigrationState({
      status: 'running',
      progress: 0,
      currentStep: 'Starting migration...',
    });

    try {
      // Step 1: Check what needs migration
      setMigrationState(prev => ({
        ...prev,
        progress: 10,
        currentStep: 'Checking local data...',
      }));

      if (!needsMigration()) {
        setMigrationState({
          status: 'complete',
          progress: 100,
          currentStep: 'No data to migrate',
          result: {
            brandProfiles: { migrated: 0, failed: 0 },
            generatedPosts: { migrated: 0, failed: 0 },
            artifacts: { migrated: 0, failed: 0 },
            errors: [],
          },
        });
        return;
      }

      // Step 2: Migrate brand profiles
      setMigrationState(prev => ({
        ...prev,
        progress: 30,
        currentStep: 'Migrating brand profiles...',
      }));

      // Step 3: Migrate generated posts
      setMigrationState(prev => ({
        ...prev,
        progress: 60,
        currentStep: 'Migrating generated posts...',
      }));

      // Step 4: Run full migration
      const result = await migrateAllData(userId);

      setMigrationState(prev => ({
        ...prev,
        progress: 90,
        currentStep: 'Finalizing migration...',
      }));

      // Step 5: Clear localStorage if successful
      if (result.errors.length === 0) {
        clearMigratedData();
      }

      setMigrationState({
        status: result.errors.length === 0 ? 'complete' : 'error',
        progress: 100,
        currentStep: result.errors.length === 0 ? 'Migration completed!' : 'Migration completed with errors',
        result,
      });

      if (result.errors.length === 0 && onComplete) {
        setTimeout(onComplete, 1000);
      }
    } catch (error) {
      setMigrationState({
        status: 'error',
        progress: 0,
        currentStep: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  const handleClose = () => {
    if (migrationState.status !== 'running') {
      onOpenChange(false);
      setMigrationState({
        status: 'idle',
        progress: 0,
        currentStep: '',
      });
    }
  };

  const getMigrationSummary = () => {
    if (!migrationState.result) return null;

    const { brandProfiles, generatedPosts, artifacts } = migrationState.result;
    const totalMigrated = brandProfiles.migrated + generatedPosts.migrated + artifacts.migrated;
    const totalFailed = brandProfiles.failed + generatedPosts.failed + artifacts.failed;

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium">Brand Profiles</div>
            <div className="text-green-600">{brandProfiles.migrated} migrated</div>
            {brandProfiles.failed > 0 && (
              <div className="text-red-600">{brandProfiles.failed} failed</div>
            )}
          </div>
          <div className="text-center">
            <div className="font-medium">Generated Posts</div>
            <div className="text-green-600">{generatedPosts.migrated} migrated</div>
            {generatedPosts.failed > 0 && (
              <div className="text-red-600">{generatedPosts.failed} failed</div>
            )}
          </div>
          <div className="text-center">
            <div className="font-medium">Artifacts</div>
            <div className="text-green-600">{artifacts.migrated} migrated</div>
            {artifacts.failed > 0 && (
              <div className="text-red-600">{artifacts.failed} failed</div>
            )}
          </div>
        </div>

        {totalMigrated > 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Successfully migrated {totalMigrated} items to the cloud database.
            </AlertDescription>
          </Alert>
        )}

        {totalFailed > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {totalFailed} items failed to migrate. Your local data is still available.
            </AlertDescription>
          </Alert>
        )}

        {migrationState.result.errors.length > 0 && (
          <div className="max-h-32 overflow-y-auto">
            <div className="text-sm font-medium mb-2">Migration Errors:</div>
            <div className="space-y-1 text-xs text-red-600">
              {migrationState.result.errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Migration
          </DialogTitle>
          <DialogDescription>
            Migrate your local data to the cloud database for better reliability and sync across devices.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {migrationState.status === 'idle' && (
            <div className="space-y-4">
              <Alert>
                <Upload className="h-4 w-4" />
                <AlertDescription>
                  We found local data that can be migrated to the cloud. This will enable:
                  <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                    <li>Sync across devices</li>
                    <li>Better data reliability</li>
                    <li>Real-time updates</li>
                    <li>Backup and recovery</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={runMigration} className="flex-1">
                  Start Migration
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Skip for Now
                </Button>
              </div>
            </div>
          )}

          {migrationState.status === 'running' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{migrationState.currentStep}</span>
              </div>
              <Progress value={migrationState.progress} />
            </div>
          )}

          {(migrationState.status === 'complete' || migrationState.status === 'error') && (
            <div className="space-y-4">
              {getMigrationSummary()}
              
              <div className="flex gap-2">
                {migrationState.status === 'complete' && (
                  <Button onClick={handleClose} className="flex-1">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Done
                  </Button>
                )}
                {migrationState.status === 'error' && (
                  <>
                    <Button onClick={runMigration} variant="outline">
                      Retry
                    </Button>
                    <Button onClick={handleClose} className="flex-1">
                      Close
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to check if migration is needed and show dialog
export function useMigrationDialog() {
  const [showDialog, setShowDialog] = useState(false);
  const userId = useUserId();

  React.useEffect(() => {
    if (userId && needsMigration()) {
      setShowDialog(true);
    }
  }, [userId]);

  return {
    showDialog,
    setShowDialog,
  };
}
