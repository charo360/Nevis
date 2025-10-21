/**
 * User Migration API Endpoint
 * Admin-only endpoint for migrating existing users to the payment system
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserMigrationService } from '@/lib/migration/user-migration';

// Simple admin authentication (replace with proper admin auth)
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'your-admin-secret-key';

export async function POST(request: NextRequest) {
  try {
    // Admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
      return NextResponse.json({
        success: false,
        error: 'Admin authentication required'
      }, { status: 401 });
    }

    const { action, userId, bonusCredits } = await request.json();

    switch (action) {
      case 'migrate_all':
        const migrationResult = await UserMigrationService.migrateExistingUsers();
        
        return NextResponse.json({
          success: migrationResult.success,
          message: `Migration completed: ${migrationResult.usersProcessed} users processed`,
          usersProcessed: migrationResult.usersProcessed,
          errors: migrationResult.errors
        });

      case 'grant_bonus':
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'userId required for bonus grant'
          }, { status: 400 });
        }

        const bonusResult = await UserMigrationService.grantMigrationBonus(
          userId, 
          bonusCredits || 20
        );

        return NextResponse.json({
          success: bonusResult,
          message: bonusResult 
            ? `Bonus credits granted to user ${userId}`
            : `Failed to grant bonus credits to user ${userId}`
        });

      case 'status':
        const status = await UserMigrationService.getMigrationStatus();
        
        return NextResponse.json({
          success: true,
          status: {
            totalUsers: status.totalUsers,
            migratedUsers: status.migratedUsers,
            pendingUsers: status.pendingUsers,
            migrationProgress: status.totalUsers > 0 
              ? Math.round((status.migratedUsers / status.totalUsers) * 100)
              : 0
          }
        });

      case 'rollback':
        const rollbackResult = await UserMigrationService.rollbackMigration();
        
        return NextResponse.json({
          success: rollbackResult,
          message: rollbackResult 
            ? 'Migration rollback completed'
            : 'Migration rollback failed'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: migrate_all, grant_bonus, status, rollback'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Migration API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Migration operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Admin authentication for GET requests too
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
      return NextResponse.json({
        success: false,
        error: 'Admin authentication required'
      }, { status: 401 });
    }

    // Get migration status
    const status = await UserMigrationService.getMigrationStatus();
    
    return NextResponse.json({
      success: true,
      migration: {
        totalUsers: status.totalUsers,
        migratedUsers: status.migratedUsers,
        pendingUsers: status.pendingUsers,
        migrationProgress: status.totalUsers > 0 
          ? Math.round((status.migratedUsers / status.totalUsers) * 100)
          : 0
      },
      endpoints: {
        migrate_all: 'POST /api/admin/migrate-users { "action": "migrate_all" }',
        grant_bonus: 'POST /api/admin/migrate-users { "action": "grant_bonus", "userId": "user-id", "bonusCredits": 20 }',
        status: 'POST /api/admin/migrate-users { "action": "status" }',
        rollback: 'POST /api/admin/migrate-users { "action": "rollback" }'
      }
    });

  } catch (error) {
    console.error('❌ Migration status error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get migration status'
    }, { status: 500 });
  }
}
